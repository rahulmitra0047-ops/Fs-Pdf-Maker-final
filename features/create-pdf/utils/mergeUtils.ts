import { Document, MCQ, DocumentSettings, MergedSource } from '../../../types';

export interface MergeConfig {
  newTitle: string;
  sectionHandling: 'use_doc_names' | 'keep_original' | 'none';
  numbering: 'continuous' | 'reset_per_section';
  duplicateHandling: 'remove_auto' | 'keep_all' | 'ask';
}

export const detectDuplicates = (docs: Document[]): Map<string, MCQ[]> => {
  const map = new Map<string, MCQ[]>();
  const duplicates = new Map<string, MCQ[]>();

  docs.forEach(doc => {
    doc.mcqs.forEach(mcq => {
      // Create a fingerprint based on question text (normalized)
      const fingerprint = mcq.fingerprint || mcq.question.toLowerCase().trim().replace(/\s+/g, ' ');
      
      if (map.has(fingerprint)) {
        const existing = map.get(fingerprint)!;
        existing.push(mcq);
        duplicates.set(fingerprint, existing);
      } else {
        map.set(fingerprint, [mcq]);
      }
    });
  });

  return duplicates;
};

export const mergeDocuments = (
  docs: Document[], 
  config: MergeConfig, 
  idsToRemove: Set<string> = new Set()
): Partial<Document> => {
  
  const mergedMCQs: MCQ[] = [];
  const mergedSources: MergedSource[] = [];
  const seenFingerprints = new Set<string>();

  let currentCount = 0;

  docs.forEach(doc => {
    const docMCQs: MCQ[] = [];
    
    doc.mcqs.forEach(mcq => {
      if (idsToRemove.has(mcq.id)) return;

      const fingerprint = mcq.fingerprint || mcq.question.toLowerCase().trim().replace(/\s+/g, ' ');

      if (config.duplicateHandling === 'remove_auto') {
        if (seenFingerprints.has(fingerprint)) return;
        seenFingerprints.add(fingerprint);
      }

      docMCQs.push(mcq);
    });

    if (docMCQs.length > 0) {
      mergedMCQs.push(...docMCQs);
      
      mergedSources.push({
        docId: doc.id,
        docTitle: doc.title,
        mcqCount: docMCQs.length,
        mcqRange: [currentCount + 1, currentCount + docMCQs.length],
        settings: doc.settings
      });

      currentCount += docMCQs.length;
    }
  });

  // Base settings from the first document
  const baseSettings: DocumentSettings = docs[0]?.settings ? { ...docs[0].settings } : {
    paperSize: 'A4',
    perColumn: 1,
    margins: { preset: 'normal', top: 20, bottom: 20, left: 20, right: 20 },
    density: 'comfortable',
    fontStep: 12,
    optionStyle: 'english',
    fontStyle: 'modern',
    showExplanations: true,
    showAnswerInMCQ: false,
    showSource: false,
    theme: 'light',
    borderStyle: 'none',
    lineSpacing: 'normal',
    watermark: { enabled: false, text: '', style: 'diagonal', position: 'center', fontSize: 'medium', opacity: 20, color: '#000000' },
    pageNumberStyle: 'english'
  };

  return {
    title: config.newTitle,
    mcqs: mergedMCQs,
    settings: baseSettings,
    isMerged: true,
    mergedFrom: mergedSources
  };
};
