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
            className="relative group bg-white rounded-xl p-3 shadow-sm border border-slate-200/60 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:border-emerald-500/30 hover:shadow-md hover:shadow-emerald-500/5 flex flex-col h-full"
        >
            <div className="flex items-start justify-between mb-2">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center text-sm font-bold shadow-sm border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    {topic.name.charAt(0).toUpperCase()}
                </div>

                {/* Actions */}
                <div className="flex items-center -mt-1 -mr-1">
                    <button 
                        onClick={(e) => onMenuToggle(topic.id, e)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all rounded-full"
                    >
                        <Icon name="more-vertical" size="sm" />
                    </button>
                </div>
            </div>

            {/* Text */}
            <div className="mb-2 flex-grow">
                <h3 className="text-sm font-bold text-slate-700 leading-tight mb-1 line-clamp-2">{topic.name}</h3>
            </div>

            {/* Stats Footer */}
            <div className="flex items-center gap-1.5 mt-auto">
                <div className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500 flex items-center gap-1">
                    <Icon name="list" size="xs" className="text-slate-400 w-2.5 h-2.5" />
                    {topic.subtopicCount}
                </div>
                <div className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500 flex items-center gap-1">
                    <Icon name="file-text" size="xs" className="text-slate-400 w-2.5 h-2.5" />
                    {topic.mcqCount}
                </div>
            </div>

            {/* Menu Dropdown */}
            {activeMenuId === topic.id && (
                <div className="absolute right-3 top-10 z-20 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden min-w-[140px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPractice(topic.id); }}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                        <Icon name="play" size="xs" className="text-slate-400" /> Practice
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRename(topic, e); }}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                        <Icon name="edit-3" size="xs" className="text-slate-400" /> Rename
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onExport(topic.id, e); }}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                        <Icon name="share" size="xs" className="text-slate-400" /> Export
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(topic, e); }}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Icon name="trash-2" size="xs" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
});

export default TopicItem;
