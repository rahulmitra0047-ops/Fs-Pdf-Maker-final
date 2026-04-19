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
            className="relative group bg-surface border border-border p-5 transition-colors duration-300 cursor-pointer hover:bg-[#EBE7DF] flex flex-col h-full overflow-hidden rounded-none shadow-none"
        >
            <div className="flex items-start justify-between mb-4 relative z-10">
                {/* Avatar */}
                <div className="w-10 h-10 border border-border bg-background text-text-primary flex items-center justify-center font-serif text-lg font-medium transition-colors duration-300">
                    {topic.name.charAt(0).toUpperCase()}
                </div>

                {/* Actions */}
                <div className="flex items-center">
                    <button 
                        onClick={(e) => onMenuToggle(topic.id, e)}
                        className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-[#EBE7DF] transition-colors rounded-none border border-transparent hover:border-border"
                    >
                        <Icon name="more-vertical" size="sm" />
                    </button>
                </div>
            </div>

            {/* Text */}
            <div className="mb-4 flex-grow relative z-10 font-serif">
                <h3 className="text-lg font-medium text-text-primary leading-tight mb-1 line-clamp-2 transition-colors duration-300">{topic.name}</h3>
                <div className="flex items-center gap-1.5">
                    <span className="font-sans uppercase tracking-widest text-[10px] text-text-secondary font-semibold">Topic</span>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[13px] font-serif font-medium text-text-primary">{topic.subtopicCount}</span>
                        <span className="font-sans uppercase tracking-[0.1em] text-[8px] text-text-secondary font-semibold">Subtopics</span>
                    </div>
                    <div className="w-px h-6 bg-border"></div>
                    <div className="flex flex-col">
                        <span className="text-[13px] font-serif font-medium text-text-primary">{topic.mcqCount}</span>
                        <span className="font-sans uppercase tracking-[0.1em] text-[8px] text-text-secondary font-semibold">MCQs</span>
                    </div>
                </div>
                
                <div className="w-8 h-8 border border-border bg-background flex items-center justify-center text-text-secondary group-hover:bg-[#EBE7DF] hover:text-text-primary transition-colors duration-300 rounded-none">
                    <Icon name="chevron-right" size="sm" />
                </div>
            </div>

            {/* Menu Dropdown */}
            {activeMenuId === topic.id && (
                <div className="absolute right-3 top-10 z-20 bg-surface border border-border overflow-hidden min-w-[140px] animate-in fade-in zoom-in-95 duration-100 origin-top-right rounded-none shadow-md">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPractice(topic.id); }}
                        className="w-full text-left px-4 py-3 font-sans uppercase tracking-[0.1em] text-[10px] font-semibold text-text-primary hover:bg-[#EBE7DF] flex items-center gap-2 border-b border-border/50 transition-colors"
                    >
                        <Icon name="play" size="xs" className="text-secondary" /> Practice
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRename(topic, e); }}
                        className="w-full text-left px-4 py-3 font-sans uppercase tracking-[0.1em] text-[10px] font-semibold text-text-primary hover:bg-[#EBE7DF] flex items-center gap-2 border-b border-border/50 transition-colors"
                    >
                        <Icon name="edit-3" size="xs" className="text-secondary" /> Rename
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onExport(topic.id, e); }}
                        className="w-full text-left px-4 py-3 font-sans uppercase tracking-[0.1em] text-[10px] font-semibold text-text-primary hover:bg-[#EBE7DF] flex items-center gap-2 border-b border-border/50 transition-colors"
                    >
                        <Icon name="share" size="xs" className="text-secondary" /> Export
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(topic, e); }}
                        className="w-full text-left px-4 py-3 font-sans uppercase tracking-[0.1em] text-[10px] font-semibold text-primary hover:bg-primary hover:text-surface flex items-center gap-2 transition-colors"
                    >
                        <Icon name="trash-2" size="xs" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
});

export default TopicItem;
