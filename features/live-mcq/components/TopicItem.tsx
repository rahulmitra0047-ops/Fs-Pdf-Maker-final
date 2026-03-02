import React, { memo } from 'react';
import { Topic } from '../../../types';
import Icon from '../../../shared/components/Icon';

interface TopicItemProps {
    topic: Topic & { subtopicCount: number; mcqCount: number };
    activeMenuId: string | null;
    onNavigate: (id: string) => void;
    onRename: (topic: Topic, e: React.MouseEvent) => void;
    onMenuToggle: (id: string, e: React.MouseEvent) => void;
    onPractice: (id: string) => void;
    onExport: (id: string, e: React.MouseEvent) => void;
    onDelete: (topic: Topic, e: React.MouseEvent) => void;
}

const TopicItem: React.FC<TopicItemProps> = memo(({ 
    topic, 
    activeMenuId, 
    onNavigate, 
    onRename, 
    onMenuToggle, 
    onPractice, 
    onExport, 
    onDelete 
}) => {
    return (
        <div 
            onClick={() => onNavigate(topic.id)}
            className="relative group bg-white rounded-[20px] p-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 active:scale-[0.98] transition-all duration-150 cursor-pointer hover:border-slate-200"
        >
            <div className="flex items-center justify-between">
                {/* Left Content */}
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center text-lg font-bold shadow-sm border border-slate-100">
                        {topic.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Text */}
                    <div>
                        <h3 className="text-base font-bold text-slate-700 leading-tight">{topic.name}</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">
                            {topic.subtopicCount} Subs • {topic.mcqCount} Qs
                        </p>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1">
                    {/* Edit Icon */}
                    <button 
                        onClick={(e) => onRename(topic, e)}
                        className="p-2 text-slate-300 hover:text-slate-600 transition-colors rounded-full"
                    >
                        <Icon name="edit-3" size="sm" />
                    </button>
                    {/* Menu Icon */}
                    <button 
                        onClick={(e) => onMenuToggle(topic.id, e)}
                        className="p-2 text-slate-300 hover:text-slate-600 transition-colors rounded-full"
                    >
                        <Icon name="more-vertical" size="sm" />
                    </button>
                </div>
            </div>

            {/* Menu Dropdown */}
            {activeMenuId === topic.id && (
                <div className="absolute right-4 top-12 z-20 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPractice(topic.id); }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                        <Icon name="play" size="sm" className="text-slate-400" /> Practice
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onExport(topic.id, e); }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                        <Icon name="share" size="sm" className="text-slate-400" /> Export
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(topic, e); }}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Icon name="trash-2" size="sm" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
});

export default TopicItem;
