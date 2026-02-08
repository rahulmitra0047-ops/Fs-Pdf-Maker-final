
import React from 'react';
import { MCQ, DocumentSettings } from '../../../types';
import CheckmarkIcon from '../../../shared/components/CheckmarkIcon';

interface Props {
  mcq: MCQ;
  index: number;
  settings: DocumentSettings;
}

const getOptionLabel = (index: number, style: 'english' | 'bengali' | 'lowercase' | 'roman' | 'numeric') => {
  if (style === 'bengali') return ['ক', 'খ', 'গ', 'ঘ'][index] || '?';
  if (style === 'lowercase') return ['a', 'b', 'c', 'd'][index] || '?';
  if (style === 'roman') return ['i', 'ii', 'iii', 'iv'][index] || '?';
  if (style === 'numeric') return (index + 1).toString();
  return ['A', 'B', 'C', 'D'][index] || '?';
};

const MCQBookItem: React.FC<Props> = ({ mcq, index, settings }) => {
  // If spacer, render invisible div
  if (mcq.question === '---SPACE---') {
      return <div className="mcq-item" style={{ visibility: 'hidden', borderBottom: 'none', height: '100px' }}></div>;
  }

  const layoutClass = settings.optionLayout === 'vertical' ? 'layout-list' : `layout-${settings.optionLayout || 'grid'}`;

  return (
    <div className="mcq-item">
      {/* Question */}
      <div className="mcq-question">
        <span className="mcq-number">{index}.</span>
        <span className="mcq-text">{mcq.question}</span>
      </div>

      {/* Options */}
      <div className={`mcq-options ${layoutClass}`}>
        {['A', 'B', 'C', 'D'].map((key, i) => {
            const optionKey = `option${key}` as keyof MCQ;
            const text = mcq[optionKey] as string;
            const isCorrect = mcq.answer === key;
            const label = getOptionLabel(i, settings.optionStyle);
            const showHighlight = settings.showAnswerInMCQ && isCorrect;
            
            return (
                <div key={key} className={`mcq-option ${showHighlight ? 'correct' : ''}`}>
                    <span className="mcq-option-label">{label})</span>
                    <span>{text}</span>
                    {showHighlight && <CheckmarkIcon size={11} />}
                </div>
            );
        })}
      </div>

      {/* Source */}
      {settings.showSource !== false && mcq.source && (
        <div className="mcq-source">
          — {mcq.source}
        </div>
      )}

      {/* Explanation */}
      {settings.showExplanations && mcq.explanation && (
        <div className="mcq-explanation">
            <span style={{fontWeight: 700, marginRight: '4px'}}>ব্যাখ্যা:</span>
            {mcq.explanation}
        </div>
      )}
    </div>
  );
};

export default MCQBookItem;
