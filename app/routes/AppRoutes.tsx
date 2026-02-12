
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteNotFound from '../../shared/components/RouteNotFound';
import SuspenseFallback from '../../shared/components/SuspenseFallback';

// Lazy Imports for Bundle Splitting (Production Optimization)
const HomePage = lazy(() => import('../../features/home/HomePage'));
const CreatePdfPage = lazy(() => import('../../features/create-pdf/CreatePdfPage'));
const RecentDocsPage = lazy(() => import('../../features/recent/RecentDocsPage'));
const SettingsPage = lazy(() => import('../../features/settings/SettingsPage'));
const PrintPage = lazy(() => import('../../features/print/PrintPage'));

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

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* PDF Maker Routes */}
        <Route path="/create" element={<CreatePdfPage />} />
        <Route path="/create/:docId" element={<CreatePdfPage />} />
        <Route path="/recent" element={<RecentDocsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/print/:docId" element={<PrintPage />} />
        
        {/* Live MCQ Routes - Landing Removed */}
        <Route path="/live-mcq/topics" element={<TopicListPage />} />
        <Route path="/live-mcq/topic/:topicId" element={<TopicDetailPage />} />
        <Route path="/live-mcq/topic/:topicId/subtopic/:subtopicId" element={<SubtopicDetailPage />} />
        <Route path="/live-mcq/set/:setId" element={<SetDetailPage />} />
        
        {/* Legacy Modes (Single Set) */}
        <Route path="/live-mcq/practice" element={<PracticeSession />} />
        <Route path="/live-mcq/practice/:setId" element={<PracticeSession />} />
        <Route path="/live-mcq/exam/:setId" element={<ExamSession />} />
        <Route path="/live-mcq/result/:attemptId" element={<ResultPage />} />

        {/* New Advanced Exam System */}
        <Route path="/live-mcq/exam-center" element={<ExamCenterPage />} />
        <Route path="/live-mcq/exam-center/create" element={<CreateExamPage />} />
        <Route path="/live-mcq/exam-center/active" element={<ActiveExamPage />} />
        <Route path="/live-mcq/exam-center/result/:attemptId" element={<AdvancedResultPage />} />

        <Route path="*" element={<RouteNotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
