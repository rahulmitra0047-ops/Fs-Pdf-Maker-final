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
            className="bg-surface border border-border rounded-none p-4 shadow-none hover:bg-[#EBE7DF] transition-colors cursor-pointer group flex items-center justify-between"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-border bg-background text-text-primary flex items-center justify-center font-serif text-lg font-medium transition-colors">
                    {subtopic.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 className="text-[16px] font-serif font-medium text-text-primary group-hover:text-primary transition-colors leading-tight">
                        {subtopic.name}
                    </h4>
                    <p className="text-[10px] font-sans font-semibold tracking-widest uppercase text-text-secondary mt-1">
                        {subtopic.setLen} Sets
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => onRename(subtopic, e)}
                    className="w-8 h-8 flex items-center justify-center border border-transparent hover:border-border text-text-secondary hover:text-text-primary hover:bg-[#EBE7DF] transition-colors rounded-none"
                    title="Rename"
                >
                    <Icon name="edit-3" size="sm" />
                </button>
                <button 
                    onClick={(e) => onDelete(subtopic, e)}
                    className="w-8 h-8 flex items-center justify-center border border-transparent hover:border-border text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors rounded-none"
                    title="Delete"
                >
                    <Icon name="trash-2" size="sm" />
                </button>
            </div>
        </div>
    );
});

export default SubtopicItem;
