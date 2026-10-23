import { ParsedWaybackUrl } from '../types';

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
  // web.archive.org/web/20200501120000cs_/example.com
  const waybackPattern =
    /(?:https?:\/\/)?(?:web\.)?archive\.org\/web\/(\d{4,14})([a-z_]{2,4}|\*)?\/(https?:\/\/.*|http:\/\/.*|.*)/i;

  const match = trimmed.match(waybackPattern);

  if (match) {
    const timestamp = match[1];
    // match[2] is the flag (id_, cs_, js_, im_, *, etc.)
    let rawOriginalUrl = match[3];

    // Ensure original URL has protocol
    if (!rawOriginalUrl.startsWith('http://') && !rawOriginalUrl.startsWith('https://')) {
      rawOriginalUrl = `https://${rawOriginalUrl}`;
    }

    try {
      const parsedOriginal = new URL(rawOriginalUrl);
      const domain = parsedOriginal.hostname;
      const cleanRawUrl = `https://web.archive.org/web/${timestamp}id_/${rawOriginalUrl}`;
      const slugDate = timestamp.slice(0, 8);
      const cleanDomain = domain.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const slug = `${cleanDomain}-${slugDate}`;

      return {
        rawInput: trimmed,
        timestamp,
        formattedDate: formatWaybackTimestamp(timestamp),
        originalUrl: rawOriginalUrl,
        domain,
        cleanRawUrl,
        slug,
        isValid: true,
      };
    } catch {
      // URL parsing failed
      return {
        rawInput: trimmed,
        timestamp,
        formattedDate: formatWaybackTimestamp(timestamp),
        originalUrl: rawOriginalUrl,
        domain: rawOriginalUrl.split('/')[0] || 'site',
        cleanRawUrl: `https://web.archive.org/web/${timestamp}id_/${rawOriginalUrl}`,
        slug: `site-${timestamp}`,
        isValid: true,
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
