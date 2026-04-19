
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
import PracticeFilterSheet from './components/PracticeFilterSheet';
import SubtopicItem from './components/SubtopicItem';

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
  
  const [showPracticeSheet, setShowPracticeSheet] = useState(false);

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
    });

    // Subscribe to Sets (List Snapshot for Stats)
    const unsubSets = mcqSetService.subscribeGetAll((data, source) => {
        setSets(data); // We filter later
        if (source === 'cache' || source === 'network-partial') setIsSyncing(true);
        else setIsSyncing(false);
    });

    return () => {
        unsubTopic();
        unsubSubtopics();
        unsubSets();
    };
  }, [topicId, navigate, toast]);

  // 2. Computed Stats (In-Memory Aggregation)
  const { enhancedSubtopics, topicStats, allTopicMcqs } = useMemo(() => {
      const sortedSubs = [...subtopics].sort((a, b) => a.order - b.order);
      const subtopicIds = new Set(sortedSubs.map(s => s.id));
      const relevantSets = sets.filter(s => subtopicIds.has(s.subtopicId));

      const enhanced = sortedSubs.map(st => {
          const mySets = relevantSets.filter(s => s.subtopicId === st.id);
          return { ...st, setLen: mySets.length };
      });

      const allMcqs = relevantSets.flatMap(s => s.mcqs);
      const totalMCQs = allMcqs.length;

      return {
          enhancedSubtopics: enhanced,
          topicStats: {
              subtopics: subtopics.length,
              sets: relevantSets.length,
              mcqs: totalMCQs
          },
          allTopicMcqs: allMcqs
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

  const handlePracticeAll = () => {
      if (allTopicMcqs.length === 0) {
          if (isSyncing) {
              return toast.error("Still loading MCQs, please wait a moment...");
          }
          return toast.error("No MCQs found");
      }
      setShowPracticeSheet(true);
  };

  const handleExport = () => {
      if (!topic) return;
      if (topicStats.mcqs === 0) {
          if (isSyncing) {
              return toast.error("Still loading MCQs, please wait a moment...");
          }
          return toast.error("No MCQs to export");
      }
      navigate(`/create?mode=export&source=topic&sourceId=${topic.id}`);
  };

  // Handlers for SubtopicItem
  const handleNavigateSubtopic = (id: string) => navigate(`/live-mcq/topic/${topicId}/subtopic/${id}`);
  const handleRenameSubtopic = (sub: Subtopic, e: React.MouseEvent) => initiateRename('subtopic', sub, e);

  if (initialLoading && !topic) return <div className="p-10 text-center text-gray-500">Loading Topic...</div>;
  if (!topic) return null;

  return (
    <div className="min-h-screen bg-background pb-20 pt-[60px] font-sans">
        {/* Custom Header replacing TopBar */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-background border-b border-border z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/live-mcq/topics')} 
                    className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors active:scale-95 rounded-none"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="text-[18px] font-serif font-medium text-text-primary absolute left-1/2 -translate-x-1/2 tracking-tight">
                {topic.name}
            </h1>
            <div className="flex items-center gap-1">
                 <button 
                    onClick={(e) => initiateRename('topic', topic, e)}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-none"
                >
                    <Icon name="edit-3" size="sm" />
                </button>
                <button 
                    onClick={handleDeleteTopic}
                    className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-none"
                >
                    <Icon name="trash-2" size="sm" />
                </button>
            </div>
        </header>

        <div className="max-w-md mx-auto px-6 mt-6 space-y-8">
            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-none p-6 bg-surface border border-border shadow-none">
                
                <div className="flex items-start gap-5 mb-6">
                    {/* Letter Avatar */}
                    <div className="w-12 h-12 rounded-none bg-background flex items-center justify-center text-[22px] font-bold text-text-primary font-serif border border-border">
                        {topic.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-[24px] font-serif font-bold text-text-primary leading-tight">{topic.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-none bg-text-secondary"></span>
                            <p className="text-[11px] font-sans uppercase tracking-widest font-semibold text-text-secondary">Ready to Practice</p>
                        </div>
                    </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: 'Subtopics', value: topicStats.subtopics },
                        { label: 'Sets', value: topicStats.sets },
                        { label: 'MCQs', value: isSyncing ? '...' : topicStats.mcqs }
                    ].map((stat, i) => (
                        <div key={i} className="bg-background border border-border rounded-none p-3.5 text-center">
                            <div className={`text-[22px] font-serif font-medium text-text-primary leading-none mb-1 ${stat.value === '...' ? 'animate-pulse' : ''}`}>{stat.value}</div>
                            <div className="text-[9px] font-sans font-semibold text-text-secondary uppercase tracking-[0.1em]">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handlePracticeAll}
                        className="bg-surface border border-border text-text-primary font-sans font-semibold py-3 px-6 rounded-none text-[12px] uppercase tracking-widest active:scale-[0.98] transition-transform hover:bg-[#EBE7DF]"
                    >
                        Practice
                    </button>
                    <button 
                        onClick={handleExport}
                        className="bg-background border border-border text-text-primary font-sans font-semibold py-3 px-6 rounded-none text-[12px] uppercase tracking-widest active:scale-[0.98] transition-transform hover:bg-[#EBE7DF]"
                    >
                        Export
                    </button>
                </div>
            </div>

            {/* Subtopics List */}
            <div>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-[11px] font-sans font-semibold text-text-secondary tracking-[0.1em] uppercase">
                        Subtopics
                    </h3>
                    <button 
                        onClick={() => setShowCreateSubtopic(true)}
                        className="bg-surface border border-border text-text-primary px-3 py-2 rounded-none text-[10px] font-semibold uppercase tracking-widest active:scale-95 transition-all hover:bg-[#EBE7DF]"
                    >
                        Add Subtopic
                    </button>
                </div>

                {enhancedSubtopics.length === 0 ? (
                    // Empty state
                    <div className="text-center py-10 border border-border rounded-none bg-surface">
                        <div className="text-text-secondary mb-3">
                            <Icon name="folder" size="lg" />
                        </div>
                        <p className="text-[11px] uppercase tracking-widest text-text-secondary font-semibold font-sans">No subtopics yet</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {enhancedSubtopics.map((sub) => (
                            <SubtopicItem 
                                key={sub.id}
                                subtopic={sub}
                                onNavigate={handleNavigateSubtopic}
                                onRename={handleRenameSubtopic}
                                onDelete={handleDeleteSubtopic}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>

        <PremiumModal isOpen={showCreateSubtopic} onClose={() => setShowCreateSubtopic(false)} title="Add Subtopic" size="sm">
            <div className="space-y-5">
                <p className="font-serif text-sm text-text-secondary">Create a new sub-category for <b className="font-medium text-text-primary">{topic.name}</b>.</p>
                <PremiumInput 
                    label="Subtopic Name"
                    placeholder="e.g. Mechanics"
                    value={newSubtopicName}
                    onChange={setNewSubtopicName}
                />
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowCreateSubtopic(false)}>Cancel</PremiumButton>
                    <PremiumButton onClick={handleCreateSubtopic} disabled={!newSubtopicName.trim()}>Create</PremiumButton>
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

        <PremiumModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete" size="sm">
            <div className="space-y-6 pt-2">
                <div className="bg-surface p-5 border border-border">
                    <p className="font-serif text-[15px] text-text-primary text-center leading-relaxed">
                        Are you sure you want to delete <br/><b className="font-medium">"{deleteTarget?.name}"</b>? <br/>
                        <span className="text-secondary italic">This action cannot be undone.</span>
                    </p>
                </div>
                <div className="flex gap-3 justify-end items-center">
                    <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-background border border-border text-text-primary font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-surface transition-colors">Cancel</button>
                    <button onClick={performDelete} className="flex-1 py-3 bg-text-primary text-surface font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-text-primary/90 transition-colors">Delete</button>
                </div>
            </div>
        </PremiumModal>

        <PracticeFilterSheet
            isOpen={showPracticeSheet}
            onClose={() => setShowPracticeSheet(false)}
            setId={topic.id} // Using topic ID as the key for history
            mcqs={allTopicMcqs}
            onStart={(ids, settings, attempts) => {
                setShowPracticeSheet(false);
                navigate('/live-mcq/practice', { 
                    state: { 
                        mcqIds: ids,
                        settings: settings,
                        sourceName: topic.name,
                        attempts: attempts,
                        backPath: `/live-mcq/topic/${topic.id}`
                    } 
                });
            }}
        />
    </div>
  );
};

export default TopicDetailPage;
