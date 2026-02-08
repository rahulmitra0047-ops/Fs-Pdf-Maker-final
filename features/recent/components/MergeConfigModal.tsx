
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
        <div className="text-sm text-[var(--text-secondary)] mb-2">
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
                    className="flex items-center gap-3 p-3 bg-white border border-[var(--border)] rounded-lg shadow-sm cursor-move hover:border-[var(--primary)] transition-colors"
                >
                    <div className="text-gray-400 cursor-grab">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)] text-sm line-clamp-1">
                            {idx + 1}. {doc.title}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                            {doc.mcqs.length} MCQs
                        </div>
                    </div>
                    <button 
                        onClick={() => handleRemoveDoc(idx)}
                        className="text-gray-400 hover:text-red-500 p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ))}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-[var(--divider)]">
            <div className="text-sm font-medium">Total: {orderedDocs.reduce((acc, d) => acc + d.mcqs.length, 0)} MCQs</div>
            <PremiumButton 
                onClick={() => setStep(STEPS.OPTIONS)}
                disabled={orderedDocs.length < 2}
            >
                Next: Options
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
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Section Handling</label>
            <div className="space-y-2">
                {[
                    { val: 'use_doc_names', label: 'Use document names', desc: 'Document name becomes section header' },
                    { val: 'keep_original', label: 'Keep original titles', desc: 'Preserve internal section headers' },
                    { val: 'none', label: 'No sections', desc: 'Merge continuously without headers' }
                ].map(opt => (
                    <label key={opt.val} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                            type="radio" 
                            name="sectionHandling"
                            checked={config.sectionHandling === opt.val}
                            onChange={() => setConfig({ ...config, sectionHandling: opt.val as any })}
                            className="mt-1 w-4 h-4 text-[var(--primary)]"
                        />
                        <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{opt.desc}</div>
                        </div>
                    </label>
                ))}
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Duplicate Handling</label>
            <div className="space-y-2">
                {[
                    { val: 'remove_auto', label: 'Remove duplicates automatically', desc: 'Keep first occurrence' },
                    { val: 'keep_all', label: 'Keep all', desc: 'Allow duplicates' },
                    { val: 'ask', label: 'Ask for each duplicate', desc: 'Review manually' }
                ].map(opt => (
                    <label key={opt.val} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input 
                            type="radio" 
                            name="duplicateHandling"
                            checked={config.duplicateHandling === opt.val}
                            onChange={() => setConfig({ ...config, duplicateHandling: opt.val as any })}
                            className="mt-1 w-4 h-4 text-[var(--primary)]"
                        />
                        <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{opt.desc}</div>
                        </div>
                    </label>
                ))}
            </div>
        </div>

        <div className="flex justify-between pt-4 border-t border-[var(--divider)]">
            <PremiumButton variant="ghost" onClick={() => setStep(STEPS.ORDER)}>Back</PremiumButton>
            <PremiumButton onClick={prepareDuplicates}>
                {config.duplicateHandling === 'ask' ? 'Next: Review Duplicates' : 'Next: Preview'}
            </PremiumButton>
        </div>
    </div>
  );

  const renderDuplicatesStep = () => (
    <div className="space-y-4">
        <div className="bg-amber-50 p-3 rounded-lg flex items-center gap-2 border border-amber-200">
            <span className="text-amber-600">⚠️</span>
            <span className="text-sm text-amber-800 font-medium">{Array.from(duplicatesMap.keys()).length} duplicates found</span>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto space-y-4">
            {Array.from(duplicatesMap.entries()).map(([fp, list], idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="text-sm font-medium line-clamp-2">"{list[0].question}"</div>
                    <div className="text-xs text-[var(--text-secondary)]">Found in {list.length} places.</div>
                    <div className="flex gap-2">
                        <button 
                            className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                            onClick={() => {
                                // Keep first, remove others
                                const [first, ...rest] = list;
                                const newSet = new Set(idsToRemove);
                                rest.forEach(r => newSet.add(r.id));
                                setIdsToRemove(newSet);
                            }}
                        >
                            Keep First
                        </button>
                        <button 
                            className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                            onClick={() => {
                                // Keep last, remove others
                                const last = list[list.length - 1];
                                const rest = list.slice(0, list.length - 1);
                                const newSet = new Set(idsToRemove);
                                rest.forEach(r => newSet.add(r.id));
                                setIdsToRemove(newSet);
                            }}
                        >
                            Keep Last
                        </button>
                        <button 
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                            onClick={() => {
                                // Remove all
                                const newSet = new Set(idsToRemove);
                                list.forEach(r => newSet.add(r.id));
                                setIdsToRemove(newSet);
                            }}
                        >
                            Remove All
                        </button>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex justify-between pt-4 border-t border-[var(--divider)]">
            <PremiumButton variant="ghost" onClick={() => setStep(STEPS.OPTIONS)}>Back</PremiumButton>
            <PremiumButton onClick={preparePreview}>Continue to Preview</PremiumButton>
        </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
        {previewDoc && (
            <>
                <div className="bg-gray-50 p-4 rounded-lg border border-[var(--border)] text-center">
                    <div className="text-4xl mb-2">📖</div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{previewDoc.title}</h3>
                    <div className="text-sm text-[var(--text-secondary)] mt-1">
                        {previewDoc.mcqs?.length} MCQs • {previewDoc.mergedFrom?.length} Sections
                    </div>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Structure</h4>
                    {previewDoc.mergedFrom?.map((src, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-[var(--border)] rounded shadow-sm">
                            <div className="text-xl">
                                {config.sectionHandling !== 'none' ? '📂' : '📄'}
                            </div>
                            <div>
                                <div className="text-sm font-medium">{src.docTitle}</div>
                                <div className="text-xs text-[var(--text-secondary)]">
                                    Q {src.mcqRange[0]} - {src.mcqRange[1]} ({src.mcqCount} MCQs)
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-[var(--divider)]">
                    <PremiumButton variant="ghost" onClick={() => setStep(config.duplicateHandling === 'ask' ? STEPS.DUPLICATES : STEPS.OPTIONS)}>Back</PremiumButton>
                    <PremiumButton onClick={handleCreateMerged} className="bg-green-600 hover:bg-green-700">
                        ✓ Create Merged Doc
                    </PremiumButton>
                </div>
            </>
        )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-8">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Merge Complete!</h3>
        <p className="text-[var(--text-secondary)] mb-8">
            "{config.newTitle}" has been created successfully with {previewDoc?.mcqs?.length} MCQs.
        </p>
        <div className="flex gap-3 justify-center">
            <PremiumButton onClick={onClose} variant="secondary">Back to Recent</PremiumButton>
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
