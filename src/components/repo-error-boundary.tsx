import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { FileExplorer } from "@/components/file-explorer/file-explorer";
import { FileViewer } from "@/components/file-explorer/file-viewer";
import { RepoHeader } from "@/components/file-explorer/repo-header";
import { RepoAccessDialog } from "@/components/repo-access-dialog";
import { Button } from "@/components/ui/button";
import { RateLimitError } from "@/lib/github/api";

interface RepoErrorBoundaryProps extends ErrorComponentProps {
	owner?: string;
	repo?: string;
	currentBranch?: string;
	hasToken?: boolean;
}

export function RepoErrorBoundary({
	error,
	reset: _reset,
	owner = "",
	repo = "",
	currentBranch = "main",
	hasToken = false,
}: RepoErrorBoundaryProps) {
	const isRateLimitError =
		error instanceof RateLimitError ||
		error?.message?.toLowerCase().includes("rate limit") ||
		error?.message?.toLowerCase().includes("timed out") ||
		error?.message?.toLowerCase().includes("403");

	const isNotFoundError =
		error?.message?.toLowerCase().includes("not found") ||
		error?.message?.toLowerCase().includes("404");

	// Rate limit error - show dialog with skeleton background
	if (isRateLimitError) {
		return (
			<div className="flex flex-col bg-muted min-h-screen">
				<RepoHeader
					repo={{
						fullName: `${owner}/${repo}`,
						owner: owner,
						name: repo,
						isPrivate: false,
						defaultBranch: currentBranch,
					}}
					https={`https://github.com/${owner}/${repo}.git`}
				/>
				<div className="flex gap-2 lg:gap-4 p-2 lg:p-4">
					<div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)] shrink-0">
						<FileExplorer
							tree={[]}
							isTreeLoading={true}
							title="Files"
							className="w-80 h-full"
						/>
					</div>
					<FileViewer
						file={null}
						directory={null}
						isLoading={true}
						repoName={repo}
						currentPath=""
						className="flex-1 min-w-0"
					/>
				</div>
				<RepoAccessDialog
					open={true}
					onOpenChange={() => {}}
					repoOwner={owner}
					repoName={repo}
					defaultBranch={currentBranch}
					variant={hasToken ? "rate-limit-wait" : "rate-limit"}
				/>
			</div>
		);
	}

	// Not found error - show dialog
	if (isNotFoundError) {
		return (
			<div className="flex flex-col bg-muted min-h-screen">
				<RepoHeader
					repo={{
						fullName: `${owner}/${repo}`,
						owner: owner,
						name: repo,
						isPrivate: true,
						defaultBranch: currentBranch,
					}}
					https={`https://github.com/${owner}/${repo}.git`}
				/>
				<div className="flex gap-2 lg:gap-4 p-2 lg:p-4">
					<div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)] shrink-0">
						<FileExplorer
							tree={[]}
							isTreeLoading={true}
							title="Files"
							className="w-80 h-full"
						/>
					</div>
					<FileViewer
						file={null}
						directory={null}
						isLoading={true}
						repoName={repo}
						currentPath=""
						error="Repository not found"
						className="flex-1 min-w-0"
					/>
				</div>
				<RepoAccessDialog
					open={true}
					onOpenChange={() => {}}
					repoOwner={owner}
					repoName={repo}
					defaultBranch={currentBranch}
				/>
			</div>
		);
	}

	// Generic error - use default error component
	return (
		<div className="flex flex-col bg-muted min-h-screen">
			<RepoHeader
				repo={{
					fullName: `${owner}/${repo}`,
					owner: owner,
					name: repo,
					isPrivate: false,
					defaultBranch: currentBranch,
				}}
				https={`https://github.com/${owner}/${repo}.git`}
			/>
			<div className="flex-1 flex items-center justify-center p-8">
				<div className="text-center max-w-md">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20 mb-4">
						<AlertTriangle className="h-7 w-7 text-destructive" />
					</div>
					<h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
					<p className="text-muted-foreground mb-4">
						{error?.message || "An unexpected error occurred"}
					</p>
					<Button onClick={() => window.location.reload()}>Try Again</Button>
				</div>
			</div>
		</div>
	);
}
