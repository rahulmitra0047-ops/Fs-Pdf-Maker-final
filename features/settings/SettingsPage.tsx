import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumInput from '../../shared/components/PremiumInput';
import Icon from '../../shared/components/Icon';
import { useSettings } from '../../shared/hooks/useSettings';
import { useToast } from '../../shared/context/ToastContext';
import { backupService, BackupData } from '../../core/storage/backupService';
import { auditLogService, logAction } from '../../core/storage/services';
import { AuditLogEntry } from '../../types';
import { GoogleGenAI } from "@google/genai";

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
  const [storageUsage, setStorageUsage] = useState<{usage: number, quota: number} | null>(null);
  
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
      }
  }, [settings.geminiApiKeys]);

  const loadAuditLogs = async () => {
      try {
          const logs = await auditLogService.getAll();
          setAuditLogs(logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100)); // Last 100
          setShowAuditLog(true);
      } catch(e) {
          toast.error("Failed to load logs");
      }
  };

  if (isLoading) {
     return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><p className="text-sm text-gray-500">Loading settings...</p></div>;
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
    setIsEditingAi(false);
    toast.success(`${keys.length} API keys updated`);
  };

  const handleTestApiKeys = async () => {
    const keys = apiKeysInput.split('\n').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        toast.error("No keys to test");
        return;
    }

    setIsTestingKeys(true);
    let successCount = 0;
    let failCount = 0;

    try {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            setTestProgress(`Checking ${i + 1}/${keys.length}...`);
            
            // Allow UI to paint
            await new Promise(resolve => setTimeout(resolve, 50));

            try {
                if (!key || key.length < 10) throw new Error("Invalid Key Format");

                const ai = new GoogleGenAI({ apiKey: key });
                
                // 5-second strict timeout race
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Timeout")), 5000)
                );

                const apiPromise = ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [{ text: 'Hello' }] },
                });

                await Promise.race([apiPromise, timeoutPromise]);
                successCount++;
            } catch (e: any) {
                console.warn(`Key ${i + 1} failed:`, e);
                failCount++;
            }
        }

        if (failCount === 0) {
            toast.success(`All ${successCount} keys are working!`);
        } else if (successCount === 0) {
            toast.error(`All ${failCount} keys failed.`);
        } else {
            toast.info(`${successCount} working, ${failCount} failed.`);
        }
    } catch (err) {
        console.error("Test process crashed", err);
        toast.error("Test interrupted.");
    } finally {
        setIsTestingKeys(false);
        setTestProgress('');
    }
  };

  const handleTestConnection = async () => {
      const urlToTest = serverUrl.trim() || settings.railwayBaseUrl;
      if (!urlToTest) {
          toast.error("No URL configured");
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
                  signal: controller.signal 
              });
              toast.success("PDF server reachable");
          } catch (e: any) {
              if (e.name === 'AbortError') throw new Error("Connection timed out");
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
          a.download = `fs-pdf-backup-${new Date().toISOString().slice(0,10)}.json`;
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
      reader.onload = (event) => {
          try {
              const text = event.target?.result as string;
              if (!text || !text.trim()) throw new Error("Empty file");

              const json = JSON.parse(text);
              if (!json.version || !json.data) throw new Error("Invalid backup format");
              
              setPendingImport(json);
              setShowImportConfirm(true);
          } catch (e) {
              console.error(e);
              toast.error("Invalid backup file");
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20 pt-[60px]">
      
      {/* 1. Custom Header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
              <button 
                  onClick={() => navigate('/')} 
                  className="p-2 -ml-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
              >
                  <Icon name="arrow-left" size="md" />
              </button>
          </div>
          <h1 className="text-[18px] font-semibold text-[#111827] absolute left-1/2 -translate-x-1/2 tracking-tight">
              Settings
          </h1>
          <button 
              onClick={() => navigate('/')}
              className="p-2 -mr-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
          >
              <Icon name="home" size="md" />
          </button>
      </header>

      <main className="max-w-3xl mx-auto px-5 mt-4">
        
        {/* 2. Preferences Toggle Card */}
        <div className="bg-white border border-[#F3F4F6] rounded-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Sound */}
            <div className="flex items-center justify-between p-[18px] border-b border-[#F3F4F6]">
                <span className="text-[16px] font-medium text-[#111827]">Sound Effects</span>
                <button 
                    onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`w-[50px] h-[28px] rounded-full transition-colors relative ${settings.soundEnabled ? 'bg-[#6366F1]' : 'bg-[#E5E7EB]'}`}
                >
                    <div className={`absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-sm transition-all ${settings.soundEnabled ? 'left-[25px]' : 'left-[3px]'}`} />
                </button>
            </div>
            {/* Vibration */}
            <div className="flex items-center justify-between p-[18px]">
                <span className="text-[16px] font-medium text-[#111827]">Vibration</span>
                <button 
                    onClick={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
                    className={`w-[50px] h-[28px] rounded-full transition-colors relative ${settings.vibrationEnabled ? 'bg-[#6366F1]' : 'bg-[#E5E7EB]'}`}
                >
                    <div className={`absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-sm transition-all ${settings.vibrationEnabled ? 'left-[25px]' : 'left-[3px]'}`} />
                </button>
            </div>
        </div>

        {/* 3. AI Configuration */}
        <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-[0.5px] mt-[28px] mb-[14px]">Gemini AI Configuration</h3>
        <div className="bg-white border border-[#F3F4F6] rounded-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-[20px]">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[15px] font-medium text-[#111827]">Gemini API Keys</span>
                <button 
                    onClick={() => {
                        setIsEditingAi(!isEditingAi);
                    }}
                    className="text-[13px] font-medium text-[#6366F1]"
                >
                    {isEditingAi ? 'Cancel' : 'Edit Keys'}
                </button>
            </div>
            
            {isEditingAi ? (
                <div className="animate-in fade-in slide-in-from-top-1">
                    <p className="text-[11px] text-gray-400 mb-2">Enter multiple keys (one per line) for automatic rotation.</p>
                    <textarea 
                        value={apiKeysInput}
                        onChange={(e) => setApiKeysInput(e.target.value)}
                        rows={4}
                        className="w-full bg-[#F9FAFB] border border-[#F3F4F6] rounded-[12px] p-[12px] text-[13px] text-[#111827] font-mono outline-none focus:border-[#6366F1] resize-none mb-3"
                        placeholder="Paste your Gemini keys here..."
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={handleTestApiKeys} 
                            disabled={!apiKeysInput.trim() || isTestingKeys}
                            className="flex-1 bg-white border border-[#E5E7EB] text-[#374151] rounded-[10px] py-2 text-[13px] font-medium hover:bg-[#F9FAFB] disabled:opacity-50 transition-colors"
                        >
                            {isTestingKeys ? (testProgress || 'Testing...') : 'Test Keys'}
                        </button>
                        <PremiumButton onClick={saveAiKeys} size="sm" className="flex-1">Save Keys</PremiumButton>
                    </div>
                </div>
            ) : (
                <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[12px] p-[16px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                            <Icon name="sparkles" size="sm" />
                        </div>
                        <div>
                            <span className="text-[14px] font-semibold text-[#111827]">{settings.geminiApiKeys?.length || 0} Keys Active</span>
                            <p className="text-[11px] text-gray-400">Rotation enabled for stability</p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* 4. Data Management */}
        <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-[0.5px] mt-[28px] mb-[14px]">Data Management</h3>
        <div className="bg-white border border-[#F3F4F6] rounded-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-[20px]">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[15px] font-medium text-[#111827]">Storage Usage</span>
                <span className="text-[14px] font-medium text-[#9CA3AF]">
                    {storageUsage ? `${formatBytes(storageUsage.usage)} / ${formatBytes(storageUsage.quota)}` : '...'}
                </span>
            </div>
            {/* Progress Bar */}
            <div className="h-[6px] bg-[#F3F4F6] rounded-[8px] overflow-hidden mb-6">
                <div 
                    className="h-full bg-[#6366F1] rounded-[8px] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (storageUsage?.usage || 0) / (storageUsage?.quota || 1) * 100)}%` }}
                />
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-[12px]">
                <button 
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 bg-transparent border-[1.5px] border-[#E5E7EB] text-[#374151] rounded-[12px] px-5 py-2.5 text-[14px] font-medium active:scale-95 transition-transform hover:bg-gray-50"
                >
                    <Icon name="download" size="sm" className="text-[#6B7280]" /> 
                    Export Backup
                </button>
                <label className="flex items-center justify-center gap-2 bg-transparent border-[1.5px] border-[#E5E7EB] text-[#374151] rounded-[12px] px-5 py-2.5 text-[14px] font-medium active:scale-95 transition-transform hover:bg-gray-50 cursor-pointer">
                    <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
                    <Icon name="upload" size="sm" className="text-[#6B7280]" /> 
                    Import
                </label>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-[14px]">
                <span className="text-[12px] text-[#D1D5DB]">
                    Last backup: {settings.lastBackupTimestamp ? new Date(settings.lastBackupTimestamp).toLocaleDateString() : 'Never'}
                </span>
                <button onClick={loadAuditLogs} className="text-[13px] font-medium text-[#6366F1] hover:underline">
                    View Logs
                </button>
            </div>
        </div>

        {/* 5. Advanced */}
        <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-[0.5px] mt-[28px] mb-[14px]">Advanced</h3>
        <div className="bg-white border border-[#F3F4F6] rounded-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-[20px]">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[15px] font-medium text-[#111827]">PDF Server URL</span>
                <button 
                    onClick={() => {
                        setServerUrl(settings.railwayBaseUrl || '');
                        setIsEditingUrl(!isEditingUrl);
                    }}
                    className="text-[13px] font-medium text-[#6366F1]"
                >
                    {isEditingUrl ? 'Cancel' : 'Edit'}
                </button>
            </div>
            
            {isEditingUrl ? (
                <div className="mb-4">
                    <div className="flex gap-2 mb-3">
                        <input 
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            className="flex-1 bg-[#F9FAFB] border border-[#F3F4F6] rounded-[10px] p-[12px] text-[13px] text-[#111827] font-mono outline-none focus:border-[#6366F1]"
                            placeholder="https://..."
                        />
                        <button onClick={saveUrl} className="bg-[#6366F1] text-white px-4 rounded-[10px] text-[13px] font-medium">Save</button>
                    </div>
                </div>
            ) : (
                <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[10px] p-[12px] text-[13px] text-[#6B7280] font-mono mb-4 truncate select-all">
                    {settings.railwayBaseUrl || 'Not configured'}
                </div>
            )}
            
            <button 
                onClick={handleTestConnection} 
                className="w-full bg-transparent border-[1.5px] border-[#E5E7EB] text-[#374151] rounded-[12px] px-5 py-2.5 text-[14px] font-medium active:scale-95 transition-transform hover:bg-gray-50 flex items-center justify-center gap-2"
            >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>
        </div>

        {/* 6. Danger Zone */}
        <h3 className="text-[13px] font-semibold text-[#EF4444] tracking-[0.5px] mt-[28px] mb-[14px]">Danger Zone</h3>
        <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-[18px] p-[18px]">
            <button 
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-between group"
            >
               <span className="text-[15px] font-medium text-[#EF4444]">Reset Application</span>
               <Icon name="trash-2" size="md" className="text-[#EF4444]" />
            </button>
        </div>

      </main>

      {/* Audit Log Modal */}
      <PremiumModal
        isOpen={showAuditLog}
        onClose={() => setShowAuditLog(false)}
        title="Activity Log"
        size="lg"
      >
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {auditLogs.length === 0 ? (
                  <p className="text-center text-slate-400 py-8 text-sm">No recent activity recorded.</p>
              ) : (
                  auditLogs.map(log => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-start text-sm">
                          <div>
                              <div className="font-semibold text-slate-800 capitalize">
                                  {log.action} <span className="text-slate-500 font-normal">{log.entity}</span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100 inline-block">
                                  {log.details ? log.details : log.entityId?.slice(0,8)}
                              </div>
                          </div>
                          <div className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
                              {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                          </div>
                      </div>
                  ))
              )}
          </div>
      </PremiumModal>

      {/* Import Confirmation Modal */}
      <PremiumModal
        isOpen={showImportConfirm}
        onClose={() => { if(!isImporting) { setShowImportConfirm(false); setPendingImport(null); } }}
        title={isImporting ? "Importing..." : "Import Backup"}
        size="sm"
      >
          <div className="space-y-4">
              {!isImporting && (
                  <p className="text-slate-600 text-sm">
                      This backup contains data from <span className="font-bold">{pendingImport && new Date(pendingImport.timestamp).toLocaleDateString()}</span>.
                      How would you like to import it?
                  </p>
              )}
              
              {isImporting && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-slate-500 font-medium">Processing backup file...</p>
                  </div>
              )}

              {!isImporting && (
                  <div className="space-y-2">
                      <button 
                        onClick={() => confirmImport('merge')}
                        className="w-full p-4 border border-slate-200 rounded-xl hover:bg-slate-50 flex flex-col items-start transition-all active:scale-[0.98]"
                      >
                          <span className="font-bold text-slate-800 flex items-center gap-2">
                              <Icon name="layout-grid" size="sm" className="text-indigo-600" /> Merge Data
                          </span>
                          <span className="text-xs text-slate-500 mt-1">Keep existing data and add new items (Safe)</span>
                      </button>
                      <button 
                        onClick={() => confirmImport('replace')}
                        className="w-full p-4 border border-red-200 bg-red-50/50 rounded-xl hover:bg-red-50 flex flex-col items-start transition-all active:scale-[0.98]"
                      >
                          <span className="font-bold text-red-700 flex items-center gap-2">
                              <Icon name="refresh-cw" size="sm" /> Replace All
                          </span>
                          <span className="text-xs text-red-600 mt-1">Delete current data and restore backup</span>
                      </button>
                  </div>
              )}
          </div>
      </PremiumModal>

      {/* Clear Data Confirmation Modal */}
      <PremiumModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Data?"
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center p-4 bg-red-50 rounded-xl border border-red-100">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500 mb-3 shadow-sm">
                 <Icon name="alert-triangle" size="lg" />
             </div>
             <p className="text-sm text-red-800 font-medium">This action cannot be undone.</p>
          </div>
          <p className="text-sm text-slate-500 text-center">
            Are you sure you want to delete all data? This includes documents, topics, and settings.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <PremiumButton variant="ghost" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </PremiumButton>
            <PremiumButton variant="danger" onClick={handleClearData}>
              Yes, Delete Everything
            </PremiumButton>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
};

export default SettingsPage;