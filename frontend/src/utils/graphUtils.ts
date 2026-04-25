import dagre from 'dagre';
import { Position } from 'reactflow';
import type { Node, Edge } from 'reactflow';

const nodeWidth = 220;
const nodeHeight = 100;


// --- Auto Layout for DAG and Trees ---
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Slight randomization to avoid perfect stiffness if desired, but keeping strict for now
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // Shift position so the center is correct
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

// --- Mock Data Generators (Re-exported from organized mocks) ---
// These functions are now imported from @/services/mocks to maintain backward compatibility
// New code should import directly from @/services/mocks

export {
  getSectorBubbleData,
  getSectorPerformanceStats,
  getTreeMapData,
  getSupplyChainData,
  getOwnershipData,
  getClusterData,
} from '@/services/mocks';
