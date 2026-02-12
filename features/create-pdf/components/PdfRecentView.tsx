
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService, logAction } from '../../../core/storage/services';
import { Document } from '../../../types';
import Icon from '../../../shared/components/Icon';
import PremiumButton from '../../../shared/components/PremiumButton';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useToast } from '../../../shared/context/ToastContext';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumInput from '../../../shared/components/PremiumInput';
import MergeConfigModal from '../../recent/components/MergeConfigModal';

const PdfRecentView: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
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
    <div className="pb-10 animate-in fade-in">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
                <h2 className="text-[15px] font-semibold text-[#6B7280] uppercase tracking-wide">Saved Documents</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowArchived(!showArchived)}
                        className={`p-2 rounded-full transition-colors ${showArchived ? 'text-[#6366F1] bg-indigo-50' : 'text-[#9CA3AF] hover:text-gray-700'}`}
                        title={showArchived ? "Show Active" : "Show Archived"}
                    >
                        <Icon name="folder" size="md" />
                    </button>
                    <button 
                        onClick={toggleMergeMode}
                        className={`border-[1.5px] rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition-all active:scale-95 flex items-center justify-center ${
                            isMergeMode 
                            ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-sm' 
                            : 'bg-transparent border-[#E5E7EB] text-[#374151] hover:bg-gray-50'
                        }`}
                    >
                        {isMergeMode ? 'Cancel' : 'Merge'}
                    </button>
                    <PremiumButton size="sm" onClick={() => navigate('/create', { replace: true })} variant="secondary">
                        + New
                    </PremiumButton>
                </div>
            </div>

            {/* Merge Status Bar */}
            {isMergeMode && (
                <div className="bg-[#EEF2FF] border border-indigo-100 rounded-[12px] px-4 py-2.5 flex justify-between items-center animate-slide-up">
                    <div className="text-sm font-semibold text-indigo-900">
                        <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full mr-2 text-xs border border-indigo-100">{selectedForMerge.length}</span>
                        Selected
                    </div>
                    <button 
                        disabled={selectedForMerge.length < 2}
                        onClick={() => setShowMergeModal(true)}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                    >
                        Merge Docs →
                    </button>
                </div>
            )}

            {/* Search */}
            {!isMergeMode && (
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder={showArchived ? "Search archived..." : "Search documents..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-[46px] pr-4 py-[14px] bg-white border border-[#F3F4F6] rounded-[14px] text-[#111827] placeholder-[#9CA3AF] text-sm focus:outline-none focus:border-[#6366F1] transition-all shadow-sm"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#6366F1] transition-colors">
                        <Icon name="search" size="md" />
                    </div>
                </div>
            )}
        </div>

        {showArchived && !isMergeMode && (
            <div className="text-[12px] font-medium text-orange-700 bg-orange-50 py-2 px-3 rounded-[10px] border border-orange-100 flex items-center justify-center gap-2 mb-4">
                <Icon name="folder" size="sm" /> Archived Documents
            </div>
        )}

        {isLoading ? (
             <div className="flex flex-col items-center justify-center py-12 gap-3">
                 <div className="w-8 h-8 border-4 border-[#EEF2FF] border-t-[#6366F1] rounded-full animate-spin"></div>
             </div>
        ) : filteredDocs.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed border-[#F3F4F6] rounded-[24px] bg-white">
                <div className="text-[#D1D5DB] mb-3 opacity-70"><Icon name="file-text" size="xl" /></div>
                <p className="text-[14px] text-[#9CA3AF]">No documents found</p>
             </div>
        ) : (
             <div className="flex flex-col gap-[12px]">
                 {filteredDocs.map(doc => {
                     const selectionIndex = selectedForMerge.indexOf(doc.id);
                     const isSelected = selectionIndex >= 0;

                     return (
                     <div
                        key={doc.id} 
                        className={`
                            group relative bg-white border rounded-[18px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 flex justify-between items-start cursor-pointer 
                            ${isMergeMode && isSelected ? 'border-[#6366F1] bg-indigo-50/10' : 'border-[#F3F4F6] hover:border-[#E5E7EB]'}
                            ${!isMergeMode ? 'active:scale-[0.99]' : ''}
                        `}
                        onClick={isMergeMode ? () => handleSelectForMerge(doc.id) : () => navigate(`/create/${doc.id}`)}
                     >
                         <div className="flex items-start gap-4 flex-1 min-w-0">
                             {isMergeMode ? (
                                 <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center border transition-all flex-shrink-0 ${isSelected ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-md' : 'bg-white border-gray-200'}`}>
                                     {isSelected ? (
                                         <span className="font-bold text-lg">{selectionIndex + 1}</span>
                                     ) : (
                                         <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                                     )}
                                 </div>
                             ) : (
                                 <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-sm flex-shrink-0 ${doc.isArchived ? 'bg-gray-100 text-gray-400' : 'bg-[#EEF2FF] text-[#6366F1]'}`}>
                                     <Icon name="file-text" size="lg" />
                                 </div>
                             )}
                             
                             <div className="min-w-0 flex-1">
                                 <h3 className="text-[16px] font-semibold text-[#111827] truncate pr-2 group-hover:text-[#6366F1] transition-colors">{doc.title}</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                     <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                         {doc.mcqs.length} Qs
                                     </span>
                                     <span className="text-[11px] text-[#9CA3AF]">• {getTimeAgo(doc.updatedAt)}</span>
                                     {doc.isMerged && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase tracking-wide border border-purple-100">Merged</span>}
                                 </div>
                             </div>
                         </div>
                         
                         {!isMergeMode && (
                             <div className="flex items-center gap-1 pl-2">
                                 <button
                                     onClick={(e) => toggleArchive(doc, e)}
                                     className="p-2 text-[#D1D5DB] hover:text-[#6366F1] rounded-full transition-colors hover:bg-gray-50"
                                     title={doc.isArchived ? "Unarchive" : "Archive"}
                                 >
                                     <Icon name="folder" size="sm" />
                                 </button>
                                 <button 
                                     onClick={(e) => { e.stopPropagation(); setDocToRename(doc); setRenameValue(doc.title); }}
                                     className="p-2 text-[#D1D5DB] hover:text-[#111827] rounded-full transition-colors hover:bg-gray-50"
                                     title="Rename"
                                 >
                                     <Icon name="pencil" size="sm" />
                                 </button>
                                 <button 
                                     onClick={(e) => { e.stopPropagation(); setDocToDelete(doc.id); }}
                                     className="p-2 text-[#D1D5DB] hover:text-red-500 rounded-full transition-colors hover:bg-[#FEF2F2]"
                                     title="Delete"
                                 >
                                     <Icon name="trash-2" size="sm" />
                                 </button>
                             </div>
                         )}
                     </div>
                 )})}
             </div>
        )}

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
                <div className="flex justify-center gap-3 pt-2">
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

export default PdfRecentView;
