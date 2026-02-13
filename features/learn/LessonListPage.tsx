
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
  subtitle?: string;
  grammar?: string;
  vocabulary?: string;
  status: 'new' | 'in-progress' | 'completed';
}

const STORAGE_KEY = 'mock_lessons_local';
const ITEMS_PER_PAGE = 10;

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Rename State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newGrammar, setNewGrammar] = useState('');
  const [newVocab, setNewVocab] = useState('');

  // FAB Menu
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Save to local storage whenever lessons change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  }, [lessons]);

  // Adjust pagination if items are deleted and current page becomes empty
  useEffect(() => {
    const totalPages = Math.ceil(lessons.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    }
  }, [lessons.length, currentPage]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAddLesson = () => {
      if (!newTitle.trim()) {
          toast.error("Lesson Title is required");
          return;
      }

      // Auto-calculate next lesson number
      const maxNum = lessons.length > 0 ? Math.max(...lessons.map(l => l.number)) : 0;
      const nextNum = maxNum + 1;
      
      const newItem: Lesson = {
          id: crypto.randomUUID(),
          number: nextNum,
          title: newTitle.trim(),
          subtitle: newSubtitle.trim(),
          grammar: newGrammar,
          vocabulary: newVocab,
          status: 'new'
      };
      
      const updatedLessons = [...lessons, newItem].sort((a,b) => a.number - b.number);
      setLessons(updatedLessons);
      
      // Auto-switch to the new page if added
      const newTotalPages = Math.ceil(updatedLessons.length / ITEMS_PER_PAGE);
      if (newTotalPages > Math.ceil(lessons.length / ITEMS_PER_PAGE)) {
          setCurrentPage(newTotalPages);
      }

      setShowAddModal(false);
      resetForm();
      toast.success("Lesson added");
      setIsFabOpen(false);
  };

  const resetForm = () => {
      setNewTitle('');
      setNewSubtitle('');
      setNewGrammar('');
      setNewVocab('');
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteId(id);
      setActiveMenuId(null);
  };

  const handleDelete = () => {
      if (deleteId) {
          setLessons(prev => prev.filter(l => l.id !== deleteId));
          setDeleteId(null);
          toast.success("Lesson deleted");
      }
  };

  const initiateRename = (lesson: Lesson, e: React.MouseEvent) => {
      e.stopPropagation();
      setRenameId(lesson.id);
      setRenameValue(lesson.title);
      setShowRenameModal(true);
      setActiveMenuId(null);
  };

  const handleRenameSave = () => {
      if (!renameId || !renameValue.trim()) {
          toast.error("Title cannot be empty");
          return;
      }

      setLessons(prev => prev.map(l => 
          l.id === renameId ? { ...l, title: renameValue.trim() } : l
      ));
      
      setShowRenameModal(false);
      setRenameId(null);
      toast.success("Lesson renamed");
  };

  // Pagination Logic
  const totalPages = Math.ceil(lessons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLessons = lessons.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

        <div className="max-w-3xl mx-auto px-4 mt-4">
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
                <>
                    <div className="space-y-2.5">
                        {currentLessons.map((lesson) => (
                            <div 
                                key={lesson.id}
                                className="bg-white border border-[#F3F4F6] rounded-[16px] p-3.5 shadow-sm active:scale-[0.99] transition-all flex flex-col gap-2 relative group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] text-[#6366F1] flex flex-col items-center justify-center shadow-sm flex-shrink-0">
                                            <span className="text-[8px] font-bold uppercase tracking-normal opacity-60 leading-none mb-0.5">Lesson</span>
                                            <span className="text-[15px] font-bold leading-none">{lesson.number}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-[15px] font-semibold text-[#111827] leading-tight truncate pr-2">{lesson.title}</h3>
                                            <p className="text-[12px] text-[#9CA3AF] mt-0.5 truncate">
                                                {lesson.subtitle || 'Grammar + Vocabulary'}
                                            </p>
                                        </div>
                                    </div>
                                    {isLearnMode && (
                                        <div className="relative flex-shrink-0 -mt-1 -mr-1">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(activeMenuId === lesson.id ? null : lesson.id);
                                                }}
                                                className="text-gray-300 hover:text-gray-900 p-2 transition-colors rounded-full"
                                            >
                                                <Icon name="more-vertical" size="sm" />
                                            </button>
                                            
                                            {activeMenuId === lesson.id && (
                                                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-xl min-w-[140px] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                                    <button 
                                                        onClick={(e) => initiateRename(lesson, e)}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50"
                                                    >
                                                        <Icon name="edit-3" size="sm" /> Rename
                                                    </button>
                                                    <button 
                                                        onClick={(e) => confirmDelete(lesson.id, e)}
                                                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Icon name="trash-2" size="sm" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-[#F9FAFB] mt-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        {lesson.status}
                                    </span>
                                    <button className="text-[12px] font-bold text-[#6366F1] hover:text-[#4F46E5] transition-colors flex items-center gap-1 px-2 py-1 -mr-2">
                                        {isLearnMode ? 'Start' : 'Practice'} <Icon name="arrow-right" size="sm" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6 mb-8 select-none">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Icon name="chevron-left" size="sm" />
                            </button>
                            
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                            currentPage === i + 1 
                                                ? 'bg-[#6366F1] text-white border border-[#6366F1] scale-105' 
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Icon name="chevron-right" size="sm" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Floating Action Button (Learn Mode Only) */}
        {isLearnMode && (
            <div className="fixed bottom-28 right-5 z-40 flex flex-col items-end gap-3">
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

        {/* Add Lesson Modal - Compact */}
        <PremiumModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Lesson">
            <div className="space-y-3">
                <div>
                    <PremiumInput 
                        label="Lesson Title" 
                        placeholder="e.g. Introduction" 
                        value={newTitle}
                        onChange={setNewTitle}
                    />
                </div>
                <div>
                    <PremiumInput 
                        label="Subtitle (Optional)" 
                        placeholder="e.g. Basics of Nouns" 
                        value={newSubtitle}
                        onChange={setNewSubtitle}
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Grammar Note (Optional)</label>
                    <textarea 
                        className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all resize-none"
                        rows={2}
                        placeholder="Brief points..."
                        value={newGrammar}
                        onChange={(e) => setNewGrammar(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Vocabulary (Optional)</label>
                    <textarea 
                        className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all resize-none"
                        rows={2}
                        placeholder="Word list..."
                        value={newVocab}
                        onChange={(e) => setNewVocab(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowAddModal(false)} size="sm">Cancel</PremiumButton>
                    <PremiumButton onClick={handleAddLesson} size="sm">Save Lesson</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        {/* Rename Modal */}
        <PremiumModal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)} title="Rename Lesson" size="sm">
            <div className="space-y-4">
                <PremiumInput 
                    label="Lesson Title" 
                    value={renameValue} 
                    onChange={setRenameValue}
                    placeholder="Enter new title"
                />
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowRenameModal(false)}>Cancel</PremiumButton>
                    <PremiumButton onClick={handleRenameSave}>Save Changes</PremiumButton>
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
