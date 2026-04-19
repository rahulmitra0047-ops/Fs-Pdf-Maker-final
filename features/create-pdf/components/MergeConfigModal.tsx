
import React, { useState, useEffect } from 'react';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import PremiumInput from '../../../shared/components/PremiumInput';
import { Document, MCQ } from '../../../types';
import { MergeConfig, detectDuplicates, mergeDocuments } from '../utils/mergeUtils';
import { documentService } from '../../../core/storage/services';
import { generateSerialId } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDocs: Document[];
  onSuccess: () => void;
}

const STEPS = {
  ORDER: 0,
  OPTIONS: 1,
  DUPLICATES: 2,
  PREVIEW: 3,
  SUCCESS: 4
};

const MergeConfigModal: React.FC<Props> = ({ isOpen, onClose, selectedDocs, onSuccess }) => {
  const toast = useToast();
  const [step, setStep] = useState(STEPS.ORDER);
  const [orderedDocs, setOrderedDocs] = useState<Document[]>([]);
  const [config, setConfig] = useState<MergeConfig>({
    newTitle: '',
    sectionHandling: 'use_doc_names',
    numbering: 'continuous',
    duplicateHandling: 'remove_auto'
  });
  
  // Duplicate Resolution State
  const [duplicatesMap, setDuplicatesMap] = useState<Map<string, MCQ[]>>(new Map());
  const [idsToRemove, setIdsToRemove] = useState<Set<string>>(new Set());
  
  // Merged Result for Preview
  const [previewDoc, setPreviewDoc] = useState<Partial<Document> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOrderedDocs([...selectedDocs]);
      setStep(STEPS.ORDER);
      setConfig(prev => ({ ...prev, newTitle: `${selectedDocs[0]?.title || 'Merged'} Complete Book` }));
      setIdsToRemove(new Set());
      setPreviewDoc(null);
    }
  }, [isOpen, selectedDocs]);

  // --- Handlers ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (isNaN(sourceIndex)) return;

    const newOrder = [...orderedDocs];
    const [moved] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    setOrderedDocs(newOrder);
  };

  const handleRemoveDoc = (index: number) => {
    const newOrder = [...orderedDocs];
    newOrder.splice(index, 1);
    setOrderedDocs(newOrder);
    if (newOrder.length < 2) {
        toast.info("Minimum 2 documents required to merge");
    }
  };

  const prepareDuplicates = () => {
    if (config.duplicateHandling === 'ask') {
        const detected = detectDuplicates(orderedDocs);
        if (detected.size > 0) {
            setDuplicatesMap(detected);
            setStep(STEPS.DUPLICATES);
            return;
        }
    }
    preparePreview();
  };

  const preparePreview = () => {
    const merged = mergeDocuments(orderedDocs, config, idsToRemove);
    setPreviewDoc(merged);
    setStep(STEPS.PREVIEW);
  };

  const handleCreateMerged = async () => {
    if (!previewDoc) return;
    
    try {
        const newId = await generateSerialId();
        const finalDoc: Document = {
            ...previewDoc as Document,
            id: newId,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        await documentService.create(finalDoc);
        setStep(STEPS.SUCCESS);
        onSuccess();
    } catch (e) {
        console.error(e);
        toast.error("Failed to create merged document");
    }
  };

  // --- Render Steps ---

  const renderOrderStep = () => (
    <div className="space-y-4">
        <div className="text-sm text-secondary mb-2 font-serif">
            Drag to reorder or remove documents from merge.
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {orderedDocs.map((doc, idx) => (
                <div 
                    key={doc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className="flex items-center gap-3 p-3 bg-surface border border-border cursor-move hover:border-primary/50 transition-colors"
                >
                    <div className="text-secondary cursor-grab">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </div>
                    <div className="flex-1">
                        <div className="font-serif font-medium text-text-primary text-[15px] line-clamp-1">
                            {idx + 1}. {doc.title}
                        </div>
                        <div className="text-xs text-secondary font-sans tracking-wide uppercase mt-0.5">
                            {doc.mcqs.length} MCQs
                        </div>
                    </div>
                    <button 
                        onClick={() => handleRemoveDoc(idx)}
                        className="text-secondary hover:text-primary transition-colors p-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ))}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
            <div className="text-sm font-sans tracking-wide text-text-primary">TOTAL: {orderedDocs.reduce((acc, d) => acc + d.mcqs.length, 0)} MCQS</div>
            <PremiumButton 
                onClick={() => setStep(STEPS.OPTIONS)}
                disabled={orderedDocs.length < 2}
            >
                NEXT: OPTIONS
            </PremiumButton>
        </div>
    </div>
  );

  const renderOptionsStep = () => (
    <div className="space-y-5">
        <PremiumInput 
            label="New Document Name"
            value={config.newTitle}
            onChange={(v) => setConfig({ ...config, newTitle: v })}
        />

        <div>
            <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-text-primary mb-2">Section Handling</label>
            <div className="space-y-2">
                {[
                    { val: 'use_doc_names', label: 'Use document names', desc: 'Document name becomes section header' },
                    { val: 'keep_original', label: 'Keep original titles', desc: 'Preserve internal section headers' },
                    { val: 'none', label: 'No sections', desc: 'Merge continuously without headers' }
                ].map(opt => (
                    <label key={opt.val} className="flex items-start gap-3 p-3 border border-border cursor-pointer hover:bg-black/5 transition-colors">
                        <input 
                            type="radio" 
                            name="sectionHandling"
                            checked={config.sectionHandling === opt.val}
                            onChange={() => setConfig({ ...config, sectionHandling: opt.val as any })}
                            className="mt-1 w-4 h-4 text-primary bg-background border-border focus:ring-primary focus:ring-offset-0"
                        />
                        <div>
                            <div className="text-[15px] font-serif text-text-primary">{opt.label}</div>
                            <div className="text-xs text-secondary font-serif mt-0.5">{opt.desc}</div>
                        </div>
                    </label>
                ))}
            </div>
        </div>

        <div>
            <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-text-primary mb-2 mt-4">Duplicate Handling</label>
            <div className="space-y-2">
                {[
                    { val: 'remove_auto', label: 'Remove duplicates automatically', desc: 'Keep first occurrence' },
                    { val: 'keep_all', label: 'Keep all', desc: 'Allow duplicates' },
                    { val: 'ask', label: 'Ask for each duplicate', desc: 'Review manually' }
                ].map(opt => (
                    <label key={opt.val} className="flex items-start gap-3 p-3 border border-border cursor-pointer hover:bg-black/5 transition-colors">
                        <input 
                            type="radio" 
                            name="duplicateHandling"
                            checked={config.duplicateHandling === opt.val}
                            onChange={() => setConfig({ ...config, duplicateHandling: opt.val as any })}
                            className="mt-1 w-4 h-4 text-primary bg-background border-border focus:ring-primary focus:ring-offset-0"
                        />
                        <div>
                            <div className="text-[15px] font-serif text-text-primary">{opt.label}</div>
                            <div className="text-xs text-secondary font-serif mt-0.5">{opt.desc}</div>
                        </div>
                    </label>
                ))}
            </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-border mt-6">
            <PremiumButton variant="ghost" onClick={() => setStep(STEPS.ORDER)}>BACK</PremiumButton>
            <PremiumButton onClick={prepareDuplicates}>
                {config.duplicateHandling === 'ask' ? 'NEXT: REVIEW DUPLICATES' : 'NEXT: PREVIEW'}
            </PremiumButton>
        </div>
    </div>
  );

  const renderDuplicatesStep = () => (
    <div className="space-y-4">
        <div className="bg-[#F0EDE5] p-3 border border-border flex items-center gap-2">
            <span className="text-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </span>
            <span className="text-sm text-text-primary font-serif font-medium">{Array.from(duplicatesMap.keys()).length} DUPLICATES FOUND</span>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto space-y-4">
            {Array.from(duplicatesMap.entries()).map(([fp, list], idx) => (
                <div key={idx} className="border border-border p-4 space-y-3 bg-surface">
                    <div className="font-serif text-[15px] text-text-primary leading-relaxed">"{list[0].question}"</div>
                    <div className="text-xs text-secondary font-sans tracking-wide uppercase">Found in {list.length} places</div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                        <button 
                            className="text-xs font-sans tracking-wide uppercase px-3 py-1.5 bg-background border border-border text-text-primary hover:bg-[#EBE7DF] transition-colors"
                            onClick={() => {
                                // Keep first, remove others
                                const [first, ...rest] = list;
                                const newSet = new Set(idsToRemove);
                                rest.forEach(r => newSet.add(r.id));
                                setIdsToRemove(newSet);
                            }}
                        >
                            KEEP FIRST
                        </button>
                        <button 
                            className="text-xs font-sans tracking-wide uppercase px-3 py-1.5 bg-background border border-border text-text-primary hover:bg-[#EBE7DF] transition-colors"
                            onClick={() => {
                                // Keep last, remove others
                                const last = list[list.length - 1];
                                const rest = list.slice(0, list.length - 1);
                                const newSet = new Set(idsToRemove);
                                rest.forEach(r => newSet.add(r.id));
                                setIdsToRemove(newSet);
                            }}
                        >
                            KEEP LAST
                        </button>
                        <button 
                            className="text-xs font-sans tracking-wide uppercase px-3 py-1.5 bg-background border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => {
                                // Remove all
                                const newSet = new Set(idsToRemove);
                                list.forEach(r => newSet.add(r.id));
                                setIdsToRemove(newSet);
                            }}
                        >
                            REMOVE ALL
                        </button>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex justify-between pt-4 border-t border-border mt-6">
            <PremiumButton variant="ghost" onClick={() => setStep(STEPS.OPTIONS)}>BACK</PremiumButton>
            <PremiumButton onClick={preparePreview}>CONTINUE TO PREVIEW</PremiumButton>
        </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
        {previewDoc && (
            <>
                <div className="bg-surface p-6 border border-border text-center">
                    <div className="text-3xl mb-3 text-primary">
                        <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </div>
                    <h3 className="text-xl font-serif font-medium text-text-primary tracking-tight">{previewDoc.title}</h3>
                    <div className="text-xs text-secondary font-sans uppercase tracking-widest mt-2">
                        {previewDoc.mcqs?.length} MCQs • {previewDoc.mergedFrom?.length} Sections
                    </div>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    <h4 className="text-[10px] font-sans font-bold text-secondary uppercase tracking-widest mb-3 mt-4">Document Structure</h4>
                    {previewDoc.mergedFrom?.map((src, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-border">
                            <div className="text-secondary">
                                {config.sectionHandling !== 'none' ? 
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> : 
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                }
                            </div>
                            <div>
                                <div className="text-[15px] font-serif text-text-primary line-clamp-1">{src.docTitle}</div>
                                <div className="text-xs text-secondary font-sans uppercase tracking-wide mt-0.5">
                                    Q{src.mcqRange[0]} - {src.mcqRange[1]} ({src.mcqCount} items)
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-border mt-6">
                    <PremiumButton variant="ghost" onClick={() => setStep(config.duplicateHandling === 'ask' ? STEPS.DUPLICATES : STEPS.OPTIONS)}>BACK</PremiumButton>
                    <PremiumButton onClick={handleCreateMerged}>
                        ✓ CREATE MERGED DOC
                    </PremiumButton>
                </div>
            </>
        )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-10">
        <div className="text-primary mb-6 flex justify-center">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-2xl font-serif font-medium text-text-primary tracking-tight mb-3">Merge Complete</h3>
        <p className="text-secondary font-serif text-[15px] mb-10 max-w-sm mx-auto leading-relaxed">
            "{config.newTitle}" has been organized successfully with {previewDoc?.mcqs?.length} MCQs.
        </p>
        <div className="flex gap-3 justify-center">
            <PremiumButton onClick={onClose} variant="secondary">BACK TO RECENT</PremiumButton>
        </div>
    </div>
  );

  return (
    <PremiumModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={step === STEPS.SUCCESS ? "Success" : step === STEPS.PREVIEW ? "Merge Preview" : "Configure Merge"} 
        size="md"
    >
        {step === STEPS.ORDER && renderOrderStep()}
        {step === STEPS.OPTIONS && renderOptionsStep()}
        {step === STEPS.DUPLICATES && renderDuplicatesStep()}
        {step === STEPS.PREVIEW && renderPreviewStep()}
        {step === STEPS.SUCCESS && renderSuccessStep()}
    </PremiumModal>
  );
};

export default MergeConfigModal;
