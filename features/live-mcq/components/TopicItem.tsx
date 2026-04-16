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
            className="relative group bg-white rounded-[24px] p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 active:scale-[0.98] transition-all duration-300 cursor-pointer hover:border-indigo-500/20 hover:shadow-[0_20px_25px_-5px_rgba(79,70,229,0.1),0_10px_10px_-5px_rgba(79,70,229,0.04)] flex flex-col h-full overflow-hidden"
        >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite] z-20 pointer-events-none"></div>

            {/* Background Accent */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl group-hover:bg-indigo-100/50 transition-colors duration-500"></div>

            <div className="flex items-start justify-between mb-4 relative z-10">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-indigo-50 to-white text-indigo-600 flex items-center justify-center text-[18px] font-bold shadow-sm border border-indigo-100/50 group-hover:from-indigo-600 group-hover:to-indigo-500 group-hover:text-white group-hover:shadow-indigo-200 transition-all duration-500">
                    {topic.name.charAt(0).toUpperCase()}
                </div>

                {/* Actions */}
                <div className="flex items-center">
                    <button 
                        onClick={(e) => onMenuToggle(topic.id, e)}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all rounded-full"
                    >
                        <Icon name="more-vertical" size="sm" />
                    </button>
                </div>
            </div>

            {/* Text */}
            <div className="mb-4 flex-grow relative z-10">
                <h3 className="text-[16px] font-bold text-slate-800 leading-tight mb-1.5 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-300">{topic.name}</h3>
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-indigo-500/70 uppercase tracking-widest">Topic</span>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-700">{topic.subtopicCount}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Subtopics</span>
                    </div>
                    <div className="w-px h-6 bg-slate-100"></div>
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-700">{topic.mcqCount}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">MCQs</span>
                    </div>
                </div>
                
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all duration-300">
                    <Icon name="chevron-right" size="sm" />
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
