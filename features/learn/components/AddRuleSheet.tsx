
import React, { useState, useEffect } from 'react';
import PremiumInput from '../../../shared/components/PremiumInput';
import Icon from '../../../shared/components/Icon';
import { GrammarRule, GrammarExample, CommonMistake } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: GrammarRule) => void;
  existingRule?: GrammarRule | null;
  lessonId: string;
}

const CATEGORIES = [
  'General', 'Tense', 'Parts of Speech', 'Voice', 'Narration', 
  'Transformation', 'Sentence', 'Article', 'Preposition', 
  'Conjunction', 'Right Form of Verb'
];

const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#E5E7EB] rounded-[14px] overflow-hidden mb-3 bg-white">
      <div 
        className="flex items-center justify-between p-3.5 cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="text-[#6B7280]">{icon}</div>
          <span className="font-semibold text-[#374151] text-sm">{title}</span>
        </div>
        <div className={`text-[#9CA3AF] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <Icon name="chevron-left" size="sm" className="-rotate-90" />
        </div>
      </div>
      {isOpen && <div className="p-4 border-t border-[#E5E7EB]">{children}</div>}
    </div>
  );
};

const AddRuleSheet: React.FC<Props> = ({ isOpen, onClose, onSave, existingRule, lessonId }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [explanation, setExplanation] = useState('');
  const [bengaliHint, setBengaliHint] = useState('');
  
  const [formulaAff, setFormulaAff] = useState('');
  const [formulaNeg, setFormulaNeg] = useState('');
  const [formulaInt, setFormulaInt] = useState('');
  
  const [examples, setExamples] = useState<GrammarExample[]>([]);
  const [commonMistakes, setCommonMistakes] = useState<CommonMistake[]>([]);
  const [signalWords, setSignalWords] = useState('');
  const [tips, setTips] = useState<string[]>([]);

  // New tip/mistake/example input states
  const [newTip, setNewTip] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingRule) {
        setTitle(existingRule.title);
        setCategory(existingRule.category || 'General');
        setDifficulty(existingRule.difficulty || 'Beginner');
        setExplanation(existingRule.explanation);
        setBengaliHint(existingRule.bengaliHint || existingRule.bnHint || '');
        setFormulaAff(existingRule.formulaAffirmative || existingRule.pattern || '');
        setFormulaNeg(existingRule.formulaNegative || '');
        setFormulaInt(existingRule.formulaInterrogative || '');
        setExamples(existingRule.examples || []);
        setCommonMistakes(existingRule.commonMistakes || []);
        setSignalWords(existingRule.signalWords?.join(', ') || '');
        setTips(existingRule.tips || []);
      } else {
        resetForm();
      }
    }
  }, [isOpen, existingRule]);

  const resetForm = () => {
    setTitle('');
    setCategory('General');
    setDifficulty('Beginner');
    setExplanation('');
    setBengaliHint('');
    setFormulaAff('');
    setFormulaNeg('');
    setFormulaInt('');
    setExamples([{ english: '', bengali: '', type: 'affirmative' }]);
    setCommonMistakes([]);
    setSignalWords('');
    setTips([]);
    setNewTip('');
  };

  const handleSave = () => {
    if (!title.trim()) {
      // Show error
      return;
    }

    const rule: GrammarRule = {
      id: existingRule?.id || generateUUID(),
      lessonId,
      title,
      category,
      difficulty,
      explanation,
      bengaliHint,
      formulaAffirmative: formulaAff,
      formulaNegative: formulaNeg,
      formulaInterrogative: formulaInt,
      examples: examples.filter(ex => ex.english.trim()),
      commonMistakes: commonMistakes.filter(cm => cm.wrong.trim()),
      signalWords: signalWords.split(',').map(s => s.trim()).filter(Boolean),
      tips: tips.filter(t => t.trim()),
      isFavorite: existingRule?.isFavorite || false,
      createdAt: existingRule?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(rule);
    onClose();
  };

  const addExample = () => {
    setExamples([...examples, { english: '', bengali: '', type: 'affirmative' }]);
  };

  const updateExample = (index: number, field: keyof GrammarExample, value: string) => {
    const newEx = [...examples];
    newEx[index] = { ...newEx[index], [field]: value };
    setExamples(newEx);
  };

  const removeExample = (index: number) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  const addMistake = () => {
    setCommonMistakes([...commonMistakes, { wrong: '', correct: '', reason: '' }]);
  };

  const updateMistake = (index: number, field: keyof CommonMistake, value: string) => {
    const newM = [...commonMistakes];
    newM[index] = { ...newM[index], [field]: value };
    setCommonMistakes(newM);
  };

  const removeMistake = (index: number) => {
    setCommonMistakes(commonMistakes.filter((_, i) => i !== index));
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
      <div className="fixed inset-0 bg-black/50 z-[90] transition-opacity" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] z-[100] rounded-t-[24px] shadow-2xl h-[93vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-white rounded-t-[24px]">
          <h2 className="text-[18px] font-bold text-[#111827]">{existingRule ? 'Edit Rule' : 'Add New Rule'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#6B7280]">
            <Icon name="x" size="sm" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-24">
          
          {/* Top Section */}
          <div className="space-y-4 mb-6">
            <PremiumInput 
              label="Rule Title" 
              placeholder="e.g. Present Indefinite Tense" 
              value={title} 
              onChange={setTitle} 
            />
            
            <div className="flex gap-3">
              <div className="flex-[3]">
                <label className="block text-sm font-semibold text-[#374151] mb-1.5 ml-1">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-3 py-3 text-sm focus:border-[#6C63FF] outline-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-[2]">
                <label className="block text-sm font-semibold text-[#374151] mb-1.5 ml-1">Difficulty</label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-3 py-3 text-sm focus:border-[#6C63FF] outline-none"
                >
                  <option value="Beginner">🟢 Beginner</option>
                  <option value="Intermediate">🟡 Intermediate</option>
                  <option value="Advanced">🔴 Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#374151] mb-1.5 ml-1">Explanation (Bengali)</label>
              <textarea 
                value={explanation} 
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="নিয়মটি সহজ বাংলায় ব্যাখ্যা করুন..."
                rows={3}
                className="w-full bg-white border border-[#E5E7EB] rounded-[12px] px-3 py-3 text-sm focus:border-[#6C63FF] outline-none resize-none"
              />
            </div>

            <PremiumInput 
              label="চেনার উপায় 💡" 
              placeholder="e.g. প্রতিদিন, সবসময় থাকলে এই Tense" 
              value={bengaliHint} 
              onChange={setBengaliHint} 
            />
          </div>

          {/* Formulas */}
          <CollapsibleSection title="Formulas" icon={<Icon name="layout-grid" size="sm" />} defaultOpen>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <input 
                  value={formulaAff} 
                  onChange={(e) => setFormulaAff(e.target.value)}
                  placeholder="S + V1(s/es) + O" 
                  className="flex-1 font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-[#6C63FF] outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">❌</span>
                <input 
                  value={formulaNeg} 
                  onChange={(e) => setFormulaNeg(e.target.value)}
                  placeholder="S + do/does + not + V1 + O" 
                  className="flex-1 font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-[#6C63FF] outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">❓</span>
                <input 
                  value={formulaInt} 
                  onChange={(e) => setFormulaInt(e.target.value)}
                  placeholder="Do/Does + S + V1 + O + ?" 
                  className="flex-1 font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:border-[#6C63FF] outline-none"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Examples */}
          <CollapsibleSection title="Examples" icon={<Icon name="list" size="sm" />} defaultOpen>
            <div className="space-y-4">
              {examples.map((ex, idx) => (
                <div key={idx} className="border border-[#E5E7EB] rounded-xl p-3 bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Example {idx + 1}</span>
                    <div className="flex gap-2">
                      <select 
                        value={ex.type} 
                        onChange={(e) => updateExample(idx, 'type', e.target.value as any)}
                        className={`text-xs font-bold px-2 py-0.5 rounded border border-transparent 
                          ${ex.type === 'affirmative' ? 'text-green-600 bg-green-50' : 
                            ex.type === 'negative' ? 'text-red-600 bg-red-50' : 
                            'text-blue-600 bg-blue-50'}`}
                      >
                        <option value="affirmative">AFF</option>
                        <option value="negative">NEG</option>
                        <option value="interrogative">INT</option>
                      </select>
                      {examples.length > 1 && (
                        <button onClick={() => removeExample(idx)} className="text-gray-400 hover:text-red-500">
                          <Icon name="x" size="sm" />
                        </button>
                      )}
                    </div>
                  </div>
                  <input 
                    value={ex.english} 
                    onChange={(e) => updateExample(idx, 'english', e.target.value)}
                    placeholder="🇬🇧 English Sentence" 
                    className="w-full mb-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:border-[#6C63FF] outline-none"
                  />
                  <input 
                    value={ex.bengali} 
                    onChange={(e) => updateExample(idx, 'bengali', e.target.value)}
                    placeholder="🇧🇩 Bengali Translation" 
                    className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:border-[#6C63FF] outline-none"
                  />
                </div>
              ))}
              <button 
                onClick={addExample}
                className="w-full py-2 border border-dashed border-[#6C63FF] text-[#6C63FF] rounded-xl text-sm font-semibold hover:bg-[#EEF2FF] transition-colors"
              >
                + Add Example
              </button>
            </div>
          </CollapsibleSection>

          {/* Signal Words */}
          <CollapsibleSection title="Signal Words" icon={<Icon name="tag" size="sm" />}>
            <input 
              value={signalWords} 
              onChange={(e) => setSignalWords(e.target.value)}
              placeholder="always, usually, every day (comma separated)" 
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 focus:border-[#6C63FF] outline-none"
            />
          </CollapsibleSection>

          {/* Common Mistakes */}
          <CollapsibleSection title="Common Mistakes" icon={<Icon name="alert-triangle" size="sm" />}>
            <div className="space-y-4">
              {commonMistakes.map((mistake, idx) => (
                <div key={idx} className="border border-[#E5E7EB] rounded-xl p-3 bg-white shadow-sm relative">
                  <button onClick={() => removeMistake(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                    <Icon name="x" size="sm" />
                  </button>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-100">
                      <span>❌</span>
                      <input 
                        value={mistake.wrong} 
                        onChange={(e) => updateMistake(idx, 'wrong', e.target.value)}
                        placeholder="Wrong Sentence" 
                        className="flex-1 bg-transparent text-sm outline-none placeholder-red-300 text-red-900"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-100">
                      <span>✅</span>
                      <input 
                        value={mistake.correct} 
                        onChange={(e) => updateMistake(idx, 'correct', e.target.value)}
                        placeholder="Correct Sentence" 
                        className="flex-1 bg-transparent text-sm outline-none placeholder-green-300 text-green-900"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span>💬</span>
                      <input 
                        value={mistake.reason} 
                        onChange={(e) => updateMistake(idx, 'reason', e.target.value)}
                        placeholder="Reason (Why is it wrong?)" 
                        className="flex-1 bg-transparent text-sm outline-none text-gray-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addMistake}
                className="w-full py-2 border border-dashed border-[#6C63FF] text-[#6C63FF] rounded-xl text-sm font-semibold hover:bg-[#EEF2FF] transition-colors"
              >
                + Add Mistake
              </button>
            </div>
          </CollapsibleSection>

          {/* Tips */}
          <CollapsibleSection title="Tips" icon={<Icon name="sparkles" size="sm" />}>
            <div className="space-y-3">
              {tips.map((tip, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 p-3 rounded-xl">
                  <span className="text-lg">💡</span>
                  <span className="flex-1 text-sm text-yellow-900">{tip}</span>
                  <button onClick={() => removeTip(idx)} className="text-yellow-600/50 hover:text-yellow-700">
                    <Icon name="x" size="sm" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input 
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  placeholder="Add a memory tip..."
                  className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:border-[#6C63FF] outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addTip()}
                />
                <button 
                  onClick={addTip}
                  className="px-4 py-2 bg-[#6C63FF] text-white rounded-lg font-bold text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </CollapsibleSection>

        </div>

        {/* Fixed Bottom Action */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-[#E5E7EB] pb-safe">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-[#6C63FF] text-white rounded-[16px] font-bold text-[16px] shadow-lg shadow-indigo-200 active:scale-[0.98] transition-transform"
          >
            {existingRule ? 'Update Rule' : 'Save Rule'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddRuleSheet;
