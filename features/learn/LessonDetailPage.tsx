import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import PremiumModal from '../../shared/components/PremiumModal';
import { useToast } from '../../shared/context/ToastContext';
import { GrammarRule, VocabItem, VocabWord, TranslationItem, PracticeTopic } from '../../types'; 
import AddRuleSheet from './components/AddRuleSheet';
import BulkRuleImportSheet from './components/BulkRuleImportSheet';
import RuleCard from './components/RuleCard';
import VocabCard from './components/VocabCard';
import AddVocabSheet from './components/AddVocabSheet';
import BulkVocabImportSheet from './components/BulkVocabImportSheet';
import PracticeSession from './components/PracticeSession';

interface Lesson {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  grammar?: string; 
  vocabulary?: string;
  vocabList?: VocabWord[];
  translations?: TranslationItem[];
  practiceTopics?: PracticeTopic[];
  status: 'new' | 'in-progress' | 'completed';
}

const STORAGE_KEY = 'mock_lessons_local';

const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'grammar' | 'vocabulary' | 'practice'>('grammar');
  
  // Grammar State
  const [rules, setRules] = useState<GrammarRule[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showBulkSheet, setShowBulkSheet] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingRule, setEditingRule] = useState<GrammarRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  // Vocabulary State
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);
  const [showAddVocabSheet, setShowAddVocabSheet] = useState(false);
  const [showBulkVocabSheet, setShowBulkVocabSheet] = useState(false);
  const [showVocabMenu, setShowVocabMenu] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);
  const [deleteWordId, setDeleteWordId] = useState<string | null>(null);

  // Practice State
  const [translations, setTranslations] = useState<TranslationItem[]>([]);
  const [practiceTopics, setPracticeTopics] = useState<PracticeTopic[]>([]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
        setShowAddMenu(false);
        setShowVocabMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    // Load lesson from local storage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const lessons: Lesson[] = JSON.parse(saved);
        const found = lessons.find(l => l.id === lessonId);
        if (found) {
            setLesson(found);
            
            // 1. Parse Grammar Rules
            if (found.grammar) {
                try {
                    const parsed = JSON.parse(found.grammar);
                    if (Array.isArray(parsed)) {
                        setRules(parsed);
                    } else {
                        // Migration fallback for legacy simple string
                        setRules([{
                            id: crypto.randomUUID(),
                            lessonId: found.id,
                            title: 'Overview',
                            category: 'General',
                            difficulty: 'Beginner',
                            explanation: found.grammar,
                            examples: [],
                            isFavorite: false,
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        }]);
                    }
                } catch (e) {
                    if (found.grammar.trim()) {
                        setRules([{
                            id: crypto.randomUUID(),
                            lessonId: found.id,
                            title: 'Overview',
                            category: 'General',
                            difficulty: 'Beginner',
                            explanation: found.grammar,
                            examples: [],
                            isFavorite: false,
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        }]);
                    } else {
                        setRules([]);
                    }
                }
            } else {
                setRules([]);
            }

            // 2. Load Vocabulary
            if (found.vocabList && Array.isArray(found.vocabList)) {
                setVocabWords(found.vocabList);
            } else if (found.vocabulary) {
                const legacyLines = found.vocabulary.split('\n').filter(l => l.trim());
                const migratedWords: VocabWord[] = legacyLines.map(line => {
                    let parts = line.split(' - ');
                    if (parts.length < 2) parts = line.split('=');
                    
                    const word = parts[0]?.trim() || line;
                    const meaning = parts[1]?.trim() || '';
                    
                    return {
                        id: crypto.randomUUID(),
                        lessonId: found.id,
                        word: word,
                        meaning: meaning,
                        type: 'Other',
                        examples: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                });
                setVocabWords(migratedWords);
            } else {
                setVocabWords([]);
            }

            // 3. Load Practice Data
            setTranslations(found.translations || []);
            setPracticeTopics(found.practiceTopics || []);
        }
      }
    } catch (e) {
      console.error("Failed to load lesson", e);
    }
  }, [lessonId]);

  // Save Helpers
  const updateLessonInStorage = (updatedLesson: Lesson) => {
      setLesson(updatedLesson);
      try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
              const allLessons: Lesson[] = JSON.parse(saved);
              const idx = allLessons.findIndex(l => l.id === updatedLesson.id);
              if (idx !== -1) {
                  allLessons[idx] = updatedLesson;
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(allLessons));
              }
          }
      } catch (e) {
          console.error("Storage update failed", e);
      }
  };

  // Grammar Handlers
  const saveRulesToStorage = (newRules: GrammarRule[]) => {
      setRules(newRules);
      if (lesson) {
          updateLessonInStorage({ ...lesson, grammar: JSON.stringify(newRules) });
      }
  };

  const handleSaveRule = (rule: GrammarRule) => {
      let updatedRules;
      if (rules.some(r => r.id === rule.id)) {
          updatedRules = rules.map(r => r.id === rule.id ? rule : r);
          toast.success("Rule updated");
      } else {
          updatedRules = [...rules, rule];
          toast.success("Rule added");
      }
      saveRulesToStorage(updatedRules);
      setEditingRule(null);
  };

  const handleBulkImportRule = (newRules: GrammarRule[]) => {
      const updatedRules = [...rules, ...newRules];
      saveRulesToStorage(updatedRules);
      toast.success(`${newRules.length} rules imported`);
  };

  const handleDeleteRule = () => {
      if (deleteRuleId) {
          const updatedRules = rules.filter(r => r.id !== deleteRuleId);
          saveRulesToStorage(updatedRules);
          setDeleteRuleId(null);
          toast.success("Rule deleted");
      }
  };

  // Vocabulary Handlers
  const saveVocabToStorage = (newWords: VocabWord[]) => {
      setVocabWords(newWords);
      if (lesson) {
          const legacyString = newWords.map(w => `${w.word} - ${w.meaning}`).join('\n');
          updateLessonInStorage({ 
              ...lesson, 
              vocabList: newWords,
              vocabulary: legacyString 
          });
      }
  };

  const handleSaveWord = (word: VocabWord) => {
      let updatedWords;
      if (vocabWords.some(w => w.id === word.id)) {
          updatedWords = vocabWords.map(w => w.id === word.id ? word : w);
          toast.success("Word updated");
      } else {
          updatedWords = [...vocabWords, word];
          toast.success("Word added");
      }
      saveVocabToStorage(updatedWords);
      setEditingWord(null);
  };

  const handleBulkImportVocab = (newWords: VocabWord[]) => {
      const updatedWords = [...vocabWords, ...newWords];
      saveVocabToStorage(updatedWords);
      toast.success(`${newWords.length} words imported`);
  };

  const handleDeleteWord = () => {
      if (deleteWordId) {
          const updatedWords = vocabWords.filter(w => w.id !== deleteWordId);
          saveVocabToStorage(updatedWords);
          setDeleteWordId(null);
          toast.success("Word deleted");
      }
  };

  // Practice Handlers
  const saveTranslationsToStorage = (newItems: TranslationItem[]) => {
    setTranslations(newItems);
    if (lesson) {
      updateLessonInStorage({ ...lesson, translations: newItems });
    }
  };

  const saveTopicsToStorage = (newItems: PracticeTopic[]) => {
    setPracticeTopics(newItems);
    if (lesson) {
      updateLessonInStorage({ ...lesson, practiceTopics: newItems });
    }
  };

  if (!lesson) {
    return (
        <div className="min-h-screen bg-[#FAFAFA] pt-[60px] flex flex-col items-center justify-center">
            <p className="text-gray-400 mb-4">Lesson not found</p>
            <button onClick={() => navigate('/learn')} className="text-[#6366F1] font-medium">Back to Learn</button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 pt-[60px]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/learn')} 
            className="p-2 -ml-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
          >
            <Icon name="arrow-left" size="md" />
          </button>
        </div>
        <h1 className="text-[18px] font-semibold text-[#111827] absolute left-1/2 -translate-x-1/2 tracking-tight">
          Lesson {lesson.number}
        </h1>
        <div className="w-10"></div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex">
            {['grammar', 'vocabulary', 'practice'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-3 text-[14px] font-semibold capitalize relative transition-colors ${
                        activeTab === tab ? 'text-[#6366F1]' : 'text-[#6B7280] hover:text-gray-900'
                    }`}
                >
                    {tab}
                    {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6366F1] rounded-t-full mx-4" />
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 mt-6">
        
        {/* GRAMMAR TAB */}
        {activeTab === 'grammar' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                        Rules ({rules.length})
                    </h3>
                    
                    <div className="relative">
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setShowAddMenu(!showAddMenu); 
                            }}
                            className="text-[13px] font-bold text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1.5 bg-[#EEF2FF] px-3 py-1.5 rounded-[10px] transition-colors shadow-sm active:scale-95"
                        >
                            <Icon name="plus" size="sm" /> Add Rule
                        </button>

                        {showAddMenu && (
                            <div className="absolute right-0 top-10 w-40 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <button 
                                    onClick={() => { 
                                        setEditingRule(null); 
                                        setShowAddSheet(true); 
                                        setShowAddMenu(false); 
                                    }}
                                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50"
                                >
                                    <Icon name="edit-3" size="sm" /> Single Rule
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowBulkSheet(true);
                                        setShowAddMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Icon name="clipboard-list" size="sm" /> Bulk Import
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {rules.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-[#F3F4F6] rounded-[20px] p-8 text-center">
                        <div className="text-gray-300 mb-2 opacity-50 flex justify-center">
                            <Icon name="book-open" size="xl" />
                        </div>
                        <p className="text-[#374151] font-semibold mb-1">No rules added</p>
                        <p className="text-[#9CA3AF] text-sm">Add grammar rules to study later.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {rules.map((rule, idx) => (
                            <RuleCard 
                                key={rule.id}
                                rule={rule}
                                serial={idx + 1}
                                onEdit={() => { setEditingRule(rule); setShowAddSheet(true); }}
                                onDelete={() => setDeleteRuleId(rule.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* VOCABULARY TAB */}
        {activeTab === 'vocabulary' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
                        WORDS ({vocabWords.length})
                    </h3>
                    
                    <div className="relative">
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setShowVocabMenu(!showVocabMenu); 
                            }}
                            className="text-[13px] font-bold text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1.5 bg-[#EEF2FF] px-3 py-1.5 rounded-[10px] transition-colors shadow-sm active:scale-95"
                        >
                            <Icon name="plus" size="sm" /> Add Word
                        </button>

                        {showVocabMenu && (
                            <div className="absolute right-0 top-10 w-40 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <button 
                                    onClick={() => { 
                                        setEditingWord(null); 
                                        setShowAddVocabSheet(true); 
                                        setShowVocabMenu(false); 
                                    }}
                                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50"
                                >
                                    <Icon name="edit-3" size="sm" /> Single Word
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowBulkVocabSheet(true);
                                        setShowVocabMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Icon name="clipboard-list" size="sm" /> Bulk Import
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {vocabWords.length === 0 ? (
                    <div className="bg-white p-8 rounded-[20px] border-2 border-dashed border-[#F3F4F6] text-center">
                        <div className="text-gray-300 mb-2 opacity-50 flex justify-center">
                            <Icon name="book" size="xl" />
                        </div>
                        <p className="text-[#374151] font-semibold mb-1">No words yet</p>
                        <p className="text-[#9CA3AF] text-sm">Tap + Add Word to add your first word</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {vocabWords.map((word, idx) => (
                            <VocabCard 
                                key={word.id}
                                word={word}
                                serial={idx + 1}
                                onEdit={() => { setEditingWord(word); setShowAddVocabSheet(true); }}
                                onDelete={() => setDeleteWordId(word.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* PRACTICE TAB */}
        {activeTab === 'practice' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <PracticeSession 
                  translations={translations}
                  topics={practiceTopics}
                  lessonId={lessonId!}
                  onUpdateTranslations={saveTranslationsToStorage}
                  onUpdateTopics={saveTopicsToStorage}
                />
            </div>
        )}
      </div>

      {/* --- Grammar Modals --- */}
      {showAddSheet && (
          <AddRuleSheet 
            isOpen={showAddSheet}
            onClose={() => setShowAddSheet(false)}
            onSave={handleSaveRule}
            existingRule={editingRule}
            lessonId={lesson.id}
          />
      )}
      {showBulkSheet && (
          <BulkRuleImportSheet
            isOpen={showBulkSheet}
            onClose={() => setShowBulkSheet(false)}
            onImport={handleBulkImportRule}
            lessonId={lesson.id}
          />
      )}
      <PremiumModal isOpen={!!deleteRuleId} onClose={() => setDeleteRuleId(null)} title="Delete Rule?" size="sm">
          <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-red-50 text-red-500 rounded-full"><Icon name="trash-2" size="md" /></div>
                  <p className="text-sm text-gray-600 text-center">Are you sure you want to delete this grammar rule? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-2">
                  <button onClick={() => setDeleteRuleId(null)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                  <button onClick={handleDeleteRule} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-md shadow-red-200">Delete</button>
              </div>
          </div>
      </PremiumModal>

      {/* --- Vocabulary Modals --- */}
      {showAddVocabSheet && (
          <AddVocabSheet
            isOpen={showAddVocabSheet}
            onClose={() => setShowAddVocabSheet(false)}
            onSave={handleSaveWord}
            existingWord={editingWord}
            lessonId={lesson.id}
          />
      )}
      {showBulkVocabSheet && (
          <BulkVocabImportSheet
            isOpen={showBulkVocabSheet}
            onClose={() => setShowBulkVocabSheet(false)}
            onImport={handleBulkImportVocab}
            lessonId={lesson.id}
          />
      )}
      <PremiumModal isOpen={!!deleteWordId} onClose={() => setDeleteWordId(null)} title="Delete Word?" size="sm">
          <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-red-50 text-red-500 rounded-full"><Icon name="trash-2" size="md" /></div>
                  <p className="text-sm text-gray-600 text-center">Are you sure you want to delete this word?</p>
              </div>
              <div className="flex gap-3 pt-2">
                  <button onClick={() => setDeleteWordId(null)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                  <button onClick={handleDeleteWord} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-md shadow-red-200">Delete</button>
              </div>
          </div>
      </PremiumModal>

    </div>
  );
};

export default LessonDetailPage;