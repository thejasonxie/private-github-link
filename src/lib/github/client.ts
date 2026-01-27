import { Octokit } from "@octokit/core";

/**
 * Debug: Set to true to simulate rate limiting for testing UI
 */
export const SIMULATE_RATE_LIMIT = false;

/**
 * Common GitHub API headers
 */
export const GITHUB_API_HEADERS = {
	"X-GitHub-Api-Version": "2022-11-28",
} as const;

/**
 * Request timeout in milliseconds (5 seconds)
 */
export const REQUEST_TIMEOUT = 5000;

/**
 * Create an authenticated Octokit client
 * Using @octokit/core directly to avoid throttling plugin that can cause hangs
 */
export function createGitHubClient(token?: string): Octokit {
	return new Octokit({
		auth: token,
	});
}

/**
 * Wrapper to add timeout to any async function
 */
export async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number = REQUEST_TIMEOUT,
): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout>;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`Request timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	try {
		const result = await Promise.race([promise, timeoutPromise]);
		clearTimeout(timeoutId!);
		return result;
	} catch (error) {
		clearTimeout(timeoutId!);
		throw error;
	}
}

/**
 * Size limits from GitHub API docs
 */
export const MAX_FILE_SIZE_NORMAL = 1024 * 1024; // 1MB
export const MAX_FILE_SIZE_RAW = 100 * 1024 * 1024; // 100MB
