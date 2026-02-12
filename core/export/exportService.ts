
import { DocumentSettings, FooterSettings, MCQ, PageSetting, CoverPageSettings, TableOfContentsSettings, AnswerKeySettings, WatermarkSettings, MergedSource } from '../../types';
import { settingsService } from '../storage/services';
import { calculatePages, calculateFontSize, PageContent } from '../../features/create-pdf/utils/bookUtils';
import { APP_CONFIG } from '../config/appConfig';
import { PDF_STYLES } from './pdfStyles';

async function getRailwayUrl(): Promise<string> {
  const settings = await settingsService.getById('default');
  return settings?.railwayBaseUrl || APP_CONFIG.export.defaultUrl;
}

export interface ExportOptions {
  docId: string;
  settings: DocumentSettings;
  footer?: FooterSettings;
  coverPage?: CoverPageSettings;
  toc?: TableOfContentsSettings;
  answerKey?: AnswerKeySettings;
  pageSettings: PageSetting[];
  mcqs: MCQ[];
  title: string;
  mergedFrom?: MergedSource[];
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  error?: string;
}

const exportLocks = new Set<string>();

const CHECKMARK_SVG = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px;"><polyline points="20 6 9 17 4 12" /></svg>`;

function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function toBengaliNumber(num: number): string {
  return num.toString().replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 2534 - 48));
}

const getOptionLabel = (index: number, style: string) => {
  if (style === 'bengali') return ['ক', 'খ', 'গ', 'ঘ'][index] || '?';
  if (style === 'lowercase') return ['a', 'b', 'c', 'd'][index] || '?';
  if (style === 'roman') return ['i', 'ii', 'iii', 'iv'][index] || '?';
  if (style === 'numeric') return (index + 1).toString();
  return ['A', 'B', 'C', 'D'][index] || '?';
};

function renderWatermark(settings: WatermarkSettings): string {
    if (!settings.enabled || !settings.text.trim()) return '';
    const { text, style, opacity } = settings;
    const opVal = (opacity || 15) / 100;
    const escapedText = escapeHtml(text);

    if (style === 'repeated') {
        const items = Array.from({ length: 12 }).map(() => `<div class="watermark-text-repeated">${escapedText}</div>`).join('');
        return `<div class="watermark-layer wm-repeated" style="opacity: ${opVal}">${items}</div>`;
    }
    if (style === 'diagonal') {
        return `<div class="watermark-layer wm-diagonal" style="opacity: ${opVal}"><div class="watermark-text-diagonal">${escapedText}</div></div>`;
    }
    return `<div class="watermark-layer wm-horizontal" style="opacity: ${opVal}"><div class="watermark-text-horizontal">${escapedText}</div></div>`;
}

function renderMCQExport(m: MCQ, index: number, settings: DocumentSettings): string {
  // If spacer, render invisible div to maintain layout but hide content
  if (m.question === '---SPACE---') {
      return `<div class="mcq-item" style="visibility:hidden; border:none; height:100px;"></div>`;
  }

  const options = ['A','B','C','D'].map((k, i) => {
    const isCorrect = m.answer === k;
    const showHighlight = settings.showAnswerInMCQ && isCorrect;
    const label = getOptionLabel(i, settings.optionStyle);
    // Explicitly add SVG checkmark if highlight is on
    const checkmark = showHighlight ? CHECKMARK_SVG : '';
    
    return `<div class="mcq-option ${showHighlight ? 'correct' : ''}"><span>${label})</span> ${escapeHtml(m[`option${k}` as keyof MCQ] as string)} ${checkmark}</div>`;
  }).join('');

  return `
    <div class="mcq-item">
      <div class="mcq-question"><span class="mcq-number">${index}.</span><span class="mcq-text">${escapeHtml(m.question)}</span></div>
      <div class="mcq-options layout-${settings.optionLayout === 'vertical' ? 'list' : (settings.optionLayout || 'grid')}">${options}</div>
      ${settings.showSource !== false && m.source ? `<div class="mcq-source">— ${escapeHtml(m.source)}</div>` : ''}
      ${settings.showExplanations && m.explanation ? `<div class="mcq-explanation"><b>ব্যাখ্যা:</b> ${escapeHtml(m.explanation)}</div>` : ''}
    </div>`;
}

