
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import PremiumInput from '../../../shared/components/PremiumInput';
import { MCQ } from '../../../types';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';
import { generateFingerprint } from '../../../core/dedupe/dedupeService';
import { useSettings } from '../../../shared/hooks/useSettings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (mcqs: MCQ[]) => void;
}

const AiGenerationModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { settings } = useSettings();

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    try {
      // 1. Get API Key (Settings > Environment)
      const envKey = process.env.API_KEY;
      const settingKeys = settings.geminiApiKeys || [];
      const availableKeys = settingKeys.length > 0 ? settingKeys : (envKey ? [envKey] : []);

      if (availableKeys.length === 0) {
        throw new Error("No API Key found. Please add one in Settings.");
      }

      // Simple rotation: pick random key
      const apiKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
      
      const ai = new GoogleGenAI({ apiKey });
      const modelId = 'gemini-2.5-flash';

      const prompt = `Generate ${count} multiple choice questions (MCQs) about "${topic}" at ${difficulty} difficulty level. 
      Each question must have 4 options (A, B, C, D) and one correct answer. 
      Provide a short explanation for the correct answer.
      Output valid JSON with a root object containing an "mcqs" array.`;

      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mcqs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    optionA: { type: Type.STRING },
                    optionB: { type: Type.STRING },
                    optionC: { type: Type.STRING },
                    optionD: { type: Type.STRING },
                    answer: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
                    explanation: { type: Type.STRING },
                  },
                  required: ["question", "optionA", "optionB", "optionC", "optionD", "answer"],
                },
              }
            },
            required: ["mcqs"]
          },
        },
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("No response from AI");

      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (e) {
        // Fallback: If strict parsing fails, try cleaning markdown blocks
        try {
            const cleanText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(cleanText);
        } catch (innerError) {
            console.error("JSON Parse Error:", jsonText);
            throw new Error("Failed to parse AI response. The model output was invalid.");
        }
      }
      
      // Strict Validation of Structure
      if (!parsedData || typeof parsedData !== 'object') {
          throw new Error("AI returned invalid data format.");
      }

      const rawMCQs = Array.isArray(parsedData) ? parsedData : parsedData.mcqs;

      if (!Array.isArray(rawMCQs) || rawMCQs.length === 0) {
          throw new Error("AI returned empty question list.");
      }

      const generatedMCQs: MCQ[] = rawMCQs.map((m: any) => {
        const mcqPart: Partial<MCQ> = {
          id: crypto.randomUUID(),
          question: m.question || "Untitled Question",
          optionA: m.optionA || "",
          optionB: m.optionB || "",
          optionC: m.optionC || "",
          optionD: m.optionD || "",
          answer: ['A','B','C','D'].includes(m.answer) ? m.answer : 'A',
          explanation: m.explanation || '',
          source: 'AI Generated',
        };
        return {
            ...mcqPart,
            fingerprint: generateFingerprint(mcqPart)
        } as MCQ;
      });

      onImport(generatedMCQs);
      toast.success(`Generated ${generatedMCQs.length} MCQs successfully!`);
      onClose();

    } catch (error: any) {
      console.error("AI Generation failed:", error);
      toast.error(error.message || "Failed to generate MCQs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} title="Generate with AI" size="md">
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm">
             <Icon name="sparkles" className="text-purple-600" />
          </div>
          <p className="text-sm text-gray-700">
            Describe your topic, and AI will create unique questions for you instantly.
          </p>
        </div>

        <PremiumInput
          label="Topic / Subject"
          value={topic}
          onChange={setTopic}
          placeholder="e.g. Photosynthesis, Newton's Laws"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Question Count</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={20}>20 Questions</option>
              <option value={30}>30 Questions</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <PremiumButton variant="ghost" onClick={onClose}>Cancel</PremiumButton>
          <PremiumButton 
            onClick={handleGenerate} 
            loading={isLoading}
            disabled={!topic.trim()}
            variant="gradient"
            icon={<Icon name="sparkles" size="sm" />}
          >
            {isLoading ? 'Generating...' : 'Generate MCQs'}
          </PremiumButton>
        </div>
      </div>
    </PremiumModal>
  );
};

export default AiGenerationModal;
