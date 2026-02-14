
import React, { useState } from 'react';
import { VocabWord } from '../../../types';
import Icon from '../../../shared/components/Icon';

interface Props {
  word: VocabWord;
  serial: number;
  onEdit: () => void;
  onDelete: () => void;
}

const VocabCard: React.FC<Props> = ({ word, serial, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Helper to format the serial number (Circled number simulation)
  const getSerialBadge = (num: number) => (
    <div className="w-5 h-5 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
      {num}
    </div>
  );

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card collapse
    
    if (!('speechSynthesis' in window)) return; // Silently ignore if not supported

    // Cancel previous speech if any
    window.speechSynthesis.cancel();

    // Setup new utterance
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.45; // Slow speed as requested
    utterance.pitch = 1.0;

    // Handle states
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden transition-all duration-200">
      
      {/* Collapsed View / Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
      >
        {/* Left: Serial */}
        {getSerialBadge(serial)}

        {/* Content Row */}
        <div className="flex-1 flex items-center flex-wrap gap-2 text-[14px]">
          <span className="font-bold text-[#111827]">{word.word}</span>
          <span className="text-gray-400">→</span>
          <span className="text-[#374151]">{word.meaning}</span>
        </div>

        {/* Right: Menu */}
        <div className="relative flex items-center">
            {isExpanded && (
                <div className="flex items-center gap-1 mr-2 animate-in fade-in slide-in-from-right-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                        className="p-1.5 text-gray-400 hover:text-[#6366F1] hover:bg-indigo-50 rounded-full transition-colors"
                    >
                        <Icon name="edit-3" size="sm" />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <Icon name="trash-2" size="sm" />
                    </button>
                </div>
            )}
            <div className={`text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <Icon name="more-vertical" size="sm" />
            </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 ml-[32px] space-y-2 animate-in fade-in slide-in-from-top-1">
            
            {/* Divider */}
            <div className="h-px bg-gray-100 w-full mb-2"></div>

            {/* Type Badge */}
            <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[12px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium border border-gray-200">
                    🔤 {word.type}
                </span>
            </div>

            {/* Verb Forms (Only if Verb and has data) */}
            {word.type === 'Verb' && (word.v1 || word.v2) && (
                <div className="bg-[#EEF2FF] rounded-md p-2 border border-indigo-100 text-[12px] font-mono text-indigo-900 grid grid-cols-2 gap-x-2 gap-y-1">
                    {word.v1 && <div><span className="text-indigo-400">V1:</span> {word.v1}</div>}
                    {word.v2 && <div><span className="text-indigo-400">V2:</span> {word.v2}</div>}
                    {word.v3 && <div><span className="text-indigo-400">V3:</span> {word.v3}</div>}
                    {word.vIng && <div><span className="text-indigo-400">V-ing:</span> {word.vIng}</div>}
                </div>
            )}

            {/* Examples */}
            {word.examples && word.examples.length > 0 && (
                <div className="space-y-1.5 mt-2">
                    {word.examples.map((ex, idx) => (
                        <div key={idx} className="flex flex-col text-[12px] leading-relaxed border-l-2 border-indigo-100 pl-2">
                            <div className="text-gray-600">🇧🇩 {ex.bengali}</div>
                            <div className="text-gray-900 font-medium">🇬🇧 {ex.english}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Synonyms */}
            {word.synonyms && (
                <div className="flex items-start gap-1.5 text-[12px] text-gray-500 mt-2">
                    <span>📌</span>
                    <span className="italic">{word.synonyms}</span>
                </div>
            )}

            {/* Pronunciation (TTS Enabled) */}
            {word.pronunciation && (
                <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <button 
                        onClick={handleSpeak}
                        className={`transition-all duration-200 flex items-center justify-center rounded-full w-6 h-6 hover:bg-gray-100 active:scale-95 ${
                            isSpeaking ? 'text-[#6366F1] scale-110' : 'text-gray-500'
                        }`}
                        title="Listen Pronunciation"
                    >
                        <span>🔊</span>
                    </button>
                    <span>{word.pronunciation}</span>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default VocabCard;
