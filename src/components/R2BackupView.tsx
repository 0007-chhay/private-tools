import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Key,
  Shield,
  Globe,
  Database,
  Folder,
  FileText,
  Download,
  Terminal,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  FolderTree,
  FileArchive,
  ArrowRight,
  Layers,
  Sparkles,
  UploadCloud,
  Upload,
  Trash2,
  Plus,
  FileUp,
  Check,
  Loader2,
  X,
  Users,
  Save,
} from 'lucide-react';
import JSZip from 'jszip';
import { R2Credentials, R2ObjectItem, R2BackupProgress } from '../types/r2';
import { RcloneConfigModal } from './RcloneConfigModal';
import { triggerFileDownload } from '../utils/zipPackager';

// ---------------------------------------------------------------------------
// Saved accounts (multiple R2 / S3 profiles kept in this browser)
// ---------------------------------------------------------------------------
const PROFILES_KEY = 'r2_cloner_profiles';
const LEGACY_KEY = 'r2_cloner_credentials'; // single-account format used before

interface R2Profile {
  id: string;
  name: string;
  credentials: R2Credentials;
}

interface ProfileStore {
  profiles: R2Profile[];
  activeId: string | null;
}

const EMPTY_CREDENTIALS: R2Credentials = {
  accessKeyId: '',
  secretAccessKey: '',
  endpoint: '',
  bucket: '',
};

function newProfileId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeCredentials(raw: any): R2Credentials {
  return {
    accessKeyId: String(raw?.accessKeyId ?? ''),
    secretAccessKey: String(raw?.secretAccessKey ?? ''),
    endpoint: String(raw?.endpoint ?? ''),
    bucket: String(raw?.bucket ?? ''),
  };
}

function loadProfileStore(): ProfileStore {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const profiles: R2Profile[] = Array.isArray(parsed?.profiles)
        ? parsed.profiles
            .filter((p: any) => p && typeof p.id === 'string')
            .map((p: any) => ({
              id: p.id,
              name: String(p.name || 'Untitled account'),
              credentials: sanitizeCredentials(p.credentials),
            }))
        : [];
      const activeId = profiles.some((p) => p.id === parsed?.activeId) ? parsed.activeId : null;
      return { profiles, activeId };
    }

    // Migrate the old single-account storage into the first saved account
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const creds = sanitizeCredentials(JSON.parse(legacy));
      localStorage.removeItem(LEGACY_KEY);
      if (creds.accessKeyId || creds.endpoint) {
        const migrated: R2Profile = {
          id: newProfileId(),
          name: creds.bucket || 'Account 1',
          credentials: creds,
        };
        const store = { profiles: [migrated], activeId: migrated.id };
        localStorage.setItem(PROFILES_KEY, JSON.stringify(store));
        return store;
      }
    }
  } catch {
    // storage unavailable or corrupted: start empty
  }
  return { profiles: [], activeId: null };
}

function persistProfileStore(store: ProfileStore) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(store));
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

function sameCredentials(a: R2Credentials, b: R2Credentials) {
  return (
    a.accessKeyId === b.accessKeyId &&
    a.secretAccessKey === b.secretAccessKey &&
    a.endpoint === b.endpoint &&
    a.bucket === b.bucket
  );
}

