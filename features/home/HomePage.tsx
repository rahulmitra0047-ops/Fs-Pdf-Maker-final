
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PremiumCard from '../../shared/components/PremiumCard';
import { Document } from '../../types';
import { documentService } from '../../core/storage/services';
import { backupService } from '../../core/storage/backupService';
import Logo from '../../shared/components/Logo';
import Icon from '../../shared/components/Icon';
import { useSettings } from '../../shared/hooks/useSettings';
import GlobalSearchModal from '../../shared/components/GlobalSearchModal';
import { useToast } from '../../shared/context/ToastContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings(); 
  const toast = useToast();
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  
  // New State
  const [showSearch, setShowSearch] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  useEffect(() => {
    // Set greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const fetchDocs = async () => {
      try {
        const docs = await documentService.getAll();
        const sorted = docs.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
        setRecentDocs(sorted);
      } catch (e) {
        console.error("Failed to fetch recent docs", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  // Check Backup Status
  useEffect(() => {
    if (isLoading) return;
    
    // Check if backup is due (7 days)
    const lastBackup = settings.lastBackupTimestamp;
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    
    if (!lastBackup || (now - lastBackup > SEVEN_DAYS)) {
        setShowBackupReminder(true);
    } else {
        setShowBackupReminder(false);
    }
  }, [settings.lastBackupTimestamp, isLoading]);

  const handleQuickBackup = async () => {
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
          toast.success('Backup complete!');
          setShowBackupReminder(false);
      } catch (e) {
          console.error(e);
          toast.error('Backup failed');
      }
  };

  return (
    <div className="page-shell bg-[#FAFAFA]">
      
      {/* Header - White, Minimal, Sticky */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between transition-shadow duration-300">
        <Logo variant="text" size="md" />
        <div className="flex gap-2">
            <button 
              onClick={() => setShowSearch(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-50 transition-colors active:scale-95"
            >
              <Icon name="search" size="lg" />
            </button>
            <Link 
              to="/settings"
              className="w-11 h-11 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-50 transition-colors active:scale-95"
            >
              <Icon name="settings" size="lg" />
            </Link>
        </div>
      </header>

      <main className="content-container animate-fade-in">
        
        {/* Greeting Section - Clean Typography */}
        <div className="pt-2">
          <h1 className="text-[32px] font-bold text-[#0f0f0f] leading-tight tracking-tight">
            {greeting}, Creator
          </h1>
          <p className="text-[14px] font-normal text-gray-400 mt-2">
            Ready to create something amazing today?
          </p>
        </div>

        {/* Backup Reminder - Amber Card */}
        {showBackupReminder && (
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-2xl p-4 flex items-center justify-between animate-slide-up">
                <div className="flex items-center gap-3">
                    <div className="text-amber-500">
                        <Icon name="alert-triangle" size="md" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-amber-900">Backup Pending</h4>
                        <p className="text-xs text-amber-700/80 mt-0.5">Data is stored locally</p>
                    </div>
                </div>
                <button 
                    onClick={handleQuickBackup}
                    className="px-4 py-2 bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl hover:bg-amber-200 active:scale-95 transition-all"
                >
                    Backup Now
                </button>
            </div>
        )}

        {/* Main Action Cards - Pure White & Minimal */}
        <div className="flex flex-col gap-[14px] mt-2">
          <div className="animate-slide-up delay-100">
            <PremiumCard 
              variant="flat"
              onClick={() => navigate('/create')}
              className="!bg-white border !border-[#F3F4F6] !rounded-[20px] !shadow-[0_1px_2px_rgba(0,0,0,0.04)] !p-5 active:scale-[0.98] transition-transform duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Monochrome Indigo Icon */}
                  <div className="text-[#6366F1]">
                    <Icon name="file-text" size="lg" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-gray-900 leading-tight">Create PDF</h3>
                    <p className="text-[13px] font-normal text-gray-400 mt-1">Build professional MCQ books</p>
                  </div>
                </div>
                {/* Minimal Arrow */}
                <div className="text-gray-300">
                   <Icon name="chevron-right" size="md" />
                </div>
              </div>
            </PremiumCard>
          </div>

          <div className="animate-slide-up delay-200">
            <PremiumCard 
              variant="flat"
              onClick={() => navigate('/live-mcq')}
              className="!bg-white border !border-[#F3F4F6] !rounded-[20px] !shadow-[0_1px_2px_rgba(0,0,0,0.04)] !p-5 active:scale-[0.98] transition-transform duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-[#6366F1]">
                    <Icon name="target" size="lg" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-gray-900 leading-tight">Live MCQ</h3>
                    <p className="text-[13px] font-normal text-gray-400 mt-1">Practice sets & exams</p>
                  </div>
                </div>
                <div className="text-gray-300">
                   <Icon name="chevron-right" size="md" />
                </div>
              </div>
            </PremiumCard>
          </div>

          <div className="animate-slide-up delay-300">
            <PremiumCard 
              variant="flat"
              onClick={() => navigate('/recent')}
              className="!bg-white border !border-[#F3F4F6] !rounded-[20px] !shadow-[0_1px_2px_rgba(0,0,0,0.04)] !p-5 active:scale-[0.98] transition-transform duration-150 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-[#6366F1]">
                    <Icon name="clock" size="lg" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-gray-900 leading-tight">Recent Files</h3>
                    <p className="text-[13px] font-normal text-gray-400 mt-1">
                      {isLoading ? 'Checking storage...' : `${recentDocs.length} documents stored`}
                    </p>
                  </div>
                </div>
                <div className="text-gray-300">
                   <Icon name="chevron-right" size="md" />
                </div>
              </div>
            </PremiumCard>
          </div>
        </div>

        {/* Recent Section */}
        <div className="animate-slide-up delay-300 mt-8">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[13px] font-semibold text-gray-400 tracking-wide title-case">Quick Access</h3>
             {recentDocs.length > 0 && (
               <Link to="/recent" className="text-[13px] text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
                 View All
               </Link>
             )}
          </div>
          
          {recentDocs.length > 0 ? (
            <div className="overflow-x-auto pb-4 -mx-5 px-5 flex gap-4 scrollbar-hide snap-x">
              {recentDocs.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => navigate(`/create/${doc.id}`)}
                  className="flex-shrink-0 w-[160px] snap-start"
                >
                  <div className="h-full bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all cursor-pointer min-h-[140px] flex flex-col justify-between group">
                     <div>
                       <div className="text-indigo-500 mb-3">
                         <Icon name="file-text" size="md" />
                       </div>
                       <h4 className="font-semibold text-[14px] text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
                         {doc.title || "Untitled Doc"}
                       </h4>
                       <p className="text-[11px] text-gray-400">
                         {doc.mcqs?.length || 0} Questions
                       </p>
                     </div>
                     <div className="text-[10px] font-medium text-gray-300 pt-3 mt-auto">
                       {new Date(doc.updatedAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             /* Empty State - Refined */
             <div className="py-10 bg-[#FAFAFA] rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                <div className="text-gray-300 mb-3 opacity-50">
                    <Icon name="folder" size="xl" />
                </div>
                <p className="text-[16px] font-semibold text-gray-700">No documents yet</p>
                <p className="text-[13px] text-gray-400 mb-5 mt-1">Start by creating your first MCQ PDF</p>
                <button 
                    onClick={() => navigate('/create')}
                    className="text-[14px] font-medium text-indigo-500 bg-transparent border-[1.5px] border-indigo-500 px-6 py-2.5 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all"
                >
                    + Create New
                </button>
             </div>
          )}
        </div>
      </main>

      <GlobalSearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
};

export default HomePage;
