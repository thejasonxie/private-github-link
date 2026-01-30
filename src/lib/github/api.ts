import type {
	BranchInfo,
	CommitHistoryData,
	CommitHistoryEntry,
	CommitInfo,
	ContributorsResult,
	DirectoryContent,
	DirectoryEntry,
	FileContent,
	GitHubUser,
	RepoInfo,
	TreeItem,
	TreeNode,
} from "@/lib/types/github";
import {
	createGitHubClient,
	GITHUB_API_HEADERS,
	MAX_FILE_SIZE_NORMAL,
	MAX_FILE_SIZE_RAW,
	SIMULATE_RATE_LIMIT,
} from "./client";

/**
 * Fetch branches from GitHub API
 */
export async function getBranches(
	owner: string,
	repo: string,
	token: string,
): Promise<BranchInfo[]> {
	const octokit = createGitHubClient(token);

	try {
		const result = await octokit.request("GET /repos/{owner}/{repo}/branches", {
			owner,
			repo,
			per_page: 100,
			headers: GITHUB_API_HEADERS,
			request: {
				signal: AbortSignal.timeout(5000),
			},
		});

		return result.data.map((branch) => ({
			name: branch.name,
			protected: branch.protected,
		}));
	} catch (error) {
		// Check for octokit RequestError with status 403 (rate limit)
		if (
			error &&
			typeof error === "object" &&
			"status" in error &&
			(error as { status: number }).status === 403
		) {
			throw new RateLimitError(
				"GitHub API rate limit exceeded. Please try again later.",
			);
		}
		// Check for abort/timeout errors first
		if (error instanceof DOMException && error.name === "TimeoutError") {
			throw new RateLimitError(
				"Request timed out. GitHub API may be rate limited. Please try again later.",
			);
		}
		if (error instanceof DOMException && error.name === "AbortError") {
			throw new RateLimitError("Request was aborted. Please try again later.");
		}
		if (error instanceof Error) {
			const message = error.message.toLowerCase();
			if (message.includes("not found")) {
				throw new Error("Repository not found or you don't have access");
			}
			if (message.includes("bad credentials")) {
				throw new Error("Invalid GitHub token");
			}
			if (
				message.includes("rate limit") ||
				message.includes("quota exhausted") ||
				message.includes("timed out") ||
				message.includes("aborted")
			) {
				throw new RateLimitError(
					"GitHub API rate limit exceeded. Please try again later.",
				);
			}
		}
		console.error("Failed to fetch branches:", error);
		throw error;
	}
}

// Custom error class for rate limit errors
export class RateLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RateLimitError";
	}
}

/**
 * Fetch repository info from GitHub API
 */
