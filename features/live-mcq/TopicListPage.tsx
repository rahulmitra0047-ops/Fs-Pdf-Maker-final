
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumInput from '../../shared/components/PremiumInput';
import PremiumCard from '../../shared/components/PremiumCard'; // Keeping for other uses if any, or just removing
import { topicService, subtopicService, mcqSetService } from '../../core/storage/services';
import { Topic, Subtopic, MCQSet } from '../../types';
import AddMCQWizard from './components/AddMCQWizard';
import { useToast } from '../../shared/context/ToastContext';
import { generateUUID } from '../../core/storage/idGenerator';
import Icon from '../../shared/components/Icon';

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

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    // Click outside to close menu
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    // Subscriptions with sync awareness
    const unsubTopics = topicService.subscribeGetAll((data, source) => {
        setTopics(data);
        if (data.length > 0 || source === 'network') setInitialLoading(false);
        setIsSyncing(source === 'cache');
    });
    
    const unsubSubtopics = subtopicService.subscribeGetAll((data) => setSubtopics(data));
    const unsubSets = mcqSetService.subscribeGetAll((data, source) => {
        setSets(data);
        setIsSyncing(source === 'cache');
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
      }).sort((a, b) => a.order - b.order);
  }, [topics, subtopics, sets]);

  const visibleTopics = enhancedTopics.slice(0, visibleCount);

  const handleCreateTopic = async () => {
      if (!newTopicName.trim()) return;
      try {
          const newTopic: Topic = {
              id: generateUUID(),
              name: newTopicName,
              icon: '📚', // Default icon, not used in UI anymore
              order: topics.length,
              createdAt: Date.now(),
              updatedAt: Date.now()
          };
          await topicService.create(newTopic);
          setShowCreateTopic(false);
          setNewTopicName('');
          toast.success("Topic created");
      } catch (e: any) {
          toast.error(e.message || "Failed to create topic");
      }
  };

  const handlePracticeAll = (topicId: string) => {
      const tSubtopics = subtopics.filter(st => st.topicId === topicId).map(st => st.id);
      const tSets = sets.filter(s => tSubtopics.includes(s.subtopicId));
      const allMcqs = tSets.flatMap(s => s.mcqs);
      
      if (allMcqs.length === 0) return toast.error("No MCQs in this topic");
      
      navigate('/live-mcq/practice', { 
          state: { 
              customMCQs: allMcqs,
              source: 'topic',
              sourceName: topics.find(t => t.id === topicId)?.name 
          } 
      });
  };

  const handleExport = (topicId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const tSubtopics = subtopics.filter(st => st.topicId === topicId).map(st => st.id);
      const tSets = sets.filter(s => tSubtopics.includes(s.subtopicId));
      const allMcqsCount = tSets.reduce((acc, s) => acc + s.mcqs.length, 0);

      if (allMcqsCount === 0) return toast.error("No MCQs to export");

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

  if (initialLoading && topics.length === 0) return <div className="p-10 text-center text-gray-500">Loading Topics...</div>;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20 pt-[60px]">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 -ml-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="text-[18px] font-semibold text-[#111827] absolute left-1/2 -translate-x-1/2 tracking-tight">Topics</h1>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowAddWizard(true)}
                    className="bg-transparent border-[1.5px] border-[#6366F1] text-[#6366F1] px-4 py-2 rounded-[12px] text-[14px] font-medium active:scale-95 transition-all hover:bg-indigo-50"
                >
                    + Add
                </button>
            </div>
        </header>

        <div className="max-w-3xl mx-auto px-5">
            {!initialLoading && enhancedTopics.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 mt-4">
                    <div className="text-4xl mb-4 opacity-20">📚</div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No Topics Found</h3>
                    <p className="text-sm text-slate-400 mb-6">Create a topic to start organizing MCQs</p>
                    <PremiumButton onClick={() => setShowCreateTopic(true)}>Create First Topic</PremiumButton>
                </div>
            ) : (
                <div className="mt-4">
                    {/* Count Row */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[13px] font-semibold text-[#9CA3AF] tracking-wide">{enhancedTopics.length} Topics</span>
                        <button 
                            onClick={() => setShowCreateTopic(true)}
                            className="bg-transparent border-[1.5px] border-[#6366F1] text-[#6366F1] px-4 py-2 rounded-[12px] text-[13px] font-medium active:scale-95 transition-all hover:bg-indigo-50"
                        >
                            + New Topic
                        </button>
                    </div>
                    
                    {/* List */}
                    <div className="flex flex-col gap-[14px]">
                        {visibleTopics.map(topic => (
                            <div 
                                key={topic.id} 
                                onClick={() => navigate(`/live-mcq/topic/${topic.id}`)}
                                className="relative group bg-white border border-[#F3F4F6] rounded-[20px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all duration-150 cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    {/* Left Content */}
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-[44px] h-[44px] rounded-[12px] bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center text-[18px] font-bold shadow-sm">
                                            {topic.name.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Text */}
                                        <div>
                                            <h3 className="text-[17px] font-semibold text-[#111827] leading-tight">{topic.name}</h3>
                                            <p className="text-[13px] font-normal text-[#9CA3AF] mt-0.5">
                                                {topic.subtopicCount} Subs • {topic.mcqCount} Qs
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Actions */}
                                    <div className="flex items-center gap-1">
                                        {/* Edit Icon */}
                                        <button 
                                            onClick={(e) => initiateRename(topic, e)}
                                            className="p-2 text-[#D1D5DB] hover:text-[#6366F1] transition-colors rounded-full"
                                        >
                                            <Icon name="edit-3" size="sm" />
                                        </button>
                                        {/* Menu Icon */}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === topic.id ? null : topic.id);
                                            }}
                                            className="p-2 text-[#9CA3AF] hover:text-[#111827] transition-colors rounded-full"
                                        >
                                            <Icon name="more-vertical" size="sm" />
                                        </button>
                                    </div>
                                </div>

                                {/* Menu Dropdown */}
                                {activeMenuId === topic.id && (
                                    <div className="absolute right-4 top-12 z-20 bg-white border border-[#F3F4F6] rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handlePracticeAll(topic.id); setActiveMenuId(null); }}
                                            className="w-full text-left px-4 py-3 text-[14px] font-medium text-gray-700 hover:bg-[#F9FAFB] flex items-center gap-2 border-b border-gray-50"
                                        >
                                            <Icon name="play" size="sm" className="text-gray-400" /> Practice
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleExport(topic.id, e); setActiveMenuId(null); }}
                                            className="w-full text-left px-4 py-3 text-[14px] font-medium text-gray-700 hover:bg-[#F9FAFB] flex items-center gap-2 border-b border-gray-50"
                                        >
                                            <Icon name="share" size="sm" className="text-gray-400" /> Export
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); confirmDelete(topic, e); setActiveMenuId(null); }}
                                            className="w-full text-left px-4 py-3 text-[14px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Icon name="trash-2" size="sm" /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination Control */}
                    {visibleCount < enhancedTopics.length && (
                        <button 
                            onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                            className="w-full py-3 mt-4 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Load More ({enhancedTopics.length - visibleCount} remaining)
                        </button>
                    )}
                </div>
            )}
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
    </div>
  );
};

export default TopicListPage;
