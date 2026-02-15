import React, { useState } from 'react';
import Icon from '../../../shared/components/Icon';
import { TranslationItem, TranslationHint } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: TranslationItem[]) => void;
  lessonId: string;
}

const BulkTranslationImportSheet: React.FC<Props> = ({ isOpen, onClose, onImport, lessonId }) => {
  const [text, setText] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const toast = useToast();

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        toast.info("Clipboard is empty");
        return;
      }
      setText((prev) => prev + (prev ? '\n' : '') + clipboardText);
    } catch (e) {
      toast.error("Failed to read clipboard");
    }
  };

  const handleImport = () => {
    if (!text.trim()) return;

    const blocks = text.split('---');
    const items: TranslationItem[] = [];

    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return;

      const hints: TranslationHint[] = [];
      const textLines: string[] = [];

      lines.forEach(line => {
        if (line.startsWith('?')) {
          const parts = line.substring(1).split('=');
          if (parts.length >= 2) {
            hints.push({
              bengaliWord: parts[0].trim(),
              englishHint: parts.slice(1).join('=').trim()
            });
          }
        } else {
          textLines.push(line);
        }
      });

      const bengaliText = textLines.join(' ');

      if (bengaliText) {
        items.push({
          id: generateUUID(),
          lessonId,
          bengaliText: bengaliText,
          hints: hints,
          isCompleted: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
    });

    if (items.length > 0) {
      onImport(items);
      setText('');
      onClose();
    } else {
      toast.error("No valid translations found");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[90] transition-opacity backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] z-[100] rounded-t-[24px] shadow-2xl h-[70vh] flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-white rounded-t-[24px]">
          <div>
            <h2 className="text-[18px] font-bold text-[#111827]">📝 Bulk Import</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">--- দিয়ে আলাদা করে একসাথে অনেক translation add করুন</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#6B7280] transition-colors">
            <Icon name="x" size="sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-24">
          
          <div className="mb-4">
            <button 
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1 text-[13px] font-semibold text-[#6366F1] mb-2"
            >
              <span>📖 Format Guide</span>
              <span className={`transform transition-transform ${showGuide ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {showGuide && (
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-3 text-[12px] text-gray-500 font-mono space-y-1 animate-in fade-in slide-in-from-top-1">
                <p>আমি প্রতিদিন স্কুলে যাই...</p>
                <p className="text-gray-400">? প্রতিদিন = every day</p>
                <p className="text-gray-400">? যাই = go</p>
                <p className="font-bold text-[#6366F1]">---</p>
                <p>সে একজন ভালো ছেলে...</p>
                <p className="text-gray-400">? ভালো = good</p>
                <p className="font-bold text-[#6366F1]">---</p>
              </div>
            )}
          </div>

          <div className="relative mb-6">
            <div className="absolute top-[-36px] right-0">
              <button 
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#6366F1] text-[#6366F1] bg-white text-[12px] font-bold active:scale-95 transition-transform"
              >
                <Icon name="clipboard-list" size="sm" /> Paste
              </button>
            </div>
            
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-gray-50 border border-[#E5E7EB] rounded-[12px] p-4 text-[13px] leading-relaxed focus:outline-none focus:border-[#6366F1] focus:bg-white transition-colors min-h-[200px]"
              placeholder={`আমি প্রতিদিন স্কুলে যাই...
? প্রতিদিন = every day
? যাই = go
---
সে ভাত খায়...
? ভাত = rice
? খায় = eats
---`}
            />
          </div>

          {text.trim() && (
            <div className="text-[13px] font-bold text-[#059669]">
              ✅ {text.split('---').filter(t => t.trim()).length} টি translation পাওয়া গেছে
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E5E7EB] bg-white pb-safe">
          <button 
            onClick={handleImport}
            disabled={!text.trim()}
            className="w-full h-[48px] bg-[#6366F1] text-white font-bold rounded-[14px] disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
          >
            Import All
          </button>
        </div>
      </div>
    </>
  );
};

export default BulkTranslationImportSheet;