export async function getRepoInfo(
	owner: string,
	repo: string,
	token: string,
): Promise<RepoInfo> {
	// Debug: simulate rate limit for testing UI
	if (SIMULATE_RATE_LIMIT) {
		throw new RateLimitError("[Simulated] GitHub API rate limit exceeded.");
	}

	const octokit = createGitHubClient(token);

	try {
		const result = await octokit.request("GET /repos/{owner}/{repo}", {
			owner,
			repo,
			headers: GITHUB_API_HEADERS,
			request: {
				signal: AbortSignal.timeout(5000),
			},
		});

		return {
			owner: result.data.owner.login,
			name: result.data.name,
			fullName: result.data.full_name,
			description: result.data.description ?? undefined,
			isPrivate: result.data.private,
			homepage: result.data.homepage ?? undefined,
			topics: result.data.topics ?? [],
			avatarUrl: result.data.owner.avatar_url,
			defaultBranch: result.data.default_branch,
			// Stats
			stars: result.data.stargazers_count,
			forks: result.data.forks_count,
			watchers: result.data.subscribers_count, // subscribers_count is the actual "watchers" count
			openIssues: result.data.open_issues_count,
			// Additional info
			language: result.data.language ?? undefined,
			license: result.data.license?.name ?? undefined,
			createdAt: result.data.created_at,
			updatedAt: result.data.updated_at,
			pushedAt: result.data.pushed_at ?? undefined,
		};
	} catch (error) {
		console.error("Failed to fetch repo info:", error);

		// Check for octokit RequestError with status 403 (rate limit)
		if (
			error &&
			typeof error === "object" &&
			"status" in error &&
			(error as { status: number }).status === 403
		) {
			throw new RateLimitError(
				"GitHub API rate limit exceeded. Please try again later or use an access token.",
			);
		}

		// Check for abort/timeout errors
		if (error instanceof DOMException && error.name === "TimeoutError") {
			throw new RateLimitError(
				"Request timed out. GitHub API may be rate limited. Please try again later or use an access token.",
			);
		}
		if (error instanceof DOMException && error.name === "AbortError") {
			throw new RateLimitError(
				"Request was aborted. Please try again later or use an access token.",
			);
		}
		if (error instanceof Error) {
			const message = error.message.toLowerCase();
			if (
				message.includes("rate limit") ||
				message.includes("quota exhausted") ||
				message.includes("api rate limit exceeded") ||
				message.includes("timed out") ||
				message.includes("aborted")
			) {
				throw new RateLimitError(
					"GitHub API rate limit exceeded. Please try again later or use an access token.",
				);
			}
		}
		throw error;
	}
}

/**
 * Fetch contributors from GitHub API
 */
export async function getContributors(
	owner: string,
	repo: string,
	token: string,
): Promise<ContributorsResult> {
	const octokit = createGitHubClient(token);

	try {
		// First, get a count by requesting 1 per page and checking the Link header
		const countResult = await octokit.request(
			"GET /repos/{owner}/{repo}/contributors",
			{
				owner,
				repo,
				per_page: 1,
				anon: "false",
				headers: GITHUB_API_HEADERS,
			},
		);

		// Parse total count from Link header
		let totalCount = 1;
		const linkHeader = countResult.headers.link;
		if (linkHeader) {
			const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
			if (lastMatch) {
				totalCount = parseInt(lastMatch[1], 10);
			}
		}

		// Now fetch the top contributors for display
		const result = await octokit.request(
			"GET /repos/{owner}/{repo}/contributors",
			{
				owner,
				repo,
				per_page: 10,
				headers: GITHUB_API_HEADERS,
			},
		);

		const contributors = result.data.map((contributor) => ({
			login: contributor.login ?? "unknown",
			avatarUrl: contributor.avatar_url ?? "",
			profileUrl: contributor.html_url ?? "",
			contributions: contributor.contributions ?? 0,
		}));

		return { contributors, totalCount };
	} catch (error) {
		console.error("Failed to fetch contributors:", error);
		return { contributors: [], totalCount: 0 };
	}
}

// Helper to check for rate limit errors
function checkRateLimitError(error: unknown): void {
	// Check for octokit RequestError with status 403 (rate limit)
	if (
		error &&
		typeof error === "object" &&
		"status" in error &&
		(error as { status: number }).status === 403
	) {
		throw new RateLimitError(
			"GitHub API rate limit exceeded. Please try again later or use an access token.",
		);
	}
	// Check for abort/timeout errors
	if (error instanceof DOMException && error.name === "TimeoutError") {
		throw new RateLimitError(
			"Request timed out. GitHub API may be rate limited. Please try again later or use an access token.",
		);
	}
	if (error instanceof DOMException && error.name === "AbortError") {
		throw new RateLimitError(
			"Request was aborted. Please try again later or use an access token.",
		);
	}
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		if (
			message.includes("rate limit") ||
			message.includes("quota exhausted") ||
			message.includes("api rate limit exceeded") ||
			message.includes("timed out") ||
			message.includes("aborted")
		) {
			throw new RateLimitError(
				"GitHub API rate limit exceeded. Please try again later or use an access token.",
			);
		}
	}
}

