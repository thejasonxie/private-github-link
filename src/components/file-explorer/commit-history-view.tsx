import {
	ChevronLeft,
	ChevronRight,
	Code,
	Copy,
	GitCommitHorizontal,
	X,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateForGrouping } from "@/lib/format";
import type { CommitHistoryData, CommitHistoryEntry } from "@/lib/types/github";
import { cn } from "@/lib/utils";

interface CommitHistoryViewProps {
	history: CommitHistoryData | null | undefined;
	path: string;
	branch: string;
	repoName: string;
	page?: number;
	isLoading?: boolean;
	onClose?: () => void;
	onPrevPage?: () => void;
	onNextPage?: () => void;
}

/**
 * Group commits by date
 */
function groupCommitsByDate(
	commits: CommitHistoryEntry[],
): Map<string, CommitHistoryEntry[]> {
	const grouped = new Map<string, CommitHistoryEntry[]>();

	for (const commit of commits) {
		const dateKey = formatDateForGrouping(commit.date);
		const existing = grouped.get(dateKey) || [];
		existing.push(commit);
		grouped.set(dateKey, existing);
	}

	return grouped;
}

export function CommitHistoryView({
	history,
	path,
	branch,
	repoName,
	page = 1,
	isLoading,
	onClose,
	onPrevPage,
	onNextPage,
}: CommitHistoryViewProps) {
	const groupedCommits = React.useMemo(() => {
		if (!history?.commits) return new Map();
		return groupCommitsByDate(history.commits);
	}, [history?.commits]);

	const isRoot = !path;
	const hasPrev = page > 1;
	const hasNext = history?.hasMore ?? false;

	return (
		<div>
			{/* Sticky Header */}
			<div className="sticky top-0! md:top-4 z-10 bg-background rounded-t-lg">
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b">
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={onClose}
							aria-label="Close history"
						>
							<ChevronLeft className="size-5" />
						</Button>
						<h2 className="text-lg font-semibold">Commits</h2>
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						aria-label="Close"
					>
						<X className="size-4" />
					</Button>
				</div>

				{/* Subheader with path info */}
				<div className="px-4 py-2 border-b bg-muted/30 text-sm">
					{isRoot ? (
						<div className="flex items-center gap-2">
							<span className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
								{branch}
							</span>
						</div>
					) : (
						<div className="flex items-center gap-1 min-w-0">
							<span className="shrink-0">History for</span>
							<span className="text-blue-500 hover:underline shrink-0">
								{repoName}
							</span>
							<span className="shrink-0">/</span>
							<span className="font-medium truncate">{path}</span>
							<span className="ml-2 shrink-0">on</span>
							<span className="px-2 py-0.5 bg-muted rounded text-xs font-mono shrink-0">
								{branch}
							</span>
						</div>
					)}
				</div>

				{/* Pagination - in sticky header */}
				{!isLoading && history?.commits?.length ? (
					<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
						<Button
							variant="outline"
							size="sm"
							onClick={onPrevPage}
							disabled={!hasPrev}
						>
							<ChevronLeft className="size-4" />
							<span>Newer</span>
						</Button>
						<span className="text-sm text-muted-foreground">Page {page}</span>
						<Button
							variant="outline"
							size="sm"
							onClick={onNextPage}
							disabled={!hasNext}
						>
							<span>Older</span>
							<ChevronRight className="size-4" />
						</Button>
					</div>
				) : null}
			</div>

			{/* Commit list - scrolls with page */}
			{isLoading ? (
				<div className="flex items-center justify-center py-8">
					<div className="text-muted-foreground">Loading commits...</div>
				</div>
			) : !history?.commits?.length ? (
				<div className="flex items-center justify-center py-8">
					<div className="text-muted-foreground">No commits found</div>
				</div>
			) : (
				<div className="py-2">
					{Array.from(groupedCommits.entries()).map(([date, commits]) => (
						<div key={date} className="mb-4">
							{/* Date header */}
							<div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
								<GitCommitHorizontal className="size-4" />
								<span>Commits on {date}</span>
							</div>

							{/* Commits for this date */}
							<div className="mx-4 border rounded-lg overflow-hidden">
								{commits.map((commit: CommitHistoryEntry, index: number) => (
									<div
										key={commit.sha}
										className={cn(
											"flex items-start gap-3 px-4 py-3 hover:bg-accent/30",
											index !== commits.length - 1 && "border-b",
										)}
									>
										{/* Commit info */}
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm truncate">
												{commit.message.split("\n")[0]}
											</div>
											<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
												{commit.authorAvatarUrl ? (
													<img
														src={commit.authorAvatarUrl}
														alt={commit.author}
														className="size-4 rounded-full"
													/>
												) : (
													<div className="size-4 rounded-full bg-muted flex items-center justify-center text-[10px]">
														{commit.author.charAt(0).toUpperCase()}
													</div>
												)}
												<span>{commit.author}</span>
												<span>committed</span>
												<span>{formatDate(commit.date)}</span>
											</div>
										</div>

										{/* Commit actions */}
										<div className="flex items-center gap-1 shrink-0">
											<span className="font-mono text-xs text-muted-foreground">
												{commit.sha.substring(0, 7)}
											</span>
											<Button
												variant="ghost"
												size="icon-xs"
												aria-label="Copy SHA"
												onClick={() =>
													navigator.clipboard.writeText(commit.sha)
												}
											>
												<Copy className="size-3.5" />
											</Button>
											<Button
												variant="ghost"
												size="icon-xs"
												aria-label="View code at this commit"
											>
												<Code className="size-3.5" />
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
