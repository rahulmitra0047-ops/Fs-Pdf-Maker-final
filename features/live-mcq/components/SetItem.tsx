import React, { memo } from 'react';
import { MCQSet } from '../../../types';
import Icon from '../../../shared/components/Icon';

interface SetItemProps {
    set: MCQSet;
    activeMenuId: string | null;
    onNavigate: (id: string) => void;
    onMenuToggle: (id: string, e: React.MouseEvent) => void;
    onPractice: (id: string) => void;
    onExam: (id: string) => void;
    onExport: (id: string, e: React.MouseEvent) => void;
    onRename: (set: MCQSet, e: React.MouseEvent) => void;
    onArchive: (set: MCQSet, e: React.MouseEvent) => void;
    onDelete: (set: MCQSet, e: React.MouseEvent) => void;
}

const SetItem: React.FC<SetItemProps> = memo(({
    set,
    activeMenuId,
    onNavigate,
    onMenuToggle,
    onPractice,
    onExam,
    onExport,
    onRename,
    onArchive,
    onDelete
}) => {
    return (
        <div 
            onClick={() => onNavigate(set.id)}
            className="relative group bg-background border border-border p-4 hover:border-text-primary active:bg-surface transition-all duration-300 cursor-pointer"
        >
            <div className="flex items-center justify-between">
                {/* Left Content */}
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center border ${set.isArchived ? 'bg-surface text-text-secondary border-border' : 'bg-background text-text-primary border-border group-hover:bg-surface transition-colors duration-300'}`}>
                        <Icon name={set.isArchived ? "folder" : "file-text"} size="md" />
                    </div>
                    <div>
                        <h3 className={`text-[17px] font-serif font-medium mb-1 ${set.isArchived ? 'text-text-secondary' : 'text-text-primary'}`}>
                            {set.name}
                            {set.isArchived && <span className="ml-3 font-sans text-[10px] bg-surface border border-border px-1.5 py-0.5 text-text-secondary font-semibold uppercase tracking-widest align-middle">ARCHIVED</span>}
                        </h3>
                        <div className="flex items-center gap-2 font-sans text-[10px] text-text-secondary font-semibold uppercase tracking-widest mt-2">
                            <div className="flex items-center gap-1.5">
                                <Icon name="list" size="xs" />
                                <span>{set.mcqs.length} MCQs</span>
                            </div>
                            <div className="w-1 h-1 rounded-none bg-border"></div>
                            <span>{new Date(set.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                {/* Right Actions */}
                <div className="flex items-center gap-1">
                    <button 
                        onClick={(e) => onMenuToggle(set.id, e)}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface transition-all rounded-none relative z-10"
                    >
                        <Icon name="more-vertical" size="sm" />
                    </button>
                    <div className="text-text-secondary group-hover:text-primary transition-colors">
                        <Icon name="chevron-right" size="sm" />
                    </div>
                </div>
            </div>

            {/* Dropdown Menu */}
            {activeMenuId === set.id && (
                <div className="absolute right-4 top-10 z-20 bg-background border border-border shadow-md min-w-[160px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPractice(set.id); }}
                        disabled={set.mcqs.length === 0}
                        className="w-full text-left px-4 py-3 font-sans text-[11px] font-semibold tracking-widest uppercase text-text-primary hover:bg-surface transition-colors flex items-center gap-3 border-b border-border disabled:opacity-50"
                    >
                        <Icon name="play" size="xs" className="text-text-secondary" /> PRACTICE
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onExam(set.id); }}
                        disabled={set.mcqs.length === 0}
                        className="w-full text-left px-4 py-3 font-sans text-[11px] font-semibold tracking-widest uppercase text-text-primary hover:bg-surface transition-colors flex items-center gap-3 border-b border-border disabled:opacity-50"
                    >
                        <Icon name="clock" size="xs" className="text-text-secondary" /> EXAM
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onExport(set.id, e); }}
                        className="w-full text-left px-4 py-3 font-sans text-[11px] font-semibold tracking-widest uppercase text-text-primary hover:bg-surface transition-colors flex items-center gap-3 border-b border-border"
                    >
                        <Icon name="share" size="xs" className="text-text-secondary" /> EXPORT PDF
                    </button>
                    <button 
                        onClick={(e) => onRename(set, e)}
                        className="w-full text-left px-4 py-3 font-sans text-[11px] font-semibold tracking-widest uppercase text-text-primary hover:bg-surface transition-colors flex items-center gap-3 border-b border-border"
                    >
                        <Icon name="edit-3" size="xs" className="text-text-secondary" /> EDIT
                    </button>
                    <button 
                        onClick={(e) => onArchive(set, e)}
                        className="w-full text-left px-4 py-3 font-sans text-[11px] font-semibold tracking-widest uppercase text-text-primary hover:bg-surface transition-colors flex items-center gap-3 border-b border-border"
                    >
                        <Icon name="folder" size="xs" className="text-text-secondary" /> {set.isArchived ? "UNARCHIVE" : "ARCHIVE"}
                    </button>
                    <button 
                        onClick={(e) => onDelete(set, e)}
                        className="w-full text-left px-4 py-3 font-sans text-[11px] font-semibold tracking-widest uppercase text-text-primary hover:bg-text-primary/90 hover:text-surface flex items-center gap-3 transition-colors"
                    >
                        <Icon name="trash-2" size="xs" /> DELETE
                    </button>
                </div>
            )}
        </div>
    );
});

export default SetItem;