/**
 * Fetch a single directory's contents (non-recursive)
 * Used for lazy loading tree nodes
 */
export async function getDirectoryTree(
	owner: string,
	repo: string,
	branch: string,
	path: string,
	token: string,
): Promise<TreeNode[]> {
	const octokit = createGitHubClient(token);

	try {
		// First, get the tree SHA for the directory
		let treeSha = branch;

		if (path) {
			// Get the tree for the parent path to find the SHA of our target directory
			const parentPath = path.split("/").slice(0, -1).join("/");
			const targetName = path.split("/").pop() || "";

			const parentResult = await octokit.request(
				"GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
				{
					owner,
					repo,
					tree_sha: branch,
					recursive: parentPath ? "1" : undefined,
					headers: GITHUB_API_HEADERS,
					request: {
						signal: AbortSignal.timeout(5000),
					},
				},
			);

			const treeData = parentResult.data.tree as TreeItem[];
			const targetItem = treeData.find(
				(item) =>
					item.type === "tree" &&
					(parentPath ? item.path === path : item.path === targetName),
			);

			if (!targetItem) {
				throw new Error(`Directory not found: ${path}`);
			}

			treeSha = targetItem.sha;
		}

		// Now fetch the directory contents
		const result = await octokit.request(
			"GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
			{
				owner,
				repo,
				tree_sha: treeSha,
				headers: GITHUB_API_HEADERS,
				request: {
					signal: AbortSignal.timeout(5000),
				},
			},
		);

		// Convert to TreeNode format
		return (result.data.tree as TreeItem[]).map((item) => ({
			path: path ? `${path}/${item.path}` : item.path,
			name: item.path,
			type: item.type,
			sha: item.sha,
			size: item.size,
			children: item.type === "tree" ? [] : undefined,
		}));
	} catch (error) {
		console.error("Failed to fetch directory tree:", error);
		checkRateLimitError(error);
		throw error;
	}
}

/**
 * Fetch repository tree from GitHub API
 */
export async function getRepoTree(
	owner: string,
	repo: string,
	branch: string,
	token: string,
): Promise<TreeNode[]> {
	const octokit = createGitHubClient(token);

	const fetchTreeLevel = async (treeSha: string): Promise<TreeItem[]> => {
		const result = await octokit.request(
			"GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
			{
				owner,
				repo,
				tree_sha: treeSha,
				headers: GITHUB_API_HEADERS,
			},
		);
		return result.data.tree as TreeItem[];
	};

	const traverseTreeManually = async (treeSha: string): Promise<TreeNode[]> => {
		const items = await fetchTreeLevel(treeSha);
		const nodes: TreeNode[] = [];

		for (const item of items) {
			const node: TreeNode = {
				path: item.path,
				name: item.path,
				type: item.type,
				sha: item.sha,
				size: item.size,
			};

			if (item.type === "tree") {
				node.children = await traverseTreeManually(item.sha);
			}

			nodes.push(node);
		}

		return nodes;
	};

	const buildNestedTree = (flatTree: TreeItem[]): TreeNode[] => {
		const root: TreeNode[] = [];
		const nodeMap = new Map<string, TreeNode>();

		const sortedTree = [...flatTree].sort((a, b) =>
			a.path.localeCompare(b.path),
		);

		for (const item of sortedTree) {
			const pathParts = item.path.split("/");
			const name = pathParts[pathParts.length - 1];

			const node: TreeNode = {
				path: item.path,
				name,
				type: item.type,
				sha: item.sha,
				size: item.size,
			};

			if (item.type === "tree") {
				node.children = [];
			}

			nodeMap.set(item.path, node);

			if (pathParts.length === 1) {
				root.push(node);
			} else {
				const parentPath = pathParts.slice(0, -1).join("/");
				const parent = nodeMap.get(parentPath);
				if (parent && parent.children) {
					parent.children.push(node);
				}
			}
		}

		return root;
	};

	try {
		const result = await octokit.request(
			"GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
			{
				owner,
				repo,
				tree_sha: branch,
				recursive: "1",
				headers: GITHUB_API_HEADERS,
				request: {
					signal: AbortSignal.timeout(5000),
				},
			},
		);

		if (result.data.truncated) {
			console.warn(
				"Tree was truncated due to size limits. Falling back to manual traversal.",
			);
			return await traverseTreeManually(branch);
		}

		return buildNestedTree(result.data.tree as TreeItem[]);
	} catch (error) {
		console.error("Failed to fetch repo tree:", error);
		checkRateLimitError(error);
		throw error;
	}
}

