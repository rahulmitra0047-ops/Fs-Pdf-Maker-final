


import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumInput from '../../shared/components/PremiumInput';
import PremiumButton from '../../shared/components/PremiumButton';
import { useToast } from '../../shared/context/ToastContext';
import { Lesson } from '../../types';
import { lessonService } from '../../core/storage/services';
import { generateUUID } from '../../core/storage/idGenerator';

const ITEMS_PER_PAGE = 10;

const LessonListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const isLearnMode = location.pathname.includes('/learn');
  const title = isLearnMode ? 'Learn' : 'Practice';

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // FAB Menu
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Load Lessons
  const loadLessons = async () => {
    setIsLoading(true);
    try {
      const data = await lessonService.getLessons();
      setLessons(data);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

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

  const handleAddLesson = async () => {
      if (!newTitle.trim()) {
          toast.error("Lesson Title is required");
          return;
      }

      try {
        // Auto-calculate next lesson number/order
        const maxOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) : 0;
        const nextOrder = maxOrder + 1;
        
        const newItem: Lesson = {
            id: generateUUID(),
            order: nextOrder,
            title: newTitle.trim(),
            subtitle: newSubtitle.trim(),
            status: 'new',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        await lessonService.addLesson(newItem);
        setLessons(prev => [...prev, newItem].sort((a,b) => a.order - b.order));
        
        // Auto-switch to the new page if added
        const newTotalPages = Math.ceil((lessons.length + 1) / ITEMS_PER_PAGE);
        if (newTotalPages > Math.ceil(lessons.length / ITEMS_PER_PAGE)) {
            setCurrentPage(newTotalPages);
        }

        setShowAddModal(false);
        resetForm();
        toast.success("Lesson added");
        setIsFabOpen(false);
      } catch (e: any) {
        toast.error("Failed to add lesson");
      }
  };

  const resetForm = () => {
      setNewTitle('');
      setNewSubtitle('');
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteId(id);
      setActiveMenuId(null);
  };

  const handleDelete = async () => {
      if (deleteId) {
          try {
            await lessonService.deleteLesson(deleteId);
            setLessons(prev => prev.filter(l => l.id !== deleteId));
            setDeleteId(null);
            toast.success("Lesson deleted");
          } catch (e: any) {
            toast.error("Failed to delete lesson");
          }
      }
  };

  const initiateRename = (lesson: Lesson, e: React.MouseEvent) => {
      e.stopPropagation();
      setRenameId(lesson.id);
      setRenameValue(lesson.title);
      setShowRenameModal(true);
      setActiveMenuId(null);
  };

  const handleRenameSave = async () => {
      if (!renameId || !renameValue.trim()) {
          toast.error("Title cannot be empty");
          return;
      }

      try {
        await lessonService.updateLesson(renameId, { title: renameValue.trim(), updatedAt: Date.now() });
        setLessons(prev => prev.map(l => 
            l.id === renameId ? { ...l, title: renameValue.trim() } : l
        ));
        setShowRenameModal(false);
        setRenameId(null);
        toast.success("Lesson renamed");
      } catch (e: any) {
        toast.error("Failed to rename lesson");
      }
  };

  // Pagination Logic
  const totalPages = Math.ceil(lessons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLessons = lessons.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-[60px] font-sans">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#F8FAFC]/80 backdrop-blur-xl z-50 px-6 flex items-center justify-between transition-all">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center transform rotate-45 shadow-lg">
                    <Icon name={isLearnMode ? "book-open" : "play-circle"} size="sm" className="text-white transform -rotate-45" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-700">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => navigate('/settings')}
                    className="p-2 -mr-2 text-slate-400 hover:text-slate-700 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="settings" size="md" />
                </button>
            </div>
        </header>

        <div className="max-w-md mx-auto px-6 mt-4">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-slate-700 rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-400">Loading lessons...</p>
                </div>
            ) : lessons.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-[24px] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 mt-4">
                    <div className="text-4xl mb-4 opacity-20 grayscale">📚</div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No lessons yet</h3>
                    {isLearnMode ? (
                        <p className="text-sm text-slate-400 mb-6">Tap + to add your first lesson</p>
                    ) : (
                        <p className="text-sm text-slate-400 mb-6">Check back later for new lessons</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-3">
                        {currentLessons.map((lesson) => (
                            <div 
                                key={lesson.id}
                                onClick={() => navigate(`/learn/lesson/${lesson.id}`)}
                                className="relative group bg-white rounded-[20px] p-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 active:scale-[0.98] transition-all duration-150 cursor-pointer hover:border-slate-200"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex flex-col items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 leading-none mb-0.5">Lesson</span>
                                            <span className="text-lg font-bold leading-none">{lesson.order}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-base font-bold text-slate-700 leading-tight truncate pr-2">{lesson.title}</h3>
                                            <p className="text-xs font-medium text-slate-400 mt-1 truncate">
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
                                                className="text-slate-300 hover:text-slate-600 p-2 transition-colors rounded-full"
                                            >
                                                <Icon name="more-vertical" size="sm" />
                                            </button>
                                            
                                            {activeMenuId === lesson.id && (
                                                <div className="absolute right-0 top-8 z-20 bg-white border border-slate-100 rounded-xl shadow-xl min-w-[140px] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                                    <button 
                                                        onClick={(e) => initiateRename(lesson, e)}
                                                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                                                    >
                                                        <Icon name="edit-3" size="sm" /> Rename
                                                    </button>
                                                    <button 
                                                        onClick={(e) => confirmDelete(lesson.id, e)}
                                                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Icon name="trash-2" size="sm" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                                        lesson.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        lesson.status === 'in-progress' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                        'bg-slate-50 text-slate-500 border border-slate-100'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            lesson.status === 'completed' ? 'bg-emerald-500' :
                                            lesson.status === 'in-progress' ? 'bg-amber-500' :
                                            'bg-slate-400'
                                        }`}></span>
                                        {lesson.status || 'new'}
                                    </span>
                                    <button className="text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-1 px-2 py-1 -mr-2 group-hover:translate-x-1 duration-200">
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
                                className="p-2 rounded-xl border bg-white border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                            >
                                <Icon name="chevron-left" size="sm" />
                            </button>
                            
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                            currentPage === i + 1 
                                                ? 'bg-slate-700 text-white border border-slate-700 scale-105' 
                                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl border bg-white border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
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
            <div className="fixed bottom-[100px] right-6 z-40 flex flex-col items-end gap-3">
                {isFabOpen && (
                    <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-2 duration-200">
                        <button 
                            onClick={() => { setShowAddModal(true); setIsFabOpen(false); }}
                            className="flex items-center gap-3 group"
                        >
                            <span className="bg-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 text-xs font-bold text-slate-600">Add Lesson</span>
                            <div className="w-10 h-10 bg-white text-slate-700 border border-slate-100 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                                <Icon name="plus" size="sm" />
                            </div>
                        </button>
                    </div>
                )}
                
                <button 
                    onClick={() => setIsFabOpen(!isFabOpen)}
                    className={`w-14 h-14 rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center transition-all duration-300 active:scale-90 ${isFabOpen ? 'bg-slate-800 text-white rotate-45' : 'bg-slate-700 text-white'}`}
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