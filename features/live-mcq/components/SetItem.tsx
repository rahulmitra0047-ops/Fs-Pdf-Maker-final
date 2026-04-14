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
            className="relative group bg-white border border-slate-100 rounded-[20px] p-4 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-500/30 active:scale-[0.98] transition-all duration-300 cursor-pointer"
        >
            <div className="flex items-center justify-between">
                {/* Left Content */}
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-sm border ${set.isArchived ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300'}`}>
                        <Icon name={set.isArchived ? "folder" : "file-text"} size="md" />
                    </div>
                    <div>
                        <h3 className={`text-[16px] font-bold mb-1 ${set.isArchived ? 'text-slate-400' : 'text-slate-800 group-hover:text-indigo-600 transition-colors'}`}>
                            {set.name}
                            {set.isArchived && <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider align-middle">Archived</span>}
                        </h3>
                        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                            <div className="flex items-center gap-1">
                                <Icon name="list" size="xs" className="text-slate-400" />
                                <span>{set.mcqs.length} MCQs</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                            <span>{new Date(set.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                {/* Right Actions */}
                <div className="flex items-center gap-1">
                    <button 
                        onClick={(e) => onMenuToggle(set.id, e)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all rounded-full relative z-10"
                    >
                        <Icon name="more-vertical" size="sm" />
                    </button>
                    <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                        <Icon name="chevron-right" size="sm" />
                    </div>
                </div>
            </div>

            {/* Dropdown Menu */}
            {activeMenuId === set.id && (
                <div className="absolute right-4 top-10 z-20 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPractice(set.id); }}
                        disabled={set.mcqs.length === 0}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 disabled:opacity-50"
                    >
                        <Icon name="play" size="xs" className="text-emerald-500" /> Practice
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onExam(set.id); }}
                        disabled={set.mcqs.length === 0}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 disabled:opacity-50"
                    >
                        <Icon name="clock" size="xs" className="text-indigo-500" /> Exam
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onExport(set.id, e); }}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                        <Icon name="share" size="xs" className="text-slate-400" /> Export PDF
                    </button>
                    <button 
                        onClick={(e) => onRename(set, e)}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                        <Icon name="edit-3" size="xs" className="text-slate-400" /> Edit
                    </button>
                    <button 
                        onClick={(e) => onArchive(set, e)}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                    >
                        <Icon name="folder" size="xs" className="text-slate-400" /> {set.isArchived ? "Unarchive" : "Archive"}
                    </button>
                    <button 
                        onClick={(e) => onDelete(set, e)}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Icon name="trash-2" size="xs" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
});

export default SetItem;
