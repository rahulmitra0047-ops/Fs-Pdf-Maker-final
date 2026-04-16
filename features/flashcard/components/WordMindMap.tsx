import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WordCluster, ClusterNode } from '../../../types';

// Custom Node Components
const CenterNode = ({ data }: any) => (
  <div className="px-8 py-5 rounded-[24px] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-[0_8px_30px_rgb(79,70,229,0.3)] border-4 border-white text-center min-w-[140px] relative">
    <div className="absolute inset-0 bg-white/10 rounded-[20px] blur-sm"></div>
    <div className="relative z-10">
      <div className="text-[28px] font-black tracking-tight">{data.word}</div>
      <div className="text-[10px] font-bold opacity-90 uppercase tracking-widest mt-1.5 bg-white/20 inline-block px-2 py-0.5 rounded-full">Core Word</div>
    </div>
    <Handle type="source" position={Position.Right} className="opacity-0" />
  </div>
);

const CategoryNode = ({ data }: any) => (
  <div className={`px-5 py-2.5 rounded-[16px] border-2 bg-white shadow-sm text-center min-w-[110px] ${data.colorClass} relative overflow-hidden`}>
    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-current opacity-20"></div>
    <Handle type="target" position={Position.Left} className="opacity-0" />
    <div className="text-[12px] font-black uppercase tracking-widest text-slate-700">{data.label}</div>
    <Handle type="source" position={Position.Right} className="opacity-0" />
  </div>
);

const WordNode = ({ data }: any) => (
  <div 
    className={`px-5 py-3.5 rounded-[20px] border-2 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.04)] cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 min-w-[160px] ${data.colorClass} group`} 
    onClick={() => data.onClick(data.nodeData, data.typeLabel, data.category)}
  >
    <Handle type="target" position={Position.Left} className="opacity-0" />
    <div className="text-[18px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{data.word}</div>
    <div className="text-[12px] font-medium text-slate-500 mt-0.5">{data.meaning}</div>
  </div>
);

const nodeTypes = {
  center: CenterNode,
  category: CategoryNode,
  word: WordNode,
};

interface WordMindMapProps {
  cluster: WordCluster;
  onNodeClick: (node: ClusterNode, typeLabel: string, category: keyof WordCluster) => void;
}

export const WordMindMap: React.FC<WordMindMapProps> = ({ cluster, onNodeClick }) => {
  const { nodes, edges } = useMemo(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    let currentY = 0;
    const xCategory = 180;
    const xWord = 360;

    const addCategoryBranch = (
      categoryId: string, 
      label: string, 
      words: ClusterNode[], 
      colorClass: string,
      categoryKey: keyof WordCluster
    ) => {
      if (!words || words.length === 0) return;

      const branchHeight = words.length * 60;
      const catY = currentY + (branchHeight / 2) - 30;

      // Category Node
      initialNodes.push({
        id: categoryId,
        type: 'category',
        position: { x: xCategory, y: catY },
        data: { label, colorClass },
      });

      // Edge from Center to Category
      initialEdges.push({
        id: `e-center-${categoryId}`,
        source: 'center',
        target: categoryId,
        type: 'default',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      });

      // Word Nodes
      words.forEach((word, index) => {
        const wordId = `word-${word.id}`;
        const wordY = currentY + (index * 60);
        
        initialNodes.push({
          id: wordId,
          type: 'word',
          position: { x: xWord, y: wordY },
          data: { 
            word: word.word, 
            meaning: word.meaning, 
            colorClass,
            nodeData: word,
            typeLabel: label,
            category: categoryKey,
            onClick: onNodeClick
          },
        });

        // Edge from Category to Word
        initialEdges.push({
          id: `e-${categoryId}-${wordId}`,
          source: categoryId,
          target: wordId,
          type: 'default',
          style: { stroke: '#cbd5e1', strokeWidth: 2 },
        });
      });

      currentY += branchHeight + 15; // Add spacing between categories
    };

    addCategoryBranch('cat-adv', 'Advanced', cluster.advancedWords || [], 'border-slate-200 text-slate-700', 'advancedWords');
    addCategoryBranch('cat-gre', 'GRE', cluster.greWords || [], 'border-slate-200 text-slate-700', 'greWords');
    addCategoryBranch('cat-idm', 'Idioms', cluster.idioms || [], 'border-slate-200 text-slate-700', 'idioms');
    addCategoryBranch('cat-sub', 'Substitutes', cluster.oneWordSubstitutes || [], 'border-slate-200 text-slate-700', 'oneWordSubstitutes');

    // 1. Center Node (Positioned vertically in the middle)
    initialNodes.push({
      id: 'center',
      type: 'center',
      position: { x: 0, y: (currentY / 2) - 40 },
      data: { word: cluster.basicWord },
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [cluster, onNodeClick]);

  return (
    <div className="w-full h-full bg-gray-50/50 rounded-[24px]">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1, minZoom: 0.1, maxZoom: 1.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls showInteractive={false} className="bg-white shadow-md border-gray-100 rounded-xl overflow-hidden" />
      </ReactFlow>
    </div>
  );
};
