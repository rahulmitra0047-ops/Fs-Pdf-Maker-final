
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumInput from '../../shared/components/PremiumInput';
import { topicService, subtopicService, mcqSetService } from '../../core/storage/services';
import { Topic, Subtopic, MCQSet } from '../../types';
import { useToast } from '../../shared/context/ToastContext';
import { generateUUID } from '../../core/storage/idGenerator';
import Icon from '../../shared/components/Icon';

const TopicDetailPage: React.FC = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  // Data State (Snapshots)
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [sets, setSets] = useState<MCQSet[]>([]);
  
  // Loading & Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Modals & Actions
  const [showCreateSubtopic, setShowCreateSubtopic] = useState(false);
  const [newSubtopicName, setNewSubtopicName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<'topic' | 'subtopic'>('topic');
  const [renameItem, setRenameItem] = useState<{id: string, name: string} | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'topic' | 'subtopic', id: string, name: string } | null>(null);

  // 1. Snapshot Read Flow
  useEffect(() => {
    if (!topicId) return;

    // Subscribe to Topic (Metadata)
    const unsubTopic = topicService.subscribeGetById(topicId, (data, source) => {
        if (data) {
            setTopic(data);
            if (source === 'cache') setIsSyncing(true);
            else setIsSyncing(false);
            setInitialLoading(false);
        } else if (source === 'network') {
            toast.error("Topic not found");
            navigate('/live-mcq/topics');
        }
    });

    // Subscribe to Subtopics (List Snapshot)
    const unsubSubtopics = subtopicService.subscribeGetAll((data, source) => {
        setSubtopics(data.filter(s => s.topicId === topicId));
        if (source === 'cache') setIsSyncing(true);
        else setIsSyncing(false);
    });

    // Subscribe to Sets (List Snapshot for Stats)
    const unsubSets = mcqSetService.subscribeGetAll((data, source) => {
        setSets(data); // We filter later
        if (source === 'cache') setIsSyncing(true);
        else setIsSyncing(false);
    });

    return () => {
        unsubTopic();
        unsubSubtopics();
        unsubSets();
    };
  }, [topicId, navigate, toast]);

  // 2. Computed Stats (In-Memory Aggregation)
  const { enhancedSubtopics, topicStats } = useMemo(() => {
      const sortedSubs = [...subtopics].sort((a, b) => a.order - b.order);
      const subtopicIds = new Set(sortedSubs.map(s => s.id));
      const relevantSets = sets.filter(s => subtopicIds.has(s.subtopicId));

      const enhanced = sortedSubs.map(st => {
          const mySets = relevantSets.filter(s => s.subtopicId === st.id);
          return { ...st, setLen: mySets.length };
      });

      const totalMCQs = relevantSets.reduce((acc, s) => acc + (s.mcqs?.length || 0), 0);

      return {
          enhancedSubtopics: enhanced,
          topicStats: {
              subtopics: subtopics.length,
              sets: relevantSets.length,
              mcqs: totalMCQs
          }
      };
  }, [subtopics, sets]);

  const handleCreateSubtopic = async () => {
      if (!newSubtopicName.trim() || !topic) return;
      try {
          const newSub = {
              id: generateUUID(),
              topicId: topic.id,
              name: newSubtopicName,
              order: subtopics.length,
              createdAt: Date.now()
          };
          // Optimistic update via subscription flow
          await subtopicService.create(newSub);
          setShowCreateSubtopic(false);
          setNewSubtopicName('');
          toast.success("Subtopic created");
      } catch (e: any) {
          toast.error(e.message || "Failed to create subtopic");
      }
  };

  const handleDeleteTopic = () => {
      if (topic) setDeleteTarget({ type: 'topic', id: topic.id, name: topic.name });
  };

  const handleDeleteSubtopic = (sub: Subtopic, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteTarget({ type: 'subtopic', id: sub.id, name: sub.name });
  };

  const performDelete = async () => {
      if (!deleteTarget) return;
      try {
          if (deleteTarget.type === 'topic') {
              const subs = subtopics.filter(s => s.topicId === deleteTarget.id);
              for (const sub of subs) {
                  const tSets = sets.filter(s => s.subtopicId === sub.id);
                  for (const s of tSets) await mcqSetService.delete(s.id);
                  await subtopicService.delete(sub.id);
              }
              await topicService.delete(deleteTarget.id);
              navigate('/live-mcq/topics');
              toast.success("Topic deleted");
          } else {
              const tSets = sets.filter(s => s.subtopicId === deleteTarget.id);
              for (const s of tSets) await mcqSetService.delete(s.id);
              await subtopicService.delete(deleteTarget.id);
              toast.success("Subtopic deleted");
          }
      } catch (e: any) {
          toast.error(e.message || "Failed to delete");
      } finally {
          setDeleteTarget(null);
      }
  };

  const initiateRename = (type: 'topic' | 'subtopic', item: {id: string, name: string}, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setRenameTarget(type);
      setRenameItem(item);
      setRenameValue(item.name);
      setShowRenameModal(true);
  };

  const performRename = async () => {
      if (!renameItem || !renameValue.trim()) return;
      try {
          if (renameTarget === 'topic') {
              await topicService.update(renameItem.id, { name: renameValue });
          } else {
              await subtopicService.update(renameItem.id, { name: renameValue });
          }
          setShowRenameModal(false);
          toast.success("Renamed successfully");
      } catch (e: any) {
          toast.error(e.message || "Rename failed");
      }
  };

  const handlePracticeAll = async () => {
      const sortedSubs = [...subtopics].sort((a, b) => a.order - b.order);
      const subtopicIds = new Set(sortedSubs.map(s => s.id));
      const relevantSets = sets.filter(s => subtopicIds.has(s.subtopicId));
      const allMcqs = relevantSets.flatMap(s => s.mcqs);
      
      if (allMcqs.length === 0) return toast.error("No MCQs found");
      
      navigate('/live-mcq/practice', { 
          state: { 
              customMCQs: allMcqs, 
              sourceName: topic?.name 
          } 
      });
  };

  const handleExport = () => {
      if (!topic) return;
      if (topicStats.mcqs === 0) return toast.error("No MCQs to export");
      navigate(`/create?mode=export&source=topic&sourceId=${topic.id}`);
  };

  if (initialLoading && !topic) return <div className="p-10 text-center text-gray-500">Loading Topic...</div>;
  if (!topic) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-[60px]">
        {/* Custom Header replacing TopBar */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/live-mcq/topics')} 
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="text-[18px] font-semibold text-slate-900 absolute left-1/2 -translate-x-1/2 tracking-tight">
                {topic.name}
            </h1>
            <div className="flex items-center gap-1">
                 <button 
                    onClick={(e) => initiateRename('topic', topic, e)}
                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full"
                >
                    <Icon name="edit-3" size="sm" />
                </button>
                <button 
                    onClick={handleDeleteTopic}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full"
                >
                    <Icon name="trash-2" size="sm" />
                </button>
            </div>
        </header>

        <div className="max-w-3xl mx-auto px-5 mt-4 space-y-8">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-[24px] p-6 shadow-xl" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)' }}>
                
                <div className="flex items-start gap-5 mb-6">
                    {/* Letter Avatar */}
                    <div className="w-12 h-12 rounded-[14px] bg-white/10 flex items-center justify-center text-[22px] font-bold text-white shadow-inner flex-shrink-0 border border-white/10">
                        {topic.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-[24px] font-bold text-white leading-tight">{topic.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <p className="text-[13px] font-normal text-slate-300">Ready to Practice</p>
                        </div>
                    </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: 'Subtopics', value: topicStats.subtopics },
                        { label: 'Sets', value: topicStats.sets },
                        { label: 'Questions', value: topicStats.mcqs }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-[14px] p-3.5 text-center backdrop-blur-sm">
                            <div className="text-[22px] font-bold text-white leading-none mb-1">{stat.value}</div>
                            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handlePracticeAll}
                        className="bg-emerald-600 text-white font-semibold py-3.5 px-6 rounded-[14px] text-[15px] active:scale-[0.98] transition-transform shadow-lg shadow-emerald-900/20 hover:bg-emerald-500"
                    >
                        Practice
                    </button>
                    <button 
                        onClick={handleExport}
                        className="bg-white/10 border border-white/15 text-white font-medium py-3.5 px-6 rounded-[14px] text-[15px] active:scale-[0.98] transition-transform hover:bg-white/20"
                    >
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Subtopics List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-slate-400 tracking-wide uppercase px-1">
                        Subtopics
                    </h3>
                    <button 
                        onClick={() => setShowCreateSubtopic(true)}
                        className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[13px] font-bold active:scale-95 transition-all hover:bg-slate-50 shadow-sm"
                    >
                        + Add Subtopic
                    </button>
                </div>

                {enhancedSubtopics.length === 0 ? (
                    // Empty state
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50/50">
                        <div className="text-slate-300 mb-2 opacity-50">
                            <Icon name="folder" size="xl" />
                        </div>
                        <p className="text-[14px] text-slate-400 font-medium">No subtopics yet</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-[14px]">
                        {enhancedSubtopics.map((sub, index) => (
                            <div 
                                key={sub.id}
                                onClick={() => navigate(`/live-mcq/topic/${topic.id}/subtopic/${sub.id}`)}
                                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.99] cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-[16px] font-bold border border-slate-100">
                                            {sub.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-[16px] font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                                {sub.name}
                                            </h4>
                                            <p className="text-[13px] font-normal text-slate-500 mt-0.5">
                                                {sub.setLen} Sets
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={(e) => initiateRename('subtopic', sub, e)}
                                            className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
                                        >
                                            <Icon name="edit-3" size="sm" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteSubtopic(sub, e)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Icon name="trash-2" size="sm" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <PremiumModal isOpen={showCreateSubtopic} onClose={() => setShowCreateSubtopic(false)} title="Add Subtopic" size="sm">
            <div className="space-y-5">
                <p className="text-sm text-gray-500">Create a new sub-category for <b>{topic.name}</b>.</p>
                <PremiumInput 
                    label="Subtopic Name"
                    placeholder="e.g. Mechanics"
                    value={newSubtopicName}
                    onChange={setNewSubtopicName}
                />
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowCreateSubtopic(false)}>Cancel</PremiumButton>
                    <PremiumButton onClick={handleCreateSubtopic} disabled={!newSubtopicName.trim()}>Create Subtopic</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        <PremiumModal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} title={`Rename ${renameTarget === 'topic' ? 'Topic' : 'Subtopic'}`} size="sm">
            <div className="space-y-4">
                <PremiumInput label="Name" value={renameValue} onChange={setRenameValue} />
                <div className="flex justify-end gap-3">
                    <PremiumButton variant="ghost" onClick={() => setShowRenameModal(false)}>Cancel</PremiumButton>
                    <PremiumButton onClick={performRename}>Save</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        <PremiumModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete?" size="sm">
            <div className="space-y-6 text-center pt-2">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">Delete "{deleteTarget?.name}"?</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
                <div className="flex gap-3 justify-center">
                    <PremiumButton variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={performDelete}>Delete</PremiumButton>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default TopicDetailPage;
