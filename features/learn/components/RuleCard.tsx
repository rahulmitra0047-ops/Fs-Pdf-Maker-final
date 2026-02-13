
import React, { useState } from 'react';
import { GrammarRule } from '../../../types';
import Icon from '../../../shared/components/Icon';

interface Props {
  rule: GrammarRule;
  serial: number;
  onEdit: () => void;
  onDelete: () => void;
}

const RuleCard: React.FC<Props> = ({ rule, serial, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to format the serial number with leading zero
  const formattedSerial = serial.toString().padStart(2, '0');

  const formulas = [
    { label: 'Aff', val: rule.formulaAffirmative || rule.pattern, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Neg', val: rule.formulaNegative, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Int', val: rule.formulaInterrogative, color: 'text-blue-600', bg: 'bg-blue-50' },
  ].filter(f => f.val);

  return (
    <div 
      className="bg-white rounded-[16px] border border-[#F3F4F6] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300"
    >
      {/* 1. Header (Always Visible) */}
      <div 
        className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50/80 border-b border-gray-100' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Serial Number */}
        <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 mr-3.5 border border-[#E5E7EB]">
          <span className="text-[#6B7280] font-bold text-sm font-mono">{formattedSerial}</span>
        </div>

        {/* Title & Preview */}
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-[#111827] text-[15px] truncate leading-tight">{rule.title}</h3>
          {!isExpanded && (rule.formulaAffirmative || rule.pattern) && (
            <p className="text-[12px] text-[#6B7280] mt-1 font-mono truncate bg-gray-100/50 rounded px-1.5 py-0.5 inline-block max-w-full">
              {rule.formulaAffirmative || rule.pattern}
            </p>
          )}
        </div>

        {/* Expand Icon */}
        <div className={`text-[#9CA3AF] transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#6366F1]' : ''}`}>
          <Icon name="chevron-left" size="sm" className="-rotate-90" />
        </div>
      </div>

      {/* 2. Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-2 animate-in fade-in slide-in-from-top-1 space-y-5">
          
          {/* Action Row */}
          <div className="flex justify-end gap-2 border-b border-gray-100 pb-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="text-xs font-semibold text-[#6366F1] bg-[#EEF2FF] px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
              <Icon name="edit-3" size="sm" /> Edit
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
            >
              <Icon name="trash-2" size="sm" /> Delete
            </button>
          </div>

          {/* Formulas */}
          {formulas.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">Formulas</h4>
              <div className="flex flex-col gap-2">
                {formulas.map((f, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-[10px] border border-transparent ${f.bg}`}>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/50 border border-white/20 uppercase ${f.color}`}>{f.label}</span>
                    <code className={`text-[13px] font-mono font-medium ${f.color} flex-1 break-words`}>{f.val}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {rule.explanation && (
            <div>
              <h4 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Explanation</h4>
              <div className="text-[14px] text-[#374151] leading-relaxed whitespace-pre-wrap bg-[#F9FAFB] p-3 rounded-[12px] border border-[#F3F4F6]">
                {rule.explanation}
              </div>
            </div>
          )}

          {/* Bengali Hint */}
          {(rule.bengaliHint || rule.bnHint) && (
            <div className="flex gap-3 items-center bg-amber-50 p-3 rounded-[12px] border border-amber-100">
              <span className="text-xl">💡</span>
              <div>
                <div className="text-[11px] font-bold text-amber-800/60 uppercase">Hint</div>
                <div className="text-[14px] font-medium text-amber-900 leading-tight mt-0.5">
                  {rule.bengaliHint || rule.bnHint}
                </div>
              </div>
            </div>
          )}

          {/* Examples */}
          {(rule.examples?.length > 0 || rule.legacyExamples?.length > 0) && (
            <div>
              <h4 className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">Examples</h4>
              <div className="space-y-2.5">
                {rule.examples?.map((ex, i) => (
                  <div key={i} className="pl-3 border-l-2 border-[#E5E7EB] py-0.5 hover:border-[#6366F1] transition-colors group">
                    <div className="text-[14px] font-medium text-[#111827] leading-snug">{ex.english}</div>
                    {ex.bengali && <div className="text-[13px] text-[#6B7280] mt-0.5">{ex.bengali}</div>}
                  </div>
                ))}
                {rule.legacyExamples?.map((ex, i) => (
                  <div key={`leg-${i}`} className="pl-3 border-l-2 border-[#E5E7EB] py-0.5">
                    <div className="text-[14px] text-[#374151]">{ex}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {rule.tips && rule.tips.length > 0 && (
            <div className="pt-2">
              {rule.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 text-[13px] text-indigo-800 bg-indigo-50 p-2.5 rounded-[10px] border border-indigo-100 mb-2">
                  <span>✨</span>
                  <span className="leading-snug">{tip}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default RuleCard;
