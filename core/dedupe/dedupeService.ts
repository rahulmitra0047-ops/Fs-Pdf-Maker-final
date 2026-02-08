
import { MCQ } from '../../types';

// Helper to normalize text
export function normalizeText(text: string | undefined): string {
  if (!text) return '';
  
  return text
    .normalize('NFKC') // Unicode normalization
    .toLowerCase()
    // Bangla digits to English
    .replace(/[০-৯]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 2534 + 48))
    // Remove punctuation (Expanded to include Bengali '।' and '॥')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'|\[\]।॥]/g, "")
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateFingerprint(mcq: Partial<MCQ>): string {
  // Fingerprint includes question, options, and answer to ensure exact functional equality
  const parts = [
    mcq.question,
    mcq.optionA,
    mcq.optionB,
    mcq.optionC,
    mcq.optionD,
    mcq.answer
  ];
  
  return parts.map(normalizeText).join('|');
}

// Levenshtein distance for similarity
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export type DuplicateStatus = 'unique' | 'exact' | 'near';

export function checkDuplicate(
  candidate: MCQ, 
  existingMCQs: MCQ[], 
  threshold: number = 0.85
): { status: DuplicateStatus; match?: MCQ } {
  const candidateFp = generateFingerprint(candidate);
  const candidateQNorm = normalizeText(candidate.question);

  // 1. Exact Fingerprint Check
  for (const existing of existingMCQs) {
    // Skip self if editing
    if (existing.id === candidate.id) continue;

    const existingFp = existing.fingerprint || generateFingerprint(existing);
    if (candidateFp === existingFp) {
      return { status: 'exact', match: existing };
    }
  }

  // 2. Near Duplicate Check (Question Similarity)
  // Only check if question length is sufficient to avoid false positives on short questions like "What?"
  if (candidateQNorm.length > 10) {
    for (const existing of existingMCQs) {
        if (existing.id === candidate.id) continue;

        const existingQNorm = normalizeText(existing.question);
        
        // Fast pre-check: length difference
        if (Math.abs(existingQNorm.length - candidateQNorm.length) / candidateQNorm.length > (1 - threshold)) {
            continue;
        }

        const dist = levenshteinDistance(candidateQNorm, existingQNorm);
        const maxLength = Math.max(candidateQNorm.length, existingQNorm.length);
        const similarity = 1 - (dist / maxLength);

        if (similarity >= threshold) {
            return { status: 'near', match: existing };
        }
    }
  }

  return { status: 'unique' };
}

// Check for duplicates against existing MCQs
export function findDuplicates(
  newMCQs: MCQ[],
  existingMCQs: MCQ[]
): {
  unique: MCQ[];
  duplicates: { newMCQ: MCQ; existingMCQ: MCQ }[];
} {
  const existingFps = new Set<string>();
  existingMCQs.forEach(m => existingFps.add(m.fingerprint || generateFingerprint(m)));

  const unique: MCQ[] = [];
  const duplicates: { newMCQ: MCQ; existingMCQ: MCQ }[] = [];

  for (const mcq of newMCQs) {
      const fp = mcq.fingerprint || generateFingerprint(mcq);
      if (existingFps.has(fp)) {
          const match = existingMCQs.find(m => (m.fingerprint || generateFingerprint(m)) === fp)!;
          duplicates.push({ newMCQ: mcq, existingMCQ: match });
      } else {
          unique.push(mcq);
      }
  }

  return { unique, duplicates };
}

// Check for duplicates within a single batch
export function findDuplicatesInBatch(mcqs: MCQ[]): {
  unique: MCQ[];
  duplicates: MCQ[];
} {
  const seen = new Set<string>();
  const unique: MCQ[] = [];
  const duplicates: MCQ[] = [];

  for (const mcq of mcqs) {
      const fp = mcq.fingerprint || generateFingerprint(mcq);
      if (seen.has(fp)) {
          duplicates.push(mcq);
      } else {
          seen.add(fp);
          unique.push(mcq);
      }
  }

  return { unique, duplicates };
}
