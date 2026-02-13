
import React, { useState, useEffect } from 'react';
import PremiumButton from '../../../shared/components/PremiumButton';
import Icon from '../../../shared/components/Icon';
import { GrammarRule, GrammarExample } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rules: GrammarRule[]) => void;
  lessonId: string;
}

const BulkRuleImportSheet: React.FC<Props> = ({ isOpen, onClose, onImport, lessonId }) => {
  const [text, setText] = useState('');
  const [parsedRules, setParsedRules] = useState<GrammarRule[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const toast = useToast();

  // Debounce parsing logic
  useEffect(() => {
    const handler = setTimeout(() => {
      parseText(text);
    }, 500);

    return () => clearTimeout(handler);
  }, [text]);

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        toast.info("Clipboard is empty");
        return;
      }
      setText((prev) => prev + clipboardText);
    } catch (e) {
      toast.error("Failed to read clipboard");
    }
  };

  const parseText = (inputText: string) => {
    if (!inputText.trim()) {
      setParsedRules([]);
      setSkippedCount(0);
      return;
    }

    const blocks = inputText.split('---');
    const validRules: GrammarRule[] = [];
    let skipped = 0;

    blocks.forEach(block => {
      if (!block.trim()) return;

      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      
      let title = '';
      let explanation = '';
      let bengaliHint = '';
      let formulaAff = '';
      let formulaNeg = '';
      let formulaInt = '';
      const examples: GrammarExample[] = [];
      const tips: string[] = [];

      lines.forEach(line => {
        if (line.startsWith('#')) {
          title = line.substring(1).trim();
        } else if (line.startsWith('@')) {
          const exp = line.substring(1).trim();
          explanation = explanation ? `${explanation} ${exp}` : exp;
        } else if (line.startsWith('!')) {
          bengaliHint = line.substring(1).trim();
        } else if (line.startsWith('+')) {
          formulaAff = line.substring(1).trim();
        } else if (line.startsWith('-')) {
          formulaNeg = line.substring(1).trim();
        } else if (line.startsWith('?')) {
          formulaInt = line.substring(1).trim();
        } else if (line.startsWith('>')) {
          const raw = line.substring(1).trim();
          if (raw.includes('=')) {
            const parts = raw.split('=');
            examples.push({
              bengali: parts[0].trim(),
              english: parts.slice(1).join('=').trim(),
              type: 'affirmative'
            });
          } else {
            examples.push({
              english: raw,
              bengali: '',
              type: 'affirmative'
            });
          }
        } else if (line.startsWith('*')) {
          tips.push(line.substring(1).trim());
        }
      });

      if (title) {
        validRules.push({
          id: generateUUID(),
          lessonId,
          title,
          explanation,
          bengaliHint,
          formulaAffirmative: formulaAff,
          formulaNegative: formulaNeg,
          formulaInterrogative: formulaInt,
          examples,
          tips,
          isFavorite: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } else {
        skipped++;
      }
    });

    setParsedRules(validRules);
    setSkippedCount(skipped);
  };

  const handleImportAction = () => {
    if (parsedRules.length === 0) return;
    onImport(parsedRules);
    setText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[90] transition-opacity backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] z-[100] rounded-t-[24px] shadow-2xl h-[85vh] flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-white rounded-t-[24px]">
          <div>
            <h2 className="text-[18px] font-bold text-[#111827]">📝 Bulk Import</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Paste rules in specific format to add quickly</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#6B7280] transition-colors">
            <Icon name="x" size="sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-24">
          
          {/* Format Guide */}
          <div className="mb-4">
            <button 
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1 text-[13px] font-semibold text-[#6366F1] mb-2"
            >
              <span>📖 Format Guide</span>
              <span className={`transform transition-transform ${showGuide ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {showGuide && (
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-3 text-[11px] text-gray-500 font-mono space-y-1 animate-in fade-in slide-in-from-top-1">
                <div className="grid grid-cols-[30px_1fr] gap-2">
                  <span className="font-bold text-[#6366F1]">#</span> <span>Rule Title (Required)</span>
                  <span className="font-bold text-[#6366F1]">@</span> <span>Explanation</span>
                  <span className="font-bold text-[#6366F1]">!</span> <span>Bengali Hint</span>
                  <span className="font-bold text-[#6366F1]">+</span> <span>Affirmative Formula</span>
                  <span className="font-bold text-[#6366F1]">-</span> <span>Negative Formula</span>
                  <span className="font-bold text-[#6366F1]">?</span> <span>Interrogative Formula</span>
                  <span className="font-bold text-[#6366F1]">{'>'}</span> <span>Example (Bengali = English)</span>
                  <span className="font-bold text-[#6366F1]">*</span> <span>Tip</span>
                  <span className="font-bold text-[#6366F1]">---</span> <span>Separator for next rule</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
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
              className="w-full bg-gray-50 border border-[#E5E7EB] rounded-[12px] p-4 text-[13px] font-mono leading-relaxed focus:outline-none focus:border-[#6366F1] focus:bg-white transition-colors min-h-[200px]"
              placeholder={`# Present Indefinite Tense
@ বাংলায় করি/করে বললে...
! প্রতিদিন থাকলে
+ S + V1(s/es) + O
> আমি খেলি। = I play.
---`}
            />
          </div>

          {/* Preview Section */}
          {text.trim() && (
            <div className="space-y-3 animate-in fade-in">
              {parsedRules.length > 0 ? (
                <div className="text-[13px] font-bold text-[#059669]">
                  ✅ {parsedRules.length} rules found
                </div>
              ) : (
                <div className="text-[13px] font-bold text-[#EF4444]">
                  ❌ No valid rules found
                </div>
              )}

              {skippedCount > 0 && (
                <div className="text-[12px] text-[#F59E0B] font-medium">
                  ⚠️ {skippedCount} skipped (missing title #)
                </div>
              )}

              {parsedRules.length > 0 && (
                <div className="bg-white border border-[#F3F4F6] rounded-[12px] p-3">
                  <ol className="list-decimal list-inside text-[13px] text-[#374151] space-y-1">
                    {parsedRules.slice(0, 5).map((rule, idx) => (
                      <li key={idx} className="truncate font-medium">{rule.title}</li>
                    ))}
                  </ol>
                  {parsedRules.length > 5 && (
                    <div className="text-[11px] text-gray-400 mt-2 pl-4">
                      +{parsedRules.length - 5} more...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Button */}
        <div className="p-5 border-t border-[#E5E7EB] bg-white pb-safe">
          <button 
            onClick={handleImportAction}
            disabled={parsedRules.length === 0}
            className="w-full h-[44px] bg-[#6366F1] text-white font-bold rounded-[12px] disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Import All ({parsedRules.length})
          </button>
        </div>

      </div>
    </>
  );
};

export default BulkRuleImportSheet;
