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

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, clearAllData, isLoading, refreshSettings } = useSettings();
    const toast = useToast();

    // UI States
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [serverUrl, setServerUrl] = useState('');
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    // AI Keys state
    const [apiKeysInput, setApiKeysInput] = useState('');
    const [isEditingAi, setIsEditingAi] = useState(false);
    const [isTestingKeys, setIsTestingKeys] = useState(false);
    const [testProgress, setTestProgress] = useState('');

    // Storage & Backup
    const [storageUsage, setStorageUsage] = useState<{ usage: number, quota: number } | null>(null);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [pendingImport, setPendingImport] = useState<BackupData | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Audit Log
    const [showAuditLog, setShowAuditLog] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

    useEffect(() => {
        backupService.estimateUsage().then(setStorageUsage);
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
            toast.error("Failed to load logs");
        }
    };

    const handleTestApiKeys = async () => {
        const keys = apiKeysInput.split('\n').map(k => k.trim()).filter(Boolean);
        if (keys.length === 0) return toast.error("❌ API Key দিন আগে");

        setIsTestingKeys(true);
        setTestProgress('Testing...');

        try {
            const results = await Promise.all(keys.map(key => aiManager.testKey(key)));
            const successCount = results.filter(Boolean).length;
            const failCount = keys.length - successCount;

            if (failCount === 0) toast.success(`✅ All ${successCount} keys working!`);
            else if (successCount === 0) toast.error(`❌ All ${failCount} keys failed.`);
            else toast.info(`⚠️ ${successCount} working, ${failCount} failed.`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Test failed";
            toast.error(`❌ Test stopped: ${msg}`);
        } finally {
            setIsTestingKeys(false);
            setTestProgress('');
        }
    };

    const handleTestConnection = async () => {
        const urlToTest = serverUrl.trim() || settings.railwayBaseUrl;
        if (!urlToTest) return toast.error("No URL configured");

        setIsTestingConnection(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            await fetch(urlToTest, { method: 'GET', mode: 'cors', signal: controller.signal });
            clearTimeout(timeoutId);
            toast.success("PDF server reachable");
        } catch (e: any) {
            toast.error(`Connection failed: ${e.name === 'AbortError' ? 'Timeout' : 'Network error'}`);
        } finally {
            setIsTestingConnection(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-sm text-slate-400">Loading...</p></div>;

    return (
        <div className="min-h-screen bg-background pb-10 pt-[60px] font-serif text-text-primary">
            {/* Header: Home Button Removed */}
            <header className="fixed top-0 left-0 right-0 h-[60px] bg-background border-b border-border/50 z-50 px-6 flex items-center">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-[#EBE7DF] transition-colors active:scale-95">
                    <Icon name="arrow-left" size="sm" strokeWidth={1.5} />
                </button>
                <h1 className="text-lg font-medium tracking-tight ml-2">Settings</h1>
            </header>

            <main className="max-w-xl mx-auto px-4 mt-4 space-y-6">
                {/* Quick Toggles: Combined for Compactness */}
                <section className="bg-surface border border-border divide-y divide-border/30">
                    {[
                        { label: 'Sound Effects', key: 'soundEnabled' as const },
                        { label: 'Vibration', key: 'vibrationEnabled' as const }
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-4">
                            <span className="text-[15px] font-medium">{item.label}</span>
                            <button 
                                onClick={() => updateSettings({ [item.key]: !settings[item.key] })}
                                className={`w-10 h-5 rounded-full transition-colors relative ${settings[item.key] ? 'bg-primary' : 'bg-[#EBE7DF]'}`}
                            >
                                <div className={`absolute top-[2px] w-4 h-4 bg-background rounded-full transition-all ${settings[item.key] ? 'left-[22px]' : 'left-[2px]'}`} />
                            </button>
                        </div>
                    ))}
                </section>

                {/* AI Config */}
                <section>
                    <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-2 px-1">AI Configuration</h3>
                    <div className="bg-surface border border-border p-4 space-y-4">
                        <div>
                            <label className="block text-[13px] font-medium mb-2">AI Model</label>
                            <div className="relative">
                                <select
                                    value={settings.preferredModel || 'gemini-3-flash-preview'}
                                    onChange={(e) => updateSettings({ preferredModel: e.target.value })}
                                    className="w-full bg-background border border-border p-3 pr-10 appearance-none focus:outline-none focus:border-primary text-sm font-medium"
                                >
                                    <option value="gemini-3-flash-preview">Gemini 3.0 Flash</option>
                                    <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Lite</option>
                                    <option value="gemini-search-grounding">Search Grounding</option>
                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                </select>
                                <Icon name="chevron-left" size="xs" className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none opacity-50" />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-border/30">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[13px] font-medium">API Keys</span>
                                <button onClick={() => setIsEditingAi(!isEditingAi)} className="text-[10px] font-bold uppercase text-primary">
                                    {isEditingAi ? 'Cancel' : 'Edit'}
                                </button>
                            </div>
                            
                            {isEditingAi ? (
                                <div className="space-y-3">
                                    <textarea 
                                        value={apiKeysInput}
                                        onChange={(e) => setApiKeysInput(e.target.value)}
                                        rows={3}
                                        className="w-full bg-background border border-border p-3 text-xs font-mono outline-none focus:border-primary resize-none"
                                        placeholder="Keys (one per line)..."
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleTestApiKeys} disabled={isTestingKeys} className="flex-1 border border-border py-2 text-[10px] font-bold uppercase hover:bg-[#EBE7DF]">
                                            {isTestingKeys ? testProgress : 'Test'}
                                        </button>
                                        <button onClick={async () => {
                                            const keys = apiKeysInput.split('\n').map(k => k.trim()).filter(Boolean);
                                            await updateSettings({ geminiApiKeys: keys });
                                            aiManager.setKeys(keys);
                                            setIsEditingAi(false);
                                            toast.success('Saved');
                                        }} className="flex-1 bg-primary text-surface py-2 text-[10px] font-bold uppercase">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-background border border-border p-3 flex items-center gap-3">
                                    <Icon name="sparkles" size="sm" className="opacity-70" />
                                    <span className="text-xs font-medium">{settings.geminiApiKeys?.length || 0} Keys Active</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Data Management */}
                <section>
                    <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-2 px-1">Storage & Data</h3>
                    <div className="bg-surface border border-border p-4">
                        <div className="flex justify-between text-[11px] mb-2">
                            <span className="font-medium">Usage</span>
                            <span className="text-text-secondary font-mono">
                                {storageUsage ? `${formatBytes(storageUsage.usage)} / ${formatBytes(storageUsage.quota)}` : '...'}
                            </span>
                        </div>
                        <div className="h-1 bg-border rounded-full overflow-hidden mb-5">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(100, (storageUsage?.usage || 0) / (storageUsage?.quota || 1) * 100)}%` }} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={async () => {
                                try {
                                    const data = await backupService.exportAllData();
                                    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `backup-${new Date().toISOString().slice(0,10)}.json`;
                                    a.click();
                                    toast.success('Exported');
                                } catch { toast.error('Export failed'); }
                            }} className="flex items-center justify-center gap-2 border border-border py-3 text-[10px] font-bold uppercase hover:bg-[#EBE7DF]">
                                <Icon name="download" size="xs" /> Export
                            </button>
                            <label className="flex items-center justify-center gap-2 border border-border py-3 text-[10px] font-bold uppercase hover:bg-[#EBE7DF] cursor-pointer">
                                <input type="file" accept=".json" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        try {
                                            const json = JSON.parse(ev.target?.result as string);
                                            setPendingImport(json);
                                            setShowImportConfirm(true);
                                        } catch { toast.error("Invalid file"); }
                                    };
                                    reader.readAsText(file);
                                }} className="hidden" />
                                <Icon name="upload" size="xs" /> Import
                            </label>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/30">
                            <span className="text-[10px] text-text-secondary">
                                Backup: {settings.lastBackupTimestamp ? new Date(settings.lastBackupTimestamp).toLocaleDateString() : 'Never'}
                            </span>
                            <button onClick={loadAuditLogs} className="text-[10px] font-bold text-primary uppercase">Logs</button>
                        </div>
                    </div>
                </section>

                {/* Advanced & Danger */}
                <section className="space-y-4">
                    <div className="bg-surface border border-border p-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[13px] font-medium">Server URL</span>
                            <button onClick={() => setIsEditingUrl(!isEditingUrl)} className="text-[10px] font-bold text-primary uppercase">
                                {isEditingUrl ? 'Cancel' : 'Edit'}
                            </button>
                        </div>
                        {isEditingUrl ? (
                            <div className="flex gap-2 mb-3">
                                <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} className="flex-1 bg-background border border-border p-2 text-xs font-mono" placeholder="URL..." />
                                <button onClick={async () => {
                                    await updateSettings({ railwayBaseUrl: serverUrl.trim() });
                                    setIsEditingUrl(false);
                                    toast.success('Updated');
                                }} className="bg-primary text-surface px-4 text-[10px] font-bold uppercase">Save</button>
                            </div>
                        ) : (
                            <div className="text-[11px] font-mono text-text-secondary mb-3 truncate bg-background p-2 border border-border">
                                {settings.railwayBaseUrl || 'None'}
                            </div>
                        )}
                        <button onClick={handleTestConnection} className="w-full border border-border py-2 text-[10px] font-bold uppercase hover:bg-[#EBE7DF]">
                            {isTestingConnection ? 'Testing...' : 'Test Connection'}
                        </button>
                    </div>

                    <button onClick={() => setShowClearConfirm(true)} className="w-full flex items-center justify-between p-4 bg-primary/5 border border-primary/20 group">
                        <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Reset Application</span>
                        <Icon name="trash-2" size="xs" className="text-primary opacity-60" />
                    </button>
                </section>
            </main>

            {/* Modals are kept the same for full functionality */}
            <PremiumModal isOpen={showAuditLog} onClose={() => setShowAuditLog(false)} title="Activity Log" size="lg">
                <div className="max-h-[50vh] overflow-y-auto space-y-2">
                    {auditLogs.map(log => (
                        <div key={log.id} className="p-3 bg-background border border-border flex justify-between items-center text-[12px]">
                            <div>
                                <p className="font-medium capitalize">{log.action} <span className="text-text-secondary">{log.entity}</span></p>
                                <p className="text-[10px] font-mono opacity-60">{log.details || log.entityId?.slice(0,8)}</p>
                            </div>
                            <span className="text-[9px] text-text-secondary">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    ))}
                </div>
            </PremiumModal>

            {/* Import & Clear Confirm Modals (Abbreviated logic here for space, but fully functional in actual file) */}
            {/* ... [Insert Import/Clear Modals here if needed, keeping them compact] ... */}
            <PremiumModal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear All Data?" size="sm">
                <div className="space-y-4 p-2 text-center">
                    <p className="text-sm">Are you sure? This will delete all documents and settings permanently.</p>
                    <div className="flex gap-3">
                        <button className="flex-1 border border-border py-3 text-[10px] font-bold uppercase" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                        <button className="flex-1 bg-primary text-surface py-3 text-[10px] font-bold uppercase" onClick={async () => {
                            await clearAllData();
                            setShowClearConfirm(false);
                            toast.success('Cleared');
                            navigate('/');
                        }}>Delete All</button>
                    </div>
                </div>
            </PremiumModal>

            <PremiumModal isOpen={showImportConfirm} onClose={() => !isImporting && setShowImportConfirm(false)} title="Import Data" size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-center">How would you like to import the backup?</p>
                    <div className="space-y-2">
                        <button disabled={isImporting} onClick={async () => {
                            setIsImporting(true);
                            await backupService.importData(pendingImport!, 'merge');
                            await refreshSettings();
                            setIsImporting(false);
                            setShowImportConfirm(false);
                            toast.success('Merged');
                        }} className="w-full p-3 border border-border text-left hover:bg-[#EBE7DF]">
                            <p className="text-xs font-bold uppercase">Merge Data</p>
                            <p className="text-[10px] text-text-secondary">Keep existing and add new items</p>
                        </button>
                        <button disabled={isImporting} onClick={async () => {
                            setIsImporting(true);
                            await backupService.importData(pendingImport!, 'replace');
                            await refreshSettings();
                            setIsImporting(false);
                            setShowImportConfirm(false);
                            toast.success('Replaced');
                        }} className="w-full p-3 border border-primary/30 text-left hover:border-primary">
                            <p className="text-xs font-bold uppercase text-primary">Replace All</p>
                            <p className="text-[10px] text-text-secondary">Overwrite everything with backup</p>
                        </button>
                    </div>
                </div>
            </PremiumModal>
        </div>
    );
};

export default SettingsPage;
