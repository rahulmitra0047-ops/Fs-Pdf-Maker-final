import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WordCluster, ClusterNode } from '../../../types';

// Custom Node Components
const CenterNode = ({ data }: any) => (
  <div className="px-6 py-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl border-4 border-white text-center min-w-[120px]">
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

    // 1. Center Node
    initialNodes.push({
      id: 'center',
      type: 'center',
      position: { x: 50, y: 350 },
      data: { word: cluster.basicWord },
    });

    // Helper to add category and its words
    const addCategoryBranch = (
      categoryId: string, 
      label: string, 
      catY: number, 
      words: ClusterNode[], 
      colorClass: string,
      categoryKey: keyof WordCluster
    ) => {
      // Category Node
      initialNodes.push({
        id: categoryId,
        type: 'category',
        position: { x: 350, y: catY },
        data: { label, colorClass },
      });

      // Edge from Center to Category
      initialEdges.push({
        id: `e-center-${categoryId}`,
        source: 'center',
        target: categoryId,
        type: 'bezier',
        animated: true,
        style: { stroke: '#818cf8', strokeWidth: 2 },
      });

      // Word Nodes
      const startY = catY - ((words.length - 1) * 40); // Center the words vertically relative to category
      words.forEach((word, index) => {
        const wordId = `word-${word.id}`;
        initialNodes.push({
          id: wordId,
          type: 'word',
          position: { x: 650, y: startY + (index * 80) },
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
          type: 'bezier',
          style: { stroke: '#c7d2fe', strokeWidth: 2 },
        });
      });
    };

    addCategoryBranch('cat-adv', 'Advanced', 100, cluster.advancedWords || [], 'border-blue-200 text-blue-700', 'advancedWords');
    addCategoryBranch('cat-gre', 'GRE', 280, cluster.greWords || [], 'border-orange-200 text-orange-700', 'greWords');
    addCategoryBranch('cat-idm', 'Idioms', 480, cluster.idioms || [], 'border-green-200 text-green-700', 'idioms');
    addCategoryBranch('cat-sub', 'Substitutes', 660, cluster.oneWordSubstitutes || [], 'border-purple-200 text-purple-700', 'oneWordSubstitutes');

    return { nodes: initialNodes, edges: initialEdges };
  }, [cluster, onNodeClick]);

  return (
    <div className="w-full h-full bg-gray-50/50 rounded-[24px]">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Background color="#e0e7ff" gap={16} />
        <Controls showInteractive={false} className="bg-white shadow-md border-gray-100 rounded-xl overflow-hidden" />
      </ReactFlow>
    </div>
  );
};
