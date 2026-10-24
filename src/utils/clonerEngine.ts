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

    // 2. Fetch and process each queued page or direct asset
    for (let pageIdx = 0; pageIdx < targetList.length; pageIdx++) {
      if (signal.aborted) throw new Error('Aborted by user');

      const currentTarget = targetList[pageIdx];
      const pageNum = pageIdx + 1;
      const progressBase = 10 + Math.floor((pageIdx / targetList.length) * 30);

      // Check if target is a direct image / media asset (e.g. .jpg, .png, im_ flag)
      if (currentTarget.isDirectAsset) {
        callbacks.onPhaseChange('fetching_assets');
        const fileName = currentTarget.fileName || `asset_${pageNum}.jpg`;
        callbacks.onProgress(
          progressBase,
          `Downloading media asset [${pageNum}/${targetList.length}]: ${fileName}...`
        );
        emitLog('fetch', `[Asset ${pageNum}] Downloading raw media/image: ${currentTarget.cleanRawUrl}`);

        const assetFetch = await fetchViaProxy(currentTarget.cleanRawUrl, true, signal);
        const binaryData = assetFetch.data as ArrayBuffer;
        downloadedBytes += assetFetch.size;
        completedCount++;
        updateStats();

        // Save under root with original filename, and also under images/
        downloadedAssets.set(fileName, binaryData);
        downloadedAssets.set(`images/${fileName}`, binaryData);

        const directItem: AssetItem = {
          id: `direct-asset-${pageIdx + 1}`,
          originalUrl: currentTarget.originalUrl,
          resolvedWaybackUrl: currentTarget.cleanRawUrl,
          localPath: fileName,
          type: currentTarget.assetType || 'image',
          status: 'completed',
          sizeBytes: assetFetch.size,
          mimeType: assetFetch.contentType,
        };

        allDiscoveredAssets.push(directItem);
        callbacks.onAssetUpdate([...allDiscoveredAssets]);

        emitLog(
          'success',
          `[Asset ${pageNum}] Downloaded ${fileName} (${(assetFetch.size / 1024).toFixed(1)} KB) [${assetFetch.contentType || 'image'}]`
        );

        continue;
      }

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

    // If only direct assets/images were queued, generate a clean responsive image gallery viewer index.html
    if (clonedPages.length === 0 && allDiscoveredAssets.length > 0) {
      const imagesHtml = allDiscoveredAssets
        .map(
          (a) => `
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
          <h3 style="color:#e4e4e7;margin-bottom:12px;font-family:monospace;font-size:13px;word-break:break-all;">${a.localPath}</h3>
          ${
            a.type === 'image'
              ? `<img src="${a.localPath}" alt="${a.localPath}" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.6);" />`
              : `<p style="color:#a1a1aa;font-size:12px;">File Size: ${(a.sizeBytes / 1024).toFixed(1)} KB</p>`
          }
          <div style="margin-top:14px;">
            <a href="${a.localPath}" download="${a.localPath}" style="display:inline-block;padding:8px 16px;background:#f59e0b;color:#09090b;text-decoration:none;border-radius:6px;font-weight:bold;font-size:12px;">Download File</a>
          </div>
        </div>
      `
        )
        .join('\n');

      const viewerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wayback Media Gallery - ${primaryTarget.domain}</title>
  <style>
    body { background: #09090b; color: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; padding: 24px; margin: 0; }
    .container { max-width: 960px; margin: 0 auto; }
    h1 { font-size: 22px; color: #fbbf24; margin-bottom: 6px; }
    p { font-size: 13px; color: #a1a1aa; margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Archive Media Vault: ${primaryTarget.domain}</h1>
    <p>Downloaded ${allDiscoveredAssets.length} asset(s) directly from Wayback Machine snapshot (${primaryTarget.formattedDate}).</p>
    ${imagesHtml}
  </div>
</body>
</html>`;

      clonedPages.push({
        filename: 'index.html',
        title: `Archive Media Vault - ${primaryTarget.domain}`,
        html: viewerHtml,
        parsedUrl: primaryTarget,
      });
    }

    emitLog(
      'info',
      `Processed total of ${allDiscoveredAssets.length} asset(s) across ${clonedPages.length} package page(s)`
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
