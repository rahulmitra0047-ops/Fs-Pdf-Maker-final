
import React, { useState, useMemo } from 'react';
import PremiumCard from '../../../shared/components/PremiumCard';
import { MCQ } from '../../../types';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import Icon from '../../../shared/components/Icon';

interface Props {
  mcqs: MCQ[];
  onEdit: (mcq: MCQ) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onReorder?: (newMCQs: MCQ[]) => void;
}

const RENDER_BATCH_SIZE = 20;

const MCQItem = React.memo(({ mcq, index, isSelected, isSelectionMode, isDragging, onEdit, toggleSelect, handleDragStart, handleDragOver, handleDrop, handleDragEnd }: any) => {
    return (
        <div
            draggable={!isSelectionMode && !!handleDragStart}
            onDragStart={(e) => handleDragStart && handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver && handleDragOver(e, index)}
            onDrop={(e) => handleDrop && handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`transition-all duration-200 ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
        >
            <div 
                className={`relative group bg-white border rounded-[18px] p-4 transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] mb-3 ${isSelected ? 'border-[#6366F1] bg-[#F5F7FF] ring-1 ring-[#6366F1]' : 'border-[#F3F4F6] hover:border-[#E5E7EB] hover:shadow-md'}`}
                onClick={isSelectionMode ? () => toggleSelect(mcq.id) : undefined}
            >
              <div className="flex justify-between items-start gap-3">
                {isSelectionMode && (
                    <div className="pt-1">
                        <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#6366F1] border-[#6366F1]' : 'bg-white border-[#D1D5DB]'}`}>
                            {isSelected && <Icon name="check" size="sm" className="text-white" />}
                        </div>
                    </div>
                )}
                
                {!isSelectionMode && handleDragStart && (
                    <div className="pt-1 cursor-grab active:cursor-grabbing text-[#D1D5DB] hover:text-[#6B7280]">
                         <Icon name="more-vertical" size="sm" />
                    </div>
                )}

                <div className="flex-1 pr-8">
                  <h4 className="text-[15px] font-semibold text-[#111827] line-clamp-2 mb-2.5 select-none leading-snug">
                    <span className="text-[#6366F1] mr-2">#{index + 1}</span>
                    {mcq.question}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] text-[#374151] mb-2 select-none">
                     <div className={`flex items-center gap-1.5 ${mcq.answer === 'A' ? 'text-[#059669] font-semibold' : ''}`}>
                        <span className="opacity-60 text-xs font-bold w-4">A)</span> 
                        <span className="truncate">{mcq.optionA}</span>
                     </div>
                     <div className={`flex items-center gap-1.5 ${mcq.answer === 'B' ? 'text-[#059669] font-semibold' : ''}`}>
                        <span className="opacity-60 text-xs font-bold w-4">B)</span> 
                        <span className="truncate">{mcq.optionB}</span>
                     </div>
                     <div className={`flex items-center gap-1.5 ${mcq.answer === 'C' ? 'text-[#059669] font-semibold' : ''}`}>
                        <span className="opacity-60 text-xs font-bold w-4">C)</span> 
                        <span className="truncate">{mcq.optionC}</span>
                     </div>
                     <div className={`flex items-center gap-1.5 ${mcq.answer === 'D' ? 'text-[#059669] font-semibold' : ''}`}>
                        <span className="opacity-60 text-xs font-bold w-4">D)</span> 
                        <span className="truncate">{mcq.optionD}</span>
                     </div>
                  </div>

                  {mcq.source && (
                      <div className="text-[11px] text-[#9CA3AF] mt-2 flex items-center gap-1.5 select-none bg-[#F9FAFB] px-2 py-1 rounded-md inline-flex border border-[#F3F4F6]">
                          <Icon name="check-circle" size="sm" />
                          <span className="font-medium">{mcq.source}</span>
                      </div>
                  )}
                </div>

                {!isSelectionMode && (
                    <div className="absolute top-3 right-3">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(mcq); }}
                            className="p-1.5 rounded-full text-[#D1D5DB] hover:text-[#6366F1] hover:bg-[#EEF2FF] transition-colors"
                        >
                            <Icon name="edit-3" size="sm" />
                        </button>
                    </div>
                )}
              </div>
            </div>
        </div>
    );
});

