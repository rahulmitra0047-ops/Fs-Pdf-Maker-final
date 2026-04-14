import React, { memo } from 'react';
import { Subtopic } from '../../../types';
import Icon from '../../../shared/components/Icon';

interface SubtopicItemProps {
    subtopic: Subtopic & { setLen: number };
    onNavigate: (id: string) => void;
    onRename: (subtopic: Subtopic, e: React.MouseEvent) => void;
    onDelete: (subtopic: Subtopic, e: React.MouseEvent) => void;
}

const SubtopicItem: React.FC<SubtopicItemProps> = memo(({
    subtopic,
    onNavigate,
    onRename,
    onDelete
}) => {
    return (
        <div 
            onClick={() => onNavigate(subtopic.id)}
            className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.99] cursor-pointer group"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center text-sm font-bold border border-slate-100">
                        {subtopic.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {subtopic.name}
                        </h4>
                        <p className="text-xs font-normal text-slate-500 mt-0.5">
                            {subtopic.setLen} Sets
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-0.5">
                    <button 
                        onClick={(e) => onRename(subtopic, e)}
                        className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors rounded-full"
                    >
                        <Icon name="edit-3" size="sm" className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => onDelete(subtopic, e)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-full"
                    >
                        <Icon name="trash-2" size="sm" className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default SubtopicItem;
