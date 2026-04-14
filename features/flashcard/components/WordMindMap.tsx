import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WordCluster, ClusterNode } from '../../../types';

// Custom Node Components
const CenterNode = ({ data }: any) => (
  <div className="px-6 py-4 rounded-2xl bg-slate-800 text-white shadow-xl border-4 border-slate-700 text-center min-w-[120px]">
    <div className="text-2xl font-bold">{data.word}</div>
    <div className="text-xs opacity-80 uppercase tracking-widest mt-1">Core Word</div>
    <Handle type="source" position={Position.Right} className="opacity-0" />
  </div>
);

const CategoryNode = ({ data }: any) => (
  <div className={`px-4 py-2 rounded-xl border-2 bg-white shadow-sm text-center min-w-[100px] ${data.colorClass}`}>
    <Handle type="target" position={Position.Left} className="opacity-0" />
    <div className="text-sm font-bold uppercase tracking-wider">{data.label}</div>
    <Handle type="source" position={Position.Right} className="opacity-0" />
  </div>
);

const WordNode = ({ data }: any) => (
  <div 
    className={`px-4 py-3 rounded-xl border-2 bg-white shadow-md cursor-pointer hover:scale-105 transition-transform min-w-[140px] ${data.colorClass}`} 
    onClick={() => data.onClick(data.nodeData, data.typeLabel, data.category)}
  >
    <Handle type="target" position={Position.Left} className="opacity-0" />
    <div className="text-lg font-bold">{data.word}</div>
    <div className="text-xs opacity-70">{data.meaning}</div>
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
