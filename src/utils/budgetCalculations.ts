import { BucketNode, OverallTotals, Transaction } from '../types';

/**
 * Gets leaf buckets (buckets without children, usually Level 3 or Level 2 if no Level 3 exists)
 */
export function getLeafBuckets(nodes: BucketNode[]): BucketNode[] {
  const leaves: BucketNode[] = [];

  function traverse(node: BucketNode) {
    if (!node.children || node.children.length === 0) {
      leaves.push(node);
    } else {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return leaves;
}

/**
 * Flattens bucket tree into a simple list with depth level metadata
 */
export function flattenBuckets(
  nodes: BucketNode[],
  depth = 0
): { node: BucketNode; depth: number; pathName: string }[] {
  const result: { node: BucketNode; depth: number; pathName: string }[] = [];

  function traverse(node: BucketNode, currentDepth: number, parentPath: string) {
    const currentPath = parentPath ? `${parentPath} › ${node.name}` : node.name;
    result.push({ node, depth: currentDepth, pathName: currentPath });

    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => traverse(child, currentDepth + 1, currentPath));
    }
  }

  nodes.forEach((n) => traverse(n, depth, ''));
  return result;
}

/**
 * Recursively computes totals for a single bucket (including self + all descendants)
 */
export function calculateBucketTotals(
  node: BucketNode,
  _transactions?: Transaction[]
): {
  allocatedTotal: number;
  feeTotal: number;
} {
  // If node is muted, exclude it completely from budget calculations
  if (node.isMuted) {
    return {
      allocatedTotal: 0,
      feeTotal: 0,
    };
  }

  // If node has children, its totals are the sum of children's totals
  if (node.children && node.children.length > 0) {
    let allocatedTotal = 0;
    let feeTotal = 0;

    node.children.forEach((child) => {
      const childTotals = calculateBucketTotals(child, _transactions);
      allocatedTotal += childTotals.allocatedTotal;
      feeTotal += childTotals.feeTotal;
    });

    // Add node's own direct fee if allocatedTotal > 0 (fee excluded if amount is zero)
    if (allocatedTotal > 0 && node.fee) {
      feeTotal += node.fee;
    }

    return {
      allocatedTotal,
      feeTotal,
    };
  } else {
    const allocatedTotal = node.allocated || 0;
    // Exclude dedicated fee if allocated amount is zero
    const feeTotal = allocatedTotal > 0 ? (node.fee || 0) : 0;

    return {
      allocatedTotal,
      feeTotal,
    };
  }
}

/**
 * Calculates global budget totals across all root nodes
 */
export function calculateOverallTotals(
  totalPool: number,
  nodes: BucketNode[],
  transactions: Transaction[] = []
): OverallTotals {
  let totalAllocated = 0;
  let totalFees = 0;

  nodes.forEach((node) => {
    const totals = calculateBucketTotals(node, transactions);
    totalAllocated += totals.allocatedTotal;
    totalFees += totals.feeTotal;
  });

  const unallocatedPool = totalPool - (totalAllocated + totalFees);

  return {
    totalPool,
    totalAllocated,
    totalFees,
    unallocatedPool,
  };
}

/**
 * Finds a bucket by ID within the recursive tree structure
 */
export function findBucketById(nodes: BucketNode[], id: string): BucketNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findBucketById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Updates a bucket in the tree immutably
 */
export function updateBucketInTree(
  nodes: BucketNode[],
  targetId: string,
  updater: (node: BucketNode) => BucketNode
): BucketNode[] {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return updater({ ...node });
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateBucketInTree(node.children, targetId, updater),
      };
    }
    return node;
  });
}

/**
 * Adds a new child bucket under a specific parent ID or at root if parentId is null
 */
