import { FlashcardWord } from '../../../types';

export const calculateNextReview = (currentLevel: number, isCorrect: boolean): { newLevel: number, nextReviewDate: number } => {
  let newLevel = currentLevel;
  
  if (isCorrect) {
    newLevel = Math.min(currentLevel + 1, 5);
  } else {
    newLevel = Math.max(currentLevel - 1, 0);
  }

  const now = Date.now();
  let nextReviewDate = now;

  // Level 0: Immediate (stays in deck, but technically "now")
  // Level 1: 4 hours
  // Level 2: 1 day
  // Level 3: 3 days
  // Level 4: 7 days
  // Level 5: 30 days

  switch (newLevel) {
    case 0:
      nextReviewDate = now;
      break;
    case 1:
      nextReviewDate = now + 4 * 60 * 60 * 1000;
      break;
    case 2:
      nextReviewDate = now + 24 * 60 * 60 * 1000;
      break;
    case 3:
      nextReviewDate = now + 3 * 24 * 60 * 60 * 1000;
      break;
    case 4:
      nextReviewDate = now + 7 * 24 * 60 * 60 * 1000;
      break;
    case 5:
      nextReviewDate = now + 30 * 24 * 60 * 60 * 1000;
      break;
  }

  return { newLevel, nextReviewDate };
};

export const getDailyDeck = (allWords: FlashcardWord[], maxCards: number = 10): FlashcardWord[] => {
  const now = Date.now();

  // 1. Overdue words
  const overdue = allWords
    .filter(w => w.nextReviewDate <= now && w.confidenceLevel > 0)
    .sort((a, b) => a.nextReviewDate - b.nextReviewDate)
    .slice(0, 5);

  // 2. New words
  const newWords = allWords
    .filter(w => w.confidenceLevel === 0)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 5);

  let deck = [...overdue, ...newWords];

  // 3. Fill with weak words if needed
  if (deck.length < maxCards) {
    const remainingCount = maxCards - deck.length;
    const weakWords = allWords
      .filter(w => !deck.find(d => d.id === w.id)) // Exclude already selected
      .filter(w => w.totalReviews > 0 && (w.correctCount / w.totalReviews) < 0.5)
      .slice(0, remainingCount);
    
    deck = [...deck, ...weakWords];
  }
  
  // 4. Shuffle
  return deck.sort(() => Math.random() - 0.5).slice(0, maxCards);
};
