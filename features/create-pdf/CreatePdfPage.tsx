import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MCQ, PageSetting } from '../../types';
import { logAction } from '../../core/storage/services';
import { exportToPDF, downloadBlob } from '../../core/export/exportService';
import TopBar from '../../shared/components/TopBar';
import PremiumButton from '../../shared/components/PremiumButton';
import PremiumModal from '../../shared/components/PremiumModal';
import PremiumInput from '../../shared/components/PremiumInput';
import Icon from '../../shared/components/Icon';
import { useToast } from '../../shared/context/ToastContext';
import BulkImportModal from './components/BulkImportModal';
import SingleMCQModal from './components/SingleMCQModal';
import DocumentSettingsPanel from './components/DocumentSettingsPanel';
import MCQList from './components/MCQList';
import { calculatePages } from './utils/bookUtils';
import MCQBookPage from './components/MCQBookPage';
import { performShuffle, ShuffleType } from './utils/shuffleUtils';
import ShuffleModal from './components/ShuffleModal';
import { useCreatePdfState } from './hooks/useCreatePdfState';

const LoadingOverlay = ({ status, onCancel }: { status: string, onCancel: () => void }) => (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm text-[#111827] animate-in fade-in duration-200">
        <div className="text-4xl mb-6 animate-spin text-[#6366F1]">
            <Icon name="refresh-cw" size="2xl" />
        </div>
        <h2 className="text-[18px] font-bold mb-2">{status}</h2>
        <p className="text-[#6B7280] mb-8 text-sm">This might take a few seconds...</p>
        <button 
            onClick={onCancel}
            className="px-6 py-2 rounded-full border border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors text-sm font-medium text-[#374151]"
        >
            Cancel
        </button>
    </div>
);

const CreatePdfPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const {
    document, updateDocumentState, saveDocument, isLoading, isDirty, saveStatus,
    activeTab, setActiveTab, settingsSubTab, setSettingsSubTab,
    isExporting, setIsExporting, exportStatus, setExportStatus,
    showDraftRestore, setShowDraftRestore, pendingDraft, setPendingDraft, setIsDirty,
    location, draftKey
  } = useCreatePdfState();

  // Local UI State
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importedText, setImportedText] = useState('');
  const [showSingleMCQ, setShowSingleMCQ] = useState(false);
  const [showShuffle, setShowShuffle] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showTitleEdit, setShowTitleEdit] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState<MCQ | null>(null);

  // Preview State
  const [currentPage, setCurrentPage] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const canShare = typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare;

  // Handle Share Target
  useEffect(() => {
      const state = location.state as { importedText?: string };
      if (state?.importedText) {
          setImportedText(state.importedText);
          setShowBulkImport(true);
          window.history.replaceState({}, document.title);
      }
  }, [location, document.title]);

  const restoreDraft = () => {
      if (pendingDraft) {
          updateDocumentState(pendingDraft);
          toast.success("Draft restored");
          logAction('restore_draft', 'document', pendingDraft.id || 'new');
      }
      setShowDraftRestore(false);
  };

  const discardDraft = () => {
      localStorage.removeItem(draftKey);
      setShowDraftRestore(false);
      toast.info("Draft discarded");
  };

  const pageLayout = calculatePages(document.mcqs, document.settings, document.mergedFrom);

  useEffect(() => {
    const calculateScale = () => {
      if (activeTab === 'preview' && previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.offsetWidth;
        const availableWidth = containerWidth - 32; 
        const docWidth = document.settings.paperSize === 'A5' ? 559 : 794;
        let newScale = availableWidth / docWidth;
        if (newScale > 1.2) newScale = 1.2;
        setScale(newScale);
      }
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [activeTab, document.settings.paperSize]);

  const generatePDFBlob = async () => {
      await saveDocument(false);
      const result = await exportToPDF({
          docId: document.id,
          settings: document.settings,
          footer: document.footer,
          coverPage: document.coverPage,
          toc: document.toc,
          answerKey: document.answerKey,
          pageSettings: document.pageSettings || [],
          mcqs: document.mcqs,
          title: document.title,
          mergedFrom: document.mergedFrom
      });
      return result;
  };

  const handleExportPDF = async () => {
    if (document.mcqs.length === 0) {
        toast.error("Document is empty");
        return;
    }
    try {
        setIsExporting(true);
        setExportStatus("Generating PDF...");
        const result = await generatePDFBlob();
        
        if (result.success && result.blob) {
            downloadBlob(result.blob, `${document.title.replace(/\s+/g, '_')}.pdf`);
            setExportStatus("Export Complete!");
            toast.success("✅ PDF Downloaded!");
            logAction('export', 'document', document.id, 'PDF');
        } else {
            throw new Error(result.error || "Export failed");
        }
    } catch (e: any) {
        console.error(e);
        setExportStatus("Error: " + e.message);
        toast.error("❌ " + e.message);
    } finally {
        setTimeout(() => {
            setIsExporting(false);
            setExportStatus("");
        }, 1500); 
    }
  };

  const handleSharePDF = async () => {
      if (document.mcqs.length === 0) return toast.error("Document is empty");
      
      setIsExporting(true);
      setExportStatus("Preparing Share...");
      
      try {
          const result = await generatePDFBlob();
          
          if (result.success && result.blob) {
              const fileName = `${document.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.pdf`;
              const file = new File([result.blob], fileName, { type: 'application/pdf' });
              
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  await navigator.share({
                      files: [file],
                      title: document.title,
                      text: 'Created with FS PDF Maker'
                  });
                  toast.success("Shared successfully!");
                  logAction('export', 'document', document.id, 'Share');
              } else {
                  throw new Error("File sharing not supported on this device.");
              }
          } else {
              throw new Error(result.error || "Generation failed");
          }
      } catch (e: any) {
          if (e.name !== 'AbortError') {
              console.error(e);
              toast.error(e.message || "Share failed");
              if (confirm("Sharing failed. Do you want to download instead?")) {
                  handleExportPDF();
              }
          }
      } finally {
          setIsExporting(false);
          setExportStatus("");
      }
  };

  const handleBack = () => {
      if (isDirty) setShowBackConfirm(true);
      else navigate('/');
  };

  const openTitleEdit = () => setShowTitleEdit(true);

  const handleEditMCQ = (mcq: MCQ) => {
    setEditingMCQ(mcq);
    setShowSingleMCQ(true);
  };

  const handleDeleteMCQ = (id: string) => {
    updateDocumentState({ mcqs: document.mcqs.filter(m => m.id !== id) });
    if (editingMCQ?.id === id) {
        setEditingMCQ(null);
        setShowSingleMCQ(false);
    }
    toast.success("MCQ Deleted");
  };

  const handleBulkDelete = (ids: string[]) => {
      if (ids.length === 0) return;
      const idsSet = new Set(ids);
      updateDocumentState({ mcqs: document.mcqs.filter(m => !idsSet.has(m.id)) });
      toast.success(`${ids.length} MCQs deleted`);
  };

  const handleReorderMCQs = (newOrder: MCQ[]) => {
      updateDocumentState({ mcqs: newOrder });
  };

  const handleAddMCQs = (newMCQs: MCQ[]) => {
    updateDocumentState({ mcqs: [...document.mcqs, ...newMCQs] });
    setShowBulkImport(false);
    setImportedText('');
  };

  const handleSaveSingleMCQ = (mcq: MCQ) => {
    const exists = document.mcqs.some(m => m.id === mcq.id);
    let newMCQs;
    if (exists) {
        newMCQs = document.mcqs.map(m => m.id === mcq.id ? mcq : m);
    } else {
        newMCQs = [...document.mcqs, mcq];
    }
    updateDocumentState({ mcqs: newMCQs });
    setShowSingleMCQ(false);
    setEditingMCQ(null);
  };

  const handlePageTitleChange = (pageNumber: number, title: string) => {
     const pageSettings = document.pageSettings ? [...document.pageSettings] : [];
     const existingIndex = pageSettings.findIndex(p => p.pageNumber === pageNumber);
     if (existingIndex >= 0) {
         if (title) pageSettings[existingIndex].title = title;
         else pageSettings.splice(existingIndex, 1);
     } else if (title) {
         pageSettings.push({ pageNumber, title });
     }
     updateDocumentState({ pageSettings });
  };

  const handleShuffleAction = (type: ShuffleType, seed: string) => {
      const shuffled = performShuffle(document.mcqs, type, seed, document.settings, document.pageSettings);
      updateDocumentState({ mcqs: shuffled });
      toast.success("MCQs shuffled successfully");
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><p className="text-sm text-[#9CA3AF]">Loading Document...</p></div>;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20 pt-[112px]">
      {isExporting && (
          <LoadingOverlay 
              status={exportStatus} 
              onCancel={() => { setIsExporting(false); toast.info("Export hidden"); }} 
          />
      )}

      <TopBar 
        title={document.title}
        showBack 
        onBack={handleBack}
        backPath="/"
        showHome={false}
        onHome={handleBack}
        rightAction={activeTab === 'preview' ? (
            <div className="flex items-center gap-2">
                {canShare && (
                    <button 
                        onClick={handleSharePDF}
                        disabled={document.mcqs.length === 0}
                        className="bg-white border border-[#E5E7EB] text-[#6366F1] px-3 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-[#F9FAFB] active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <Icon name="share" size="sm" />
                    </button>
                )}
                <button 
                    onClick={handleExportPDF}
                    disabled={document.mcqs.length === 0}
                    className="bg-[#6366F1] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:shadow-none mr-2"
                >
                    <Icon name="download" size="sm" /> PDF
                </button>
            </div>
        ) : null}
      />
      
      <div 
        className="fixed top-0 left-16 right-32 h-[56px] z-50 cursor-pointer" 
        onClick={openTitleEdit}
        title="Edit Title"
      />

      <div className="fixed top-[56px] left-0 right-0 z-40 bg-white border-b border-[#F3F4F6] shadow-sm">
          <div className="flex max-w-3xl mx-auto">
              {['settings', 'editor', 'preview'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)} 
                    className={`flex-1 py-3 text-[15px] transition-all relative capitalize 
                        ${activeTab === tab 
                            ? 'text-[#111827] font-semibold border-b-2 border-[#6366F1]' 
                            : 'text-[#9CA3AF] font-normal border-b-0 hover:text-[#374151]'
                        }`}
                  >
                    {tab}
                  </button>
              ))}
          </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-2">
          {activeTab === 'settings' && (
              <DocumentSettingsPanel 
                  settings={document.settings} 
                  footerSettings={document.footer}
                  coverPage={document.coverPage}
                  toc={document.toc}
                  answerKey={document.answerKey}
                  onChange={(s) => updateDocumentState({ settings: s })}
                  onFooterChange={(f) => updateDocumentState({ footer: f })}
                  onCoverPageChange={(c) => updateDocumentState({ coverPage: c })}
                  onTocChange={(t) => updateDocumentState({ toc: t })}
                  onAnswerKeyChange={(a) => updateDocumentState({ answerKey: a })}
                  onExport={() => {}} 
                  saveStatus={saveStatus}
                  isExportButtonVisible={false} 
                  activeTab={settingsSubTab}
                  onTabChange={setSettingsSubTab}
              />
          )}

          {activeTab === 'editor' && (
              <div className="space-y-4">
                  <MCQList 
                      mcqs={document.mcqs} 
                      onEdit={handleEditMCQ} 
                      onDelete={handleDeleteMCQ} 
                      onBulkDelete={handleBulkDelete}
                      onReorder={handleReorderMCQs}
                  />

                  <div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-3">
                      {isFabOpen && (
                          <div className="flex flex-col items-end gap-3 mb-2 animate-in slide-in-from-bottom-4 duration-200">
                              <div className="flex items-center gap-3 group">
                                  <span className="bg-white px-3 py-1.5 rounded-lg shadow-md border border-[#F3F4F6] text-xs font-bold text-[#374151] opacity-0 group-hover:opacity-100 transition-opacity">Shuffle</span>
                                  <button 
                                      onClick={() => { setShowShuffle(true); setIsFabOpen(false); }}
                                      className="w-12 h-12 bg-white text-[#6366F1] border border-[#E5E7EB] rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
                                  >
                                      <Icon name="shuffle" size="sm" />
                                  </button>
                              </div>
                              <div className="flex items-center gap-3 group">
                                  <span className="bg-white px-3 py-1.5 rounded-lg shadow-md border border-[#F3F4F6] text-xs font-bold text-[#374151] opacity-0 group-hover:opacity-100 transition-opacity">Bulk Import</span>
                                  <button 
                                      onClick={() => { setShowBulkImport(true); setIsFabOpen(false); }}
                                      className="w-12 h-12 bg-white text-[#6366F1] border border-[#E5E7EB] rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
                                  >
                                      <Icon name="upload" size="sm" />
                                  </button>
                              </div>
                              <div className="flex items-center gap-3 group">
                                  <span className="bg-white px-3 py-1.5 rounded-lg shadow-md border border-[#F3F4F6] text-xs font-bold text-[#374151] opacity-0 group-hover:opacity-100 transition-opacity">Add MCQ</span>
                                  <button 
                                      onClick={() => { setEditingMCQ(null); setShowSingleMCQ(true); setIsFabOpen(false); }}
                                      className="w-12 h-12 bg-[#6366F1] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform"
                                  >
                                      <Icon name="edit-3" size="sm" />
                                  </button>
                              </div>
                          </div>
                      )}
                      
                      <button 
                          onClick={() => setIsFabOpen(!isFabOpen)}
                          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${isFabOpen ? 'bg-gray-800 text-white rotate-45' : 'bg-[#6366F1] text-white'}`}
                      >
                          <Icon name="plus" size="lg" />
                      </button>
                  </div>
              </div>
          )}

          {activeTab === 'preview' && (
              <div className="flex flex-col items-center">
                  <div ref={previewContainerRef} className="w-full flex justify-center">
                      {document.mcqs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-12 text-center text-[#9CA3AF]">
                              <Icon name="file-text" size="xl" className="mb-2 opacity-50" />
                              <p className="text-sm">No content to preview</p>
                          </div>
                      ) : (
                        <div className="flex flex-col items-center">
                            <div 
                              className="origin-top transition-transform shadow-2xl rounded-none border border-[#F3F4F6] bg-white"
                              style={{ 
                                transform: `scale(${scale})`,
                                marginBottom: -((1 - scale) * (document.settings.paperSize === 'A4' ? 1123 : 794)) 
                              }}
                            >
                                 {pageLayout.pages[currentPage - 1] && (
                                     <MCQBookPage 
                                        page={pageLayout.pages[currentPage - 1]} 
                                        settings={pageLayout.pages[currentPage - 1].settings}
                                        footerSettings={document.footer}
                                        pageNumber={currentPage}
                                        pageSetting={document.pageSettings?.find(ps => ps.pageNumber === currentPage)}
                                        onTitleChange={(title) => handlePageTitleChange(currentPage, title)}
                                        interactive={true}
                                     />
                                 )}
                            </div>
                            <div className="mt-8 flex items-center gap-4 bg-white px-4 py-2 rounded-[14px] shadow-sm border border-[#F3F4F6] mb-10">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-[#F9FAFB] disabled:opacity-30 text-[#6B7280]"><Icon name="chevron-left" /></button>
                                <span className="font-medium text-[#111827] text-sm">Page {currentPage} of {pageLayout.totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(pageLayout.totalPages, p + 1))} disabled={currentPage === pageLayout.totalPages} className="p-2 rounded-full hover:bg-[#F9FAFB] disabled:opacity-30 text-[#6B7280]"><Icon name="chevron-right" /></button>
                            </div>
                        </div>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* Modals */}
      <BulkImportModal 
        isOpen={showBulkImport} 
        onClose={() => setShowBulkImport(false)} 
        onImport={handleAddMCQs} 
        existingMCQs={document.mcqs}
        initialText={importedText} 
      />
      <SingleMCQModal 
        isOpen={showSingleMCQ} 
        onClose={() => { setShowSingleMCQ(false); setEditingMCQ(null); }} 
        onSave={handleSaveSingleMCQ} 
        onDelete={editingMCQ ? handleDeleteMCQ : undefined} 
        initialMCQ={editingMCQ}
        existingMCQs={document.mcqs} 
      />
      <ShuffleModal 
          isOpen={showShuffle}
          onClose={() => setShowShuffle(false)}
          onShuffle={handleShuffleAction}
      />
      
      <PremiumModal isOpen={showBackConfirm} onClose={() => setShowBackConfirm(false)} title="Unsaved Changes" size="sm">
          <div className="space-y-4">
              <p className="text-[#374151]">You have unsaved changes. Save before exiting?</p>
              <div className="flex justify-end gap-3">
                  <PremiumButton variant="danger" onClick={() => { setIsDirty(false); navigate('/'); }}>Discard</PremiumButton>
                  <PremiumButton onClick={() => { saveDocument(false).then(() => navigate('/')); }}>Save & Exit</PremiumButton>
              </div>
          </div>
      </PremiumModal>
      <PremiumModal isOpen={showTitleEdit} onClose={() => setShowTitleEdit(false)} title="Rename Document" size="sm">
          <div className="space-y-4">
              <PremiumInput label="Document Title" value={titleEditValue} onChange={setTitleEditValue} placeholder="Title" />
              <div className="flex justify-end gap-3">
                  <PremiumButton variant="ghost" onClick={() => setShowTitleEdit(false)}>Cancel</PremiumButton>
                  <PremiumButton onClick={() => { if (titleEditValue.trim()) { updateDocumentState({ title: titleEditValue }); setShowTitleEdit(false); } }}>Save</PremiumButton>
              </div>
          </div>
      </PremiumModal>
      
      <PremiumModal isOpen={showDraftRestore} onClose={discardDraft} title="Restore Draft?" size="sm">
          <div className="space-y-4">
              <div className="bg-[#FFFBEB] border border-[#FEF3C7] p-4 rounded-[14px] flex gap-3">
                  <div className="text-[#F59E0B] mt-0.5"><Icon name="alert-triangle" size="sm" /></div>
                  <div className="text-sm text-[#92400E]">
                      Unsaved draft found from <b>{pendingDraft ? new Date(pendingDraft.updatedAt).toLocaleString() : ''}</b>.
                  </div>
              </div>
              <div className="flex justify-end gap-3">
                  <PremiumButton variant="ghost" onClick={discardDraft}>Discard</PremiumButton>
                  <PremiumButton onClick={restoreDraft}>Restore</PremiumButton>
              </div>
          </div>
      </PremiumModal>
    </div>
  );
};

export default CreatePdfPage;