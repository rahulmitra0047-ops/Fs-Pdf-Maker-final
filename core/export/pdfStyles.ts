
export const PDF_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@100..800&family=Baloo+Da+2:wght@400..800&family=Hind+Siliguri:wght@300;400;500;600;700&family=Inter:wght@400;600;700&family=Merriweather:wght@400;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@400;500;600;700&display=swap');

:root {
  --theme-border: #000000;
  --theme-qnum: #1e40af;
  --theme-highlight: #dcfce7;
  --theme-divider: #374151;
  --theme-text: #000000;
  --theme-bg: #ffffff;
  --theme-hf: #000000;
  
  /* Compact Spacing Default */
  --gap-question: 2px;
  --gap-option: 1px;
  --mcq-padding: 3px; 
  --fs-question: 1em;
  --fs-option: 0.95em;
  --fs-tag: 0.7em;
  --line-height: 1.3;
}

/* Themes */
.theme-classic { --theme-border: #000000; --theme-qnum: #1e40af; --theme-highlight: #dcfce7; --theme-divider: #374151; --theme-text: #000000; --theme-bg: #ffffff; --theme-hf: #000000; }
.theme-modern-blue { --theme-border: #1e3a5f; --theme-qnum: #2563eb; --theme-highlight: #dbeafe; --theme-divider: #64748b; --theme-text: #1f2937; --theme-bg: #ffffff; --theme-hf: #1e3a5f; }
.theme-elegant-green { --theme-border: #14532d; --theme-qnum: #15803d; --theme-highlight: #bbf7d0; --theme-divider: #4b5563; --theme-text: #1f2937; --theme-bg: #ffffff; --theme-hf: #14532d; }
.theme-warm-maroon { --theme-border: #7f1d1d; --theme-qnum: #b91c1c; --theme-highlight: #fecaca; --theme-divider: #6b7280; --theme-text: #1f2937; --theme-bg: #ffffff; --theme-hf: #7f1d1d; }
.theme-professional-gray { --theme-border: #1f2937; --theme-qnum: #4b5563; --theme-highlight: #e5e7eb; --theme-divider: #9ca3af; --theme-text: #000000; --theme-bg: #ffffff; --theme-hf: #1f2937; }

/* Density Levels */
.density-comfortable { --mcq-padding: 6px; --gap-question: 4px; --gap-option: 2px; --line-height: 1.5; }
.density-dense { --mcq-padding: 3px; --gap-question: 2px; --gap-option: 1px; --line-height: 1.3; }
.density-ultra { --mcq-padding: 1px; --gap-question: 1px; --gap-option: 0px; --line-height: 1.2; }
.density-ultra-max { --mcq-padding: 0px; --gap-question: 0px; --gap-option: 0px; --line-height: 1.1; }

/* Spacing Overrides */
.spacing-tight { --line-height: 1.15; }
.spacing-compact { --line-height: 1.3; }
.spacing-normal { --line-height: 1.5; }
.spacing-relaxed { --line-height: 1.75; }

.gap-tight { --gap-question: 2px; }
.gap-normal { --gap-question: 6px; }
.gap-relaxed { --gap-question: 12px; }

/* Font Mappings */
.font-classic, .font-serif { font-family: 'Noto Serif Bengali', serif; }
.font-modern, .font-sans { font-family: 'Noto Sans Bengali', sans-serif; }

@page { margin: 0; }
body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

.book-page {
  background: var(--theme-bg);
  color: var(--theme-text);
  border: 3px solid var(--theme-border);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  margin: 0 auto;
  page-break-after: always;
  break-after: page;
  display: flex;
  flex-direction: column;
  line-height: var(--line-height);
}

/* Border Styles */
.book-page.border-none { border: none !important; }
.book-page.bs-solid { border-style: solid; }
.book-page.bs-dashed { border-style: dashed; }
.book-page.bs-dotted { border-style: dotted; }
.book-page.bs-double { border-style: double; }
.book-page.bw-thin { border-width: 1px; }
.book-page.bw-medium { border-width: 3px; }
.book-page.bw-thick { border-width: 6px; }
.book-page.br-rounded { border-radius: 15px; }

/* Page Dimensions */
.book-page.a4 { width: 210mm; height: 297mm; }
.book-page.a5 { width: 148mm; height: 210mm; }
.book-page.letter { width: 216mm; height: 279mm; }
.book-page.legal { width: 216mm; height: 356mm; }

.watermark-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 0; pointer-events: none; }
.watermark-text-diagonal { font-size: 80px; font-weight: 800; transform: rotate(-45deg); white-space: nowrap; font-family: sans-serif; color: inherit; }
.watermark-text-horizontal { font-size: 80px; font-weight: 800; white-space: nowrap; font-family: sans-serif; color: inherit; }
.wm-repeated { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(4, 1fr); gap: 20px; padding: 40px; }
.watermark-text-repeated { font-size: 24px; font-weight: 700; transform: rotate(-30deg); white-space: nowrap; font-family: sans-serif; text-align: center; color: inherit; }

.book-layout-container { display: flex; flex-direction: column; flex: 1; height: 100%; position: relative; z-index: 10; padding: var(--page-margin-top) var(--page-margin-right) var(--page-margin-bottom) var(--page-margin-left); }

/* Page Header */
.page-header {
  padding: 4px 8px;
  border-bottom: 1px solid var(--theme-divider);
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 0.9em;
  min-height: 24px;
}
.header-left { justify-content: flex-start; }
.header-center { justify-content: center; }
.header-right { justify-content: flex-end; }

/* Page Title (Section Title) */
.page-title-area {
  min-height: 20px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; margin-bottom: 4px;
}
.page-title {
  text-align: center; 
  font-weight: 700; 
  font-size: 1.1em; 
  border-bottom: 1px solid var(--theme-border);
  padding-bottom: 2px;
  width: 90%;
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis;
}

.book-columns { display: grid; grid-template-columns: 1fr 1fr; flex: 1; position: relative; gap: 0; align-content: start; overflow: hidden; }
.book-columns::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--theme-border); transform: translateX(-50%); z-index: 10; }
.book-columns.no-divider::before { display: none; }
.book-column { padding: 0 4px; display: flex; flex-direction: column; overflow: hidden; }

.mcq-item { padding: var(--mcq-padding) 4px; border-bottom: 1px dashed var(--theme-divider); break-inside: avoid; }
.mcq-item:last-child { border-bottom: none; }

.mcq-question { display: flex; gap: 4px; font-size: var(--fs-question); margin-bottom: var(--gap-question); line-height: inherit; }
.mcq-number { color: var(--theme-qnum); font-weight: 800; margin-right: 2px; white-space: nowrap; flex-shrink: 0; }
.mcq-text { font-weight: 500; }

.mcq-options { display: grid; gap: var(--gap-option); font-size: var(--fs-option); line-height: inherit; }
.layout-grid { grid-template-columns: 1fr 1fr; }
.layout-list { grid-template-columns: 1fr; }
.mcq-option { padding: 1px 2px; }
.mcq-option.correct { background: var(--theme-highlight); font-weight: 600; border-radius: 2px; }

.mcq-source { display: block; text-align: right; font-size: 0.7em; color: #6b7280; font-style: italic; margin-top: 1px; }
.mcq-explanation { font-size: 0.8em; background-color: #f9fafb; padding: 2px 6px; margin-top: 2px; border-left: 2px solid var(--theme-qnum); border-radius: 2px; color: #374151; line-height: 1.2; white-space: pre-wrap; }

/* Footer Alignment */
.page-footer { 
  height: 24px; 
  margin-top: auto; 
  border-top: 1px solid var(--theme-divider); 
  padding: 2px 8px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  width: 100%;
  box-sizing: border-box;
  font-size: 0.8em;
  color: var(--theme-hf);
}
.page-footer > div { flex: 1; display: flex; }
.footer-left { justify-content: flex-start; }
.footer-center { justify-content: center; }
.footer-right { justify-content: flex-end; }

.page-number-box { border: 1px solid var(--theme-border); border-radius: 3px; padding: 0px 6px; font-weight: 600; text-align: center; display: inline-block; min-width: 20px; }

/* Special Pages */
.cover-page { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%; padding: 40px; }
.cover-title { font-size: 3em; font-weight: 800; line-height: 1.2; margin-bottom: 20px; }
.cover-subtitle { font-size: 1.5em; color: #555; margin-bottom: 40px; }
.cover-meta { margin-top: auto; font-size: 1.1em; color: #333; width: 100%; }
.cover-meta div { margin: 8px 0; }

.toc-page h2, .ans-page h2 { text-align: center; border-bottom: 2px solid var(--theme-border); padding-bottom: 10px; margin-bottom: 20px; }
.toc-list { list-style: none; padding: 0; }
.toc-item { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 4px 0; margin-bottom: 2px; }
.ans-grid { display: grid; grid-template-columns: repeat(var(--ans-cols, 5), 1fr); gap: 6px; font-size: 0.85em; align-content: start; }
.ans-item { padding: 2px; border: 1px solid #eee; text-align: center; border-radius: 3px; break-inside: avoid; }
`;
