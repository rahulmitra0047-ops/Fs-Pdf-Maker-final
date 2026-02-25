import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../../shared/components/Icon';
import { flashcardService, vocabService } from '../../core/storage/services';
import { FlashcardWord } from '../../types';
import { useToast } from '../../shared/context/ToastContext';
import PremiumModal from '../../shared/components/PremiumModal';

const WordBankPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<FlashcardWord[]>([]);
  const [filteredWords, setFilteredWords] = useState<FlashcardWord[]>([]);
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  
  // New State for Phase 3
  const [sortOption, setSortOption] = useState('recent');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [words, filter, searchQuery, sortOption]);

  const loadWords = async () => {
    setLoading(true);
    try {
      const all = await flashcardService.getAll();
      setWords(all);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load words");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...words];

    // Filter by Tab
    if (filter === 'mastered') {
      result = result.filter(w => w.confidenceLevel >= 4);
    } else if (filter === 'learning') {
      result = result.filter(w => w.confidenceLevel > 0 && w.confidenceLevel < 4);
    } else if (filter === 'new') {
      result = result.filter(w => w.confidenceLevel === 0);
    } else if (filter === 'favorites') {
      result = result.filter(w => w.isFavorite);
    }

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(w => 
        w.word.toLowerCase().includes(q) || 
        w.meaning.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortOption) {
      case 'a-z':
        result.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'z-a':
        result.sort((a, b) => b.word.localeCompare(a.word));
        break;
      case 'conf-low':
        result.sort((a, b) => a.confidenceLevel - b.confidenceLevel);
        break;
      case 'conf-high':
        result.sort((a, b) => b.confidenceLevel - a.confidenceLevel);
        break;
      case 'most-reviewed':
        result.sort((a, b) => b.totalReviews - a.totalReviews);
        break;
      case 'least-reviewed':
        result.sort((a, b) => a.totalReviews - b.totalReviews);
        break;
      case 'recent':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'acc-low':
        result.sort((a, b) => (a.correctCount / (a.totalReviews || 1)) - (b.correctCount / (b.totalReviews || 1)));
        break;
      case 'acc-high':
        result.sort((a, b) => (b.correctCount / (b.totalReviews || 1)) - (a.correctCount / (a.totalReviews || 1)));
        break;
    }

    setFilteredWords(result);
  };

  const toggleFavorite = async (e: React.MouseEvent, word: FlashcardWord) => {
    e.stopPropagation();
    const newStatus = !word.isFavorite;
    // Optimistic update
    setWords(prev => prev.map(w => w.id === word.id ? { ...w, isFavorite: newStatus } : w));
    await flashcardService.updateWord(word.id, { isFavorite: newStatus });
  };

  const deleteWord = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this word?")) {
      await flashcardService.deleteWord(id);
      setWords(prev => prev.filter(w => w.id !== id));
      toast.success("Word deleted");
    }
  };

  const speakWord = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  // Multi-select Logic
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
    if (newSet.size === 0 && isMultiSelectMode) {
      // Keep mode active even if empty? Or close? User request says "X tap -> cancel multi-select"
    }
  };

  const handleLongPress = (id: string) => {
    if (!isMultiSelectMode) {
      setIsMultiSelectMode(true);
      setSelectedIds(new Set([id]));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    if (action === 'delete') {
      if (window.confirm(`${ids.length} words delete করবে?`)) {
        for (const id of ids) {
          await flashcardService.deleteWord(id);
        }
        setWords(prev => prev.filter(w => !selectedIds.has(w.id)));
        toast.success("Deleted successfully");
        setIsMultiSelectMode(false);
        setSelectedIds(new Set());
      }
    } else if (action === 'favorite') {
      for (const id of ids) {
        await flashcardService.updateWord(id, { isFavorite: true });
      }
      setWords(prev => prev.map(w => selectedIds.has(w.id) ? { ...w, isFavorite: true } : w));
      toast.success("Added to favorites");
      setIsMultiSelectMode(false);
      setSelectedIds(new Set());
    } else if (action === 'unfavorite') {
      for (const id of ids) {
        await flashcardService.updateWord(id, { isFavorite: false });
      }
      setWords(prev => prev.map(w => selectedIds.has(w.id) ? { ...w, isFavorite: false } : w));
      toast.success("Removed from favorites");
      setIsMultiSelectMode(false);
      setSelectedIds(new Set());
    } else if (action === 'reset') {
      if (window.confirm("Reset progress for selected words?")) {
        for (const id of ids) {
          await flashcardService.updateWord(id, {
            confidenceLevel: 0,
            nextReviewDate: Date.now(),
            lastReviewedAt: null,
            totalReviews: 0,
            correctCount: 0,
            wrongCount: 0
          });
        }
        // Reload to reflect reset
        loadWords();
        toast.success("Progress reset");
        setIsMultiSelectMode(false);
        setSelectedIds(new Set());
      }
    } else if (action === 'export') {
      const selectedWords = words.filter(w => selectedIds.has(w.id));
      const text = selectedWords.map(w => `${w.word} = ${w.meaning}`).join('\n');
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
      setIsMultiSelectMode(false);
      setSelectedIds(new Set());
    }
    setShowBulkActions(false);
  };

  // Group by Lesson (only if not sorted by other criteria to keep list clean? Or always group?)
  // If sorted by A-Z, grouping by lesson breaks the sort visually.
  // Let's only group if sort is 'recent' or 'oldest' (default-ish).
  // Actually, user didn't specify grouping behavior change, but sorting usually implies flat list.
  // Let's use flat list if sort is NOT recent/oldest.
  
  const isGrouped = sortOption === 'recent' || sortOption === 'oldest';
  
  const groupedWords = isGrouped ? filteredWords.reduce((acc, word) => {
    const key = word.sourceLessonId || 'manual';
    if (!acc[key]) acc[key] = [];
    acc[key].push(word);
    return acc;
  }, {} as Record<string, FlashcardWord[]>) : { 'all': filteredWords };

  const sortedGroups = Object.keys(groupedWords).sort((a, b) => {
    if (a === 'manual') return 1;
    if (b === 'manual') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans relative">
      {/* Top Bar */}
      <header className={`sticky top-0 z-40 px-5 h-[60px] flex items-center justify-between transition-colors ${isMultiSelectMode ? 'bg-[#6C63FF] text-white' : 'bg-[#F8FAFC]/80 backdrop-blur-md text-gray-900'}`}>
        {isMultiSelectMode ? (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => { setIsMultiSelectMode(false); setSelectedIds(new Set()); }} className="p-2 -ml-2 rounded-full hover:bg-white/20">
                <Icon name="x" size="sm" />
              </button>
              <h1 className="text-[18px] font-bold">{selectedIds.size} selected</h1>
            </div>
            <div className="relative">
              <button onClick={() => setShowBulkActions(!showBulkActions)} className="flex items-center gap-1 font-bold text-[14px] bg-white/20 px-3 py-1.5 rounded-full">
                Actions <Icon name="chevron-down" size="xs" />
              </button>
              {showBulkActions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-[12px] shadow-xl border border-gray-100 overflow-hidden py-1 text-gray-800 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <button onClick={() => handleBulkAction('delete')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] flex items-center gap-2 text-red-600">
                    <Icon name="trash-2" size={14} /> Delete Selected
                  </button>
                  <button onClick={() => handleBulkAction('favorite')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] flex items-center gap-2">
                    <Icon name="star" size={14} /> Add to Favorites
                  </button>
                  <button onClick={() => handleBulkAction('unfavorite')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] flex items-center gap-2">
                    <Icon name="star-off" size={14} /> Remove Favorites
                  </button>
                  <button onClick={() => handleBulkAction('reset')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] flex items-center gap-2">
                    <Icon name="rotate-ccw" size={14} /> Reset Progress
                  </button>
                  <button onClick={() => handleBulkAction('export')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[13px] flex items-center gap-2">
                    <Icon name="share" size={14} /> Export Selected
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/flashcards')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 active:scale-95 transition-transform">
                <Icon name="arrow-left" size="sm" />
              </button>
              <h1 className="text-[18px] font-bold">Word Bank <span className="text-[14px] font-normal text-gray-500">({filteredWords.length})</span></h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-full transition-colors ${showSearch ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Icon name="search" size="sm" />
              </button>
              <button 
                onClick={() => setShowSortSheet(true)}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
              >
                <Icon name="arrow-up-down" size="sm" />
              </button>
            </div>
          </>
        )}
      </header>

      {/* Search Bar */}
      {showSearch && !isMultiSelectMode && (
        <div className="px-5 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <input 
            type="text" 
            placeholder="Search words..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#6C63FF] shadow-sm"
            autoFocus
          />
        </div>
      )}

      {/* Filter Chips */}
      {!isMultiSelectMode && (
        <div className="px-5 mb-4 overflow-x-auto no-scrollbar flex gap-2 pb-2">
          {['all', 'mastered', 'learning', 'new', 'favorites'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-[#6C63FF] text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <main className="px-5 space-y-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No words found.</p>
          </div>
        ) : (
          sortedGroups.map(groupId => (
            <div key={groupId}>
              {isGrouped && (
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-[13px] text-gray-500 font-medium">
                    {groupId === 'manual' ? 'Manual' : `Lesson ${groupId}`} ({groupedWords[groupId].length} words)
                  </span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
              )}

              <div className="space-y-3">
                {groupedWords[groupId].map(word => (
                  <div 
                    key={word.id}
                    onClick={() => {
                      if (isMultiSelectMode) toggleSelection(word.id);
                      else setExpandedId(expandedId === word.id ? null : word.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleLongPress(word.id);
                    }}
                    className={`bg-white rounded-[14px] border transition-all duration-300 overflow-hidden ${
                      isMultiSelectMode && selectedIds.has(word.id) ? 'border-[#6C63FF] bg-indigo-50' : 
                      expandedId === word.id ? 'border-[#6C63FF] shadow-md' : 'border-gray-200 shadow-sm'
                    }`}
                  >
                    {/* Collapsed Header */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isMultiSelectMode && (
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.has(word.id) ? 'bg-[#6C63FF] border-[#6C63FF]' : 'border-gray-300'}`}>
                            {selectedIds.has(word.id) && <Icon name="check" size={12} className="text-white" />}
                          </div>
                        )}
                        <div>
                          <h3 className="text-[14px] font-bold text-gray-800 mb-1">
                            {word.word} <span className="text-gray-400 font-normal">→</span> {word.meaning}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="w-[60px] h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  word.confidenceLevel === 0 ? 'bg-gray-300' :
                                  word.confidenceLevel < 3 ? 'bg-[#FFA726]' :
                                  word.confidenceLevel < 4 ? 'bg-[#2196F3]' : 'bg-[#4CAF50]'
                                }`}
                                style={{ width: `${(word.confidenceLevel / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-[11px] text-gray-500">
                              Level {word.confidenceLevel} • {Math.round((word.correctCount / (word.totalReviews || 1)) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {!isMultiSelectMode && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); speakWord(word.word); }}
                              className="text-[#6C63FF] p-1.5 rounded-full hover:bg-indigo-50"
                            >
                              <Icon name="volume-2" size="sm" />
                            </button>
                            <button 
                              onClick={(e) => toggleFavorite(e, word)}
                              className={`p-1.5 rounded-full hover:bg-gray-50 ${word.isFavorite ? 'text-amber-400' : 'text-gray-300'}`}
                            >
                              <Icon name="star" size="sm" fill={word.isFavorite} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedId === word.id && !isMultiSelectMode && (
                      <div className="px-3 pb-3 pt-0 animate-in fade-in duration-300">
                        <div className="h-px bg-gray-100 mb-3"></div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] border ${
                            word.type === 'Verb' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                            word.type === 'Noun' ? 'text-green-600 border-green-200 bg-green-50' :
                            'text-gray-600 border-gray-200 bg-gray-50'
                          }`}>
                            {word.type}
                          </span>
                          {word.synonyms.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-[11px] border border-gray-200 bg-gray-50 text-gray-600">
                              {s}
                            </span>
                          ))}
                        </div>

                        {word.examples.length > 0 && (
                          <p className="text-[13px] text-gray-600 italic mb-3 bg-gray-50 p-2 rounded-[8px]">
                            "{word.examples[0]}"
                          </p>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-[12px] text-gray-500 font-medium">Stats:</span>
                            <span className="text-[12px] text-gray-600">Reviews: {word.totalReviews}</span>
                            <span className="text-[12px] text-gray-300">•</span>
                            <span className="text-[12px] text-gray-600">Correct: {word.correctCount}</span>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toast.info("Edit coming soon"); }}
                            className="flex-1 py-2 rounded-[8px] bg-gray-50 text-gray-700 text-[12px] font-bold hover:bg-gray-100"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteWord(word.id); }}
                            className="flex-1 py-2 rounded-[8px] bg-red-50 text-red-600 text-[12px] font-bold hover:bg-red-100"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Sort Bottom Sheet */}
      {showSortSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSortSheet(false)}>
          <div className="bg-white w-full max-w-md rounded-t-[20px] p-5 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[16px] font-bold text-gray-800">Sort by</h3>
              <button onClick={() => setShowSortSheet(false)} className="text-gray-500">
                <Icon name="x" size="sm" />
              </button>
            </div>
            <div className="space-y-1">
              {[
                { id: 'recent', label: 'Recently Added' },
                { id: 'oldest', label: 'Oldest First' },
                { id: 'a-z', label: 'Alphabetical (A→Z)' },
                { id: 'z-a', label: 'Alphabetical (Z→A)' },
                { id: 'conf-low', label: 'Confidence (Low→High)' },
                { id: 'conf-high', label: 'Confidence (High→Low)' },
                { id: 'most-reviewed', label: 'Most Reviewed' },
                { id: 'least-reviewed', label: 'Least Reviewed' },
                { id: 'acc-low', label: 'Accuracy (Low→High)' },
                { id: 'acc-high', label: 'Accuracy (High→Low)' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSortOption(opt.id); setShowSortSheet(false); }}
                  className={`w-full text-left px-4 py-3 rounded-[12px] text-[14px] flex items-center justify-between ${
                    sortOption === opt.id ? 'bg-[#6C63FF]/10 text-[#6C63FF] font-bold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                  {sortOption === opt.id && <Icon name="check" size="sm" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordBankPage;
