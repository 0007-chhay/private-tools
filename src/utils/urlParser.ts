import { AssetType, ParsedWaybackUrl } from '../types';

/**
 * Detect whether a URL is a direct media/image asset and extract filename and asset type
 */
export function detectAssetMetadata(
  urlStr: string,
  flag?: string
): { isDirectAsset: boolean; fileName: string; assetType: AssetType } {
  try {
    const clean = urlStr.split('?')[0].split('#')[0].toLowerCase();
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    const pathname = decodeURIComponent(parsed.pathname);
    let fileName = pathname.split('/').filter(Boolean).pop() || 'asset';
    fileName = fileName.split('?')[0].split('#')[0];

    const isImage =
      clean.endsWith('.jpg') ||
      clean.endsWith('.jpeg') ||
      clean.endsWith('.png') ||
      clean.endsWith('.webp') ||
      clean.endsWith('.gif') ||
      clean.endsWith('.svg') ||
      clean.endsWith('.ico') ||
      clean.endsWith('.bmp') ||
      clean.endsWith('.avif') ||
      flag === 'im_';

    const isMedia =
      clean.endsWith('.mp4') ||
      clean.endsWith('.webm') ||
      clean.endsWith('.mp3') ||
      clean.endsWith('.ogg') ||
      clean.endsWith('.wav');

    const isFont =
      clean.endsWith('.woff') ||
      clean.endsWith('.woff2') ||
      clean.endsWith('.ttf') ||
      clean.endsWith('.otf') ||
      clean.endsWith('.eot');

    const isPdf = clean.endsWith('.pdf') || clean.endsWith('.zip');
    const isCss = clean.endsWith('.css') || flag === 'cs_';
    const isJs = clean.endsWith('.js') || flag === 'js_';

    if (isImage) {
      if (!fileName.includes('.')) fileName += '.jpg';
      return { isDirectAsset: true, fileName, assetType: 'image' };
    }
    if (isMedia) {
      return { isDirectAsset: true, fileName, assetType: 'media' };
    }
    if (isFont) {
      return { isDirectAsset: true, fileName, assetType: 'font' };
    }
    if (isPdf) {
      return { isDirectAsset: true, fileName, assetType: 'other' };
    }
    if (isCss) {
      return { isDirectAsset: true, fileName, assetType: 'css' };
    }
    if (isJs) {
      return { isDirectAsset: true, fileName, assetType: 'js' };
    }

    return { isDirectAsset: false, fileName: 'index.html', assetType: 'html' };
  } catch {
    return { isDirectAsset: false, fileName: 'index.html', assetType: 'html' };
  }
}

/**
 * Format a 14-digit Wayback timestamp (YYYYMMDDhhmmss) into a human-readable date
 */
export function formatWaybackTimestamp(timestamp: string): string {
  if (!timestamp) return 'Unknown Date';

  // Pad or trim to 14 digits
  const padded = timestamp.padEnd(14, '0');
  const year = padded.slice(0, 4);
  const month = padded.slice(4, 6);
  const day = padded.slice(6, 8);
  const hour = padded.slice(8, 10);
  const min = padded.slice(10, 12);
  const sec = padded.slice(12, 14);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const mIndex = parseInt(month, 10) - 1;
  const monthName = mIndex >= 0 && mIndex < 12 ? monthNames[mIndex] : month;

  return `${monthName} ${day || '01'}, ${year} ${hour}:${min}:${sec} UTC`;
}

/**
 * Parse any Wayback Machine URL and extract metadata, original target, timestamp, and id_ raw URL
 */
export function parseWaybackUrl(input: string): ParsedWaybackUrl {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      rawInput: '',
      timestamp: '',
      formattedDate: '',
      originalUrl: '',
      domain: '',
      cleanRawUrl: '',
      slug: '',
      isValid: false,
      error: 'Empty URL provided',
    };
  }

  // Regex matching Wayback Machine archive pattern:
  // Examples:
  // https://web.archive.org/web/20260315113250/https://www.dpscjhargram.com/
  // https://web.archive.org/web/20260315113250id_/http://example.com/
  // https://web.archive.org/web/20230716171621im_/https://www.siamklongfilm.com/.../slide_1_1024x1024.jpg
  // web.archive.org/web/20200501120000cs_/example.com
  const waybackPattern =
    /(?:https?:\/\/)?(?:web\.)?archive\.org\/web\/(\d{4,14})([a-z_]{2,4}|\*)?\/(https?:\/\/.*|http:\/\/.*|.*)/i;

  const match = trimmed.match(waybackPattern);

  if (match) {
    const timestamp = match[1];
    const flag = match[2]; // id_, cs_, js_, im_, *, etc.
    let rawOriginalUrl = match[3];

    // Ensure original URL has protocol
    if (!rawOriginalUrl.startsWith('http://') && !rawOriginalUrl.startsWith('https://')) {
      rawOriginalUrl = `https://${rawOriginalUrl}`;
    }

    const { isDirectAsset, fileName, assetType } = detectAssetMetadata(rawOriginalUrl, flag);

    try {
      const parsedOriginal = new URL(rawOriginalUrl);
      const domain = parsedOriginal.hostname;
      const chosenFlag = flag || (assetType === 'image' ? 'im_' : 'id_');
      const cleanRawUrl = `https://web.archive.org/web/${timestamp}${chosenFlag}/${rawOriginalUrl}`;
      const slugDate = timestamp.slice(0, 8);
      const cleanDomain = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const slug = isDirectAsset
        ? `${cleanDomain}-${fileName.replace(/[^a-z0-9._-]/gi, '_')}`
        : `${cleanDomain}-${slugDate}`;

      return {
        rawInput: trimmed,
        timestamp,
        formattedDate: formatWaybackTimestamp(timestamp),
        originalUrl: rawOriginalUrl,
        domain,
        cleanRawUrl,
        slug,
        isValid: true,
        isDirectAsset,
        fileName,
        assetType,
      };
    } catch {
      // URL parsing failed
      const chosenFlag = flag || (assetType === 'image' ? 'im_' : 'id_');
      return {
        rawInput: trimmed,
        timestamp,
        formattedDate: formatWaybackTimestamp(timestamp),
        originalUrl: rawOriginalUrl,
        domain: rawOriginalUrl.split('/')[0] || 'site',
        cleanRawUrl: `https://web.archive.org/web/${timestamp}${chosenFlag}/${rawOriginalUrl}`,
        slug: `site-${timestamp}`,
        isValid: true,
        isDirectAsset,
        fileName,
        assetType,
      };
    }
  }

  // Handle standard URL provided without wayback prefix
  // e.g. "https://www.dpscjhargram.com/"
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      return {
        rawInput: trimmed,
        timestamp: '',
        formattedDate: '',
        originalUrl: trimmed,
        domain: parsed.hostname,
        cleanRawUrl: '',
        slug: parsed.hostname.replace(/[^a-z0-9]/gi, '-'),
        isValid: false,
        error: 'Standard URL entered without Wayback timestamp. Use snapshot lookup or enter a web.archive.org URL.',
      };
    } catch {
      // ignore
    }
  }

  return {
    rawInput: trimmed,
    timestamp: '',
    formattedDate: '',
    originalUrl: '',
    domain: '',
    cleanRawUrl: '',
    slug: '',
    isValid: false,
    error: 'Does not match Wayback Machine URL pattern (e.g. https://web.archive.org/web/2026.../https://...)',
  };
}

/**
 * Parse multi-line input and return an array of parsed URLs
 */
export function parseMultipleUrls(inputText: string): ParsedWaybackUrl[] {
  return inputText
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseWaybackUrl(line));
}
