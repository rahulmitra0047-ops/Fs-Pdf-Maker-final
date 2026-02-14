import React, { useState } from 'react';
import PremiumInput from '../../../shared/components/PremiumInput';
import Icon from '../../../shared/components/Icon';
import { TranslationItem } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: TranslationItem) => void;
  lessonId: string;
}

const AddTranslationSheet: React.FC<Props> = ({ isOpen, onClose, onSave, lessonId }) => {
  const [text, setText] = useState('');
  const toast = useToast();

  const handleSave = () => {
    if (!text.trim()) {
      toast.error("বাংলা paragraph লিখুন");
      return;
    }

    const newItem: TranslationItem = {
      id: generateUUID(),
      lessonId,
      bengaliText: text.trim(),
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onSave(newItem);
    setText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[90] transition-opacity backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] z-[100] rounded-t-[24px] shadow-2xl h-[50vh] flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-white rounded-t-[24px]">
          <h2 className="text-[18px] font-bold text-[#111827]">Add Translation</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#6B7280] transition-colors">
            <Icon name="x" size="sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#374151] mb-1.5 ml-1">বাংলা Paragraph <span className="text-red-500">*</span></label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="বাংলায় paragraph লিখুন..."
              rows={5}
              className="w-full bg-white border border-[#E5E7EB] rounded-[14px] px-4 py-3 text-base outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E5E7EB] bg-white pb-safe">
          <button 
            onClick={handleSave}
            className="w-full h-[48px] bg-[#6366F1] text-white font-bold rounded-[14px] active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
};

export default AddTranslationSheet;