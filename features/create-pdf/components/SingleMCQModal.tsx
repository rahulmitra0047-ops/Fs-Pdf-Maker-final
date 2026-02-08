
import React, { useState, useEffect } from 'react';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import Icon from '../../../shared/components/Icon';
import { MCQ } from '../../../types';
import { generateFingerprint } from '../../../core/dedupe/dedupeService';
import { APP_CONFIG } from '../../../core/config/appConfig';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mcq: MCQ) => void;
  onDelete?: (id: string) => void;
  initialMCQ?: MCQ | null;
  existingMCQs?: MCQ[];
}

const SingleMCQModal: React.FC<Props> = ({ isOpen, onClose, onSave, onDelete, initialMCQ, existingMCQs = [] }) => {
  const [formData, setFormData] = useState<Partial<MCQ>>({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    answer: 'A',
    explanation: '',
    source: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialMCQ) {
        setFormData(initialMCQ);
      } else {
        setFormData({
            question: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            answer: 'A',
            explanation: '',
            source: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, initialMCQ]);

  const handleChange = (field: keyof MCQ, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
        setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const { minQuestionLength } = APP_CONFIG.validation;

    if (!formData.question || formData.question.length < minQuestionLength) newErrors.question = "Required";
    if (!formData.optionA) newErrors.optionA = "Req";
    if (!formData.optionB) newErrors.optionB = "Req";
    if (!formData.optionC) newErrors.optionC = "Req";
    if (!formData.optionD) newErrors.optionD = "Req";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    const finalMCQ: MCQ = {
        id: formData.id || crypto.randomUUID(),
        question: formData.question!,
        optionA: formData.optionA!,
        optionB: formData.optionB!,
        optionC: formData.optionC!,
        optionD: formData.optionD!,
        answer: formData.answer as 'A'|'B'|'C'|'D',
        explanation: formData.explanation,
        source: formData.source,
        fingerprint: ''
    };
    finalMCQ.fingerprint = generateFingerprint(finalMCQ);
    
    onSave(finalMCQ);
    onClose();
  };

  const handleDelete = () => {
      // Fix: Ensure we pass the ID correctly to the parent's onDelete
      if (initialMCQ?.id && onDelete) {
          if (confirm("Delete this MCQ?")) {
              onDelete(initialMCQ.id);
              onClose();
          }
      }
  };

  if (!isOpen) return null;

  return (
    // Compact Modal Container
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-[400px] bg-white rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#F3F4F6]">
                <h3 className="text-[16px] font-bold text-[#111827]">{initialMCQ ? "Edit MCQ" : "Add MCQ"}</h3>
                <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]"><Icon name="x" size="sm" /></button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4">
                {/* Question */}
                <div>
                    <label className="text-[12px] font-bold text-[#374151] mb-1.5 block">Question</label>
                    <textarea
                        className={`w-full p-3 text-[14px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[12px] focus:outline-none focus:border-[#6366F1] resize-none ${errors.question ? 'border-red-300' : ''}`}
                        placeholder="Type question..."
                        rows={3}
                        value={formData.question}
                        onChange={(e) => handleChange('question', e.target.value)}
                    />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-2.5">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt} className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-[#9CA3AF] w-4">{opt}</span>
                            <input
                                className={`flex-1 p-2 text-[13px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[10px] focus:outline-none focus:border-[#6366F1] ${errors[`option${opt}`] ? 'border-red-300' : ''}`}
                                placeholder={`Option ${opt}`}
                                value={formData[`option${opt}` as keyof MCQ] as string}
                                onChange={(e) => handleChange(`option${opt}` as any, e.target.value)}
                            />
                            <button
                                onClick={() => handleChange('answer', opt)}
                                className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${formData.answer === opt ? 'bg-[#6366F1] text-white' : 'bg-[#F3F4F6] text-[#D1D5DB] hover:bg-[#E5E7EB]'}`}
                            >
                                <Icon name="check" size="sm" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Extra Fields */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[11px] font-bold text-[#9CA3AF] mb-1 block">Explanation</label>
                        <input
                            className="w-full p-2 text-[13px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[10px]"
                            placeholder="Optional"
                            value={formData.explanation}
                            onChange={(e) => handleChange('explanation', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-[#9CA3AF] mb-1 block">Tag/Source</label>
                        <input
                            className="w-full p-2 text-[13px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[10px]"
                            placeholder="e.g. 2023"
                            value={formData.source}
                            onChange={(e) => handleChange('source', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#F3F4F6] flex justify-between items-center bg-white">
                {/* Delete Button (Only in Edit Mode) */}
                {initialMCQ ? (
                    <button 
                        onClick={handleDelete}
                        className="text-red-500 p-2 hover:bg-red-50 rounded-[10px] transition-colors"
                        title="Delete MCQ"
                    >
                        <Icon name="trash-2" size="sm" />
                    </button>
                ) : <div />}

                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-[12px] border border-[#E5E7EB] text-[#374151] text-[13px] font-medium hover:bg-[#F9FAFB]"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        className="px-6 py-2 rounded-[12px] bg-[#6366F1] text-white text-[13px] font-medium hover:bg-[#4F46E5] shadow-lg shadow-indigo-200"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SingleMCQModal;