/**
 * Fetch directory content from GitHub API
 */
export async function getDirectoryContent(
	owner: string,
	repo: string,
	path: string,
	branch: string,
	treeData: TreeNode[],
	token: string,
): Promise<DirectoryContent> {
	const octokit = createGitHubClient(token);

	const findEntriesAtPath = (
		nodes: TreeNode[],
		targetPath: string,
	): TreeNode[] => {
		if (!targetPath) {
			return nodes;
		}

		for (const node of nodes) {
			if (node.path === targetPath && node.type === "tree" && node.children) {
				return node.children;
			}
			if (node.children) {
				const found = findEntriesAtPath(node.children, targetPath);
				if (found.length > 0) return found;
			}
		}
		return [];
	};

	const entries = findEntriesAtPath(treeData, path);

	let directoryCommit: CommitInfo | undefined;
	try {
		const commitsResult = await octokit.request(
			"GET /repos/{owner}/{repo}/commits",
			{
				owner,
				repo,
				path: path || undefined,
				sha: branch,
				per_page: 1,
				headers: GITHUB_API_HEADERS,
			},
		);

		const latestCommit = commitsResult.data[0];
		if (latestCommit) {
			directoryCommit = {
				sha: latestCommit.sha,
				message: latestCommit.commit?.message || "",
				author: latestCommit.commit?.author?.name || "Unknown",
				date: latestCommit.commit?.author?.date || new Date().toISOString(),
				avatarUrl: latestCommit.author?.avatar_url,
				authorUrl: latestCommit.author?.html_url,
			};
		}
	} catch (error) {
		console.error("Failed to fetch directory commit:", error);
	}

	const entriesWithCommits: DirectoryEntry[] = await Promise.all(
		entries.map(async (entry): Promise<DirectoryEntry> => {
			try {
				const commitsResult = await octokit.request(
					"GET /repos/{owner}/{repo}/commits",
					{
						owner,
						repo,
						path: entry.path,
						sha: branch,
						per_page: 1,
						headers: GITHUB_API_HEADERS,
					},
				);

				const latestCommit = commitsResult.data[0];
				return {
					name: entry.name,
					path: entry.path,
					type: entry.type,
					sha: entry.sha,
					size: entry.size,
					commitMessage: latestCommit?.commit?.message?.split("\n")[0] || "",
					commitDate: latestCommit?.commit?.author?.date,
				};
			} catch {
				return {
					name: entry.name,
					path: entry.path,
					type: entry.type,
					sha: entry.sha,
					size: entry.size,
				};
			}
		}),
	);

	return {
		path,
		entries: entriesWithCommits,
		commit: directoryCommit,
	};
}

/**
 * Fetch directory content directly from GitHub API (no treeData required)
 * Used for lazy loading - fetches directory contents on demand
 */
