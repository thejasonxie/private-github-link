import {
	Check,
	Copy,
	Download,
	History,
	Link,
	MoreHorizontal,
	PanelLeft,
	WrapText,
} from "lucide-react";
import * as React from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_DOMAIN } from "@/lib/constants";
import {
	countLines,
	decodeContent,
	downloadFile,
	getFileType,
} from "@/lib/file-utils";
import { formatDate, formatFileSize } from "@/lib/format";
import type {
	CommitHistoryData,
	CommitInfo,
	DirectoryContent,
	FileContent,
} from "@/lib/types/github";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Breadcrumb } from "./breadcrumb";
import { CommitHistoryView } from "./commit-history-view";
import { DirectoryViewer } from "./directory-viewer";
import {
	AudioViewer,
	BinaryFileViewer,
	CodeViewer,
	ImageViewer,
	MarkdownViewer,
	PdfViewer,
	VideoViewer,
} from "./viewers";

interface FileViewerProps {
	file: FileContent | null;
	directory?: DirectoryContent | null;
	commit?: CommitInfo;
	commitHistory?: CommitHistoryData | null;
	totalCommits?: number;
	owner?: string;
	repoName?: string;
	branch?: string;
	currentPath?: string;
	historyPage?: number;
	isLoading?: boolean;
	isHistoryLoading?: boolean;
	error?: string | null;
	onNavigate?: (path: string) => void;
	onFileSelect?: (path: string) => void;
	onShowHistory?: () => void;
	onCloseHistory?: () => void;
	onPrevPage?: () => void;
	onNextPage?: () => void;
	onToggleMobileExplorer?: () => void;
	showHistory?: boolean;
	className?: string;
}

/**
 * Content renderer that switches based on file type
 */
function FileContentRenderer({
	file,
	wrapText = false,
	showPreview = true,
	owner,
	repo,
	branch,
}: {
	file: FileContent;
	wrapText?: boolean;
	showPreview?: boolean;
	owner: string;
	repo: string;
	branch: string;
}) {
	const fileType = getFileType(file.name);

	switch (fileType) {
		case "image":
			return <ImageViewer file={file} />;
		case "pdf":
			return <PdfViewer file={file} />;
		case "video":
			return <VideoViewer file={file} />;
		case "audio":
			return <AudioViewer file={file} />;
		case "binary":
			return <BinaryFileViewer file={file} />;
		case "markdown":
			return showPreview ? (
				<MarkdownViewer file={file} owner={owner} repo={repo} branch={branch} />
			) : (
				<CodeViewer file={file} wrapText={wrapText} />
			);
		default:
			return <CodeViewer file={file} wrapText={wrapText} />;
	}
}

