
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumInput from '../../shared/components/PremiumInput';
import PremiumButton from '../../shared/components/PremiumButton';
import { useToast } from '../../shared/context/ToastContext';

interface Lesson {
  id: string;
  number: number;
  title: string;
  grammar?: string;
  vocabulary?: string;
  status: 'new' | 'in-progress' | 'completed';
}

const STORAGE_KEY = 'mock_lessons_local';

const LessonListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const isLearnMode = location.pathname.includes('/learn');
  const title = isLearnMode ? 'Learn' : 'Practice';

  // Fix: Lazy initialize state from localStorage to prevent overwriting with [] on mount
  const [lessons, setLessons] = useState<Lesson[]>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to load local lessons", e);
        return [];
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [newNumber, setNewNumber] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newGrammar, setNewGrammar] = useState('');
  const [newVocab, setNewVocab] = useState('');

  // FAB Menu
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Save to local storage whenever lessons change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  }, [lessons]);

  const handleAddLesson = () => {
      if (!newNumber || !newTitle) {
          toast.error("Lesson Number and Title are required");
          return;
      }

      const num = parseInt(newNumber);
      if (isNaN(num)) {
          toast.error("Lesson Number must be a valid number");
          return;
      }
      
      const newItem: Lesson = {
          id: crypto.randomUUID(),
          number: num,
          title: newTitle,
          grammar: newGrammar,
          vocabulary: newVocab,
          status: 'new'
      };
      
      setLessons(prev => [...prev, newItem].sort((a,b) => a.number - b.number));
      setShowAddModal(false);
      resetForm();
      toast.success("Lesson added");
      setIsFabOpen(false);
  };

  const resetForm = () => {
      setNewNumber('');
      setNewTitle('');
      setNewGrammar('');
      setNewVocab('');
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteId(id);
  };

  const handleDelete = () => {
      if (deleteId) {
          setLessons(prev => prev.filter(l => l.id !== deleteId));
          setDeleteId(null);
          toast.success("Lesson deleted");
      }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 pt-[60px]">
        {/* Custom Header (Matches TopicListPage) */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
            <div className="w-10"></div>
            <h1 className="text-[18px] font-semibold text-[#111827] absolute left-1/2 -translate-x-1/2 tracking-tight">
                {title}
            </h1>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => navigate('/settings')}
                    className="p-2 -mr-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="settings" size="md" />
                </button>
            </div>
        </header>

        <div className="max-w-3xl mx-auto px-5 mt-4">
            {lessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <Icon name="book" size="xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No lessons yet</h3>
                    {isLearnMode ? (
                        <p className="text-sm text-gray-500">Tap + to add your first lesson</p>
                    ) : (
                        <p className="text-sm text-gray-500">Check back later for new lessons</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {lessons.map((lesson) => (
                        <div 
                            key={lesson.id}
                            className="bg-white border border-[#F3F4F6] rounded-[20px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.99] transition-all flex flex-col gap-3"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[14px] bg-[#EEF2FF] text-[#6366F1] flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Les</span>
                                        <span className="text-[18px] font-bold leading-none">{lesson.number}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-[16px] font-semibold text-[#111827]">{lesson.title}</h3>
                                        <p className="text-[13px] text-[#9CA3AF] mt-0.5">
                                            {lesson.grammar ? 'Grammar + Vocabulary' : 'Vocabulary'}
                                        </p>
                                    </div>
                                </div>
                                {isLearnMode && (
                                    <button 
                                        onClick={(e) => confirmDelete(lesson.id, e)}
                                        className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                                    >
                                        <Icon name="trash-2" size="sm" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-[#F9FAFB] mt-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    {lesson.status}
                                </span>
                                <button className="text-[13px] font-bold text-[#6366F1] hover:text-[#4F46E5] transition-colors flex items-center gap-1">
                                    {isLearnMode ? 'Start' : 'Practice'} <Icon name="arrow-right" size="sm" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Floating Action Button (Learn Mode Only) */}
        {isLearnMode && (
            <div className="fixed bottom-[84px] right-5 z-40 flex flex-col items-end gap-3">
                {isFabOpen && (
                    <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-2 duration-200">
                        <button 
                            onClick={() => { setShowAddModal(true); setIsFabOpen(false); }}
                            className="flex items-center gap-3 group"
                        >
                            <span className="bg-white px-3 py-1.5 rounded-[10px] shadow-sm border border-[#F3F4F6] text-[13px] font-bold text-[#374151]">Add Lesson</span>
                            <div className="w-11 h-11 bg-white text-[#6366F1] border border-[#E5E7EB] rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform">
                                <Icon name="plus" size="sm" />
                            </div>
                        </button>
                    </div>
                )}
                
                <button 
                    onClick={() => setIsFabOpen(!isFabOpen)}
                    className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${isFabOpen ? 'bg-gray-800 text-white rotate-45' : 'bg-[#6366F1] text-white'}`}
                >
                    <Icon name="plus" size="lg" />
                </button>
            </div>
        )}

        {/* Add Lesson Modal */}
        <PremiumModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Lesson">
            <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <PremiumInput 
                            label="No." 
                            placeholder="1" 
                            type="number"
                            value={newNumber}
                            onChange={setNewNumber}
                        />
                    </div>
                    <div className="col-span-3">
                        <PremiumInput 
                            label="Title" 
                            placeholder="e.g. Introduction" 
                            value={newTitle}
                            onChange={setNewTitle}
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Grammar Note (Optional)</label>
                    <textarea 
                        className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all resize-none"
                        rows={3}
                        placeholder="Brief grammar points..."
                        value={newGrammar}
                        onChange={(e) => setNewGrammar(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Vocabulary (Optional)</label>
                    <textarea 
                        className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all resize-none"
                        rows={3}
                        placeholder="Comma separated words..."
                        value={newVocab}
                        onChange={(e) => setNewVocab(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</PremiumButton>
                    <PremiumButton onClick={handleAddLesson}>Save Lesson</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        {/* Delete Confirmation Modal */}
        <PremiumModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Lesson?" size="sm">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Are you sure you want to delete this lesson? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setDeleteId(null)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={handleDelete}>Delete</PremiumButton>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default LessonListPage;