export async function exportToPDF(options: ExportOptions): Promise<ExportResult> {
  const { docId, mcqs, settings, title, pageSettings, footer, coverPage, toc, answerKey, mergedFrom } = options;
  if (exportLocks.has(docId)) return { success: false, error: 'Export in progress' };
  exportLocks.add(docId);

  try {
    // Pass mergedFrom to support mixed layouts
    const { pages } = calculatePages(mcqs, settings, mergedFrom);
    
    // We use the global paper size for the PDF container to ensure printing consistency,
    // but internal layouts are strictly per-page.
    const globalPaperSize = settings.paperSize.toLowerCase();
    
    // Create Index Map to skip spacers for numbering
    const indexMap = new Map<string, number>();
    let counter = 1;
    mcqs.forEach(m => {
        if (m.question !== '---SPACE---') {
            indexMap.set(m.id, counter++);
        }
    });

    let fullHtml = '';

    // --- 1. Cover Page ---
    if (coverPage && coverPage.enabled) {
        // Cover uses default settings base
        const coverClasses = `book-page ${globalPaperSize} density-${settings.density} theme-${settings.theme} font-${settings.fontStyle}`;
        fullHtml += `
        <div class="${coverClasses}" style="--page-margin-top: 10mm; --page-margin-bottom: 10mm; --page-margin-left: 10mm; --page-margin-right: 10mm;">
            <div class="book-layout-container">
                <div class="cover-page" style="color: ${coverPage.titleColor || '#000'}">
                    <div class="cover-title">${escapeHtml(coverPage.mainTitle)}</div>
                    <div class="cover-subtitle">${escapeHtml(coverPage.subtitle)}</div>
                    <div class="cover-meta">
                        ${coverPage.chapter ? `<div>${escapeHtml(coverPage.chapter)}</div>` : ''}
                        ${coverPage.author ? `<div>Author: ${escapeHtml(coverPage.author)}</div>` : ''}
                        ${coverPage.publisher ? `<div>Publisher: ${escapeHtml(coverPage.publisher)}</div>` : ''}
                        ${coverPage.year ? `<div>${escapeHtml(coverPage.year)}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    }

    // --- 2. Table of Contents ---
    if (toc && toc.enabled && pageSettings.length > 0) {
        const tocClasses = `book-page ${globalPaperSize} density-${settings.density} theme-${settings.theme} font-${settings.fontStyle}`;
        const fontSize = calculateFontSize(settings.fontStep);
        let tocRows = '';
        pageSettings.forEach(ps => {
            const pageNumStr = toc.numberStyle === 'bengali' ? toBengaliNumber(ps.pageNumber) : ps.pageNumber;
            tocRows += `<li class="toc-item"><span>${escapeHtml(ps.title)}</span><span>${pageNumStr}</span></li>`;
        });
        fullHtml += `
        <div class="${tocClasses} toc-page" style="font-size: ${fontSize}px; --page-margin-top: ${settings.margins.top}mm; --page-margin-bottom: ${settings.margins.bottom}mm; --page-margin-left: ${settings.margins.left}mm; --page-margin-right: ${settings.margins.right}mm;">
            <div class="book-layout-container">
                <h2>${escapeHtml(toc.title || 'Table of Contents')}</h2>
                <ul class="toc-list">${tocRows}</ul>
            </div>
        </div>`;
    }

    // --- 3. MCQ Pages (STRICT MODE) ---
    pages.forEach((page) => {
      // STRICT: Use the specific settings attached to this page via calculatePages
      // This ensures mixed documents retain their original font/density/layout
      const pSettings = page.settings || settings;
      
      const pageNum = page.pageNumber;
      const displayPageNum = pSettings.pageNumberStyle === 'bengali' ? toBengaliNumber(pageNum) : pageNum;
      
      // Section title logic
      const currentSection = options.pageSettings.find(ps => ps.pageNumber === pageNum);

      const fontSize = calculateFontSize(pSettings.fontStep);
      
      // Classes based on PAGE specific settings
      const densityClass = `density-${pSettings.density}`;
      const themeClass = `theme-${pSettings.theme}`;
      const fontClass = `font-${pSettings.fontStyle}`;
      const spacingClass = pSettings.lineSpacing ? `spacing-${pSettings.lineSpacing}` : '';
      const gapClass = pSettings.questionGap ? `gap-${pSettings.questionGap}` : '';
      const dividerClass = pSettings.columnLine === false ? 'no-divider' : '';
      
      // Border Logic
      let borderClass = 'border-none';
      if (pSettings.borderStyle && pSettings.borderStyle !== 'none') {
          borderClass = `bs-${pSettings.borderStyle} bw-${pSettings.borderThickness || 'medium'} ${pSettings.borderRounded ? 'br-rounded' : ''}`;
      }
      
      const basePageClass = `book-page ${globalPaperSize} ${densityClass} ${spacingClass} ${gapClass} ${themeClass} ${fontClass} ${borderClass}`;
      const watermarkHtml = renderWatermark(pSettings.watermark);

      // Render items with PAGE specific settings
      let col1Html = page.column1.map((m) => renderMCQExport(m, indexMap.get(m.id) || 0, pSettings)).join('');
      let col2Html = page.column2.map((m) => renderMCQExport(m, indexMap.get(m.id) || 0, pSettings)).join('');

      // Header Logic
      const showHeader = pSettings.header && pSettings.header.enabled;
      const headerText = pSettings.header?.text || '';
      const headerAlign = pSettings.header?.position ? `header-${pSettings.header.position}` : 'header-center';

      // STRICT STYLE INJECTION
      const inlineStyle = `
        --page-margin-top: ${pSettings.margins.top}mm; 
        --page-margin-bottom: ${pSettings.margins.bottom}mm; 
        --page-margin-left: ${pSettings.margins.left}mm; 
        --page-margin-right: ${pSettings.margins.right}mm; 
        font-size: ${fontSize}px;
      `;

      fullHtml += `
        <div class="${basePageClass}" style="${inlineStyle}">
          ${watermarkHtml}
          <div class="book-layout-container">
            ${showHeader ? `<div class="page-header ${headerAlign}">${escapeHtml(headerText)}</div>` : ''}
            
            ${currentSection?.title ? `
            <div class="page-title-area">
                <div class="page-title">${escapeHtml(currentSection.title)}</div>
            </div>` : ''}
            
            <div class="book-columns ${dividerClass}">
              <div class="book-column">${col1Html}</div>
              <div class="book-column">${col2Html}</div>
            </div>
            
            ${pSettings.pageNumberStyle !== 'hidden' || footer?.showFooter ? `
            <div class="page-footer">
              <div class="footer-left">${footer?.showFooter ? escapeHtml(footer.authorName) : ''}</div>
              ${pSettings.pageNumberStyle !== 'hidden' ? `<div class="footer-center"><div class="page-number-box">${displayPageNum}</div></div>` : '<div></div>'}
              <div class="footer-right">${footer?.showFooter ? escapeHtml(footer.bookName) : ''}</div>
            </div>` : ''}
          </div>
        </div>`;
    });

    // --- 4. Answer Key ---
    if (answerKey && answerKey.enabled) {
        const basePageClass = `book-page ${globalPaperSize} density-${settings.density} theme-${settings.theme} font-${settings.fontStyle}`;
        const fontSize = calculateFontSize(settings.fontStep);
        
        let ansHtml = '';
        const realMCQs = mcqs.filter(m => m.question !== '---SPACE---');
        realMCQs.forEach((m, i) => {
            ansHtml += `<div class="ans-item"><b>${i + 1}.</b> ${m.answer}</div>`;
        });
        
        fullHtml += `
        <div class="${basePageClass} ans-page" style="--ans-cols: ${answerKey.columns || 5}; font-size: ${fontSize}px; --page-margin-top: ${settings.margins.top}mm; --page-margin-bottom: ${settings.margins.bottom}mm; --page-margin-left: ${settings.margins.left}mm; --page-margin-right: ${settings.margins.right}mm;">
            <div class="book-layout-container">
                <h2>${escapeHtml(answerKey.title || 'Answer Key')}</h2>
                <div class="ans-grid">${ansHtml}</div>
            </div>
        </div>`;
    }

    const finalHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page { size: ${settings.paperSize}; } ${PDF_STYLES}</style></head><body>${fullHtml}</body></html>`;
    const railwayUrl = await getRailwayUrl();
    const response = await fetch(`${railwayUrl.replace(/\/$/, '')}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: finalHtml })
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const blob = await response.blob();
    return { success: true, blob };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    exportLocks.delete(docId);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
