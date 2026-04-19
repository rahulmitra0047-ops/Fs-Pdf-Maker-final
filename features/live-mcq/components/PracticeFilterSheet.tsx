
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MCQ } from '../../../types';
import Icon from '../../../shared/components/Icon';
import PremiumButton from '../../../shared/components/PremiumButton';
import { getVisitorId, getMcqAttempts } from '../services/mcqTrackingService';
import { useToast } from '../../../shared/context/ToastContext';

interface PracticeFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  setId: string;
  mcqs: MCQ[];
  onStart: (filteredIds: string[], settings: { shuffle: boolean; showSolution: boolean }, attempts?: Record<string, any>) => void;
}

const PRESETS = [
  { id: 'new', label: 'New', icon: 'sparkles' },
  { id: 'review', label: 'Review', icon: 'refresh-cw' },
  { id: 'mix', label: 'Mix', icon: 'shuffle' },
] as const;

const PracticeFilterSheet: React.FC<PracticeFilterSheetProps> = ({
  isOpen,
  onClose,
  setId,
  mcqs,
  onStart
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'new' | 'review' | 'mix'>('mix');
  const [shuffle, setShuffle] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const savedSettings = localStorage.getItem('practice_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setShuffle(parsed.shuffle ?? false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('practice_settings', JSON.stringify({ shuffle }));
  }, [shuffle]);

  useEffect(() => {
    if (isOpen) {
      const fetchAttempts = async () => {
        setLoading(true);
        const visitorId = getVisitorId();
        const data = await getMcqAttempts(visitorId);
        setAttempts(data);
        setLoading(false);
      };
      fetchAttempts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!loading) {
      calculateCount();
    }
  }, [selectedPreset, attempts, loading]);

  const calculateCount = () => {
    const filtered = filterQuestions(mcqs, attempts, selectedPreset);
    setFilteredCount(filtered.length);
  };

  const filterQuestions = (allMcqs: MCQ[], history: Record<string, any>, mode: string) => {
    let filtered = [...allMcqs];

    switch (mode) {
      case 'new':
        filtered = filtered.filter(m => !history[m.id]);
        break;
      case 'review':
        filtered = filtered.filter(m => history[m.id]);
        filtered.sort((a, b) => {
            const dateA = new Date(history[a.id].lastAttemptedAt).getTime();
            const dateB = new Date(history[b.id].lastAttemptedAt).getTime();
            return dateA - dateB;
        });
        break;
      case 'mix':
        break;
    }
    return filtered;
  };

  const handleStart = () => {
    if (filteredCount === 0) {
        toast.error("No questions available");
        return;
    }

    let filtered = filterQuestions(mcqs, attempts, selectedPreset);
    
    if (shuffle) {
        filtered = filtered.sort(() => Math.random() - 0.5);
    }

    onStart(filtered.map(m => m.id), { shuffle, showSolution: true }, attempts);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 w-[90%] max-w-sm bg-surface border border-border z-50 shadow-none max-h-[85vh] flex flex-col font-sans rounded-none"
          >
            {/* Scrollable Content */}
            <div className="p-6 pt-6 space-y-6 overflow-y-auto flex-1">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-serif font-medium text-text-primary">Practice Mode</h3>
                <div className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">
                  {loading ? '...' : `${filteredCount} Questions`}
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-3 gap-3">
                {PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id as any)}
                      className={`relative p-3 border rounded-none text-center transition-colors duration-200 flex flex-col items-center justify-center gap-2 aspect-square ${
                        isSelected 
                          ? 'border-text-primary bg-text-primary text-surface' 
                          : 'border-border bg-background hover:bg-[#EBE7DF] text-text-primary'
                      }`}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center`}>
                        <Icon name={preset.icon as any} size="sm" />
                      </div>
                      <div className="font-sans uppercase tracking-widest text-[10px] font-semibold">
                        {preset.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Settings */}
              <div className="space-y-3 pt-3">
                <label className="flex items-center justify-between p-4 bg-background border border-border rounded-none cursor-pointer hover:bg-[#EBE7DF] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface border border-border text-text-primary rounded-none">
                        <Icon name="shuffle" size="sm" />
                    </div>
                    <span className="font-sans uppercase tracking-[0.1em] text-[11px] font-semibold text-text-primary">Shuffle Questions</span>
                  </div>
                  <div className={`w-5 h-5 border rounded-none flex items-center justify-center transition-colors ${shuffle ? 'bg-text-primary border-text-primary text-surface' : 'border-border bg-background'}`}>
                    {shuffle && <Icon name="check" size="xs" />}
                  </div>
                  <input type="checkbox" checked={shuffle} onChange={e => setShuffle(e.target.checked)} className="hidden" />
                </label>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-6 pt-4 border-t border-border bg-surface flex-shrink-0 z-10 w-full flex gap-3">
              <PremiumButton variant="ghost" onClick={onClose} className="hover:bg-background">Cancel</PremiumButton>
              <PremiumButton onClick={handleStart} disabled={loading} className="flex-1 bg-text-primary text-surface hover:bg-text-primary/90 font-sans font-semibold tracking-widest uppercase text-[11px] rounded-none py-3">Start Practice</PremiumButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PracticeFilterSheet;
