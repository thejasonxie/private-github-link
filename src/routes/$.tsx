import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	type ErrorComponentProps,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { X } from "lucide-react";
import * as React from "react";
import { FileExplorer } from "@/components/file-explorer/file-explorer";
import { FileViewer } from "@/components/file-explorer/file-viewer";
import {
	MinimalRepoHeader,
	RepoHeader,
} from "@/components/file-explorer/repo-header";
import { RepoAccessDialog } from "@/components/repo-access-dialog";
import { RepoErrorBoundary } from "@/components/repo-error-boundary";
import { RepoPending } from "@/components/repo-pending";
import { Button } from "@/components/ui/button";
import {
	CACHE_FIVE_MINUTES,
	CACHE_TEN_MINUTES,
	LOADER_TIMEOUT,
} from "@/lib/constants";
import {
	getBranches,
	getCommitHistory,
	getContributors,
	getDirectoryContentDirect,
	getDirectoryTree,
	getFileContent,
	getRepoInfo,
	getTotalCommitCount,
} from "@/lib/github";
import { getAuthenticatedUser, RateLimitError } from "@/lib/github/api";
import { withTimeout } from "@/lib/github/client";
import { useRateLimit } from "@/lib/github/rate-limit";
import { findNode } from "@/lib/tree-utils";
import type { TreeNode } from "@/lib/types/github";

interface SearchParams {
	access_token?: string;
}

import { parseRepoPath } from "@/lib/route-utils";

