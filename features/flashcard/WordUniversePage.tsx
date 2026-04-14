import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Save, Check, RefreshCw, Trash2, Volume2, BookOpen, Loader2, Bookmark, FolderOpen, Search, Filter, Play } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { clusterService } from './services/clusterService';
import { universeService } from './services/universeService';
import { WordCluster, FlashcardNewWord, ClusterNode } from '../../types';
import { flashcardService } from '../../core/storage/services';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { WordMindMap } from './components/WordMindMap';

const WordUniversePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [savedUniverses, setSavedUniverses] = useState<WordCluster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z'>('newest');

  const [inputWord, setInputWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [cluster, setCluster] = useState<WordCluster | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeNode, setActiveNode] = useState<{ node: ClusterNode, type: string, category: keyof WordCluster } | null>(null);
  const [regeneratingNodeId, setRegeneratingNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedUniverses();
    }
  }, [activeTab]);

  const loadSavedUniverses = async () => {
    const saved = await universeService.getAllSaved();
    setSavedUniverses(saved);
  };

  const handleGenerate = async () => {
    if (!inputWord.trim()) {
      toast.error("Please enter a word");
      return;
    }
    setLoading(true);
    setCluster(null);
    setActiveNode(null);
    try {
      const result = await clusterService.generateCluster(inputWord.trim());
      setCluster(result);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate cluster");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUniverse = async () => {
    if (!cluster) return;
    try {
      await universeService.saveUniverse(cluster);
      await loadSavedUniverses();
      toast.success("Universe saved successfully!");
    } catch (e) {
      toast.error("Failed to save universe");
    }
  };

  const isCurrentUniverseSaved = cluster && savedUniverses.some(u => u.id === cluster.id);

  const handleDeleteUniverse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await universeService.deleteUniverse(id);
      await loadSavedUniverses();
      if (cluster?.id === id) {
        setCluster(null);
      }
      toast.success("Universe deleted");
    } catch (err) {
      toast.error("Failed to delete universe");
    }
  };

  const handleLoadUniverse = (savedCluster: WordCluster) => {
    setCluster(savedCluster);
    setActiveNode(null);
    setActiveTab('create');
  };

  const handleReviewUniverse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/flashcards/universe/review?universeId=${id}`);
  };

  const [visibleCount, setVisibleCount] = useState(20);

  const filteredUniverses = savedUniverses
    .filter(u => u.basicWord.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      return a.basicWord.localeCompare(b.basicWord);
    });

  const visibleUniverses = filteredUniverses.slice(0, visibleCount);

  const stats = {
    total: savedUniverses.length,
    adv: savedUniverses.reduce((acc, u) => acc + (u.advancedWords?.length || 0), 0),
    gre: savedUniverses.reduce((acc, u) => acc + (u.greWords?.length || 0), 0),
    idioms: savedUniverses.reduce((acc, u) => acc + (u.idioms?.length || 0), 0),
  };

  const handleSaveSingleNode = async (node: ClusterNode) => {
    if (!cluster) return;
    try {
      const newCard: FlashcardNewWord = {
          id: crypto.randomUUID(),
          word: node.word,
          meaning: `${node.meaning} (Root: ${cluster.basicWord})`,
          type: (node.partOfSpeech as any) || 'Other',
          verbForms: null,
          examples: [node.exampleSentence],
          synonyms: [cluster.basicWord],
          pronunciation: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          confidenceLevel: 0,
          nextReviewDate: Date.now(),
          lastReviewedAt: 0,
          totalReviews: 0,
          correctCount: 0,
          wrongCount: 0,
          isFavorite: false
      };
      await flashcardService.addNewWord(newCard);
      toast.success(`"${node.word}" saved to New Words!`);
    } catch (e: any) {
      if (e.message?.startsWith('Duplicate')) {
        toast.error(`"${node.word}" is already saved in flashcards!`);
      } else {
        toast.error("Failed to save word");
      }
    }
  };

  const handleDeleteNode = (category: keyof WordCluster, nodeId: string) => {
    if (!cluster) return;
    const updatedCluster = { ...cluster };
    (updatedCluster[category] as ClusterNode[]) = (updatedCluster[category] as ClusterNode[]).filter(n => n.id !== nodeId);
    setCluster(updatedCluster);
    if (activeNode?.node.id === nodeId) setActiveNode(null);
    toast.success("Node removed");
  };

  const handleRegenerateNode = async (category: keyof WordCluster, node: ClusterNode) => {
    if (!cluster) return;
    setRegeneratingNodeId(node.id);
    try {
      const newNode = await clusterService.regenerateNode(cluster.basicWord, cluster.baseContext, category, node.word);
      const updatedCluster = { ...cluster };
      const index = (updatedCluster[category] as ClusterNode[]).findIndex(n => n.id === node.id);
      if (index !== -1) {
        (updatedCluster[category] as ClusterNode[])[index] = newNode;
        setCluster(updatedCluster);
        if (activeNode?.node.id === node.id) {
          setActiveNode({ node: newNode, type: activeNode.type, category });
        }
        toast.success("Word regenerated!");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to regenerate");
    } finally {
      setRegeneratingNodeId(null);
    }
  };

  const speak = (text: string, lang: string = 'en-US') => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div 
      className="h-[100dvh] flex flex-col transition-colors duration-300 relative overflow-hidden"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Top Bar */}
      <div 
        className="px-6 py-4 flex items-center justify-between shrink-0 z-30 backdrop-blur-xl bg-opacity-80 transition-all"
        style={{ 
          backgroundColor: currentTheme.background === '#F8FAFC' ? 'rgba(248, 250, 252, 0.8)' : currentTheme.cardBg,
          borderBottom: `1px solid ${currentTheme.borderColor}`
        }}
      >
        <div className="flex items-center gap-2">
            <button onClick={() => navigate('/home')} className="mr-2 p-1 rounded-full hover:bg-black/5 transition-colors active:scale-95">
                <ArrowLeft className="w-6 h-6" style={{ color: currentTheme.textColor }} />
            </button>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block" style={{ color: currentTheme.textColor }}>Synonym Finder</h1>
        </div>
        
        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'saved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Saved
          </button>
        </div>

        <div className="w-[120px] flex justify-end">
          {activeTab === 'create' && cluster && (
            <button 
              onClick={handleSaveUniverse}
              disabled={isCurrentUniverseSaved}
              className={`${isCurrentUniverseSaved ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-800 text-white hover:bg-slate-900 shadow-md'} px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all flex items-center gap-2`}
            >
              {isCurrentUniverseSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">{isCurrentUniverseSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden" ref={containerRef}>
        {activeTab === 'saved' ? (
          <div className="h-full overflow-y-auto no-scrollbar pb-20 flex flex-col gap-6">
            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-white py-2 px-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-700">{stats.adv}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Adv Words</span>
              </div>
              <div className="bg-white py-2 px-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-700">{stats.gre}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">GRE Words</span>
              </div>
              <div className="bg-white py-2 px-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-700">{stats.idioms}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Idioms</span>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search saved universes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                />
              </div>
              <div className="relative min-w-[140px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white appearance-none font-medium text-gray-700"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="a-z">A-Z</option>
                </select>
              </div>
            </div>

            {savedUniverses.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center mt-10 p-8 bg-white rounded-[24px] border border-slate-100 shadow-sm">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm">
                  <FolderOpen className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Saved Universes</h2>
                <p className="text-slate-500 max-w-xs text-sm leading-relaxed">
                  Generate a new synonym universe and save it to review later.
                </p>
              </div>
            ) : filteredUniverses.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center mt-10 p-8 bg-white rounded-[24px] border border-slate-100 shadow-sm">
                <p className="text-slate-500">No universes found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleUniverses.map((savedCluster, index) => (
                  <div 
                    key={savedCluster.id}
                    onClick={() => handleLoadUniverse(savedCluster)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all group relative flex flex-col"
                  >
                    <div className="absolute top-3 right-3 text-xs font-black text-slate-50 group-hover:text-indigo-50 transition-colors text-3xl -z-0">
                      #{index + 1}
                    </div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-inner border border-indigo-100/50">
                          {savedCluster.basicWord.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-800 leading-tight">{savedCluster.basicWord}</h3>
                          <p className="text-[10px] font-medium text-slate-400">{new Date(savedCluster.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 italic line-clamp-1 relative z-10 flex-1 mb-3">"{savedCluster.baseContext}"</p>
                    
                    <div className="flex flex-wrap gap-1.5 relative z-10 mb-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded">
                        {savedCluster.advancedWords?.length || 0} Adv
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded">
                        {savedCluster.greWords?.length || 0} GRE
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded">
                        {savedCluster.idioms?.length || 0} Idioms
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex gap-2 relative z-10">
                      <button 
                        onClick={(e) => handleReviewUniverse(savedCluster.id, e)}
                        className="flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3 h-3" />
                        Review
                      </button>
                      <button 
                        onClick={(e) => handleDeleteUniverse(savedCluster.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {visibleCount < filteredUniverses.length && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            )}
          </div>
        ) : (
          <>
            {!cluster && !loading && (
          <div className="flex flex-col items-center justify-center h-full overflow-y-auto">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Create a Word Universe</h2>
            <p className="text-gray-500 text-center mb-8 max-w-xs">
              Enter a basic word to generate a connected mind map of advanced synonyms, GRE words, idioms, and substitutes.
            </p>
            
            <div className="w-full max-w-sm relative">
              <input 
                type="text"
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                placeholder="e.g., Happy, Sad, Angry..."
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-slate-800 outline-none text-lg font-medium shadow-sm transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                className="absolute right-2 top-2 bottom-2 bg-slate-800 text-white px-4 rounded-xl font-bold hover:bg-slate-900 active:scale-95 transition-all"
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-slate-800 rounded-full border-t-transparent animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto text-slate-800 animate-pulse" />
            </div>
            <p className="mt-6 text-slate-600 font-medium animate-pulse">Generating Universe...</p>
          </div>
        )}

        {cluster && !loading && (
          <>
            {/* Interactive Canvas */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden w-full transition-all duration-300 flex-1 min-h-[300px]">
              <WordMindMap 
                cluster={cluster} 
                onNodeClick={(node, typeLabel, category) => setActiveNode({ node, type: typeLabel, category })} 
              />
            </div>

            {/* Active Node Details Panel */}
            <div className="shrink-0 max-h-[40vh] overflow-y-auto no-scrollbar rounded-[24px] mb-[80px]">
              <AnimatePresence mode="wait">
                {activeNode ? (
                  <motion.div 
                    key="active-node"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600 uppercase tracking-wider">
                            {activeNode.type}
                          </span>
                          <span className="text-xs font-medium text-gray-400 italic">
                            {activeNode.node.partOfSpeech}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          {activeNode.node.word}
                          <button onClick={() => speak(activeNode.node.word)} className="p-1.5 rounded-full hover:bg-gray-100 text-slate-500 transition-colors">
                            <Volume2 size={18} />
                          </button>
                        </h3>
                        <p className="text-lg text-slate-700 font-medium">{activeNode.node.meaning}</p>
                      </div>
                      
                      {/* Node Actions */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRegenerateNode(activeNode.category, activeNode.node)}
                          disabled={regeneratingNodeId === activeNode.node.id}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Regenerate"
                        >
                          <RefreshCw size={18} className={regeneratingNodeId === activeNode.node.id ? "animate-spin" : ""} />
                        </button>
                        <button 
                          onClick={() => handleSaveSingleNode(activeNode.node)}
                          className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="Save to Flashcards"
                        >
                          <Save size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteNode(activeNode.category, activeNode.node.id)}
                          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Remove from Map"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <BookOpen size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Contextual Usage</span>
                      </div>
                      <p className="text-gray-700 text-[15px] leading-relaxed">
                        {/* Highlight the word in the sentence */}
                        {activeNode.node.exampleSentence.split(new RegExp(`(${activeNode.node.word})`, 'gi')).map((part, i) => 
                          part.toLowerCase() === activeNode.node.word.toLowerCase() 
                            ? <span key={i} className="font-bold text-indigo-600 bg-indigo-50 px-1 rounded">{part}</span> 
                            : part
                        )}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="base-context"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-50 rounded-[24px] p-6 border border-slate-100 text-center"
                  >
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2">Base Context</p>
                    <p className="text-gray-700 text-lg italic">"{cluster.baseContext}"</p>
                    <p className="text-xs text-gray-400 mt-4">Tap on any orbiting word to see its details and usage.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default WordUniversePage;
