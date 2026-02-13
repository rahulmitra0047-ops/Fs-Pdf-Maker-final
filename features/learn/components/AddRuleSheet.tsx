
import React, { useState, useEffect } from 'react';
import PremiumInput from '../../../shared/components/PremiumInput';
import Icon from '../../../shared/components/Icon';
import { GrammarRule, GrammarExample } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: GrammarRule) => void;
  existingRule?: GrammarRule | null;
  lessonId: string;
}

const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  headerClass?: string;
}> = ({ title, icon, defaultOpen = false, children, headerClass = "bg-[#F9FAFB]" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#E5E7EB] rounded-[14px] overflow-hidden mb-3 bg-white shadow-sm">
      <div 
        className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#F3F4F6] transition-colors ${headerClass}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-[#6B7280]">{icon}</div>}
          <span className="font-semibold text-[#374151] text-sm">{title}</span>
        </div>
        <div className={`text-[#9CA3AF] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <Icon name="chevron-left" size="sm" className="-rotate-90" />
        </div>
      </div>
      {isOpen && <div className="p-4 border-t border-[#E5E7EB] animate-in fade-in slide-in-from-top-1">{children}</div>}
    </div>
  );
};

const AddRuleSheet: React.FC<Props> = ({ isOpen, onClose, onSave, existingRule, lessonId }) => {
  // Fields
  const [title, setTitle] = useState('');
  const [explanation, setExplanation] = useState('');
  const [bengaliHint, setBengaliHint] = useState('');
  
  // Formulas
  const [formulaAff, setFormulaAff] = useState('');
  const [formulaNeg, setFormulaNeg] = useState('');
  const [formulaInt, setFormulaInt] = useState('');
  
  // Arrays
  const [examples, setExamples] = useState<GrammarExample[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [newTip, setNewTip] = useState('');

  // Init
  useEffect(() => {
    if (isOpen) {
      if (existingRule) {
        setTitle(existingRule.title);
        setExplanation(existingRule.explanation);
        setBengaliHint(existingRule.bengaliHint || existingRule.bnHint || '');
        setFormulaAff(existingRule.formulaAffirmative || existingRule.pattern || '');
        setFormulaNeg(existingRule.formulaNegative || '');
        setFormulaInt(existingRule.formulaInterrogative || '');
        setExamples(existingRule.examples && existingRule.examples.length > 0 
            ? existingRule.examples 
            : [{ english: '', bengali: '', type: 'affirmative' }]);
        setTips(existingRule.tips || []);
      } else {
        resetForm();
      }
    }
  }, [isOpen, existingRule]);

  const resetForm = () => {
    setTitle('');
    setExplanation('');
    setBengaliHint('');
    setFormulaAff('');
    setFormulaNeg('');
    setFormulaInt('');
    setExamples([{ english: '', bengali: '', type: 'affirmative' }]);
    setTips([]);
    setNewTip('');
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const rule: GrammarRule = {
      id: existingRule?.id || generateUUID(),
      lessonId,
      title,
      explanation,
      bengaliHint,
      formulaAffirmative: formulaAff,
      formulaNegative: formulaNeg,
      formulaInterrogative: formulaInt,
      examples: examples.filter(ex => ex.english.trim() || ex.bengali.trim()),
      tips: tips.filter(t => t.trim()),
      isFavorite: existingRule?.isFavorite || false,
      createdAt: existingRule?.createdAt || Date.now(),
      updatedAt: Date.now(),
      // Preserve existing fields if they exist, or default for compatibility
      category: existingRule?.category || 'General',
      difficulty: existingRule?.difficulty || 'Beginner',
      commonMistakes: existingRule?.commonMistakes || [],
      signalWords: existingRule?.signalWords || []
    };

    onSave(rule);
    onClose();
  };

  const updateExample = (index: number, field: keyof GrammarExample, value: string) => {
    const newEx = [...examples];
    newEx[index] = { ...newEx[index], [field]: value };
    setExamples(newEx);
  };

  const addExample = () => {
    setExamples([...examples, { english: '', bengali: '', type: 'affirmative' }]);
  };

  const removeExample = (index: number) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  const addTip = () => {
    if (newTip.trim()) {
      setTips([...tips, newTip.trim()]);
      setNewTip('');
    }
  };

  const removeTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[90] transition-opacity backdrop-blur-[1px]" onClick={onClose} />
      
      {/* Draggable Sheet Simulation: Fixed Height 93% */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] z-[100] rounded-t-[24px] shadow-2xl h-[93vh] flex flex-col animate-slide-up transform transition-transform">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-white rounded-t-[24px]">
          <h2 className="text-[18px] font-bold text-[#111827]">{existingRule ? 'Update Rule' : 'Add New Rule'}</h2>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-[#6366F1] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-indigo-200 active:scale-95 transition-transform">
              Save
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#6B7280] transition-colors">
              <Icon name="x" size="sm" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-5">
          
          {/* 1. Title */}
          <div>
            <label className="block text-sm font-bold text-[#374151] mb-1.5 ml-1">Title <span className="text-red-500">*</span></label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Present Indefinite Tense"
              className="w-full bg-white border border-[#E5E7EB] rounded-[14px] px-4 py-3 text-base font-medium outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 transition-all placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>

          {/* 2. Explanation */}
          <div>
            <label className="block text-sm font-bold text-[#374151] mb-1.5 ml-1">Explanation</label>
            <textarea 
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain the grammar rule here..."
              rows={3}
              className="w-full bg-white border border-[#E5E7EB] rounded-[14px] px-4 py-3 text-sm outline-none focus:border-[#6366F1] resize-none placeholder:text-gray-400"
            />
          </div>

          {/* 3. Hint */}
          <div>
            <label className="block text-sm font-bold text-[#374151] mb-1.5 ml-1">Bengali Hint 💡</label>
            <input 
              value={bengaliHint}
              onChange={(e) => setBengaliHint(e.target.value)}
              placeholder="e.g. বাংলা বাক্যের শেষে..."
              className="w-full bg-white border border-[#E5E7EB] rounded-[14px] px-4 py-3 text-sm outline-none focus:border-[#6366F1] placeholder:text-gray-400"
            />
          </div>

          {/* 4. Formulas */}
          <CollapsibleSection title="Formulas / Structure" icon={<Icon name="layout-grid" size="sm" />}>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-green-600 mb-1 block uppercase">Affirmative</label>
                <input 
                  value={formulaAff}
                  onChange={(e) => setFormulaAff(e.target.value)}
                  placeholder="Sub + V1 + Obj"
                  className="w-full bg-[#F0FDF4] border border-green-100 rounded-[10px] px-3 py-2.5 text-sm font-mono text-green-800 outline-none focus:border-green-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-red-500 mb-1 block uppercase">Negative</label>
                <input 
                  value={formulaNeg}
                  onChange={(e) => setFormulaNeg(e.target.value)}
                  placeholder="Sub + do/does not + V1 + Obj"
                  className="w-full bg-[#FEF2F2] border border-red-100 rounded-[10px] px-3 py-2.5 text-sm font-mono text-red-800 outline-none focus:border-red-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-blue-500 mb-1 block uppercase">Interrogative</label>
                <input 
                  value={formulaInt}
                  onChange={(e) => setFormulaInt(e.target.value)}
                  placeholder="Do/Does + Sub + V1 + Obj?"
                  className="w-full bg-[#EFF6FF] border border-blue-100 rounded-[10px] px-3 py-2.5 text-sm font-mono text-blue-800 outline-none focus:border-blue-300"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* 5. Examples */}
          <CollapsibleSection title="Examples" icon={<Icon name="list" size="sm" />} defaultOpen={true}>
            <div className="space-y-4">
              {examples.map((ex, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-[14px] p-3 relative group animate-in fade-in">
                  {/* Remove Button */}
                  {examples.length > 1 && (
                    <button 
                      onClick={() => removeExample(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center border border-red-200 shadow-sm hover:bg-red-200 active:scale-90 transition-all z-10"
                    >
                      <Icon name="x" size="sm" />
                    </button>
                  )}
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">Example {index + 1}</span>
                    <select 
                      value={ex.type}
                      onChange={(e) => updateExample(index, 'type', e.target.value as any)}
                      className="text-xs bg-white border border-gray-200 rounded px-2 py-1 outline-none text-gray-600 focus:border-indigo-300"
                    >
                      <option value="affirmative">Affirmative</option>
                      <option value="negative">Negative</option>
                      <option value="interrogative">Interrogative</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    {/* BENGALI INPUT FIRST as requested */}
                    <input 
                      value={ex.bengali}
                      onChange={(e) => updateExample(index, 'bengali', e.target.value)}
                      placeholder="বাংলা বাক্য..."
                      className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    {/* ENGLISH INPUT SECOND */}
                    <input 
                      value={ex.english}
                      onChange={(e) => updateExample(index, 'english', e.target.value)}
                      placeholder="English sentence..."
                      className="w-full bg-white border border-gray-200 rounded-[10px] px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 font-medium text-gray-800"
                    />
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addExample}
                className="w-full py-3 border-2 border-dashed border-[#E5E7EB] rounded-[14px] text-sm font-bold text-[#6B7280] hover:border-[#6366F1] hover:text-[#6366F1] hover:bg-[#EEF2FF] transition-all flex items-center justify-center gap-2"
              >
                <Icon name="plus" size="sm" /> Add Another Example
              </button>
            </div>
          </CollapsibleSection>

          {/* 6. Tips */}
          <CollapsibleSection title="Tips / Tricks" icon={<Icon name="sparkles" size="sm" />}>
            <div className="space-y-3">
              {tips.map((tip, index) => (
                <div key={index} className="flex gap-2 items-start bg-yellow-50 p-3 rounded-[10px] border border-yellow-100">
                  <span className="text-lg">💡</span>
                  <p className="flex-1 text-sm text-yellow-800 leading-relaxed">{tip}</p>
                  <button onClick={() => removeTip(index)} className="text-yellow-600 hover:text-yellow-800 px-1">
                    <Icon name="x" size="sm" />
                  </button>
                </div>
              ))}
              
              <div className="flex gap-2 mt-2">
                <input 
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  placeholder="Add a new tip..."
                  className="flex-1 bg-white border border-[#E5E7EB] rounded-[10px] px-3 py-2 text-sm outline-none focus:border-[#6366F1]"
                  onKeyDown={(e) => e.key === 'Enter' && addTip()}
                />
                <button 
                  onClick={addTip}
                  className="bg-[#6366F1] text-white px-4 rounded-[10px] font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-transform"
                >
                  Add
                </button>
              </div>
            </div>
          </CollapsibleSection>

        </div>
      </div>
    </>
  );
};

export default AddRuleSheet;
