
import React, { useState, useEffect } from 'react';
import Icon from '../../../shared/components/Icon';
import { VocabWord } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (words: VocabWord[]) => void;
  lessonId: string;
}

const BulkVocabImportSheet: React.FC<Props> = ({ isOpen, onClose, onImport, lessonId }) => {
  const [text, setText] = useState('');
  const [parsedWords, setParsedWords] = useState<VocabWord[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const toast = useToast();

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
        toast.info("Clipboard খালি");
        return;
      }
      setText((prev) => prev + (prev ? '\n' : '') + clipboardText);
    } catch (e) {
      toast.error("Failed to read clipboard");
    }
  };

  const parseText = (inputText: string) => {
    if (!inputText.trim()) {
      setParsedWords([]);
      setSkippedCount(0);
      return;
    }

    // Split by separator line
    const blocks = inputText.split('---');
    const validWords: VocabWord[] = [];
    let skipped = 0;

    blocks.forEach(block => {
      if (!block.trim()) return;

      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      
      let word = '';
      let meaning = '';
      let type: any = 'Other';
      let v1, v1s, v2, v3, vIng;
      const examples: {bengali: string, english: string}[] = [];
      let synonyms = '';
      let pronunciation = '';

      lines.forEach(line => {
        if (line.startsWith('#')) {
            word = line.substring(1).trim();
        } else if (line.startsWith('@')) {
            meaning = line.substring(1).trim();
        } else if (line.startsWith('^')) {
            const rawType = line.substring(1).trim().toLowerCase();
            if (rawType.includes('verb')) type = 'Verb';
            else if (rawType.includes('noun')) type = 'Noun';
            else if (rawType.includes('adj')) type = 'Adjective';
            else if (rawType.includes('adv')) type = 'Adverb';
            else type = 'Other';
        } else if (line.startsWith('&')) {
            const forms = line.substring(1).split(',').map(f => f.trim());
            if (forms[0]) v1 = forms[0];
            if (forms[1]) v1s = forms[1];
            if (forms[2]) v2 = forms[2];
            if (forms[3]) v3 = forms[3];
            if (forms[4]) vIng = forms[4];
        } else if (line.startsWith('>')) {
            const raw = line.substring(1).trim();
            if (raw.includes('=')) {
                const parts = raw.split('=');
                examples.push({
                    bengali: parts[0].trim(),
                    english: parts.slice(1).join('=').trim()
                });
            } else {
                examples.push({
                    english: raw,
                    bengali: ''
                });
            }
        } else if (line.startsWith('~')) {
            synonyms = line.substring(1).trim();
        } else if (line.startsWith('$')) {
            pronunciation = line.substring(1).trim();
        }
      });

      if (word && meaning) {
          validWords.push({
            id: generateUUID(),
            lessonId,
            word,
            meaning,
            type,
            v1, v1s, v2, v3, vIng,
            examples,
            synonyms,
            pronunciation,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
      } else {
          // Only count as skipped if it looked like a block but missed mandatory fields
          if (lines.length > 0) skipped++;
      }
    });

    setParsedWords(validWords);
    setSkippedCount(skipped);
  };

  const handleImportAction = () => {
    if (parsedWords.length === 0) return;
    onImport(parsedWords);
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
            <p className="text-[12px] text-gray-400 mt-0.5">নির্দিষ্ট format এ লিখে একসাথে অনেক word add করুন</p>
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
                  <span className="font-bold text-[#6366F1]">#</span> <span>English Word (Required)</span>
                  <span className="font-bold text-[#6366F1]">@</span> <span>বাংলা Meaning (Required)</span>
                  <span className="font-bold text-[#6366F1]">^</span> <span>Type (Verb/Noun/Adj...)</span>
                  <span className="font-bold text-[#6366F1]">&</span> <span>Forms (V1, V1s, V2, V3, V-ing)</span>
                  <span className="font-bold text-[#6366F1]">{'>'}</span> <span>Example (বাংলা = English)</span>
                  <span className="font-bold text-[#6366F1]">~</span> <span>Synonyms</span>
                  <span className="font-bold text-[#6366F1]">$</span> <span>উচ্চারণ</span>
                  <span className="font-bold text-[#6366F1]">---</span> <span>Separator for next word</span>
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
              placeholder={`# play
@ খেলা
^ Verb
& play, plays, played, played, playing
> আমি খেলি। = I play.
~ perform, compete
$ প্লে
---
# book
@ বই
^ Noun
---`}
            />
          </div>

          {/* Preview Section */}
          {text.trim() && (
            <div className="space-y-3 animate-in fade-in">
              {parsedWords.length > 0 ? (
                <div className="text-[13px] font-bold text-[#059669]">
                  ✅ {parsedWords.length} টি word পাওয়া গেছে
                </div>
              ) : (
                <div className="text-[13px] font-bold text-[#EF4444]">
                  ❌ কোনো valid word পাওয়া যায়নি
                </div>
              )}

              {skippedCount > 0 && (
                <div className="text-[12px] text-[#F59E0B] font-medium">
                  ⚠️ {skippedCount} টি block skip হয়েছে (missing # or @)
                </div>
              )}

              {parsedWords.length > 0 && (
                <div className="bg-white border border-[#F3F4F6] rounded-[12px] p-3">
                  <ol className="list-decimal list-inside text-[13px] text-[#374151] space-y-1">
                    {parsedWords.slice(0, 5).map((w, idx) => (
                      <li key={idx} className="truncate font-medium">
                        <span className="font-bold">{w.word}</span> → {w.meaning}
                      </li>
                    ))}
                  </ol>
                  {parsedWords.length > 5 && (
                    <div className="text-[11px] text-gray-400 mt-2 pl-4">
                      +{parsedWords.length - 5} more...
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
            disabled={parsedWords.length === 0}
            className="w-full h-[48px] bg-[#6366F1] text-white font-bold rounded-[14px] disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
          >
            Import All ({parsedWords.length})
          </button>
        </div>

      </div>
    </>
  );
};

export default BulkVocabImportSheet;
