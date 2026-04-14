import React, { memo } from 'react';
import Icon from '../../../shared/components/Icon';

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
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-[360px] bg-white rounded-[28px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[20px] font-bold text-slate-800">Practice Settings</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><Icon name="x" size="md" /></button>
                </div>
                <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[20px] cursor-pointer group select-none transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
                        <span className="text-[15px] font-medium text-slate-700">Shuffle Questions</span>
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                checked={options.shuffleQuestions} 
                                onChange={e => onOptionChange('shuffleQuestions', e.target.checked)} 
                                className="peer sr-only" 
                            />
                            <div className="w-[24px] h-[24px] bg-white border-2 border-slate-300 rounded-[8px] transition-all peer-checked:bg-indigo-500 peer-checked:border-indigo-500 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        </div>
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[20px] cursor-pointer group select-none transition-colors hover:border-indigo-200 hover:bg-indigo-50/30">
                        <span className="text-[15px] font-medium text-slate-700">Show Solution</span>
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                checked={options.showExplanation} 
                                onChange={e => onOptionChange('showExplanation', e.target.checked)} 
                                className="peer sr-only" 
                            />
                            <div className="w-[24px] h-[24px] bg-white border-2 border-slate-300 rounded-[8px] transition-all peer-checked:bg-indigo-500 peer-checked:border-indigo-500 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        </div>
                    </label>
                </div>
                <button onClick={onStart} className="w-full mt-6 bg-indigo-600 text-white font-bold text-[16px] py-4 rounded-[20px] active:scale-[0.98] transition-transform shadow-lg shadow-indigo-900/20 hover:bg-indigo-500">Start Practice</button>
            </div>
        </div>
    );
});

export default PracticeSettings;