export function addChildBucketToTree(
  nodes: BucketNode[],
  parentId: string | null,
  newBucket: BucketNode
): BucketNode[] {
  if (parentId === null) {
    return [newBucket, ...nodes];
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      const existingChildren = node.children || [];
      return {
        ...node,
        children: [newBucket, ...existingChildren],
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: addChildBucketToTree(node.children, parentId, newBucket),
      };
    }
    return node;
  });
}

/**
 * Removes a bucket from the tree by ID
 */
export function removeBucketFromTree(nodes: BucketNode[], targetId: string): BucketNode[] {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => {
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: removeBucketFromTree(node.children, targetId),
        };
      }
      return node;
    });
}

/**
 * Recursively adjusts levels for a node and its children based on the parent's level
 */
export function adjustNodeLevels(node: BucketNode, parentLevel: number): BucketNode {
  const newLevel = Math.min(3, Math.max(1, parentLevel + 1)) as 1 | 2 | 3;
  const updatedChildren = node.children?.map((child) => adjustNodeLevels(child, newLevel));
  return {
    ...node,
    level: newLevel,
    children: updatedChildren && updatedChildren.length > 0 ? updatedChildren : undefined,
  };
}

/**
 * Checks if targetId is the node itself or inside the node's subtree
 */
export function isDescendant(node: BucketNode, targetId: string): boolean {
  if (node.id === targetId) return true;
  if (node.children) {
    return node.children.some((child) => isDescendant(child, targetId));
  }
  return false;
}

/**
 * Moves a bucket (and its sub-tree) to a target ID (or root if null) with relative positioning ('before', 'after', 'inside')
 */
export function moveBucketInTree(
  nodes: BucketNode[],
  movedId: string,
  targetId: string | null,
  position: 'before' | 'after' | 'inside' = 'inside'
): BucketNode[] {
  const movedNode = findBucketById(nodes, movedId);
  if (!movedNode) return nodes;

  // Prevent moving into itself or its own descendant
  if (targetId) {
    if (isDescendant(movedNode, targetId)) {
      return nodes;
    }
  }

  const targetNode = targetId ? findBucketById(nodes, targetId) : null;

  // Remove node from tree first
  const treeWithoutNode = removeBucketFromTree(nodes, movedId);

  // Case 1: Target is root canvas
  if (!targetId || !targetNode) {
    const reLeveledNode: BucketNode = {
      ...adjustNodeLevels(movedNode, 0),
      parentId: null,
    };
    if (position === 'before') {
      return [reLeveledNode, ...treeWithoutNode];
    }
    return [...treeWithoutNode, reLeveledNode];
  }

  // Case 2: Position === 'inside'
  if (position === 'inside') {
    const targetParentLevel = targetNode.level;
    const reLeveledNode: BucketNode = {
      ...adjustNodeLevels(movedNode, targetParentLevel),
      parentId: targetNode.id,
    };
    return addChildBucketToTree(treeWithoutNode, targetNode.id, reLeveledNode);
  }

  // Case 3: Position === 'before' or 'after' relative to targetNode
  const newParentId = targetNode.parentId || null;
  const targetParentNode = newParentId ? findBucketById(treeWithoutNode, newParentId) : null;
  const parentLevel = targetParentNode ? targetParentNode.level : 0;

  const reLeveledNode: BucketNode = {
    ...adjustNodeLevels(movedNode, parentLevel),
    parentId: newParentId,
  };

  return insertNodeRelative(treeWithoutNode, targetNode.id, reLeveledNode, position);
}

function insertNodeRelative(
  list: BucketNode[],
  targetId: string,
  newNode: BucketNode,
  position: 'before' | 'after'
): BucketNode[] {
  const targetIndex = list.findIndex((n) => n.id === targetId);
  if (targetIndex !== -1) {
    const insertIdx = position === 'before' ? targetIndex : targetIndex + 1;
    const newList = [...list];
    newList.splice(insertIdx, 0, newNode);
    return newList;
  }

  return list.map((node) => {
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: insertNodeRelative(node.children, targetId, newNode, position),
      };
    }
    return node;
  });
}