const MCQList: React.FC<Props> = ({ mcqs, onEdit, onDelete, onBulkDelete, onReorder }) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(RENDER_BATCH_SIZE);
  
  // DnD State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toggleSelectionMode = () => {
      if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedIds(new Set());
      } else {
          setIsSelectionMode(true);
      }
  };

  const toggleSelect = (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          newSelected.add(id);
      }
      setSelectedIds(newSelected);
  };

  const selectAll = () => {
      if (selectedIds.size === mcqs.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(mcqs.map(m => m.id)));
      }
  };

  const confirmBulkDelete = () => {
      if (selectedIds.size === 0) return;
      setShowDeleteConfirm(true);
  };

  const performBulkDelete = () => {
      onBulkDelete(Array.from(selectedIds));
      setShowDeleteConfirm(false);
      setIsSelectionMode(false);
      setSelectedIds(new Set());
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
      if (!onReorder || isSelectionMode) return;
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      if (draggedIndex === null || draggedIndex === index || !onReorder || isSelectionMode) return;
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
      if (draggedIndex === null || !onReorder || isSelectionMode) return;
      e.preventDefault();
      
      const newMCQs = [...mcqs];
      const [removed] = newMCQs.splice(draggedIndex, 1);
      newMCQs.splice(targetIndex, 0, removed);
      
      onReorder(newMCQs);
      setDraggedIndex(null);
  };

  const handleDragEnd = () => {
      setDraggedIndex(null);
  };

  const visibleMCQs = useMemo(() => mcqs.slice(0, visibleCount), [mcqs, visibleCount]);

  if (mcqs.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px] border-2 border-dashed border-[#E5E7EB] rounded-[24px] m-4 bg-[#F9FAFB]">
           <div className="text-[#D1D5DB] mb-4 opacity-50"><Icon name="list" size="xl" /></div>
           <h3 className="text-[17px] font-semibold text-[#374151]">No MCQs yet</h3>
           <p className="text-[14px] text-[#9CA3AF] mt-1">Tap + to add your first MCQ or use Bulk Import</p>
        </div>
    );
  }

  return (
    <div className="p-5 space-y-4 pb-24 relative">
      {isSelectionMode && (
          <div className="sticky top-[120px] z-20 bg-white p-3 rounded-[14px] shadow-lg border border-[#F3F4F6] flex items-center justify-between mb-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3 pl-2">
                  <div 
                    onClick={selectAll}
                    className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center cursor-pointer transition-colors ${selectedIds.size === mcqs.length ? 'bg-[#6366F1] border-[#6366F1]' : 'bg-white border-[#D1D5DB]'}`}
                  >
                      {selectedIds.size === mcqs.length && <Icon name="check" size="sm" className="text-white" />}
                  </div>
                  <span className="font-semibold text-[#111827] text-sm">{selectedIds.size} Selected</span>
              </div>
              <div className="flex gap-2">
                  <button onClick={toggleSelectionMode} className="text-xs px-3 py-2 text-[#6B7280] hover:bg-[#F9FAFB] rounded-[8px] font-medium border border-transparent hover:border-[#F3F4F6]">Cancel</button>
                  {selectedIds.size > 0 && (
                    <button 
                        onClick={confirmBulkDelete} 
                        className="text-xs px-3 py-2 bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] rounded-[8px] font-bold flex items-center gap-1.5"
                    >
                        <Icon name="trash-2" size="sm" />
                        Delete {selectedIds.size}
                    </button>
                  )}
              </div>
          </div>
      )}

      {!isSelectionMode && (
        <div className="flex items-center justify-between px-1">
            <span className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide">{mcqs.length} Questions</span>
            <button 
                onClick={toggleSelectionMode}
                className="text-[13px] text-[#6366F1] hover:text-[#4F46E5] font-semibold flex items-center gap-1.5 bg-[#EEF2FF] px-3 py-1.5 rounded-[10px] transition-colors"
            >
                <Icon name="check-circle" size="sm" />
                Select
            </button>
        </div>
      )}

      <div className="space-y-3">
        {visibleMCQs.map((mcq, index) => (
            <MCQItem 
                key={mcq.id} 
                mcq={mcq} 
                index={index} 
                isSelected={selectedIds.has(mcq.id)}
                isSelectionMode={isSelectionMode}
                isDragging={draggedIndex === index}
                onEdit={onEdit}
                toggleSelect={toggleSelect}
                handleDragStart={onReorder ? handleDragStart : undefined}
                handleDragOver={onReorder ? handleDragOver : undefined}
                handleDrop={onReorder ? handleDrop : undefined}
                handleDragEnd={onReorder ? handleDragEnd : undefined}
            />
        ))}
      </div>

      {visibleCount < mcqs.length && (
          <button 
            onClick={() => setVisibleCount(prev => prev + RENDER_BATCH_SIZE)}
            className="w-full py-3.5 text-[14px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-[14px] hover:bg-[#F9FAFB] transition-colors shadow-sm mt-4"
          >
              Show More ({mcqs.length - visibleCount} remaining)
          </button>
      )}

      <PremiumModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete MCQs?" size="sm">
          <div className="space-y-5 text-center">
              <div className="w-16 h-16 bg-[#FEF2F2] rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="trash-2" size="lg" className="text-[#EF4444]" />
              </div>
              <p className="text-[#374151] text-[15px]">
                  Are you sure you want to delete <b>{selectedIds.size}</b> MCQs? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                  <PremiumButton variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</PremiumButton>
                  <PremiumButton variant="danger" onClick={performBulkDelete}>Delete Forever</PremiumButton>
              </div>
          </div>
      </PremiumModal>
    </div>
  );
};

export default MCQList;
