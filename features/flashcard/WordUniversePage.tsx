import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Save, Check, RefreshCw, Trash2, Volume2, BookOpen, Loader2 } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { clusterService } from './services/clusterService';
import { WordCluster, FlashcardNewWord, ClusterNode } from '../../types';
import { flashcardService } from '../../core/storage/services';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { WordMindMap } from './components/WordMindMap';

const WordUniversePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  
  const [inputWord, setInputWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [cluster, setCluster] = useState<WordCluster | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeNode, setActiveNode] = useState<{ node: ClusterNode, type: string, category: keyof WordCluster } | null>(null);
  const [regeneratingNodeId, setRegeneratingNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleSaveMasterCard = async () => {
    if (!cluster) return;
    setSaving(true);
    try {
      const wordData: FlashcardNewWord = {
        id: crypto.randomUUID(),
        word: cluster.basicWord,
        meaning: "Word Cluster (Master Card)",
        type: 'Other',
        verbForms: null,
        examples: [cluster.baseContext],
        synonyms: [
          ...(cluster.advancedWords || []).map(w => w.word),
          ...(cluster.greWords || []).map(w => w.word)
        ],
        pronunciation: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        confidenceLevel: 0,
        nextReviewDate: Date.now(),
        lastReviewedAt: 0,
        totalReviews: 0,
        correctCount: 0,
        wrongCount: 0,
        isFavorite: false,
        clusterData: cluster
      };

      await flashcardService.addNewWord(wordData);
      toast.success("Master Card saved to New Words!");
      navigate('/flashcards');
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIndividualCards = async () => {
    if (!cluster) return;
    setSaving(true);
    try {
      const allWords = [
        ...(cluster.advancedWords || []),
        ...(cluster.greWords || []),
        ...(cluster.idioms || []),
        ...(cluster.oneWordSubstitutes || [])
      ];

      const newCards: FlashcardNewWord[] = allWords.map(w => {
        return {
          id: crypto.randomUUID(),
          word: w.word,
          meaning: w.meaning,
          type: (w.partOfSpeech as any) || 'Other',
          verbForms: null,
          examples: [w.exampleSentence],
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
      });

      await flashcardService.addBulkFlashcardWords(newCards);
      toast.success(`${newCards.length} individual cards saved!`);
      navigate('/flashcards');
    } catch (e) {
      toast.error("Failed to save individual cards");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingleNode = async (node: ClusterNode) => {
    if (!cluster) return;
    try {
      const newCard: FlashcardNewWord = {
          id: crypto.randomUUID(),
          word: node.word,
          meaning: node.meaning,
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
    } catch (e) {
      toast.error("Failed to save word");
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
            <button onClick={() => navigate('/flashcards')} className="mr-2 p-1 rounded-full hover:bg-black/5 transition-colors active:scale-95">
                <ArrowLeft className="w-6 h-6" style={{ color: currentTheme.textColor }} />
            </button>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: currentTheme.textColor }}>Word Universe</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden" ref={containerRef}>
        {!cluster && !loading && (
          <div className="flex flex-col items-center justify-center h-full overflow-y-auto">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-indigo-600" />
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
                className="w-full px-5 py-4 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 outline-none text-lg font-medium shadow-sm transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-4 rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto text-indigo-600 animate-pulse" />
            </div>
            <p className="mt-6 text-indigo-600 font-medium animate-pulse">Generating Universe...</p>
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
                          <button onClick={() => speak(activeNode.node.word)} className="p-1.5 rounded-full hover:bg-gray-100 text-indigo-500 transition-colors">
                            <Volume2 size={18} />
                          </button>
                        </h3>
                        <p className="text-lg text-indigo-600 font-medium">{activeNode.node.meaning}</p>
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
                    className="bg-indigo-50/50 rounded-[24px] p-6 border border-indigo-100 text-center"
                  >
                    <p className="text-sm text-indigo-400 font-bold uppercase tracking-wider mb-2">Base Context</p>
                    <p className="text-gray-700 text-lg italic">"{cluster.baseContext}"</p>
                    <p className="text-xs text-gray-400 mt-4">Tap on any orbiting word to see its details and usage.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Bottom Action Bar */}
      <AnimatePresence>
        {cluster && !loading && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-safe z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex gap-3"
          >
            <button 
              onClick={handleSaveMasterCard}
              disabled={saving}
              className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={20} />
                  Save Master Map
                </>
              )}
            </button>
            <button 
              onClick={handleSaveIndividualCards}
              disabled={saving}
              className="flex-1 py-4 bg-white text-indigo-600 border-2 border-indigo-100 font-bold rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              ) : (
                <>
                  <Check size={20} />
                  Save All Cards
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WordUniversePage;
