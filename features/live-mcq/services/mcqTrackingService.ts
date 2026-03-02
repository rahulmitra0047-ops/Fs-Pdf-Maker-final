
import { dbFirestore } from '../../../core/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

export interface MCQAttempt {
  lastAttemptedAt: string; // ISO date
  attemptCount: number;
}

export interface UserAttempts {
  visitorId: string;
  attempts: Record<string, MCQAttempt>; // questionId -> attempt data
  lastUpdatedAt: Timestamp;
}

const COLLECTION_NAME = 'mcq_user_attempts';
const STORAGE_KEY_VISITOR_ID = 'live_mcq_visitor_id';

// Generate or retrieve visitor ID
export const getVisitorId = (): string => {
  let visitorId = localStorage.getItem(STORAGE_KEY_VISITOR_ID);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY_VISITOR_ID, visitorId);
  }
  return visitorId;
};

// Fetch all attempts for a visitor
export const getMcqAttempts = async (visitorId: string): Promise<Record<string, MCQAttempt>> => {
  try {
    const docRef = doc(dbFirestore, COLLECTION_NAME, visitorId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserAttempts;
      return data.attempts || {};
    }
    return {};
  } catch (error) {
    console.error("Error fetching MCQ attempts:", error);
    return {};
  }
};

// Batch save attempts
export const saveMcqAttempts = async (
  visitorId: string, 
  newAttempts: Record<string, MCQAttempt>
): Promise<void> => {
  if (Object.keys(newAttempts).length === 0) return;

  try {
    const docRef = doc(dbFirestore, COLLECTION_NAME, visitorId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Merge with existing attempts
      const existingData = docSnap.data() as UserAttempts;
      const updatedAttempts = { ...existingData.attempts };

      Object.entries(newAttempts).forEach(([questionId, attempt]) => {
        if (updatedAttempts[questionId]) {
          updatedAttempts[questionId] = {
            lastAttemptedAt: attempt.lastAttemptedAt,
            attemptCount: (updatedAttempts[questionId].attemptCount || 0) + 1
          };
        } else {
          updatedAttempts[questionId] = attempt;
        }
      });

      await updateDoc(docRef, {
        attempts: updatedAttempts,
        lastUpdatedAt: Timestamp.now()
      });
    } else {
      // Create new document
      const newData: UserAttempts = {
        visitorId,
        attempts: newAttempts,
        lastUpdatedAt: Timestamp.now()
      };
      await setDoc(docRef, newData);
    }
  } catch (error) {
    console.error("Error saving MCQ attempts:", error);
  }
};