export async function getDirectoryContentDirect(
	owner: string,
	repo: string,
	path: string,
	branch: string,
	token: string,
): Promise<DirectoryContent> {
	const octokit = createGitHubClient(token);

	try {
		// Fetch directory contents directly from GitHub API
		const result = await octokit.request(
			"GET /repos/{owner}/{repo}/contents/{path}",
			{
				owner,
				repo,
				path: path || ".",
				ref: branch,
				headers: GITHUB_API_HEADERS,
				request: {
					signal: AbortSignal.timeout(5000),
				},
			},
		);

		const contents = Array.isArray(result.data) ? result.data : [result.data];

		// Convert to DirectoryEntry format
		const entries: DirectoryEntry[] = contents.map((item) => ({
			name: item.name,
			path: item.path,
			type: item.type === "dir" ? "tree" : "blob",
			sha: item.sha,
			size: item.size,
		}));

		// Fetch commit info for the directory
		let directoryCommit: CommitInfo | undefined;
		try {
			const commitsResult = await octokit.request(
				"GET /repos/{owner}/{repo}/commits",
				{
					owner,
					repo,
					path: path || undefined,
					sha: branch,
					per_page: 1,
					headers: GITHUB_API_HEADERS,
				},
			);

			const latestCommit = commitsResult.data[0];
			if (latestCommit) {
				directoryCommit = {
					sha: latestCommit.sha,
					message: latestCommit.commit?.message || "",
					author: latestCommit.commit?.author?.name || "Unknown",
					date: latestCommit.commit?.author?.date || new Date().toISOString(),
					avatarUrl: latestCommit.author?.avatar_url,
					authorUrl: latestCommit.author?.html_url,
				};
			}
		} catch (error) {
			console.error("Failed to fetch directory commit:", error);
		}

		// Fetch commit info for each entry
		const entriesWithCommits: DirectoryEntry[] = await Promise.all(
			entries.map(async (entry): Promise<DirectoryEntry> => {
				try {
					const commitsResult = await octokit.request(
						"GET /repos/{owner}/{repo}/commits",
						{
							owner,
							repo,
							path: entry.path,
							sha: branch,
							per_page: 1,
							headers: GITHUB_API_HEADERS,
						},
					);

					const latestCommit = commitsResult.data[0];
					return {
						...entry,
						commitMessage: latestCommit?.commit?.message?.split("\n")[0] || "",
						commitDate: latestCommit?.commit?.author?.date,
					};
				} catch {
					return entry;
				}
			}),
		);

		return {
			path,
			entries: entriesWithCommits,
			commit: directoryCommit,
		};
	} catch (error) {
		console.error("Failed to fetch directory content:", error);
		checkRateLimitError(error);
		throw error;
	}
}

/**
 * Fetch file content from GitHub API
 */
export async function getFileContent(
	owner: string,
	repo: string,
	path: string,
	branch: string,
	fileSize: number | undefined,
	token: string,
): Promise<{ content: FileContent; commit: CommitInfo }> {
	const octokit = createGitHubClient(token);

	if (fileSize && fileSize > MAX_FILE_SIZE_RAW) {
		throw new Error(
			`File is too large (${(fileSize / (1024 * 1024)).toFixed(2)} MB). Files larger than 100MB are not supported.`,
		);
	}

	const isLargeFile = fileSize && fileSize > MAX_FILE_SIZE_NORMAL;

	try {
		const contentResult = await octokit.request(
			"GET /repos/{owner}/{repo}/contents/{path}",
			{
				owner,
				repo,
				path,
				ref: branch,
				headers: {
					...GITHUB_API_HEADERS,
					...(isLargeFile && {
						Accept: "application/vnd.github.raw+json",
					}),
				},
			},
		);

		let fileContent: FileContent;

		if (isLargeFile) {
			fileContent = {
				name: path.split("/").pop() || path,
				path,
				sha: "",
				size: fileSize || 0,
				content: contentResult.data as unknown as string,
				encoding: "none",
				html_url: `https://github.com/${owner}/${repo}/blob/${branch}/${path}`,
				download_url: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
			};
		} else {
			const data = contentResult.data as {
				name: string;
				path: string;
				sha: string;
				size: number;
				content?: string;
				encoding?: string;
				html_url: string;
				download_url: string;
				type: string;
			};

			if (data.type !== "file") {
				throw new Error("Selected item is not a file");
			}

			fileContent = {
				name: data.name,
				path: data.path,
				sha: data.sha,
				size: data.size,
				content: data.content || "",
				encoding: data.encoding || "base64",
				html_url: data.html_url,
				download_url: data.download_url,
			};
		}

		const commitsResult = await octokit.request(
			"GET /repos/{owner}/{repo}/commits",
			{
				owner,
				repo,
				path,
				sha: branch,
				per_page: 1,
				headers: GITHUB_API_HEADERS,
			},
		);

		const latestCommit = commitsResult.data[0];
		const commitInfo: CommitInfo = {
			sha: latestCommit?.sha || "",
			message: latestCommit?.commit?.message || "",
			author: latestCommit?.commit?.author?.name || "Unknown",
			date: latestCommit?.commit?.author?.date || new Date().toISOString(),
			avatarUrl: latestCommit?.author?.avatar_url,
			authorUrl: latestCommit?.author?.html_url,
		};

		return { content: fileContent, commit: commitInfo };
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("too_large")) {
				throw new Error(
					"File is too large to display. Please download it directly.",
				);
			}
			if (error.message.includes("Not Found")) {
				throw new Error("File not found");
			}
		}
		throw error;
	}
}

