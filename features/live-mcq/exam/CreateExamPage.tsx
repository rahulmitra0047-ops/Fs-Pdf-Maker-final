
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumCard from '../../../shared/components/PremiumCard';
import PremiumButton from '../../../shared/components/PremiumButton';
import PremiumInput from '../../../shared/components/PremiumInput';
import { topicService, subtopicService, mcqSetService, examTemplateService } from '../../../core/storage/services';
import { Topic, Subtopic, MCQSet, ExamTemplate } from '../../../types';
import { useToast } from '../../../shared/context/ToastContext';
import { generateUUID } from '../../../core/storage/idGenerator';
import Icon from '../../../shared/components/Icon';

const STEPS = {
    SOURCES: 1,
    SETTINGS: 2,
    REVIEW: 3
};

const CreateExamPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(STEPS.SOURCES);
  
  // Data
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [sets, setSets] = useState<MCQSet[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  
  // Selection
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [totalSelectedMCQs, setTotalSelectedMCQs] = useState(0);

  // Settings
  const [settings, setSettings] = useState({
      totalQuestions: 20,
      timeLimit: 15,
      negativeMarking: false,
      negativePenalty: 0.25,
      passingScore: 60,
      shuffleQuestions: true,
      shuffleOptions: true
  });

  // Template Save
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
      // Load all data structure
      const loadData = async () => {
          const t = await topicService.getAll();
          const st = await subtopicService.getAll();
          const s = await mcqSetService.getAll();
          setTopics(t);
          setSubtopics(st);
          setSets(s);
      };
      loadData();
  }, []);

  // Update total count when selection changes
  useEffect(() => {
      let count = 0;
      sets.forEach(s => {
          if (selectedSetIds.has(s.id)) count += s.mcqs.length;
      });
      setTotalSelectedMCQs(count);
      
      // Auto adjust question count cap
      if (settings.totalQuestions > count) {
          setSettings(prev => ({...prev, totalQuestions: count || 5}));
      }
  }, [selectedSetIds, sets]);

  const toggleTopicExpand = (id: string) => {
      const newSet = new Set(expandedTopics);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedTopics(newSet);
  };

  const toggleSetSelection = (id: string) => {
      const newSet = new Set(selectedSetIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedSetIds(newSet);
  };

  const selectAllInTopic = (topicId: string) => {
      const subtopicIds = subtopics.filter(st => st.topicId === topicId).map(st => st.id);
      const setsInTopic = sets.filter(s => subtopicIds.includes(s.subtopicId));
      
      const newSet = new Set(selectedSetIds);
      const allSelected = setsInTopic.every(s => newSet.has(s.id));
      
      if (allSelected) {
          setsInTopic.forEach(s => newSet.delete(s.id));
      } else {
          setsInTopic.forEach(s => newSet.add(s.id));
      }
      setSelectedSetIds(newSet);
  };

  const handleStartExam = async () => {
      if (saveAsTemplate && templateName.trim()) {
          const template: ExamTemplate = {
              id: generateUUID(),
              name: templateName,
              sourceIds: Array.from(selectedSetIds),
              settings: settings,
              createdAt: Date.now(),
              usedCount: 0
          };
          await examTemplateService.create(template);
      }

      // Config payload for active exam
      const examConfig = {
          sourceIds: Array.from(selectedSetIds),
          settings: settings
      };

      navigate('/live-mcq/exam-center/active', { state: { config: examConfig } });
  };

  // --- Components ---

  const renderHeader = () => (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
            <button 
                onClick={() => {
                    if (step > STEPS.SOURCES) setStep(step - 1);
                    else navigate('/live-mcq/exam-center');
                }}
                className="p-2 -ml-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
            >
                <Icon name="arrow-left" size="md" />
            </button>
        </div>
        <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            <h1 className="text-[18px] font-semibold text-[#111827] tracking-tight">
                Create Exam
            </h1>
            <span className="text-[18px] font-normal text-[#9CA3AF]">({step}/3)</span>
        </div>
        <button 
            onClick={() => navigate('/')}
            className="p-2 -mr-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
        >
            <Icon name="home" size="md" />
        </button>
    </header>
  );

  const renderSources = () => (
      <div className="space-y-4 pb-32">
          {/* Instruction Card */}
          <div className="bg-[#F9FAFB] rounded-[18px] p-[20px] animate-in fade-in slide-in-from-top-2">
              <h3 className="text-[17px] font-semibold text-[#111827]">Select MCQ Sources</h3>
              <p className="text-[14px] text-[#9CA3AF] mt-1">Choose topics or specific sets</p>
          </div>

          <div className="space-y-3">
              {topics.map(topic => {
                  const relevantSubtopics = subtopics.filter(st => st.topicId === topic.id);
                  const isExpanded = expandedTopics.has(topic.id);
                  
                  return (
                      <div 
                        key={topic.id} 
                        className={`bg-white border border-[#F3F4F6] rounded-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-1 ring-[#F3F4F6]' : ''}`}
                      >
                          <div 
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F9FAFB] transition-colors" 
                            onClick={() => toggleTopicExpand(topic.id)}
                          >
                              <div className="flex items-center gap-3">
                                  <span className={`text-[#6B7280] text-[12px] transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                      ▼
                                  </span>
                                  <span className="text-[16px] font-semibold text-[#111827]">{topic.name}</span>
                              </div>
                              <button 
                                  onClick={(e) => { e.stopPropagation(); selectAllInTopic(topic.id); }}
                                  className="text-[14px] font-medium text-[#6366F1] hover:text-indigo-700 active:scale-95 transition-transform"
                              >
                                  Select All
                              </button>
                          </div>
                          
                          {isExpanded && (
                              <div className="pb-4 pt-0 px-4 space-y-4 animate-in slide-in-from-top-1 duration-150">
                                  {relevantSubtopics.map(st => {
                                      const relevantSets = sets.filter(s => s.subtopicId === st.id);
                                      if (relevantSets.length === 0) return null;

                                      return (
                                          <div key={st.id} className="pl-2">
                                              <div className="text-[14px] font-medium text-[#6B7280] mb-2 pl-1">{st.name}</div>
                                              <div className="space-y-2">
                                                  {relevantSets.map(set => {
                                                      const isSelected = selectedSetIds.has(set.id);
                                                      return (
                                                          <label key={set.id} className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                                                              <div className="relative flex items-center">
                                                                  <input 
                                                                      type="checkbox" 
                                                                      checked={isSelected}
                                                                      onChange={() => toggleSetSelection(set.id)}
                                                                      className="peer sr-only"
                                                                  />
                                                                  <div className={`w-5 h-5 border-2 rounded-[6px] transition-all duration-150 flex items-center justify-center ${isSelected ? 'bg-[#6366F1] border-[#6366F1]' : 'bg-white border-[#D1D5DB]'}`}>
                                                                      <svg className={`w-3.5 h-3.5 text-white transform transition-transform ${isSelected ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                      </svg>
                                                                  </div>
                                                              </div>
                                                              <div className="flex-1 text-[15px] text-[#374151] font-medium">{set.name}</div>
                                                              <div className="text-[13px] text-[#9CA3AF] font-medium">{set.mcqs.length}</div>
                                                          </label>
                                                      );
                                                  })}
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>
  );

  const renderSettings = () => (
      <div className="space-y-4 pb-32 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Question Count */}
          <div className="bg-white border border-[#F3F4F6] rounded-[18px] p-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-4">
                  <label className="text-[15px] font-semibold text-[#111827]">Number of Questions</label>
                  <span className="text-[12px] font-medium text-[#9CA3AF]">Max: {totalSelectedMCQs}</span>
              </div>
              
              <div className="flex items-center gap-4">
                  <div className="flex-1 relative h-6 flex items-center">
                      <input 
                          type="range" 
                          min="5" 
                          max={totalSelectedMCQs} 
                          value={settings.totalQuestions} 
                          onChange={(e) => setSettings({...settings, totalQuestions: parseInt(e.target.value)})}
                          className="w-full h-1 bg-[#F3F4F6] rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
                      />
                  </div>
                  <div className="w-[60px] h-[40px] flex items-center justify-center bg-[#F9FAFB] border border-[#F3F4F6] rounded-[10px] text-[16px] font-bold text-[#111827]">
                      {settings.totalQuestions}
                  </div>
              </div>
          </div>

          {/* Time Limit */}
          <div className="bg-white border border-[#F3F4F6] rounded-[18px] p-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <label className="block text-[15px] font-semibold text-[#111827] mb-3">Time Limit</label>
              <div className="grid grid-cols-3 gap-[8px] mb-3">
                  {[15, 20, 30, 45, 60, 90].map(t => (
                      <button 
                          key={t}
                          onClick={() => setSettings({...settings, timeLimit: t})}
                          className={`
                              py-[10px] px-[16px] text-[14px] font-medium rounded-[12px] border transition-all duration-200
                              ${settings.timeLimit === t 
                                  ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-md shadow-indigo-200' 
                                  : 'bg-white border-[#F3F4F6] text-[#6B7280] hover:bg-gray-50'
                              }
                          `}
                      >
                          {t} min
                      </button>
                  ))}
              </div>
              <div className="text-[12px] text-[#9CA3AF] text-center">
                  Approx {Math.round((settings.timeLimit * 60) / settings.totalQuestions)} seconds per question
              </div>
          </div>

          {/* Negative Marking */}
          <div className="bg-white border border-[#F3F4F6] rounded-[18px] p-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setSettings({...settings, negativeMarking: !settings.negativeMarking})}>
                  <span className="text-[15px] font-semibold text-[#111827]">Negative Marking</span>
                  <div className="relative flex items-center">
                      <input 
                          type="checkbox" 
                          checked={settings.negativeMarking}
                          onChange={(e) => setSettings({...settings, negativeMarking: e.target.checked})}
                          className="peer sr-only" 
                      />
                      <div className="w-[22px] h-[22px] bg-white border-2 border-[#D1D5DB] rounded-[6px] transition-all peer-checked:bg-[#6366F1] peer-checked:border-[#6366F1] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                      </div>
                  </div>
              </div>
              
              {settings.negativeMarking && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                      <label className="block text-[13px] font-medium text-[#6B7280] mb-2">Penalty per wrong answer</label>
                      <div className="grid grid-cols-4 gap-[8px]">
                          {[0.25, 0.33, 0.5, 1.0].map(p => (
                              <button 
                                  key={p}
                                  onClick={() => setSettings({...settings, negativePenalty: p})}
                                  className={`
                                      py-[8px] text-[13px] font-medium rounded-[10px] border transition-all
                                      ${settings.negativePenalty === p 
                                          ? 'bg-red-50 border-red-200 text-red-600 ring-1 ring-red-200' 
                                          : 'bg-white border-[#F3F4F6] text-[#6B7280] hover:bg-gray-50'
                                      }
                                  `}
                              >
                                  -{p}
                              </button>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          {/* Passing Score */}
          <div className="bg-white border border-[#F3F4F6] rounded-[18px] p-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <label className="block text-[15px] font-semibold text-[#111827] mb-4">Passing Score</label>
              <div className="flex items-center gap-4">
                  <div className="flex-1 relative h-6 flex items-center">
                      <input 
                          type="range" 
                          min="33" 
                          max="90" 
                          step="1"
                          value={settings.passingScore} 
                          onChange={(e) => setSettings({...settings, passingScore: parseInt(e.target.value)})}
                          className="w-full h-1 bg-[#F3F4F6] rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
                      />
                  </div>
                  <div className="w-[60px] text-right text-[18px] font-bold text-[#6366F1]">
                      {settings.passingScore}%
                  </div>
              </div>
          </div>
      </div>
  );

  const renderReview = () => (
      <div className="space-y-4 pb-32 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Exam Summary Card */}
          <div className="rounded-[24px] p-[24px] shadow-lg" style={{ background: 'linear-gradient(135deg, #1E1B4B, #312E81)' }}>
              <h2 className="text-[20px] font-bold text-white mb-[20px]">Exam Summary</h2>
              <div className="space-y-[12px]">
                  <div className="flex justify-between items-center">
                      <span className="text-[14px] font-normal text-white/60">Sources</span>
                      <span className="text-[14px] font-semibold text-white">{selectedSetIds.size} Sets</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-[14px] font-normal text-white/60">Questions</span>
                      <span className="text-[14px] font-semibold text-white">{settings.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-[14px] font-normal text-white/60">Time</span>
                      <span className="text-[14px] font-semibold text-white">{settings.timeLimit} mins</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-[14px] font-normal text-white/60">Passing</span>
                      <span className="text-[14px] font-semibold text-white">{settings.passingScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-[14px] font-normal text-white/60">Negative Marking</span>
                      <span className="text-[14px] font-semibold text-white">{settings.negativeMarking ? `On (-${settings.negativePenalty})` : 'Off'}</span>
                  </div>
              </div>
          </div>

          {/* Save as Template */}
          <div className="bg-white border border-[#F3F4F6] rounded-[18px] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] mt-[16px]">
              <div 
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setSaveAsTemplate(!saveAsTemplate)}
              >
                  <div className="relative flex items-center">
                      <input 
                          type="checkbox" 
                          checked={saveAsTemplate}
                          onChange={(e) => setSaveAsTemplate(e.target.checked)}
                          className="peer sr-only" 
                      />
                      <div className="w-[22px] h-[22px] bg-white border-2 border-[#D1D5DB] rounded-[6px] transition-all peer-checked:bg-[#6366F1] peer-checked:border-[#6366F1] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                      </div>
                  </div>
                  <span className="text-[15px] font-medium text-[#374151]">Save as Template</span>
              </div>
              
              {saveAsTemplate && (
                  <div className="mt-4 animate-in slide-in-from-top-1 fade-in">
                      <PremiumInput 
                          placeholder="e.g. Physics Weekly Test"
                          value={templateName}
                          onChange={setTemplateName}
                      />
                  </div>
              )}
          </div>
      </div>
  );

  const renderFooter = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F3F4F6] p-[16px_20px] z-40 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
            {step === STEPS.SOURCES ? (
                <>
                    <div className="flex flex-col">
                        <span className="text-[12px] font-medium text-[#9CA3AF]">Selected</span>
                        <span className="text-[16px] font-bold text-[#111827]">{totalSelectedMCQs} MCQs</span>
                    </div>
                    <button 
                        onClick={() => setStep(STEPS.SETTINGS)}
                        disabled={totalSelectedMCQs < 5}
                        className="bg-[#6366F1] text-white px-7 py-3.5 rounded-[14px] text-[15px] font-semibold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm"
                    >
                        Next: Settings →
                    </button>
                </>
            ) : step === STEPS.SETTINGS ? (
                <button 
                    onClick={() => setStep(STEPS.REVIEW)}
                    className="w-full bg-[#6366F1] text-white py-[16px] rounded-[16px] text-[16px] font-semibold active:scale-[0.98] transition-transform hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                    Next: Review →
                </button>
            ) : (
                <button 
                    onClick={handleStartExam} 
                    className="w-full bg-[#6366F1] text-white py-[16px] rounded-[16px] text-[16px] font-semibold active:scale-[0.98] transition-transform hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                    Start Exam
                </button>
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-[60px]">
        {renderHeader()}

        <div className="max-w-3xl mx-auto px-5 mt-4">
            {step === STEPS.SOURCES && renderSources()}
            {step === STEPS.SETTINGS && renderSettings()}
            {step === STEPS.REVIEW && renderReview()}
        </div>

        {renderFooter()}
    </div>
  );
};

export default CreateExamPage;
