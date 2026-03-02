
import { MCQ } from '../../../types';

export interface FilterOptions {
  mode: 'new' | 'review' | 'mix' | 'all';
  shuffle: boolean;
  showSolution: boolean;
  custom?: {
    hidePeriod: 'none' | '1d' | '2d' | '3d' | '7d';
    showPeriod: 'all' | '1d' | '2d' | '3d' | '7d';
    showMode: 'only_this' | 'with_new';
    onlyUnattempted: boolean;
  };
}

export const filterMCQs = (
  mcqs: MCQ[], 
  attempts: Record<string, { lastAttemptedAt: string; attemptCount: number }>, 
  options: FilterOptions
): MCQ[] => {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  // Helper to check if attempted recently (within X days)
  const isRecent = (lastAttemptedAt: string, days: string) => {
    if (days === 'none' || days === 'all') return false;
    const d = parseInt(days);
    const attemptDate = new Date(lastAttemptedAt);
    const diffTime = Math.abs(now.getTime() - attemptDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= d;
  };

  let filtered = [...mcqs];

  switch (options.mode) {
    case 'new':
      // Never attempted
      filtered = filtered.filter(q => !attempts[q.id]);
      break;
    
    case 'review':
      // Attempted 3+ days ago OR attempted at all?
      // User requirement: "Review — ৩+ দিন আগে attempt করেছি"
      filtered = filtered.filter(q => {
        const attempt = attempts[q.id];
        if (!attempt) return false;
        return new Date(attempt.lastAttemptedAt) <= threeDaysAgo;
      });
      break;
    
    case 'mix':
      // New + Review (3+ days ago)
      // User requirement: "Mix — New + Review mixed"
      const newQs = filtered.filter(q => !attempts[q.id]);
      const reviewQs = filtered.filter(q => {
        const attempt = attempts[q.id];
        if (!attempt) return false;
        return new Date(attempt.lastAttemptedAt) <= threeDaysAgo;
      });
      filtered = [...newQs, ...reviewQs];
      break;
    
    case 'all':
    default:
      // All questions (no filter on history)
      break;
  }

  // Custom Filters (Apply on top of mode if needed, or if mode is 'custom' - though UI shows Custom as separate expandable)
  // The UI has "Custom Filter" expandable. If the user interacts with it, does it override "Mode"?
  // The prompt says: "Custom Filter (collapsed by default, tap করলে expand)".
  // It seems Custom Filter is an *additional* set of constraints or an alternative mode.
  // However, the `PracticeFilterSheet` has `selectedPreset` state.
  // If `custom` options are set, they might refine the selection.
  
  if (options.custom) {
      const { hidePeriod, showPeriod, showMode, onlyUnattempted } = options.custom;

      // 1. Only Unattempted
      if (onlyUnattempted) {
          filtered = filtered.filter(q => !attempts[q.id]);
      }

      // 2. Hide Period (Hide recently attempted)
      if (hidePeriod !== 'none') {
          filtered = filtered.filter(q => {
              const attempt = attempts[q.id];
              if (!attempt) return true; // Not attempted, so not hidden
              return !isRecent(attempt.lastAttemptedAt, hidePeriod);
          });
      }

      // 3. Show Period (Show only attempted within X days)
      if (showPeriod !== 'all') {
          filtered = filtered.filter(q => {
              const attempt = attempts[q.id];
              const isWithinPeriod = attempt && isRecent(attempt.lastAttemptedAt, showPeriod);
              
              if (showMode === 'with_new') {
                  return !attempt || isWithinPeriod;
              } else {
                  return isWithinPeriod;
              }
          });
      }
  }

  // Shuffle
  if (options.shuffle) {
    for (let i = filtered.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }
  }

  return filtered;
};
