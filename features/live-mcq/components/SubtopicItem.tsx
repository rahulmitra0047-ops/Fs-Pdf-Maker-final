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
            className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.99] cursor-pointer group"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-[16px] font-bold border border-slate-100">
                        {subtopic.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-[16px] font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {subtopic.name}
                        </h4>
                        <p className="text-[13px] font-normal text-slate-500 mt-0.5">
                            {subtopic.setLen} Sets
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    <button 
                        onClick={(e) => onRename(subtopic, e)}
                        className="p-2 text-slate-300 hover:text-slate-600 transition-colors rounded-full"
                    >
                        <Icon name="edit-3" size="sm" />
                    </button>
                    <button 
                        onClick={(e) => onDelete(subtopic, e)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-full"
                    >
                        <Icon name="trash-2" size="sm" />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default SubtopicItem;
