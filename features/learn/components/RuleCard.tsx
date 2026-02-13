
import React from 'react';
import { GrammarRule } from '../../../types';
import Icon from '../../../shared/components/Icon';

interface Props {
  rule: GrammarRule;
  onTap: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const RuleCard: React.FC<Props> = ({ rule, onTap, onEdit, onDelete, onToggleFavorite }) => {
  const getDifficultyColor = (diff: string) => {
    if (diff === 'Advanced') return 'bg-red-500';
    if (diff === 'Intermediate') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div 
      onClick={onTap}
      className="bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F3F4F6] active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
    >
      {/* Row 1: Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getDifficultyColor(rule.difficulty)}`} />
          <h3 className="font-bold text-[#111827] text-[16px] truncate">{rule.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`p-2 rounded-full transition-colors ${rule.isFavorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
          >
            <Icon name="star" size="sm" className={rule.isFavorite ? "fill-current" : ""} />
          </button>
          
          <div className="relative group">
            <button 
              onClick={(e) => e.stopPropagation()} 
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <Icon name="more-vertical" size="sm" />
            </button>
            {/* Simple dropdown simulation for now, parent handles actual menu if needed, or inline absolute */}
            <div className="absolute right-0 top-8 hidden group-hover:block group-focus-within:block z-10 bg-white border border-gray-100 shadow-xl rounded-xl min-w-[120px] overflow-hidden">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Icon name="edit-3" size="sm" /> Edit
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Icon name="trash-2" size="sm" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Formula (if present) */}
      {(rule.formulaAffirmative || rule.pattern) && (
        <div className="mb-3 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
          <code className="text-[13px] font-mono text-purple-900 block truncate">
            {rule.formulaAffirmative || rule.pattern}
          </code>
        </div>
      )}

      {/* Row 3: Bengali Hint */}
      {(rule.bengaliHint || rule.bnHint) && (
        <div className="mb-4 flex items-center gap-2 text-[13px] text-gray-500">
          <span className="text-amber-500">💡</span>
          <span className="truncate max-w-[90%]">{rule.bengaliHint || rule.bnHint}</span>
        </div>
      )}

      {/* Row 4: Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#F9FAFB]">
        <div className="flex gap-2">
          <span className="text-[10px] font-bold bg-[#F3F4F6] text-[#6B7280] px-2 py-1 rounded-md uppercase tracking-wider">
            {rule.category || 'General'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-opacity-10
            ${rule.difficulty === 'Advanced' ? 'bg-red-500 text-red-700' : 
              rule.difficulty === 'Intermediate' ? 'bg-yellow-500 text-yellow-700' : 
              'bg-green-500 text-green-700'}`}>
            {rule.difficulty}
          </span>
        </div>
        <span className="text-[12px] font-medium text-[#9CA3AF]">
          {(rule.examples?.length || 0) + (rule.legacyExamples?.length || 0)} examples
        </span>
      </div>
    </div>
  );
};

export default RuleCard;
