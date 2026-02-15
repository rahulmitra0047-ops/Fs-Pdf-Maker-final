import React, { useState, useEffect } from 'react';
import PremiumInput from '../../../shared/components/PremiumInput';
import Icon from '../../../shared/components/Icon';
import { TranslationItem, TranslationHint } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: TranslationItem) => void;
  lessonId: string;
  existingItem?: TranslationItem | null;
}

const AddTranslationSheet: React.FC<Props> = ({ isOpen, onClose, onSave, lessonId, existingItem }) => {
  const [text, setText] = useState('');
  const [hints, setHints] = useState<TranslationHint[]>([]);
  const [showHints, setShowHints] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      if (existingItem) {
        setText(existingItem.bengaliText);
        setHints(existingItem.hints || []);
      } else {
        setText('');
        setHints([]);
        setShowHints(true);
      }
    }
  }, [isOpen, existingItem]);

  const handleSave = () => {
    if (!text.trim()) {
      toast.error("বাংলা paragraph লিখুন");
      return;
    }

    const validHints = hints.filter(h => h.bengaliWord.trim() && h.englishHint.trim());

    const newItem: TranslationItem = {
      id: existingItem?.id || generateUUID(),
      lessonId,
      bengaliText: text.trim(),
      hints: validHints,
      isCompleted: existingItem?.isCompleted || false,
      createdAt: existingItem?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(newItem);
    setText('');
    setHints([]);
    onClose();
  };

  const addHint = () => {
    setHints([...hints, { bengaliWord: '', englishHint: '' }]);
  };

  const updateHint = (index: number, field: keyof TranslationHint, value: string) => {
    const newHints = [...hints];
    newHints[index] = { ...newHints[index], [field]: value };
    setHints(newHints);
  };

  const removeHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[90] transition-opacity backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] z-[100] rounded-t-[24px] shadow-2xl h-[85vh] flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-white rounded-t-[24px]">
          <h2 className="text-[18px] font-bold text-[#111827]">{existingItem ? 'Edit Translation' : 'Add Translation'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#6B7280] transition-colors">
            <Icon name="x" size="sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
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

          {/* Hints Section */}
          <div className="border border-[#E5E7EB] rounded-[14px] overflow-hidden bg-white shadow-sm">
            <div 
              className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#F3F4F6] transition-colors bg-[#F9FAFB]"
              onClick={() => setShowHints(!showHints)}
            >
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span className="font-semibold text-[#374151] text-sm">Hints</span>
              </div>
              <div className={`text-[#9CA3AF] transition-transform duration-200 ${showHints ? 'rotate-180' : ''}`}>
                <Icon name="chevron-left" size="sm" className="-rotate-90" />
              </div>
            </div>
            
            {showHints && (
              <div className="p-4 border-t border-[#E5E7EB] animate-in fade-in slide-in-from-top-1 space-y-3">
                {hints.map((hint, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-[40%]">
                      <input 
                        value={hint.bengaliWord}
                        onChange={(e) => updateHint(index, 'bengaliWord', e.target.value)}
                        placeholder="বাংলা শব্দ"
                        className="w-full h-[36px] bg-white border border-[#E5E7EB] rounded-[8px] px-2 text-sm outline-none focus:border-[#6366F1]"
                      />
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="w-[45%]">
                      <input 
                        value={hint.englishHint}
                        onChange={(e) => updateHint(index, 'englishHint', e.target.value)}
                        placeholder="English"
                        className="w-full h-[36px] bg-white border border-[#E5E7EB] rounded-[8px] px-2 text-sm outline-none focus:border-[#6366F1]"
                      />
                    </div>
                    <button 
                      onClick={() => removeHint(index)}
                      className="w-[15%] flex justify-center text-red-400 hover:text-red-600"
                    >
                      <Icon name="x" size="sm" />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={addHint}
                  className="text-xs font-bold text-[#6366F1] hover:text-indigo-700 flex items-center gap-1 mt-1"
                >
                  <Icon name="plus" size="sm" /> Add Hint
                </button>
              </div>
            )}
          </div>
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

export default AddTranslationSheet;