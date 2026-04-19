import React, { memo } from 'react';
import Icon from '../../../shared/components/Icon';
import PremiumButton from '../../../shared/components/PremiumButton';

interface PracticeSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    options: {
        shuffleQuestions: boolean;
        showExplanation: boolean;
    };
    onOptionChange: (key: 'shuffleQuestions' | 'showExplanation', value: boolean) => void;
    onStart: () => void;
}

const PracticeSettings: React.FC<PracticeSettingsProps> = memo(({
    isOpen,
    onClose,
    options,
    onOptionChange,
    onStart
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-[360px] bg-surface border border-border rounded-none p-6 shadow-none animate-in zoom-in-95 duration-200 font-sans">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[18px] font-serif font-medium text-text-primary">Practice Settings</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 transition-colors"><Icon name="x" size="md" /></button>
                </div>
                <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-background border border-border rounded-none cursor-pointer group select-none transition-colors hover:bg-surface-hover">
                        <span className="text-[11px] font-semibold text-text-primary uppercase tracking-[0.1em]">Shuffle Questions</span>
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                checked={options.shuffleQuestions} 
                                onChange={e => onOptionChange('shuffleQuestions', e.target.checked)} 
                                className="peer sr-only" 
                            />
                            <div className="w-[20px] h-[20px] bg-background border border-border rounded-none transition-all peer-checked:bg-text-primary peer-checked:border-text-primary flex items-center justify-center">
                                <svg className="w-3 h-3 text-surface opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        </div>
                    </label>
                    <label className="flex items-center justify-between p-4 bg-background border border-border rounded-none cursor-pointer group select-none transition-colors hover:bg-surface-hover">
                        <span className="text-[11px] font-semibold text-text-primary uppercase tracking-[0.1em]">Show Solution</span>
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                checked={options.showExplanation} 
                                onChange={e => onOptionChange('showExplanation', e.target.checked)} 
                                className="peer sr-only" 
                            />
                            <div className="w-[20px] h-[20px] bg-background border border-border rounded-none transition-all peer-checked:bg-text-primary peer-checked:border-text-primary flex items-center justify-center">
                                <svg className="w-3 h-3 text-surface opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        </div>
                    </label>
                </div>
                <div className="mt-6 flex gap-3">
                    <PremiumButton onClick={onClose} variant="ghost" className="flex-1">Cancel</PremiumButton>
                    <PremiumButton onClick={onStart} className="flex-1">Start</PremiumButton>
                </div>
            </div>
        </div>
    );
});

export default PracticeSettings;
