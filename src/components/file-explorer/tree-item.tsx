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
	isExpanded?: boolean;
	onToggleExpand?: (node: TreeNode) => void;
	onLoadChildren?: (path: string) => Promise<void>;
	onHover?: (node: TreeNode) => void;
	loadingPaths?: Set<string>;
	errorPaths?: Map<string, string>;
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
	isExpanded,
	onToggleExpand,
	onLoadChildren,
	onHover,
	loadingPaths,
	errorPaths,
}: TreeItemProps) {
	// Use controlled state if provided, otherwise use internal state
	const [internalOpen, setInternalOpen] = React.useState(false);
	const isOpen = isExpanded ?? internalOpen;
	const isFolder = node.type === "tree";
	const isSelected = selectedPath === node.path;
	const isLoading = loadingPaths?.has(node.path) ?? false;
	const errorMessage = errorPaths?.get(node.path);

	// Auto-expand if search matches a child
	React.useEffect(() => {
		if (searchQuery && isFolder && node.children) {
			const hasMatchingChild = hasMatchingDescendant(node, searchQuery);
			if (hasMatchingChild && !isOpen) {
				if (onToggleExpand) {
					onToggleExpand(node);
				} else {
					setInternalOpen(true);
					// Load children if needed for nested items
					if (
						onLoadChildren &&
						(!node.children || node.children.length === 0)
					) {
						onLoadChildren(node.path);
					}
				}
			}
		}
	}, [searchQuery, isFolder, node, isOpen, onToggleExpand, onLoadChildren]);

	const handleClick = async () => {
		if (isFolder) {
			if (onToggleExpand) {
				onToggleExpand(node);
			} else {
				// Using internal state - need to handle loading children ourselves
				const willOpen = !internalOpen;
				setInternalOpen(willOpen);
				if (
					willOpen &&
					onLoadChildren &&
					(!node.children || node.children.length === 0)
				) {
					await onLoadChildren(node.path);
				}
			}
		} else {
			onFileSelect?.(node);
		}
	};

	const handleKeyDown = async (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			await handleClick();
		}
		if (e.key === "ArrowRight" && isFolder && !isOpen) {
			if (onToggleExpand) {
				onToggleExpand(node);
			} else {
				setInternalOpen(true);
				if (onLoadChildren && (!node.children || node.children.length === 0)) {
					await onLoadChildren(node.path);
				}
			}
		}
		if (e.key === "ArrowLeft" && isFolder && isOpen) {
			if (onToggleExpand) {
				onToggleExpand(node);
			} else {
				setInternalOpen(false);
			}
		}
	};

	const handleMouseEnter = () => {
		onHover?.(node);
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
				onMouseEnter={handleMouseEnter}
				className={cn(
					"group flex items-center gap-1 py-1 px-2 cursor-pointer rounded-md text-sm",
					"hover:bg-accent/50 focus:bg-accent/50 focus:outline-none",
					isSelected && "bg-accent text-accent-foreground",
				)}
				style={{ paddingLeft: `${depth * 16 + 8}px` }}
			>
				{isFolder && (node.children || isLoading) ? (
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
					isLoading ? (
						<span className="size-4 shrink-0 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
					) : (
						<Folder
							className="size-4 shrink-0 text-blue-400"
							fill="currentColor"
						/>
					)
				) : (
					<File className="size-4 shrink-0 text-muted-foreground" />
				)}
				<span className="truncate">{node.name}</span>
			</div>
			{isFolder && isOpen && (
				<div>
					{isLoading ? (
						<div
							className="py-2 px-2 text-sm text-muted-foreground"
							style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
						>
							<span className="inline-block size-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mr-2" />
							Loading...
						</div>
					) : errorMessage ? (
						<div
							className="py-2 px-2 text-sm text-destructive"
							style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
						>
							<span className="mr-2">⚠️</span>
							{errorMessage}
						</div>
					) : node.children && node.children.length > 0 ? (
						sortTreeNodes(node.children).map((child) => (
							<TreeItem
								key={child.path}
								node={child}
								depth={depth + 1}
								onFileSelect={onFileSelect}
								selectedPath={selectedPath}
								searchQuery={searchQuery}
								onLoadChildren={onLoadChildren}
								onHover={onHover}
								loadingPaths={loadingPaths}
								errorPaths={errorPaths}
							/>
						))
					) : null}
				</div>
			)}
		</div>
	);
}
