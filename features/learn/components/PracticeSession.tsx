import React, { useState } from 'react';
import { TranslationItem, PracticeTopic } from '../../../types';
import TranslationView from './TranslationView';
import TopicView from './TopicView';
import Icon from '../../../shared/components/Icon';
import AddTranslationSheet from './AddTranslationSheet';
import BulkTranslationImportSheet from './BulkTranslationImportSheet';
import AddTopicSheet from './AddTopicSheet';
import BulkTopicImportSheet from './BulkTopicImportSheet';

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
  const [subTab, setSubTab] = useState<'translation' | 'topic'>('translation');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  // Sheet States
  const [showAddTranslation, setShowAddTranslation] = useState(false);
  const [showBulkTranslation, setShowBulkTranslation] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showBulkTopic, setShowBulkTopic] = useState(false);

  // Handlers for Translations
  const handleAddTranslation = (item: TranslationItem) => {
    onUpdateTranslations([...translations, item]);
  };

  const handleBulkImportTranslation = (items: TranslationItem[]) => {
    onUpdateTranslations([...translations, ...items]);
  };

  const handleTranslationComplete = (id: string) => {
    const updated = translations.map(t => t.id === id ? { ...t, isCompleted: true } : t);
    onUpdateTranslations(updated);
  };

  // Handlers for Topics
  const handleAddTopic = (item: PracticeTopic) => {
    onUpdateTopics([...topics, item]);
  };

  const handleBulkImportTopic = (items: PracticeTopic[]) => {
    onUpdateTopics([...topics, ...items]);
  };

  const handleTopicComplete = (id: string) => {
    const updated = topics.map(t => t.id === id ? { ...t, isCompleted: true } : t);
    onUpdateTopics(updated);
  };

  // Navigation Logic
  const handleNext = () => {
    const total = subTab === 'translation' ? translations.length : topics.length;
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
  const currentTopic = topics[currentIndex];

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
                  subTab === 'translation' ? setShowAddTranslation(true) : setShowAddTopic(true); 
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
            />
          )
        ) : (
          topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <Icon name="edit-3" size="xl" />
              </div>
              <p className="text-gray-500 font-medium">No topics yet</p>
              <p className="text-gray-400 text-sm">Tap + to add your first topic</p>
            </div>
          ) : (
            <TopicView 
              item={currentTopic}
              currentIndex={currentIndex}
              totalItems={topics.length}
              onNext={handleNext}
              onPrev={handlePrev}
              onComplete={handleTopicComplete}
            />
          )
        )}
      </div>

      {/* Modals */}
      <AddTranslationSheet isOpen={showAddTranslation} onClose={() => setShowAddTranslation(false)} onSave={handleAddTranslation} lessonId={lessonId} />
      <BulkTranslationImportSheet isOpen={showBulkTranslation} onClose={() => setShowBulkTranslation(false)} onImport={handleBulkImportTranslation} lessonId={lessonId} />
      <AddTopicSheet isOpen={showAddTopic} onClose={() => setShowAddTopic(false)} onSave={handleAddTopic} lessonId={lessonId} />
      <BulkTopicImportSheet isOpen={showBulkTopic} onClose={() => setShowBulkTopic(false)} onImport={handleBulkImportTopic} lessonId={lessonId} />
    </div>
  );
};

export default PracticeSession;