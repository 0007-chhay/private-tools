export interface R2Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
}

export interface R2ObjectItem {
  key: string;
  name: string;
  size: number;
  lastModified: string | null;
  etag: string;
  isFolder: boolean;
  prefix?: string;
}

export interface R2ListResponse {
  success: boolean;
  bucket: string;
  prefix: string;
  folders: string[];
  objects: {
    key: string;
    size: number;
    lastModified: string | null;
    etag: string;
  }[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
}

export interface R2BackupProgress {
  status: 'idle' | 'listing' | 'downloading' | 'compressing' | 'completed' | 'error';
  currentFile: string;
  completedFiles: number;
  totalFiles: number;
  downloadedBytes: number;
  percent: number;
  error?: string;
}
