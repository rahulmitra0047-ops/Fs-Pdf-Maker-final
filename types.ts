








// Core Entity Types

export interface MCQ {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  source?: string;
  fingerprint?: string; // For deduplication
  createdAt?: number;
}

export interface MergedSource {
  docId: string;
  docTitle: string;
  mcqCount: number;
  mcqRange: [number, number];
  settings?: DocumentSettings; // Added to preserve original layout
}

export interface Document {
  id: string;
  title: string;
  mcqs: MCQ[];
  settings: DocumentSettings;
  createdAt: number;
  updatedAt: number;
  isArchived?: boolean; // Feature C
  
  // Optional Sections
  footer?: FooterSettings;
  coverPage?: CoverPageSettings;
  toc?: TableOfContentsSettings;
  answerKey?: AnswerKeySettings;
  pageSettings?: PageSetting[];
  
  // Merging
  isMerged?: boolean;
  mergedFrom?: MergedSource[];
}

// PDF Configuration Types

export interface DocumentSettings {
  // Page Setup
  paperSize: 'A4' | 'A5' | 'A3' | 'Letter' | 'Legal' | 'B5';
  orientation?: 'portrait' | 'landscape';
  perColumn: number; // 1-10
  columnLine?: boolean;
  
  // Margins
  margins: MarginSettings;
  
  // Page Border
  pageBorder?: {
    enabled: boolean;
    style: string; // 'simple', 'double', 'dashed', 'dotted', 'thick', 'decorative-classic', 'decorative-modern', 'rounded'
    color: string;
  };

  // Header
  header?: {
    enabled: boolean;
    text: string;
    position: 'left' | 'center' | 'right';
  };

  // Typography & Content
  density: 'dense' | 'ultra' | 'comfortable' | 'ultra-max';
  fontStep: number; // Base font size
  fontFamily?: string;
  
  // Granular Font Sizes
  questionFontSize?: 'small' | 'medium' | 'large';
  optionFontSize?: 'small' | 'medium' | 'large';
  tagFontSize?: 'small' | 'medium';

  // Colors
  fontColor?: string;
  questionColor?: string;
  optionColor?: string;
  answerColor?: string;

  // Option Styling
  optionStyle: 'english' | 'bengali' | 'lowercase' | 'roman' | 'numeric';
  optionLayout?: 'vertical' | 'grid' | 'inline';
  fontStyle: 'classic' | 'modern';
  
  // Toggles & Logic
  showExplanations: boolean;
  explanationPosition?: 'below' | 'end_page' | 'separate';
  explanationItalic?: boolean;

  showAnswerInMCQ: boolean;
  highlightStyle?: 'bold' | 'color' | 'background' | 'underline' | 'checkmark';
  highlightColor?: string;

  showSource: boolean;
  
  // Question Numbering
  questionNumbering?: '1,2,3' | 'Q1,Q2,Q3' | 'প্রশ্ন ১';
  numberingReset?: boolean; // Reset per page
  questionNumberStyle?: 'plain' | 'circle' | 'filled-circle' | 'square' | 'rounded-square';
  questionNumberColor?: string;

  // Design & Branding
  theme: string; // Presets + custom hex
  borderStyle: string; // 'solid', 'dashed', 'dotted', 'double', 'thick', 'rounded', 'shadow', 'none'
  borderThickness?: 'thin' | 'medium' | 'thick';
  borderColor?: string;
  borderRounded?: boolean;

  lineSpacing: 'tight' | 'compact' | 'normal' | 'relaxed';
  questionGap?: 'tight' | 'normal' | 'relaxed';
  optionGap?: 'tight' | 'normal' | 'relaxed';

  background?: {
    style: 'none' | 'dots' | 'lines' | 'grid' | 'solid';
    color?: string;
  };

  mcqBoxStyle?: 'clean' | 'bordered' | 'left-border' | 'shaded' | 'underlined';

  watermark: WatermarkSettings;
  pageNumberStyle: 'english' | 'bengali' | 'hidden';
}

