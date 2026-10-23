import { AssetItem, AssetType, CloneConfig } from '../types';

/**
 * Determine asset type based on tag, attribute, or file extension
 */
export function determineAssetType(url: string, tagName: string): AssetType {
  const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();

  if (tagName === 'script' || cleanUrl.endsWith('.js') || cleanUrl.endsWith('.mjs')) {
    return 'js';
  }
  if (
    cleanUrl.endsWith('.css') ||
    cleanUrl.includes('/css/') ||
    cleanUrl.includes('stylesheet')
  ) {
    return 'css';
  }
  if (
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.gif') ||
    cleanUrl.endsWith('.webp') ||
    cleanUrl.endsWith('.svg') ||
    cleanUrl.endsWith('.ico') ||
    cleanUrl.endsWith('.bmp') ||
    cleanUrl.endsWith('.avif') ||
    tagName === 'img'
  ) {
    return 'image';
  }
  if (
    cleanUrl.endsWith('.woff') ||
    cleanUrl.endsWith('.woff2') ||
    cleanUrl.endsWith('.ttf') ||
    cleanUrl.endsWith('.otf') ||
    cleanUrl.endsWith('.eot')
  ) {
    return 'font';
  }
  if (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.mp3') ||
    tagName === 'video' ||
    tagName === 'audio'
  ) {
    return 'media';
  }

  return 'other';
}

/**
 * Clean and resolve an asset URL relative to original site base URL
 */
export function resolveAssetUrl(rawUrl: string, baseUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return null;
  }

  try {
    // If it's already an absolute URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    // Protocol-relative URL
    if (trimmed.startsWith('//')) {
      const baseProto = baseUrl.startsWith('https') ? 'https:' : 'http:';
      return `${baseProto}${trimmed}`;
    }
    // Relative URL
    const resolved = new URL(trimmed, baseUrl);
    return resolved.href;
  } catch {
    return null;
  }
}

/**
 * Generate a clean local ZIP file path for an asset
 */
export function generateLocalPath(
  resolvedUrl: string,
  assetType: AssetType,
  existingPaths: Set<string>
): string {
  try {
    const urlObj = new URL(resolvedUrl);
    let pathname = urlObj.pathname;
    let filename = pathname.split('/').filter(Boolean).pop() || 'asset';

    // Remove query params or trailing special chars
    filename = filename.split('?')[0].split('#')[0];

    // Clean up filename
    let cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!cleanName || cleanName === '_') {
      cleanName = `asset_${Date.now()}`;
    }

    // Ensure correct extension
    const ext = cleanName.includes('.') ? cleanName.split('.').pop()?.toLowerCase() : '';
    if (!ext) {
      if (assetType === 'css') cleanName += '.css';
      else if (assetType === 'js') cleanName += '.js';
      else if (assetType === 'image') cleanName += '.png';
      else if (assetType === 'font') cleanName += '.woff2';
    }

    let folder = 'assets';
    if (assetType === 'css') folder = 'assets/css';
    else if (assetType === 'js') folder = 'assets/js';
    else if (assetType === 'image') folder = 'assets/images';
    else if (assetType === 'font') folder = 'assets/fonts';
    else if (assetType === 'media') folder = 'assets/media';

    let localPath = `${folder}/${cleanName}`;
    let counter = 1;
    while (existingPaths.has(localPath)) {
      const parts = cleanName.split('.');
      if (parts.length > 1) {
        const base = parts.slice(0, -1).join('.');
        const extPart = parts[parts.length - 1];
        localPath = `${folder}/${base}_${counter}.${extPart}`;
      } else {
        localPath = `${folder}/${cleanName}_${counter}`;
      }
      counter++;
    }

    existingPaths.add(localPath);
    return localPath;
  } catch {
    const fallbackPath = `assets/misc/${assetType}_${Date.now()}`;
    existingPaths.add(fallbackPath);
    return fallbackPath;
  }
}

/**
 * Parse cleaned HTML and discover all reference assets
 */
