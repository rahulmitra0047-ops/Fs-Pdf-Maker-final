
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
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-background border-b border-border z-50 px-5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
            <button 
                onClick={() => {
                    if (step > STEPS.SOURCES) setStep(step - 1);
                    else navigate('/live-mcq/exam-center');
                }}
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-none transition-colors active:scale-95"
            >
                <Icon name="arrow-left" size="md" />
            </button>
        </div>
        <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            <h1 className="font-sans text-[11px] uppercase tracking-widest font-semibold text-text-primary">
                Create Exam <span className="text-text-secondary ml-1 font-normal opacity-80">({step}/3)</span>
            </h1>
        </div>
    </header>
  );

  const renderSources = () => (
      <div className="space-y-6 pb-32">
          {/* Instruction Card */}
          <div className="bg-surface border border-border p-6 rounded-none shadow-none animate-in fade-in slide-in-from-top-2">
              <h3 className="font-serif text-[18px] font-medium text-text-primary">Select Sources</h3>
              <p className="font-sans text-[10px] uppercase tracking-widest text-text-secondary font-semibold mt-1">Choose topics or specific sets</p>
          </div>

          <div className="space-y-4">
              {topics.map(topic => {
                  const relevantSubtopics = subtopics.filter(st => st.topicId === topic.id);
                  const isExpanded = expandedTopics.has(topic.id);
                  
                  return (
                      <div 
                        key={topic.id} 
                        className={`bg-background border rounded-none transition-all duration-200 ${isExpanded ? 'border-text-primary' : 'border-border'}`}
                      >
                          <div 
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface transition-colors" 
                            onClick={() => toggleTopicExpand(topic.id)}
                          >
                              <div className="flex items-center gap-3">
                                  <span className={`text-text-secondary text-[10px] transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                      ▼
                                  </span>
                                  <span className="font-serif text-[16px] font-medium text-text-primary">{topic.name}</span>
                              </div>
                              <button 
                                  onClick={(e) => { e.stopPropagation(); selectAllInTopic(topic.id); }}
                                  className="font-sans text-[10px] uppercase font-semibold text-text-primary hover:text-text-secondary active:scale-95 transition-all tracking-widest"
                              >
                                  Select All
                              </button>
                          </div>
                          
                          {isExpanded && (
                              <div className="pb-4 pt-0 px-4 space-y-4 animate-in slide-in-from-top-1 duration-150 border-t border-border">
                                  {relevantSubtopics.map(st => {
                                      const relevantSets = sets.filter(s => s.subtopicId === st.id);
                                      if (relevantSets.length === 0) return null;

                                      return (
                                          <div key={st.id} className="pt-2">
                                              <div className="font-sans text-[10px] uppercase tracking-widest text-text-secondary font-semibold mb-2">{st.name}</div>
                                              <div className="space-y-2">
                                                  {relevantSets.map(set => {
                                                      const isSelected = selectedSetIds.has(set.id);
                                                      return (
                                                          <label key={set.id} className={`flex items-center justify-between cursor-pointer group p-3 bg-surface border transition-colors ${isSelected ? 'border-text-primary bg-text-primary/5' : 'border-border hover:border-text-primary'}`}>
                                                              <div className="flex items-center gap-3">
                                                                  <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${isSelected ? 'bg-text-primary border-text-primary' : 'border-border bg-background group-hover:border-text-primary'}`}>
                                                                      {isSelected && <Icon name="check" size="xs" className="text-surface" />}
                                                                  </div>
                                                                  <div className="font-serif text-[16px] text-text-primary">{set.name}</div>
                                                              </div>
                                                              <div className="font-sans text-[10px] uppercase tracking-widest text-text-secondary font-semibold">{set.mcqs.length} MCQs</div>
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
      <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Question Count */}
          <div className="bg-surface border border-border p-6 rounded-none shadow-none">
              <div className="flex justify-between items-center mb-6">
                  <label className="font-serif text-[16px] font-medium text-text-primary">Number of Questions</label>
                  <span className="font-sans text-[10px] uppercase tracking-widest text-text-secondary font-semibold">Max: {totalSelectedMCQs}</span>
              </div>
              
              <div className="flex items-center gap-6">
                  <div className="flex-1 relative h-6 flex items-center group">
                      <input 
                          type="range" 
                          min="5" 
                          max={totalSelectedMCQs} 
                          value={settings.totalQuestions} 
                          onChange={(e) => setSettings({...settings, totalQuestions: parseInt(e.target.value)})}
                          className="w-full h-1 bg-border rounded-none appearance-none cursor-pointer accent-text-primary focus:outline-none"
                      />
                  </div>
                  <div className="font-serif text-[24px] font-medium text-text-primary min-w-[3ch] text-right">
                      {settings.totalQuestions}
                  </div>
              </div>
          </div>

          {/* Time Limit */}
          <div className="bg-surface border border-border p-6 rounded-none shadow-none">
              <label className="font-serif text-[16px] font-medium text-text-primary block mb-4">Time Limit</label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                  {[15, 20, 30, 45, 60, 90].map(t => (
                      <button 
                          key={t}
                          onClick={() => setSettings({...settings, timeLimit: t})}
                          className={`
                              py-3 font-sans text-[11px] font-semibold uppercase tracking-widest border transition-all duration-200
                              ${settings.timeLimit === t 
                                  ? 'bg-text-primary border-text-primary text-surface' 
                                  : 'bg-background border-border text-text-primary hover:bg-surface'
                              }
                          `}
                      >
                          {t} min
                      </button>
                  ))}
              </div>
              <div className="font-sans text-[10px] uppercase tracking-widest text-text-secondary font-semibold text-center border-t border-border pt-4">
                  ~{Math.round((settings.timeLimit * 60) / settings.totalQuestions)} seconds per question
              </div>
          </div>

          {/* Negative Marking */}
          <div className="bg-surface border border-border p-6 rounded-none shadow-none">
              <div className="flex justify-between items-center cursor-pointer mb-2" onClick={() => setSettings({...settings, negativeMarking: !settings.negativeMarking})}>
                  <span className="font-serif text-[16px] font-medium text-text-primary">Negative Marking</span>
                  <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${settings.negativeMarking ? 'bg-text-primary border-text-primary' : 'border-border bg-background hover:border-text-primary'}`}>
                    <input type="checkbox" className="hidden" checked={settings.negativeMarking} readOnly />
                    {settings.negativeMarking && <Icon name="check" size="xs" className="text-surface" />}
                  </div>
              </div>
              
              {settings.negativeMarking && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-200 pt-4 border-t border-border mt-4">
                      <label className="font-sans text-[10px] uppercase tracking-widest text-text-secondary font-semibold block mb-3">Penalty per wrong answer</label>
                      <div className="grid grid-cols-4 gap-3">
                          {[0.25, 0.33, 0.5, 1.0].map(p => (
                              <button 
                                  key={p}
                                  onClick={() => setSettings({...settings, negativePenalty: p})}
                                  className={`
                                      py-2 font-sans text-[11px] font-semibold tracking-widest border transition-all
                                      ${settings.negativePenalty === p 
                                          ? 'bg-text-primary border-text-primary text-surface' 
                                          : 'bg-background border-border text-text-primary hover:bg-[#EBE7DF]'
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
          <div className="bg-surface border border-border p-6 rounded-none shadow-none">
              <label className="font-serif text-[16px] font-medium text-text-primary block mb-6">Passing Score</label>
              <div className="flex items-center gap-6">
                  <div className="flex-1 relative h-6 flex items-center">
                      <input 
                          type="range" 
                          min="33" 
                          max="90" 
                          step="1"
                          value={settings.passingScore} 
                          onChange={(e) => setSettings({...settings, passingScore: parseInt(e.target.value)})}
                          className="w-full h-1 bg-border rounded-none appearance-none cursor-pointer accent-text-primary focus:outline-none"
                      />
                  </div>
                  <div className="font-serif text-[24px] font-medium text-text-primary min-w-[4ch] text-right">
                      {settings.passingScore}%
                  </div>
              </div>
          </div>
      </div>
  );

  const renderReview = () => (
      <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Exam Summary Card */}
          <div className="bg-surface border border-border p-6 rounded-none shadow-none">
              <h2 className="font-serif text-[20px] font-medium text-text-primary mb-6">Exam Summary</h2>
              <div className="space-y-4 font-sans text-[11px] uppercase tracking-widest font-semibold">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-text-secondary">Sources</span>
                      <span className="text-text-primary">{selectedSetIds.size} Sets</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-text-secondary">Questions</span>
                      <span className="text-text-primary">{settings.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-text-secondary">Time</span>
                      <span className="text-text-primary">{settings.timeLimit} mins</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-text-secondary">Passing</span>
                      <span className="text-text-primary">{settings.passingScore}%</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-text-secondary">Negative Marking</span>
                      <span className="text-text-primary">{settings.negativeMarking ? `On (-${settings.negativePenalty})` : 'Off'}</span>
                  </div>
              </div>
          </div>

          {/* Save as Template */}
          <div className="bg-surface border border-border p-6 rounded-none shadow-none">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSaveAsTemplate(!saveAsTemplate)}
              >
                  <span className="font-serif text-[16px] font-medium text-text-primary">Save as Template</span>
                  <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${saveAsTemplate ? 'bg-text-primary border-text-primary' : 'border-border bg-background hover:border-text-primary'}`}>
                    <input type="checkbox" className="hidden" checked={saveAsTemplate} readOnly />
                    {saveAsTemplate && <Icon name="check" size="xs" className="text-surface" />}
                  </div>
              </div>
              
              {saveAsTemplate && (
                  <div className="mt-6 animate-in slide-in-from-top-1 fade-in pt-4 border-t border-border">
                      <PremiumInput 
                          label="TEMPLATE NAME"
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
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 z-40 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            {step === STEPS.SOURCES ? (
                <>
                    <div className="flex flex-col">
                        <span className="font-sans text-[10px] uppercase font-semibold text-secondary tracking-widest">Selected</span>
                        <span className="font-serif text-[18px] font-medium text-text-primary">{totalSelectedMCQs} <span className="font-sans text-xs uppercase tracking-widest">MCQs</span></span>
                    </div>
                    <button 
                        onClick={() => setStep(STEPS.SETTINGS)}
                        disabled={totalSelectedMCQs < 5}
                        className="bg-text-primary text-surface px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2C2C2B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary rounded-none"
                    >
                        Next: Settings
                    </button>
                </>
            ) : step === STEPS.SETTINGS ? (
                <button 
                    onClick={() => setStep(STEPS.REVIEW)}
                    className="w-full bg-text-primary text-surface py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] transition-all hover:bg-[#2C2C2B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary rounded-none"
                >
                    Next: Review
                </button>
            ) : (
                <button 
                    onClick={handleStartExam} 
                    className="w-full bg-primary text-surface py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] transition-all hover:bg-[#8A4F3A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-none flex items-center justify-center gap-2"
                >
                    Start Exam
                </button>
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-[60px] font-serif">
        {renderHeader()}

        <div className="max-w-xl mx-auto px-5 mt-6">
            {step === STEPS.SOURCES && renderSources()}
            {step === STEPS.SETTINGS && renderSettings()}
            {step === STEPS.REVIEW && renderReview()}
        </div>

        {renderFooter()}
    </div>
  );
};

export default CreateExamPage;
