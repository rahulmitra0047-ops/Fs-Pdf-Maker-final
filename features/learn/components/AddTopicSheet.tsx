import React, { useState, useEffect } from 'react';
import PremiumInput from '../../../shared/components/PremiumInput';
import Icon from '../../../shared/components/Icon';
import { PracticeTopic } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PracticeTopic) => void;
  lessonId: string;
  existingItem?: PracticeTopic | null;
}

const AddTopicSheet: React.FC<Props> = ({ isOpen, onClose, onSave, lessonId, existingItem }) => {
  const [title, setTitle] = useState('');
  const [instruction, setInstruction] = useState('');
  const [type, setType] = useState<'job' | 'ielts'>('job');
  const [ieltsTaskType, setIeltsTaskType] = useState<'task2' | 'task1_academic' | 'task1_general'>('task2');
  const [minWords, setMinWords] = useState<number>(0);
  
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
        if (existingItem) {
            setTitle(existingItem.title);
            setInstruction(existingItem.instruction || '');
            setType(existingItem.type || 'job');
            setIeltsTaskType(existingItem.ieltsTaskType || 'task2');
            setMinWords(existingItem.minWords || 0);
        } else {
            setTitle('');
            setInstruction('');
            setType('job');
            setIeltsTaskType('task2');
            setMinWords(0);
        }
    }
  }, [isOpen, existingItem]);

  // Auto-set min words based on task type
  useEffect(() => {
      if (!existingItem) { // Only auto-set for new items
          if (type === 'ielts') {
              if (ieltsTaskType === 'task2') setMinWords(250);
              else setMinWords(150);
          } else {
              setMinWords(0);
          }
      }
  }, [type, ieltsTaskType]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Topic title is required");
      return;
    }

    const newItem: PracticeTopic = {
      id: existingItem?.id || generateUUID(),
      lessonId,
      title: title.trim(),
      instruction: instruction.trim(),
      type,
      ieltsTaskType: type === 'ielts' ? ieltsTaskType : undefined,
      minWords: type === 'ielts' ? minWords : 0,
      isCompleted: existingItem?.isCompleted || false,
      createdAt: existingItem?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(newItem);
    setTitle('');
    setInstruction('');
    onClose();
  };

  const getTitlePlaceholder = () => {
      if (type === 'ielts') return "e.g. Agree or Disagree";
      return "e.g. My Daily Life";
  };

  const getInstructionPlaceholder = () => {
      if (type === 'ielts') {
          if (ieltsTaskType === 'task2') return "e.g. To what extent do you agree?";
          return "e.g. Summarize the information";
      }
      return "e.g. Write a paragraph in 200 words";
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[90] transition-opacity backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] z-[100] rounded-t-[24px] shadow-2xl h-[70vh] flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-white rounded-t-[24px]">
          <h2 className="text-[18px] font-bold text-[#111827]">{existingItem ? 'Edit Topic' : 'Add Topic'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#6B7280] transition-colors">
            <Icon name="x" size="sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          
          {/* Type Selector */}
          <div>
              <label className="block text-sm font-bold text-[#374151] mb-2">Type</label>
              <div className="flex gap-3">
                  <button 
                    onClick={() => setType('job')}
                    className={`flex-1 py-2 rounded-full text-sm font-bold transition-all border ${type === 'job' ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-md' : 'bg-white border-[#E5E7EB] text-[#6B7280]'}`}
                  >
                      📋 Job Exam
                  </button>
                  <button 
                    onClick={() => setType('ielts')}
                    className={`flex-1 py-2 rounded-full text-sm font-bold transition-all border ${type === 'ielts' ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-md' : 'bg-white border-[#E5E7EB] text-[#6B7280]'}`}
                  >
                      🌍 IELTS
                  </button>
              </div>
          </div>

          {/* IELTS Task Type */}
          {type === 'ielts' && (
              <div className="animate-in fade-in slide-in-from-top-1">
                  <label className="block text-sm font-bold text-[#374151] mb-2">Task Type</label>
                  <div className="flex flex-wrap gap-2">
                      {[
                          { id: 'task2', label: 'Task 2' },
                          { id: 'task1_academic', label: 'Task 1 Acad.' },
                          { id: 'task1_general', label: 'Task 1 Gen.' }
                      ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setIeltsTaskType(t.id as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${ieltsTaskType === t.id ? 'bg-white border-[#6366F1] text-[#6366F1]' : 'bg-[#F9FAFB] border-transparent text-[#9CA3AF]'}`}
                          >
                              {t.label}
                          </button>
                      ))}
                  </div>
              </div>
          )}

          <PremiumInput 
            label="Topic Title *" 
            placeholder={getTitlePlaceholder()}
            value={title}
            onChange={setTitle}
          />
          
          <div>
            <label className="block text-sm font-bold text-[#374151] mb-1.5 ml-1">Instruction (Optional)</label>
            <textarea 
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={getInstructionPlaceholder()}
              rows={3}
              className="w-full bg-white border border-[#E5E7EB] rounded-[14px] px-4 py-3 text-base outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 transition-all resize-none"
            />
          </div>

          {type === 'ielts' && (
              <div className="animate-in fade-in slide-in-from-top-1">
                  <PremiumInput 
                    label="Min Words Suggestion" 
                    placeholder="250"
                    type="number"
                    value={minWords.toString()}
                    onChange={(v) => setMinWords(parseInt(v) || 0)}
                  />
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E5E7EB] bg-white pb-safe">
          <button 
            onClick={handleSave}
            className="w-full h-[48px] bg-[#6366F1] text-white font-bold rounded-[14px] active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
          >
            {existingItem ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddTopicSheet;