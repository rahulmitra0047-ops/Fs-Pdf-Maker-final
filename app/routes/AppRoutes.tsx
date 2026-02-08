
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteNotFound from '../../shared/components/RouteNotFound';

// Static Imports (Critical Fix: Prevent dynamic chunk loading errors in preview)
import HomePage from '../../features/home/HomePage';
import CreatePdfPage from '../../features/create-pdf/CreatePdfPage';
import RecentDocsPage from '../../features/recent/RecentDocsPage';
import SettingsPage from '../../features/settings/SettingsPage';
import PrintPage from '../../features/print/PrintPage';

// Live MCQ Pages
import LiveMcqPage from '../../features/live-mcq/LiveMcqPage';
import TopicListPage from '../../features/live-mcq/TopicListPage';
import TopicDetailPage from '../../features/live-mcq/TopicDetailPage';
import SubtopicDetailPage from '../../features/live-mcq/SubtopicDetailPage';
import SetDetailPage from '../../features/live-mcq/SetDetailPage';
import PracticeSession from '../../features/live-mcq/mode/PracticeSession';
import ExamSession from '../../features/live-mcq/mode/ExamSession';
import ResultPage from '../../features/live-mcq/result/ResultPage';

// New Exam Module Pages
import ExamCenterPage from '../../features/live-mcq/exam/ExamCenterPage';
import CreateExamPage from '../../features/live-mcq/exam/CreateExamPage';
import ActiveExamPage from '../../features/live-mcq/exam/ActiveExamPage';
import AdvancedResultPage from '../../features/live-mcq/exam/AdvancedResultPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      
      {/* PDF Maker Routes */}
      <Route path="/create" element={<CreatePdfPage />} />
      <Route path="/create/:docId" element={<CreatePdfPage />} />
      <Route path="/recent" element={<RecentDocsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/print/:docId" element={<PrintPage />} />
      
      {/* Live MCQ Routes */}
      <Route path="/live-mcq" element={<LiveMcqPage />} />
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
  );
};

export default AppRoutes;