function RouteComponent() {
	const params = Route.useParams();
	const navigate = useNavigate();
	const search = Route.useSearch() as { access_token?: string };
	const loaderData = Route.useLoaderData();
	const queryClient = useQueryClient();

	// Parse URL
	const splatPath = params["_splat"] || "";
	const parsed = parseRepoPath(splatPath);

	const owner = parsed?.owner || "";
	const repo = parsed?.repo || "";
	const githubToken = search?.access_token || "";

	// Initialize rate limit tracking - this will poll every 60 seconds
	// and update when API calls are made
	useRateLimit(githubToken || undefined);

	// Get repo info from loader (only populated when authenticated)
	const loaderRepoInfo = loaderData.repoInfo;
	const loaderBranches = loaderData.branches;
	const isAuthenticated = loaderData.isAuthenticated;

	// Fetch repo info client-side for unauthenticated users (uses user's IP quota)
	// This is the first request - determines if repo is accessible
	const {
		data: clientRepoInfo,
		isLoading: isRepoInfoLoading,
		error: repoInfoError,
	} = useQuery({
		queryKey: ["getRepoInfo", owner, repo, githubToken],
		queryFn: () => getRepoInfo(owner, repo, githubToken),
		enabled: Boolean(owner && repo && !isAuthenticated),
		staleTime: CACHE_FIVE_MINUTES,
		gcTime: 0, // TODO: remove - disables cache for testing
		retry: false,
	});

	// Use loader data if authenticated, otherwise use client-fetched data
	const repoInfo = loaderRepoInfo ?? clientRepoInfo;

	// Fetch branches client-side only after repo info confirms access
	// For unauthenticated users, this prevents wasting API quota on inaccessible repos
	const {
		data: clientBranches,
		isLoading: isBranchesLoading,
		error: branchesError,
	} = useQuery({
		queryKey: ["getBranches", owner, repo, githubToken],
		queryFn: () => getBranches(owner, repo, githubToken),
		enabled: Boolean(owner && repo && !isAuthenticated && repoInfo),
		staleTime: CACHE_FIVE_MINUTES,
		retry: false,
	});

	const branchesData = loaderBranches ?? clientBranches;

	// For unauthenticated users, wait for repo info first (to check access),
	// then wait for branches if repo is accessible
	// Don't show loading if there's an error
	const isInitialLoading =
		!isAuthenticated &&
		!repoInfoError &&
		(isRepoInfoLoading || (repoInfo && isBranchesLoading));

	// Fetch contributors
	const { data: contributorsData } = useQuery({
		queryKey: ["getContributors", owner, repo, githubToken],
		queryFn: () => getContributors(owner, repo, githubToken),
		enabled: Boolean(owner && repo && repoInfo),
		staleTime: CACHE_TEN_MINUTES,
		retry: false,
	});

	// Determine branch from URL or default
	const currentBranch = parsed?.branch || repoInfo?.defaultBranch || "main";
	const viewType = parsed?.viewType || "tree";
	const currentPath = parsed?.path || "";

	// Determine if we're showing a file or directory based on viewType
	const isFileView = viewType === "blob";
	const isCommitsView = viewType === "commits";

	const [historyPage, setHistoryPage] = React.useState<number>(1);
	const [mobileExplorerOpen, setMobileExplorerOpen] =
		React.useState<boolean>(false);
	const [showBranches, setShowBranches] = React.useState<boolean>(false);

	// Navigation helper to update URL
	const navigateTo = React.useCallback(
		(
			newViewType: "tree" | "blob" | "commits",
			newBranch: string,
			newPath: string,
		) => {
			const splatPath = newPath
				? `${owner}/${repo}/${newViewType}/${newBranch}/${newPath}`
				: `${owner}/${repo}/${newViewType}/${newBranch}`;
			navigate({
				to: "/$",
				params: { _splat: splatPath },
				search: search?.access_token
					? { access_token: search.access_token }
					: undefined,
			});
		},
		[navigate, owner, repo, search?.access_token],
	);

	// Fetch root-level tree only (lazy loading for subdirectories)
	const {
		data: rootTreeData,
		isLoading: isTreeLoading,
		error: treeError,
	} = useQuery({
		queryKey: ["getDirectoryTree", owner, repo, currentBranch, "", githubToken],
		queryFn: () =>
			getDirectoryTree(owner, repo, currentBranch, "", githubToken),
		enabled: Boolean(owner && repo && currentBranch && repoInfo),
		staleTime: CACHE_FIVE_MINUTES,
		retry: false,
	});

	// Store complete tree data with loaded children
	const [treeData, setTreeData] = React.useState<TreeNode[] | undefined>(
		undefined,
	);

	// Track which paths are currently loading
	const [loadingPaths, setLoadingPaths] = React.useState<Set<string>>(
		new Set(),
	);

	// Track which paths have errors
	const [errorPaths, setErrorPaths] = React.useState<Map<string, string>>(
		new Map(),
	);

	// Use refs to ensure mutation always has access to latest values
	const ownerRef = React.useRef(owner);
	const repoRef = React.useRef(repo);
	const currentBranchRef = React.useRef(currentBranch);
	const githubTokenRef = React.useRef(githubToken);

	// Update refs when values change
	React.useEffect(() => {
		ownerRef.current = owner;
		repoRef.current = repo;
		currentBranchRef.current = currentBranch;
		githubTokenRef.current = githubToken;
	}, [owner, repo, currentBranch, githubToken]);

	// Update treeData when rootTreeData changes
	React.useEffect(() => {
		if (rootTreeData) {
			setTreeData(rootTreeData);
		}
	}, [rootTreeData]);

	// Mutation to load children for a specific directory
	const loadChildrenMutation = useMutation({
		mutationFn: async (path: string) => {
			setLoadingPaths((prev) => new Set(prev).add(path));
			// Clear any previous error for this path
			setErrorPaths((prev) => {
				const next = new Map(prev);
				next.delete(path);
				return next;
			});
			try {
				// Use refs to always get latest values
				const result = await getDirectoryTree(
					ownerRef.current,
					repoRef.current,
					currentBranchRef.current,
					path,
					githubTokenRef.current,
				);
				return result;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to load folder";
				setErrorPaths((prev) => new Map(prev).set(path, errorMessage));
				throw error;
			} finally {
				setLoadingPaths((prev) => {
					const next = new Set(prev);
					next.delete(path);
					return next;
				});
			}
		},
		onSuccess: (children, path) => {
			setTreeData((prevTree) => {
				if (!prevTree) return prevTree;

				// Helper to update a node in the tree with new children
				const updateNodeChildren = (nodes: TreeNode[]): TreeNode[] => {
					return nodes.map((node) => {
						if (node.path === path) {
							return { ...node, children };
						}
						if (node.children) {
							return { ...node, children: updateNodeChildren(node.children) };
						}
						return node;
					});
				};

				return updateNodeChildren(prevTree);
			});
		},
	});

	// Handler to load children when expanding a folder
	const handleLoadChildren = React.useCallback(
		async (path: string) => {
			if (loadingPaths.has(path)) return;
			await loadChildrenMutation.mutateAsync(path);
		},
		[loadChildrenMutation, loadingPaths],
	);

	// Handler to preload children on hover (like preload="intent" in TanStack Router)
	const handleHover = React.useCallback(
		(node: TreeNode) => {
			// Only preload folders that don't have children loaded yet and aren't already loading
			if (
				node.type === "tree" &&
				(!node.children || node.children.length === 0) &&
				!loadingPaths.has(node.path)
			) {
				// Preload the children
				loadChildrenMutation.mutate(node.path);
			}
		},
		[loadChildrenMutation, loadingPaths],
	);

	// Preload handler for file viewer (preload directory content on hover)
	const handleDirectoryHover = React.useCallback(
		(path: string, type: "tree" | "blob") => {
			// Use refs to always get latest values
			const currentOwner = ownerRef.current;
			const currentRepo = repoRef.current;
			const branch = currentBranchRef.current;
			const token = githubTokenRef.current;

			// Only preload directories
			if (type === "tree" && currentOwner && currentRepo && branch) {
				// Prefetch the directory content
				queryClient.prefetchQuery({
					queryKey: [
						"getDirectoryContentDirect",
						currentOwner,
						currentRepo,
						path,
						branch,
						token,
					],
					queryFn: () =>
						getDirectoryContentDirect(
							currentOwner,
							currentRepo,
							path,
							branch,
							token,
						),
					staleTime: CACHE_FIVE_MINUTES,
				});
			}
		},
		[queryClient],
	);

	// Find the selected file node from tree if viewing a file
	const selectedFile = React.useMemo(() => {
		if (!isFileView || !treeData || !currentPath) return null;
		return findNode(treeData, currentPath);
	}, [isFileView, treeData, currentPath]);

	// Fetch directory content when viewing a directory (using direct API, no treeData needed)
	const {
		data: directoryData,
		isLoading: isDirectoryLoading,
		error: directoryError,
	} = useQuery({
		queryKey: [
			"getDirectoryContentDirect",
			owner,
			repo,
			currentPath,
			currentBranch,
			githubToken,
		],
		queryFn: () =>
			getDirectoryContentDirect(
				owner,
				repo,
				currentPath,
				currentBranch,
				githubToken,
			),
		enabled: Boolean(
			!isFileView && !isCommitsView && owner && repo && repoInfo,
		),
	});

	// Fetch file content
	const {
		data: fileData,
		isLoading: isFileLoading,
		error: fileError,
	} = useQuery({
		queryKey: [
			"getFileContent",
			owner,
			repo,
			currentPath,
			currentBranch,
			githubToken,
		],
		queryFn: () =>
			getFileContent(
				owner,
				repo,
				currentPath,
				currentBranch,
				selectedFile?.size,
				githubToken,
			),
		enabled: Boolean(isFileView && currentPath && owner && repo && repoInfo),
	});

	// Fetch total commit count for the repo
	const { data: totalCommitCount } = useQuery({
		queryKey: ["getTotalCommitCount", owner, repo, currentBranch, githubToken],
		queryFn: () => getTotalCommitCount(owner, repo, currentBranch, githubToken),
		enabled: Boolean(currentBranch && owner && repo && repoInfo),
	});

	// Fetch commit history when showing commits view
	const { data: commitHistoryData, isLoading: isHistoryLoading } = useQuery({
		queryKey: [
			"getCommitHistory",
			owner,
			repo,
			currentPath,
			currentBranch,
			historyPage,
			githubToken,
		],
		queryFn: () =>
			getCommitHistory(
				owner,
				repo,
				currentPath,
				currentBranch,
				historyPage,
				30,
				githubToken,
			),
		enabled: Boolean(isCommitsView && owner && repo && repoInfo),
	});

	// Handle branch change - navigate to tree view of root with new branch
	const handleBranchChange = React.useCallback(
		(branch: string) => {
			navigateTo("tree", branch, "");
		},
		[navigateTo],
	);

	// Handle showing commit history
	const handleShowHistory = React.useCallback(() => {
		setHistoryPage(1);
		navigateTo("commits", currentBranch, currentPath);
	}, [navigateTo, currentBranch, currentPath]);

	// Handle closing commit history - go back to tree/blob view
	const handleCloseHistory = React.useCallback(() => {
		setHistoryPage(1);
		if (currentPath) {
			// Check if the current path is a file or directory
			const node = treeData ? findNode(treeData, currentPath) : null;
			if (node?.type === "blob") {
				navigateTo("blob", currentBranch, currentPath);
			} else {
				navigateTo("tree", currentBranch, currentPath);
			}
		} else {
			navigateTo("tree", currentBranch, "");
		}
	}, [navigateTo, currentBranch, currentPath, treeData]);

	// Handle pagination
	const handlePrevPage = React.useCallback(() => {
		setHistoryPage((prev) => Math.max(1, prev - 1));
	}, []);

	const handleNextPage = React.useCallback(() => {
		if (commitHistoryData?.hasMore) {
			setHistoryPage((prev) => prev + 1);
		}
	}, [commitHistoryData?.hasMore]);

	// Handle file selection from explorer
	const handleFileSelect = React.useCallback(
		(node: TreeNode) => {
			if (node.type === "blob") {
				navigateTo("blob", currentBranch, node.path);
			} else {
				navigateTo("tree", currentBranch, node.path);
			}
		},
		[navigateTo, currentBranch],
	);

	// Handle file selection from directory view
	const handleFileSelectFromDir = React.useCallback(
		(path: string) => {
			if (treeData) {
				const node = findNode(treeData, path);
				if (node?.type === "blob") {
					navigateTo("blob", currentBranch, path);
				} else {
					navigateTo("tree", currentBranch, path);
				}
			}
		},
		[treeData, navigateTo, currentBranch],
	);

	// Handle breadcrumb/directory navigation
	const handleNavigate = React.useCallback(
		(path: string) => {
			navigateTo("tree", currentBranch, path);
		},
		[navigateTo, currentBranch],
	);

	// Close mobile explorer when a file is selected
	const handleMobileFileSelect = React.useCallback(
		(node: TreeNode) => {
			handleFileSelect(node);
			setMobileExplorerOpen(false);
		},
		[handleFileSelect],
	);

	const branchNames = branchesData?.map((b) => b.name) ?? [];
	const isContentLoading = isFileView ? isFileLoading : isDirectoryLoading;

	// Show loading state while fetching initial data for unauthenticated users
	if (isInitialLoading) {
		return <RepoPending />;
	}

	// Check for rate limit errors first (more specific than not-found)
	const isRateLimitErr = (error: Error | null) => {
		if (!error) return false;
		if (error instanceof RateLimitError) return true;
		return error.message?.toLowerCase().includes("rate limit");
	};

	const clientRateLimitError =
		isRateLimitErr(repoInfoError as Error | null) ||
		isRateLimitErr(branchesError as Error | null) ||
		isRateLimitErr(fileError as Error | null) ||
		isRateLimitErr(directoryError as Error | null);

	if (clientRateLimitError) {
		return (
			<div className="flex flex-col bg-muted min-h-screen">
				<MinimalRepoHeader owner={owner} repo={repo} />
				<div className="flex gap-2 lg:gap-4 p-2 lg:p-4">
					<div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)] shrink-0">
						<FileExplorer
							tree={[]}
							isTreeLoading={false}
							title="Files"
							className="w-80 h-full"
						/>
					</div>
					<FileViewer
						file={null}
						directory={null}
						isLoading={true}
						repoName={repo}
						currentPath={currentPath}
						className="flex-1 min-w-0"
					/>
				</div>
				<RepoAccessDialog
					open={true}
					onOpenChange={() => {}}
					repoOwner={owner}
					repoName={repo}
					defaultBranch={currentBranch}
					variant={githubToken ? "rate-limit-wait" : "rate-limit"}
				/>
			</div>
		);
	}

	// Handle tree-level rate limit errors (tree is fetched client-side after loader)
	if (
		treeError instanceof RateLimitError ||
		treeError?.message?.toLowerCase().includes("rate limit")
	) {
		return (
			<div className="flex flex-col bg-muted min-h-screen">
				{repoInfo && (
					<RepoHeader
						repo={repoInfo}
						https={`https://github.com/${owner}/${repo}.git`}
					/>
				)}
				<div className="flex gap-2 lg:gap-4 p-2 lg:p-4">
					<div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)] shrink-0">
						<FileExplorer
							tree={[]}
							isTreeLoading={false}
							title="Files"
							className="w-80 h-full"
						/>
					</div>
					<FileViewer
						file={null}
						directory={null}
						isLoading={true}
						repoName={repo}
						currentPath={currentPath}
						className="flex-1 min-w-0"
					/>
				</div>
				<RepoAccessDialog
					open={true}
					onOpenChange={() => {}}
					repoOwner={owner}
					repoName={repo}
					defaultBranch={currentBranch}
					variant={githubToken ? "rate-limit-wait" : "rate-limit"}
				/>
			</div>
		);
	}

	// Handle 404/access denied errors (private repo without token or repo doesn't exist)
	// Check after rate limit since 403 can be either
	const isNotFoundError = (error: Error | null) => {
		if (!error) return false;
		const message = error.message?.toLowerCase() || "";
		return (
			message.includes("not found") ||
			message.includes("404") ||
			message.includes("403")
		);
	};

	const clientNotFoundError =
		!clientRateLimitError &&
		(isNotFoundError(repoInfoError as Error | null) ||
			isNotFoundError(branchesError as Error | null));

	if (clientNotFoundError) {
		return (
			<div className="flex flex-col bg-muted min-h-screen">
				<MinimalRepoHeader owner={owner} repo={repo} />
				<div className="flex gap-2 lg:gap-4 p-2 lg:p-4">
					<div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)] shrink-0">
						<FileExplorer
							tree={[]}
							isTreeLoading={false}
							title="Files"
							className="w-80 h-full"
						/>
					</div>
					<FileViewer
						file={null}
						directory={null}
						isLoading={true}
						repoName={repo}
						currentPath={currentPath}
						className="flex-1 min-w-0"
					/>
				</div>
				<RepoAccessDialog
					open={true}
					onOpenChange={() => {}}
					repoOwner={owner}
					repoName={repo}
					defaultBranch={currentBranch}
					variant="not-found"
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col bg-muted">
			{/* Repo Header */}
			{repoInfo && (
				<RepoHeader
					repo={repoInfo}
					https={`https://${repoInfo.isPrivate ? `${githubToken}.` : ""}github.com/${repoInfo.fullName}.git`}
					contributors={contributorsData?.contributors}
					totalContributors={contributorsData?.totalCount}
					branchCount={branchesData?.length}
					accessToken={githubToken}
					onShowBranches={() => setShowBranches(true)}
				/>
			)}

			{/* Main content area */}
			<div className="flex gap-2 lg:gap-4 p-2 lg:p-4">
				{/* Mobile File Explorer Overlay */}
				{mobileExplorerOpen && (
					<>
						<Button
							type="button"
							className="h-auto fixed inset-0 z-40 bg-muted/50 hover:bg-muted/50 lg:hidden cursor-default"
							onClick={() => setMobileExplorerOpen(false)}
							aria-label="Close file explorer"
						/>
						<div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] lg:hidden shadow-xl animate-in slide-in-from-left duration-200">
							<div className="relative h-full">
								<Button
									variant={"ghost"}
									onClick={() => setMobileExplorerOpen(false)}
									className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-background/80"
									aria-label="Close file explorer"
								>
									<X className="size-4" />
								</Button>
								<FileExplorer
									tree={treeData ?? []}
									title="Files"
									branch={currentBranch}
									branches={branchNames}
									showBranches={showBranches}
									onBranchChange={handleBranchChange}
									onFileSelect={handleMobileFileSelect}
									onShowBranchesChange={setShowBranches}
									onLoadChildren={handleLoadChildren}
									onHover={handleHover}
									loadingPaths={loadingPaths}
									errorPaths={errorPaths}
									className="h-full"
								/>
							</div>
						</div>
					</>
				)}

				{/* Desktop File Explorer */}
				<div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)] shrink-0">
					<FileExplorer
						tree={treeData ?? []}
						isTreeLoading={isTreeLoading}
						loadingPaths={loadingPaths}
						errorPaths={errorPaths}
						title="Files"
						branch={currentBranch}
						branches={branchNames}
						showBranches={showBranches}
						onBranchChange={handleBranchChange}
						onFileSelect={handleFileSelect}
						onShowBranchesChange={setShowBranches}
						onLoadChildren={handleLoadChildren}
						onHover={handleHover}
						className="w-80 h-full"
					/>
				</div>

				{/* File Viewer */}
				<FileViewer
					file={fileData?.content ?? null}
					directory={isFileView || isCommitsView ? null : directoryData}
					commit={fileData?.commit}
					commitHistory={commitHistoryData}
					totalCommits={totalCommitCount}
					owner={owner}
					repoName={repo}
					branch={currentBranch}
					currentPath={currentPath}
					historyPage={historyPage}
					isLoading={isContentLoading}
					isHistoryLoading={isHistoryLoading}
					error={fileError?.message ?? null}
					onNavigate={handleNavigate}
					onFileSelect={handleFileSelectFromDir}
					onHover={handleDirectoryHover}
					onShowHistory={handleShowHistory}
					onCloseHistory={handleCloseHistory}
					onPrevPage={handlePrevPage}
					onNextPage={handleNextPage}
					onToggleMobileExplorer={() => setMobileExplorerOpen(true)}
					showHistory={isCommitsView}
					className="flex-1 min-w-0"
				/>
			</div>
		</div>
	);
}

