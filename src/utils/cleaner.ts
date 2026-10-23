export interface CleanStats {
  toolbarRemoved: boolean;
  scriptsRemovedCount: number;
  stylesRemovedCount: number;
  commentsRemovedCount: number;
  unwrappedUrlsCount: number;
}

export interface CleanHtmlResult {
  cleanedHtml: string;
  stats: CleanStats;
}

/**
 * Remove Wayback Machine toolbar, inject scripts, banner stylesheets,
 * analytics, archive comments, and unwrap archive.org URL prefixes.
 */
export function cleanWaybackHtml(
  rawHtml: string,
  _originalBaseUrl: string
): CleanHtmlResult {
  let html = rawHtml;
  const stats: CleanStats = {
    toolbarRemoved: false,
    scriptsRemovedCount: 0,
    stylesRemovedCount: 0,
    commentsRemovedCount: 0,
    unwrappedUrlsCount: 0,
  };

  if (!html) {
    return { cleanedHtml: '', stats };
  }

  // 1. Remove Wayback Toolbar Comment block
  const toolbarCommentRegex =
    /<!--\s*BEGIN WAYBACK TOOLBAR INSERT\s*-->[\s\S]*?<!--\s*END WAYBACK TOOLBAR INSERT\s*-->/gi;
  if (toolbarCommentRegex.test(html)) {
    html = html.replace(toolbarCommentRegex, '');
    stats.toolbarRemoved = true;
  }

  // Remove Wayback toolbar DOM elements if present
  const toolbarDomRegex = /<div id="wm-ipp-base"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
  if (toolbarDomRegex.test(html)) {
    html = html.replace(toolbarDomRegex, '');
    stats.toolbarRemoved = true;
  }
  const toolbarShortRegex = /<div[^>]*id=["']wm-ipp(?:-print)?["'][^>]*>[\s\S]*?<\/div>/gi;
  html = html.replace(toolbarShortRegex, '');

  // 2. Remove other Wayback comments
  const fileArchivedRegex = /<!--\s*FILE ARCHIVED ON[\s\S]*?-->/gi;
  const timingCommentRegex = /<!--\s*playback timings[\s\S]*?-->/gi;
  const generalArchiveCommentRegex = /<!--\s*(?:archive\.org|wayback machine)[\s\S]*?-->/gi;

  const countComments =
    (html.match(fileArchivedRegex)?.length || 0) +
    (html.match(timingCommentRegex)?.length || 0) +
    (html.match(generalArchiveCommentRegex)?.length || 0);

  html = html.replace(fileArchivedRegex, '');
  html = html.replace(timingCommentRegex, '');
  html = html.replace(generalArchiveCommentRegex, '');
  stats.commentsRemovedCount = countComments;

  // 3. Remove Wayback Injected Scripts (bundle-playback, wombat, ruffle, analytics, __wm.init)
  const scriptRegexes = [
    /<script[^>]*src=["'][^"']*(?:web-static\.archive\.org|archive\.org)\/_static\/js\/bundle-playback\.js[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*src=["'][^"']*(?:web-static\.archive\.org|archive\.org)\/_static\/js\/wombat\.js[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*src=["'][^"']*(?:web-static\.archive\.org|archive\.org)\/_static\/js\/ruffle\/[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*src=["'][^"']*(?:archive\.org\/includes\/analytics\.js)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*>[\s\S]*?__wm\.(?:init|wombat)[\s\S]*?<\/script>/gi,
    /<script[^>]*>[\s\S]*?window\.__wm[\s\S]*?<\/script>/gi,
  ];

  for (const regex of scriptRegexes) {
    const matches = html.match(regex);
    if (matches) {
      stats.scriptsRemovedCount += matches.length;
      html = html.replace(regex, '');
    }
  }

  // 4. Remove Wayback Injected CSS (banner-styles.css, iconochive.css)
  const styleRegexes = [
    /<link[^>]*href=["'][^"']*(?:web-static\.archive\.org|archive\.org)\/_static\/css\/banner-styles\.css[^"']*["'][^>]*\/?>/gi,
    /<link[^>]*href=["'][^"']*(?:web-static\.archive\.org|archive\.org)\/_static\/css\/iconochive\.css[^"']*["'][^>]*\/?>/gi,
  ];

  for (const regex of styleRegexes) {
    const matches = html.match(regex);
    if (matches) {
      stats.stylesRemovedCount += matches.length;
      html = html.replace(regex, '');
    }
  }

  // 5. Unwrap Wayback URL prefixes from HTML attributes
  // Matches e.g.:
  // https://web.archive.org/web/20260315113250cs_/https://example.com/file.css
  // /web/20260315113250/http://example.com/img.jpg
  // //web.archive.org/web/20260315113250id_/http://...
  const waybackPrefixRegex =
    /(["'\s=(])(?:(?:https?:)?\/\/web\.archive\.org)?\/web\/\d+(?:[a-z_]{2,4}|\*)?\/(https?:\/\/[^"'\s)]+)/gi;

  let unwrappedCount = 0;
  html = html.replace(waybackPrefixRegex, (_match, prefix, originalUrl) => {
    unwrappedCount++;
    return `${prefix}${originalUrl}`;
  });
  stats.unwrappedUrlsCount = unwrappedCount;

  // 6. Clean target canonical & og:url tags if they point to web.archive.org
  html = html.replace(
    /(<link[^>]*rel=["']canonical["'][^>]*href=["'])(?:https?:)?\/\/web\.archive\.org\/web\/\d+(?:[a-z_]{2,4}|\*)?\/(https?:\/\/[^"']+)["']/gi,
    '$1$2"'
  );
  html = html.replace(
    /(<meta[^>]*property=["']og:url["'][^>]*content=["'])(?:https?:)?\/\/web\.archive\.org\/web\/\d+(?:[a-z_]{2,4}|\*)?\/(https?:\/\/[^"']+)["']/gi,
    '$1$2"'
  );

  return { cleanedHtml: html, stats };
}

/**
 * Clean CSS content: remove archive.org injected comments and unwrap wayback url() prefixes
 */
export function cleanCssContent(rawCss: string): string {
  if (!rawCss) return '';

  // Remove archive comments inside CSS
  let cleaned = rawCss
    .replace(/\/\*[\s\S]*?archive\.org[\s\S]*?\*\//gi, '')
    .replace(/\/\*[\s\S]*?wayback[\s\S]*?\*\//gi, '');

  // Unwrap url('/web/2026.../https://domain/font.woff2') -> url('https://domain/font.woff2')
  cleaned = cleaned.replace(
    /url\(\s*["']?(?:(?:https?:)?\/\/web\.archive\.org)?\/web\/\d+(?:[a-z_]{2,4}|\*)?\/(https?:\/\/[^"')\s]+)["']?\s*\)/gi,
    'url("$1")'
  );

  return cleaned;
}
