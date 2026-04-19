
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumInput from '../../shared/components/PremiumInput';
import { subtopicService, mcqSetService, topicService, logAction } from '../../core/storage/services';
import { Subtopic, MCQSet, Topic, MCQ } from '../../types';
import { useToast } from '../../shared/context/ToastContext';
import { generateUUID } from '../../core/storage/idGenerator';
import BulkImportModal from '../create-pdf/components/BulkImportModal';
import Icon from '../../shared/components/Icon';
import PracticeFilterSheet from './components/PracticeFilterSheet';
import SetItem from './components/SetItem';

const SubtopicDetailPage: React.FC = () => {
  const { topicId, subtopicId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [sets, setSets] = useState<MCQSet[]>([]);
  const [filteredSets, setFilteredSets] = useState<MCQSet[]>([]);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [pendingSetName, setPendingSetName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<'subtopic' | 'set'>('subtopic');
  const [renameItem, setRenameItem] = useState<{id: string, name: string} | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subtopic' | 'set', id: string, name: string } | null>(null);

  const [showPracticeSheet, setShowPracticeSheet] = useState(false);

  // New Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
      if (!topicId || !subtopicId) return;

      // 1. Snapshot for Metadata (Instant)
      const unsubTopic = topicService.subscribeGetById(topicId, (data, source) => {
          if (data) setTopic(data);
          if (source === 'network') setInitialLoading(false);
      });

      const unsubSubtopic = subtopicService.subscribeGetById(subtopicId, (data, source) => {
          if (data) setSubtopic(data);
      });

      // 2. Snapshot for Sets List
      const unsubSets = mcqSetService.subscribeGetAll((allSets, source) => {
          const relevant = allSets.filter(s => s.subtopicId === subtopicId);
          setSets(relevant.sort((a, b) => b.updatedAt - a.updatedAt));
          
          if (source === 'cache' || source === 'network-partial') setIsSyncing(true);
          else setIsSyncing(false);
          
          if (relevant.length > 0 || source === 'network') setInitialLoading(false);
      });

      return () => {
          unsubTopic();
          unsubSubtopic();
          unsubSets();
      };
  }, [topicId, subtopicId]);

  useEffect(() => {
      if (showArchived) {
          setFilteredSets(sets.filter(s => s.isArchived));
      } else {
          setFilteredSets(sets.filter(s => !s.isArchived));
      }
  }, [sets, showArchived]);

  const handleCreateSet = async (mcqs: MCQ[] = []) => {
      const name = pendingSetName || newSetName;
      if (!name.trim() || !subtopic) return;
      try {
          const newSet: MCQSet = {
              id: generateUUID(),
              subtopicId: subtopic.id,
              name: name,
              mcqs: mcqs,
              createdAt: Date.now(),
              updatedAt: Date.now()
          };
          await mcqSetService.create(newSet);
          logAction('create', 'set', newSet.id);
          setShowCreateSet(false);
          setShowBulkImport(false);
          setNewSetName('');
          setPendingSetName('');
          if (mcqs.length > 0) toast.success(`Set created with ${mcqs.length} MCQs`);
          else {
              toast.success("Empty set created");
              navigate(`/live-mcq/set/${newSet.id}`); 
          }
      } catch (e: any) { toast.error(e.message || "Failed to create set"); }
  };

  const startBulkImportFlow = () => {
      if (!newSetName.trim()) { toast.error("Please enter a set name first"); return; }
      setPendingSetName(newSetName);
      setShowCreateSet(false);
      setShowBulkImport(true);
  };

  const handleDeleteSubtopic = () => { if (subtopic) setDeleteTarget({ type: 'subtopic', id: subtopic.id, name: subtopic.name }); };
  const handleDeleteSet = (set: MCQSet, e: React.MouseEvent) => { 
      e.stopPropagation(); 
      setDeleteTarget({ type: 'set', id: set.id, name: set.name }); 
      setActiveMenuId(null);
  };

  const performDelete = async () => {
      if (!deleteTarget) return;
      try {
          if (deleteTarget.type === 'subtopic') {
              const allSets = await mcqSetService.where('subtopicId', deleteTarget.id);
              for(const s of allSets) await mcqSetService.delete(s.id);
              await subtopicService.delete(deleteTarget.id);
              logAction('delete', 'subtopic', deleteTarget.id);
              navigate(`/live-mcq/topic/${topicId}`);
              toast.success("Subtopic deleted");
          } else {
              await mcqSetService.delete(deleteTarget.id);
              logAction('delete', 'set', deleteTarget.id);
              toast.success("Set deleted");
          }
      } catch (e: any) { toast.error(e.message || "Delete failed"); } 
      finally { setDeleteTarget(null); }
  };

  const initiateRename = (type: 'subtopic' | 'set', item: {id: string, name: string}, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setRenameTarget(type);
      setRenameItem(item);
      setRenameValue(item.name);
      setShowRenameModal(true);
      setActiveMenuId(null);
  };

  const performRename = async () => {
      if (!renameItem || !renameValue.trim()) return;
      try {
          if (renameTarget === 'subtopic') {
              await subtopicService.update(renameItem.id, { name: renameValue });
              setSubtopic(prev => prev ? { ...prev, name: renameValue } : null);
          } else {
              await mcqSetService.update(renameItem.id, { name: renameValue });
          }
          setShowRenameModal(false);
          toast.success("Renamed successfully");
      } catch (e: any) { toast.error(e.message || "Rename failed"); }
  };

  const toggleArchiveSet = async (set: MCQSet, e: React.MouseEvent) => {
      e.stopPropagation();
      const newValue = !set.isArchived;
      try {
          await mcqSetService.update(set.id, { isArchived: newValue });
          logAction(newValue ? 'archive' : 'unarchive', 'set', set.id);
          toast.success(newValue ? "Set archived" : "Set unarchived");
          setActiveMenuId(null);
      } catch(e: any) { toast.error(e.message || "Archive failed"); }
  };

  const handlePracticeAll = () => {
      const allMcqs = sets.flatMap(s => s.mcqs);
      if (allMcqs.length === 0) {
          if (isSyncing) return toast.error("Still loading MCQs, please wait a moment...");
          return toast.error("No MCQs found");
      }
      setShowPracticeSheet(true);
  };

  const handleExport = () => {
      const totalMCQs = sets.reduce((acc, s) => acc + s.mcqs.length, 0);
      if (totalMCQs === 0) {
          if (isSyncing) return toast.error("Still loading MCQs, please wait a moment...");
          return toast.error("No MCQs to export");
      }
      navigate(`/create?mode=export&source=subtopic&sourceId=${subtopicId}`);
  };

  // Handlers for SetItem
  const handleNavigateSet = (id: string) => navigate(`/live-mcq/set/${id}`);
  const handleMenuToggleSet = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };
  const handlePracticeSet = (id: string) => {
      navigate(`/live-mcq/practice/${id}`);
      setActiveMenuId(null);
  };
  const handleExamSet = (id: string) => {
      navigate(`/live-mcq/exam/${id}`);
      setActiveMenuId(null);
  };
  const handleExportSet = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/create?mode=export&source=set&sourceId=${id}`);
      setActiveMenuId(null);
  };
  const handleRenameSet = (set: MCQSet, e: React.MouseEvent) => {
      initiateRename('set', set, e);
  };

  if (initialLoading && !subtopic) return <div className="p-10 text-center font-sans tracking-widest uppercase text-xs text-secondary mt-10">Loading...</div>;
  if (!subtopic || !topic) return null;

  return (
    <div className="min-h-screen bg-background pb-20 pt-[60px]">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-background/90 backdrop-blur-md border-b border-border z-50 px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate(`/live-mcq/topic/${topicId}`)} 
                    className="p-2 -ml-2 text-text-primary hover:bg-[#EBE7DF] rounded-none transition-colors"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="font-sans text-xs font-semibold uppercase tracking-widest text-text-primary absolute left-1/2 -translate-x-1/2">
                {subtopic.name}
            </h1>
            <div className="flex items-center gap-1">
                 <button 
                    onClick={(e) => initiateRename('subtopic', subtopic, e)}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-none"
                >
                    <Icon name="edit-3" size="sm" />
                </button>
                <button 
                    onClick={handleDeleteSubtopic}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-none"
                >
                    <Icon name="trash-2" size="sm" />
                </button>
            </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-5 mt-4">
            
            {/* Breadcrumb */}
            <div className="flex items-center font-sans text-[10px] font-semibold uppercase tracking-widest mb-6">
                <span 
                    onClick={() => navigate(`/live-mcq/topic/${topicId}`)}
                    className="text-text-primary cursor-pointer hover:text-text-primary/90 transition-colors"
                >
                    {topic.name}
                </span>
                <span className="text-text-secondary mx-3">/</span>
                <span className="text-text-secondary">
                    {subtopic.name}
                </span>
            </div>

            {/* Info Card */}
            <div className="p-6 border border-border bg-surface mb-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-[26px] font-serif font-medium text-text-primary mb-2">{subtopic.name}</h2>
                    <div className="flex items-center gap-4 font-sans text-[10px] text-text-secondary font-semibold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <Icon name="folder" size="xs" />
                            <span>{sets.length} Sets</span>
                        </div>
                        <div className="w-1 h-1 rounded-none bg-border"></div>
                        <div className="flex items-center gap-2">
                            <Icon name="file-text" size="xs" />
                            <span>{isSyncing ? '...' : sets.reduce((acc, s) => acc + s.mcqs.length, 0)} MCQs</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-[12px] mt-8 relative z-10">
                    <button 
                        onClick={handlePracticeAll}
                        className="flex-1 bg-text-primary text-background border border-text-primary py-[14px] rounded-none font-sans font-semibold text-[13px] uppercase tracking-widest transition-all disabled:opacity-50 hover:bg-background hover:text-text-primary flex justify-center items-center gap-2"
                    >
                        <Icon name="play" size="sm" /> PRACTICE ALL
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex-1 bg-background border border-border text-text-primary py-[14px] rounded-none font-sans font-semibold text-[13px] uppercase tracking-widest transition-all disabled:opacity-50 hover:bg-[#EBE7DF] flex justify-center items-center gap-2"
                    >
                        <Icon name="share" size="sm" /> EXPORT PDF
                    </button>
                </div>
            </div>

            {/* Sets Header */}
            <div className="flex items-center justify-between mt-2 mb-4 px-1 border-b border-border pb-2">
                <div className="flex items-center gap-3">
                    <h3 className="font-sans text-xs font-semibold uppercase tracking-widest text-text-primary">MCQ SETS</h3>
                    <button 
                        onClick={() => setShowArchived(!showArchived)} 
                        className={`text-text-secondary hover:text-text-primary transition-colors ${showArchived ? 'text-text-primary' : ''}`}
                    >
                        <Icon name="folder" size="sm" />
                    </button>
                </div>
                <button 
                    onClick={() => setShowCreateSet(true)}
                    className="bg-text-primary text-background px-4 py-2 rounded-none text-[11px] font-sans font-semibold tracking-widest uppercase transition-all hover:bg-text-primary/90 flex items-center gap-1.5"
                >
                    <Icon name="plus" size="xs" /> NEW SET
                </button>
            </div>

            {showArchived && <div className="font-sans text-[10px] font-semibold text-center text-text-primary uppercase tracking-widest bg-surface p-3 border border-border mb-4">Viewing Archived Sets</div>}

            {filteredSets.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border bg-surface">
                    <p className="font-sans text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">No sets found</p>
                    <button onClick={() => setShowCreateSet(true)} className="text-text-primary font-sans text-[11px] font-bold uppercase tracking-widest hover:text-text-primary/90 transition-colors">CREATE FIRST SET</button>
                </div>
            ) : (
                <div className="flex flex-col gap-[8px]">
                    {filteredSets.map(set => (
                        <SetItem 
                            key={set.id}
                            set={set}
                            activeMenuId={activeMenuId}
                            onNavigate={handleNavigateSet}
                            onMenuToggle={handleMenuToggleSet}
                            onPractice={handlePracticeSet}
                            onExam={handleExamSet}
                            onExport={handleExportSet}
                            onRename={handleRenameSet}
                            onArchive={toggleArchiveSet}
                            onDelete={handleDeleteSet}
                        />
                    ))}
                </div>
            )}
        </div>

        <PremiumModal isOpen={showCreateSet} onClose={() => setShowCreateSet(false)} title="New MCQ Set">
            <div className="space-y-6">
                <PremiumInput label="SET NAME" placeholder="e.g. Chapter 1 - Motion" value={newSetName} onChange={setNewSetName} />
                <div className="space-y-4 pt-2">
                    <p className="font-sans text-[10px] font-bold text-secondary uppercase tracking-widest">Initial Content:</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleCreateSet([])} disabled={!newSetName.trim()} className="p-4 border border-border bg-background hover:bg-surface text-center transition-colors disabled:opacity-50"><div className="text-2xl mb-2 opacity-80">📝</div><div className="font-serif text-[15px] font-medium text-text-primary">Empty Set</div></button>
                        <button onClick={startBulkImportFlow} disabled={!newSetName.trim()} className="p-4 border border-border bg-background hover:bg-surface text-center transition-colors disabled:opacity-50"><div className="text-2xl mb-2 opacity-80">📋</div><div className="font-serif text-[15px] font-medium text-text-primary">Bulk Import</div></button>
                    </div>
                </div>
                <div className="flex justify-end pt-4"><PremiumButton variant="ghost" onClick={() => setShowCreateSet(false)}>CANCEL</PremiumButton></div>
            </div>
        </PremiumModal>

        <BulkImportModal isOpen={showBulkImport} onClose={() => setShowBulkImport(false)} onImport={handleCreateSet} />
        
        <PremiumModal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} title="Rename" size="sm">
            <div className="space-y-6"><PremiumInput label="NAME" value={renameValue} onChange={setRenameValue} /><div className="flex justify-end gap-3 mt-4"><PremiumButton variant="ghost" onClick={() => setShowRenameModal(false)}>CANCEL</PremiumButton><PremiumButton onClick={performRename}>SAVE</PremiumButton></div></div>
        </PremiumModal>
        
        <PremiumModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete?" size="sm">
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

        <PracticeFilterSheet
            isOpen={showPracticeSheet}
            onClose={() => setShowPracticeSheet(false)}
            setId={subtopic.id} // Using subtopic ID as the key for history
            mcqs={sets.flatMap(s => s.mcqs)}
            onStart={(ids, settings, attempts) => {
                setShowPracticeSheet(false);
                navigate('/live-mcq/practice', { 
                    state: { 
                        mcqIds: ids,
                        settings: settings,
                        sourceName: subtopic.name,
                        attempts: attempts,
                        backPath: `/live-mcq/topic/${topicId}/subtopic/${subtopic.id}`
                    } 
                });
            }}
        />
    </div>
  );
};

export default SubtopicDetailPage;
