
import React, { useState, useEffect } from 'react';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import PremiumInput from '../../../shared/components/PremiumInput';
import { topicService, subtopicService, mcqSetService } from '../../../core/storage/services';
import { Topic, Subtopic, MCQSet, MCQ } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';
import BulkImportModal from '../../create-pdf/components/BulkImportModal';
import SingleMCQModal from '../../create-pdf/components/SingleMCQModal';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddMCQWizard: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const toast = useToast();
  
  // Data State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [sets, setSets] = useState<MCQSet[]>([]);
  
  // Selection State
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedSubtopicId, setSelectedSubtopicId] = useState('');
  const [selectedSetId, setSelectedSetId] = useState('');
  
  // New Creation State
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [isCreatingSubtopic, setIsCreatingSubtopic] = useState(false);
  const [newSubtopicName, setNewSubtopicName] = useState('');
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');

  // Modals for Step 2
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSingleMCQ, setShowSingleMCQ] = useState(false);

  useEffect(() => {
    if (isOpen) {
        loadData();
        setStep(1);
        resetSelection();
    }
  }, [isOpen]);

  const loadData = async () => {
      const [t, st, s] = await Promise.all([
          topicService.getAll(),
          subtopicService.getAll(),
          mcqSetService.getAll()
      ]);
      setTopics(t);
      setSubtopics(st);
      setSets(s);
  };

  const resetSelection = () => {
      setSelectedTopicId('');
      setSelectedSubtopicId('');
      setSelectedSetId('');
      setIsCreatingTopic(false);
      setIsCreatingSubtopic(false);
      setIsCreatingSet(false);
      setNewTopicName('');
      setNewSubtopicName('');
      setNewSetName('');
  };

  const handleNext = async () => {
      try {
          let topicId = selectedTopicId;
          if (isCreatingTopic && newTopicName.trim()) {
              topicId = generateUUID();
              await topicService.create({
                  id: topicId,
                  name: newTopicName,
                  icon: '📚',
                  order: topics.length,
                  createdAt: Date.now()
              });
          }

          if (!topicId) return toast.error("Select or create a topic");

          let subtopicId = selectedSubtopicId;
          if (isCreatingSubtopic && newSubtopicName.trim()) {
              subtopicId = generateUUID();
              await subtopicService.create({
                  id: subtopicId,
                  topicId,
                  name: newSubtopicName,
                  order: subtopics.length,
                  createdAt: Date.now()
              });
          }

          if (!subtopicId) return toast.error("Select or create a subtopic");

          let setId = selectedSetId;
          if (isCreatingSet && newSetName.trim()) {
              setId = generateUUID();
              await mcqSetService.create({
                  id: setId,
                  subtopicId,
                  name: newSetName,
                  mcqs: [],
                  createdAt: Date.now(),
                  updatedAt: Date.now()
              });
          }

          if (!setId) return toast.error("Select or create a set");

          setSelectedTopicId(topicId);
          setSelectedSubtopicId(subtopicId);
          setSelectedSetId(setId);
          setStep(2);
      } catch (e) {
          console.error(e);
          toast.error("Failed to proceed");
      }
  };

  const handleAddMCQs = async (newMCQs: MCQ[]) => {
      try {
          const set = await mcqSetService.getById(selectedSetId);
          if (!set) throw new Error("Set not found");

          const updatedMCQs = [...set.mcqs, ...newMCQs];
          await mcqSetService.update(selectedSetId, {
              mcqs: updatedMCQs,
              updatedAt: Date.now()
          });
          
          toast.success(`Added ${newMCQs.length} MCQs`);
          setShowBulkImport(false);
          setShowSingleMCQ(false);
          onSuccess();
      } catch (e) {
          toast.error("Failed to add MCQs");
      }
  };

  const renderStep1 = () => (
      <div className="space-y-4">
          {/* TOPIC */}
          <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Topic</label>
              {!isCreatingTopic ? (
                  <div className="flex gap-2">
                      <select 
                          className="flex-1 border p-2 rounded-lg"
                          value={selectedTopicId}
                          onChange={(e) => { setSelectedTopicId(e.target.value); setSelectedSubtopicId(''); setSelectedSetId(''); }}
                      >
                          <option value="">Select Topic</option>
                          {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <button onClick={() => setIsCreatingTopic(true)} className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-200">+</button>
                  </div>
              ) : (
                  <div className="flex gap-2">
                      <PremiumInput value={newTopicName} onChange={setNewTopicName} placeholder="New Topic Name" className="flex-1" />
                      <button onClick={() => setIsCreatingTopic(false)} className="text-sm text-red-500 font-bold">Cancel</button>
                  </div>
              )}
          </div>

          {/* SUBTOPIC */}
          <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Subtopic</label>
              {!isCreatingSubtopic ? (
                  <div className="flex gap-2">
                      <select 
                          className="flex-1 border p-2 rounded-lg"
                          value={selectedSubtopicId}
                          onChange={(e) => { setSelectedSubtopicId(e.target.value); setSelectedSetId(''); }}
                          disabled={!selectedTopicId && !isCreatingTopic}
                      >
                          <option value="">Select Subtopic</option>
                          {subtopics.filter(s => s.topicId === selectedTopicId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button 
                        onClick={() => setIsCreatingSubtopic(true)} 
                        className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-200"
                        disabled={!selectedTopicId && !isCreatingTopic}
                      >+</button>
                  </div>
              ) : (
                  <div className="flex gap-2">
                      <PremiumInput value={newSubtopicName} onChange={setNewSubtopicName} placeholder="New Subtopic Name" className="flex-1" />
                      <button onClick={() => setIsCreatingSubtopic(false)} className="text-sm text-red-500 font-bold">Cancel</button>
                  </div>
              )}
          </div>

          {/* SET */}
          <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Set</label>
              {!isCreatingSet ? (
                  <div className="flex gap-2">
                      <select 
                          className="flex-1 border p-2 rounded-lg"
                          value={selectedSetId}
                          onChange={(e) => setSelectedSetId(e.target.value)}
                          disabled={!selectedSubtopicId && !isCreatingSubtopic}
                      >
                          <option value="">Select Set</option>
                          {sets.filter(s => s.subtopicId === selectedSubtopicId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button 
                        onClick={() => setIsCreatingSet(true)} 
                        className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-200"
                        disabled={!selectedSubtopicId && !isCreatingSubtopic}
                      >+</button>
                  </div>
              ) : (
                  <div className="flex gap-2">
                      <PremiumInput value={newSetName} onChange={setNewSetName} placeholder="New Set Name" className="flex-1" />
                      <button onClick={() => setIsCreatingSet(false)} className="text-sm text-red-500 font-bold">Cancel</button>
                  </div>
              )}
          </div>

          <div className="pt-4 flex justify-end">
              <PremiumButton onClick={handleNext}>Next →</PremiumButton>
          </div>
      </div>
  );

  const renderStep2 = () => (
      <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
              <p className="text-sm text-blue-800">Adding to <b>{sets.find(s => s.id === selectedSetId)?.name || newSetName}</b></p>
          </div>
          
          <button 
              onClick={() => setShowSingleMCQ(true)}
              className="w-full p-4 border rounded-xl hover:bg-gray-50 text-left flex items-center gap-3"
          >
              <span className="text-2xl">📝</span>
              <div>
                  <div className="font-bold">Add Single MCQ</div>
                  <div className="text-xs text-gray-500">Manual Entry</div>
              </div>
          </button>

          <button 
              onClick={() => setShowBulkImport(true)}
              className="w-full p-4 border rounded-xl hover:bg-gray-50 text-left flex items-center gap-3"
          >
              <span className="text-2xl">📋</span>
              <div>
                  <div className="font-bold">Bulk Import</div>
                  <div className="text-xs text-gray-500">Paste Text</div>
              </div>
          </button>

          <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="text-sm text-gray-500">← Back</button>
              <PremiumButton onClick={onClose} variant="ghost">Finish</PremiumButton>
          </div>
      </div>
  );

  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} title="Add MCQs" size="sm">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}

        <BulkImportModal 
            isOpen={showBulkImport}
            onClose={() => setShowBulkImport(false)}
            onImport={handleAddMCQs}
        />
        <SingleMCQModal
            isOpen={showSingleMCQ}
            onClose={() => setShowSingleMCQ(false)}
            onSave={(mcq) => handleAddMCQs([mcq])}
        />
    </PremiumModal>
  );
};

export default AddMCQWizard;