export interface MarginSettings {
  preset: 'none' | 'minimal' | 'normal' | 'wide' | 'custom';
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  style: 'diagonal' | 'horizontal' | 'repeated' | 'corner' | 'top-center';
  position: 'top' | 'center' | 'bottom';
  fontSize: 'small' | 'medium' | 'large' | 'xl' | number; // Support number for custom slider
  rotation?: number; // Custom rotation
  opacity: number; // 0-100
  color: string;
}

export interface FooterSettings {
  showFooter: boolean;
  authorName: string;
  bookName: string;
  // New
  position?: 'left' | 'center' | 'right';
  pageNumberFormat?: '1,2,3' | 'i,ii,iii' | 'Page 1 of N' | '১,২,৩';
  fontSize?: 'small' | 'medium';
  dividerLine?: boolean;
}

export interface CoverPageSettings {
  enabled: boolean;
  mainTitle: string;
  subtitle: string;
  chapter: string;
  author: string;
  publisher: string;
  year: string;
  alignment?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  
  // Styling
  titleColor?: string;
  layoutStyle?: 'minimal' | 'classic' | 'modern' | 'academic' | 'clean';
  
  titleFontSize?: 'small' | 'medium' | 'large' | 'xl';
  titleFontWeight?: 'regular' | 'bold' | 'extra-bold';
  subtitleFontSize?: 'small' | 'medium' | 'large';
  subtitleColor?: string;

  // Extra Fields
  institution?: string;
  dateField?: boolean;
  dateType?: 'auto' | 'custom';
  customDate?: string;

  // Border
  borderEnabled?: boolean;
  borderStyle?: 'none' | 'simple' | 'double' | 'decorative';
}

export interface TableOfContentsSettings {
  enabled: boolean;
  title: string;
  numberStyle: 'bengali' | 'english';
  style?: 'simple' | 'dotted' | 'modern';
  showQuestionCount?: boolean;
  excludeSections?: string[];
  lineStyle?: 'dotted' | 'solid' | 'dashed'; // Legacy compatibility
}

export interface AnswerKeySettings {
  enabled: boolean;
  title: string;
  columns: number;
  groupByTitle: boolean;
  format?: 'grid' | 'list' | 'with-explanation';
}

export interface PageSetting {
  pageNumber: number;
  title: string; // Section title for this page
}

// Live MCQ / Exam Types (Unchanged)

export interface Topic {
  id: string;
  name: string;
  icon: string;
  order: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  order: number;
  createdAt: number;
  updatedAt?: number;
}

export interface MCQSet {
  id: string;
  subtopicId: string;
  name: string;
  mcqs: MCQ[];
  createdAt: number;
  updatedAt: number;
  isArchived?: boolean; // Feature C
}

export interface Attempt {
  id: string;
  setId?: string;
  examTemplateId?: string;
  mode: 'practice' | 'exam' | 'custom' | 'custom-exam';
  score: number;
  total: number;
  percentage: number;
  timeSpent: number; // seconds
  answers: Record<string, string>; // mcqId -> selectedOption
  confidence?: Record<string, 'sure' | 'guess'>;
  completedAt: number;
}

export interface AppSettings {
  id: string; // 'default'
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  railwayBaseUrl?: string;
  geminiApiKeys?: string[]; // Added for AI rotation
  preferredModel?: string; // NEW: Global model selection
  lastBackupTimestamp?: number;
}

export interface ExamTemplate {
  id: string;
  name: string;
  sourceIds: string[];
  settings: any;
  createdAt: number;
  usedCount: number;
}

export interface MCQStats {
  id: string; // usually combination of setId_mcqId
  mcqId: string;
  setId: string;
  timesAnswered: number;
  timesCorrect: number;
  accuracy: number;
}

// Feature D: Audit Log
export interface AuditLogEntry {
  id: string | number; // Support legacy number IDs or new string IDs
  action: 'create' | 'update' | 'delete' | 'import' | 'export' | 'archive' | 'unarchive' | 'restore_draft';
  entity: 'document' | 'set' | 'mcq' | 'settings' | 'system' | 'topic' | 'subtopic';
  entityId?: string;
  details?: string;
  timestamp: number;
}

