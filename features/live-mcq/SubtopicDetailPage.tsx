
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
          
          if (source === 'cache') setIsSyncing(true);
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
      if (allMcqs.length === 0) return toast.error("No MCQs found");
      navigate('/live-mcq/practice', { state: { customMCQs: allMcqs, sourceName: subtopic?.name } });
  };

  const handleExport = () => {
      const totalMCQs = sets.reduce((acc, s) => acc + s.mcqs.length, 0);
      if (totalMCQs === 0) return toast.error("No MCQs to export");
      navigate(`/create?mode=export&source=subtopic&sourceId=${subtopicId}`);
  };

  if (initialLoading && !subtopic) return <div className="p-10 text-center text-gray-500">Loading...</div>;
  if (!subtopic || !topic) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-[60px]">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate(`/live-mcq/topic/${topicId}`)} 
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="text-[18px] font-semibold text-slate-900 absolute left-1/2 -translate-x-1/2 tracking-tight">
                {subtopic.name}
            </h1>
            <div className="flex items-center gap-1">
                 <button 
                    onClick={(e) => initiateRename('subtopic', subtopic, e)}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full"
                >
                    <Icon name="edit-3" size="sm" />
                </button>
                <button 
                    onClick={handleDeleteSubtopic}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full"
                >
                    <Icon name="trash-2" size="sm" />
                </button>
            </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-5 mt-4">
            
            {/* Breadcrumb */}
            <div className="flex items-center text-[13px] font-medium mb-4">
                <span 
                    onClick={() => navigate(`/live-mcq/topic/${topicId}`)}
                    className="text-emerald-600 cursor-pointer hover:underline"
                >
                    {topic.name}
                </span>
                <span className="text-slate-300 mx-1.5">/</span>
                <span className="text-slate-500">
                    {subtopic.name}
                </span>
            </div>

            {/* Info Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div>
                    <h2 className="text-[20px] font-bold text-slate-900">{subtopic.name}</h2>
                    <p className="text-[14px] font-normal text-slate-500 mt-1">
                        {sets.length} Sets • {sets.reduce((acc, s) => acc + s.mcqs.length, 0)} MCQs
                    </p>
                </div>
                <div className="flex gap-3 mt-4">
                    <button 
                        onClick={handlePracticeAll}
                        className="flex-1 bg-emerald-600 text-white font-semibold py-3.5 px-4 rounded-xl text-[15px] active:scale-[0.98] transition-transform flex justify-center items-center gap-2 shadow-sm hover:bg-emerald-500"
                    >
                        <Icon name="play" size="sm" /> Practice All
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 font-medium py-3.5 px-4 rounded-xl text-[15px] active:scale-[0.98] transition-transform flex justify-center items-center gap-2 hover:bg-slate-50"
                    >
                        <Icon name="share" size="sm" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Sets Header */}
            <div className="flex items-center justify-between mt-7 mb-3.5">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-slate-400 tracking-wide uppercase px-1">MCQ Sets</h3>
                    <button 
                        onClick={() => setShowArchived(!showArchived)} 
                        className={`text-slate-400 hover:text-emerald-600 transition-colors ${showArchived ? 'text-emerald-600' : ''}`}
                    >
                        <Icon name="folder" size="sm" />
                    </button>
                </div>
                <button 
                    onClick={() => setShowCreateSet(true)}
                    className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[13px] font-bold active:scale-95 transition-all hover:bg-slate-50 shadow-sm"
                >
                    + New Set
                </button>
            </div>

            {showArchived && <div className="text-xs text-center text-orange-600 bg-orange-50 p-2 rounded-xl border border-orange-100 mb-2">Viewing Archived Sets</div>}

            {filteredSets.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50/50">
                    <p className="text-[14px] text-slate-400 mb-2">No sets found</p>
                    <button onClick={() => setShowCreateSet(true)} className="text-emerald-600 font-medium text-sm hover:underline">Create First Set</button>
                </div>
            ) : (
                <div className="flex flex-col gap-[14px]">
                    {filteredSets.map(set => (
                        <div 
                            key={set.id}
                            onClick={() => navigate(`/live-mcq/set/${set.id}`)}
                            className="relative group bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                {/* Left Content */}
                                <div>
                                    <h3 className={`text-[17px] font-semibold mb-1 ${set.isArchived ? 'text-slate-400' : 'text-slate-900'}`}>
                                        {set.name}
                                        {set.isArchived && <span className="ml-2 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-normal align-middle">Archived</span>}
                                    </h3>
                                    <div className="text-[13px] font-normal text-slate-500">
                                        {set.mcqs.length} MCQs • Last updated: {new Date(set.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                
                                {/* Right Actions */}
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === set.id ? null : set.id);
                                        }}
                                        className="p-2 text-slate-300 hover:text-slate-900 transition-colors rounded-full relative z-10"
                                    >
                                        <Icon name="more-vertical" size="sm" />
                                    </button>
                                    <div className="text-slate-300">
                                        <Icon name="chevron-right" size="md" />
                                    </div>
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            {activeMenuId === set.id && (
                                <div className="absolute right-4 top-12 z-20 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/live-mcq/practice/${set.id}`); setActiveMenuId(null); }}
                                        disabled={set.mcqs.length === 0}
                                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 disabled:opacity-50"
                                    >
                                        <Icon name="play" size="sm" className="text-emerald-500" /> Practice
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/live-mcq/exam/${set.id}`); setActiveMenuId(null); }}
                                        disabled={set.mcqs.length === 0}
                                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 disabled:opacity-50"
                                    >
                                        <Icon name="clock" size="sm" className="text-indigo-500" /> Exam
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/create?mode=export&source=set&sourceId=${set.id}`); setActiveMenuId(null); }}
                                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50"
                                    >
                                        <Icon name="share" size="sm" className="text-slate-400" /> Export PDF
                                    </button>
                                    <button 
                                        onClick={(e) => initiateRename('set', set, e)}
                                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50"
                                    >
                                        <Icon name="edit-3" size="sm" className="text-slate-400" /> Edit
                                    </button>
                                    <button 
                                        onClick={(e) => toggleArchiveSet(set, e)}
                                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50"
                                    >
                                        <Icon name="folder" size="sm" className="text-slate-400" /> {set.isArchived ? "Unarchive" : "Archive"}
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteSet(set, e)}
                                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
                                    >
                                        <Icon name="trash-2" size="sm" /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        <PremiumModal isOpen={showCreateSet} onClose={() => setShowCreateSet(false)} title="New MCQ Set">
            <div className="space-y-4">
                <PremiumInput label="Set Name" placeholder="e.g. Chapter 1 - Motion" value={newSetName} onChange={setNewSetName} />
                <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Initial Content:</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleCreateSet([])} disabled={!newSetName.trim()} className="p-3 border rounded-lg hover:bg-gray-50 text-center"><div className="text-xl mb-1">📝</div><div className="text-sm font-medium">Empty Set</div></button>
                        <button onClick={startBulkImportFlow} disabled={!newSetName.trim()} className="p-3 border rounded-lg hover:bg-gray-50 text-center"><div className="text-xl mb-1">📋</div><div className="text-sm font-medium">Bulk Import</div></button>
                    </div>
                </div>
                <div className="flex justify-end pt-2"><PremiumButton variant="ghost" onClick={() => setShowCreateSet(false)}>Cancel</PremiumButton></div>
            </div>
        </PremiumModal>

        <BulkImportModal isOpen={showBulkImport} onClose={() => setShowBulkImport(false)} onImport={handleCreateSet} />
        <PremiumModal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} title="Rename" size="sm">
            <div className="space-y-4"><PremiumInput label="Name" value={renameValue} onChange={setRenameValue} /><div className="flex justify-end gap-3"><PremiumButton variant="ghost" onClick={() => setShowRenameModal(false)}>Cancel</PremiumButton><PremiumButton onClick={performRename}>Save</PremiumButton></div></div>
        </PremiumModal>
        <PremiumModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete?" size="sm">
            <div className="space-y-6 text-center pt-2"><div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto"><svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div><div className="space-y-2"><h3 className="text-lg font-bold text-gray-900">Delete "{deleteTarget?.name}"?</h3><p className="text-sm text-gray-500">This action cannot be undone.</p></div><div className="flex gap-3 justify-center"><PremiumButton variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</PremiumButton><PremiumButton variant="danger" onClick={performDelete}>Delete</PremiumButton></div></div>
        </PremiumModal>
    </div>
  );
};

export default SubtopicDetailPage;
