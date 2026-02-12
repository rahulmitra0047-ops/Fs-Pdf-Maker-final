import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router-dom';
import { Document, MCQ, DocumentSettings, FooterSettings, CoverPageSettings, TableOfContentsSettings, AnswerKeySettings, PageSetting, WatermarkSettings } from '../../../types';
import { documentService, mcqSetService, topicService, subtopicService, logAction } from '../../../core/storage/services';
import { generateSerialId } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

const DEFAULT_WATERMARK: WatermarkSettings = {
    enabled: false,
    text: '',
    style: 'diagonal',
    position: 'center',
    fontSize: 'large',
    opacity: 15,
    color: '#9ca3af'
};

const DEFAULT_SETTINGS: DocumentSettings = {
  paperSize: 'A4',
  perColumn: 5,
  density: 'dense',
  fontStep: 20,
  optionStyle: 'english',
  fontStyle: 'classic',
  showExplanations: false,
  theme: 'classic',
  borderStyle: 'solid',
  lineSpacing: 'normal',
  margins: { preset: 'normal', top: 8, bottom: 8, left: 8, right: 8 },
  showAnswerInMCQ: true,
  watermark: DEFAULT_WATERMARK,
  pageNumberStyle: 'english',
  showSource: true,
};

const DEFAULT_FOOTER: FooterSettings = {
    authorName: '',
    bookName: '',
    showFooter: true
};

const DEFAULT_COVER: CoverPageSettings = {
    enabled: false, mainTitle: '', subtitle: '', chapter: '', author: '', publisher: '', year: new Date().getFullYear().toString(),
    alignment: 'center', titleColor: '#000000', layoutStyle: 'classic'
};

const DEFAULT_TOC: TableOfContentsSettings = {
    enabled: false, title: 'Contents', numberStyle: 'english', lineStyle: 'dotted', excludeSections: []
};

const DEFAULT_ANSWER_KEY: AnswerKeySettings = {
    enabled: false, title: 'Answer Key', columns: 5, groupByTitle: true
};

