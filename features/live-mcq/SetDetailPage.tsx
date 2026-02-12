
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumInput from '../../shared/components/PremiumInput';
import { mcqSetService, attemptService, subtopicService } from '../../core/storage/services';
import { MCQSet, MCQ, Attempt } from '../../types';
import { useToast } from '../../shared/context/ToastContext';
import SingleMCQModal from '../create-pdf/components/SingleMCQModal';
import BulkImportModal from '../create-pdf/components/BulkImportModal';
import Icon from '../../shared/components/Icon';

const SetDetailPage: React.FC = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [set, setSet] = useState<MCQSet | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  // Default back path updated to topics list to avoid dead landing page
  const [backPath, setBackPath] = useState('/live-mcq/topics');
  
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSingleMCQ, setShowSingleMCQ] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState<MCQ | null>(null);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'set', id: string, name: string } | null>(null);

  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!setId) return;
    
    // Subscribe to Set updates
    const unsub = mcqSetService.subscribeGetById(setId, (data, source) => {
        if (data) {
            setSet(data);
            setInitialLoading(false);
            if (source === 'cache') loadExtras(data);
            else loadExtras(data);
        } else if (source === 'network') {
            toast.error("Set not found");
            navigate('/live-mcq/topics');
        }
    });

    return () => unsub();
  }, [setId]);

  const loadExtras = async (s: MCQSet) => {
      try {
          if (s.subtopicId) {
              const st = await subtopicService.getById(s.subtopicId);
              if (st) setBackPath(`/live-mcq/topic/${st.topicId}/subtopic/${st.id}`);
          }

          const allAttempts = await attemptService.where('setId', s.id);
          setAttempts(allAttempts.sort((a, b) => b.completedAt - a.completedAt));
          
          if (allAttempts.length > 0) {
              setLastScore(allAttempts[0].percentage);
              setBestScore(Math.max(...allAttempts.map(a => a.percentage)));
          }
      } catch (e) { console.error(e); }
  };

  const handleDeleteSetTrigger = () => {
      if (set) {
          setDeleteTarget({ type: 'set', id: set.id, name: set.name });
      }
  };

  const performDelete = async () => {
      if (!deleteTarget || !set) return;
      try {
          await mcqSetService.delete(set.id);
          navigate(backPath);
          toast.success("Set deleted");
      } catch (e: any) {
          console.error(e);
          toast.error(e.message || "Failed to delete set");
      } finally {
          setDeleteTarget(null);
      }
  };

  const initiateRename = () => {
      if (set) {
          setRenameValue(set.name);
          setShowRenameModal(true);
      }
  };

  const performRename = async () => {
      if (set && renameValue.trim()) {
          try {
              await mcqSetService.update(set.id, { name: renameValue });
              setSet(prev => prev ? { ...prev, name: renameValue } : null);
              setShowRenameModal(false);
              toast.success("Set renamed");
          } catch (e: any) {
              toast.error(e.message || "Rename failed");
          }
      }
  };

  const updateSetMCQs = async (newMCQs: MCQ[]) => {
      if (!set) return;
      try {
          const updatedSet = { ...set, mcqs: newMCQs, updatedAt: Date.now() };
          await mcqSetService.update(set.id, updatedSet);
          setSet(updatedSet);
          return true;
      } catch (e: any) {
          toast.error(e.message || "Failed to save MCQs");
          return false;
      }
  };

  const handleAddMCQ = async (mcq: MCQ) => {
      if (!set) return;
      const newMCQs = [...set.mcqs, mcq];
      const success = await updateSetMCQs(newMCQs);
      if (success) {
          setShowSingleMCQ(false);
          toast.success("MCQ added");
      }
  };

  const handleUpdateMCQ = async (mcq: MCQ) => {
      if (!set) return;
      const newMCQs = set.mcqs.map(m => m.id === mcq.id ? mcq : m);
      const success = await updateSetMCQs(newMCQs);
      if (success) {
          setShowSingleMCQ(false);
          setEditingMCQ(null);
          toast.success("MCQ updated");
      }
  };

  const handleDeleteMCQ = async (id: string) => {
      if (!set) return;
      const newMCQs = set.mcqs.filter(m => m.id !== id);
      const success = await updateSetMCQs(newMCQs);
      if (success) {
          if (editingMCQ?.id === id) {
              setShowSingleMCQ(false);
              setEditingMCQ(null);
          }
          toast.success("MCQ deleted");
      }
  };

  const handleBulkImport = async (imported: MCQ[]) => {
      if (!set) return;
      const finalImport = imported.map(m => ({ ...m, id: m.id || crypto.randomUUID() }));
      const newMCQs = [...set.mcqs, ...finalImport];
      const success = await updateSetMCQs(newMCQs);
      if (success) {
          setShowBulkImport(false);
          toast.success(`${finalImport.length} MCQs imported`);
      }
  };

  // Selection Handlers
  const toggleSelectionMode = () => {
      if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedIds(new Set());
      } else {
          setIsSelectionMode(true);
      }
  };

  const toggleSelect = (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      setSelectedIds(newSelected);
  };

  const selectAll = () => {
      if (!set) return;
      if (selectedIds.size === set.mcqs.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(set.mcqs.map(m => m.id)));
      }
  };

  const confirmBulkDelete = () => {
      if (selectedIds.size === 0) return;
      setShowDeleteConfirm(true);
  };

  const performBulkDelete = async () => {
      if (!set) return;
      const newMCQs = set.mcqs.filter(m => !selectedIds.has(m.id));
      const success = await updateSetMCQs(newMCQs);
      if (success) {
          toast.success(`${selectedIds.size} MCQs deleted`);
          setShowDeleteConfirm(false);
          setIsSelectionMode(false);
          setSelectedIds(new Set());
      }
  };

  // Helper for score color
  const getScoreColor = (score: number, attemptsCount: number) => {
      if (attemptsCount === 0) return 'text-white';
      if (score >= 70) return 'text-[#34D399]';
      if (score >= 40) return 'text-[#FBBF24]';
      return 'text-[#F87171]';
  };

  if (initialLoading || !set) return <div className="p-10 text-center text-gray-500">Loading Set...</div>;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20 pt-[60px]">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate(backPath)} 
                    className="p-2 -ml-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="text-[18px] font-semibold text-[#111827] absolute left-1/2 -translate-x-1/2 tracking-tight">
                {set.name}
            </h1>
            <div className="flex items-center gap-1">
                 <button 
                    onClick={initiateRename}
                    className="p-2 text-[#9CA3AF] hover:text-gray-900 transition-colors rounded-full"
                >
                    <Icon name="edit-3" size="sm" />
                </button>
                <button 
                    onClick={handleDeleteSetTrigger}
                    className="p-2 text-[#9CA3AF] hover:text-red-600 transition-colors rounded-full"
                >
                    <Icon name="trash-2" size="sm" />
                </button>
            </div>
        </header>

        <div className="max-w-3xl mx-auto px-5 mt-4 space-y-7">
            
            {/* Dark Stats Bar (Hero) */}
            <div className="rounded-[24px] p-6 shadow-xl" style={{ background: '#1E1B4B' }}>
                <div className="grid grid-cols-4 gap-2 text-center mb-5">
                    <div>
                        <div className="text-[24px] font-bold text-white">{set.mcqs.length}</div>
                        <div className="text-[11px] font-medium text-white/50 uppercase tracking-wide">MCQs</div>
                    </div>
                    <div>
                        <div className={`text-[24px] font-bold ${getScoreColor(lastScore, attempts.length)}`}>{lastScore}%</div>
                        <div className="text-[11px] font-medium text-white/50 uppercase tracking-wide">Last</div>
                    </div>
                    <div>
                        <div className={`text-[24px] font-bold ${getScoreColor(bestScore, attempts.length)}`}>{bestScore}%</div>
                        <div className="text-[11px] font-medium text-white/50 uppercase tracking-wide">Best</div>
                    </div>
                    <div>
                        <div className="text-[24px] font-bold text-white">{attempts.length}</div>
                        <div className="text-[11px] font-medium text-white/50 uppercase tracking-wide">Attempts</div>
                    </div>
                </div>
                
                {/* Buttons */}
                <div className="flex gap-[12px]">
                    <button 
                        onClick={() => navigate(`/live-mcq/practice/${set.id}`)}
                        disabled={set.mcqs.length === 0}
                        className="flex-1 bg-[#6366F1] text-white py-[14px] rounded-[14px] font-semibold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                        Practice
                    </button>
                    <button 
                        onClick={() => navigate(`/live-mcq/exam/${set.id}`)}
                        disabled={set.mcqs.length === 0}
                        className="flex-1 bg-white/10 border border-white/15 text-white py-[14px] rounded-[14px] font-medium text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                        Exam
                    </button>
                </div>
            </div>

            {/* MCQs Section Header */}
            <div>
                <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-wide">MCQs</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => navigate(`/create?mode=export&source=set&sourceId=${set.id}`)}
                            className="bg-transparent border-[1.5px] border-[#E5E7EB] text-[#374151] px-4 py-2 rounded-[12px] text-[13px] font-medium active:scale-95 transition-all hover:bg-gray-50"
                        >
                            Export PDF
                        </button>
                        <button 
                            onClick={() => setShowAddMenu(true)}
                            className="bg-[#6366F1] text-white px-4 py-2 rounded-[12px] text-[13px] font-medium active:scale-95 transition-all hover:bg-[#4F46E5]"
                        >
                            + Add
                        </button>
                    </div>
                </div>

                {/* Count & Select Row */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-medium text-[#9CA3AF]">
                        {set.mcqs.length} MCQs
                    </span>
                    
                    {isSelectionMode ? (
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={selectAll}
                                className="text-[13px] font-medium text-[#6366F1] hover:underline"
                            >
                                {selectedIds.size === set.mcqs.length ? 'Unselect All' : 'Select All'}
                            </button>
                            {selectedIds.size > 0 && (
                                <button 
                                    onClick={confirmBulkDelete}
                                    className="text-[13px] font-medium text-red-500 hover:underline"
                                >
                                    Delete ({selectedIds.size})
                                </button>
                            )}
                            <button 
                                onClick={toggleSelectionMode}
                                className="text-[13px] font-medium text-gray-500 hover:text-gray-900"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={toggleSelectionMode}
                            className="text-[13px] font-medium text-[#6366F1] hover:text-[#4F46E5] transition-colors flex items-center gap-1"
                        >
                            <Icon name="check-circle" size="sm" /> Select
                        </button>
                    )}
                </div>

                {/* Custom MCQ List */}
                <div className="flex flex-col gap-[12px]">
                    {set.mcqs.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-[20px]">
                            <p className="text-[14px] text-gray-400">No MCQs added yet</p>
                        </div>
                    ) : (
                        set.mcqs.map((mcq, index) => (
                            <div 
                                key={mcq.id}
                                className={`relative bg-white border rounded-[18px] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all ${
                                    isSelectionMode && selectedIds.has(mcq.id) ? 'border-[#6366F1] bg-indigo-50/10' : 'border-[#F3F4F6]'
                                }`}
                                onClick={isSelectionMode ? () => toggleSelect(mcq.id) : undefined}
                            >
                                {/* Edit Icon (Absolute) */}
                                {!isSelectionMode && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingMCQ(mcq); setShowSingleMCQ(true); }}
                                        className="absolute top-4 right-4 text-[#D1D5DB] hover:text-[#6366F1] transition-colors"
                                    >
                                        <Icon name="edit-3" size="sm" />
                                    </button>
                                )}

                                {/* Selection Checkbox */}
                                {isSelectionMode && (
                                    <div className="absolute top-4 right-4">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${selectedIds.has(mcq.id) ? 'bg-[#6366F1] border-[#6366F1]' : 'border-gray-300 bg-white'}`}>
                                            {selectedIds.has(mcq.id) && <Icon name="check" size="sm" className="text-white" />}
                                        </div>
                                    </div>
                                )}

                                {/* Question */}
                                <div className="mb-3 pr-8">
                                    <span className="text-[#6366F1] font-bold mr-2">{index + 1}.</span>
                                    <span className="text-[15px] font-semibold text-[#111827] leading-relaxed">
                                        {mcq.question}
                                    </span>
                                </div>

                                {/* Options Grid */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                                    {['A', 'B', 'C', 'D'].map((opt) => {
                                        const isCorrect = mcq.answer === opt;
                                        const text = mcq[`option${opt}` as keyof MCQ] as string;
                                        
                                        return (
                                            <div 
                                                key={opt}
                                                className={`text-[14px] flex items-start gap-2 ${
                                                    isCorrect 
                                                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold px-2 py-1 -ml-2 rounded-[6px]' 
                                                        : 'text-[#374151] font-normal py-1'
                                                }`}
                                            >
                                                <span className={`font-medium ${isCorrect ? 'text-[#059669]' : 'text-[#9CA3AF]'}`}>{opt})</span>
                                                <span className="leading-snug">{text}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Tag / Source */}
                                {mcq.source && (
                                    <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center gap-2">
                                        <div className="text-[#D1D5DB]">
                                            <Icon name="check-circle" size="sm" /> {/* Placeholder for tag icon, reused check-circle as generic badge style */}
                                        </div>
                                        <span className="text-[12px] font-normal text-[#9CA3AF]">{mcq.source}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

        {/* Modals */}
        <PremiumModal isOpen={showAddMenu} onClose={() => setShowAddMenu(false)} title="Add MCQs" size="sm">
            <div className="grid grid-cols-1 gap-3">
                <button 
                    onClick={() => { setShowAddMenu(false); setEditingMCQ(null); setShowSingleMCQ(true); }}
                    className="p-4 border rounded-xl hover:bg-gray-50 text-left flex items-center gap-3"
                >
                    <span className="text-2xl">📝</span>
                    <div>
                        <div className="font-medium text-[var(--text-primary)]">Add Manually</div>
                        <div className="text-xs text-[var(--text-secondary)]">Create one by one</div>
                    </div>
                </button>
                <button 
                    onClick={() => { setShowAddMenu(false); setShowBulkImport(true); }}
                    className="p-4 border rounded-xl hover:bg-gray-50 text-left flex items-center gap-3"
                >
                    <span className="text-2xl">📋</span>
                    <div>
                        <div className="font-medium text-[var(--text-primary)]">Bulk Import</div>
                        <div className="text-xs text-[var(--text-secondary)]">Paste text to import many</div>
                    </div>
                </button>
            </div>
        </PremiumModal>

        <SingleMCQModal 
            isOpen={showSingleMCQ} 
            onClose={() => { setShowSingleMCQ(false); setEditingMCQ(null); }} 
            onSave={editingMCQ ? handleUpdateMCQ : handleAddMCQ}
            initialMCQ={editingMCQ}
            onDelete={editingMCQ ? handleDeleteMCQ : undefined}
            existingMCQs={set.mcqs}
        />

        <BulkImportModal 
            isOpen={showBulkImport} 
            onClose={() => setShowBulkImport(false)} 
            onImport={handleBulkImport} 
            existingMCQs={set.mcqs}
        />

        <PremiumModal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} title="Rename Set" size="sm">
            <div className="space-y-4">
                <PremiumInput 
                    label="Set Name"
                    value={renameValue}
                    onChange={setRenameValue}
                />
                <div className="flex justify-end gap-3">
                    <PremiumButton variant="ghost" onClick={() => setShowRenameModal(false)}>Cancel</PremiumButton>
                    <PremiumButton onClick={performRename}>Save</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        <PremiumModal 
            isOpen={!!deleteTarget} 
            onClose={() => setDeleteTarget(null)} 
            title="Delete Set?" 
            size="sm"
        >
            <div className="space-y-6 text-center pt-2">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">
                        Delete "{deleteTarget?.name}"?
                    </h3>
                    <p className="text-sm text-gray-500">
                        This action cannot be undone.
                    </p>
                </div>
                <div className="flex gap-3 justify-center">
                    <PremiumButton variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={performDelete}>Delete</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        <PremiumModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete MCQs?" size="sm">
            <div className="space-y-4">
                <p className="text-[var(--text-secondary)]">
                    Are you sure you want to delete <b>{selectedIds.size}</b> MCQs? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <PremiumButton variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={performBulkDelete}>Delete</PremiumButton>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default SetDetailPage;
