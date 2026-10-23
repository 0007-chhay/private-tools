export type AssetType = 'html' | 'css' | 'js' | 'image' | 'font' | 'media' | 'other';

export type AssetStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'skipped';

export interface AssetItem {
  id: string;
  originalUrl: string;
  resolvedWaybackUrl: string;
  localPath: string;
  type: AssetType;
  status: AssetStatus;
  sizeBytes: number;
  mimeType?: string;
  error?: string;
}

export interface ParsedWaybackUrl {
  rawInput: string;
  timestamp: string;
  formattedDate: string;
  originalUrl: string;
  domain: string;
  cleanRawUrl: string; // The URL with 'id_' flag
  slug: string;
  isValid: boolean;
  error?: string;
}

export type LogLevel = 'info' | 'fetch' | 'clean' | 'asset' | 'success' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: string;
}

export interface CloneConfig {
  includeImages: boolean;
  includeStyles: boolean;
  includeScripts: boolean;
  includeFonts: boolean;
  deepCssAssets: boolean;
  cleanToolbarComments: boolean;
  rewriteInternalLinks: boolean;
  maxAssets: number;
  concurrency: number;
}

export type CloningPhase =
  | 'idle'
  | 'parsing'
  | 'fetching_html'
  | 'cleaning'
  | 'discovering_assets'
  | 'fetching_assets'
  | 'packaging'
  | 'completed'
  | 'error'
  | 'aborted';

export interface CloneResult {
  zipBlob: Blob;
  zipFileName: string;
  zipSizeBytes: number;
  totalAssets: number;
  successfulAssets: number;
  failedAssets: number;
  cleanedHtml: string;
  siteSlug: string;
  fileList: { path: string; size: number }[];
}


