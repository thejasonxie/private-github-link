export type ViewType = "tree" | "blob" | "commits";

export interface ParsedRepoPath {
	owner: string;
	repo: string;
	viewType: ViewType;
	branch: string;
	path: string;
}

/**
 * Parse URL path: {owner}/{repo}/{viewType}/{branch}/{...path}
 * @param splatPath - The URL path segment to parse
 * @returns Parsed repo path object or null if invalid
 */
export function parseRepoPath(splatPath: string): ParsedRepoPath | null {
	const segments = splatPath.split("/").filter(Boolean);

	if (segments.length < 2) {
		return null;
	}

	const [owner, repo, viewType, ...rest] = segments;
	const validViewTypes: ViewType[] = ["tree", "blob", "commits"];

	if (viewType && !validViewTypes.includes(viewType as ViewType)) {
		return null;
	}

	const branch = rest[0] || "main";
	const path = rest.slice(1).join("/");

	return {
		owner,
		repo,
		viewType: (viewType as ViewType) || "tree",
		branch,
		path,
	};
}