export function discoverAssets(
  html: string,
  baseUrl: string,
  timestamp: string,
  config: CloneConfig
): { assets: AssetItem[]; rawToLocalMap: Map<string, string> } {
  const assets: AssetItem[] = [];
  const rawToLocalMap = new Map<string, string>();
  const seenResolvedUrls = new Map<string, AssetItem>();
  const existingLocalPaths = new Set<string>();

  // Use DOMParser in browser environment
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function registerAsset(rawAttrValue: string, tagName: string, forcedType?: AssetType) {
    if (!rawAttrValue || rawToLocalMap.has(rawAttrValue)) return;

    const resolved = resolveAssetUrl(rawAttrValue, baseUrl);
    if (!resolved) return;

    // Filter by user configuration
    const type = forcedType || determineAssetType(resolved, tagName);
    if (type === 'image' && !config.includeImages) return;
    if (type === 'css' && !config.includeStyles) return;
    if (type === 'js' && !config.includeScripts) return;
    if (type === 'font' && !config.includeFonts) return;

    // Check if we've already catalogued this resolved URL
    if (seenResolvedUrls.has(resolved)) {
      const existing = seenResolvedUrls.get(resolved)!;
      rawToLocalMap.set(rawAttrValue, existing.localPath);
      return;
    }

    // Limit check
    if (assets.length >= config.maxAssets) return;

    const localPath = generateLocalPath(resolved, type, existingLocalPaths);
    const waybackFetchUrl = `https://web.archive.org/web/${timestamp}id_/${resolved}`;

    const item: AssetItem = {
      id: `asset-${assets.length + 1}`,
      originalUrl: rawAttrValue,
      resolvedWaybackUrl: waybackFetchUrl,
      localPath,
      type,
      status: 'pending',
      sizeBytes: 0,
    };

    assets.push(item);
    seenResolvedUrls.set(resolved, item);
    rawToLocalMap.set(rawAttrValue, localPath);
  }

  // 1. Discover Stylesheets & Icons (<link>)
  const links = doc.querySelectorAll('link[href]');
  links.forEach((link) => {
    const rel = (link.getAttribute('rel') || '').toLowerCase();
    const href = link.getAttribute('href');
    if (!href) return;

    if (rel.includes('stylesheet')) {
      registerAsset(href, 'link', 'css');
    } else if (
      rel.includes('icon') ||
      rel.includes('apple-touch-icon') ||
      rel.includes('shortcut')
    ) {
      registerAsset(href, 'link', 'image');
    } else if (rel.includes('font') || rel.includes('preload')) {
      registerAsset(href, 'link');
    }
  });

  // 2. Discover Scripts (<script src="...">)
  const scripts = doc.querySelectorAll('script[src]');
  scripts.forEach((script) => {
    const src = script.getAttribute('src');
    if (src) registerAsset(src, 'script', 'js');
  });

  // 3. Discover Images (<img src="...">)
  const images = doc.querySelectorAll('img[src]');
  images.forEach((img) => {
    const src = img.getAttribute('src');
    if (src) registerAsset(src, 'img', 'image');
  });

  // 4. Discover Sources & Backgrounds (<source src="...">, <source srcset="...">)
  const sources = doc.querySelectorAll('source[src]');
  sources.forEach((source) => {
    const src = source.getAttribute('src');
    if (src) registerAsset(src, 'source');
  });

  // 5. Discover Audio/Video
  const mediaElements = doc.querySelectorAll('video[src], audio[src]');
  mediaElements.forEach((el) => {
    const src = el.getAttribute('src');
    if (src) registerAsset(src, el.tagName.toLowerCase(), 'media');
  });

  return { assets, rawToLocalMap };
}

/**
 * Rewrite HTML content to point directly to offline local asset paths
 */
export function rewriteHtmlWithAssets(
  html: string,
  rawToLocalMap: Map<string, string>,
  config: CloneConfig
): string {
  let rewritten = html;

  // Replace each mapped attribute
  rawToLocalMap.forEach((localPath, rawUrl) => {
    // Escape regex characters in rawUrl
    const escaped = rawUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Replace in quotes: href="...", src="...", url(...)
    const attrRegex = new RegExp(`(["'\\s=(])${escaped}(["'\\s)>])`, 'g');
    rewritten = rewritten.replace(attrRegex, `$1${localPath}$2`);
  });

  // If rewriteInternalLinks is enabled, rewrite any remaining root-relative anchors so clicking them doesn't break offline
  if (config.rewriteInternalLinks) {
    // Rewrites href="/" to href="#"
    rewritten = rewritten.replace(/href=["']\/["']/gi, 'href="#"');
  }

  return rewritten;
}
