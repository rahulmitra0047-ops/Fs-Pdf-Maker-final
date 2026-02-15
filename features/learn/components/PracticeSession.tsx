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
  onUpdateTranslations: (items: TranslationItem[]) => void;
  onUpdateTopics: (items: PracticeTopic[]) => void;
}

const PracticeSession: React.FC<Props> = ({ 
  translations, topics, lessonId, onUpdateTranslations, onUpdateTopics 
}) => {
  const toast = useToast();
  const [subTab, setSubTab] = useState<'translation' | 'topic'>('translation');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  // Topic Filters
  const [showJob, setShowJob] = useState(true);
  const [showIelts, setShowIelts] = useState(true);
  
  // Sheet States
  const [showAddTranslation, setShowAddTranslation] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<TranslationItem | null>(null);
  
  const [showBulkTranslation, setShowBulkTranslation] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<PracticeTopic | null>(null);
  const [showBulkTopic, setShowBulkTopic] = useState(false);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'translation' | 'topic' | null>(null);

  // Filtered Topics
  const [filteredTopics, setFilteredTopics] = useState<PracticeTopic[]>([]);

  useEffect(() => {
      const filtered = topics.filter(t => {
          // Backward compatibility: assume type 'job' if missing
          const type = t.type || 'job';
          if (type === 'job' && showJob) return true;
          if (type === 'ielts' && showIelts) return true;
          return false;
      });
      setFilteredTopics(filtered);
      // Reset index if out of bounds
      if (currentIndex >= filtered.length && filtered.length > 0) {
          setCurrentIndex(0);
      }
  }, [topics, showJob, showIelts]);

  // Handlers for Translations
  const handleSaveTranslation = (item: TranslationItem) => {
    let updated;
    if (translations.some(t => t.id === item.id)) {
        updated = translations.map(t => t.id === item.id ? item : t);
        toast.success("Translation updated");
    } else {
        updated = [...translations, item];
        toast.success("Translation added");
    }
    onUpdateTranslations(updated);
    setEditingTranslation(null);
  };

  const handleBulkImportTranslation = (items: TranslationItem[]) => {
    onUpdateTranslations([...translations, ...items]);
    toast.success(`${items.length} translations imported`);
  };

  const handleTranslationComplete = (id: string) => {
    const updated = translations.map(t => t.id === id ? { ...t, isCompleted: true } : t);
    onUpdateTranslations(updated);
  };

  // Handlers for Topics
  const handleSaveTopic = (item: PracticeTopic) => {
    let updated;
    if (topics.some(t => t.id === item.id)) {
        updated = topics.map(t => t.id === item.id ? item : t);
        toast.success("Topic updated");
    } else {
        updated = [...topics, item];
        toast.success("Topic added");
    }
    onUpdateTopics(updated);
    setEditingTopic(null);
  };

  const handleBulkImportTopic = (items: PracticeTopic[]) => {
    onUpdateTopics([...topics, ...items]);
    toast.success(`${items.length} topics imported`);
  };

  const handleTopicComplete = (id: string) => {
    const updated = topics.map(t => t.id === id ? { ...t, isCompleted: true } : t);
    onUpdateTopics(updated);
  };

  // Generic Delete
  const handleDelete = () => {
      if (deleteType === 'translation') {
          const updated = translations.filter(t => t.id !== deleteId);
          onUpdateTranslations(updated);
          if (currentIndex >= updated.length && updated.length > 0) setCurrentIndex(updated.length - 1);
          else if (updated.length === 0) setCurrentIndex(0);
          toast.success("Translation deleted");
      } else if (deleteType === 'topic') {
          const updated = topics.filter(t => t.id !== deleteId);
          onUpdateTopics(updated);
          // filteredTopics effect will handle index reset if needed
          toast.success("Topic deleted");
      }
      setDeleteId(null);
      setDeleteType(null);
  };

  // Navigation Logic
  const handleNext = () => {
    const total = subTab === 'translation' ? translations.length : filteredTopics.length;
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Switch tab reset
  const switchTab = (tab: 'translation' | 'topic') => {
    setSubTab(tab);
    setCurrentIndex(0);
  };

  const currentTranslation = translations[currentIndex];
  const currentTopic = filteredTopics[currentIndex];

  return (
    <div className="flex flex-col h-full">
      {/* 1. Sub-tabs */}
      <div className="flex justify-center gap-2 py-3 mb-2">
        <button
          onClick={() => switchTab('translation')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
            subTab === 'translation' 
              ? 'bg-[#6366F1] text-white shadow-md' 
              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
          }`}
        >
          <Icon name="refresh-cw" size="sm" /> Translation
        </button>
        <button
          onClick={() => switchTab('topic')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
            subTab === 'topic' 
              ? 'bg-[#6366F1] text-white shadow-md' 
              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
          }`}
        >
          <Icon name="edit-3" size="sm" /> Topic Writing
        </button>
      </div>

      {/* 2. Top Bar (Add Button) */}
      <div className="flex justify-end mb-4 relative">
        <button 
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="text-[13px] font-bold text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1.5 bg-[#EEF2FF] px-3 py-1.5 rounded-[10px] transition-colors shadow-sm active:scale-95"
        >
          <Icon name="plus" size="sm" /> Add
        </button>

        {showAddMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)}></div>
            <div className="absolute right-0 top-10 w-48 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
              <button 
                onClick={() => { 
                  if (subTab === 'translation') {
                      setEditingTranslation(null);
                      setShowAddTranslation(true);
                  } else {
                      setEditingTopic(null);
                      setShowAddTopic(true);
                  }
                  setShowAddMenu(false); 
                }}
                className="w-full text-left px-4 py-3 text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50"
              >
                <Icon name="edit-3" size="sm" /> Single {subTab === 'translation' ? 'Translation' : 'Topic'}
              </button>
              <button 
                onClick={() => {
                  subTab === 'translation' ? setShowBulkTranslation(true) : setShowBulkTopic(true);
                  setShowAddMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Icon name="clipboard-list" size="sm" /> Bulk Import
              </button>
            </div>
          </>
        )}
      </div>

      {/* Topic Filters */}
      {subTab === 'topic' && (
          <div className="flex justify-center gap-2 mb-3">
              <button
                onClick={() => setShowJob(!showJob)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${showJob ? 'bg-[#6366F1] border-[#6366F1] text-white' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
              >
                  📋 Job Exam
              </button>
              <button
                onClick={() => setShowIelts(!showIelts)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${showIelts ? 'bg-[#6366F1] border-[#6366F1] text-white' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
              >
                  🌍 IELTS
              </button>
          </div>
      )}

      {/* 3. Content Area */}
      <div className="flex-1">
        {subTab === 'translation' ? (
          translations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <Icon name="refresh-cw" size="xl" />
              </div>
              <p className="text-gray-500 font-medium">No translations yet</p>
              <p className="text-gray-400 text-sm">Tap + to add your first translation</p>
            </div>
          ) : (
            <TranslationView 
              item={currentTranslation}
              currentIndex={currentIndex}
              totalItems={translations.length}
              onNext={handleNext}
              onPrev={handlePrev}
              onComplete={handleTranslationComplete}
              onEdit={(item) => { setEditingTranslation(item); setShowAddTranslation(true); }}
              onDelete={(id) => { setDeleteId(id); setDeleteType('translation'); }}
            />
          )
        ) : (
          filteredTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <Icon name="edit-3" size="xl" />
              </div>
              <p className="text-gray-500 font-medium">No topics found</p>
              <p className="text-gray-400 text-sm">Try changing filters or adding a topic</p>
            </div>
          ) : (
            <TopicView 
              item={currentTopic}
              currentIndex={currentIndex}
              totalItems={filteredTopics.length}
              onNext={handleNext}
              onPrev={handlePrev}
              onComplete={handleTopicComplete}
              onEdit={(item) => { setEditingTopic(item); setShowAddTopic(true); }}
              onDelete={(id) => { setDeleteId(id); setDeleteType('topic'); }}
            />
          )
        )}
      </div>

      {/* Modals */}
      <AddTranslationSheet 
        isOpen={showAddTranslation} 
        onClose={() => setShowAddTranslation(false)} 
        onSave={handleSaveTranslation} 
        lessonId={lessonId}
        existingItem={editingTranslation}
      />
      <BulkTranslationImportSheet isOpen={showBulkTranslation} onClose={() => setShowBulkTranslation(false)} onImport={handleBulkImportTranslation} lessonId={lessonId} />
      
      <AddTopicSheet 
        isOpen={showAddTopic} 
        onClose={() => setShowAddTopic(false)} 
        onSave={handleSaveTopic} 
        lessonId={lessonId}
        existingItem={editingTopic}
      />
      <BulkTopicImportSheet isOpen={showBulkTopic} onClose={() => setShowBulkTopic(false)} onImport={handleBulkImportTopic} lessonId={lessonId} />

      <PremiumModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete?" size="sm">
          <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                  Are you sure you want to delete this {deleteType}?
              </p>
              <div className="flex gap-3 pt-2">
                  <PremiumButton variant="ghost" onClick={() => setDeleteId(null)}>Cancel</PremiumButton>
                  <PremiumButton variant="danger" onClick={handleDelete}>Delete</PremiumButton>
              </div>
          </div>
      </PremiumModal>
    </div>
  );
};

export default PracticeSession;