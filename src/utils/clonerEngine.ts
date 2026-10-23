import {
  AssetItem,
  CloneConfig,
  CloneResult,
  CloningPhase,
  LogEntry,
  LogLevel,
  ParsedWaybackUrl,
} from '../types';
import { cleanCssContent, cleanWaybackHtml } from './cleaner';
import { discoverAssets, rewriteHtmlWithAssets } from './assetManager';
import { createSiteZip, ClonedPageData } from './zipPackager';

export interface ClonerCallbacks {
  onPhaseChange: (phase: CloningPhase) => void;
  onProgress: (percent: number, stepText: string) => void;
  onLog: (entry: LogEntry) => void;
  onAssetUpdate: (assets: AssetItem[]) => void;
  onStatsUpdate: (stats: { downloadedBytes: number; completedCount: number; failedCount: number }) => void;
}

/**
 * Fetch a URL via backend proxy to bypass CORS
 */
async function fetchViaProxy(
  url: string,
  asBinary: boolean,
  signal?: AbortSignal
): Promise<{ data: string | ArrayBuffer; contentType: string; size: number }> {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

  const response = await fetch(proxyUrl, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (asBinary) {
    const arrayBuffer = await response.arrayBuffer();
    return { data: arrayBuffer, contentType, size: arrayBuffer.byteLength };
  } else {
    const text = await response.text();
    return { data: text, contentType, size: new Blob([text]).size };
  }
}

/**
 * Helper to extract title from HTML
 */
function extractPageTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : 'Archived Page';
}

/**
 * Main Cloning Execution Engine (supports single or multiple URLs)
 */
