
import React, { useState, useEffect } from 'react';
import { DocumentSettings, FooterSettings, CoverPageSettings, TableOfContentsSettings, AnswerKeySettings, WatermarkSettings } from '../../../types';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import PremiumInput from '../../../shared/components/PremiumInput';
import Icon, { IconName } from '../../../shared/components/Icon';

interface Props {
  settings: DocumentSettings;
  footerSettings?: FooterSettings;
  coverPage?: CoverPageSettings;
  toc?: TableOfContentsSettings;
  answerKey?: AnswerKeySettings;
  onChange: (settings: DocumentSettings) => void;
  onFooterChange: (footer: FooterSettings) => void;
  onCoverPageChange: (cover: CoverPageSettings) => void;
  onTocChange: (toc: TableOfContentsSettings) => void;
  onAnswerKeyChange: (key: AnswerKeySettings) => void;
  onExport: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  isExportButtonVisible?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const THEME_PRESETS = [
    { id: 'classic', color: '#000000', label: 'Classic' },
    { id: 'modern-blue', color: '#2563EB', label: 'Blue' },
    { id: 'elegant-green', color: '#059669', label: 'Green' },
    { id: 'warm-maroon', color: '#B91C1C', label: 'Maroon' },
    { id: 'professional-gray', color: '#4B5563', label: 'Gray' }
];

const Label = ({ children }: { children?: React.ReactNode }) => (
    <div className="text-[11px] font-bold text-[#6B7280] mb-2 uppercase tracking-wide">{children}</div>
);

const ButtonGroup = ({ options, value, onChange }: { options: { label: string, value: any }[], value: any, onChange: (val: any) => void }) => (
    <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`
                    px-3 py-2 rounded-[10px] text-[13px] font-medium border transition-all duration-150 flex-1 text-center whitespace-nowrap
                    ${value === opt.value 
                        ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1] font-semibold shadow-sm' 
                        : 'bg-[#F9FAFB] border-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]'
                    }
                `}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

const Toggle = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
    <div className="flex items-center justify-between py-1.5 cursor-pointer" onClick={() => onChange(!checked)}>
        <span className="text-[14px] font-medium text-[#374151]">{label}</span>
        <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${checked ? 'bg-[#6366F1]' : 'bg-[#E5E7EB]'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${checked ? 'left-[24px]' : 'left-1'}`} />
        </div>
    </div>
);

const Slider = ({ value, min, max, onChange, unit = "" }: { value: number, min: number, max: number, onChange: (val: number) => void, unit?: string }) => (
    <div className="flex items-center gap-4">
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-[#F3F4F6] rounded-full appearance-none cursor-pointer accent-[#6366F1]"
        />
        <span className="text-[14px] font-bold text-[#6366F1] w-12 text-right">{value}{unit}</span>
    </div>
);

const DocumentSettingsPanel: React.FC<Props> = ({ 
  settings, footerSettings, coverPage, toc, answerKey,
  onChange, onFooterChange, onCoverPageChange, onTocChange, onAnswerKeyChange,
  activeTab: controlledActiveTab, onTabChange
}) => {
  const [localActiveTab, setLocalActiveTab] = useState('page');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;

  const setActiveTab = (tab: string) => {
      if (onTabChange) onTabChange(tab);
      else setLocalActiveTab(tab);
  };

  const [presets, setPresets] = useState<{name: string, data: any}[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  useEffect(() => {
      const saved = localStorage.getItem('user_presets');
      if (saved) setPresets(JSON.parse(saved));
  }, []);

  const updateSettings = (key: keyof DocumentSettings, value: any) => onChange({ ...settings, [key]: value });
  
  const updateDensityPreset = (density: 'comfortable' | 'dense' | 'ultra' | 'ultra-max') => {
      const updates: Partial<DocumentSettings> = { density };
      
      // Auto-set spacing and gaps based on density preset
      if (density === 'comfortable') {
          updates.lineSpacing = 'relaxed';
          updates.questionGap = 'relaxed';
      } else if (density === 'dense') {
          updates.lineSpacing = 'normal';
          updates.questionGap = 'normal';
      } else if (density === 'ultra') {
          updates.lineSpacing = 'compact';
          updates.questionGap = 'tight';
      } else if (density === 'ultra-max') {
          updates.lineSpacing = 'tight';
          updates.questionGap = 'tight';
      }
      
      onChange({ ...settings, ...updates });
  };

  const updateMargins = (value: any) => {
      const newMargins = { ...settings.margins, preset: value };
      const marginMap: Record<string, number> = { 'minimal': 3, 'normal': 8, 'wide': 20 };
      const val = marginMap[value] || 8;
      newMargins.top = val; newMargins.bottom = val; newMargins.left = val; newMargins.right = val;
      onChange({ ...settings, margins: newMargins });
  };

  const updateWatermark = (updates: Partial<WatermarkSettings>) => {
      updateSettings('watermark', { ...settings.watermark, ...updates });
  };

  const savePreset = () => {
      if (!newPresetName.trim()) return;
      const newPreset = {
          name: newPresetName,
          data: { settings, footerSettings, coverPage, toc, answerKey }
      };
      const updated = [...presets, newPreset];
      setPresets(updated);
      localStorage.setItem('user_presets', JSON.stringify(updated));
      setShowPresetModal(false);
      setNewPresetName('');
  };

  const applyPreset = (preset: any) => {
      onChange(preset.data.settings);
      if (preset.data.footerSettings) onFooterChange(preset.data.footerSettings);
      if (preset.data.coverPage) onCoverPageChange(preset.data.coverPage);
      if (preset.data.toc) onTocChange(preset.data.toc);
      if (preset.data.answerKey) onAnswerKeyChange(preset.data.answerKey);
  };

  const deletePreset = (idx: number) => {
      const updated = presets.filter((_, i) => i !== idx);
      setPresets(updated);
      localStorage.setItem('user_presets', JSON.stringify(updated));
  };

  const TABS = [
      { id: 'page', label: 'Page', icon: 'file-text' },
      { id: 'design', label: 'Design', icon: 'sparkles' },
      { id: 'content', label: 'Content', icon: 'edit-3' },
      { id: 'sections', label: 'Sections', icon: 'book' },
      { id: 'presets', label: 'Presets', icon: 'save' },
  ] as const;

  return (
    <div className="bg-[#FAFAFA] pb-32 flex flex-col">
        <div className="sticky top-[112px] z-30 bg-[#FAFAFA] pt-2 px-2 pb-3">
            <div className="flex p-1 bg-white border border-[#E5E7EB] rounded-[16px] shadow-sm">
               {TABS.map(tab => (
                   <button 
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[12px] text-[10px] font-bold gap-1 transition-all duration-200 ${
                           activeTab === tab.id 
                               ? 'bg-[#6366F1] text-white shadow-md transform scale-[1.02]' 
                               : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#374151]'
                       }`}
                   >
                       <Icon name={tab.icon} size="sm" className={activeTab === tab.id ? "text-white" : ""} />
                       <span className="uppercase tracking-tight">{tab.label}</span>
                   </button>
               ))}
            </div>
        </div>

        <div className="px-2 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white border border-[#F3F4F6] rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] min-h-[300px]">
                {activeTab === 'page' && (
                    <div className="space-y-6">
                        <div>
                            <Label>Paper Size</Label>
                            <ButtonGroup 
                                options={[{ label: 'A4', value: 'A4' }, { label: 'A5', value: 'A5' }]}
                                value={settings.paperSize}
                                onChange={(v) => updateSettings('paperSize', v)}
                            />
                        </div>
                        <div>
                            <Label>Questions Per Column ({settings.perColumn})</Label>
                            <Slider value={settings.perColumn} min={1} max={10} onChange={(v) => updateSettings('perColumn', v)} />
                        </div>
                        <div>
                            <Label>Margins</Label>
                            <ButtonGroup 
                                options={[{ label: 'Minimal', value: 'minimal' }, { label: 'Normal', value: 'normal' }, { label: 'Wide', value: 'wide' }]}
                                value={settings.margins.preset}
                                onChange={updateMargins}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'design' && (
                    <div className="space-y-6">
                        <div>
                            <Label>Color Theme</Label>
                            <div className="flex flex-wrap gap-3">
                                {THEME_PRESETS.map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => updateSettings('theme', t.id)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${settings.theme === t.id ? 'ring-2 ring-offset-2 ring-[#6366F1] border-transparent scale-110' : 'border-gray-200'}`}
                                        style={{ backgroundColor: t.color }}
                                        title={t.label}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <Label>Font Style</Label>
                            <ButtonGroup 
                                options={[{ label: 'Classic (Serif)', value: 'classic' }, { label: 'Modern (Sans)', value: 'modern' }]}
                                value={settings.fontStyle}
                                onChange={(v) => updateSettings('fontStyle', v)}
                            />
                        </div>

                        <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[16px] p-4">
                            <Label>Density & Spacing</Label>
                            <div className="mb-4">
                                <ButtonGroup 
                                    options={[
                                        { label: 'Relaxed', value: 'comfortable' },
                                        { label: 'Normal', value: 'dense' },
                                        { label: 'Compact', value: 'ultra' },
                                        { label: 'Max', value: 'ultra-max' }
                                    ]}
                                    value={settings.density}
                                    onChange={(v) => updateDensityPreset(v)}
                                />
                            </div>
                            <div className="pt-4 border-t border-[#E5E7EB] grid grid-cols-2 gap-3 animate-in fade-in">
                                <div>
                                    <Label>Line Spacing</Label>
                                    <select 
                                        value={settings.lineSpacing}
                                        onChange={(e) => updateSettings('lineSpacing', e.target.value)}
                                        className="w-full bg-white border border-[#E5E7EB] rounded-[10px] py-2 px-3 text-[13px] outline-none focus:border-[#6366F1]"
                                    >
                                        <option value="tight">Tight (1.15)</option>
                                        <option value="compact">Compact (1.3)</option>
                                        <option value="normal">Normal (1.5)</option>
                                        <option value="relaxed">Relaxed (1.75)</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Element Gap</Label>
                                    <select 
                                        value={settings.questionGap || 'normal'}
                                        onChange={(e) => updateSettings('questionGap', e.target.value)}
                                        className="w-full bg-white border border-[#E5E7EB] rounded-[10px] py-2 px-3 text-[13px] outline-none focus:border-[#6366F1]"
                                    >
                                        <option value="tight">Tight</option>
                                        <option value="normal">Normal</option>
                                        <option value="relaxed">Relaxed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[16px] p-4">
                            <Toggle 
                                label="Page Border" 
                                checked={settings.borderStyle !== 'none'} 
                                onChange={(checked) => updateSettings('borderStyle', checked ? 'solid' : 'none')} 
                            />
                            {settings.borderStyle !== 'none' && (
                                <div className="space-y-4 pt-3 mt-2 border-t border-[#E5E7EB] animate-in fade-in">
                                    <div>
                                        <Label>Border Style</Label>
                                        <ButtonGroup 
                                            options={[
                                                { label: 'Solid', value: 'solid' },
                                                { label: 'Dashed', value: 'dashed' },
                                                { label: 'Dotted', value: 'dotted' },
                                                { label: 'Double', value: 'double' },
                                                { label: 'Groove', value: 'groove' },
                                                { label: 'Ridge', value: 'ridge' },
                                                { label: 'Inset', value: 'inset' },
                                                { label: 'Outset', value: 'outset' }
                                            ]}
                                            value={settings.borderStyle}
                                            onChange={(v) => updateSettings('borderStyle', v)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Thickness</Label>
                                        <ButtonGroup 
                                            options={[
                                                { label: 'Thin', value: 'thin' },
                                                { label: 'Medium', value: 'medium' },
                                                { label: 'Thick', value: 'thick' }
                                            ]}
                                            value={settings.borderThickness || 'medium'}
                                            onChange={(v) => updateSettings('borderThickness', v)}
                                        />
                                    </div>
                                    <div>
                                        <Toggle 
                                            label="Rounded Corners" 
                                            checked={settings.borderRounded || false} 
                                            onChange={(v) => updateSettings('borderRounded', v)} 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>Font Size Scale (Max 40)</Label>
                            <Slider value={settings.fontStep} min={8} max={40} onChange={(v) => updateSettings('fontStep', v)} />
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="space-y-6">
                        <div>
                            <Label>Option Style</Label>
                            <ButtonGroup 
                                options={[{ label: 'A, B, C', value: 'english' }, { label: 'ক, খ, গ', value: 'bengali' }, { label: '1, 2, 3', value: 'numeric' }]}
                                value={settings.optionStyle}
                                onChange={(v) => updateSettings('optionStyle', v)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Toggle label="Highlight Correct Answers" checked={settings.showAnswerInMCQ} onChange={(v) => updateSettings('showAnswerInMCQ', v)} />
                            <Toggle label="Show Explanations" checked={settings.showExplanations} onChange={(v) => updateSettings('showExplanations', v)} />
                            <Toggle label="Show Source/Tag" checked={settings.showSource} onChange={(v) => updateSettings('showSource', v)} />
                            <Toggle label="Show Page Numbers" checked={settings.pageNumberStyle !== 'hidden'} onChange={(v) => updateSettings('pageNumberStyle', v ? 'english' : 'hidden')} />
                        </div>
                        
                        <div className="pt-4 border-t border-[#F3F4F6]">
                            <div className="flex justify-between items-center mb-3">
                                <Label>Watermark</Label>
                                <Toggle label="" checked={settings.watermark?.enabled || false} onChange={(v) => updateWatermark({ enabled: v })} />
                            </div>
                            {settings.watermark?.enabled && (
                                <div className="space-y-5 animate-in fade-in">
                                    <div>
                                        <Label>Watermark Text</Label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Confidential, FS PDF" 
                                            value={settings.watermark.text} 
                                            onChange={(e) => updateWatermark({ text: e.target.value })}
                                            className="w-full bg-[#F9FAFB] border border-[#F3F4F6] rounded-[10px] px-3 py-2 text-[14px] outline-none focus:border-[#6366F1] transition-colors"
                                        />
                                    </div>
                                    
                                    <div>
                                        <Label>Mode</Label>
                                        <ButtonGroup 
                                            options={[
                                                { label: 'Diagonal', value: 'diagonal' },
                                                { label: 'Horizontal', value: 'horizontal' },
                                                { label: 'Repeated', value: 'repeated' }
                                            ]}
                                            value={settings.watermark.style}
                                            onChange={(v) => updateWatermark({ style: v as any })}
                                        />
                                    </div>

                                    <div>
                                        <Label>Opacity Level</Label>
                                        <Slider value={settings.watermark.opacity} min={5} max={50} onChange={(v) => updateWatermark({ opacity: v })} unit="%" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'sections' && (
                    <div className="space-y-6">
                        <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[16px] p-4">
                            <Toggle label="Enable Cover Page" checked={coverPage?.enabled || false} onChange={(v) => onCoverPageChange({ ...coverPage!, enabled: v })} />
                            {coverPage?.enabled && (
                                <div className="space-y-4 mt-4 pt-4 border-t border-[#E5E7EB] animate-in fade-in">
                                    <PremiumInput label="Main Title" value={coverPage.mainTitle} onChange={(v) => onCoverPageChange({...coverPage!, mainTitle: v})} />
                                    <PremiumInput label="Subtitle" value={coverPage.subtitle} onChange={(v) => onCoverPageChange({...coverPage!, subtitle: v})} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <PremiumInput label="Chapter" value={coverPage.chapter} onChange={(v) => onCoverPageChange({...coverPage!, chapter: v})} />
                                        <PremiumInput label="Institution" value={coverPage.institution || ''} onChange={(v) => onCoverPageChange({...coverPage!, institution: v})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <PremiumInput label="Author" value={coverPage.author} onChange={(v) => onCoverPageChange({...coverPage!, author: v})} />
                                        <PremiumInput label="Publisher" value={coverPage.publisher} onChange={(v) => onCoverPageChange({...coverPage!, publisher: v})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <PremiumInput label="Year" value={coverPage.year} onChange={(v) => onCoverPageChange({...coverPage!, year: v})} />
                                        <div>
                                            <Label>Title Color</Label>
                                            <input 
                                                type="color" 
                                                value={coverPage.titleColor || '#000000'} 
                                                onChange={(e) => onCoverPageChange({...coverPage!, titleColor: e.target.value})}
                                                className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Alignment</Label>
                                        <ButtonGroup 
                                            options={[{label: 'Left', value: 'left'}, {label: 'Center', value: 'center'}, {label: 'Right', value: 'right'}]}
                                            value={coverPage.alignment || 'center'}
                                            onChange={(v) => onCoverPageChange({...coverPage!, alignment: v})}
                                        />
                                    </div>
                                    <div>
                                        <Label>Vertical Position</Label>
                                        <ButtonGroup 
                                            options={[{label: 'Top', value: 'top'}, {label: 'Middle', value: 'middle'}, {label: 'Bottom', value: 'bottom'}]}
                                            value={coverPage.verticalAlign || 'middle'}
                                            onChange={(v) => onCoverPageChange({...coverPage!, verticalAlign: v})}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[16px] p-4">
                            <Toggle label="Show Footer" checked={footerSettings?.showFooter || false} onChange={(v) => onFooterChange({ ...footerSettings!, showFooter: v })} />
                            {footerSettings?.showFooter && (
                                <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in">
                                    <PremiumInput label="Author" value={footerSettings.authorName} onChange={(v) => onFooterChange({...footerSettings!, authorName: v})} />
                                    <PremiumInput label="Book Name" value={footerSettings.bookName} onChange={(v) => onFooterChange({...footerSettings!, bookName: v})} />
                                </div>
                            )}
                        </div>

                        <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[16px] p-4 space-y-1">
                            <Toggle label="Table of Contents" checked={toc?.enabled || false} onChange={(v) => onTocChange({ ...toc!, enabled: v })} />
                            <Toggle label="Separate Answer Key" checked={answerKey?.enabled || false} onChange={(v) => onAnswerKeyChange({ ...answerKey!, enabled: v })} />
                        </div>
                    </div>
                )}

                {activeTab === 'presets' && (
                    <div className="space-y-5">
                        <button 
                            onClick={() => setShowPresetModal(true)}
                            className="w-full bg-[#6366F1] text-white rounded-[14px] py-3.5 px-4 text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                        >
                            <Icon name="save" size="sm" /> Save Current as Preset
                        </button>
                        <div>
                            <Label>Saved Presets</Label>
                            <div className="space-y-2 mt-2">
                                {presets.length === 0 ? (
                                    <div className="text-center py-8 text-[#9CA3AF] text-[13px] border-2 border-dashed border-[#F3F4F6] rounded-[14px]">
                                        No presets saved yet
                                    </div>
                                ) : (
                                    presets.map((preset, idx) => (
                                        <div key={idx} className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] p-4 flex items-center justify-between group hover:border-[#E5E7EB] transition-colors">
                                            <span className="font-semibold text-[#111827] text-[14px] truncate">{preset.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => applyPreset(preset)}
                                                    className="text-[#6366F1] bg-[#EEF2FF] px-3 py-1.5 rounded-[8px] font-medium text-[12px] hover:bg-[#6366F1] hover:text-white transition-colors"
                                                >
                                                    Apply
                                                </button>
                                                <button 
                                                    onClick={() => deletePreset(idx)}
                                                    className="text-[#D1D5DB] hover:text-[#EF4444] p-1.5 rounded-full hover:bg-[#FEF2F2] transition-colors"
                                                >
                                                    <Icon name="trash-2" size="sm" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <PremiumModal isOpen={showPresetModal} onClose={() => setShowPresetModal(false)} title="Save Preset" size="sm">
            <div className="space-y-4">
                <PremiumInput 
                    label="Preset Name"
                    placeholder="e.g. Weekly Exam Standard"
                    value={newPresetName}
                    onChange={setNewPresetName}
                />
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowPresetModal(false)}>Cancel</PremiumButton>
                    <PremiumButton onClick={savePreset}>Save Preset</PremiumButton>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default DocumentSettingsPanel;
