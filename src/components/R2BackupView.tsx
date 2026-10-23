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
} from 'lucide-react';
import JSZip from 'jszip';
import { R2Credentials, R2ObjectItem, R2BackupProgress } from '../types/r2';
import { RcloneConfigModal } from './RcloneConfigModal';
import { triggerFileDownload } from '../utils/zipPackager';

const STORAGE_KEY = 'r2_cloner_credentials';

export const R2BackupView: React.FC = () => {
  // Credentials state
  const [credentials, setCredentials] = useState<R2Credentials>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      accessKeyId: '',
      secretAccessKey: '',
      endpoint: '',
      bucket: '',
    };
  });

  const [rememberCredentials, setRememberCredentials] = useState<boolean>(true);
  const [showSecret, setShowSecret] = useState<boolean>(false);

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

  // Save credentials to localStorage if toggle enabled
  useEffect(() => {
    if (rememberCredentials && (credentials.accessKeyId || credentials.endpoint)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
      } catch {
        // ignore
      }
    }
  }, [credentials, rememberCredentials]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
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
          <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberCredentials}
              onChange={(e) => setRememberCredentials(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-800 text-amber-500 focus:ring-0"
            />
            <span>Remember credentials in browser storage</span>
          </label>

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
            <div className="p-8 text-center text-zinc-600 text-xs space-y-2">
              <FolderTree className="w-8 h-8 mx-auto text-zinc-700" />
              <p>
                {credentials.bucket
                  ? 'No objects found in this bucket/prefix. Click "Connect & List" or upload files.'
                  : 'Enter your credentials above and click "Connect & List" to view and backup files.'}
              </p>
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
                        <a
                          href={`/api/r2/download-object?accessKeyId=${encodeURIComponent(
                            credentials.accessKeyId
                          )}&secretAccessKey=${encodeURIComponent(
                            credentials.secretAccessKey
                          )}&endpoint=${encodeURIComponent(
                            credentials.endpoint
                          )}&bucket=${encodeURIComponent(
                            credentials.bucket
                          )}&key=${encodeURIComponent(item.key)}`}
                          download
                          className="text-zinc-500 hover:text-amber-400 p-1 rounded inline-block transition"
                          title="Download single file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
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
    </div>
  );
};