export function FileViewer({
	file,
	directory,
	commit,
	commitHistory,
	totalCommits,
	owner = "",
	repoName = "repository",
	branch = "main",
	currentPath: propCurrentPath,
	historyPage = 1,
	isLoading,
	isHistoryLoading,
	error,
	onNavigate,
	onFileSelect,
	onShowHistory,
	onCloseHistory,
	onPrevPage,
	onNextPage,
	onToggleMobileExplorer,
	showHistory = false,
	className,
}: FileViewerProps) {
	const [wrapText, setWrapText] = React.useState(false);
	const [showMarkdownPreview, setShowMarkdownPreview] = React.useState(true);

	// Determine if we're showing a directory or file
	const isDirectoryView = !file && directory;
	const currentPath = propCurrentPath ?? file?.path ?? directory?.path ?? "";
	const isRoot = !currentPath;

	// If showing history, render the history view instead (check before file/directory check)
	if (showHistory) {
		return (
			<div
				data-slot="file-viewer"
				className={cn("border rounded-lg bg-background", className)}
			>
				<CommitHistoryView
					history={commitHistory}
					path={currentPath}
					branch={branch}
					repoName={repoName}
					page={historyPage}
					isLoading={isHistoryLoading}
					onClose={onCloseHistory}
					onPrevPage={onPrevPage}
					onNextPage={onNextPage}
				/>
			</div>
		);
	}

	const fileType = file ? getFileType(file.name) : null;
	const isTextFile = fileType === "text";
	const isMarkdown = fileType === "markdown";
	const isTextBased = isTextFile || isMarkdown;

	// Only compute line info for text-based files
	const decodedContent =
		isTextBased && file ? decodeContent(file.content, file.encoding) : "";
	const lineCount = isTextBased ? decodedContent.split("\n").length : 0;

	// Get the display commit (from file or directory)
	const displayCommit = commit || directory?.commit;

	return (
		<div
			data-slot="file-viewer"
			className={cn("border rounded-lg bg-background", className)}
		>
			{/* Sticky header section - before pseudo-element covers the gap above */}
			<div className="sticky top-2 lg:top-4 z-20 bg-background rounded-t-lg before:absolute before:-left-px before:-right-px before:bottom-full before:h-2 lg:before:h-4 before:bg-muted">
				{/* Header with breadcrumb */}
				<div className="flex items-center justify-between px-4 py-3 border-b gap-2">
					{/* Mobile file explorer toggle - only visible on < lg */}
					{onToggleMobileExplorer && (
						<Button
							variant={"outline"}
							onClick={onToggleMobileExplorer}
							className="lg:hidden p-1.5 -ml-1.5 rounded-md text-muted-foreground shrink-0"
							aria-label="Open file explorer"
						>
							<PanelLeft className="size-4" />
						</Button>
					)}
					<Breadcrumb
						repoName={repoName}
						path={currentPath}
						onNavigate={onNavigate}
					/>
					<DropdownMenu>
						<DropdownMenuTrigger
							className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
							aria-label="More options"
						>
							<MoreHorizontal className="size-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{file && (
								<>
									<DropdownMenuItem
										onClick={() => downloadFile(file)}
										disabled={isLoading}
									>
										<Download className="size-4" />
										<span>Download</span>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
								</>
							)}
							<DropdownMenuItem
								disabled={isLoading}
								onClick={() => {
									navigator.clipboard.writeText(currentPath);
								}}
							>
								<Copy className="size-4" />
								<span>Copy path</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								disabled={isLoading}
								onClick={() => {
									const permalink = `${APP_DOMAIN}${window.location.pathname}#${currentPath}`;
									navigator.clipboard.writeText(permalink);
								}}
							>
								<Link className="size-4" />
								<span>Copy permalink</span>
							</DropdownMenuItem>
							{file && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										disabled={isLoading}
										onClick={() => setWrapText(!wrapText)}
									>
										<WrapText className="size-4" />
										<span>Wrap lines</span>
										{wrapText && <Check className="size-4 ml-auto" />}
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Commit info */}
				{isLoading ? (
					<div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
						<Skeleton className="size-6 rounded-full shrink-0 bg-muted-foreground/20" />
						<div className="flex-1 min-w-0 flex items-center gap-2">
							<Skeleton className="h-4 w-20 bg-muted-foreground/20" />
							<Skeleton className="h-4 w-48 bg-muted-foreground/20" />
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<Skeleton className="h-4 w-14 bg-muted-foreground/20" />
							<Skeleton className="h-4 w-16 bg-muted-foreground/20" />
						</div>
					</div>
				) : displayCommit ? (
					<div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/30">
						{displayCommit.authorUrl ? (
							<a
								href={displayCommit.authorUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="shrink-0"
							>
								{displayCommit.avatarUrl ? (
									<img
										src={displayCommit.avatarUrl}
										alt={displayCommit.author}
										className="size-6 rounded-full hover:opacity-80 transition-opacity"
									/>
								) : (
									<div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium hover:opacity-80 transition-opacity">
										{displayCommit.author.charAt(0).toUpperCase()}
									</div>
								)}
							</a>
						) : (
							<div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
								{displayCommit.author.charAt(0).toUpperCase()}
							</div>
						)}
						<div className="flex-1 min-w-0 flex items-center">
							<span className="font-medium text-sm shrink-0">
								{displayCommit.author}
							</span>
							<span className="text-muted-foreground text-sm ml-2 truncate">
								{displayCommit.message.split("\n")[0]}
							</span>
						</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
							<span className="font-mono">
								{displayCommit.sha.substring(0, 7)}
							</span>
							<span>·</span>
							<span>{formatDate(displayCommit.date)}</span>
							<Button
								className="flex items-center gap-1 ml-2 px-2 py-1 rounded-md border hover:bg-accent"
								onClick={onShowHistory}
							>
								<History className="size-3.5" />
								<span>
									{isRoot && totalCommits !== undefined
										? `${totalCommits} commits`
										: "History"}
								</span>
							</Button>
						</div>
					</div>
				) : null}

				{/* File toolbar - inside sticky header */}
				{file && (
					<div className="flex items-center justify-between px-4 py-2 border-b">
						<div className="flex items-center gap-1">
							{isMarkdown ? (
								<>
									<Button
										disabled={isLoading}
										variant="ghost"
										size="sm"
										onClick={() => setShowMarkdownPreview(true)}
										className={cn(
											showMarkdownPreview && "bg-accent text-accent-foreground",
										)}
									>
										Preview
									</Button>
									<Button
										disabled={isLoading}
										variant="ghost"
										size="sm"
										onClick={() => setShowMarkdownPreview(false)}
										className={cn(
											!showMarkdownPreview &&
												"bg-accent text-accent-foreground",
										)}
									>
										Code
									</Button>
									{!showMarkdownPreview && (
										<Button
											disabled={isLoading}
											variant="ghost"
											size="icon-sm"
											className={cn(wrapText && "bg-accent")}
											aria-label="Wrap Code"
											onClick={() => setWrapText(!wrapText)}
										>
											<WrapText className="size-4" />
										</Button>
									)}
								</>
							) : isTextFile ? (
								<>
									<div
										className={cn(
											"px-3 py-1.5 text-sm font-medium rounded-md",
											"bg-muted text-muted-foreground",
										)}
									>
										Code
									</div>

									<Button
										disabled={isLoading}
										variant="ghost"
										size="icon-sm"
										className={cn(wrapText && "bg-accent")}
										aria-label="Wrap Code"
										onClick={() => setWrapText(!wrapText)}
									>
										<WrapText className="size-4" />
									</Button>
								</>
							) : (
								<span className="px-3 py-1.5 text-sm font-medium text-muted-foreground">
									Preview
								</span>
							)}
						</div>

						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							{isTextBased ? (
								<span>
									{lineCount} lines ({countLines(decodedContent)} loc) ·{" "}
									{formatFileSize(file.size)}
								</span>
							) : (
								<span>{formatFileSize(file.size)}</span>
							)}
							<div className="flex items-center gap-1 ml-4">
								{isTextBased && (
									<>
										<Button
											disabled={isLoading}
											variant="ghost"
											size="sm"
											aria-label="Open raw"
											onClick={() => window.open(file.download_url, "_blank")}
										>
											Raw
										</Button>
										<Button
											disabled={isLoading}
											variant="ghost"
											size="icon-sm"
											aria-label="Copy content"
											onClick={async () => {
												await navigator.clipboard.writeText(
													decodeContent(file.content, file.encoding),
												);
											}}
										>
											<Copy className="size-4" />
										</Button>
									</>
								)}
								<Button
									disabled={isLoading}
									variant="ghost"
									size="icon-sm"
									aria-label="Download"
									onClick={() => downloadFile(file)}
								>
									<Download className="size-4" />
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Content area */}
			{isLoading ? (
				<DirectorySkeleton />
			) : error ? (
				<div className="flex items-center justify-center py-16">
					<div className="text-center">
						<div className="text-destructive font-medium">Error loading</div>
						<div className="text-sm text-muted-foreground mt-1">{error}</div>
					</div>
				</div>
			) : isDirectoryView && directory ? (
				<DirectoryViewer
					directory={directory}
					onNavigate={onNavigate}
					onFileSelect={onFileSelect}
				/>
			) : file ? (
				<FileContentRenderer
					file={file}
					wrapText={wrapText}
					showPreview={showMarkdownPreview}
					owner={owner}
					repo={repoName}
					branch={branch}
				/>
			) : null}
		</div>
	);
}

/**
 * Skeleton loader for directory view
 */
const SKELETON_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

function DirectorySkeleton() {
	return (
		<div className="w-full overflow-hidden">
			<table className="w-full table-fixed">
				<thead>
					<tr className="border-b text-left text-sm text-muted-foreground">
						<th className="px-4 py-2 font-medium w-1/3">Name</th>
						<th className="px-4 py-2 font-medium w-1/2">Last commit message</th>
						<th className="px-4 py-2 font-medium text-right w-1/6">
							Last commit date
						</th>
					</tr>
				</thead>
				<tbody>
					{SKELETON_ROWS.map((n) => (
						<tr key={`skeleton-${n}`} className="border-b">
							<td className="px-4 py-2">
								<div className="flex items-center gap-2">
									<Skeleton className="size-4 bg-muted-foreground/20" />
									<Skeleton className="h-6 w-24 bg-muted-foreground/20" />
								</div>
							</td>
							<td className="px-4 py-2">
								<Skeleton className="h-6 w-48 bg-muted-foreground/20" />
							</td>
							<td className="px-4 py-2 text-right">
								<Skeleton className="h-6 w-20 ml-auto bg-muted-foreground/20" />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