export const R2BackupView: React.FC = () => {
  // Saved accounts
  const [profileStore, setProfileStore] = useState<ProfileStore>(loadProfileStore);
  const activeProfile =
    profileStore.profiles.find((p) => p.id === profileStore.activeId) || null;
  const [profileName, setProfileName] = useState<string>(() => activeProfile?.name || '');
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState<boolean>(false);

  // Credentials state (the account currently shown in the form)
  const [credentials, setCredentials] = useState<R2Credentials>(
    () => activeProfile?.credentials || EMPTY_CREDENTIALS
  );

  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Connection & Data state
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [availableBuckets, setAvailableBuckets] = useState<string[]>([]);
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [objects, setObjects] = useState<R2ObjectItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isLoadingObjects, setIsLoadingObjects] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Backup Progress state
  const [backupProgress, setBackupProgress] = useState<R2BackupProgress>({
    status: 'idle',
    currentFile: '',
    completedFiles: 0,
    totalFiles: 0,
    downloadedBytes: 0,
    percent: 0,
  });

  // Logs state
  const [logs, setLogs] = useState<string[]>([]);

  // Rclone config modal
  const [isRcloneModalOpen, setIsRcloneModalOpen] = useState<boolean>(false);

  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDestinationPrefix, setUploadDestinationPrefix] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [currentUploadingFile, setCurrentUploadingFile] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Delete State
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const updateProfileStore = (next: ProfileStore) => {
    setProfileStore(next);
    persistProfileStore(next);
  };

  // When only the bucket changes on a saved account, remember it silently
  useEffect(() => {
    if (!activeProfile) return;
    const saved = activeProfile.credentials;
    if (
      saved.bucket !== credentials.bucket &&
      saved.accessKeyId === credentials.accessKeyId &&
      saved.secretAccessKey === credentials.secretAccessKey &&
      saved.endpoint === credentials.endpoint
    ) {
      updateProfileStore({
        ...profileStore,
        profiles: profileStore.profiles.map((p) =>
          p.id === activeProfile.id ? { ...p, credentials: { ...p.credentials, bucket: credentials.bucket } } : p
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials.bucket]);

  const hasUnsavedChanges = activeProfile
    ? !sameCredentials(activeProfile.credentials, credentials) || profileName.trim() !== activeProfile.name
    : Boolean(credentials.accessKeyId || credentials.secretAccessKey || credentials.endpoint);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  // Clear everything that belongs to the previously shown account
  const resetConnectionView = () => {
    setAvailableBuckets([]);
    setObjects([]);
    setCurrentPrefix('');
    setSelectedKeys(new Set());
    setSearchFilter('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setConfirmDeleteProfile(false);
  };

  const handleSwitchProfile = (id: string) => {
    const target = profileStore.profiles.find((p) => p.id === id) || null;
    resetConnectionView();
    setCredentials(target ? target.credentials : EMPTY_CREDENTIALS);
    setProfileName(target ? target.name : '');
    setShowSecret(false);
    updateProfileStore({ ...profileStore, activeId: target ? target.id : null });
    addLog(target ? `Switched to saved account "${target.name}".` : 'Started a new, unsaved account.');
  };

  const handleSaveProfile = () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.endpoint) {
      setErrorMessage('Fill in Endpoint, Access Key ID and Secret Access Key before saving.');
      return;
    }
    const name =
      profileName.trim() || credentials.bucket || `Account ${profileStore.profiles.length + 1}`;

    if (activeProfile) {
      updateProfileStore({
        ...profileStore,
        profiles: profileStore.profiles.map((p) =>
          p.id === activeProfile.id ? { ...p, name, credentials } : p
        ),
      });
      setSuccessMessage(`Saved changes to "${name}".`);
    } else {
      const created: R2Profile = { id: newProfileId(), name, credentials };
      updateProfileStore({
        profiles: [...profileStore.profiles, created],
        activeId: created.id,
      });
      setSuccessMessage(`Saved "${name}". Switch between accounts from the list.`);
    }
    setProfileName(name);
    setErrorMessage(null);
    addLog(`Saved account "${name}" in this browser.`);
  };

  const handleDeleteProfile = () => {
    if (!activeProfile) return;
    const name = activeProfile.name;
    updateProfileStore({
      profiles: profileStore.profiles.filter((p) => p.id !== activeProfile.id),
      activeId: null,
    });
    resetConnectionView();
    setCredentials(EMPTY_CREDENTIALS);
    setProfileName('');
    addLog(`Removed saved account "${name}" from this browser. Nothing was changed on Cloudflare.`);
  };

  // Download one object without putting keys in the URL
  const handleDownloadSingle = async (key: string) => {
    setDownloadingKey(key);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/r2/download-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          endpoint: credentials.endpoint,
          bucket: credentials.bucket,
          key,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details || data.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      triggerFileDownload(blob, key.split('/').pop() || 'download');
      addLog(`✓ Downloaded ${key}`);
    } catch (err: any) {
      setErrorMessage(`Download failed: ${err?.message || err}`);
      addLog(`✗ Download failed for ${key}: ${err?.message || err}`);
    } finally {
      setDownloadingKey(null);
    }
  };

  // Test connection & load buckets
  const handleConnectAndListBuckets = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.endpoint) {
      setErrorMessage('Please fill in Access Key ID, Secret Access Key, and Endpoint.');
      return;
    }

    setIsConnecting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    addLog(`Initiating connection to Cloudflare R2 endpoint: ${credentials.endpoint}...`);

    try {
      const res = await fetch('/api/r2/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          endpoint: credentials.endpoint,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to authenticate with R2');
      }

      setAvailableBuckets(data.buckets || []);
      const bucketCount = data.buckets?.length || 0;
      addLog(`✓ Authentication successful! Discovered ${bucketCount} bucket(s).`);

      if (bucketCount > 0 && !credentials.bucket) {
        setCredentials((prev) => ({ ...prev, bucket: data.buckets[0] }));
      }

      setSuccessMessage(`Connected! Found ${bucketCount} bucket(s).`);

      // If a bucket is selected, fetch its contents
      const targetBucket = credentials.bucket || data.buckets[0];
      if (targetBucket) {
        loadObjects(targetBucket, '');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection failed');
      addLog(`✗ Error connecting to R2: ${err?.message || err}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Load objects for selected bucket and prefix
  const loadObjects = async (bucket: string, prefix = '') => {
    if (!bucket) return;

    setIsLoadingObjects(true);
    setErrorMessage(null);
    addLog(`Listing objects in bucket "${bucket}" (prefix: "${prefix}")...`);

    try {
      const res = await fetch('/api/r2/list-objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          endpoint: credentials.endpoint,
          bucket,
          prefix,
          delimiter: '/',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to list objects');
      }

      const items: R2ObjectItem[] = [];

      // Add folders
      (data.folders || []).forEach((f: string) => {
        const folderName = f.replace(prefix, '').replace(/\/$/, '');
        if (folderName) {
          items.push({
            key: f,
            name: `${folderName}/`,
            size: 0,
            lastModified: null,
            etag: '',
            isFolder: true,
            prefix: f,
          });
        }
      });

      // Add files
      (data.objects || []).forEach((o: any) => {
        // Skip prefix itself
        if (o.key === prefix) return;
        const fileName = o.key.replace(prefix, '');
        items.push({
          key: o.key,
          name: fileName,
          size: o.size,
          lastModified: o.lastModified,
          etag: o.etag,
          isFolder: false,
        });
      });

      setObjects(items);
      setCurrentPrefix(prefix);
      setSelectedKeys(new Set());
      addLog(`✓ Retrieved ${items.length} item(s) from "${bucket}"`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to list objects');
      addLog(`✗ Listing failed: ${err?.message || err}`);
    } finally {
      setIsLoadingObjects(false);
    }
  };

  // Navigate into folder
  const handleEnterFolder = (folderPrefix: string) => {
    loadObjects(credentials.bucket, folderPrefix);
  };

  // Navigate to parent folder
  const handleGoUp = () => {
    if (!currentPrefix) return;
    const parts = currentPrefix.replace(/\/$/, '').split('/');
    parts.pop();
    const newPrefix = parts.length > 0 ? `${parts.join('/')}/` : '';
    loadObjects(credentials.bucket, newPrefix);
  };

  // Open Upload Modal
  const handleOpenUploadModal = () => {
    if (!credentials.bucket) {
      setErrorMessage('Please connect and select a bucket first before uploading.');
      return;
    }
    setUploadDestinationPrefix(currentPrefix);
    setSelectedFiles([]);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgressPercent(0);
    setIsUploadModalOpen(true);
  };

  // File selection
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      setUploadError(null);
    }
  };

  // Drag and drop files
  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
      setUploadError(null);
    }
  };

  // Remove file from staged upload list
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files to R2 via /api/r2/upload-object
  const handleUploadFilesToR2 = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Please select at least one file to upload.');
      return;
    }
    if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.endpoint || !credentials.bucket) {
      setUploadError('Please connect and select a bucket first.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgressPercent(0);

    let successCount = 0;
    const total = selectedFiles.length;

    for (let i = 0; i < total; i++) {
      const file = selectedFiles[i];
      setCurrentUploadingFile(file.name);
      setUploadProgressPercent(Math.round((i / total) * 100));

      try {
        addLog(`Initiating upload: "${file.name}" (${formatBytes(file.size)}) to bucket "${credentials.bucket}"...`);

        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file from disk'));
          reader.readAsDataURL(file);
        });

        // Compute destination key: prefix + file.name
        let cleanPrefix = uploadDestinationPrefix.trim();
        if (cleanPrefix && !cleanPrefix.endsWith('/')) {
          cleanPrefix += '/';
        }
        if (cleanPrefix.startsWith('/')) {
          cleanPrefix = cleanPrefix.substring(1);
        }
        const targetKey = `${cleanPrefix}${file.name}`;

        const res = await fetch('/api/r2/upload-object', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            endpoint: credentials.endpoint,
            bucket: credentials.bucket,
            key: targetKey,
            fileBase64: base64Data,
            contentType: file.type || 'application/octet-stream',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.details || data.error || 'Failed to upload to R2');
        }

        successCount++;
        addLog(`✓ Successfully uploaded "${targetKey}" (${formatBytes(file.size)}) to R2`);
      } catch (err: any) {
        console.error('File upload error:', err);
        addLog(`✗ Upload failed for "${file.name}": ${err.message || err}`);
        setUploadError(`Failed to upload "${file.name}": ${err.message || err}`);
        setIsUploading(false);
        return;
      }
    }

    setUploadProgressPercent(100);
    setIsUploading(false);
    setUploadSuccess(`Successfully uploaded ${successCount} file(s) to Cloudflare R2!`);
    addLog(`✓ All ${successCount} file(s) uploaded successfully!`);
    setSelectedFiles([]);

    setTimeout(() => {
      setIsUploadModalOpen(false);
      setUploadSuccess(null);
    }, 1200);

    // Refresh file list
    loadObjects(credentials.bucket, currentPrefix);
  };

  // Delete object from R2
  const handleDeleteObject = async (key: string) => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.endpoint || !credentials.bucket) {
      return;
    }

    setIsDeleting(true);
    addLog(`Deleting object "${key}" from R2...`);

    try {
      const res = await fetch('/api/r2/delete-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          endpoint: credentials.endpoint,
          bucket: credentials.bucket,
          key,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Delete failed');
      }

      addLog(`✓ Deleted "${key}" from Cloudflare R2`);
      setSuccessMessage(`Successfully deleted ${key}`);
      setDeleteConfirmKey(null);
      loadObjects(credentials.bucket, currentPrefix);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete object');
      addLog(`✗ Delete error: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle select file
  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Toggle select all files in current view
  const toggleSelectAll = () => {
    const fileKeys = objects.filter((o) => !o.isFolder).map((o) => o.key);
    if (selectedKeys.size === fileKeys.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(fileKeys));
    }
  };

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Backup / Download selected or all files as .ZIP
  const handleBackupToZip = async () => {
    const filesToDownload = objects.filter(
      (o) => !o.isFolder && (selectedKeys.size === 0 || selectedKeys.has(o.key))
    );

    if (filesToDownload.length === 0) {
      setErrorMessage('No files available or selected to backup.');
      return;
    }

    const total = filesToDownload.length;
    setBackupProgress({
      status: 'downloading',
      currentFile: 'Starting download...',
      completedFiles: 0,
      totalFiles: total,
      downloadedBytes: 0,
      percent: 0,
    });

    addLog(`Starting backup of ${total} file(s) from bucket "${credentials.bucket}"...`);

    const zip = new JSZip();
    let completed = 0;
    let totalBytes = 0;

    try {
      for (const item of filesToDownload) {
        setBackupProgress((prev) => ({
          ...prev,
          currentFile: item.key,
          percent: Math.floor((completed / total) * 85),
        }));
        addLog(`Downloading: ${item.key} (${formatBytes(item.size)})...`);

        const res = await fetch('/api/r2/download-object', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            endpoint: credentials.endpoint,
            bucket: credentials.bucket,
            key: item.key,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to download ${item.key}: HTTP ${res.status}`);
        }

        const buffer = await res.arrayBuffer();
        totalBytes += buffer.byteLength;

        // Strip prefix for clean relative folder inside ZIP
        const relativePath = currentPrefix
          ? item.key.replace(currentPrefix, '')
          : item.key;
        zip.file(relativePath, buffer);

        completed++;
        setBackupProgress((prev) => ({
          ...prev,
          completedFiles: completed,
          downloadedBytes: totalBytes,
          percent: Math.floor((completed / total) * 85),
        }));
      }

      // Add backup metadata manifest
      zip.file(
        'backup-metadata.json',
        JSON.stringify(
          {
            bucket: credentials.bucket,
            endpoint: credentials.endpoint,
            prefix: currentPrefix,
            backupDate: new Date().toISOString(),
            filesCount: completed,
            totalBytes,
          },
          null,
          2
        )
      );

      // Compress ZIP
      setBackupProgress((prev) => ({
        ...prev,
        status: 'compressing',
        currentFile: 'Compressing .ZIP package...',
        percent: 90,
      }));
      addLog('Compressing files into .ZIP archive...');

      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (meta) => {
          setBackupProgress((prev) => ({
            ...prev,
            percent: Math.min(99, Math.floor(90 + (meta.percent / 100) * 9)),
          }));
        }
      );

      const zipName = `r2-backup-${credentials.bucket}-${Date.now()}.zip`;
      triggerFileDownload(zipBlob, zipName);

      setBackupProgress({
        status: 'completed',
        currentFile: `Downloaded: ${zipName}`,
        completedFiles: completed,
        totalFiles: total,
        downloadedBytes: totalBytes,
        percent: 100,
      });

      addLog(`✓ Backup complete! Saved as ${zipName} (${formatBytes(zipBlob.size)})`);
      setSuccessMessage(`Successfully backed up ${completed} files (${formatBytes(zipBlob.size)})!`);
    } catch (err: any) {
      setBackupProgress((prev) => ({
        ...prev,
        status: 'error',
        error: err?.message || 'Backup failed',
      }));
      setErrorMessage(err?.message || 'Backup error');
      addLog(`✗ Backup error: ${err?.message || err}`);
    }
  };

  const filteredObjects = objects.filter((o) => {
    if (!searchFilter) return true;
    return o.name.toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Credentials & Connection Card */}
      <section className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-amber-400" />
              Cloudflare R2 (S3-Compatible) Authentication
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Enter your Cloudflare R2 API credentials to list buckets, browse files, and backup data.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsRcloneModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-mono transition self-start sm:self-auto"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate rclone.conf</span>
          </button>
        </div>

        {/* Saved accounts */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 space-y-2 text-xs">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[180px] space-y-1">
              <label
                htmlFor="r2-saved-account"
                className="text-zinc-300 font-mono text-[11px] font-medium flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Saved accounts
                {profileStore.profiles.length > 0 && (
                  <span className="text-zinc-500 font-normal">({profileStore.profiles.length})</span>
                )}
              </label>
              <select
                id="r2-saved-account"
                value={profileStore.activeId ?? ''}
                onChange={(e) => handleSwitchProfile(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 outline-none focus:border-amber-500"
              >
                <option value="">+ New account</option>
                {profileStore.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.credentials.bucket && p.credentials.bucket !== p.name ? ` (${p.credentials.bucket})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[180px] space-y-1">
              <label htmlFor="r2-account-name" className="text-zinc-300 font-mono text-[11px] font-medium block">
                Account name
              </label>
              <input
                id="r2-account-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g. Policlinico, Client B"
                maxLength={60}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={!hasUnsavedChanges}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              {activeProfile ? 'Save changes' : 'Save account'}
            </button>

            {activeProfile &&
              (confirmDeleteProfile ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteProfile(false)}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteProfile(true)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
                  title="Remove this saved account from the browser"
                  aria-label="Remove this saved account from the browser"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ))}
          </div>

          <p className="text-[11px] text-zinc-500">
            {confirmDeleteProfile && activeProfile ? (
              <span className="text-rose-300">
                Remove “{activeProfile.name}” from this browser? Buckets and files on Cloudflare are not touched.
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-amber-300">
                {activeProfile ? 'You have unsaved changes to this account.' : 'This account is not saved yet.'}
              </span>
            ) : (
              'Switching accounts never changes anything on Cloudflare.'
            )}{' '}
            Saved keys are stored unencrypted in this browser, so only save them on your own computer.
          </p>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Endpoint */}
          <div className="space-y-1 md:col-span-2">
            <label className="block text-zinc-300 font-mono text-[11px] font-medium flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                Endpoint URL
              </span>
              <span className="text-zinc-500 text-[10px]">
                Format: https://&lt;account_id&gt;.r2.cloudflarestorage.com
              </span>
            </label>
            <input
              type="text"
              value={credentials.endpoint}
              onChange={(e) =>
                setCredentials({ ...credentials, endpoint: e.target.value.trim() })
              }
              placeholder="https://abc123xyz.r2.cloudflarestorage.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500"
            />
          </div>

          {/* Access Key ID */}
          <div className="space-y-1">
            <label className="block text-zinc-300 font-mono text-[11px] font-medium flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Access Key ID
            </label>
            <input
              type="text"
              value={credentials.accessKeyId}
              onChange={(e) =>
                setCredentials({ ...credentials, accessKeyId: e.target.value.trim() })
              }
              placeholder="0123456789abcdef0123456789abcdef"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500"
            />
          </div>

          {/* Secret Access Key */}
          <div className="space-y-1">
            <label className="block text-zinc-300 font-mono text-[11px] font-medium flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Secret Access Key
              </span>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 text-[10px]"
              >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSecret ? 'Hide' : 'Show'}</span>
              </button>
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={credentials.secretAccessKey}
                onChange={(e) =>
                  setCredentials({ ...credentials, secretAccessKey: e.target.value.trim() })
                }
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Bucket Name */}
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-mono text-[11px] font-medium flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                Bucket Name
              </label>
              {availableBuckets.length > 0 && (
                <span className="text-zinc-500 text-[10px]">
                  {availableBuckets.length} bucket(s) detected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {availableBuckets.length > 0 ? (
                <select
                  value={credentials.bucket}
                  onChange={(e) => {
                    const b = e.target.value;
                    setCredentials({ ...credentials, bucket: b });
                    loadObjects(b, '');
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 outline-none focus:border-amber-500"
                >
                  <option value="">-- Select a Bucket --</option>
                  {availableBuckets.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={credentials.bucket}
                  onChange={(e) =>
                    setCredentials({ ...credentials, bucket: e.target.value.trim() })
                  }
                  placeholder="e.g. my-production-backups"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-500"
                />
              )}

              <button
                type="button"
                onClick={handleConnectAndListBuckets}
                disabled={isConnecting}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                <span>{isConnecting ? 'Connecting...' : 'Connect & List'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Options & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <span className="text-zinc-500">
            {activeProfile ? (
              <>
                Account: <span className="text-zinc-300 font-medium">{activeProfile.name}</span>
              </>
            ) : (
              'Unsaved account'
            )}
          </span>

          {errorMessage && (
            <div className="text-rose-400 flex items-center gap-1.5 text-xs bg-rose-950/40 border border-rose-900/60 px-2.5 py-1 rounded-md">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="text-emerald-400 flex items-center gap-1.5 text-xs bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </section>

      {/* Progress Card when Backup is active */}
      {backupProgress.status !== 'idle' && (
        <section className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-medium">
                R2 Backup Operation
              </span>
              <p className="text-sm font-medium text-zinc-100 font-mono truncate max-w-lg">
                {backupProgress.currentFile}
              </p>
            </div>
            <span className="text-2xl font-mono font-bold text-amber-400">
              {backupProgress.percent}%
            </span>
          </div>

          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-200 ${
                backupProgress.status === 'completed'
                  ? 'bg-emerald-500'
                  : backupProgress.status === 'error'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${backupProgress.percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>
              {backupProgress.completedFiles} of {backupProgress.totalFiles} files
            </span>
            <span>{formatBytes(backupProgress.downloadedBytes)} transferred</span>
          </div>
        </section>
      )}

      {/* Object Browser & Backup Table */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Browser Header Bar */}
        <div className="bg-zinc-900/90 px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 text-zinc-300 font-mono overflow-x-auto py-0.5">
            <Database className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="font-semibold text-zinc-200">
              {credentials.bucket || 'No Bucket Selected'}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-amber-400">
              {currentPrefix || '(root)'}
            </span>

            {currentPrefix && (
              <button
                type="button"
                onClick={handleGoUp}
                className="ml-2 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter files..."
                className="bg-zinc-950 text-zinc-200 border border-zinc-800 rounded pl-7 pr-2 py-1 text-xs font-mono outline-none w-36 focus:w-48 transition-all placeholder:text-zinc-600"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-2" />
            </div>

            <button
              type="button"
              onClick={() => loadObjects(credentials.bucket, currentPrefix)}
              disabled={isLoadingObjects || !credentials.bucket}
              className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition disabled:opacity-50"
              title="Refresh files list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingObjects ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleOpenUploadModal}
              disabled={!credentials.bucket}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-semibold text-xs transition disabled:opacity-40 cursor-pointer shadow-sm"
              title="Upload files to this Cloudflare R2 bucket"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload to R2</span>
            </button>

            <button
              type="button"
              onClick={handleBackupToZip}
              disabled={
                backupProgress.status === 'downloading' ||
                backupProgress.status === 'compressing' ||
                objects.length === 0
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-semibold text-xs transition disabled:opacity-40 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 fill-current" />
              <span>
                {selectedKeys.size > 0
                  ? `Backup Selected (${selectedKeys.size}) .ZIP`
                  : 'Backup All to .ZIP'}
              </span>
            </button>
          </div>
        </div>

        {/* Files Table */}
        <div className="max-h-[420px] overflow-y-auto">
          {objects.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 text-xs space-y-3">
              <FolderTree className="w-8 h-8 mx-auto text-zinc-700" />
              <p>
                {credentials.bucket
                  ? 'No objects found in this bucket/prefix. Click "Connect & List" or upload your first file.'
                  : 'Enter your credentials above and click "Connect & List" to view and backup files.'}
              </p>
              {credentials.bucket && (
                <button
                  type="button"
                  onClick={handleOpenUploadModal}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Files to R2</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-zinc-900/60 text-zinc-400 text-[11px] sticky top-0 border-b border-zinc-800/80 z-10">
                <tr>
                  <th className="py-2 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedKeys.size > 0 &&
                        selectedKeys.size ===
                          objects.filter((o) => !o.isFolder).length
                      }
                      onChange={toggleSelectAll}
                      className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
                    />
                  </th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 text-right">Size</th>
                  <th className="py-2 px-3 text-right hidden sm:table-cell">
                    Last Modified
                  </th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredObjects.map((item) => (
                  <tr
                    key={item.key}
                    className="hover:bg-zinc-900/40 transition group"
                  >
                    <td className="py-2 px-3">
                      {!item.isFolder && (
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(item.key)}
                          onChange={() => toggleSelect(item.key)}
                          className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
                        />
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {item.isFolder ? (
                        <button
                          type="button"
                          onClick={() => handleEnterFolder(item.prefix || item.key)}
                          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold transition"
                        >
                          <Folder className="w-4 h-4 fill-amber-400/20" />
                          <span>{item.name}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-200">
                          <FileText className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="truncate max-w-sm" title={item.key}>
                            {item.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-400">
                      {item.isFolder ? '-' : formatBytes(item.size)}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-500 hidden sm:table-cell">
                      {item.lastModified
                        ? new Date(item.lastModified).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {!item.isFolder && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(item.key)}
                            disabled={downloadingKey === item.key}
                            className="text-zinc-500 hover:text-amber-400 p-1 rounded inline-block transition cursor-pointer disabled:cursor-wait"
                            title="Download single file"
                            aria-label={`Download ${item.name}`}
                          >
                            {downloadingKey === item.key ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmKey(item.key)}
                            className="text-zinc-500 hover:text-rose-400 p-1 rounded inline-block transition cursor-pointer"
                            title="Delete file from R2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* R2 Terminal Logs */}
      {logs.length > 0 && (
        <section className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-zinc-900/90 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-mono">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>R2 Activity Stream ({logs.length})</span>
            </div>
            <button
              type="button"
              onClick={() => setLogs([])}
              className="text-zinc-500 hover:text-zinc-300 text-[11px] font-mono"
            >
              Clear
            </button>
          </div>
          <div className="p-3 bg-black/60 font-mono text-xs text-zinc-400 max-h-40 overflow-y-auto space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed hover:text-zinc-200">
                {log}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rclone Modal */}
      <RcloneConfigModal
        isOpen={isRcloneModalOpen}
        onClose={() => setIsRcloneModalOpen(false)}
        credentials={credentials}
      />

      {/* Upload to Cloudflare R2 Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Upload Files to Cloudflare R2</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Bucket: <span className="text-amber-400">{credentials.bucket}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition disabled:opacity-30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Destination Path Input */}
              <div>
                <label className="text-zinc-300 font-mono font-medium block mb-1">
                  Target Destination Prefix / Folder (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={uploadDestinationPrefix}
                    onChange={(e) => setUploadDestinationPrefix(e.target.value)}
                    placeholder="e.g. backups/ or leave empty for root"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                  Files will be uploaded to: s3://{credentials.bucket}/{uploadDestinationPrefix || '(root)/'}
                </span>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropFiles}
                className="border-2 border-dashed border-zinc-700 hover:border-amber-500/60 bg-zinc-950/60 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
                onClick={() => {
                  const input = document.getElementById('r2-file-input') as HTMLInputElement;
                  if (input) input.click();
                }}
              >
                <input
                  id="r2-file-input"
                  type="file"
                  multiple
                  onChange={handleFileSelection}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">
                    Drag & Drop files here, or <span className="text-amber-400 underline">Browse Local Files</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Supports any file type (Images, Videos, SQL Dumps, ZIP, Documents, Code)
                  </p>
                </div>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-semibold text-zinc-300">
                      Selected Files ({selectedFiles.length})
                    </span>
                    <span className="font-mono text-[11px]">
                      Total: {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                    {selectedFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded text-zinc-200 font-mono text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 truncate max-w-[80%]">
                          <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-zinc-500 text-[10px]">{formatBytes(f.size)}</span>
                          {!isUploading && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(idx);
                              }}
                              className="text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-1.5 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Uploading: {currentUploadingFile}...</span>
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{uploadProgressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-200"
                      style={{ width: `${uploadProgressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error message */}
              {uploadError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Success message */}
              {uploadSuccess && (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-500 font-mono truncate max-w-[200px]">
                {credentials.endpoint ? credentials.endpoint.replace('https://', '') : 'R2 Storage'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-lg text-xs font-semibold transition disabled:opacity-40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUploading || selectedFiles.length === 0}
                  onClick={handleUploadFilesToR2}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-zinc-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload {selectedFiles.length > 0 ? `(${selectedFiles.length}) Files` : ''}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-rose-500/40 rounded-2xl p-5 shadow-2xl text-left space-y-3">
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Object from R2?</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-mono bg-zinc-950 p-2.5 rounded border border-zinc-800 break-all">
              {deleteConfirmKey}
            </p>
            <p className="text-[11px] text-zinc-400">
              This action is permanent and cannot be undone on Cloudflare R2.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmKey(null)}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteObject(deleteConfirmKey)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
