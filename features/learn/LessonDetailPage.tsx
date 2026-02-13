
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumInput from '../../shared/components/PremiumInput';
import { useToast } from '../../shared/context/ToastContext';

interface Lesson {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  grammar?: string;
  vocabulary?: string;
  status: 'new' | 'in-progress' | 'completed';
}

interface VocabItem {
    word: string;
    meaning: string;
}

interface GrammarRule {
    id: string;
    ruleNo: number;
    title: string;
    explanation: string;
    pattern?: string;
    bnHint?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    examples: string[];
}

const STORAGE_KEY = 'mock_lessons_local';

const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'grammar' | 'vocabulary' | 'example'>('grammar');
  
  // Grammar State
  const [rules, setRules] = useState<GrammarRule[]>([]);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<GrammarRule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formPattern, setFormPattern] = useState('');
  const [formBnHint, setFormBnHint] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('Beginner');
  const [formEx1, setFormEx1] = useState('');
  const [formEx2, setFormEx2] = useState('');
  const [formEx3, setFormEx3] = useState('');
  const [formErrors, setFormErrors] = useState<{title?: string, explanation?: string}>({});

  useEffect(() => {
    // Load lesson from local storage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const lessons: Lesson[] = JSON.parse(saved);
        const found = lessons.find(l => l.id === lessonId);
        if (found) {
            setLesson(found);
            // Parse Grammar Rules
            if (found.grammar) {
                try {
                    const parsed = JSON.parse(found.grammar);
                    if (Array.isArray(parsed)) {
                        setRules(parsed);
                    } else {
                        // Migration: Turn legacy string into Rule 1
                        setRules([{
                            id: crypto.randomUUID(),
                            ruleNo: 1,
                            title: 'Overview',
                            explanation: found.grammar,
                            examples: []
                        }]);
                    }
                } catch (e) {
                    // Migration: Plain text to Rule 1
                    if (found.grammar.trim()) {
                        setRules([{
                            id: crypto.randomUUID(),
                            ruleNo: 1,
                            title: 'Overview',
                            explanation: found.grammar,
                            examples: []
                        }]);
                    } else {
                        setRules([]);
                    }
                }
            } else {
                setRules([]);
            }
        }
      }
    } catch (e) {
      console.error("Failed to load lesson", e);
    }
  }, [lessonId]);

  const saveRulesToStorage = (newRules: GrammarRule[]) => {
      setRules(newRules);
      if (lesson) {
          const updatedLesson = { ...lesson, grammar: JSON.stringify(newRules) };
          setLesson(updatedLesson);
          
          // Persist to localStorage
          try {
              const saved = localStorage.getItem(STORAGE_KEY);
              if (saved) {
                  const allLessons: Lesson[] = JSON.parse(saved);
                  const idx = allLessons.findIndex(l => l.id === lesson.id);
                  if (idx !== -1) {
                      allLessons[idx] = updatedLesson;
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLessons));
                  }
              }
          } catch (e) {
              console.error("Failed to save rules", e);
              toast.error("Failed to save changes");
          }
      }
  };

  const handleOpenAdd = () => {
      setEditingRule(null);
      setFormTitle('');
      setFormExplanation('');
      setFormPattern('');
      setFormBnHint('');
      setFormDifficulty('Beginner');
      setFormEx1('');
      setFormEx2('');
      setFormEx3('');
      setFormErrors({});
      setShowRuleModal(true);
  };

  const handleOpenEdit = (rule: GrammarRule, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingRule(rule);
      setFormTitle(rule.title);
      setFormExplanation(rule.explanation);
      setFormPattern(rule.pattern || '');
      setFormBnHint(rule.bnHint || '');
      setFormDifficulty(rule.difficulty || 'Beginner');
      setFormEx1(rule.examples[0] || '');
      setFormEx2(rule.examples[1] || '');
      setFormEx3(rule.examples[2] || '');
      setFormErrors({});
      setShowRuleModal(true);
  };

  const handleSaveRule = () => {
      // Validation
      const errors: {title?: string, explanation?: string} = {};
      if (!formTitle.trim()) errors.title = "Required";
      if (!formExplanation.trim()) errors.explanation = "Required";
      
      if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          return;
      }

      const examples = [formEx1, formEx2, formEx3].filter(ex => ex.trim().length > 0);

      if (editingRule) {
          // Update
          const updatedRules = rules.map(r => r.id === editingRule.id ? {
              ...r,
              title: formTitle,
              explanation: formExplanation,
              pattern: formPattern,
              bnHint: formBnHint,
              difficulty: formDifficulty as any,
              examples
          } : r);
          saveRulesToStorage(updatedRules);
          toast.success("Rule updated");
      } else {
          // Create
          const nextNo = rules.length > 0 ? Math.max(...rules.map(r => r.ruleNo)) + 1 : 1;
          const newRule: GrammarRule = {
              id: crypto.randomUUID(),
              ruleNo: nextNo,
              title: formTitle,
              explanation: formExplanation,
              pattern: formPattern,
              bnHint: formBnHint,
              difficulty: formDifficulty as any,
              examples
          };
          // Sort by ruleNo to keep order
          const updatedRules = [...rules, newRule].sort((a,b) => a.ruleNo - b.ruleNo);
          saveRulesToStorage(updatedRules);
          toast.success("Rule added");
      }
      setShowRuleModal(false);
  };

  const handleDeleteRule = () => {
      if (deleteRuleId) {
          const updatedRules = rules.filter(r => r.id !== deleteRuleId);
          saveRulesToStorage(updatedRules);
          setDeleteRuleId(null);
          toast.success("Rule deleted");
      }
  };

  // Parse Vocabulary String (Existing Logic)
  const vocabList: VocabItem[] = useMemo(() => {
      if (!lesson?.vocabulary) return [];
      
      return lesson.vocabulary.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => {
              let parts = line.split(' - ');
              if (parts.length < 2) parts = line.split('=');
              
              if (parts.length >= 2) {
                  return {
                      word: parts[0].trim(),
                      meaning: parts.slice(1).join(' ').trim()
                  };
              }
              return { word: line, meaning: '' };
          });
  }, [lesson?.vocabulary]);

  const speak = (text: string) => {
      if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
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
            {['grammar', 'vocabulary', 'example'].map((tab) => (
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
                        Grammar Rules ({rules.length})
                    </h3>
                    <button 
                        onClick={handleOpenAdd}
                        className="text-[13px] font-bold text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1.5 bg-[#EEF2FF] px-3 py-1.5 rounded-[10px] transition-colors"
                    >
                        <Icon name="plus" size="sm" /> Add Rule
                    </button>
                </div>

                {rules.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-[#F3F4F6] rounded-[20px] p-8 text-center">
                        <div className="text-gray-300 mb-2 opacity-50 flex justify-center">
                            <Icon name="book-open" size="xl" />
                        </div>
                        <p className="text-[#374151] font-semibold mb-1">No grammar rules yet</p>
                        <p className="text-[#9CA3AF] text-sm">Tap + Add Rule to create your first rule.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {rules.map((rule) => {
                            const isExpanded = expandedRuleId === rule.id;
                            
                            return (
                                <div 
                                    key={rule.id}
                                    onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                                    className={`bg-white border border-[#F3F4F6] rounded-[18px] p-4 shadow-sm transition-all duration-200 cursor-pointer ${isExpanded ? 'ring-1 ring-[#6366F1]' : 'active:scale-[0.99] hover:border-[#E5E7EB]'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[11px] font-bold bg-[#F3F4F6] text-[#6B7280] px-2 py-0.5 rounded-md">
                                                    Rule {rule.ruleNo}
                                                </span>
                                                <h4 className="text-[15px] font-bold text-[#111827]">{rule.title}</h4>
                                            </div>
                                            {!isExpanded && (
                                                <p className="text-[13px] text-[#6B7280] line-clamp-2 leading-relaxed">
                                                    {rule.explanation}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className="relative group">
                                            <button className="p-1 text-[#9CA3AF] hover:text-[#374151]">
                                                <Icon name="more-vertical" size="sm" />
                                            </button>
                                            <div className="absolute right-0 top-6 hidden group-hover:block z-20 w-32 bg-white border border-[#F3F4F6] shadow-xl rounded-xl overflow-hidden p-1">
                                                <button 
                                                    onClick={(e) => handleOpenEdit(rule, e)}
                                                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-[#F9FAFB] rounded-lg flex items-center gap-2"
                                                >
                                                    <Icon name="edit-3" size="sm" /> Edit
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setDeleteRuleId(rule.id); }}
                                                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-[#FEF2F2] rounded-lg flex items-center gap-2"
                                                >
                                                    <Icon name="trash-2" size="sm" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="mt-3 pt-3 border-t border-[#F3F4F6] animate-in fade-in slide-in-from-top-1">
                                            <p className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap mb-4">
                                                {rule.explanation}
                                            </p>

                                            {rule.pattern && (
                                                <div className="mb-3">
                                                    <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1">Structure</div>
                                                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] font-mono text-[#111827]">
                                                        {rule.pattern}
                                                    </div>
                                                </div>
                                            )}

                                            {rule.bnHint && (
                                                <div className="mb-3">
                                                    <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                        <Icon name="info" size="sm" /> মনে রেখো
                                                    </div>
                                                    <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg px-3 py-2 text-[13px] text-[#92400E]">
                                                        {rule.bnHint}
                                                    </div>
                                                </div>
                                            )}

                                            {rule.examples.length > 0 && (
                                                <div>
                                                    <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1">Examples</div>
                                                    <ul className="space-y-1.5">
                                                        {rule.examples.map((ex, i) => (
                                                            <li key={i} className="text-[13px] text-[#4B5563] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#6366F1]">
                                                                {ex}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            {rule.difficulty && (
                                                <div className="mt-3 flex justify-end">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border 
                                                        ${rule.difficulty === 'Advanced' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                                                          rule.difficulty === 'Intermediate' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                                          'bg-green-50 text-green-700 border-green-100'}`}>
                                                        {rule.difficulty}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        {/* VOCABULARY TAB (Unchanged) */}
        {activeTab === 'vocabulary' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {vocabList.length === 0 ? (
                    <div className="bg-white p-8 rounded-[20px] border border-[#F3F4F6] shadow-sm text-center text-gray-400">
                        No vocabulary added yet.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {vocabList.map((item, idx) => (
                            <div 
                                key={idx} 
                                className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-all"
                            >
                                <div>
                                    <div className="text-[16px] font-bold text-[#111827]">{item.word}</div>
                                    {item.meaning && (
                                        <div className="text-[14px] text-gray-500 mt-0.5">{item.meaning}</div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => speak(item.word)}
                                    className="p-3 rounded-full text-gray-400 hover:text-[#6366F1] hover:bg-indigo-50 active:bg-indigo-100 active:scale-95 transition-all"
                                    title="Listen"
                                >
                                    <Icon name="volume-2" size="sm" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* EXAMPLE TAB (Unchanged) */}
        {activeTab === 'example' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                <div className="bg-white p-5 rounded-[20px] border border-[#F3F4F6] shadow-sm flex flex-col items-center text-center py-10">
                    <div className="text-gray-300 mb-3"><Icon name="sparkles" size="lg" /></div>
                    <p className="text-[#9CA3AF] text-sm">Examples will appear here.</p>
                </div>
            </div>
        )}
      </div>

      {/* Add/Edit Rule Modal */}
      <PremiumModal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)} title={editingRule ? "Edit Rule" : "Add Rule"} size="md">
          <div className="space-y-4">
              <PremiumInput 
                  label="Rule Title" 
                  placeholder="e.g. Present Indefinite Tense"
                  value={formTitle}
                  onChange={setFormTitle}
                  error={formErrors.title}
              />
              
              <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5 ml-1">Explanation</label>
                  <textarea 
                      className={`w-full bg-white border rounded-[12px] px-3 py-3 text-base outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all resize-y min-h-[100px] ${formErrors.explanation ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Explain the grammar rule..."
                      value={formExplanation}
                      onChange={(e) => setFormExplanation(e.target.value)}
                  />
                  {formErrors.explanation && <p className="text-xs text-red-500 mt-1 ml-1">{formErrors.explanation}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <PremiumInput 
                      label="Structure / Pattern" 
                      placeholder="Sub + Verb + Obj"
                      value={formPattern}
                      onChange={setFormPattern}
                  />
                  <div>
                      <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5 ml-1">Difficulty</label>
                      <select 
                          value={formDifficulty}
                          onChange={(e) => setFormDifficulty(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-[12px] px-3 py-3 text-base outline-none focus:border-indigo-600"
                      >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                      </select>
                  </div>
              </div>

              <PremiumInput 
                  label="Bengali Hint (Optional)" 
                  placeholder="e.g. শেষে 'ই' থাকলে..."
                  value={formBnHint}
                  onChange={setFormBnHint}
              />

              <div className="bg-[#F9FAFB] p-4 rounded-[14px] border border-[#F3F4F6] space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Examples (Optional)</label>
                  <input className="w-full p-2.5 rounded-[10px] border border-gray-200 text-sm" placeholder="Example 1" value={formEx1} onChange={e => setFormEx1(e.target.value)} />
                  <input className="w-full p-2.5 rounded-[10px] border border-gray-200 text-sm" placeholder="Example 2" value={formEx2} onChange={e => setFormEx2(e.target.value)} />
                  <input className="w-full p-2.5 rounded-[10px] border border-gray-200 text-sm" placeholder="Example 3" value={formEx3} onChange={e => setFormEx3(e.target.value)} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                  <PremiumButton variant="ghost" onClick={() => setShowRuleModal(false)}>Cancel</PremiumButton>
                  <PremiumButton onClick={handleSaveRule}>Save Rule</PremiumButton>
              </div>
          </div>
      </PremiumModal>

      {/* Delete Rule Modal */}
      <PremiumModal isOpen={!!deleteRuleId} onClose={() => setDeleteRuleId(null)} title="Delete Rule?" size="sm">
          <div className="space-y-4">
              <p className="text-sm text-gray-600">Are you sure you want to delete this grammar rule?</p>
              <div className="flex justify-end gap-3 pt-2">
                  <PremiumButton variant="ghost" onClick={() => setDeleteRuleId(null)}>Cancel</PremiumButton>
                  <PremiumButton variant="danger" onClick={handleDeleteRule}>Delete</PremiumButton>
              </div>
          </div>
      </PremiumModal>

    </div>
  );
};

export default LessonDetailPage;
