
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
  { id: 'new', label: 'New', icon: 'sparkles', color: 'emerald' },
  { id: 'review', label: 'Review', icon: 'refresh-cw', color: 'amber' },
  { id: 'mix', label: 'Mix', icon: 'shuffle', color: 'indigo' },
] as const;

const getColorClasses = (color: string, isSelected: boolean) => {
  if (!isSelected) return 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50';
  switch (color) {
    case 'emerald': return 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500';
    case 'amber': return 'border-amber-500 bg-amber-50 ring-1 ring-amber-500';
    case 'indigo': return 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500';
    default: return 'border-slate-100 bg-white';
  }
};

const getIconColorClasses = (color: string, isSelected: boolean) => {
    if (isSelected) {
        switch (color) {
            case 'emerald': return 'bg-emerald-500 text-white';
            case 'amber': return 'bg-amber-500 text-white';
            case 'indigo': return 'bg-indigo-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    } else {
        switch (color) {
            case 'emerald': return 'bg-emerald-100 text-emerald-600';
            case 'amber': return 'bg-amber-100 text-amber-600';
            case 'indigo': return 'bg-indigo-100 text-indigo-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    }
};

const getTextColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) return 'text-slate-700';
    switch (color) {
        case 'emerald': return 'text-emerald-900';
        case 'amber': return 'text-amber-900';
        case 'indigo': return 'text-indigo-900';
        default: return 'text-slate-900';
    }
};

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

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('practice_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setShuffle(parsed.shuffle ?? false);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('practice_settings', JSON.stringify({ shuffle }));
  }, [shuffle]);

  // Fetch attempts on open
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

  // Calculate count when dependencies change
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
        // Not in history
        filtered = filtered.filter(m => !history[m.id]);
        break;
      case 'review':
        // In history (Oldest first)
        filtered = filtered.filter(m => history[m.id]);
        filtered.sort((a, b) => {
            const dateA = new Date(history[a.id].lastAttemptedAt).getTime();
            const dateB = new Date(history[b.id].lastAttemptedAt).getTime();
            return dateA - dateB; // Ascending (Oldest first)
        });
        break;
      case 'mix':
        // New + Review (Available)
        // Just return all relevant ones, maybe prioritize unattempted?
        // For now, just return all as per requirement "New + Review available"
        break;
    }
    return filtered;
  };

  const handleStart = () => {
    if (filteredCount === 0) {
        toast.error("কোনো question নেই");
        return;
    }

    let filtered = filterQuestions(mcqs, attempts, selectedPreset);
    
    // Shuffle if enabled (Review mode usually keeps oldest first, but shuffle overrides)
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 w-[90%] max-w-md bg-white rounded-[32px] z-50 shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Scrollable Content */}
            <div className="p-6 pt-6 space-y-6 overflow-y-auto flex-1">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Practice Mode</h3>
                <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
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
                      className={`relative p-3 rounded-2xl border-2 text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 aspect-square ${getColorClasses(preset.color, isSelected)}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getIconColorClasses(preset.color, isSelected)}`}>
                        <Icon name={preset.icon as any} size="sm" />
                      </div>
                      <div className={`font-bold text-sm ${getTextColorClasses(preset.color, isSelected)}`}>
                        {preset.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Settings */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer active:scale-[0.99] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-slate-500">
                        <Icon name="shuffle" size="sm" />
                    </div>
                    <span className="font-medium text-slate-700">Shuffle Questions</span>
                  </div>
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${shuffle ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                    {shuffle && <Icon name="check" size="xs" className="text-white" />}
                  </div>
                  <input type="checkbox" checked={shuffle} onChange={e => setShuffle(e.target.checked)} className="hidden" />
                </label>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-6 pt-4 border-t border-slate-100 bg-white rounded-b-[32px] flex-shrink-0 z-10 space-y-3">
              <button 
                onClick={handleStart} 
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-[16px] shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-indigo-500"
              >
                <span>Start Practice</span>
                <Icon name="arrow-right" size="sm" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PracticeFilterSheet;