export async function executeCloneSite(
  targets: ParsedWaybackUrl | ParsedWaybackUrl[],
  config: CloneConfig,
  callbacks: ClonerCallbacks,
  signal: AbortSignal
): Promise<CloneResult> {
  const targetList = Array.isArray(targets) ? targets : [targets];
  const primaryTarget = targetList[0];

  let logCounter = 1;
  const emitLog = (level: LogLevel, message: string, details?: string) => {
    callbacks.onLog({
      id: `log-${Date.now()}-${logCounter++}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details,
    });
  };

  let downloadedBytes = 0;
  let completedCount = 0;
  let failedCount = 0;

  const updateStats = () => {
    callbacks.onStatsUpdate({
      downloadedBytes,
      completedCount,
      failedCount,
    });
  };

  try {
    // 1. Parsing and validation
    callbacks.onPhaseChange('parsing');
    callbacks.onProgress(5, `Processing ${targetList.length} target URL(s)...`);
    emitLog('info', `Queued ${targetList.length} snapshot page(s) for extraction`);
    emitLog('info', `Primary domain: ${primaryTarget.domain} (Snapshot: ${primaryTarget.formattedDate})`);

    const clonedPages: ClonedPageData[] = [];
    const allDiscoveredAssets: AssetItem[] = [];
    const seenAssetKeys = new Set<string>();
    const downloadedAssets = new Map<string, ArrayBuffer | string>();

    // 2. Fetch and clean HTML for each queued page
    for (let pageIdx = 0; pageIdx < targetList.length; pageIdx++) {
      if (signal.aborted) throw new Error('Aborted by user');

      const currentTarget = targetList[pageIdx];
      const pageNum = pageIdx + 1;
      const progressBase = 10 + Math.floor((pageIdx / targetList.length) * 30);

      callbacks.onPhaseChange('fetching_html');
      callbacks.onProgress(
        progressBase,
        `Fetching HTML [${pageNum}/${targetList.length}]: ${currentTarget.cleanRawUrl}...`
      );
      emitLog('fetch', `[Page ${pageNum}] Downloading raw 'id_' HTML: ${currentTarget.cleanRawUrl}`);

      const htmlFetch = await fetchViaProxy(currentTarget.cleanRawUrl, false, signal);
      const rawHtml = htmlFetch.data as string;
      downloadedBytes += htmlFetch.size;
      updateStats();

      emitLog(
        'success',
        `[Page ${pageNum}] Raw HTML received (${(htmlFetch.size / 1024).toFixed(1)} KB)`
      );

      // Clean HTML
      callbacks.onPhaseChange('cleaning');
      emitLog('clean', `[Page ${pageNum}] Stripping archive toolbar, wombat scripts, and comment headers...`);

      const { cleanedHtml, stats: cleanStats } = cleanWaybackHtml(
        rawHtml,
        currentTarget.originalUrl
      );

      if (cleanStats.toolbarRemoved) {
        emitLog('clean', `[Page ${pageNum}] Removed toolbar comment block & container markers`);
      }
      if (cleanStats.scriptsRemovedCount > 0) {
        emitLog('clean', `[Page ${pageNum}] Removed ${cleanStats.scriptsRemovedCount} Wayback injected script tags`);
      }
      if (cleanStats.stylesRemovedCount > 0) {
        emitLog('clean', `[Page ${pageNum}] Removed ${cleanStats.stylesRemovedCount} banner stylesheets`);
      }
      if (cleanStats.unwrappedUrlsCount > 0) {
        emitLog('clean', `[Page ${pageNum}] Unwrapped ${cleanStats.unwrappedUrlsCount} embedded archive.org URLs`);
      }

      // Discover assets for this page
      callbacks.onPhaseChange('discovering_assets');
      emitLog('asset', `[Page ${pageNum}] Discovering linked external stylesheets, scripts, images, and fonts...`);

      const { assets: pageAssets, rawToLocalMap } = discoverAssets(
        cleanedHtml,
        currentTarget.originalUrl,
        currentTarget.timestamp,
        config
      );

      // Register new unique assets
      for (const asset of pageAssets) {
        if (!seenAssetKeys.has(asset.resolvedWaybackUrl)) {
          seenAssetKeys.add(asset.resolvedWaybackUrl);
          allDiscoveredAssets.push(asset);
        }
      }
      callbacks.onAssetUpdate([...allDiscoveredAssets]);

      // Rewrite this page's HTML with offline local relative paths
      const rewrittenHtml = rewriteHtmlWithAssets(cleanedHtml, rawToLocalMap, config);
      const pageFilename = pageIdx === 0 ? 'index.html' : `page_${pageIdx + 1}_${currentTarget.slug}.html`;
      const title = extractPageTitle(rewrittenHtml);

      clonedPages.push({
        filename: pageFilename,
        title,
        html: rewrittenHtml,
        parsedUrl: currentTarget,
      });
    }

    emitLog(
      'info',
      `Discovered total of ${allDiscoveredAssets.length} unique assets across ${clonedPages.length} page(s)`
    );

    // 3. Download All Discovered Assets
    callbacks.onPhaseChange('fetching_assets');
    const totalAssets = allDiscoveredAssets.length;

    if (totalAssets > 0) {
      emitLog('fetch', `Starting asset download pool (concurrency: ${config.concurrency})...`);

      let assetIndex = 0;
      const runningPromises: Promise<void>[] = [];

      const downloadAsset = async (asset: AssetItem): Promise<void> => {
        if (signal.aborted) return;

        asset.status = 'downloading';
        callbacks.onAssetUpdate([...allDiscoveredAssets]);

        try {
          const isBinary = asset.type !== 'css' && asset.type !== 'js';
          const res = await fetchViaProxy(asset.resolvedWaybackUrl, isBinary, signal);

          let finalData: string | ArrayBuffer = res.data;
          // If CSS, clean archive prefixes inside CSS
          if (asset.type === 'css' && typeof finalData === 'string') {
            finalData = cleanCssContent(finalData);
          }

          downloadedAssets.set(asset.localPath, finalData);
          asset.status = 'completed';
          asset.sizeBytes = res.size;
          asset.mimeType = res.contentType;

          downloadedBytes += res.size;
          completedCount++;
          updateStats();

          emitLog('asset', `✓ [${asset.type.toUpperCase()}] ${asset.localPath} (${(res.size / 1024).toFixed(1)} KB)`);
        } catch (err: any) {
          asset.status = 'failed';
          asset.error = err?.message || 'Download failed';
          failedCount++;
          updateStats();
          emitLog('warn', `✗ Failed [${asset.type}]: ${asset.originalUrl} (${err?.message || 'Error'})`);
        } finally {
          callbacks.onAssetUpdate([...allDiscoveredAssets]);
          const currentDone = completedCount + failedCount;
          const pct = Math.floor(45 + (currentDone / totalAssets) * 45);
          callbacks.onProgress(
            pct,
            `Downloading assets: ${currentDone} of ${totalAssets} (${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB)`
          );
        }
      };

      // Concurrent queue with gentle 50ms stagger
      const pool = async () => {
        while (assetIndex < allDiscoveredAssets.length && !signal.aborted) {
          const currentAsset = allDiscoveredAssets[assetIndex++];
          const p = downloadAsset(currentAsset).then(() => {
            const idx = runningPromises.indexOf(p);
            if (idx !== -1) runningPromises.splice(idx, 1);
          });
          runningPromises.push(p);

          if (runningPromises.length >= config.concurrency) {
            await Promise.race(runningPromises);
          }
          // Brief pause to prevent micro-bursts to archive.org
          await new Promise((r) => setTimeout(r, 60));
        }
        await Promise.all(runningPromises);
      };

      await pool();
    }

    if (signal.aborted) throw new Error('Aborted by user');

    // 4. Packaging into .ZIP
    callbacks.onPhaseChange('packaging');
    callbacks.onProgress(92, 'Packaging files into compressed .ZIP via JSZip...');
    emitLog('info', 'Compressing clean HTML files and downloaded assets into .ZIP...');

    const { zipBlob, fileList } = await createSiteZip(
      primaryTarget,
      clonedPages,
      downloadedAssets,
      allDiscoveredAssets,
      (percent, currentFile) => {
        const packagingPct = Math.min(99, Math.floor(92 + (percent / 100) * 7));
        callbacks.onProgress(packagingPct, `Packaging: ${currentFile}`);
      }
    );

    const zipFileName = `${primaryTarget.slug}.zip`;
    callbacks.onPhaseChange('completed');
    callbacks.onProgress(100, `Done! Archive created: ${zipFileName} (${(zipBlob.size / (1024 * 1024)).toFixed(2)} MB)`);

    emitLog(
      'success',
      `✓ ZIP generated successfully: ${zipFileName} (${(zipBlob.size / 1024).toFixed(1)} KB, ${fileList.length} files bundled)`
    );

    return {
      zipBlob,
      zipFileName,
      zipSizeBytes: zipBlob.size,
      totalAssets: allDiscoveredAssets.length,
      successfulAssets: completedCount,
      failedAssets: failedCount,
      cleanedHtml: clonedPages[0]?.html || '',
      siteSlug: primaryTarget.slug,
      fileList,
    };
  } catch (error: any) {
    if (signal.aborted || error?.message === 'Aborted by user') {
      callbacks.onPhaseChange('aborted');
      emitLog('warn', 'Cloning operation was cancelled by the user.');
      throw new Error('Cloning cancelled');
    } else {
      callbacks.onPhaseChange('error');
      emitLog('error', `Cloning failed: ${error?.message || error}`);
      throw error;
    }
  }
}
