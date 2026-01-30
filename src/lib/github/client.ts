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

// Global rate limit callback - set by the rate limit hook
let rateLimitCallback:
	| ((
			headers: Record<string, string | number | undefined>,
			token?: string,
	  ) => void)
	| null = null;

/**
 * Register a callback to be called when rate limit headers are received
 * This is used internally by the rate limit tracking system
 */
export function registerRateLimitCallback(
	callback: (
		headers: Record<string, string | number | undefined>,
		token?: string,
	) => void,
): void {
	rateLimitCallback = callback;
}

/**
 * Unregister the rate limit callback
 */
export function unregisterRateLimitCallback(): void {
	rateLimitCallback = null;
}

/**
 * Notify the rate limit system about new headers
 * Called automatically by API functions after each request
 */
export function notifyRateLimitHeaders(
	headers: Record<string, string | number | undefined>,
	token?: string,
): void {
	if (rateLimitCallback) {
		rateLimitCallback(headers, token);
	}
}

/**
 * Helper to extract rate limit headers from an Octokit response
 */
export function extractRateLimitHeaders(
	headers: Record<string, unknown>,
): Record<string, string | number | undefined> {
	return {
		"x-ratelimit-limit": headers["x-ratelimit-limit"] as number | undefined,
		"x-ratelimit-remaining": headers["x-ratelimit-remaining"] as
			| number
			| undefined,
		"x-ratelimit-reset": headers["x-ratelimit-reset"] as number | undefined,
		"x-ratelimit-used": headers["x-ratelimit-used"] as number | undefined,
	};
}
