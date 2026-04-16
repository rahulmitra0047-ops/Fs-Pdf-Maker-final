import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Save, Check, RefreshCw, Trash2, Volume2, BookOpen, Loader2, Bookmark, FolderOpen, Search, Filter, Play, Shuffle } from 'lucide-react';
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

  // Practice Sheet State
  const [practiceSheetOpen, setPracticeSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'advancedWords' | 'greWords' | 'idioms' | 'all'>('all');
  const [practiceCount, setPracticeCount] = useState<number | 'all'>('all');
  const [shufflePractice, setShufflePractice] = useState(true);

  const openPracticeSheet = (category: 'advancedWords' | 'greWords' | 'idioms' | 'all') => {
    setSelectedCategory(category);
    setPracticeSheetOpen(true);
  };

  const startPractice = () => {
    setPracticeSheetOpen(false);
    navigate(`/flashcards/universe/review?category=${selectedCategory}&count=${practiceCount}&shuffle=${shufflePractice}`);
  };

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
        className="px-4 py-2.5 flex items-center justify-between shrink-0 z-30 backdrop-blur-xl bg-opacity-80 transition-all relative"
        style={{ 
          backgroundColor: currentTheme.background === '#F8FAFC' ? 'rgba(248, 250, 252, 0.8)' : currentTheme.cardBg,
          borderBottom: `1px solid ${currentTheme.borderColor}`
        }}
      >
        <div className="flex items-center gap-2 flex-1">
            <button onClick={() => navigate('/home')} className="p-1.5 rounded-full hover:bg-black/5 transition-colors active:scale-95">
                <ArrowLeft className="w-5 h-5" style={{ color: currentTheme.textColor }} />
            </button>
            <h1 className="text-[16px] font-bold tracking-tight hidden sm:block" style={{ color: currentTheme.textColor }}>Synonym Finder</h1>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 flex bg-slate-100/80 p-1 rounded-[12px] border border-slate-200/60 backdrop-blur-sm shadow-inner">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-5 py-1.5 rounded-[10px] text-[13px] font-bold transition-all duration-300 ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Create
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-5 py-1.5 rounded-[10px] text-[13px] font-bold transition-all duration-300 ${activeTab === 'saved' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Saved
          </button>
        </div>

        <div className="flex-1 flex justify-end">
          {activeTab === 'create' && cluster && (
            <button 
              onClick={handleSaveUniverse}
              disabled={isCurrentUniverseSaved}
              className={`${isCurrentUniverseSaved ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-800 text-white hover:bg-slate-900 shadow-md'} px-3 py-1.5 rounded-[10px] text-[13px] font-bold active:scale-95 transition-all flex items-center gap-1.5`}
            >
              {isCurrentUniverseSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
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
            <div className="grid grid-cols-3 gap-4 shrink-0">
              <div 
                onClick={() => openPracticeSheet('advancedWords')}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 py-4 px-4 rounded-[20px] shadow-sm flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Play className="w-8 h-8 text-white/80" fill="currentColor" />
                </div>
                <span className="text-3xl font-black text-white mb-1 group-hover:opacity-0 transition-opacity duration-300">{stats.adv}</span>
                <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest group-hover:opacity-0 transition-opacity duration-300">Adv Words</span>
              </div>
              <div 
                onClick={() => openPracticeSheet('greWords')}
                className="bg-gradient-to-br from-violet-500 to-violet-600 py-4 px-4 rounded-[20px] shadow-sm flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Play className="w-8 h-8 text-white/80" fill="currentColor" />
                </div>
                <span className="text-3xl font-black text-white mb-1 group-hover:opacity-0 transition-opacity duration-300">{stats.gre}</span>
                <span className="text-[10px] font-bold text-violet-100 uppercase tracking-widest group-hover:opacity-0 transition-opacity duration-300">GRE Words</span>
              </div>
              <div 
                onClick={() => openPracticeSheet('idioms')}
                className="bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 py-4 px-4 rounded-[20px] shadow-sm flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-500"></div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Play className="w-8 h-8 text-white/80" fill="currentColor" />
                </div>
                <span className="text-3xl font-black text-white mb-1 group-hover:opacity-0 transition-opacity duration-300">{stats.idioms}</span>
                <span className="text-[10px] font-bold text-fuchsia-100 uppercase tracking-widest group-hover:opacity-0 transition-opacity duration-300">Idioms</span>
              </div>
            </div>

            {/* Mix All Button */}
            <button 
              onClick={() => openPracticeSheet('all')}
              className="w-full py-4 rounded-[20px] bg-slate-800 text-white font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors shadow-sm active:scale-[0.98]"
            >
              <Shuffle className="w-5 h-5" />
              Mix & Practice All Saved Words
            </button>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search saved universes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-white shadow-sm text-[15px] font-medium"
                />
              </div>
              <div className="relative min-w-[150px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-10 pr-8 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-white appearance-none font-bold text-slate-700 text-[14px] shadow-sm cursor-pointer"
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleUniverses.map((savedCluster, index) => (
                    <div 
                      key={savedCluster.id}
                      onClick={() => handleLoadUniverse(savedCluster)}
                      className="bg-white p-5 rounded-[24px] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 cursor-pointer hover:shadow-[0_20px_25px_-5px_rgba(79,70,229,0.1)] hover:border-indigo-500/20 transition-all duration-300 group relative flex flex-col overflow-hidden"
                    >
                      {/* Background Accent */}
                      <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl group-hover:bg-indigo-100/50 transition-colors duration-500"></div>

                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-indigo-600 font-bold text-xl shadow-sm border border-indigo-100/50 group-hover:from-indigo-600 group-hover:to-indigo-500 group-hover:text-white transition-all duration-500">
                            {savedCluster.basicWord.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-[18px] font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{savedCluster.basicWord}</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{new Date(savedCluster.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[13px] text-slate-500 italic line-clamp-2 relative z-10 flex-1 mb-4 leading-relaxed">"{savedCluster.baseContext}"</p>
                      
                      <div className="flex flex-wrap gap-2 relative z-10 mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg">
                          {savedCluster.advancedWords?.length || 0} Adv
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg">
                          {savedCluster.greWords?.length || 0} GRE
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-lg">
                          {savedCluster.idioms?.length || 0} Idioms
                        </span>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex gap-2 relative z-10">
                        <button 
                          onClick={(e) => handleReviewUniverse(savedCluster.id, e)}
                          className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[13px] font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Review
                        </button>
                        <button 
                          onClick={(e) => handleDeleteUniverse(savedCluster.id, e)}
                          className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
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
              </>
            )}
          </div>
        ) : (
          <>
            {!cluster && !loading && (
          <div className="flex flex-col items-center justify-center h-full overflow-y-auto px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100/50 shadow-sm rounded-[24px] flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-all duration-500">
              <Sparkles className="w-12 h-12 text-indigo-500" />
            </div>
            <h2 className="text-[28px] font-black text-slate-800 mb-3 text-center tracking-tight">Create a Word Universe</h2>
            <p className="text-slate-500 text-center mb-10 max-w-sm text-[15px] leading-relaxed">
              Enter a basic word to generate a connected mind map of advanced synonyms, GRE words, idioms, and substitutes.
            </p>
            
            <div className="w-full max-w-md relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative flex items-center bg-white rounded-[20px] p-2 shadow-sm border border-slate-100">
                <input 
                  type="text"
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  placeholder="e.g., Happy, Sad, Angry..."
                  className="w-full px-5 py-3.5 bg-transparent outline-none text-[18px] font-bold text-slate-800 placeholder-slate-300"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button 
                  onClick={handleGenerate}
                  className="bg-slate-900 text-white px-6 py-3.5 rounded-[16px] font-bold text-[15px] hover:bg-indigo-600 active:scale-95 transition-all duration-300 shadow-md flex items-center gap-2 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate
                </button>
              </div>
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
                    className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l-[24px]"></div>
                    <div className="flex justify-between items-start mb-5 pl-2">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 uppercase tracking-widest border border-indigo-100/50">
                            {activeNode.type}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 italic">
                            {activeNode.node.partOfSpeech}
                          </span>
                        </div>
                        <h3 className="text-[26px] font-black text-slate-800 flex items-center gap-3 tracking-tight">
                          {activeNode.node.word}
                          <button onClick={() => speak(activeNode.node.word)} className="p-2 rounded-full bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors border border-slate-100">
                            <Volume2 size={18} />
                          </button>
                        </h3>
                        <p className="text-[16px] text-slate-600 font-medium mt-1 leading-relaxed">{activeNode.node.meaning}</p>
                      </div>
                      
                      {/* Node Actions */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRegenerateNode(activeNode.category, activeNode.node)}
                          disabled={regeneratingNodeId === activeNode.node.id}
                          className="p-2.5 rounded-[14px] bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100"
                          title="Regenerate"
                        >
                          <RefreshCw size={18} className={regeneratingNodeId === activeNode.node.id ? "animate-spin" : ""} />
                        </button>
                        <button 
                          onClick={() => handleSaveSingleNode(activeNode.node)}
                          className="p-2.5 rounded-[14px] bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors border border-slate-100"
                          title="Save to Flashcards"
                        >
                          <Save size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteNode(activeNode.category, activeNode.node.id)}
                          className="p-2.5 rounded-[14px] bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-slate-100"
                          title="Remove from Map"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-[16px] p-5 border border-slate-100 ml-2">
                      <div className="flex items-center gap-2 mb-3 text-slate-400">
                        <BookOpen size={16} />
                        <span className="text-[11px] font-black uppercase tracking-widest">Contextual Usage</span>
                      </div>
                      <p className="text-slate-700 text-[15px] leading-relaxed font-medium">
                        {/* Highlight the word in the sentence */}
                        {activeNode.node.exampleSentence.split(new RegExp(`(${activeNode.node.word})`, 'gi')).map((part, i) => 
                          part.toLowerCase() === activeNode.node.word.toLowerCase() 
                            ? <span key={i} className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100/50">{part}</span> 
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
                    className="bg-white rounded-[24px] p-8 border border-slate-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                  >
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100/50">
                      <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-3">Base Context</p>
                    <p className="text-slate-700 text-[18px] italic font-medium leading-relaxed max-w-2xl mx-auto">"{cluster.baseContext}"</p>
                    <p className="text-[13px] text-slate-400 mt-6 font-medium">Tap on any orbiting word to see its details and usage.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
          </>
        )}
      </div>

      {/* Practice Filter Sheet */}
      <AnimatePresence>
        {practiceSheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPracticeSheetOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 p-6 shadow-2xl border-t border-slate-100"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
              
              <h3 className="text-[22px] font-black text-slate-800 mb-1">Practice Configuration</h3>
              <p className="text-slate-500 text-[14px] font-medium mb-6">
                {selectedCategory === 'all' ? 'Mix all saved universes' : `Review your saved ${selectedCategory.replace('Words', '')} words`}
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-3">Number of Words</label>
                  <div className="flex gap-2">
                    {[10, 20, 50, 'all'].map((count) => (
                      <button
                        key={count}
                        onClick={() => setPracticeCount(count as any)}
                        className={`flex-1 py-3 rounded-[14px] text-[15px] font-bold transition-all ${practiceCount === count ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                      >
                        {count === 'all' ? 'All' : count}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-3">Card Order</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShufflePractice(true)}
                      className={`flex-1 py-3 rounded-[14px] text-[15px] font-bold transition-all flex items-center justify-center gap-2 ${shufflePractice ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Shuffle className="w-4 h-4" />
                      Shuffle
                    </button>
                    <button
                      onClick={() => setShufflePractice(false)}
                      className={`flex-1 py-3 rounded-[14px] text-[15px] font-bold transition-all flex items-center justify-center gap-2 ${!shufflePractice ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                    >
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                      Sequential
                    </button>
                  </div>
                </div>

                <button 
                  onClick={startPractice}
                  className="w-full py-4 mt-4 rounded-[16px] bg-slate-900 text-white font-bold text-[16px] hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  Start Practice Session
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WordUniversePage;
