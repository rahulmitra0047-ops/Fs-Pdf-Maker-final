
import React, { useState } from 'react';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import PremiumInput from '../../../shared/components/PremiumInput';
import { ShuffleType } from '../utils/shuffleUtils';
import Icon from '../../../shared/components/Icon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onShuffle: (type: ShuffleType, seed: string) => void;
}

const ShuffleModal: React.FC<Props> = ({ isOpen, onClose, onShuffle }) => {
  const [shuffleType, setShuffleType] = useState<ShuffleType>('simple');
  const [seed, setSeed] = useState('');
  const [useSeed, setUseSeed] = useState(false);

  const handleShuffle = () => {
      onShuffle(shuffleType, useSeed ? seed : '');
      onClose();
  };

  const Option = ({ type, label, desc }: { type: ShuffleType, label: string, desc: string }) => (
      <label 
        className={`
            block p-4 border rounded-[16px] cursor-pointer transition-all
            ${shuffleType === type ? 'border-[#6366F1] bg-[#EEF2FF] shadow-sm' : 'border-[#F3F4F6] hover:bg-[#F9FAFB]'}
        `}
      >
          <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                   <input 
                      type="radio" 
                      name="shuffleType" 
                      checked={shuffleType === type} 
                      onChange={() => setShuffleType(type)}
                      className="peer sr-only"
                   />
                   <div className="w-5 h-5 rounded-full border-2 border-[#D1D5DB] peer-checked:border-[#6366F1] peer-checked:bg-[#6366F1] transition-all"></div>
                   <div className="absolute top-1.5 left-1.5 w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <div>
                  <div className={`font-semibold text-[14px] ${shuffleType === type ? 'text-[#111827]' : 'text-[#374151]'}`}>{label}</div>
                  <div className="text-[12px] text-[#6B7280] mt-0.5">{desc}</div>
              </div>
          </div>
      </label>
  );

  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} title="Shuffle MCQs" size="md">
        <div className="space-y-6">
            <div className="space-y-3">
                <Option type="simple" label="Simple Random" desc="Completely random order of all questions" />
                <Option type="sections" label="Keep Sections Together" desc="Shuffle within sections (based on page titles)" />
                <Option type="options" label="Shuffle Options Only" desc="Keep questions, shuffle A/B/C/D choices" />
                <Option type="full" label="Full Shuffle" desc="Shuffle both questions and answer choices" />
            </div>

            <div className="border-t border-[#F3F4F6] pt-5">
                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <div className="relative flex items-center">
                        <input 
                            type="checkbox"
                            checked={useSeed}
                            onChange={(e) => setUseSeed(e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="w-5 h-5 bg-white border-2 border-[#D1D5DB] rounded-[6px] peer-checked:bg-[#6366F1] peer-checked:border-[#6366F1] transition-all"></div>
                        <svg className="absolute w-3.5 h-3.5 text-white left-[3px] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-[14px] font-semibold text-[#374151]">Set random seed (reproducible)</span>
                </label>
                
                {useSeed && (
                    <PremiumInput 
                        value={seed}
                        onChange={setSeed}
                        placeholder="e.g. ExamSetA"
                        className="animate-in fade-in slide-in-from-top-1"
                    />
                )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <PremiumButton variant="ghost" onClick={onClose}>Cancel</PremiumButton>
                <PremiumButton onClick={handleShuffle} className="w-36 shadow-lg shadow-indigo-200">
                    <span className="flex items-center gap-2">
                        <Icon name="shuffle" size="sm" />
                        Shuffle
                    </span>
                </PremiumButton>
            </div>
        </div>
    </PremiumModal>
  );
};

export default ShuffleModal;
