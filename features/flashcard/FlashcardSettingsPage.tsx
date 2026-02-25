import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'lucide-react';
import { flashcardSettingsService } from '../../core/storage/services';
import { FlashcardSettings } from '../../types';

export default function FlashcardSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<FlashcardSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await flashcardSettingsService.getSettings();
    setSettings(data);
    setLoading(false);
  };

  const updateSetting = async (key: keyof FlashcardSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await flashcardSettingsService.updateSettings({ [key]: value });
  };

  const handleResetProgress = async () => {
    if (window.confirm("⚠️ সতর্কতা: সব words এর progress (confidence level, review dates, stats) রিসেট হবে। Words মুছে যাবে না। এটা undo করা যাবে না।")) {
      await flashcardSettingsService.resetProgress();
      alert("Progress reset হয়েছে");
      navigate('/flashcards');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("⚠️ সতর্কতা: সব flashcard words, progress, history সব permanently মুছে যাবে। এটা undo করা যাবে না।")) {
      if (window.confirm("সত্যিই মুছে ফেলবে? আবার confirm করো।")) {
        await flashcardSettingsService.deleteAllData();
        alert("সব data মুছে গেছে");
        navigate('/flashcards');
      }
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      {/* Top Bar */}
      <div className="bg-white px-5 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/flashcards')} className="mr-4 text-gray-600">
          <Icon name="arrow-left" size={24} />
        </button>
        <h1 className="text-[18px] font-bold text-gray-800">Flashcard Settings</h1>
      </div>

      <div className="px-5 py-6 space-y-8">
        
        {/* Daily Target */}
        <section>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Daily Target</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            <CounterRow 
              label="New words per day" 
              value={settings.newWordsPerDay} 
              min={1} max={20}
              onChange={(v) => updateSetting('newWordsPerDay', v)}
            />
            <div className="h-px bg-gray-100 mx-4"></div>
            <CounterRow 
              label="Review limit per day" 
              value={settings.reviewLimitPerDay} 
              min={5} max={30}
              onChange={(v) => updateSetting('reviewLimitPerDay', v)}
            />
          </div>
        </section>

        {/* Card Settings */}
        <section>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Card Settings</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            <ToggleRow 
              label="Auto-play TTS" 
              value={settings.autoPlayTTS} 
              onChange={(v) => updateSetting('autoPlayTTS', v)}
            />
            <div className="h-px bg-gray-100 mx-4"></div>
            <ToggleRow 
              label="Show example on card" 
              value={settings.showExampleOnCard} 
              onChange={(v) => updateSetting('showExampleOnCard', v)}
            />
            <div className="h-px bg-gray-100 mx-4"></div>
            <ToggleRow 
              label="Haptic Feedback" 
              value={settings.hapticEnabled ?? true} 
              onChange={(v) => updateSetting('hapticEnabled', v)}
            />
            <div className="h-px bg-gray-100 mx-4"></div>
            <ToggleRow 
              label="Sound Effects" 
              value={settings.soundEnabled ?? true} 
              onChange={(v) => updateSetting('soundEnabled', v)}
            />
            <div className="h-px bg-gray-100 mx-4"></div>
            <DropdownRow 
              label="Card front" 
              value={settings.cardFront} 
              options={['english', 'bengali']}
              onChange={(v) => {
                if (v === settings.cardBack) {
                  updateSetting('cardBack', settings.cardFront);
                }
                updateSetting('cardFront', v);
              }}
            />
            <div className="h-px bg-gray-100 mx-4"></div>
            <DropdownRow 
              label="Card back" 
              value={settings.cardBack} 
              options={['english', 'bengali']}
              onChange={(v) => {
                if (v === settings.cardFront) {
                  updateSetting('cardFront', settings.cardBack);
                }
                updateSetting('cardBack', v);
              }}
            />
          </div>
        </section>

        {/* Practice Settings */}
        <section>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Practice Settings</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            <ToggleRow 
              label="Timer in Quiz" 
              value={settings.timerInQuiz} 
              onChange={(v) => updateSetting('timerInQuiz', v)}
            />
            
            {settings.timerInQuiz && (
              <>
                <div className="h-px bg-gray-100 mx-4"></div>
                <CounterRow 
                  label="Quiz timer (seconds)" 
                  value={settings.quizTimerSeconds} 
                  min={5} max={30}
                  onChange={(v) => updateSetting('quizTimerSeconds', v)}
                />
              </>
            )}
            
            <div className="h-px bg-gray-100 mx-4"></div>
            <CounterRow 
              label="Speed round time (seconds)" 
              value={settings.speedRoundSeconds} 
              min={30} max={120} step={10}
              onChange={(v) => updateSetting('speedRoundSeconds', v)}
            />
            <div className="h-px bg-gray-100 mx-4"></div>
            <CounterRow 
              label="Questions per session" 
              value={settings.questionsPerSession} 
              min={5} max={30}
              onChange={(v) => updateSetting('questionsPerSession', v)}
            />
          </div>
        </section>

        {/* Reminders */}
        <section>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Reminders</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
            <ToggleRow 
              label="Daily Reminder" 
              value={settings.reminderEnabled} 
              onChange={(v) => updateSetting('reminderEnabled', v)}
            />
            {settings.reminderEnabled && (
              <>
                <div className="h-px bg-gray-100 mx-4"></div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-[14px] text-gray-800">Reminder Time</span>
                  <select 
                    value={settings.reminderTime}
                    onChange={(e) => updateSetting('reminderTime', e.target.value)}
                    className="border border-gray-300 rounded-[8px] px-3 py-1.5 text-[14px] bg-white focus:outline-none focus:border-[#6C63FF]"
                  >
                    {Array.from({ length: 18 }).map((_, i) => {
                      const hour = i + 6; // 6 AM to 11 PM
                      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                      const display = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? `12:00 PM` : `${hour}:00 AM`;
                      return <option key={timeStr} value={timeStr}>{display}</option>;
                    })}
                  </select>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px bg-red-100 flex-1"></div>
            <h2 className="text-[13px] font-medium text-[#E53935] uppercase tracking-wider">Danger Zone</h2>
            <div className="h-px bg-red-100 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] border border-red-100 overflow-hidden">
            <button 
              onClick={handleResetProgress}
              className="w-full text-left p-4 text-[14px] text-[#E53935] hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Icon name="rotate-ccw" size={16} />
              Reset All Progress
            </button>
            <div className="h-px bg-red-50 mx-4"></div>
            <button 
              onClick={handleDeleteAll}
              className="w-full text-left p-4 text-[14px] text-[#E53935] hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Icon name="trash-2" size={16} />
              Delete All Words
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

// Sub-components
const CounterRow = ({ label, value, min, max, step = 1, onChange }: { 
  label: string, value: number, min: number, max: number, step?: number, onChange: (v: number) => void 
}) => (
  <div className="flex items-center justify-between p-4">
    <span className="text-[14px] text-gray-800">{label}</span>
    <div className="flex items-center gap-3">
      <button 
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[16px] active:scale-95 transition-transform disabled:opacity-50"
        disabled={value <= min}
      >
        −
      </button>
      <span className="text-[18px] font-bold text-[#6C63FF] min-w-[30px] text-center">{value}</span>
      <button 
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-8 h-8 rounded-full bg-[#6C63FF] text-white flex items-center justify-center text-[16px] active:scale-95 transition-transform disabled:opacity-50"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  </div>
);

const ToggleRow = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between p-4">
    <span className="text-[14px] text-gray-800">{label}</span>
    <button 
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full p-1 transition-colors ${value ? 'bg-[#6C63FF]' : 'bg-gray-300'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

const DropdownRow = ({ label, value, options, onChange }: { 
  label: string, value: string, options: string[], onChange: (v: any) => void 
}) => (
  <div className="flex items-center justify-between p-4">
    <span className="text-[14px] text-gray-800">{label}</span>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-[8px] px-3 py-1.5 text-[14px] bg-white capitalize focus:outline-none focus:border-[#6C63FF]"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);
