import React, { useState, useEffect } from 'react';
import { TranslationItem, PracticeTopic } from '../../../types';
import TranslationView from './TranslationView';
import TopicView from './TopicView';
import Icon from '../../../shared/components/Icon';
import AddTranslationSheet from './AddTranslationSheet';
import BulkTranslationImportSheet from './BulkTranslationImportSheet';
import AddTopicSheet from './AddTopicSheet';
import BulkTopicImportSheet from './BulkTopicImportSheet';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  translations: TranslationItem[];
  topics: PracticeTopic[];
  lessonId: string;
  // Granular handlers
  onAddTranslation: (item: TranslationItem) => void;
  onUpdateTranslation: (item: TranslationItem) => void;
  onDeleteTranslation: (id: string) => void;
  onBulkTranslation: (items: TranslationItem[]) => void;
  
  onAddTopic: (item: PracticeTopic) => void;
  onUpdateTopic: (item: PracticeTopic) => void;
  onDeleteTopic: (id: string) => void;
  onBulkTopic: (items: PracticeTopic[]) => void;
}

type PracticeMode = 'translation' | 'job' | 'ielts' | null;

const PracticeSession: React.FC<Props> = ({ 
  translations, topics, lessonId, 
  onAddTranslation, onUpdateTranslation, onDeleteTranslation, onBulkTranslation,
  onAddTopic, onUpdateTopic, onDeleteTopic, onBulkTopic
}) => {
  const toast = useToast();
  const [activeMode, setActiveMode] = useState<PracticeMode>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  // Modals / Sheets
  const [showAddTranslation, setShowAddTranslation] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<TranslationItem | null>(null);
  const [showBulkTranslation, setShowBulkTranslation] = useState(false);
  
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<PracticeTopic | null>(null);
  const [showBulkTopic, setShowBulkTopic] = useState(false);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'translation' | 'topic' | null>(null);

  const jobTopics = topics.filter(t => (t.type || 'job') === 'job');
  const ieltsTopics = topics.filter(t => t.type === 'ielts');

  const currentList = 
    activeMode === 'translation' ? translations :
    activeMode === 'job' ? jobTopics :
    activeMode === 'ielts' ? ieltsTopics : [];

  useEffect(() => {
    if (currentIndex >= currentList.length && currentList.length > 0) {
        setCurrentIndex(0);
    }
  }, [currentList.length, currentIndex]);

  const handleSaveTranslation = (item: TranslationItem) => {
    if (translations.some(t => t.id === item.id)) onUpdateTranslation(item);
    else onAddTranslation(item);
    setEditingTranslation(null);
  };

  const handleSaveTopic = (item: PracticeTopic) => {
    if (topics.some(t => t.id === item.id)) onUpdateTopic(item);
    else onAddTopic(item);
    setEditingTopic(null);
  };

  const handleDelete = () => {
      if (deleteType === 'translation') {
          if (deleteId) onDeleteTranslation(deleteId);
          if (currentIndex >= translations.length - 1 && translations.length > 1) setCurrentIndex(prev => prev - 1);
          else if (translations.length <= 1) setCurrentIndex(0);
      } else if (deleteType === 'topic') {
          if (deleteId) onDeleteTopic(deleteId);
          if (currentIndex >= currentList.length - 1 && currentList.length > 1) setCurrentIndex(prev => prev - 1);
          else if (currentList.length <= 1) setCurrentIndex(0);
      }
      setDeleteId(null);
      setDeleteType(null);
  };

  const handleNext = () => {
    if (currentIndex < currentList.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (!activeMode) {
    return (
      <div className="flex flex-col gap-4 mt-2">
         {/* Title Area */}
         <div className="flex items-center justify-between mb-2">
             <h3 className="text-[13px] font-sans tracking-[0.05em] text-text-secondary font-bold">Select a Practice Mode</h3>
             
             {/* Master Add Button for Dashboard */}
             <div className="relative">
                <button 
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-text-primary hover:bg-background hover:border-primary transition-all shadow-sm active:scale-95"
                >
                  <Icon name="plus" size="sm" />
                </button>
                {showAddMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)}></div>
                    <div className="absolute right-0 top-12 w-48 bg-surface border border-border shadow-md z-20 animate-in fade-in duration-100">
                      <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary border-b border-border bg-background">Add Content</div>
                      <button 
                        onClick={() => { setEditingTranslation(null); setShowAddTranslation(true); setShowAddMenu(false); }}
                        className="w-full text-left px-4 py-3 text-[13px] font-medium text-text-primary hover:bg-background flex items-center gap-2 border-b border-border transition-colors"
                      >
                         <Icon name="refresh-cw" size="sm" /> Translation
                      </button>
                      <button 
                        onClick={() => { setEditingTopic(null); setShowAddTopic(true); setShowAddMenu(false); }}
                        className="w-full text-left px-4 py-3 text-[13px] font-medium text-text-primary hover:bg-background flex items-center gap-2 border-b border-border transition-colors"
                      >
                         <Icon name="edit-3" size="sm" /> Topic Writing
                      </button>
                    </div>
                  </>
                )}
             </div>
         </div>

         {/* Mode Cards */}
         <div 
            onClick={() => setActiveMode('translation')}
            className="group bg-surface border border-border p-5 relative cursor-pointer active:scale-[0.98] transition-transform duration-200 hover:bg-background hover:border-text-secondary shadow-sm"
         >
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-background border border-border flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                     <Icon name="refresh-cw" size="md" />
                  </div>
                  <div>
                     <h4 className="text-lg font-serif text-text-primary leading-tight mb-1">Translation</h4>
                     <p className="text-xs font-sans text-text-secondary">Sentences & paragraphs</p>
                  </div>
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-background border border-border px-2 py-1">
                  {translations.length} items
               </span>
            </div>
         </div>

         <div 
            onClick={() => setActiveMode('job')}
            className="group bg-surface border border-border p-5 relative cursor-pointer active:scale-[0.98] transition-transform duration-200 hover:bg-background hover:border-text-secondary shadow-sm"
         >
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-background border border-border flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                     <Icon name="clipboard-list" size="md" />
                  </div>
                  <div>
                     <h4 className="text-lg font-serif text-text-primary leading-tight mb-1">Job Exam</h4>
                     <p className="text-xs font-sans text-text-secondary">Focus on grammar & context</p>
                  </div>
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-background border border-border px-2 py-1">
                  {jobTopics.length} items
               </span>
            </div>
         </div>

         <div 
            onClick={() => setActiveMode('ielts')}
            className="group bg-surface border border-border p-5 relative cursor-pointer active:scale-[0.98] transition-transform duration-200 hover:bg-background hover:border-text-secondary shadow-sm"
         >
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-background border border-border flex items-center justify-center text-primary shrink-0 transition-colors group-hover:bg-primary group-hover:text-white">
                     <Icon name="book-open" size="md" />
                  </div>
                  <div>
                     <h4 className="text-lg font-serif text-text-primary leading-tight mb-1">IELTS Topics</h4>
                     <p className="text-xs font-sans text-text-secondary">Essay and descriptive writing</p>
                  </div>
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-background border border-border px-2 py-1">
                  {ieltsTopics.length} items
               </span>
            </div>
         </div>

        {/* Modals outside mode view for root dashboard */}
        <AddTranslationSheet isOpen={showAddTranslation} onClose={() => setShowAddTranslation(false)} onSave={handleSaveTranslation} lessonId={lessonId} existingItem={editingTranslation} />
        <BulkTranslationImportSheet isOpen={showBulkTranslation} onClose={() => setShowBulkTranslation(false)} onImport={onBulkTranslation} lessonId={lessonId} />
        <AddTopicSheet isOpen={showAddTopic} onClose={() => setShowAddTopic(false)} onSave={handleSaveTopic} lessonId={lessonId} existingItem={editingTopic} />
        <BulkTopicImportSheet isOpen={showBulkTopic} onClose={() => setShowBulkTopic(false)} onImport={onBulkTopic} lessonId={lessonId} />
      </div>
    );
  }

  // Active Mode specific states and renders
  const currentTranslation = activeMode === 'translation' ? currentList[currentIndex] as TranslationItem : undefined;
  const currentTopic = activeMode !== 'translation' ? currentList[currentIndex] as PracticeTopic : undefined;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200 mt-2">
      {/* Active Mode Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
         <button 
            onClick={() => { setActiveMode(null); setCurrentIndex(0); }}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-xs font-bold uppercase tracking-widest p-2 -ml-2"
         >
            <Icon name="arrow-left" size="sm" /> Back
         </button>
         <h3 className="text-[13px] font-sans tracking-[0.1em] uppercase text-text-primary font-bold">
            {activeMode === 'translation' ? 'Translation' : activeMode === 'job' ? 'Job Exam' : 'IELTS Topics'}
         </h3>
         <div className="relative">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="text-[11px] font-bold text-primary hover:bg-surface border border-transparent hover:border-border px-3 py-1.5 transition-colors uppercase tracking-wider h-8 flex items-center"
            >
              <Icon name="plus" size="sm" className="mr-1.5" /> Add
            </button>

            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)}></div>
                <div className="absolute right-0 top-10 w-48 bg-surface border border-border shadow-md z-20 animate-in fade-in duration-100">
                  <button 
                    onClick={() => { 
                      if (activeMode === 'translation') {
                          setEditingTranslation(null); setShowAddTranslation(true);
                      } else {
                          setEditingTopic(null); setShowAddTopic(true);
                      }
                      setShowAddMenu(false); 
                    }}
                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-text-primary hover:bg-background flex items-center gap-2 border-b border-border"
                  >
                    <Icon name="edit-3" size="sm" /> Single {activeMode === 'translation' ? 'Translation' : 'Topic'}
                  </button>
                  <button 
                    onClick={() => {
                      activeMode === 'translation' ? setShowBulkTranslation(true) : setShowBulkTopic(true);
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-[13px] font-medium text-text-primary hover:bg-background flex items-center gap-2"
                  >
                    <Icon name="clipboard-list" size="sm" /> Bulk Import
                  </button>
                </div>
              </>
            )}
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeMode === 'translation' ? (
          currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-border border-dashed mt-4">
              <div className="w-12 h-12 bg-background border border-border flex items-center justify-center mb-4 text-text-secondary">
                <Icon name="refresh-cw" size="md" />
              </div>
              <p className="text-text-primary font-serif font-medium text-lg">No translations yet</p>
              <p className="text-text-secondary text-xs uppercase tracking-widest mt-2 font-sans font-bold">Tap + to add items</p>
            </div>
          ) : (
            <TranslationView 
              item={currentTranslation!}
              currentIndex={currentIndex}
              totalItems={currentList.length}
              onNext={handleNext}
              onPrev={handlePrev}
              onComplete={(id) => {
                  const item = translations.find(t => t.id === id);
                  if (item) onUpdateTranslation({ ...item, isCompleted: true });
              }}
              onEdit={(item) => { setEditingTranslation(item); setShowAddTranslation(true); }}
              onDelete={(id) => { setDeleteId(id); setDeleteType('translation'); }}
            />
          )
        ) : (
          currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-border border-dashed mt-4">
              <div className="w-12 h-12 bg-background border border-border flex items-center justify-center mb-4 text-text-secondary">
                <Icon name="edit-3" size="md" />
              </div>
              <p className="text-text-primary font-serif font-medium text-lg">No topics found</p>
              <p className="text-text-secondary text-xs uppercase tracking-widest mt-2 font-sans font-bold">Tap + to add items</p>
            </div>
          ) : (
            <TopicView 
              item={currentTopic!}
              currentIndex={currentIndex}
              totalItems={currentList.length}
              onNext={handleNext}
              onPrev={handlePrev}
              onComplete={(id) => {
                  const item = topics.find(t => t.id === id);
                  if (item) onUpdateTopic({ ...item, isCompleted: true });
              }}
              onEdit={(item) => { setEditingTopic(item); setShowAddTopic(true); }}
              onDelete={(id) => { setDeleteId(id); setDeleteType('topic'); }}
            />
          )
        )}
      </div>

      <AddTranslationSheet isOpen={showAddTranslation} onClose={() => setShowAddTranslation(false)} onSave={handleSaveTranslation} lessonId={lessonId} existingItem={editingTranslation} />
      <BulkTranslationImportSheet isOpen={showBulkTranslation} onClose={() => setShowBulkTranslation(false)} onImport={onBulkTranslation} lessonId={lessonId} />
      <AddTopicSheet isOpen={showAddTopic} onClose={() => setShowAddTopic(false)} onSave={handleSaveTopic} lessonId={lessonId} existingItem={editingTopic} />
      <BulkTopicImportSheet isOpen={showBulkTopic} onClose={() => setShowBulkTopic(false)} onImport={onBulkTopic} lessonId={lessonId} />

      {/* Modern Delete Modal matching theme */}
      <PremiumModal isOpen={!!deleteId} onClose={() => { setDeleteId(null); setDeleteType(null); }} title="Delete?" size="sm">
          <div className="space-y-4">
              <p className="text-[13px] font-sans text-text-secondary text-center">Are you sure you want to delete this {deleteType}?</p>
              <div className="flex gap-3 pt-2">
                  <PremiumButton variant="secondary" onClick={() => { setDeleteId(null); setDeleteType(null); }} className="flex-1">Cancel</PremiumButton>
                  <button onClick={handleDelete} className="flex-1 py-3 text-[12px] font-bold uppercase tracking-widest text-[#FFF] bg-error border border-error hover:bg-[#D32F2F] transition-colors">Delete</button>
              </div>
          </div>
      </PremiumModal>
    </div>
  );
};

export default PracticeSession;
