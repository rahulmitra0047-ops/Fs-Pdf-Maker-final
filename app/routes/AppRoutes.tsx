


import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteNotFound from '../../shared/components/RouteNotFound';
import SuspenseFallback from '../../shared/components/SuspenseFallback';
import MainLayout from '../../shared/components/MainLayout';
import ComingSoonPage from '../../shared/components/ComingSoonPage';

// Lazy Imports for Bundle Splitting (Production Optimization)
const CreatePdfPage = lazy(() => import('../../features/create-pdf/CreatePdfPage'));
const RecentDocsPage = lazy(() => import('../../features/recent/RecentDocsPage'));
const SettingsPage = lazy(() => import('../../features/settings/SettingsPage'));
const PrintPage = lazy(() => import('../../features/print/PrintPage'));
const HomePage = lazy(() => import('../../features/home/HomePage')); // Added HomePage

// Live MCQ Pages
const TopicListPage = lazy(() => import('../../features/live-mcq/TopicListPage'));
const TopicDetailPage = lazy(() => import('../../features/live-mcq/TopicDetailPage'));
const SubtopicDetailPage = lazy(() => import('../../features/live-mcq/SubtopicDetailPage'));
const SetDetailPage = lazy(() => import('../../features/live-mcq/SetDetailPage'));
const PracticeSession = lazy(() => import('../../features/live-mcq/mode/PracticeSession'));
const ExamSession = lazy(() => import('../../features/live-mcq/mode/ExamSession'));
const ResultPage = lazy(() => import('../../features/live-mcq/result/ResultPage'));

// Exam Module Pages
const ExamCenterPage = lazy(() => import('../../features/live-mcq/exam/ExamCenterPage'));
const CreateExamPage = lazy(() => import('../../features/live-mcq/exam/CreateExamPage'));
const ActiveExamPage = lazy(() => import('../../features/live-mcq/exam/ActiveExamPage'));
const AdvancedResultPage = lazy(() => import('../../features/live-mcq/exam/AdvancedResultPage'));

// Learn Module Pages
const LessonListPage = lazy(() => import('../../features/learn/LessonListPage'));
const LessonDetailPage = lazy(() => import('../../features/learn/LessonDetailPage'));

// Flashcard Pages
const FlashcardHome = lazy(() => import('../../features/flashcard/FlashcardHome'));
const NewWordsPage = lazy(() => import('../../features/flashcard/NewWordsPage'));
const DailyWordsPage = lazy(() => import('../../features/flashcard/DailyWordsPage'));
const MasteredWordsPage = lazy(() => import('../../features/flashcard/MasteredWordsPage'));
const ReviewFlashcardPage = lazy(() => import('../../features/flashcard/ReviewFlashcardPage'));
const FlashcardQuizPage = lazy(() => import('../../features/flashcard/FlashcardQuizPage'));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Redirect Root to First Tab (Home) */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          {/* Tab Routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/learn" element={<LessonListPage />} />
          <Route path="/learn/lesson/:lessonId" element={<LessonDetailPage />} />
          <Route path="/practice" element={<LessonListPage />} />

          <Route path="/create" element={<CreatePdfPage />} />
          <Route path="/create/:docId" element={<CreatePdfPage />} />
          <Route path="/recent" element={<RecentDocsPage />} />
          
          {/* Live MCQ - Browsing Routes */}
          <Route path="/live-mcq/topics" element={<TopicListPage />} />
          <Route path="/live-mcq/topic/:topicId" element={<TopicDetailPage />} />
          <Route path="/live-mcq/topic/:topicId/subtopic/:subtopicId" element={<SubtopicDetailPage />} />
          <Route path="/live-mcq/set/:setId" element={<SetDetailPage />} />
          <Route path="/live-mcq/result/:attemptId" element={<ResultPage />} />
          
          {/* Exam Center - Dashboard & Results */}
          <Route path="/live-mcq/exam-center" element={<ExamCenterPage />} />
          <Route path="/live-mcq/exam-center/result/:attemptId" element={<AdvancedResultPage />} />
        </Route>
        
        {/* Settings Route */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/print/:docId" element={<PrintPage />} />
        
        {/* Flashcards */}
        <Route path="/flashcards" element={<FlashcardHome />} />
        <Route path="/flashcards/new" element={<NewWordsPage />} />
        <Route path="/flashcards/daily" element={<DailyWordsPage />} />
        <Route path="/flashcards/mastered" element={<MasteredWordsPage />} />
        <Route path="/flashcards/review/:date" element={<ReviewFlashcardPage />} />
        <Route path="/flashcards/quiz" element={<FlashcardQuizPage />} />

        {/* Live MCQ - Immersive/Active Modes (No Bottom Nav) */}
        <Route path="/live-mcq/practice" element={<PracticeSession />} />
        <Route path="/live-mcq/practice/:setId" element={<PracticeSession />} />
        <Route path="/live-mcq/exam/:setId" element={<ExamSession />} />
        
        {/* Exam Creation Wizard & Active Exam (No Bottom Nav) */}
        <Route path="/live-mcq/exam-center/create" element={<CreateExamPage />} />
        <Route path="/live-mcq/exam-center/active" element={<ActiveExamPage />} />

        <Route path="*" element={<RouteNotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
