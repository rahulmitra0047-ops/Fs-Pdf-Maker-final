import { MCQ } from '../../types';
import { generateFingerprint } from '../dedupe/dedupeService';

export interface InvalidMCQ {
  rawText: string;
  lineNumber: number;
  reason: string;
  missingFields: string[];
}

export interface ParseResult {
  valid: MCQ[];
  invalid: InvalidMCQ[];
  duplicatesInBatch: MCQ[];
  summary: {
    found: number;
    valid: number;
    invalid: number;
    duplicatesInBatch: number;
  };
}

export const parseFormatA = (rawText: string): ParseResult => {
  if (!rawText.trim()) {
    return {
      valid: [],
      invalid: [],
      duplicatesInBatch: [],
      summary: { found: 0, valid: 0, invalid: 0, duplicatesInBatch: 0 }
    };
  }

  const lines = rawText.split('\n');
  const validMCQs: MCQ[] = [];
  const invalidMCQs: InvalidMCQ[] = [];
  
  // State for the current MCQ being parsed
  let currentMCQ: Partial<MCQ> & { rawLines: string[]; startLine: number } = { 
    rawLines: [], 
    startLine: 1 
  };
  
  // Helper to finalize and validate the current MCQ
  const finalizeMCQ = () => {
    if (currentMCQ.question || currentMCQ.rawLines.length > 0) {
      const missingFields: string[] = [];
      if (!currentMCQ.question) missingFields.push("Missing question text");
      if (!currentMCQ.optionA) missingFields.push("Missing option A");
      if (!currentMCQ.optionB) missingFields.push("Missing option B");
      if (!currentMCQ.optionC) missingFields.push("Missing option C");
      if (!currentMCQ.optionD) missingFields.push("Missing option D");
      if (!currentMCQ.answer) {
        missingFields.push("Missing answer");
      } else if (!['A', 'B', 'C', 'D'].includes(currentMCQ.answer)) {
        missingFields.push("Invalid answer (must be A, B, C, or D)");
      }

      const rawText = currentMCQ.rawLines.join('\n');

      if (missingFields.length === 0) {
        const mcq = currentMCQ as MCQ;
        // Generate a temporary ID if one doesn't exist (will be replaced or managed later)
        if (!mcq.id) mcq.id = crypto.randomUUID();
        mcq.fingerprint = generateFingerprint(mcq);
        validMCQs.push(mcq);
      } else {
        // If it's just empty noise, ignore it
        if (rawText.trim().length > 0) {
            invalidMCQs.push({
            rawText: rawText,
            lineNumber: currentMCQ.startLine,
            reason: missingFields.join(', '),
            missingFields
            });
        }
      }
    }
    // Reset
    currentMCQ = { rawLines: [], startLine: 0 };
  };

  let isParsingQuestion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const originalLine = lines[i];

    // 1. Question Detection (Start of new MCQ)
    // Regex: starts with number + period + space
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
    
    if (questionMatch) {
      // If we were already parsing one, finalize it first
      if (isParsingQuestion || currentMCQ.rawLines.length > 0) {
        finalizeMCQ();
      }
      
      currentMCQ.startLine = i + 1;
      currentMCQ.rawLines = [originalLine];
      // Remove leading number
      currentMCQ.question = questionMatch[2].trim();
      isParsingQuestion = true;
      continue;
    }

    if (!isParsingQuestion && line.length > 0) {
        // Loose text before any question number? treat as part of previous or garbage.
        // For now, we assume Format A+ strictness on starting with "1. "
        // But if we are in a middle of parsing, we append.
    }

    if (isParsingQuestion) {
      currentMCQ.rawLines.push(originalLine);

      // 2. Answer Detection
      // Pattern: Answer: X or Ans: X
      const answerMatch = line.match(/^(?:Answer|Ans)\s*:\s*([A-D])/i);
      if (answerMatch) {
        currentMCQ.answer = answerMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        continue; // Handled this line
      }

      // 3. Explanation Detection
      const expMatch = line.match(/^(?:Exp|Explanation)\s*:\s*(.+)/i);
      if (expMatch) {
        currentMCQ.explanation = expMatch[1].trim();
        // Check subsequent lines for multi-line explanation until Source or next number
        let j = i + 1;
        while (j < lines.length) {
            const nextLine = lines[j].trim();
            if (nextLine.match(/^(\d+)\.\s+/) || nextLine.match(/^Source\s*:/i)) {
                break;
            }
            if (nextLine) {
                currentMCQ.explanation += "\n" + nextLine;
                currentMCQ.rawLines.push(lines[j]);
            }
            i = j; // Advance main loop
            j++;
        }
        continue;
      }

      // 4. Source Detection
      const sourceMatch = line.match(/^Source\s*:\s*(.+)/i);
      if (sourceMatch) {
        currentMCQ.source = sourceMatch[1].trim();
        continue;
      }

      // 5. Options Detection
      // Pattern: A) ... B) ... C) ... D) ...
      // We look for patterns like "A)" at the start or middle of line
      if (line.includes('A)') || line.includes('B)') || line.includes('C)') || line.includes('D)')) {
          // Simple parser for options on one or multiple lines
          // We can try to extract by splitting known delimiters
          // Note: This is a basic implementation. Robust parsing of "A) Apple B) Banana" vs "A) Option B" is tricky with regex alone.
          
          // Strategy: Normalize the line(s) containing options into a single string for this section
          // Then scan for A), B), C), D) indices.
          
          const extractOption = (text: string, label: string): string | null => {
              // Regex to find "A) content" but stop before "B)"
              // Regex: /A\)\s*([\s\S]+?)(?=\s*[B-D]\)|$)/
              // Dynamically build based on label
              const nextLabels = ['A', 'B', 'C', 'D'].filter(l => l > label).map(l => `${l}\\)`).join('|');
              const lookahead = nextLabels ? `(?=\\s*(?:${nextLabels})|$)` : '$';
              const regex = new RegExp(`${label}\\)\\s*([\\s\\S]+?)${lookahead}`, 'i');
              const match = text.match(regex);
              return match ? match[1].trim() : null;
          };

          // If options are spread across lines, we might need to look at current line and next few lines?
          // For simplicity/Format A+ spec: "Can be on single line or multiple lines"
          // We will attempt to parse options from the current line. If found, we assign.
          // If a line is JUST "A) Apple", we take it.
          
          const optA = extractOption(line, 'A');
          if (optA) currentMCQ.optionA = optA;
          
          const optB = extractOption(line, 'B');
          if (optB) currentMCQ.optionB = optB;
          
          const optC = extractOption(line, 'C');
          if (optC) currentMCQ.optionC = optC;
          
          const optD = extractOption(line, 'D');
          if (optD) currentMCQ.optionD = optD;
          
          continue;
      }
      
      // If it's none of the above, and we haven't found options yet, it's likely continuation of question text
      if (!currentMCQ.optionA && !currentMCQ.answer) {
          // Append to question (if it's not the first line which handled the number)
          if (currentMCQ.rawLines.length > 1) { // 1 because we just pushed parsing line
             currentMCQ.question += "\n" + line;
          }
      }
    }
  }
  
  // Finalize last item
  finalizeMCQ();

  // Deduplication within batch
  const seenFingerprints = new Set<string>();
  const uniqueMCQs: MCQ[] = [];
  const duplicatesInBatch: MCQ[] = [];

  for (const mcq of validMCQs) {
    if (seenFingerprints.has(mcq.fingerprint)) {
      duplicatesInBatch.push(mcq);
    } else {
      seenFingerprints.add(mcq.fingerprint);
      uniqueMCQs.push(mcq);
    }
  }

  return {
    valid: uniqueMCQs,
    invalid: invalidMCQs,
    duplicatesInBatch,
    summary: {
      found: validMCQs.length + invalidMCQs.length,
      valid: uniqueMCQs.length,
      invalid: invalidMCQs.length,
      duplicatesInBatch: duplicatesInBatch.length
    }
  };
};
