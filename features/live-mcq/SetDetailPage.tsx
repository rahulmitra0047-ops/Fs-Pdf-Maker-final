
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumInput from '../../shared/components/PremiumInput';
import { mcqSetService, attemptService, subtopicService } from '../../core/storage/services';
import { Virtuoso } from 'react-virtuoso';
import { MCQSet, MCQ, Attempt } from '../../types';
import { useToast } from '../../shared/context/ToastContext';
import SingleMCQModal from '../create-pdf/components/SingleMCQModal';
import BulkImportModal from '../create-pdf/components/BulkImportModal';
import Icon from '../../shared/components/Icon';
import PracticeFilterSheet from './components/PracticeFilterSheet';

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
  const [showPracticeSheet, setShowPracticeSheet] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState<MCQ | null>(null);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'set', id: string, name: string } | null>(null);

  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!setId) return;
    
    // Subscribe to Set updates
    const unsub = mcqSetService.subscribeGetById(setId, (data, source) => {
        if (data) {
            setSet(data);
            setInitialLoading(false);
            if (source === 'cache' || source === 'network-partial') {
                setIsSyncing(true);
                loadExtras(data);
            } else {
                setIsSyncing(false);
                loadExtras(data);
            }
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

    if (initialLoading || !set) return <div className="p-10 text-center font-sans uppercase tracking-widest text-xs text-text-secondary mt-10">Loading Set...</div>;

  return (
    <div className="min-h-screen bg-background pb-20 pt-[60px] font-sans">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-background/90 backdrop-blur-md border-b border-border z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate(backPath)} 
                    className="p-2 -ml-2 text-text-primary hover:bg-[#EBE7DF] rounded-none transition-colors"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-primary absolute left-1/2 -translate-x-1/2">
                {set.name}
            </h1>
            <div className="flex items-center gap-1">
                 <button 
                    onClick={initiateRename}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-none"
                >
                    <Icon name="edit-3" size="sm" />
                </button>
                <button 
                    onClick={handleDeleteSetTrigger}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-none"
                >
                    <Icon name="trash-2" size="sm" />
                </button>
            </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 mt-6 space-y-8">
            
            {/* Dark Stats Bar (Hero) */}
            <div className="p-6 border border-border bg-surface relative overflow-hidden rounded-none shadow-none">
                <div className="grid grid-cols-4 gap-2 text-center mb-6 relative z-10">
                    <div>
                        <div className="text-[26px] font-serif text-text-primary">{set.mcqs.length}</div>
                        <div className="font-sans text-[9px] text-text-secondary uppercase tracking-[0.1em] mt-1 font-semibold">MCQs</div>
                    </div>
                    <div>
                        <div className={`text-[26px] font-serif text-text-primary ${lastScore >= 80 ? 'text-primary' : ''}`}>{lastScore}%</div>
                        <div className="font-sans text-[9px] text-text-secondary uppercase tracking-[0.1em] mt-1 font-semibold">Last</div>
                    </div>
                    <div>
                        <div className={`text-[26px] font-serif text-text-primary ${bestScore >= 80 ? 'text-primary' : ''}`}>{bestScore}%</div>
                        <div className="font-sans text-[9px] text-text-secondary uppercase tracking-[0.1em] mt-1 font-semibold">Best</div>
                    </div>
                    <div>
                        <div className="text-[26px] font-serif text-text-primary">{attempts.length}</div>
                        <div className="font-sans text-[9px] text-text-secondary uppercase tracking-[0.1em] mt-1 font-semibold">Attempts</div>
                    </div>
                </div>
                
                {/* Buttons */}
                <div className="flex gap-3 relative z-10">
                    <button 
                        onClick={() => {
                            if (set.mcqs.length === 0) {
                                if (isSyncing) return toast.error("Still loading MCQs, please wait a moment...");
                            }
                            setShowPracticeSheet(true);
                        }}
                        disabled={set.mcqs.length === 0 && !isSyncing}
                        className="flex-1 bg-text-primary text-surface border border-text-primary py-3 px-6 rounded-none font-sans font-semibold text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 hover:bg-text-primary/90 flex justify-center items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary"
                    >
                        <Icon name="play" size="sm" /> Practice
                    </button>
                    <button 
                        onClick={() => {
                            if (set.mcqs.length === 0) {
                                if (isSyncing) return toast.error("Still loading MCQs, please wait a moment...");
                            }
                            navigate(`/live-mcq/exam/${set.id}`);
                        }}
                        disabled={set.mcqs.length === 0 && !isSyncing}
                        className="flex-1 bg-background border border-border text-text-primary py-3 px-6 rounded-none font-sans font-semibold text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 hover:bg-surface hover:border-text-primary flex justify-center items-center gap-2"
                    >
                        <Icon name="clock" size="sm" /> Exam Mode
                    </button>
                </div>
            </div>

            {/* MCQs Section Header */}
            <div>
                <div className="flex items-center justify-between mb-4 px-1 border-b border-border/50 pb-3">
                    <h3 className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-primary">Questions Array</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                if (set.mcqs.length === 0) {
                                    if (isSyncing) return toast.error("Still loading MCQs, please wait a moment...");
                                    return toast.error("No MCQs to export");
                                }
                                navigate(`/create?mode=export&source=set&sourceId=${set.id}`);
                            }}
                            className="bg-surface border border-border text-text-primary px-3 py-1.5 rounded-none text-[10px] font-sans font-semibold tracking-widest uppercase transition-all hover:bg-surface-hover flex items-center gap-1.5"
                        >
                            <Icon name="share" size="xs" /> Export PDF
                        </button>
                        <button 
                            onClick={() => setShowAddMenu(true)}
                            className="bg-text-primary text-surface px-4 py-1.5 rounded-none text-[10px] font-sans font-semibold tracking-widest uppercase transition-all hover:bg-text-primary/90 flex items-center gap-1.5"
                        >
                            <Icon name="plus" size="xs" /> Add Question
                        </button>
                    </div>
                </div>

                {/* Count & Select Row */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <span className="font-sans text-[10px] text-text-secondary uppercase tracking-[0.1em] font-semibold">
                        {set.mcqs.length} Total
                    </span>
                    
                    {isSelectionMode ? (
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={selectAll}
                                className="font-sans text-[10px] font-semibold text-text-primary uppercase tracking-widest hover:text-text-primary/70 transition-colors"
                            >
                                {selectedIds.size === set.mcqs.length ? 'Unselect All' : 'Select All'}
                            </button>
                            {selectedIds.size > 0 && (
                                <button 
                                    onClick={confirmBulkDelete}
                                    className="font-sans text-[10px] font-semibold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors"
                                >
                                    Delete ({selectedIds.size})
                                </button>
                            )}
                            <button 
                                onClick={toggleSelectionMode}
                                className="font-sans text-[10px] font-semibold text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={toggleSelectionMode}
                            className="font-sans text-[10px] font-semibold text-text-primary uppercase tracking-widest hover:text-text-primary/70 transition-colors flex items-center gap-1"
                        >
                            <Icon name="check-circle" size="sm" /> Select
                        </button>
                    )}
                </div>

                {/* Custom MCQ List */}
                <div className="flex flex-col gap-3">
                    {set.mcqs.length === 0 ? (
                        <div className="text-center py-12 border border-border bg-surface rounded-none">
                            <div className="text-text-secondary mb-3"><Icon name="file-text" size="lg" /></div>
                            {isSyncing ? (
                                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary animate-pulse">Loading Dataset...</p>
                            ) : (
                                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary">No questions appended</p>
                            )}
                        </div>
                    ) : (
                        <Virtuoso
                            useWindowScroll
                            data={set.mcqs}
                            itemContent={(index, mcq) => (
                                <div className="pb-3">
                                    <div 
                                        key={mcq.id}
                                        className={`relative bg-surface border p-6 transition-all duration-200 ${
                                            isSelectionMode && selectedIds.has(mcq.id) ? 'border-text-primary bg-text-primary/5' : 'border-border hover:border-text-primary/50'
                                        }`}
                                        onClick={isSelectionMode ? () => toggleSelect(mcq.id) : undefined}
                                    >
                                        {/* Edit Icon (Absolute) */}
                                        {!isSelectionMode && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingMCQ(mcq); setShowSingleMCQ(true); }}
                                                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors bg-background border border-border hover:border-text-primary p-2 active:scale-95"
                                            >
                                                <Icon name="edit-3" size="xs" />
                                            </button>
                                        )}

                                        {/* Selection Checkbox */}
                                        {isSelectionMode && (
                                            <div className="absolute top-4 right-4">
                                                <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${selectedIds.has(mcq.id) ? 'bg-text-primary border-text-primary' : 'border-border bg-background'}`}>
                                                    {selectedIds.has(mcq.id) && <Icon name="check" size="xs" className="text-surface border-surface w-3.5 h-3.5" strokeWidth={1.5} />}
                                                </div>
                                            </div>
                                        )}

                                        {/* Question */}
                                        <div className="mb-5 pr-10">
                                            <span className="font-sans font-semibold text-text-secondary mr-3 text-[11px] tracking-widest">{String(index + 1).padStart(2, '0')}.</span>
                                            <span className="text-[16px] font-serif font-medium text-text-primary leading-[1.6]">
                                                {mcq.question}
                                            </span>
                                        </div>

                                        {/* Options Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                            {['A', 'B', 'C', 'D'].map((opt) => {
                                                const isCorrect = mcq.answer === opt;
                                                const text = mcq[`option${opt}` as keyof MCQ] as string;
                                                
                                                return (
                                                    <div 
                                                        key={opt}
                                                        className={`text-[14px] font-serif flex items-start gap-4 p-4 border ${
                                                            isCorrect 
                                                                ? 'bg-surface border-text-primary text-text-primary font-medium' 
                                                                : 'bg-background border-border text-text-primary'
                                                        }`}
                                                    >
                                                        <span className={`font-sans font-semibold text-[10px] mt-[3px] ${isCorrect ? 'text-text-primary' : 'text-text-secondary'}`}>{opt})</span>
                                                        <span className="leading-[1.5]">{text}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Tag / Source */}
                                        {mcq.source && (
                                            <div className="mt-5 pt-4 border-t border-border flex items-center gap-2">
                                                <div className="text-primary">
                                                    <Icon name="bookmark" size="xs" className="w-3 h-3" />
                                                </div>
                                                <span className="font-sans text-[10px] font-semibold text-text-primary uppercase tracking-[0.1em]">{mcq.source}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    )}
                </div>
            </div>
        </div>

        {/* Modals */}
        <PremiumModal isOpen={showAddMenu} onClose={() => setShowAddMenu(false)} title="Add Questions" size="sm">
            <div className="grid grid-cols-1 gap-3">
                <button 
                    onClick={() => { setShowAddMenu(false); setEditingMCQ(null); setShowSingleMCQ(true); }}
                    className="p-5 border border-border bg-surface hover:bg-surface-hover text-left flex items-center gap-5 transition-colors group"
                >
                    <div className="w-10 h-10 border border-border bg-background flex items-center justify-center text-text-primary group-hover:bg-text-primary group-hover:text-surface transition-colors">
                        <Icon name="edit-3" size="sm" />
                    </div>
                    <div>
                        <div className="font-serif text-[16px] font-medium text-text-primary">Add Manually</div>
                        <div className="font-sans text-[10px] font-semibold text-text-secondary uppercase tracking-[0.1em] mt-1">Create one by one</div>
                    </div>
                </button>
                <button 
                    onClick={() => { setShowAddMenu(false); setShowBulkImport(true); }}
                    className="p-5 border border-border bg-surface hover:bg-surface-hover text-left flex items-center gap-5 transition-colors group"
                >
                    <div className="w-10 h-10 border border-border bg-background flex items-center justify-center text-text-primary group-hover:bg-text-primary group-hover:text-surface transition-colors">
                        <Icon name="file-text" size="sm" />
                    </div>
                    <div>
                        <div className="font-serif text-[16px] font-medium text-text-primary">Bulk Import</div>
                        <div className="font-sans text-[10px] font-semibold text-text-secondary uppercase tracking-[0.1em] mt-1">Paste text to import many</div>
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

        <PracticeFilterSheet
            isOpen={showPracticeSheet}
            onClose={() => setShowPracticeSheet(false)}
            setId={set.id}
            mcqs={set.mcqs}
            onStart={(ids, settings, attempts) => {
                setShowPracticeSheet(false);
                navigate(`/live-mcq/practice/${set.id}`, { 
                    state: { 
                        mcqIds: ids,
                        settings: settings,
                        attempts: attempts
                    } 
                });
            }}
        />

        <PremiumModal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} title="Rename Set" size="sm">
            <div className="space-y-6">
                <PremiumInput 
                    label="SET NAME"
                    value={renameValue}
                    onChange={setRenameValue}
                />
                <div className="flex justify-end gap-3 mt-4">
                    <PremiumButton variant="ghost" onClick={() => setShowRenameModal(false)}>CANCEL</PremiumButton>
                    <PremiumButton onClick={performRename}>SAVE</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        <PremiumModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Set?" size="sm">
            <div className="space-y-6 pt-2">
                <div className="bg-surface p-5 border border-border">
                    <p className="font-serif text-[15px] text-text-primary text-center leading-relaxed">
                        Are you sure you want to delete <br/><b className="font-medium">"{deleteTarget?.name}"</b>? <br/>
                        <span className="text-text-secondary italic">This action cannot be undone.</span>
                    </p>
                </div>
                <div className="flex gap-3 justify-end items-center mt-6">
                    <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-background border border-border text-text-primary font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-surface transition-colors">Cancel</button>
                    <button onClick={performDelete} className="flex-1 py-3 bg-text-primary text-surface font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-text-primary/90 transition-colors">Delete</button>
                </div>
            </div>
        </PremiumModal>

        <PremiumModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete MCQs?" size="sm">
            <div className="space-y-6 pt-2">
                <div className="bg-surface p-5 border border-border">
                    <p className="font-serif text-[15px] text-text-primary text-center leading-relaxed">
                        Are you sure you want to delete <br/><b className="font-medium">{selectedIds.size}</b> MCQs? <br/>
                        <span className="text-text-secondary italic">This action cannot be undone.</span>
                    </p>
                </div>
                <div className="flex gap-3 justify-end items-center mt-6">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-background border border-border text-text-primary font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-surface transition-colors">Cancel</button>
                    <button onClick={performBulkDelete} className="flex-1 py-3 bg-text-primary text-surface font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-text-primary/90 transition-colors">Delete</button>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default SetDetailPage;
