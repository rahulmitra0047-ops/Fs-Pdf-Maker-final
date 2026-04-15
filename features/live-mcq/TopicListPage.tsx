
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumInput from '../../shared/components/PremiumInput';
import { topicService, subtopicService, mcqSetService } from '../../core/storage/services';
import { Topic, Subtopic, MCQSet } from '../../types';
import AddMCQWizard from './components/AddMCQWizard';
import { useToast } from '../../shared/context/ToastContext';
import { generateUUID } from '../../core/storage/idGenerator';
import Icon from '../../shared/components/Icon';
import PracticeFilterSheet from './components/PracticeFilterSheet';
import TopicItem from './components/TopicItem';

const PAGE_SIZE = 25;

const TopicListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [sets, setSets] = useState<MCQSet[]>([]);
  
  // States
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [topicToRename, setTopicToRename] = useState<Topic | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  const [activePracticeTopicId, setActivePracticeTopicId] = useState<string | null>(null);

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // FAB State
  const [isFabOpen, setIsFabOpen] = useState(false);

  useEffect(() => {
    // Click outside to close menu and FAB
    const handleClickOutside = () => {
        setActiveMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    // Subscriptions with sync awareness
    const unsubTopics = topicService.subscribeGetAll((data, source) => {
        setTopics(data);
        if (data.length > 0 || source === 'network') setInitialLoading(false);
    });
    
    const unsubSubtopics = subtopicService.subscribeGetAll((data) => setSubtopics(data));
    const unsubSets = mcqSetService.subscribeGetAll((data, source) => {
        setSets(data);
        setIsSyncing(source === 'cache' || source === 'network-partial');
    });

    return () => {
        unsubTopics();
        unsubSubtopics();
        unsubSets();
    };
  }, []);

    // Memoized stats calculation
    const enhancedTopics = useMemo(() => {
        return topics.map(t => {
            const tSubtopics = subtopics.filter(st => st.topicId === t.id);
            const tSubIds = new Set(tSubtopics.map(st => st.id));
            const tSets = sets.filter(s => tSubIds.has(s.subtopicId));
            const mcqCount = tSets.reduce((acc, s) => acc + (s.mcqs?.length || 0), 0);
            
            return {
                ...t,
                subtopicCount: tSubtopics.length,
                setCount: tSets.length,
                mcqCount
            };
        }).sort((a, b) => {
            const orderDiff = a.order - b.order;
            if (orderDiff !== 0) return orderDiff;
            return b.createdAt - a.createdAt; // Fallback to newest first if order matches
        });
    }, [topics, subtopics, sets]);

    const totalMCQs = useMemo(() => enhancedTopics.reduce((acc, t) => acc + t.mcqCount, 0), [enhancedTopics]);

    const visibleTopics = enhancedTopics.slice(0, visibleCount);

    const handleCreateTopic = async () => {
        if (!newTopicName.trim()) return;
        try {
            const newTopic: Topic = {
                id: generateUUID(),
                name: newTopicName,
                icon: '📚',
                order: topics.length, // Append to end
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await topicService.create(newTopic);
            setShowCreateTopic(false);
            setNewTopicName('');
            setIsFabOpen(false);
            toast.success("Topic created");
            // Force visible count to include new item if needed, though it's appended
            if (visibleCount < topics.length + 1) {
                 setVisibleCount(prev => Math.max(prev, topics.length + 1));
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to create topic");
        }
    };

  const handlePracticeAll = (topicId: string) => {
      const tSubtopics = subtopics.filter(st => st.topicId === topicId).map(st => st.id);
      const tSets = sets.filter(s => tSubtopics.includes(s.subtopicId));
      const allMcqs = tSets.flatMap(s => s.mcqs);
      
      if (allMcqs.length === 0) {
          if (isSyncing) return toast.error("Still loading MCQs, please wait a moment...");
          return toast.error("No MCQs in this topic");
      }
      
      setActivePracticeTopicId(topicId);
  };

  const handleExport = (topicId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const tSubtopics = subtopics.filter(st => st.topicId === topicId).map(st => st.id);
      const tSets = sets.filter(s => tSubtopics.includes(s.subtopicId));
      const allMcqsCount = tSets.reduce((acc, s) => acc + s.mcqs.length, 0);

      if (allMcqsCount === 0) {
          if (isSyncing) return toast.error("Still loading MCQs, please wait a moment...");
          return toast.error("No MCQs to export");
      }

      navigate(`/create?mode=export&source=topic&sourceId=${topicId}`);
  };

  const initiateRename = (topic: Topic, e: React.MouseEvent) => {
      e.stopPropagation();
      setTopicToRename(topic);
      setRenameValue(topic.name);
      setShowRenameModal(true);
  };

  const performRename = async () => {
      if (!topicToRename || !renameValue.trim()) return;
      try {
          await topicService.update(topicToRename.id, { name: renameValue });
          toast.success("Renamed successfully");
          setShowRenameModal(false);
      } catch (e: any) {
          toast.error(e.message || "Rename failed");
      }
  };

  const confirmDelete = (topic: Topic, e: React.MouseEvent) => {
      e.stopPropagation();
      setTopicToDelete(topic);
  };

  const performDelete = async () => {
      if (!topicToDelete) return;
      try {
          const tSubtopics = subtopics.filter(st => st.topicId === topicToDelete.id);
          for (const sub of tSubtopics) {
              const tSets = sets.filter(s => s.subtopicId === sub.id);
              for (const s of tSets) await mcqSetService.delete(s.id);
              await subtopicService.delete(sub.id);
          }
          await topicService.delete(topicToDelete.id);
          toast.success("Topic deleted");
          setTopicToDelete(null);
      } catch (e: any) {
          toast.error(e.message || "Delete failed");
      }
  };

  const handleFabAction = (action: 'topic' | 'mcq') => {
      if (action === 'topic') {
          setShowCreateTopic(true);
      } else {
          setShowAddWizard(true);
      }
      setIsFabOpen(false);
  };

  // Handlers for TopicItem
  const handleNavigate = (id: string) => navigate(`/live-mcq/topic/${id}`);
  const handleMenuToggle = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };
  const handlePractice = (id: string) => {
      handlePracticeAll(id);
      setActiveMenuId(null);
  };
  const handleExportClick = (id: string, e: React.MouseEvent) => {
      handleExport(id, e);
      setActiveMenuId(null);
  };
  const handleDeleteClick = (topic: Topic, e: React.MouseEvent) => {
      confirmDelete(topic, e);
      setActiveMenuId(null);
  };

  if (initialLoading && topics.length === 0) return <div className="p-10 text-center text-gray-500">Loading Topics...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-[60px] font-sans">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <Icon name="book-open" size="sm" className="text-white" />
                </div>
                <h1 className="text-[18px] font-bold tracking-tight text-slate-900">Live MCQ</h1>
            </div>
        </header>

        <div className="max-w-md mx-auto px-6">
            {!initialLoading && enhancedTopics.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[24px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 mt-4">
                    <div className="text-4xl mb-4 opacity-20 grayscale">📚</div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No Topics Found</h3>
                    <p className="text-sm text-slate-400 mb-6">Create a topic to start organizing MCQs</p>
                    <PremiumButton onClick={() => setShowCreateTopic(true)}>Create First Topic</PremiumButton>
                </div>
            ) : (
                <div className="mt-4">
                    {/* Dashboard Stats */}
                    <div className="rounded-[24px] p-6 shadow-xl mb-6" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)' }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-white/60 text-[13px] font-medium uppercase tracking-wider mb-1">Total Topics</h2>
                                <div className="text-white text-3xl font-bold">{enhancedTopics.length}</div>
                            </div>
                            <div className="h-12 w-px bg-white/10"></div>
                            <div className="text-right">
                                <h2 className="text-white/60 text-[13px] font-medium uppercase tracking-wider mb-1">Total MCQs</h2>
                                <div className="text-[#34D399] text-3xl font-bold">
                                    {isSyncing ? <span className="animate-pulse text-white/50 text-xl">Loading...</span> : totalMCQs}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-[14px] font-bold text-slate-800">All Topics</h3>
                    </div>

                    {/* Grid List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
                        {visibleTopics.map(topic => (
                            <TopicItem 
                                key={topic.id}
                                topic={topic}
                                activeMenuId={activeMenuId}
                                onNavigate={handleNavigate}
                                onRename={initiateRename}
                                onMenuToggle={handleMenuToggle}
                                onPractice={handlePractice}
                                onExport={handleExportClick}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>

                    {/* Pagination Control */}
                    {visibleCount < enhancedTopics.length && (
                        <button 
                            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                            className="w-full py-2.5 mt-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Load More ({enhancedTopics.length - visibleCount} remaining)
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Floating Action Button (FAB) */}
        <div className="fixed bottom-[100px] right-6 z-40 flex flex-col items-end gap-3">
            {isFabOpen && (
                <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-2 duration-200">
                    <button 
                        onClick={() => handleFabAction('mcq')}
                        className="flex items-center gap-3 group"
                    >
                        <span className="bg-white px-3 py-2 rounded-xl shadow-lg border border-slate-100 text-[13px] font-bold text-slate-700">Add MCQ</span>
                        <div className="w-12 h-12 bg-white text-indigo-600 border border-slate-100 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                            <Icon name="file-text" size="sm" />
                        </div>
                    </button>
                    <button 
                        onClick={() => handleFabAction('topic')}
                        className="flex items-center gap-3 group"
                    >
                        <span className="bg-white px-3 py-2 rounded-xl shadow-lg border border-slate-100 text-[13px] font-bold text-slate-700">Add Topic</span>
                        <div className="w-12 h-12 bg-white text-indigo-600 border border-slate-100 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                            <Icon name="folder" size="sm" />
                        </div>
                    </button>
                </div>
            )}
            
            <button 
                onClick={() => setIsFabOpen(!isFabOpen)}
                className={`w-14 h-14 rounded-full shadow-xl shadow-indigo-500/30 flex items-center justify-center transition-all duration-300 active:scale-90 ${isFabOpen ? 'bg-slate-800 text-white rotate-45' : 'bg-indigo-600 text-white'}`}
            >
                <Icon name="plus" size="lg" />
            </button>
        </div>

        <AddMCQWizard 
            isOpen={showAddWizard} 
            onClose={() => setShowAddWizard(false)} 
            onSuccess={() => { setShowAddWizard(false); }} 
        />

        <PremiumModal isOpen={showCreateTopic} onClose={() => setShowCreateTopic(false)} title="New Topic">
            <div className="space-y-4">
                <PremiumInput 
                    label="Topic Name" 
                    placeholder="e.g. Physics, History"
                    value={newTopicName}
                    onChange={setNewTopicName}
                />
                <div className="flex justify-end pt-2 gap-3">
                    <PremiumButton variant="ghost" onClick={() => setShowCreateTopic(false)}>Cancel</PremiumButton>
                    <PremiumButton onClick={handleCreateTopic}>Create</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        <PremiumModal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} title="Rename Topic" size="sm">
            <div className="space-y-4">
                <PremiumInput 
                    label="Name" 
                    value={renameValue}
                    onChange={setRenameValue}
                />
                <div className="flex justify-end pt-2 gap-3">
                    <PremiumButton variant="ghost" onClick={() => setShowRenameModal(false)}>Cancel</PremiumButton>
                    <PremiumButton onClick={performRename}>Save</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        <PremiumModal isOpen={!!topicToDelete} onClose={() => setTopicToDelete(null)} title="Delete Topic?" size="sm">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Are you sure you want to delete <b>{topicToDelete?.name}</b>? This will delete all subtopics and MCQs inside it.
                </p>
                <div className="flex justify-end pt-2 gap-3">
                    <PremiumButton variant="ghost" onClick={() => setTopicToDelete(null)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={performDelete}>Delete Forever</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        <PracticeFilterSheet
            isOpen={!!activePracticeTopicId}
            onClose={() => setActivePracticeTopicId(null)}
            setId={activePracticeTopicId || ''}
            mcqs={(() => {
                if (!activePracticeTopicId) return [];
                const tSubtopics = subtopics.filter(st => st.topicId === activePracticeTopicId).map(st => st.id);
                const tSets = sets.filter(s => tSubtopics.includes(s.subtopicId));
                return tSets.flatMap(s => s.mcqs);
            })()}
            onStart={(ids, settings, attempts) => {
                const topicName = topics.find(t => t.id === activePracticeTopicId)?.name;
                setActivePracticeTopicId(null);
                navigate('/live-mcq/practice', { 
                    state: { 
                        mcqIds: ids,
                        settings: settings,
                        sourceName: topicName,
                        attempts: attempts,
                        backPath: `/live-mcq/topics`
                    } 
                });
            }}
        />
    </div>
  );
};

export default TopicListPage;
