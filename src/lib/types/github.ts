// Repository information
export interface RepoInfo {
	owner: string;
	name: string;
	fullName: string;
	description?: string;
	isPrivate: boolean;
	homepage?: string;
	topics?: string[];
	avatarUrl?: string;
	defaultBranch: string;
	// Stats
	stars?: number;
	forks?: number;
	watchers?: number;
	openIssues?: number;
	// Additional info
	language?: string;
	license?: string;
	hasReadme?: boolean;
	createdAt?: string;
	updatedAt?: string;
	pushedAt?: string;
}

// Contributor information
export interface Contributor {
	login: string;
	avatarUrl: string;
	profileUrl: string;
	contributions: number;
}

// Contributors result from API
export interface ContributorsResult {
	contributors: Contributor[];
	totalCount: number;
}

// Branch information
export interface BranchInfo {
	name: string;
	protected: boolean;
}

// Tree node for file explorer
export interface TreeNode {
	path: string;
	name: string;
	type: "blob" | "tree";
	sha: string;
	size?: number;
	children?: TreeNode[];
}

// Internal tree item from GitHub API
export interface TreeItem {
	path: string;
	mode: string;
	type: "blob" | "tree";
	sha: string;
	size?: number;
	url: string;
}

// File content from GitHub API
export interface FileContent {
	name: string;
	path: string;
	sha: string;
	size: number;
	content: string;
	encoding: string;
	html_url: string;
	download_url: string;
}

// Commit information
export interface CommitInfo {
	sha: string;
	message: string;
	author: string;
	date: string;
	avatarUrl?: string;
	authorUrl?: string;
}

// Directory entry with commit info
export interface DirectoryEntry {
	name: string;
	path: string;
	type: "blob" | "tree";
	sha: string;
	size?: number;
	commitMessage?: string;
	commitDate?: string;
}

// Directory content for directory view
export interface DirectoryContent {
	path: string;
	entries: DirectoryEntry[];
	commit?: CommitInfo;
}

// Commit history entry
export interface CommitHistoryEntry {
	sha: string;
	message: string;
	author: string;
	authorAvatarUrl?: string;
	authorUrl?: string;
	date: string;
	committer?: string;
}

// Commit history data with pagination
export interface CommitHistoryData {
	commits: CommitHistoryEntry[];
	totalCount: number;
	hasMore: boolean;
	page?: number;
}
export type GitHubUser = GitHubPrivateUser | GitHubPublicUser;

export type GitHubUserPlan = {
	collaborators: number;
	name: string;
	space: number;
	private_repos: number;
};

export type GitHubPublicUser = {
	// required (per schema)
	avatar_url: string;
	events_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	gravatar_id: string | null;
	html_url: string;
	id: number;
	node_id: string;
	login: string;
	organizations_url: string;
	received_events_url: string;
	repos_url: string;
	site_admin: boolean;
	starred_url: string;
	subscriptions_url: string;
	type: string;
	url: string;

	bio: string | null;
	blog: string | null;
	company: string | null;
	email: string | null;
	followers: number;
	following: number;
	hireable: boolean | null;
	location: string | null;
	name: string | null;
	public_gists: number;
	public_repos: number;
	created_at: string; // date-time
	updated_at: string; // date-time

	// optional
	user_view_type?: string;
	notification_email?: string | null;
	twitter_username?: string | null;

	plan?: GitHubUserPlan;

	// present in schema properties (not required)
	private_gists?: number;
	total_private_repos?: number;
	owned_private_repos?: number;
	disk_usage?: number;
	collaborators?: number;
};

export type GitHubPrivateUser = GitHubPublicUser & {
	// additional required fields for "Private User"
	private_gists: number;
	total_private_repos: number;
	owned_private_repos: number;
	disk_usage: number;
	collaborators: number;
	two_factor_authentication: boolean;

	// optional extra fields in private schema
	business_plus?: boolean;
	ldap_dn?: string;
};
