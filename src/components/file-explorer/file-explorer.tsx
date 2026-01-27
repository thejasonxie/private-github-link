import { Folder, GitBranch, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { TreeNode } from "@/lib/types/github";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { BranchesPanel } from "./branches-panel";
import { sortTreeNodes, TreeItem } from "./tree-item";

interface FileExplorerProps {
	tree: TreeNode[];
	isTreeLoading?: boolean;
	title?: string;
	branch?: string;
	branches?: string[];
	showBranches?: boolean;
	onBranchChange?: (branch: string) => void;
	onFileSelect?: (node: TreeNode) => void;
	onShowBranchesChange?: (show: boolean) => void;
	className?: string;
}

export function FileExplorer({
	tree,
	isTreeLoading,
	title = "Files",
	branch = "main",
	branches = ["main"],
	showBranches: showBranchesProp,
	onBranchChange,
	onFileSelect,
	onShowBranchesChange,
	className,
}: FileExplorerProps) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [selectedPath, setSelectedPath] = React.useState<string>();
	const [showBranchesInternal, setShowBranchesInternal] = React.useState(false);

	// Use controlled state if provided, otherwise use internal state
	const showBranches = showBranchesProp ?? showBranchesInternal;
	const setShowBranches = onShowBranchesChange ?? setShowBranchesInternal;

	const handleFileSelect = (node: TreeNode) => {
		setSelectedPath(node.path);
		onFileSelect?.(node);
	};

	const handleBranchSelect = (selectedBranch: string) => {
		onBranchChange?.(selectedBranch);
		setShowBranches(false);
		setSelectedPath(undefined); // Reset selection to go to root
	};

	const sortedTree = React.useMemo(() => sortTreeNodes(tree), [tree]);

	// Show branches panel
	if (showBranches) {
		return (
			<div
				data-slot="file-explorer"
				className={cn(
					"flex flex-col border rounded-lg bg-background overflow-hidden",
					className,
				)}
			>
				<BranchesPanel
					branches={branches}
					currentBranch={branch}
					defaultBranch={branches[0]} // Assume first branch is default
					onBranchSelect={handleBranchSelect}
					onClose={() => setShowBranches(false)}
				/>
			</div>
		);
	}

	return (
		<div
			data-slot="file-explorer"
			className={cn(
				"flex flex-col border rounded-lg bg-background overflow-hidden",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
				<Folder className="size-4 text-muted-foreground" />
				<span className="font-medium text-sm">{title}</span>
			</div>

			{/* Branch selector */}
			<div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
				<Select
					value={branch}
					onValueChange={(value) => value && onBranchChange?.(value)}
					disabled={isTreeLoading}
				>
					<SelectTrigger className="flex-1 min-w-0">
						<GitBranch className="size-3.5 text-muted-foreground shrink-0" />
						<span className="truncate">
							<SelectValue placeholder="Select branch" />
						</span>
					</SelectTrigger>
					<SelectContent align="start" alignItemWithTrigger={false}>
						{branches.map((b) => (
							<SelectItem key={b} value={b} className="max-w-64">
								<span className="truncate">{b}</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => setShowBranches(true)}
					aria-label="View all branches"
					disabled={isTreeLoading}
				>
					<GitBranch className="size-4" />
				</Button>
			</div>

			{/* Search input */}
			<div className="px-2 md:px-3 py-2 border-b shrink-0">
				<div className="relative">
					<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
					<Input
						disabled={isTreeLoading}
						type="text"
						placeholder="Go to file"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-7 h-7 text-xs"
					/>
					<kbd className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
						t
					</kbd>
				</div>
			</div>

			{/* Tree view */}
			<ScrollArea className="flex-1 min-h-0">
				{(isTreeLoading || sortedTree.length === 0) &&
					// Use deterministic widths to avoid hydration mismatch (no Math.random())
					[
						62, 45, 71, 38, 55, 68, 42, 74, 51, 60, 47, 66, 53, 40, 72, 58, 44,
						69, 36, 63,
					].map((width) => (
						<div key={`tree-skeleton-w${width}`} className="px-2 py-1">
							<Skeleton
								className="h-6 bg-muted-foreground/20 w-full"
								style={{ width: `${width}%` }}
							/>
						</div>
					))}
				{!isTreeLoading && sortedTree.length > 0 && (
					<div role="tree" className="py-1">
						{sortedTree.map((node) => (
							<TreeItem
								key={node.path}
								node={node}
								depth={0}
								onFileSelect={handleFileSelect}
								selectedPath={selectedPath}
								searchQuery={searchQuery}
							/>
						))}
					</div>
				)}
			</ScrollArea>
		</div>
	);
}

// Re-export TreeNode type for convenience
export type { TreeNode };
