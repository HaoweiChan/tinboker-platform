import type { Node, Edge } from 'reactflow';

interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  direction?: 'TB' | 'LR'; // Top to Bottom or Left to Right
}

/**
 * Calculate hierarchical layout for graph nodes
 * Organizes nodes in levels based on their position in the graph hierarchy
 */
export function calculateHierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const {
    horizontalSpacing = 250,
    verticalSpacing = 200,
    direction = 'TB',
  } = options;

  // Build adjacency maps
  const incomingEdges = new Map<string, string[]>();
  const outgoingEdges = new Map<string, string[]>();
  const nodeMap = new Map<string, Node>();

  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  });

  edges.forEach((edge) => {
    const sourceList = outgoingEdges.get(edge.source) || [];
    const targetList = incomingEdges.get(edge.target) || [];
    sourceList.push(edge.target);
    targetList.push(edge.source);
    outgoingEdges.set(edge.source, sourceList);
    incomingEdges.set(edge.target, targetList);
  });

  // Find root nodes (nodes with no incoming edges or nodes with most connections)
  const rootNodes = nodes.filter((node) => {
    const incoming = incomingEdges.get(node.id) || [];
    return incoming.length === 0;
  });

  // If no clear roots, use nodes with most outgoing connections
  if (rootNodes.length === 0) {
    let maxOutgoing = 0;
    nodes.forEach((node) => {
      const outgoing = outgoingEdges.get(node.id) || [];
      if (outgoing.length > maxOutgoing) {
        maxOutgoing = outgoing.length;
      }
    });
    rootNodes.push(...nodes.filter((node) => {
      const outgoing = outgoingEdges.get(node.id) || [];
      return outgoing.length === maxOutgoing;
    }));
  }

  // Assign levels using BFS
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ id: string; level: number }> = [];

  rootNodes.forEach((node) => {
    queue.push({ id: node.id, level: 0 });
    levels.set(node.id, 0);
    visited.add(node.id);
  });

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const outgoing = outgoingEdges.get(id) || [];

    outgoing.forEach((targetId) => {
      if (!visited.has(targetId)) {
        const targetLevel = level + 1;
        levels.set(targetId, targetLevel);
        visited.add(targetId);
        queue.push({ id: targetId, level: targetLevel });
      } else {
        // If already visited, update level if this path is shorter
        const currentLevel = levels.get(targetId) || Infinity;
        const newLevel = level + 1;
        if (newLevel < currentLevel) {
          levels.set(targetId, newLevel);
        }
      }
    });
  }

  // Handle unvisited nodes (disconnected components)
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      levels.set(node.id, 0);
    }
  });

  // Group nodes by level
  const nodesByLevel = new Map<number, Node[]>();
  nodes.forEach((node) => {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });

  // Calculate positions
  const updatedNodes = nodes.map((node) => {
    const level = levels.get(node.id) || 0;
    const levelNodes = nodesByLevel.get(level) || [];
    const indexInLevel = levelNodes.findIndex((n) => n.id === node.id);

    let x: number;
    let y: number;

    if (direction === 'TB') {
      // Top to Bottom layout
      const nodesInLevel = levelNodes.length;
      const totalWidth = (nodesInLevel - 1) * horizontalSpacing;
      const startX = -totalWidth / 2;
      x = startX + indexInLevel * horizontalSpacing;
      y = level * verticalSpacing;
    } else {
      // Left to Right layout
      const nodesInLevel = levelNodes.length;
      const totalHeight = (nodesInLevel - 1) * horizontalSpacing;
      const startY = -totalHeight / 2;
      y = startY + indexInLevel * horizontalSpacing;
      x = level * verticalSpacing;
    }

    return {
      ...node,
      position: { x, y },
    };
  });

  return updatedNodes;
}

