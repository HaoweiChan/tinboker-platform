/**
 * Shared nodeTypes for React Flow components
 * 
 * Defined in a separate module to ensure stable references
 * and prevent React Flow warnings about recreated nodeTypes objects.
 */

import { StockNode } from './StockNode';
import GroupNode from './GroupNode';
import PersonNode from './PersonNode';

// Standard nodeTypes for most graphs
export const standardNodeTypes = Object.freeze({
  company: StockNode,
  stock: StockNode,
});

// NodeTypes for layered/supply chain graphs (includes group nodes)
export const layeredNodeTypes = Object.freeze({
  company: StockNode,
  stock: StockNode,
  group: GroupNode,
});

// NodeTypes for force/cluster graphs (includes person nodes)
export const forceNodeTypes = Object.freeze({
  company: StockNode,
  stock: StockNode,
  person: PersonNode,
});

