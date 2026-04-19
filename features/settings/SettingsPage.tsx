
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumModal from '../../shared/components/PremiumModal';
import Icon from '../../shared/components/Icon';
import { useSettings } from '../../shared/hooks/useSettings';
import { useToast } from '../../shared/context/ToastContext';
import { backupService, BackupData } from '../../core/storage/backupService';
import { auditLogService, logAction } from '../../core/storage/services';
import { AuditLogEntry } from '../../types';
import { aiManager } from '../../core/ai/aiManager';

/* ------------------------------------------------------------------ */
/* Small presentational helpers (kept inside the file to avoid        */
/* introducing new public components for this design pass).            */
/* ------------------------------------------------------------------ */

const SectionLabel: React.FC<{ children: React.ReactNode; tone?: 'default' | 'danger' }> = ({ children, tone = 'default' }) => (
  <h3
    className={`font-sans text-[10px] font-semibold uppercase tracking-[0.18em] mt-6 mb-2 ml-1 ${
      tone === 'danger' ? 'text-primary' : 'text-text-secondary'
    }`}
  >
    {children}
  </h3>
);

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative w-10 h-[22px] transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
      checked ? 'bg-primary' : 'bg-border'
    }`}
  >
    <span
      className={`absolute top-[2px] w-[18px] h-[18px] bg-background rounded-full transition-all ${
        checked ? 'left-[20px]' : 'left-[2px]'
      }`}
    />
  </button>
);

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, clearAllData, isLoading, refreshSettings } = useSettings();
  const toast = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // AI Keys state
  const [apiKeysInput, setApiKeysInput] = useState('');
  const [isEditingAi, setIsEditingAi] = useState(false);
  const [isTestingKeys, setIsTestingKeys] = useState(false);
  const [testProgress, setTestProgress] = useState('');

  // Storage Stats
  const [storageUsage, setStorageUsage] = useState<{ usage: number; quota: number } | null>(null);

  // Import
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Audit Log
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    backupService.estimateUsage().then(setStorageUsage);
    sessionStorage.removeItem('import_success_msg');
    if (settings.geminiApiKeys) {
      setApiKeysInput(settings.geminiApiKeys.join('\n'));
      aiManager.setKeys(settings.geminiApiKeys);
    }
  }, [settings.geminiApiKeys]);

  const loadAuditLogs = async () => {
    try {
      const logs = await auditLogService.getAll();
      setAuditLogs(logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100));
      setShowAuditLog(true);
    } catch (e) {
      toast.error('Failed to load logs');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-text-secondary">Loading settings…</p>
      </div>
    );
  }

  const handleClearData = async () => {
    await clearAllData();
    setShowClearConfirm(false);
    toast.success('All data cleared successfully');
    logAction('delete', 'system', 'all_data');
    backupService.estimateUsage().then(setStorageUsage);
  };

  const saveUrl = async () => {
    if (serverUrl.trim()) {
      await updateSettings({ railwayBaseUrl: serverUrl.trim() });
      setIsEditingUrl(false);
      toast.success('Server URL updated');
    }
  };

  const saveAiKeys = async () => {
    const keys = apiKeysInput.split('\n').map(k => k.trim()).filter(Boolean);
    await updateSettings({ geminiApiKeys: keys });
    aiManager.setKeys(keys);
    setIsEditingAi(false);
    toast.success(`${keys.length} API keys updated`);
  };

  const handleTestApiKeys = async () => {
    const keys = apiKeysInput.split('\n').map(k => k.trim()).filter(Boolean);

    if (keys.length === 0) {
      toast.error('Please add an API key first');
      return;
    }

    setIsTestingKeys(true);
    setTestProgress('Testing...');

    try {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        setTestProgress(`Checking ${i + 1}/${keys.length}...`);
        await new Promise(resolve => setTimeout(resolve, 100));
        const isWorking = await aiManager.testKey(key);
        if (isWorking) successCount++;
        else failCount++;
      }

      if (failCount === 0) {
        toast.success(`All ${successCount} keys are working`);
      } else if (successCount === 0) {
        toast.error(`All ${failCount} keys failed or timed out`);
      } else {
        toast.info(`${successCount} working, ${failCount} failed`);
      }
    } catch (err: any) {
      console.error('Test Error:', err);
      const msg = err.message || '';
      if (msg.includes('Requested entity was not found')) {
        toast.error('Entity not found. Please re-select key.');
        if ((window as any).aistudio?.openSelectKey) {
          (window as any).aistudio.openSelectKey();
        }
      } else {
        toast.error(`Test stopped: ${msg}`);
      }
    } finally {
      setIsTestingKeys(false);
      setTestProgress('');
    }
  };

  const handleTestConnection = async () => {
    const urlToTest = serverUrl.trim() || settings.railwayBaseUrl;
    if (!urlToTest) {
      toast.error('No URL configured');
      return;
    }

    setIsTestingConnection(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        await fetch(urlToTest, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
        });
        toast.success('PDF server reachable');
      } catch (e: any) {
        if (e.name === 'AbortError') throw new Error('Connection timed out');
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Connection failed: ${e.message || 'Network error'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await backupService.exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `fs-pdf-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await updateSettings({ lastBackupTimestamp: Date.now() });
      logAction('export', 'system', 'backup');
      toast.success('Backup exported successfully');
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) throw new Error('Empty file');

        const json = JSON.parse(text);
        if (!json.version || !json.data) throw new Error('Invalid backup format');

        setPendingImport(json);
        setShowImportConfirm(true);
      } catch (e) {
        console.error(e);
        toast.error('Invalid backup file');
        setPendingImport(null);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async (mode: 'merge' | 'replace') => {
    if (!pendingImport) return;
    setIsImporting(true);

    try {
      const data = pendingImport.data || {};
      const docsCount = data['documents']?.length || 0;
      let mcqsCount = 0;
      if (Array.isArray(data['documents'])) {
        mcqsCount += data['documents'].reduce((acc: number, doc: any) => acc + (doc.mcqs?.length || 0), 0);
      }
      if (Array.isArray(data['mcqSets'])) {
        mcqsCount += data['mcqSets'].reduce((acc: number, set: any) => acc + (set.mcqs?.length || 0), 0);
      }

      await backupService.importData(pendingImport, mode);

      const parts = [];
      if (docsCount > 0) parts.push(`${docsCount} docs`);
      if (mcqsCount > 0) parts.push(`${mcqsCount} mcqs`);

      const details = parts.length > 0 ? `Imported: ${parts.join(', ')}` : 'Import completed';

      await refreshSettings();
      backupService.estimateUsage().then(setStorageUsage);
      logAction('import', 'system', 'backup', mode);

      toast.success(details);
      setShowImportConfirm(false);
      setPendingImport(null);
    } catch (e: any) {
      console.error(e);
      toast.error(`Import failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePct = storageUsage
    ? Math.min(100, (storageUsage.usage / Math.max(1, storageUsage.quota)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-16 pt-[56px] font-serif text-text-primary">
      {/* Compact header without the redundant home button (back already returns home). */}
      <header className="fixed top-0 left-0 right-0 h-[56px] bg-background border-b border-border/60 z-50 px-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="p-2 -ml-2 text-text-primary hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors active:scale-95"
        >
          <Icon name="arrow-left" size="sm" strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-medium tracking-tight">Settings</h1>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-4">
        {/* GENERAL ----------------------------------------------------- */}
        <SectionLabel>General</SectionLabel>
        <div className="bg-surface border border-border">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="text-[14px] font-medium">Sound Effects</span>
            <Toggle
              checked={!!settings.soundEnabled}
              onChange={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              label="Sound effects"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[14px] font-medium">Vibration</span>
            <Toggle
              checked={!!settings.vibrationEnabled}
              onChange={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
              label="Vibration"
            />
          </div>
        </div>

        {/* GEMINI AI --------------------------------------------------- */}
        <SectionLabel>Gemini AI Configuration</SectionLabel>
        <div className="bg-surface border border-border p-4">
          {/* Model Selection */}
          <div className="mb-4 pb-4 border-b border-border/60">
            <label
              htmlFor="ai-model"
              className="block text-[14px] font-medium mb-2"
            >
              Preferred AI Model
            </label>
            <div className="relative">
              <select
                id="ai-model"
                value={settings.preferredModel || 'gemini-3-flash-preview'}
                onChange={e => updateSettings({ preferredModel: e.target.value })}
                className="w-full bg-background border border-border text-text-primary p-3 pr-10 appearance-none focus:outline-none focus:border-primary font-serif text-[14px] font-medium"
              >
                <option value="gemini-3-flash-preview">Gemini 3.0 Flash Preview (Recommended)</option>
                <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview (Fastest)</option>
                <option value="gemini-search-grounding">Gemini Grounded with Web Search</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                <Icon name="chevron-left" size="sm" className="-rotate-90" strokeWidth={1.5} />
              </div>
            </div>
            <p className="font-sans text-[11px] font-medium text-text-secondary mt-2">
              Used across all AI features.
            </p>
          </div>

          <div className="flex justify-between items-center mb-3">
            <span className="text-[14px] font-medium">Gemini API Keys</span>
            <button
              onClick={() => setIsEditingAi(!isEditingAi)}
              className="font-sans text-[11px] font-semibold uppercase tracking-widest text-primary hover:text-primary-700 focus:outline-none focus-visible:underline transition-colors"
            >
              {isEditingAi ? 'Cancel' : 'Edit Keys'}
            </button>
          </div>

          {isEditingAi ? (
            <div className="animate-fade-in">
              <p className="font-sans text-[11px] font-medium text-text-secondary mb-2">
                Enter multiple keys (one per line) for automatic rotation.
              </p>
              <textarea
                value={apiKeysInput}
                onChange={e => setApiKeysInput(e.target.value)}
                rows={4}
                className="w-full bg-background border border-border p-3 text-[13px] font-mono outline-none focus:border-primary resize-none mb-3"
                placeholder="Paste your Gemini keys here..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleTestApiKeys}
                  disabled={!apiKeysInput.trim() || isTestingKeys}
                  className="flex-1 bg-background border border-border text-text-primary py-2.5 font-sans text-[11px] font-semibold uppercase tracking-widest hover:bg-surface disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors"
                >
                  {isTestingKeys ? testProgress || 'Testing...' : 'Test Keys'}
                </button>
                <button
                  onClick={saveAiKeys}
                  className="flex-1 bg-primary text-surface py-2.5 font-sans text-[11px] font-semibold uppercase tracking-widest hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors"
                >
                  Save Keys
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-background border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 flex-shrink-0 bg-surface border border-border flex items-center justify-center text-text-primary">
                  <Icon name="sparkles" size="sm" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <span className="text-[14px] font-medium block leading-tight">
                    {settings.geminiApiKeys?.length || 0} Keys Active
                  </span>
                  <p className="font-sans text-[11px] font-medium text-text-secondary">
                    Rotation enabled
                  </p>
                </div>
              </div>
              <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  (settings.geminiApiKeys?.length || 0) > 0 ? 'bg-primary' : 'bg-border'
                }`}
              />
            </div>
          )}
        </div>

        {/* DATA MANAGEMENT --------------------------------------------- */}
        <SectionLabel>Data Management</SectionLabel>
        <div className="bg-surface border border-border p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[14px] font-medium">Storage Usage</span>
            <span className="font-sans text-[11px] font-semibold text-text-secondary uppercase tracking-widest">
              {storageUsage
                ? `${formatBytes(storageUsage.usage)} / ${formatBytes(storageUsage.quota)}`
                : '...'}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Storage used"
            aria-valuenow={Math.round(usagePct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 bg-border overflow-hidden mb-4"
          >
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${usagePct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 bg-background border border-border text-text-primary px-3 py-3 font-sans text-[11px] font-semibold uppercase tracking-widest hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-95 transition-all"
            >
              <Icon name="download" size="sm" strokeWidth={1.5} />
              Export
            </button>
            <label className="flex items-center justify-center gap-2 bg-background border border-border text-text-primary px-3 py-3 font-sans text-[11px] font-semibold uppercase tracking-widest hover:bg-surface focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface active:scale-95 transition-all cursor-pointer">
              <input type="file" accept=".json" onChange={handleFileSelect} className="sr-only" />
              <Icon name="upload" size="sm" strokeWidth={1.5} />
              Import
            </label>
          </div>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/60">
            <span className="font-sans text-[11px] font-medium text-text-secondary">
              Last backup:{' '}
              {settings.lastBackupTimestamp
                ? new Date(settings.lastBackupTimestamp).toLocaleDateString()
                : 'Never'}
            </span>
            <button
              onClick={loadAuditLogs}
              className="font-sans text-[11px] font-semibold uppercase tracking-widest text-primary hover:text-primary-700 focus:outline-none focus-visible:underline transition-colors"
            >
              View Logs
            </button>
          </div>
        </div>

        {/* ADVANCED ---------------------------------------------------- */}
        <SectionLabel>Advanced</SectionLabel>
        <div className="bg-surface border border-border p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[14px] font-medium">PDF Server URL</span>
            <button
              onClick={() => {
                setServerUrl(settings.railwayBaseUrl || '');
                setIsEditingUrl(!isEditingUrl);
              }}
              className="font-sans text-[11px] font-semibold uppercase tracking-widest text-primary hover:text-primary-700 focus:outline-none focus-visible:underline transition-colors"
            >
              {isEditingUrl ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditingUrl ? (
            <div className="flex gap-2 mb-3">
              <input
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                aria-label="PDF server URL"
                className="flex-1 bg-background border border-border p-2.5 text-[13px] font-mono outline-none focus:border-primary"
                placeholder="https://..."
              />
              <button
                onClick={saveUrl}
                className="bg-primary text-surface px-4 font-sans text-[11px] font-semibold uppercase tracking-widest hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="bg-background border border-border px-3 py-2.5 text-[13px] text-text-secondary font-mono mb-3 truncate select-all">
              {settings.railwayBaseUrl || 'Not configured'}
            </div>
          )}

          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="w-full bg-background border border-border text-text-primary py-2.5 font-sans text-[11px] font-semibold uppercase tracking-widest hover:bg-surface disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* DANGER ZONE ------------------------------------------------- */}
        <SectionLabel tone="danger">Danger Zone</SectionLabel>
        <div className="bg-surface border border-primary/30 border-l-2 border-l-primary p-4 mb-8">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <div className="flex flex-col items-start">
              <span className="font-sans text-[12px] font-semibold uppercase tracking-widest text-primary">
                Reset Application
              </span>
              <span className="font-sans text-[11px] font-medium text-text-secondary mt-0.5">
                Permanently delete all data
              </span>
            </div>
            <Icon
              name="trash-2"
              size="sm"
              strokeWidth={1.5}
              className="text-primary opacity-60 group-hover:opacity-100 transition-opacity"
            />
          </button>
        </div>
      </main>

      {/* MODALS ------------------------------------------------------- */}
      <PremiumModal isOpen={showAuditLog} onClose={() => setShowAuditLog(false)} title="Activity Log" size="lg">
        <div className="max-h-[60vh] overflow-y-auto space-y-2 p-1">
          {auditLogs.length === 0 ? (
            <p className="text-center text-text-secondary py-10 font-sans text-sm">No recent activity recorded.</p>
          ) : (
            auditLogs.map(log => (
              <div key={log.id} className="px-3 py-2.5 bg-background border border-border flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-text-primary capitalize text-[14px] leading-tight">
                    {log.action} <span className="text-text-secondary font-normal">{log.entity}</span>
                  </div>
                  <div className="text-[11px] text-text-secondary font-mono bg-surface px-2 py-0.5 border border-border inline-block mt-1.5 truncate max-w-full">
                    {log.details ? log.details : log.entityId?.slice(0, 8)}
                  </div>
                </div>
                <div className="font-sans text-[10px] text-text-secondary tracking-widest uppercase whitespace-nowrap mt-0.5">
                  {new Date(log.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </PremiumModal>

      <PremiumModal
        isOpen={showImportConfirm}
        onClose={() => {
          if (!isImporting) {
            setShowImportConfirm(false);
            setPendingImport(null);
          }
        }}
        title={isImporting ? 'Importing...' : 'Import Backup'}
        size="sm"
      >
        <div className="space-y-5">
          {!isImporting && (
            <p className="font-serif text-[14px] leading-relaxed">
              This backup contains data from{' '}
              <span className="font-semibold">
                {pendingImport && new Date(pendingImport.timestamp).toLocaleDateString()}
              </span>
              . How would you like to import it?
            </p>
          )}
          {isImporting && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-9 h-9 border border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-text-secondary">
                Processing backup...
              </p>
            </div>
          )}
          {!isImporting && (
            <div className="space-y-2">
              <button
                onClick={() => confirmImport('merge')}
                className="w-full p-4 bg-background border border-border hover:bg-surface flex flex-col items-start transition-all active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <span className="font-medium flex items-center gap-3 text-[14px]">
                  <Icon name="layout-grid" size="sm" className="text-primary" strokeWidth={1.5} /> Merge Data
                </span>
                <span className="font-sans text-[11px] text-text-secondary mt-1.5 ml-7">
                  Keep existing data and add new items (Safe)
                </span>
              </button>
              <button
                onClick={() => confirmImport('replace')}
                className="w-full p-4 bg-surface border border-primary/30 border-l-2 border-l-primary hover:border-primary flex flex-col items-start transition-all active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <span className="font-medium text-primary flex items-center gap-3 text-[14px]">
                  <Icon name="refresh-cw" size="sm" strokeWidth={1.5} /> Replace All
                </span>
                <span className="font-sans text-[11px] text-text-secondary mt-1.5 ml-7">
                  Delete current data and restore backup
                </span>
              </button>
            </div>
          )}
        </div>
      </PremiumModal>

      <PremiumModal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear All Data?" size="sm">
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center p-5 bg-surface border border-primary/30 border-l-2 border-l-primary">
            <div className="w-11 h-11 bg-background border border-border flex items-center justify-center text-primary mb-3">
              <Icon name="alert-triangle" size="md" strokeWidth={1.5} />
            </div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-widest text-primary">
              This action cannot be undone.
            </p>
          </div>
          <p className="font-serif text-[14px] leading-relaxed text-center">
            Are you sure you want to delete all data? This includes documents, topics, and settings.
          </p>
          <div className="flex gap-3 pt-3 border-t border-border/60">
            <button
              className="flex-1 bg-surface border border-border py-3 font-sans text-[11px] font-semibold uppercase tracking-widest hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-primary text-surface py-3 font-sans text-[11px] font-semibold uppercase tracking-widest hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors"
              onClick={handleClearData}
            >
              Delete
            </button>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
};

export default SettingsPage;
