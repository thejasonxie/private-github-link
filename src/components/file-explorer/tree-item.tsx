import { ChevronRight, File, Folder } from "lucide-react";
import * as React from "react";
import type { TreeNode } from "@/lib/types/github";
import { cn } from "@/lib/utils";

interface TreeItemProps {
	node: TreeNode;
	depth: number;
	onFileSelect?: (node: TreeNode) => void;
	selectedPath?: string;
	searchQuery?: string;
}

/**
 * Check if a node or any of its descendants match the search query
 */
export function hasMatchingDescendant(node: TreeNode, query: string): boolean {
	if (node.name.toLowerCase().includes(query.toLowerCase())) {
		return true;
	}
	if (node.children) {
		return node.children.some((child) => hasMatchingDescendant(child, query));
	}
	return false;
}

/**
 * Sort tree nodes: folders first, then files, alphabetically within each group
 */
export function sortTreeNodes(nodes: TreeNode[]): TreeNode[] {
	return [...nodes].sort((a, b) => {
		// Folders first, then files
		if (a.type === "tree" && b.type !== "tree") return -1;
		if (a.type !== "tree" && b.type === "tree") return 1;
		// Alphabetical within same type
		return a.name.localeCompare(b.name);
	});
}

export function TreeItem({
	node,
	depth,
	onFileSelect,
	selectedPath,
	searchQuery,
}: TreeItemProps) {
	const [isOpen, setIsOpen] = React.useState(false);
	const isFolder = node.type === "tree";
	const isSelected = selectedPath === node.path;

	// Auto-expand if search matches a child
	React.useEffect(() => {
		if (searchQuery && isFolder && node.children) {
			const hasMatchingChild = hasMatchingDescendant(node, searchQuery);
			if (hasMatchingChild) {
				setIsOpen(true);
			}
		}
	}, [searchQuery, isFolder, node]);

	const handleClick = () => {
		if (isFolder) {
			setIsOpen(!isOpen);
		} else {
			onFileSelect?.(node);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleClick();
		}
		if (e.key === "ArrowRight" && isFolder && !isOpen) {
			setIsOpen(true);
		}
		if (e.key === "ArrowLeft" && isFolder && isOpen) {
			setIsOpen(false);
		}
	};

	// Filter out non-matching items when searching
	if (searchQuery) {
		const matches = node.name.toLowerCase().includes(searchQuery.toLowerCase());
		const hasMatchingChild =
			isFolder && node.children && hasMatchingDescendant(node, searchQuery);
		if (!matches && !hasMatchingChild) {
			return null;
		}
	}

	return (
		<div data-slot="tree-item">
			<div
				role="treeitem"
				aria-expanded={isFolder ? isOpen : undefined}
				aria-selected={isSelected}
				tabIndex={0}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				className={cn(
					"group flex items-center gap-1 py-1 px-2 cursor-pointer rounded-md text-sm",
					"hover:bg-accent/50 focus:bg-accent/50 focus:outline-none",
					isSelected && "bg-accent text-accent-foreground",
				)}
				style={{ paddingLeft: `${depth * 16 + 8}px` }}
			>
				{isFolder ? (
					<ChevronRight
						className={cn(
							"size-4 shrink-0 text-muted-foreground transition-transform duration-200",
							isOpen && "rotate-90",
						)}
					/>
				) : (
					<span className="w-4" />
				)}
				{isFolder ? (
					<Folder
						className="size-4 shrink-0 text-blue-400"
						fill="currentColor"
					/>
				) : (
					<File className="size-4 shrink-0 text-muted-foreground" />
				)}
				<span className="truncate">{node.name}</span>
			</div>
			{isFolder && isOpen && node.children && (
				<div>
					{sortTreeNodes(node.children).map((child) => (
						<TreeItem
							key={child.path}
							node={child}
							depth={depth + 1}
							onFileSelect={onFileSelect}
							selectedPath={selectedPath}
							searchQuery={searchQuery}
						/>
					))}
				</div>
			)}
		</div>
	);
}