// Grammar Rule Types
export interface GrammarExample {
  english: string;
  bengali: string;
  type: 'affirmative' | 'negative' | 'interrogative';
}

export interface CommonMistake {
  wrong: string;
  correct: string;
  reason: string;
}

export interface VocabItem {
  word: string;
  meaning: string;
  example?: string;
}

// Enhanced Vocabulary Types
export interface VocabExample {
  bengali: string;
  english: string;
}

export interface VocabWord {
  id: string;
  lessonId: string;
  word: string;
  meaning: string;
  type: 'Verb' | 'Noun' | 'Adjective' | 'Adverb' | 'Other';
  v1?: string;
  v1s?: string;
  v2?: string;
  v3?: string;
  vIng?: string;
  examples: VocabExample[];
  synonyms?: string;
  pronunciation?: string;
  createdAt: number;
  updatedAt: number;
  order?: number;
  
  // SRS Fields (Flashcard)
  nextReviewDate?: number; // Timestamp
  interval?: number; // Days
  repetition?: number; // Count
  easeFactor?: number; // Multiplier (default 2.5)
}

export interface GrammarRule {
  id: string;
  lessonId: string;
  title: string;
  
  // Main Content
  explanation: string;
  bengaliHint?: string;
  
  // Formulas
  formulaAffirmative?: string;
  formulaNegative?: string;
  formulaInterrogative?: string;
  
  // Arrays
  examples: GrammarExample[];
  tips?: string[];
  
  // Meta
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  order?: number;
  
  // Optional / Legacy fields
  category?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  commonMistakes?: CommonMistake[];
  signalWords?: string[];
  
  // Legacy fields compatibility
  ruleNo?: number;
  pattern?: string;
  bnHint?: string;
  legacyExamples?: string[];
}

// Practice Types
export interface TranslationHint {
  bengaliWord: string;
  englishHint: string;
}

export interface TranslationItem {
  id: string;
  lessonId: string;
  bengaliText: string;
  type?: 'job' | 'ielts'; // Optional for backwards compatibility, default job
  hints?: TranslationHint[]; // Added for translation assistance
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
  order?: number;
}

export interface PracticeTopic {
  id: string;
  lessonId: string;
  title: string;
  instruction?: string;
  type?: 'job' | 'ielts'; // default 'job'
  ieltsTaskType?: 'task2' | 'task1_academic' | 'task1_general';
  minWords?: number;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
  order?: number;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle?: string;
  order: number;
  status?: 'new' | 'in-progress' | 'completed'; // Virtual field based on content
  createdAt: number;
  updatedAt: number;
}

// Home Page Types
export interface DailyProgress {
  id: string; // date string YYYY-MM-DD
  date: string;
  completedCount: number;
  target: number;
  streak: number;
  updatedAt: number;
}

export interface UserActivity {
  id: string; // 'last_session'
  lessonId: string;
  lessonTitle: string;
  lastTab: 'grammar' | 'vocabulary' | 'practice';
  progress: number;
  updatedAt: number;
}

// Flashcard System Types (New)
export interface FlashcardBase {
  id: string;
  word: string;
  meaning: string;
  type: 'Verb' | 'Noun' | 'Adjective' | 'Adverb' | 'Other';
  verbForms?: {
    v1: string;
    v1s: string;
    v2: string;
    v3: string;
    vIng: string;
  } | null;
  examples: string[];
  synonyms: string[];
  pronunciation: string;
  createdAt: number;
  updatedAt: number;
}

export interface FlashcardNewWord extends FlashcardBase {}

export interface FlashcardDailyWord extends FlashcardBase {
  addedToDailyAt: number;
  sourceWordId: string;
}

export interface FlashcardMasteredWord extends FlashcardBase {
  addedToDailyAt: number;
  masteredAt: number;
  masteredDate: string; // YYYY-MM-DD
}

export type FlashcardWord = FlashcardNewWord | FlashcardDailyWord | FlashcardMasteredWord;
