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
            className="relative group bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
            <div className="flex items-center justify-between">
                {/* Left Content */}
                <div>
                    <h3 className={`text-[17px] font-semibold mb-1 ${set.isArchived ? 'text-slate-400' : 'text-slate-900'}`}>
                        {set.name}
                        {set.isArchived && <span className="ml-2 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-normal align-middle">Archived</span>}
                    </h3>
                    <div className="text-[13px] font-normal text-slate-500">
                        {set.mcqs.length} MCQs • Last updated: {new Date(set.updatedAt).toLocaleDateString()}
                    </div>
                </div>
                
                {/* Right Actions */}
                <div className="flex items-center gap-1">
                    <button 
                        onClick={(e) => onMenuToggle(set.id, e)}
                        className="p-2 text-slate-300 hover:text-slate-900 transition-colors rounded-full relative z-10"
                    >
                        <Icon name="more-vertical" size="sm" />
                    </button>
                    <div className="text-slate-300">
                        <Icon name="chevron-right" size="md" />
                    </div>
                </div>
            </div>

            {/* Dropdown Menu */}
            {activeMenuId === set.id && (
                <div className="absolute right-4 top-12 z-20 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPractice(set.id); }}
                        disabled={set.mcqs.length === 0}
                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 disabled:opacity-50"
                    >
                        <Icon name="play" size="sm" className="text-emerald-500" /> Practice
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onExam(set.id); }}
                        disabled={set.mcqs.length === 0}
                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 disabled:opacity-50"
                    >
                        <Icon name="clock" size="sm" className="text-indigo-500" /> Exam
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onExport(set.id, e); }}
                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50"
                    >
                        <Icon name="share" size="sm" className="text-slate-400" /> Export PDF
                    </button>
                    <button 
                        onClick={(e) => onRename(set, e)}
                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50"
                    >
                        <Icon name="edit-3" size="sm" className="text-slate-400" /> Edit
                    </button>
                    <button 
                        onClick={(e) => onArchive(set, e)}
                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50"
                    >
                        <Icon name="folder" size="sm" className="text-slate-400" /> {set.isArchived ? "Unarchive" : "Archive"}
                    </button>
                    <button 
                        onClick={(e) => onDelete(set, e)}
                        className="w-full text-left px-4 py-3 text-[14px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                        <Icon name="trash-2" size="sm" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
});

export default SetItem;
