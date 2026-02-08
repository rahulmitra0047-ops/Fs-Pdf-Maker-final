
import { MCQ, DocumentSettings, MergedSource } from '../../../types';

export interface PageContent {
  pageNumber: number;
  column1: MCQ[];
  column2: MCQ[];
  settings: DocumentSettings; // The settings used to render this page
}

export interface PageLayout {
  pages: PageContent[];
  totalPages: number;
}

export function calculatePages(
    mcqs: MCQ[], 
    defaultSettings: DocumentSettings, 
    mergedSources?: MergedSource[]
): PageLayout {
  
  // If no merged sources, use standard calculation
  if (!mergedSources || mergedSources.length === 0) {
      return calculateStandardPages(mcqs, defaultSettings, 1);
  }

  // Mixed Layout Calculation
  const pages: PageContent[] = [];
  let currentPageOffset = 1;
  let currentMcqIndex = 0;

  // We iterate through each source/section independently
  mergedSources.forEach(source => {
      // Extract MCQs for this source
      // We assume mcqs array is ordered same as mergedSources
      const sourceMcqs = mcqs.slice(currentMcqIndex, currentMcqIndex + source.mcqCount);
      currentMcqIndex += source.mcqCount;

      if (sourceMcqs.length > 0) {
          // Use the source's specific settings, or fallback to default
          const effectiveSettings = source.settings || defaultSettings;
          
          // Calculate pages just for this chunk
          const sectionLayout = calculateStandardPages(sourceMcqs, effectiveSettings, currentPageOffset);
          
          pages.push(...sectionLayout.pages);
          currentPageOffset += sectionLayout.totalPages;
      }
  });

  return { pages, totalPages: pages.length };
}

// Internal helper for standard logic
function calculateStandardPages(mcqs: MCQ[], settings: DocumentSettings, startPageNum: number): PageLayout {
  const perColumn = settings.perColumn || 5;
  const perPage = perColumn * 2;
  const totalPages = Math.ceil(mcqs.length / perPage);
  const pages: PageContent[] = [];

  for (let i = 0; i < totalPages; i++) {
    const start = i * perPage;
    const end = start + perPage;
    const pageMCQs = mcqs.slice(start, end);
    
    const col1 = pageMCQs.slice(0, perColumn);
    const col2 = pageMCQs.slice(perColumn, perPage);

    pages.push({
      pageNumber: startPageNum + i,
      column1: col1,
      column2: col2,
      settings: settings // Attach settings to page
    });
  }

  return { pages, totalPages };
}

export function calculateFontSize(fontStep: number): number {
  // Base font size formula: 8px + (step * 0.25)
  return 8 + (fontStep * 0.25);
}