/**
 * Fetch commit history from GitHub API
 */
export async function getCommitHistory(
	owner: string,
	repo: string,
	path: string,
	branch: string,
	page: number,
	perPage: number,
	token: string,
): Promise<CommitHistoryData> {
	const octokit = createGitHubClient(token);

	try {
		const commitsResult = await octokit.request(
			"GET /repos/{owner}/{repo}/commits",
			{
				owner,
				repo,
				path: path || undefined,
				sha: branch,
				per_page: perPage,
				page,
				headers: GITHUB_API_HEADERS,
			},
		);

		const commits: CommitHistoryEntry[] = commitsResult.data.map((commit) => ({
			sha: commit.sha,
			message: commit.commit?.message || "",
			author: commit.commit?.author?.name || "Unknown",
			authorAvatarUrl: commit.author?.avatar_url,
			authorUrl: commit.author?.html_url,
			date: commit.commit?.author?.date || new Date().toISOString(),
			committer: commit.commit?.committer?.name,
		}));

		const hasMore = commitsResult.data.length === perPage;

		return {
			commits,
			totalCount: commits.length,
			hasMore,
			page,
		};
	} catch (error) {
		console.error("Failed to fetch commit history:", error);
		throw error;
	}
}

/**
 * Fetch total commit count from GitHub API
 */
export async function getTotalCommitCount(
	owner: string,
	repo: string,
	branch: string,
	token: string,
): Promise<number> {
	const octokit = createGitHubClient(token);

	try {
		const response = await octokit.request(
			"GET /repos/{owner}/{repo}/commits",
			{
				owner,
				repo,
				sha: branch,
				per_page: 1,
				headers: GITHUB_API_HEADERS,
			},
		);

		const linkHeader = response.headers.link;
		if (linkHeader) {
			const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
			if (lastMatch) {
				return parseInt(lastMatch[1], 10);
			}
		}

		return response.data.length;
	} catch (error) {
		console.error("Failed to fetch commit count:", error);
		return 0;
	}
}

export async function getUser(username: string): Promise<GitHubUser> {
	const octokit = createGitHubClient();

	try {
		const response = await octokit.request("GET /users/{username}", {
			username,
		});

		return response.data;
	} catch (error) {
		console.error("Failed to fetch commit count:", error);
		throw error;
	}
}
export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
	const octokit = createGitHubClient(token);

	try {
		const response = await octokit.request("GET /user");

		return response.data;
	} catch (error) {
		console.error("Failed to fetch commit count:", error);
		throw error;
	}
}
