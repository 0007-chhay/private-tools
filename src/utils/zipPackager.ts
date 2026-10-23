import JSZip from 'jszip';
import { AssetItem, ParsedWaybackUrl } from '../types';

export interface PackagingProgressCallback {
  (percentage: number, currentFile: string): void;
}

export interface ClonedPageData {
  filename: string;
  title: string;
  html: string;
  parsedUrl: ParsedWaybackUrl;
}

/**
 * Creates a downloadable ZIP archive of the cloned website(s)
 */
export async function createSiteZip(
  primaryParsedUrl: ParsedWaybackUrl,
  pages: ClonedPageData[],
  downloadedAssets: Map<string, ArrayBuffer | string>,
  assetItems: AssetItem[],
  onProgress?: PackagingProgressCallback
): Promise<{ zipBlob: Blob; fileList: { path: string; size: number }[] }> {
  const zip = new JSZip();
  const fileList: { path: string; size: number }[] = [];

  // 1. Add HTML pages
  for (const page of pages) {
    zip.file(page.filename, page.html);
    fileList.push({ path: page.filename, size: new Blob([page.html]).size });
  }

  // If multiple pages, also generate a clean navigation portal 'index_portal.html' if needed
  if (pages.length > 1) {
    const portalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Archive - Cloned Pages Directory</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { font-size: 20px; font-weight: 600; color: #f59e0b; margin-bottom: 8px; }
    p { color: #a1a1aa; font-size: 14px; margin-bottom: 24px; }
    .page-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .page-card { background: #18181b; border: 1px solid #27272a; padding: 16px; border-radius: 8px; text-decoration: none; color: inherit; display: block; transition: all 0.2s; }
    .page-card:hover { border-color: #f59e0b; background: #27272a; }
    .page-title { font-weight: 600; font-size: 15px; color: #fff; margin-bottom: 4px; }
    .page-meta { font-family: monospace; font-size: 12px; color: #71717a; }
  </style>
</head>
<body>
  <h1>Wayback Cloner - Multi-Page Archive Directory</h1>
  <p>This offline package contains ${pages.length} cloned pages with all stylesheets, images, and scripts bundled locally.</p>
  <div class="page-list">
    ${pages
      .map(
        (p) => `
    <a href="${p.filename}" class="page-card">
      <div class="page-title">${p.title || p.filename}</div>
      <div class="page-meta">${p.parsedUrl.domain} · Snapshot: ${p.parsedUrl.formattedDate}</div>
    </a>`
      )
      .join('')}
  </div>
</body>
</html>`;
    zip.file('pages_directory.html', portalHtml);
    fileList.push({ path: 'pages_directory.html', size: portalHtml.length });
  }

  // 2. Add documentation & offline metadata
  const readmeContent = `=====================================================
WAYBACK MACHINE SITE CLONER - OFFLINE ARCHIVE
=====================================================
Domain:          ${primaryParsedUrl.domain}
Original URL:    ${primaryParsedUrl.originalUrl}
Capture Date:    ${primaryParsedUrl.formattedDate}
Timestamp:       ${primaryParsedUrl.timestamp}
Pages Cloned:    ${pages.length}
Generated At:    ${new Date().toISOString()}

INSTRUCTIONS:
1. Double click "${pages[0]?.filename || 'index.html'}" to open the cloned site in any modern browser.
2. All linked assets (CSS, JS, images, fonts) have been bundled locally
   inside the "assets/" folder.
3. All Wayback Machine toolbars, wombat scripts, and analytics have been
   fully stripped for clean offline viewing.
=====================================================
`;
  zip.file('README.txt', readmeContent);
  fileList.push({ path: 'README.txt', size: readmeContent.length });

  // 3. Add site-info.json
  const metaJson = JSON.stringify(
    {
      domain: primaryParsedUrl.domain,
      primaryUrl: primaryParsedUrl.originalUrl,
      timestamp: primaryParsedUrl.timestamp,
      formattedDate: primaryParsedUrl.formattedDate,
      clonedAt: new Date().toISOString(),
      pages: pages.map((p) => ({
        filename: p.filename,
        title: p.title,
        originalUrl: p.parsedUrl.originalUrl,
        timestamp: p.parsedUrl.timestamp,
      })),
      assetsCount: downloadedAssets.size,
    },
    null,
    2
  );
  zip.file('site-info.json', metaJson);
  fileList.push({ path: 'site-info.json', size: metaJson.length });

  // 4. Add all downloaded assets
  for (const asset of assetItems) {
    if (downloadedAssets.has(asset.localPath)) {
      const data = downloadedAssets.get(asset.localPath)!;
      zip.file(asset.localPath, data);

      let size = 0;
      if (typeof data === 'string') {
        size = new Blob([data]).size;
      } else if (data instanceof ArrayBuffer) {
        size = data.byteLength;
      }
      fileList.push({ path: asset.localPath, size });
    }
  }

  // 5. Generate ZIP Blob with Deflate compression
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(metadata.percent, metadata.currentFile || 'Packaging files...');
      }
    }
  );

  return { zipBlob, fileList };
}

/**
 * Triggers a file download in the browser
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 15000);
}
