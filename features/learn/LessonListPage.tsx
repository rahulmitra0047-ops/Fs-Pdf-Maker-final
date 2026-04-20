


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
    <div className="min-h-screen bg-background pb-24 pt-[60px] font-sans text-text-primary">
        {/* Custom Header */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-background border-b border-border z-50 px-6 flex items-center justify-between transition-all">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 border border-border flex items-center justify-center bg-surface">
                    <Icon name={isLearnMode ? "book-open" : "play-circle"} size="sm" className="text-text-primary" />
                </div>
                <h1 className="text-xl font-medium tracking-tight font-serif">{title}</h1>
            </div>
        </header>

        <div className="max-w-md mx-auto px-6 mt-6">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin"></div>
                    <p className="text-sm font-sans tracking-[0.1em] uppercase text-text-secondary">Loading lessons...</p>
                </div>
            ) : lessons.length === 0 ? (
                <div className="text-center py-12 bg-surface border border-border mt-4">
                    <div className="text-3xl mb-4 text-text-secondary grayscale">📚</div>
                    <h3 className="text-lg font-serif text-text-primary mb-1">No lessons yet</h3>
                    {isLearnMode ? (
                        <p className="text-xs font-sans text-text-secondary mt-1">Tap + to add your first lesson</p>
                    ) : (
                        <p className="text-xs font-sans text-text-secondary mt-1">Check back later for new lessons</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-4">
                        {currentLessons.map((lesson) => (
                            <div 
                                key={lesson.id}
                                onClick={() => navigate(`/learn/lesson/${lesson.id}`)}
                                className="relative group bg-surface border border-border px-5 py-4 w-full active:scale-95 transition-transform duration-200 cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="w-12 h-12 bg-background flex flex-col items-center justify-center border border-border flex-shrink-0">
                                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-secondary leading-none mb-1">Lesson</span>
                                            <span className="text-lg font-serif leading-none text-text-primary">{lesson.order}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-serif text-text-primary leading-tight truncate pr-2">{lesson.title}</h3>
                                            <p className="text-[11px] font-sans tracking-[0.05em] text-text-secondary mt-1 truncate uppercase font-semibold">
                                                {lesson.subtitle || 'Grammar + Vocabulary'}
                                            </p>
                                        </div>
                                    </div>
                                    {isLearnMode && (
                                        <div className="relative flex-shrink-0 -mt-1 -mr-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(activeMenuId === lesson.id ? null : lesson.id);
                                                }}
                                                className="text-text-secondary hover:text-text-primary p-2 transition-colors border border-transparent hover:border-border hover:bg-background"
                                            >
                                                <Icon name="more-vertical" size="sm" />
                                            </button>
                                            
                                            {activeMenuId === lesson.id && (
                                                <div className="absolute right-0 top-10 z-20 bg-surface border border-border shadow-md min-w-[140px] animate-in fade-in duration-100">
                                                    <button 
                                                        onClick={(e) => initiateRename(lesson, e)}
                                                        className="w-full text-left px-4 py-2 text-[13px] font-sans font-medium text-text-primary hover:bg-background flex items-center gap-2 border-b border-border"
                                                    >
                                                        <Icon name="edit-3" size="sm" /> Rename
                                                    </button>
                                                    <button 
                                                        onClick={(e) => confirmDelete(lesson.id, e)}
                                                        className="w-full text-left px-4 py-2 text-[13px] font-sans font-medium text-error hover:bg-background flex items-center gap-2"
                                                    >
                                                        <Icon name="trash-2" size="sm" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                                        <span className={`w-1.5 h-1.5 ${
                                            lesson.status === 'completed' ? 'bg-success' :
                                            lesson.status === 'in-progress' ? 'bg-warning' :
                                            'bg-text-secondary'
                                        }`}></span>
                                        {lesson.status || 'new'}
                                    </span>
                                    <button className="text-[11px] uppercase tracking-wider font-bold text-text-primary flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                        {isLearnMode ? 'Start' : 'Practice'} <Icon name="arrow-right" size="sm" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-8 mb-8 select-none font-sans">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 border bg-surface border-border text-text-primary disabled:opacity-40 hover:bg-background transition-colors flex items-center justify-center focus:outline-none"
                            >
                                <Icon name="chevron-left" size="sm" />
                            </button>
                            
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-10 h-10 text-[13px] font-bold tracking-wide transition-colors focus:outline-none ${
                                            currentPage === i + 1 
                                                ? 'bg-primary text-white border border-primary' 
                                                : 'bg-surface border border-border text-text-primary hover:bg-background'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 border bg-surface border-border text-text-primary disabled:opacity-40 hover:bg-background transition-colors flex items-center justify-center focus:outline-none"
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
            <div className="fixed bottom-[100px] right-6 z-40 flex flex-col items-end gap-3 cursor-pointer">
                {isFabOpen && (
                    <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-2 duration-200">
                        <button 
                            onClick={() => { setShowAddModal(true); setIsFabOpen(false); }}
                            className="flex items-center gap-3 group"
                        >
                            <span className="bg-surface px-3 py-1.5 border border-border text-[11px] font-sans font-bold tracking-widest uppercase text-text-primary">Add Lesson</span>
                            <div className="w-10 h-10 bg-background border border-border flex items-center justify-center text-text-primary active:scale-95 transition-transform hover:bg-surface">
                                <Icon name="plus" size="sm" />
                            </div>
                        </button>
                    </div>
                )}
                
                <button 
                    onClick={() => setIsFabOpen(!isFabOpen)}
                    className="w-14 h-14 bg-primary text-white flex items-center justify-center active:scale-95 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                >
                    <Icon name={isFabOpen ? 'x' : 'plus'} size="md" />
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