export const useCreatePdfState = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const toast = useToast();
  
  // Document State
  const [document, setDocument] = useState<Document>({
      id: '',
      title: 'New Document',
      mcqs: [],
      settings: DEFAULT_SETTINGS,
      footer: DEFAULT_FOOTER,
      coverPage: DEFAULT_COVER,
      toc: DEFAULT_TOC,
      answerKey: DEFAULT_ANSWER_KEY,
      pageSettings: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
  });
  
  // UI State
  const [activeTab, setActiveTab] = useState<'settings' | 'editor' | 'preview'>('editor');
  const [settingsSubTab, setSettingsSubTab] = useState('page'); 
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isLoading, setIsLoading] = useState(true);
  
  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  
  // Draft Logic
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Document | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = docId ? `draft_doc_${docId}` : 'draft_new_doc';
  const loadedExportRef = useRef<string | null>(null);

  // Load Logic
  useEffect(() => {
    const loadDoc = async () => {
      const mode = searchParams.get('mode');
      const source = searchParams.get('source');
      const sourceId = searchParams.get('sourceId');
      
      if (mode === 'export' && sourceId) {
          if (loadedExportRef.current === sourceId) { setIsLoading(false); return; }
          loadedExportRef.current = sourceId;
          try {
              let mcqs: MCQ[] = [];
              let docTitle = "Exported Document";
              let sections: {title: string, startIndex: number}[] = [];

              if (source === 'set') {
                  const set = await mcqSetService.getById(sourceId);
                  if (set) {
                      docTitle = set.name;
                      mcqs = set.mcqs;
                      sections.push({ title: set.name, startIndex: 0 });
                  }
              } else if (source === 'subtopic') {
                  const subtopic = await subtopicService.getById(sourceId);
                  if (subtopic) {
                      docTitle = subtopic.name;
                      const sets = await mcqSetService.where('subtopicId', sourceId);
                      sets.sort((a,b) => b.updatedAt - a.updatedAt);
                      let currentIndex = 0;
                      sets.forEach(s => {
                          if (s.mcqs.length > 0) {
                              sections.push({ title: s.name, startIndex: currentIndex });
                              mcqs.push(...s.mcqs);
                              currentIndex += s.mcqs.length;
                          }
                      });
                  }
              } else if (source === 'topic') {
                  const topic = await topicService.getById(sourceId);
                  if (topic) {
                      docTitle = topic.name;
                      const allSubtopics = await subtopicService.where('topicId', sourceId);
                      const subtopicIds = allSubtopics.map(s => s.id);
                      const allSets = await mcqSetService.getAll();
                      const relevantSets = allSets.filter(s => subtopicIds.includes(s.subtopicId));
                      relevantSets.sort((a, b) => b.updatedAt - a.updatedAt);
                      let currentIndex = 0;
                      relevantSets.forEach(s => {
                          if (s.mcqs.length > 0) {
                              const subName = allSubtopics.find(sub => sub.id === s.subtopicId)?.name || '';
                              sections.push({ title: `${subName} - ${s.name}`, startIndex: currentIndex });
                              mcqs.push(...s.mcqs);
                              currentIndex += s.mcqs.length;
                          }
                      });
                  }
              }

              if (mcqs.length > 0) {
                  const pageSettings: PageSetting[] = [];
                  const perPage = DEFAULT_SETTINGS.perColumn * 2;
                  sections.forEach(sec => {
                      const estimatedPage = Math.floor(sec.startIndex / perPage) + 1;
                      if (!pageSettings.find(p => p.pageNumber === estimatedPage)) {
                          pageSettings.push({ pageNumber: estimatedPage, title: sec.title });
                      }
                  });
                  setDocument({
                      id: '', title: docTitle, mcqs: mcqs, settings: DEFAULT_SETTINGS,
                      footer: DEFAULT_FOOTER, coverPage: DEFAULT_COVER, toc: DEFAULT_TOC,
                      answerKey: DEFAULT_ANSWER_KEY, pageSettings: pageSettings,
                      createdAt: Date.now(), updatedAt: Date.now()
                  });
                  toast.success(`✓ Loaded ${mcqs.length} MCQs`);
              } else {
                  toast.error("Source empty");
                  navigate('/'); 
              }
          } catch (e) { console.error(e); toast.error("Failed to load source"); }
          setIsLoading(false);
          return;
      }

      if (docId) {
        loadedExportRef.current = null;
        const doc = await documentService.getById(docId);
        if (doc) {
          setDocument({
              ...doc,
              settings: { ...DEFAULT_SETTINGS, ...doc.settings },
              footer: { ...DEFAULT_FOOTER, ...doc.footer },
              coverPage: { ...DEFAULT_COVER, ...doc.coverPage },
              toc: { ...DEFAULT_TOC, ...doc.toc },
              answerKey: { ...DEFAULT_ANSWER_KEY, ...doc.answerKey },
              pageSettings: doc.pageSettings || [],
              mergedFrom: doc.mergedFrom 
          });
        } else {
          toast.error("Document not found");
          navigate('/create');
        }
      }
      setIsLoading(false);
    };
    loadDoc();
  }, [docId, navigate, toast, searchParams]);

  // Autosave
  useEffect(() => {
      if (isDirty) {
          setSaveStatus('unsaved');
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = setTimeout(async () => {
              setSaveStatus('saving');
              localStorage.setItem(draftKey, JSON.stringify({ ...document, updatedAt: Date.now() }));
              setSaveStatus('saved');
          }, 2000); 
      }
      return () => {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      };
  }, [document, isDirty, draftKey]);

  // Draft Check
  useEffect(() => {
      const checkDraft = async () => {
          const savedDraft = localStorage.getItem(draftKey);
          if (savedDraft) {
              try {
                  const draftDoc = JSON.parse(savedDraft) as Document;
                  if (docId) {
                      const dbDoc = await documentService.getById(docId);
                      if (dbDoc && draftDoc.updatedAt > dbDoc.updatedAt) {
                          setPendingDraft(draftDoc);
                          setShowDraftRestore(true);
                      }
                  } else {
                      setPendingDraft(draftDoc);
                      setShowDraftRestore(true);
                  }
              } catch (e) {
                  localStorage.removeItem(draftKey);
              }
          }
      };
      setTimeout(checkDraft, 500);
  }, [docId, draftKey]);

  const updateDocumentState = (updates: Partial<Document>) => {
      setDocument(prev => ({ ...prev, ...updates }));
      setIsDirty(true);
  };

  const saveDocument = async (showToast = true) => {
      let currentDoc = { ...document, updatedAt: Date.now() };
      if (!currentDoc.id) {
          const newId = await generateSerialId();
          currentDoc.id = newId;
          if (currentDoc.title === 'New Document') currentDoc.title = `Document ${newId}`;
          await documentService.create(currentDoc);
          logAction('create', 'document', newId);
          setDocument(currentDoc);
          setIsDirty(false);
          localStorage.removeItem('draft_new_doc');
          if(showToast) {
            toast.success(`Saved as ${newId}`);
            navigate(`/create/${newId}`, { replace: true });
          }
      } else {
          await documentService.update(currentDoc.id, currentDoc);
          logAction('update', 'document', currentDoc.id);
          setDocument(currentDoc);
          setIsDirty(false);
          localStorage.removeItem(`draft_doc_${currentDoc.id}`);
          if(showToast) toast.success("Changes saved");
      }
      return currentDoc;
  };

  return {
    document,
    updateDocumentState,
    saveDocument,
    isLoading,
    isDirty,
    saveStatus,
    activeTab,
    setActiveTab,
    settingsSubTab,
    setSettingsSubTab,
    isExporting,
    setIsExporting,
    exportStatus,
    setExportStatus,
    showDraftRestore,
    setShowDraftRestore,
    pendingDraft,
    setPendingDraft,
    setIsDirty,
    location,
    draftKey
  };
};