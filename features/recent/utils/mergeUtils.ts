
import { Document, MCQ, PageSetting, MergedSource } from '../../../types';
import { calculatePages } from '../../create-pdf/utils/bookUtils';
import { generateFingerprint } from '../../../core/dedupe/dedupeService';

export interface MergeConfig {
  newTitle: string;
  sectionHandling: 'keep_original' | 'use_doc_names' | 'none';
  numbering: 'continuous' | 'reset_per_section'; 
  duplicateHandling: 'keep_all' | 'remove_auto' | 'ask';
}

// Helper to check duplicates across documents
export const detectDuplicates = (documents: Document[]): Map<string, MCQ[]> => {
  const fingerprintMap = new Map<string, MCQ[]>();
  
  documents.forEach(doc => {
    doc.mcqs.forEach(mcq => {
      const fp = mcq.fingerprint || generateFingerprint(mcq);
      if (!fingerprintMap.has(fp)) {
        fingerprintMap.set(fp, []);
      }
      fingerprintMap.get(fp)!.push(mcq);
    });
  });

  // Filter map to only show actual duplicates (count > 1)
  const duplicates = new Map<string, MCQ[]>();
  for (const [fp, list] of fingerprintMap.entries()) {
    if (list.length > 1) {
      duplicates.set(fp, list);
    }
  }
  return duplicates;
};

export const mergeDocuments = (
  sourceDocs: Document[],
  config: MergeConfig,
  resolvedDuplicates: Set<string> // IDs of MCQs to REMOVE
): Partial<Document> => {
  let mergedMCQs: MCQ[] = [];
  const mergedPageSettings: PageSetting[] = [];
  const mergedFrom: MergedSource[] = [];
  let currentMCQCount = 0;
  let runningPageCount = 0;

  // Use first doc as base, but this serves mostly as a fallback container.
  // The actual layout will be driven by 'mergedFrom[].settings'
  const baseSettings = sourceDocs[0].settings;

  sourceDocs.forEach((doc) => {
    // 1. Filter MCQs (remove resolved duplicates)
    const validMCQs = doc.mcqs.filter(m => !resolvedDuplicates.has(m.id));
    
    // 2. Duplicate Handling (Auto)
    let finalDocMCQs: MCQ[] = [];
    
    if (config.duplicateHandling === 'remove_auto') {
        const existingFingerprints = new Set(mergedMCQs.map(m => m.fingerprint || generateFingerprint(m)));
        finalDocMCQs = validMCQs.filter(m => {
            const fp = m.fingerprint || generateFingerprint(m);
            if (existingFingerprints.has(fp)) return false;
            existingFingerprints.add(fp);
            return true;
        });
    } else {
        finalDocMCQs = validMCQs;
    }

    if (finalDocMCQs.length === 0) return; // Skip empty docs

    const startMCQIndex = currentMCQCount + 1;
    const endMCQIndex = currentMCQCount + finalDocMCQs.length;

    // 3. Calculate Pages for THIS specific section using its OWN settings
    const sectionLayout = calculatePages(finalDocMCQs, doc.settings);
    const sectionPages = sectionLayout.totalPages;

    // 4. Section Handling (Page Settings)
    const startPage = runningPageCount + 1;

    if (config.sectionHandling === 'use_doc_names') {
        mergedPageSettings.push({
            pageNumber: startPage,
            title: doc.title
        });
    } else if (config.sectionHandling === 'keep_original') {
        doc.pageSettings?.forEach(ps => {
            mergedPageSettings.push({
                pageNumber: startPage + (ps.pageNumber - 1),
                title: ps.title
            });
        });
    }

    // 5. Append MCQs
    mergedMCQs = [...mergedMCQs, ...finalDocMCQs];
    
    // 6. Track Source with Settings
    mergedFrom.push({
        docId: doc.id,
        docTitle: doc.title,
        mcqCount: finalDocMCQs.length,
        mcqRange: [startMCQIndex, endMCQIndex],
        settings: doc.settings // CRITICAL: Save settings
    });

    currentMCQCount += finalDocMCQs.length;
    runningPageCount += sectionPages;
  });

  return {
    title: config.newTitle,
    mcqs: mergedMCQs,
    settings: baseSettings, // This becomes 'global' fallback, but per-page logic uses mergedFrom
    pageSettings: mergedPageSettings,
    mergedFrom,
    isMerged: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // Default empty containers for optional sections
    footer: sourceDocs[0].footer,
    coverPage: sourceDocs[0].coverPage,
    toc: sourceDocs[0].toc,
    answerKey: sourceDocs[0].answerKey
  };
};
