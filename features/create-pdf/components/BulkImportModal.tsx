import React, { useState, useEffect } from 'react';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import Icon from '../../../shared/components/Icon';
import { parseFormatA, ParseResult } from '../../../core/parser/formatAParser';
import { MCQ } from '../../../types';
import { useToast } from '../../../shared/context/ToastContext';
import { findDuplicates } from '../../../core/dedupe/dedupeService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (mcqs: MCQ[]) => void;
  existingMCQs?: MCQ[];
  initialText?: string;
}

const BulkImportModal: React.FC<Props> = ({ isOpen, onClose, onImport, existingMCQs = [], initialText = '' }) => {
  const [text, setText] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  
  // Store duplicates found against existing DB items separately
  const [existingDupItems, setExistingDupItems] = useState<MCQ[]>([]);
  
  const toast = useToast();

  useEffect(() => {
      if (isOpen && initialText) {
          setText(initialText);
      } else if (!isOpen) {
          // Reset when closed, but not when just opening empty
          if(!initialText) setText('');
      }
  }, [isOpen, initialText]);

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
          throw new Error("Clipboard API not available");
      }
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
          setText(prev => prev + (prev ? '\n' : '') + clipboardText);
          toast.success("Pasted from clipboard");
      } else {
          toast.info("Clipboard is empty");
      }
    } catch (e: any) {
      console.error("Clipboard paste error:", e);
      if (e.name === 'NotAllowedError' || e.message?.includes('permissions policy')) {
          toast.error("Clipboard access blocked. Please use Ctrl+V to paste.");
      } else {
          toast.error("Could not paste automatically. Please use Ctrl+V.");
      }
    }
  };

  const handleParse = async () => {
    setIsParsing(true);
    // Simulate async for UI feedback if text is huge
    setTimeout(() => {
        const result = parseFormatA(text);
        
        let validItems = result.valid;
        let dupItems: MCQ[] = [];

        // Check against existing MCQs if provided
        if (existingMCQs.length > 0) {
            const check = findDuplicates(validItems, existingMCQs);
            validItems = check.unique;
            dupItems = check.duplicates.map(d => d.newMCQ);
        }

        setExistingDupItems(dupItems);
        
        // Update parse result with filtered valid items
        setParseResult({
            ...result,
            valid: validItems,
            summary: {
                ...result.summary,
                valid: validItems.length
            }
        });
        
        setIsParsing(false);
    }, 500);
  };

  const handleImport = () => {
    if (!parseResult) return;
    
    let finalMCQs = [...parseResult.valid];
    
    // If NOT skipping duplicates, we add back the ones we filtered out
    if (!skipDuplicates) {
        finalMCQs = [...finalMCQs, ...parseResult.duplicatesInBatch, ...existingDupItems];
    }

    onImport(finalMCQs);
    toast.success(`Imported ${finalMCQs.length} MCQs`);
    
    // Reset
    setText('');
    setParseResult(null);
    setExistingDupItems([]);
    onClose();
  };

  const totalDuplicates = (parseResult?.duplicatesInBatch.length || 0) + existingDupItems.length;

  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} title="Bulk Import" size="lg">
      <div className="space-y-5">
        
        {/* Input Area */}
        {!parseResult && (
          <div className="flex flex-col gap-4">
            {/* Format Toggle & Paste */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-[#6B7280]">Paste your questions below.</p>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePaste}
                        className="text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1 bg-[#EEF2FF] px-3 py-1.5 rounded-[10px] transition-colors"
                        title="Paste from clipboard"
                    >
                        <Icon name="clipboard-list" size="sm" /> Paste
                    </button>
                    <button 
                        onClick={() => setShowFormatGuide(!showFormatGuide)}
                        className="text-xs font-bold text-[#6366F1] hover:text-[#4F46E5] flex items-center gap-1 bg-[#EEF2FF] px-3 py-1.5 rounded-[10px] transition-colors"
                    >
                        <Icon name="info" size="sm" /> {showFormatGuide ? "Hide Format" : "Format Guide"}
                    </button>
                </div>
            </div>

            {/* Format Guide */}
            {showFormatGuide && (
                <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] p-4 text-xs text-[#374151] font-mono space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <div className="font-bold text-[#111827] mb-2 text-sm">Supported Format:</div>
                    <div className="opacity-80">1. Question text here?</div>
                    <div className="opacity-80">A) Option one B) Option two</div>
                    <div className="opacity-80">C) Option three D) Option four</div>
                    <div className="opacity-80 text-[#059669] font-bold">Answer: A</div>
                    <div className="opacity-80">Explanation: Optional text...</div>
                </div>
            )}

            <div className="relative group">
                <textarea
                  className="w-full h-80 p-5 bg-[#F9FAFB] border border-[#F3F4F6] rounded-[18px] font-mono text-[14px] leading-relaxed text-[#111827] focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] focus:bg-white outline-none resize-y shadow-inner transition-all placeholder:text-[#9CA3AF]"
                  placeholder={`1. What is the capital of France?
A) Berlin B) Madrid C) Paris D) Rome
Answer: C
Explanation: Paris is the capital.

2. Second question here...`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  spellCheck={false}
                />
                <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-[#9CA3AF] font-mono pointer-events-none border border-[#F3F4F6]">
                    {text.length} chars
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <PremiumButton 
                    onClick={handleParse} 
                    disabled={!text.trim() || isParsing}
                    loading={isParsing}
                    className="px-8 shadow-lg shadow-indigo-200"
                >
                    Preview Parse
                </PremiumButton>
            </div>
          </div>
        )}

        {/* Results Area */}
        {parseResult && (
          <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
             {/* Stats Grid */}
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 <div className="bg-[#F9FAFB] p-4 rounded-[18px] text-center border border-[#F3F4F6]">
                     <div className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Found</div>
                     <div className="text-2xl font-black text-[#374151]">{parseResult.summary.found}</div>
                 </div>
                 <div className="bg-[#ECFDF5] p-4 rounded-[18px] text-center border border-[#D1FAE5]">
                     <div className="text-[11px] font-bold text-[#059669] uppercase tracking-wider mb-1">Valid</div>
                     <div className="text-2xl font-black text-[#047857]">{parseResult.valid.length}</div>
                 </div>
                 <div className="bg-[#FEF2F2] p-4 rounded-[18px] text-center border border-[#FEE2E2]">
                     <div className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wider mb-1">Invalid</div>
                     <div className="text-2xl font-black text-[#B91C1C]">{parseResult.summary.invalid}</div>
                 </div>
                 <div className="bg-[#FFFBEB] p-4 rounded-[18px] text-center border border-[#FEF3C7]">
                     <div className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider mb-1">Duplicates</div>
                     <div className="text-2xl font-black text-[#B45309]">{totalDuplicates}</div>
                 </div>
             </div>

             {/* Invalid List */}
             {parseResult.invalid.length > 0 && (
                 <div className="border border-[#FEE2E2] bg-[#FEF2F2]/50 rounded-[18px] p-5 max-h-48 overflow-y-auto custom-scrollbar">
                     <h4 className="font-bold text-[#991B1B] mb-3 flex items-center gap-2 text-sm">
                         <Icon name="alert-triangle" size="sm" />
                         Issues Found ({parseResult.invalid.length})
                     </h4>
                     <div className="space-y-2">
                         {parseResult.invalid.map((inv, idx) => (
                             <div key={idx} className="text-sm bg-white p-3 rounded-[12px] border border-[#FECACA] shadow-sm flex gap-3 items-start">
                                 <span className="font-mono font-bold text-[#DC2626] text-xs bg-[#FEF2F2] px-2 py-1 rounded-[6px] border border-[#FCA5A5] whitespace-nowrap">Line {inv.lineNumber}</span>
                                 <span className="text-[#374151]">{inv.reason}</span>
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Duplicate Toggle */}
             {totalDuplicates > 0 && (
                 <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-[18px] p-4">
                     <label className="flex items-center gap-4 cursor-pointer">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                checked={skipDuplicates}
                                onChange={(e) => setSkipDuplicates(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="w-12 h-7 bg-[#E5E7EB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#F59E0B]"></div>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-[#111827]">Skip Duplicates</div>
                            <div className="text-xs text-[#6B7280] mt-0.5">
                                {skipDuplicates 
                                    ? `Ignoring ${totalDuplicates} duplicate questions` 
                                    : `Importing duplicates as new questions`}
                            </div>
                        </div>
                     </label>
                 </div>
             )}

             {/* Actions */}
             <div className="flex justify-between items-center pt-6 border-t border-[#F3F4F6]">
                 <button 
                    onClick={() => { setParseResult(null); setExistingDupItems([]); }}
                    className="text-sm font-semibold text-[#6B7280] hover:text-[#111827] flex items-center gap-1.5 px-3 py-2 rounded-[10px] hover:bg-[#F9FAFB] transition-colors"
                 >
                     <Icon name="arrow-left" size="sm" /> Edit Text
                 </button>
                 <PremiumButton 
                     onClick={handleImport}
                     disabled={parseResult.valid.length === 0 && (!skipDuplicates && totalDuplicates === 0)}
                     className="px-8 shadow-lg shadow-indigo-200"
                 >
                     Import {parseResult.valid.length + (!skipDuplicates ? totalDuplicates : 0)} Questions
                 </PremiumButton>
             </div>
          </div>
        )}
      </div>
    </PremiumModal>
  );
};

export default BulkImportModal;