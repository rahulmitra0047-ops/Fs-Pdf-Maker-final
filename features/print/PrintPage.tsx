
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { documentService } from '../../core/storage/services';
import { Document, DocumentSettings } from '../../types';
import { calculatePages } from '../create-pdf/utils/bookUtils';
import MCQBookPage from '../create-pdf/components/MCQBookPage';

const PrintPage: React.FC = () => {
  const { docId } = useParams();
  const [searchParams] = useSearchParams();
  const [doc, setDoc] = useState<Document | null>(null);

  // Parse settings from URL, providing defaults for new features
  const settings: DocumentSettings = useMemo(() => ({
    paperSize: (searchParams.get('paper') as 'A4' | 'A5') || 'A4',
    perColumn: Number(searchParams.get('perCol')) || 5,
    density: (searchParams.get('density') as 'dense' | 'ultra') || 'dense',
    fontStep: Number(searchParams.get('fontStep')) || 15,
    optionStyle: (searchParams.get('optionStyle') as 'english' | 'bengali') || 'english',
    fontStyle: (searchParams.get('fontStyle') as 'classic' | 'modern') || 'classic',
    showExplanations: searchParams.get('showExplanations') === 'true',
    
    // New Features Defaults
    showAnswerInMCQ: searchParams.get('showAnswerInMCQ') !== 'false', // Default true
    theme: (searchParams.get('theme') as any) || 'classic',
    borderStyle: (searchParams.get('borderStyle') as any) || 'solid',
    lineSpacing: (searchParams.get('lineSpacing') as any) || 'normal',
    margins: {
        preset: 'normal',
        top: Number(searchParams.get('marginTop')) || 8,
        bottom: Number(searchParams.get('marginBottom')) || 8,
        left: Number(searchParams.get('marginLeft')) || 8,
        right: Number(searchParams.get('marginRight')) || 8
    },
    // Watermark
    watermark: {
        enabled: false, text: '', style: 'diagonal', position: 'center', fontSize: 'large', opacity: 15, color: '#9ca3af'
    }
  }), [searchParams]);

  useEffect(() => {
    const loadDoc = async () => {
      if (docId) {
        const found = await documentService.getById(docId);
        setDoc(found || null);
      }
    };
    loadDoc();
  }, [docId]);

  if (!doc) return <div>Loading document...</div>;

  // Use document settings if not overridden by URL params (basic logic improvement)
  // For now, we mix the URL params as overrides or fallbacks. 
  // In a real print view, we might prefer the document's actual saved settings.
  const finalSettings = { ...doc.settings, ...settings };

  // Calculate pages, ensuring merged chunks are respected
  const { pages } = calculatePages(doc.mcqs, finalSettings, doc.mergedFrom);

  return (
    <div className="print-root">
      <style>{`
        @page {
          size: ${finalSettings.paperSize};
          margin: 0;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
          .page-break {
            page-break-after: always;
            page-break-inside: avoid;
            /* Allow content flow */
          }
          .print-root {
             width: 100%;
          }
        }
        /* Hide scrollbars during print */
        ::-webkit-scrollbar { display: none; }
        
        body { margin: 0; padding: 0; background: #555; }
        .print-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
        }
        .print-page-wrapper {
           margin-bottom: 20px;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
           background: white;
        }
        
        @media print {
           body { background: white; }
           .print-root { display: block; padding: 0; }
           .print-page-wrapper { margin: 0; box-shadow: none; margin-bottom: 0; }
        }
      `}</style>

      {pages.map((page) => (
        <div key={page.pageNumber} className="print-page-wrapper page-break">
            <MCQBookPage 
                page={page} 
                settings={page.settings || finalSettings} 
                pageNumber={page.pageNumber} 
                pageSetting={doc.pageSettings?.find(ps => ps.pageNumber === page.pageNumber)}
            />
        </div>
      ))}
    </div>
  );
};

export default PrintPage;