function PendingComponent() {
	return <RepoPending />;
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
	const params = Route.useParams();
	const search = Route.useSearch() as { access_token?: string };
	const splatPath = params["_splat"] || "";
	const parsed = parseRepoPath(splatPath);
	const owner = parsed?.owner || "";
	const repo = parsed?.repo || "";
	const currentBranch = parsed?.branch || "main";
	const hasToken = Boolean(search?.access_token);

	return (
		<RepoErrorBoundary
			error={error}
			reset={reset}
			owner={owner}
			repo={repo}
			currentBranch={currentBranch}
			hasToken={hasToken}
		/>
	);
}

export const Route = createFileRoute("/$")({
	validateSearch: (search: Record<string, unknown>): SearchParams => {
		return {
			access_token: search.access_token as string | undefined,
		};
	},
	// Note: Domain redirect from landing domain to app domain is handled by server middleware
	// See: server/middleware/domain-redirect.ts
	loader: async ({ params, location }) => {
		const splatPath = params["_splat"] || "";
		const segments = splatPath.split("/").filter(Boolean);

		// Ignore system/internal paths:
		// - .well-known (used by browsers for password saving, etc.)
		// - __tsd (TanStack Devtools)
		// - Other paths starting with . or __
		const firstSegment = segments[0] ?? "";
		if (firstSegment.startsWith(".") || firstSegment.startsWith("__")) {
			throw notFound();
		}

		if (segments.length < 2) {
			throw new Error("Invalid path");
		}

		const [owner, repo] = segments;
		const searchParams = new URLSearchParams(location.search);
		const githubToken = searchParams.get("access_token") || "";

		// Only fetch server-side if authenticated (uses token's 5k/hr quota)
		// Unauthenticated requests should be client-side (uses user's IP 60/hr quota)
		if (githubToken) {
			try {
				const [repoInfo, branches] = await Promise.all([
					withTimeout(getRepoInfo(owner, repo, githubToken), LOADER_TIMEOUT),
					withTimeout(getBranches(owner, repo, githubToken), LOADER_TIMEOUT),
				]);

				// Verify the token is valid (silently - dialog will handle auth errors)
				try {
					await withTimeout(getAuthenticatedUser(githubToken), LOADER_TIMEOUT);
				} catch {
					// Auth errors are expected for invalid/expired tokens - dialog handles this
				}

				return { repoInfo, branches, isAuthenticated: true };
			} catch (error) {
				// Rate limit or other errors will be shown in error component
				throw error;
			}
		}

		// Unauthenticated - return null, will fetch on client-side
		return { repoInfo: null, branches: null, isAuthenticated: false };
	},
	pendingComponent: PendingComponent,
	errorComponent: ErrorComponent,
	component: RouteComponent,
});
