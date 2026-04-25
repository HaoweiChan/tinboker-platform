import ELK from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from 'reactflow';

// Initialize ELK (synchronous version, no web worker)
const elk = new ELK();

/**
 * Calculate layout using ELK.js for better edge routing and label positioning
 * ELK provides enterprise-grade layout algorithms that handle label collisions
 */
export async function calculateELKLayout(
  nodes: Node[],
  edges: Edge[],
  options: {
    nodeWidth?: number;
    nodeHeight?: number;
    direction?: 'TB' | 'LR';
  } = {}
): Promise<Node[]> {
  const {
    nodeWidth = 144,
    direction = 'TB',
  } = options;

  // Convert React Flow graph to ELK graph format
  // Use actual node sizes if available, otherwise use defaults
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction === 'TB' ? 'DOWN' : 'RIGHT',

      // 💡 TIGHT NODE SPACING
      'elk.spacing.nodeNode': '20',
      'elk.layered.spacing.nodeNodeBetweenLayers': '40',
      'elk.layered.spacing.edgeNodeBetweenLayers': '20',

      // 💡 SUPER-COMPACT EDGE LABELS
      'elk.spacing.edgeNode': '5',
      'elk.spacing.edgeEdge': '5',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '10',

      // 💡 MINIMAL PORT/ANCHOR SPACING (ReactFlow thinks all handles are ports)
      'elk.portConstraints': 'FREE',
      'elk.portAlignment.default': 'CENTER',

      // 💡 IMPROVES TIGHTNESS WITHOUT DESTROYING EDGE ROUTING
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'MEDIAN',
      'elk.layered.layering.strategy': 'LONGEST_PATH',
      'elk.layered.cycleBreaking.strategy': 'GREEDY',

      // 💡 ALLOW EDGES TO BE ROUTED WITHOUT FORCING LARGE GAPS
      'elk.edgeRouting': 'ORTHOGONAL',
    },
    children: nodes.map((node) => {
      // Use actual circle size if available, otherwise use defaults
      const size = (node.data as any)?.circleSize ?? 
                   (node.width && node.height ? Math.max(node.width, node.height) : null) ??
                   nodeWidth;
      return {
        id: node.id,
        width: size,
        height: size,
        labels: node.data?.label ? [{ text: node.data.label }] : [],
      };
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
      labels: edge.label ? [{ text: String(edge.label) }] : [],
    })),
  };

  try {
    // Calculate layout using ELK
    const layoutedGraph = await elk.layout(elkGraph);

    // Convert ELK layout back to React Flow format
    const layoutedNodes = nodes.map((node) => {
      const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
      if (elkNode && elkNode.x !== undefined && elkNode.y !== undefined) {
        return {
          ...node,
          position: {
            x: elkNode.x,
            y: elkNode.y,
          },
        };
      }
      return node;
    });

    return layoutedNodes;
  } catch (error) {
    console.error('ELK layout calculation failed:', error);
    // Fallback to original nodes if ELK fails
    return nodes;
  }
}

