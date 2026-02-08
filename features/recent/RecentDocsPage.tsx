
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService, logAction } from '../../core/storage/services';
import { Document } from '../../types';
import PremiumCard from '../../shared/components/PremiumCard';
import { useToast } from '../../shared/context/ToastContext';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumInput from '../../shared/components/PremiumInput';
import MergeConfigModal from './components/MergeConfigModal';
import { useDebounce } from '../../shared/hooks/useDebounce';
import Icon from '../../shared/components/Icon';

const RecentDocsPage: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false); // Feature C
  const navigate = useNavigate();
  const toast = useToast();

  // Deletion & Rename States
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [docToRename, setDocToRename] = useState<Document | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Merge States
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]); 
  const [showMergeModal, setShowMergeModal] = useState(false);

  const loadDocs = async () => {
    try {
      const all = await documentService.getAll();
      const sorted = all.sort((a, b) => b.updatedAt - a.updatedAt);
      setDocs(sorted);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  useEffect(() => {
    let result = docs;
    
    // Archive Filter
    if (showArchived) {
        result = result.filter(d => d.isArchived);
    } else {
        result = result.filter(d => !d.isArchived);
    }

    if (debouncedSearch.trim()) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(lower) || d.id.toLowerCase().includes(lower));
    }
    
    setFilteredDocs(result);
  }, [debouncedSearch, docs, showArchived]);

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await documentService.delete(docToDelete);
      toast.success("Document deleted");
      logAction('delete', 'document', docToDelete);
      setDocToDelete(null);
      loadDocs();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleRename = async () => {
    if (!docToRename || !renameValue.trim()) return;
    try {
      await documentService.update(docToRename.id, { title: renameValue, updatedAt: Date.now() });
      toast.success("Document renamed");
      logAction('update', 'document', docToRename.id, 'renamed');
      setDocToRename(null);
      loadDocs();
    } catch (e) {
      toast.error("Rename failed");
    }
  };

  const toggleArchive = async (doc: Document, e: React.MouseEvent) => {
      e.stopPropagation();
      const newValue = !doc.isArchived;
      try {
          await documentService.update(doc.id, { isArchived: newValue });
          toast.success(newValue ? "Archived" : "Unarchived");
          logAction(newValue ? 'archive' : 'unarchive', 'document', doc.id);
          loadDocs();
      } catch (e) {
          toast.error("Action failed");
      }
  };

  const toggleMergeMode = () => {
      setIsMergeMode(!isMergeMode);
      setSelectedForMerge([]);
  };

  const handleSelectForMerge = (docId: string) => {
      if (selectedForMerge.includes(docId)) {
          setSelectedForMerge(prev => prev.filter(id => id !== docId));
      } else {
          setSelectedForMerge(prev => [...prev, docId]);
      }
  };

  const handleMergeSuccess = () => {
      setShowMergeModal(false);
      setIsMergeMode(false);
      setSelectedForMerge([]);
      loadDocs(); 
  };

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20 pt-[60px]">
        {/* Custom Header - Fixed Layout Issue */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-4 flex items-center justify-between transition-all">
            {/* Left: Back Button */}
            <div className="flex-shrink-0 flex items-center">
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            
            {/* Center: Title (Flexbox centering instead of absolute to prevent overlap) */}
            <div className="flex-1 text-center px-2 min-w-0">
                <h1 className="text-[18px] font-semibold text-[#111827] tracking-tight truncate">
                    Recent Documents
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex-shrink-0 flex items-center gap-2">
                <button 
                    onClick={() => setShowArchived(!showArchived)}
                    className={`p-2 rounded-full transition-colors ${showArchived ? 'text-[#6366F1] bg-indigo-50' : 'text-[#9CA3AF] hover:text-gray-700'}`}
                    title={showArchived ? "Show Active" : "Show Archived"}
                >
                    <Icon name="folder" size="md" />
                </button>
                <button 
                    onClick={toggleMergeMode}
                    className={`border-[1.5px] rounded-[12px] px-4 py-2 text-[13px] font-medium transition-all active:scale-95 flex items-center justify-center ${
                        isMergeMode 
                        ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-sm' 
                        : 'bg-transparent border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
                    }`}
                >
                    {isMergeMode ? 'Cancel' : 'Merge'}
                </button>
            </div>
        </header>

      {isMergeMode && (
          <div className="sticky top-[60px] z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-5 py-3 flex justify-between items-center animate-slide-up shadow-sm">
              <div className="text-sm font-semibold text-slate-700">
                  <span className="bg-[#EEF2FF] text-[#6366F1] px-2 py-0.5 rounded-full mr-2">{selectedForMerge.length}</span>
                  Selected
              </div>
              <PremiumButton 
                  size="sm" 
                  disabled={selectedForMerge.length < 2}
                  onClick={() => setShowMergeModal(true)}
              >
                  Configure Merge →
              </PremiumButton>
          </div>
      )}

      <div className="max-w-3xl mx-auto px-5 mt-4 min-h-[calc(100vh-140px)] flex flex-col">
          {!isMergeMode && (
            <div className="relative group mb-6 flex-shrink-0">
                <input 
                    type="text" 
                    placeholder={showArchived ? "Search archived history..." : "Search history..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-[46px] pr-4 py-[14px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#6366F1] focus:bg-white transition-all shadow-sm"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#6366F1] transition-colors">
                    <Icon name="search" size="md" />
                </div>
            </div>
          )}
          
          {showArchived && (
              <div className="text-[13px] font-medium text-orange-700 bg-orange-50 py-3 px-4 rounded-[14px] border border-orange-100 flex items-center justify-center gap-2 mb-4 flex-shrink-0">
                  <Icon name="folder" size="sm" /> Viewing Archived Documents
              </div>
          )}

          {isLoading ? (
             <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
                 <div className="w-8 h-8 border-4 border-[#EEF2FF] border-t-[#6366F1] rounded-full animate-spin"></div>
                 <p className="text-sm text-gray-400">Loading library...</p>
             </div>
          ) : filteredDocs.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10">
                <div className="text-[#D1D5DB] mb-4 opacity-70">
                    <Icon name="file-text" size="2xl" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#374151]">No documents found</h3>
                <p className="text-[14px] font-normal text-[#9CA3AF] mt-1.5">Try creating a new one or adjust filters</p>
             </div>
          ) : (
             <div className="flex flex-col gap-[14px] pb-10">
                 {filteredDocs.map(doc => {
                     const selectionIndex = selectedForMerge.indexOf(doc.id);
                     const isSelected = selectionIndex >= 0;
                     
                     return (
                     <div
                        key={doc.id} 
                        className={`
                            relative bg-white border rounded-[20px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150
                            ${isMergeMode && isSelected ? 'border-[#6366F1] bg-indigo-50/10' : 'border-[#F3F4F6]'}
                            ${!isMergeMode ? 'active:scale-[0.99]' : ''}
                        `}
                        onClick={isMergeMode ? () => handleSelectForMerge(doc.id) : undefined}
                     >
                         <div className="flex items-start justify-between">
                             <div 
                                className="flex-1 cursor-pointer flex items-center gap-4"
                                onClick={!isMergeMode ? () => navigate(`/create/${doc.id}`) : undefined}
                             >
                                 {isMergeMode ? (
                                     <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center border transition-all ${isSelected ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-md' : 'bg-white border-gray-200'}`}>
                                         {isSelected ? (
                                             <span className="font-bold text-lg">{selectionIndex + 1}</span>
                                         ) : (
                                             <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                                         )}
                                     </div>
                                 ) : (
                                     <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-sm ${doc.isArchived ? 'bg-gray-100 text-gray-400' : 'bg-[#EEF2FF] text-[#6366F1]'}`}>
                                         <Icon name="file-text" size="lg" />
                                     </div>
                                 )}

                                 <div className="min-w-0">
                                     <h3 className="text-[16px] font-semibold text-[#111827] truncate pr-2">{doc.title}</h3>
                                     <div className="flex items-center gap-2 mt-1">
                                         <span className="text-[12px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                             {doc.mcqs.length} MCQs
                                         </span>
                                         <span className="text-[12px] text-[#9CA3AF]">• {getTimeAgo(doc.updatedAt)}</span>
                                         {doc.isMerged && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase tracking-wide border border-purple-100">Merged</span>}
                                     </div>
                                 </div>
                             </div>
                             
                             {!isMergeMode && (
                                 <div className="flex items-center gap-1">
                                     <button
                                         onClick={(e) => toggleArchive(doc, e)}
                                         className="p-2 text-[#9CA3AF] hover:text-[#6366F1] rounded-full transition-colors"
                                         title={doc.isArchived ? "Unarchive" : "Archive"}
                                     >
                                         <Icon name="folder" size="sm" />
                                     </button>
                                     <button 
                                         onClick={() => { setDocToRename(doc); setRenameValue(doc.title); }}
                                         className="p-2 text-[#9CA3AF] hover:text-[#111827] rounded-full transition-colors"
                                         title="Rename"
                                     >
                                         <Icon name="pencil" size="sm" />
                                     </button>
                                     <button 
                                         onClick={() => setDocToDelete(doc.id)}
                                         className="p-2 text-[#9CA3AF] hover:text-red-500 rounded-full transition-colors"
                                         title="Delete"
                                     >
                                         <Icon name="trash-2" size="sm" />
                                     </button>
                                 </div>
                             )}
                         </div>
                     </div>
                 )})}
             </div>
          )}
      </div>

      <MergeConfigModal 
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          selectedDocs={selectedForMerge.map(id => docs.find(d => d.id === id)!).filter(Boolean)}
          onSuccess={handleMergeSuccess}
      />

      <PremiumModal 
         isOpen={!!docToDelete} 
         onClose={() => setDocToDelete(null)} 
         title="Delete Document?"
         size="sm"
      >
          <div className="space-y-5">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full text-red-500 shadow-sm">
                      <Icon name="alert-triangle" size="md" />
                  </div>
                  <p className="text-sm text-red-800 font-medium">This action cannot be undone.</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                  <PremiumButton variant="ghost" onClick={() => setDocToDelete(null)}>Cancel</PremiumButton>
                  <PremiumButton variant="danger" onClick={handleDelete}>Delete</PremiumButton>
              </div>
          </div>
      </PremiumModal>

      <PremiumModal 
         isOpen={!!docToRename} 
         onClose={() => setDocToRename(null)} 
         title="Rename Document"
         size="sm"
      >
          <div className="space-y-4">
              <PremiumInput 
                 label="Document Title"
                 value={renameValue}
                 onChange={setRenameValue}
              />
              <div className="flex justify-end gap-3 pt-2">
                  <PremiumButton variant="ghost" onClick={() => setDocToRename(null)}>Cancel</PremiumButton>
                  <PremiumButton onClick={handleRename}>Save Changes</PremiumButton>
              </div>
          </div>
      </PremiumModal>
    </div>
  );
};

export default RecentDocsPage;
