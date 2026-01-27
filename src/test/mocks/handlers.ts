import { HttpResponse, http } from "msw";

// Mock data for GitHub API responses
export const mockRepoInfo = {
	id: 123456,
	name: "test-repo",
	full_name: "test-owner/test-repo",
	private: false,
	owner: {
		login: "test-owner",
		avatar_url: "https://github.com/test-owner.png",
	},
	description: "A test repository",
	homepage: "https://example.com",
	topics: ["typescript", "react"],
	default_branch: "main",
	stargazers_count: 100,
	forks_count: 50,
	subscribers_count: 25,
	open_issues_count: 10,
	language: "TypeScript",
	license: { name: "MIT" },
	created_at: "2024-01-01T00:00:00Z",
	updated_at: "2024-06-01T00:00:00Z",
	pushed_at: "2024-06-15T00:00:00Z",
};

export const mockBranches = [
	{ name: "main", protected: true },
	{ name: "develop", protected: false },
	{ name: "feature/test", protected: false },
];

export const mockTree = {
	sha: "abc123",
	tree: [
		{ path: "README.md", type: "blob", sha: "def456", size: 1024 },
		{ path: "src", type: "tree", sha: "ghi789" },
		{ path: "src/index.ts", type: "blob", sha: "jkl012", size: 2048 },
		{ path: "package.json", type: "blob", sha: "mno345", size: 512 },
	],
	truncated: false,
};

export const mockUser = {
	login: "test-user",
	id: 12345,
	avatar_url: "https://github.com/test-user.png",
	name: "Test User",
	email: "test@example.com",
};

export const mockContributors = [
	{
		login: "contributor1",
		avatar_url: "https://github.com/contributor1.png",
		contributions: 100,
		html_url: "https://github.com/contributor1",
	},
	{
		login: "contributor2",
		avatar_url: "https://github.com/contributor2.png",
		contributions: 50,
		html_url: "https://github.com/contributor2",
	},
];

export const mockCommit = {
	sha: "abc123def456",
	commit: {
		message: "Initial commit",
		author: {
			name: "Test User",
			email: "test@example.com",
			date: "2024-06-15T10:00:00Z",
		},
	},
	author: {
		login: "test-user",
		avatar_url: "https://github.com/test-user.png",
	},
	html_url: "https://github.com/test-owner/test-repo/commit/abc123def456",
};

export const mockFileContent = {
	name: "README.md",
	path: "README.md",
	sha: "def456",
	size: 1024,
	type: "file",
	content: Buffer.from("# Test Repository\n\nThis is a test.").toString(
		"base64",
	),
	encoding: "base64",
};

// Default handlers - success cases
export const handlers = [
	// Get repository info
	http.get("https://api.github.com/repos/:owner/:repo", ({ params }) => {
		const { owner, repo } = params;
		return HttpResponse.json({
			...mockRepoInfo,
			name: repo,
			full_name: `${owner}/${repo}`,
			owner: { ...mockRepoInfo.owner, login: owner as string },
		});
	}),

	// Get branches
	http.get("https://api.github.com/repos/:owner/:repo/branches", () => {
		return HttpResponse.json(mockBranches);
	}),

	// Get repository tree
	http.get(
		"https://api.github.com/repos/:owner/:repo/git/trees/:branch",
		() => {
			return HttpResponse.json(mockTree);
		},
	),

	// Get file content
	http.get(
		"https://api.github.com/repos/:owner/:repo/contents/:path*",
		({ params }) => {
			// :path* returns an array of path segments
			const pathSegments = params.path;
			const pathStr = Array.isArray(pathSegments)
				? pathSegments.join("/")
				: pathSegments;
			const name = Array.isArray(pathSegments)
				? pathSegments[pathSegments.length - 1]
				: pathSegments;
			return HttpResponse.json({
				...mockFileContent,
				path: pathStr,
				name: name,
			});
		},
	),

	// Get contributors
	http.get("https://api.github.com/repos/:owner/:repo/contributors", () => {
		return HttpResponse.json(mockContributors, {
			headers: { Link: "" },
		});
	}),

	// Get commits
	http.get("https://api.github.com/repos/:owner/:repo/commits", () => {
		return HttpResponse.json([mockCommit], {
			headers: { Link: "" },
		});
	}),

	// Get authenticated user
	http.get("https://api.github.com/user", () => {
		return HttpResponse.json(mockUser);
	}),

	// Get user by username
	http.get("https://api.github.com/users/:username", ({ params }) => {
		return HttpResponse.json({
			...mockUser,
			login: params.username,
		});
	}),
];

// Error handlers for testing error cases
export const rateLimitHandler = http.get(
	"https://api.github.com/repos/:owner/:repo",
	() => {
		return HttpResponse.json(
			{
				message: "API rate limit exceeded",
				documentation_url:
					"https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting",
			},
			{
				status: 403,
				headers: {
					"X-RateLimit-Remaining": "0",
					"X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
				},
			},
		);
	},
);

export const notFoundHandler = http.get(
	"https://api.github.com/repos/:owner/:repo",
	() => {
		return HttpResponse.json(
			{
				message: "Not Found",
				documentation_url:
					"https://docs.github.com/rest/repos/repos#get-a-repository",
			},
			{ status: 404 },
		);
	},
);

export const unauthorizedHandler = http.get(
	"https://api.github.com/user",
	() => {
		return HttpResponse.json(
			{
				message: "Bad credentials",
				documentation_url: "https://docs.github.com/rest",
			},
			{ status: 401 },
		);
	},
);
