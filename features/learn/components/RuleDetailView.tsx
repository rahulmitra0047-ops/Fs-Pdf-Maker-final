
import React from 'react';
import { GrammarRule } from '../../../types';
import Icon from '../../../shared/components/Icon';

interface Props {
  rule: GrammarRule;
  onClose: () => void;
  onEdit: () => void;
}

const DetailCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  color?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, icon, color = "text-[#6366F1]", children, className = "" }) => (
  <div className={`bg-white rounded-[20px] p-5 shadow-sm border border-[#F3F4F6] mb-4 ${className}`}>
    <div className="flex items-center gap-2.5 mb-3">
      <div className={`${color}`}>{icon}</div>
      <h3 className="font-bold text-[#111827] text-[16px]">{title}</h3>
    </div>
    {children}
  </div>
);

const RuleDetailView: React.FC<Props> = ({ rule, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-[#FAFAFA] overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
      {/* 1. AppBar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 h-[60px] flex items-center justify-between">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-[#6B7280]">
          <Icon name="arrow-left" size="md" />
        </button>
        <span className="font-semibold text-[#111827] truncate max-w-[200px]">{rule.title}</span>
        <button onClick={onEdit} className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-[#6366F1]">
          <Icon name="edit-3" size="md" />
        </button>
      </div>

      <div className="p-5 pb-24 max-w-3xl mx-auto">
        
        {/* 2. Header Card */}
        <div className="bg-gradient-to-br from-[#6C63FF] to-[#8B83FF] rounded-[24px] p-6 text-white shadow-lg shadow-indigo-200 mb-6">
          <h1 className="text-[28px] font-extrabold leading-tight mb-3">{rule.title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-white/10">
              {rule.category || 'General'}
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-white/10">
              {rule.difficulty}
            </span>
          </div>
        </div>

        {/* 3. Explanation Card */}
        <DetailCard title="ব্যাখ্যা" icon={<Icon name="book-open" size="sm" />}>
          <p className="text-[#374151] leading-relaxed whitespace-pre-wrap text-[15px]">
            {rule.explanation}
          </p>
        </DetailCard>

        {/* 4. Hint Card */}
        {(rule.bengaliHint || rule.bnHint) && (
          <DetailCard 
            title="চেনার উপায়" 
            icon={<span className="text-xl">💡</span>} 
            color="" 
            className="bg-amber-50 border-amber-100"
          >
            <p className="text-amber-900 font-medium text-[15px]">
              {rule.bengaliHint || rule.bnHint}
            </p>
          </DetailCard>
        )}

        {/* 5. Formulas Card */}
        {(rule.formulaAffirmative || rule.formulaNegative || rule.formulaInterrogative || rule.pattern) && (
          <DetailCard title="Formulas" icon={<Icon name="layout-grid" size="sm" />}>
            <div className="space-y-3">
              {(rule.formulaAffirmative || rule.pattern) && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-green-600 uppercase mb-1">Affirmative</div>
                  <code className="font-mono text-green-900 text-sm font-bold block">{rule.formulaAffirmative || rule.pattern}</code>
                </div>
              )}
              {rule.formulaNegative && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-red-600 uppercase mb-1">Negative</div>
                  <code className="font-mono text-red-900 text-sm font-bold block">{rule.formulaNegative}</code>
                </div>
              )}
              {rule.formulaInterrogative && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Interrogative</div>
                  <code className="font-mono text-blue-900 text-sm font-bold block">{rule.formulaInterrogative}</code>
                </div>
              )}
            </div>
          </DetailCard>
        )}

        {/* 6. Signal Words */}
        {rule.signalWords && rule.signalWords.length > 0 && (
          <DetailCard title="Signal Words" icon={<Icon name="tag" size="sm" />}>
            <div className="flex flex-wrap gap-2">
              {rule.signalWords.map((word, i) => (
                <span key={i} className="px-3 py-1.5 bg-[#EEF2FF] text-[#6366F1] rounded-lg text-sm font-medium">
                  {word}
                </span>
              ))}
            </div>
          </DetailCard>
        )}

        {/* 7. Examples Card */}
        {(rule.examples.length > 0 || (rule.legacyExamples && rule.legacyExamples.length > 0)) && (
          <DetailCard title="Examples" icon={<Icon name="list" size="sm" />}>
            <div className="space-y-3">
              {rule.examples.map((ex, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    ex.type === 'affirmative' ? 'bg-green-500' : ex.type === 'negative' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <p className="text-[#111827] font-medium text-[15px] mb-1 pl-2">{ex.english}</p>
                  {ex.bengali && <p className="text-[#6B7280] text-sm pl-2">{ex.bengali}</p>}
                  <span className={`absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    ex.type === 'affirmative' ? 'bg-green-100 text-green-700' : ex.type === 'negative' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {ex.type.substring(0, 3)}
                  </span>
                </div>
              ))}
              
              {/* Legacy fallback */}
              {rule.legacyExamples?.map((ex, i) => (
                <div key={`legacy-${i}`} className="bg-gray-50 border border-gray-100 rounded-xl p-3 pl-4">
                  <p className="text-[#374151] text-sm">{ex}</p>
                </div>
              ))}
            </div>
          </DetailCard>
        )}

        {/* 8. Common Mistakes */}
        {rule.commonMistakes && rule.commonMistakes.length > 0 && (
          <DetailCard title="Common Mistakes" icon={<Icon name="alert-triangle" size="sm" />} color="text-red-500">
            <div className="space-y-4">
              {rule.commonMistakes.map((mistake, i) => (
                <div key={i} className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-3.5">
                  <div className="flex items-start gap-2 mb-2 text-red-900/80 line-through decoration-red-400">
                    <span className="no-underline">❌</span>
                    <span>{mistake.wrong}</span>
                  </div>
                  <div className="flex items-start gap-2 mb-2 text-green-800 font-bold">
                    <span>✅</span>
                    <span>{mistake.correct}</span>
                  </div>
                  {mistake.reason && (
                    <p className="text-xs text-gray-500 italic mt-2 border-t border-red-100 pt-2">
                      💡 {mistake.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </DetailCard>
        )}

        {/* 9. Tips */}
        {rule.tips && rule.tips.length > 0 && (
          <DetailCard title="মনে রাখার টিপস" icon={<Icon name="sparkles" size="sm" />} color="text-yellow-500">
            <ul className="space-y-3">
              {rule.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#374151] bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                  <span className="text-lg">🤓</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </DetailCard>
        )}

      </div>
    </div>
  );
};

export default RuleDetailView;
