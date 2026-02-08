
import React, { useState } from 'react';
import { PageContent, calculateFontSize } from '../utils/bookUtils';
import { DocumentSettings, FooterSettings, PageSetting } from '../../../types';
import MCQBookItem from './MCQBookItem';
import '../styles/book-preview.css';

interface Props {
  page: PageContent;
  settings: DocumentSettings; // This is now the page-specific settings
  footerSettings?: FooterSettings;
  pageNumber: number;
  pageSetting?: PageSetting;
  onTitleChange?: (title: string) => void;
  interactive?: boolean;
}

// Helper for Bengali numbers in Page
const toBengaliNumber = (num: number): string => {
  return num.toString().replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 2534 - 48));
};

const MCQBookPage: React.FC<Props> = ({ 
  page, 
  settings, 
  footerSettings,
  pageNumber, 
  pageSetting, 
  onTitleChange,
  interactive = false
}) => {
  // Use settings from props (which might come from page.settings or passed directly)
  const effectiveSettings = page.settings || settings;

  const startIndex = (pageNumber - 1) * (effectiveSettings.perColumn * 2) + 1;
  const fontSize = calculateFontSize(effectiveSettings.fontStep);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(pageSetting?.title || '');

  const handleTitleSave = () => {
    if (onTitleChange) {
      onTitleChange(tempTitle);
    }
    setIsEditingTitle(false);
  };

  const hasTitle = !!pageSetting?.title;
  const showFooter = footerSettings?.showFooter !== false;

  const themeClass = `theme-${effectiveSettings.theme}`;
  
  // Apply classes for Density, Spacing, and Gaps
  const densityClass = `density-${effectiveSettings.density}`;
  const spacingClass = effectiveSettings.lineSpacing ? `spacing-${effectiveSettings.lineSpacing}` : '';
  const gapClass = effectiveSettings.questionGap ? `gap-${effectiveSettings.questionGap}` : '';
  
  let borderClass = 'border-none';
  if (effectiveSettings.borderStyle && effectiveSettings.borderStyle !== 'none') {
      borderClass = `bs-${effectiveSettings.borderStyle} bw-${effectiveSettings.borderThickness || 'medium'} ${effectiveSettings.borderRounded ? 'br-rounded' : ''}`;
  }

  const marginStyle = {
      '--page-margin-top': `${effectiveSettings.margins?.top || 8}mm`,
      '--page-margin-bottom': `${effectiveSettings.margins?.bottom || 8}mm`,
      '--page-margin-left': `${effectiveSettings.margins?.left || 8}mm`,
      '--page-margin-right': `${effectiveSettings.margins?.right || 8}mm`,
      fontSize: `${fontSize}px`
  } as React.CSSProperties;

  // Optimized Watermark Renderer
  const Watermark = () => {
    if (!effectiveSettings.watermark?.enabled || !effectiveSettings.watermark.text.trim()) return null;
    
    const { text, style, opacity } = effectiveSettings.watermark;
    
    const styleObj: React.CSSProperties = {
        opacity: (opacity || 15) / 100,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0
    };

    if (style === 'repeated') {
        return (
            <div className="watermark-layer wm-repeated" style={styleObj}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="watermark-text-repeated">{text}</div>
                ))}
            </div>
        );
    }

    if (style === 'diagonal') {
        return (
            <div className="watermark-layer wm-diagonal" style={styleObj}>
                <div className="watermark-text-diagonal">{text}</div>
            </div>
        );
    }

    return (
        <div className="watermark-layer wm-horizontal" style={styleObj}>
            <div className="watermark-text-horizontal">{text}</div>
        </div>
    );
  };

  const displayPageNum = effectiveSettings.pageNumberStyle === 'bengali' ? toBengaliNumber(pageNumber) : pageNumber;

  // Header Logic
  const showHeader = effectiveSettings.header && effectiveSettings.header.enabled;
  const headerText = effectiveSettings.header?.text || '';
  const headerAlign = effectiveSettings.header?.position ? `header-${effectiveSettings.header.position}` : 'header-center';

  return (
    <>
      <div 
        className={`book-page ${effectiveSettings.paperSize.toLowerCase()} ${densityClass} ${spacingClass} ${gapClass} font-${effectiveSettings.fontStyle} ${themeClass} ${borderClass}`}
        style={marginStyle}
      >
        <Watermark />
        <div className="book-layout-container">
          
          {/* Global Header */}
          {showHeader && (
              <div className={`page-header ${headerAlign}`}>
                  {headerText}
              </div>
          )}

          {/* Section Title Area */}
          {(hasTitle || (interactive && isEditingTitle)) ? (
             <div className="page-title-area">
                <div className="page-title">{pageSetting?.title || tempTitle}</div>
             </div>
          ) : interactive ? (
             <div className="page-title-area">
                <div 
                  className="page-title-editable"
                  onClick={() => { setTempTitle(''); setIsEditingTitle(true); }}
                >
                  <span className="text-gray-400">✎ Add Page Title</span>
                </div>
             </div>
          ) : null}

          {/* Columns */}
          <div className={`book-columns ${effectiveSettings.columnLine === false ? 'no-divider' : ''}`}>
            <div className="book-column">
                {page.column1.map((mcq, idx) => (
                    <MCQBookItem 
                      key={mcq.id} 
                      mcq={mcq} 
                      index={startIndex + idx}
                      settings={effectiveSettings}
                    />
                ))}
            </div>

            <div className="book-column">
                {page.column2.map((mcq, idx) => (
                    <MCQBookItem 
                      key={mcq.id} 
                      mcq={mcq} 
                      index={startIndex + effectiveSettings.perColumn + idx}
                      settings={effectiveSettings}
                    />
                ))}
            </div>
          </div>

          {/* Footer */}
          {showFooter ? (
            <div className="page-footer">
               <div className="footer-left">{footerSettings?.authorName}</div>
               {effectiveSettings.pageNumberStyle !== 'hidden' && (
                   <div className="footer-center">
                      <div className="page-number-box">{displayPageNum}</div>
                   </div>
               )}
               <div className="footer-right">{footerSettings?.bookName}</div>
            </div>
          ) : effectiveSettings.pageNumberStyle !== 'hidden' ? (
            <div className="page-footer" style={{ justifyContent: 'center' }}>
               <div className="footer-center">
                  <div className="page-number-box">{displayPageNum}</div>
               </div>
            </div>
          ) : null}
        </div>
      </div>

      {isEditingTitle && interactive && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-8 pointer-events-none">
           <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 flex flex-col gap-2 pointer-events-auto animate-in slide-in-from-top-2">
              <input 
                autoFocus
                className="border p-2 rounded text-sm w-full focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                placeholder="Chapter 1: Physics"
                maxLength={100}
                onKeyDown={(e) => { if(e.key === 'Enter') handleTitleSave(); }}
              />
              <div className="flex justify-end gap-2">
                 <button onClick={() => setIsEditingTitle(false)} className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1">Cancel</button>
                 <button onClick={handleTitleSave} className="text-xs bg-[var(--color-primary)] text-white px-3 py-1 rounded hover:bg-[var(--color-primary-700)]">Save</button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default MCQBookPage;
