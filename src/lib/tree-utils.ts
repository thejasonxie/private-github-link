import type { TreeNode } from "./types/github";

/**
 * Recursively search for a tree node by path
 * @param nodes - Array of tree nodes to search
 * @param targetPath - Path to search for
 * @returns The tree node if found, null otherwise
 */
export function findNode(
	nodes: TreeNode[],
	targetPath: string,
): TreeNode | null {
	for (const node of nodes) {
		if (node.path === targetPath) {
			return node;
		}
		if (node.children) {
			const found = findNode(node.children, targetPath);
			if (found) return found;
		}
	}
	return null;
}
