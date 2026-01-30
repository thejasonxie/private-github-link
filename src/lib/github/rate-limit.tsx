import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import {
	createGitHubClient,
	registerRateLimitCallback,
	unregisterRateLimitCallback,
} from "./client";

interface RateLimitState {
	used: number;
	limit: number;
	percentage: number;
}

interface RateLimitContextType {
	state: RateLimitState | null;
	isLoading: boolean;
}

const RateLimitContext = React.createContext<RateLimitContextType | null>(null);

const RATE_LIMIT_QUERY_KEY = "rateLimit";

interface RateLimitResponse {
	resources: {
		core: {
			limit: number;
			remaining: number;
			reset: number;
		};
	};
}

/**
 * Fetch rate limit from GitHub API
 */
async function fetchRateLimit(token?: string): Promise<RateLimitState> {
	const octokit = createGitHubClient(token);

	const response = await octokit.request("GET /rate_limit", {
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});

	const data = response.data as RateLimitResponse;
	const core = data.resources.core;

	return {
		limit: core.limit,
		used: core.limit - core.remaining,
		percentage: Math.round(((core.limit - core.remaining) / core.limit) * 100),
	};
}

/**
 * Hook to get current rate limit state
 * This is the primary hook - components should use this directly
 */
export function useRateLimit(token?: string): RateLimitContextType {
	const queryClient = useQueryClient();
	const tokenRef = React.useRef(token);
	const previousTokenRef = React.useRef(token);

	// Update ref when token changes
	React.useEffect(() => {
		tokenRef.current = token;
	}, [token]);

	// Invalidate cache when token changes to prevent stale data
	React.useEffect(() => {
		const previousToken = previousTokenRef.current;
		if (previousToken !== token) {
			// Invalidate the old rate limit cache
			queryClient.invalidateQueries({
				queryKey: [RATE_LIMIT_QUERY_KEY, previousToken || "anonymous"],
			});
			// Also invalidate any cached directory content with the old token
			queryClient.invalidateQueries({
				queryKey: ["getDirectoryContentDirect"],
				predicate: (query) => {
					const queryKey = query.queryKey;
					// Check if this query was made with the old token
					return queryKey.length >= 6 && queryKey[5] === previousToken;
				},
			});
			previousTokenRef.current = token;
		}
	}, [token, queryClient]);

	// Register callback to handle rate limit headers from API responses
	React.useEffect(() => {
		const handleRateLimitHeaders = (
			headers: Record<string, string | number | undefined>,
			responseToken?: string,
		) => {
			// Only process if the response token matches our current token
			if (responseToken !== tokenRef.current) {
				return;
			}

			const remaining = headers["x-ratelimit-remaining"];
			const limit = headers["x-ratelimit-limit"];

			if (remaining !== undefined && limit !== undefined) {
				const remainingNum = Number(remaining);
				const limitNum = Number(limit);

				if (!Number.isNaN(remainingNum) && !Number.isNaN(limitNum)) {
					const used = limitNum - remainingNum;
					const percentage = Math.round((used / limitNum) * 100);

					const newState: RateLimitState = {
						used,
						limit: limitNum,
						percentage,
					};

					// Update the query cache with new values
					queryClient.setQueryData(
						[RATE_LIMIT_QUERY_KEY, tokenRef.current || "anonymous"],
						newState,
					);
				}
			}
		};

		// Register the callback
		registerRateLimitCallback(handleRateLimitHeaders);

		// Cleanup on unmount
		return () => {
			unregisterRateLimitCallback();
		};
	}, [queryClient]);

	const { data, isLoading } = useQuery({
		queryKey: [RATE_LIMIT_QUERY_KEY, token || "anonymous"],
		queryFn: () => fetchRateLimit(token),
		refetchInterval: 60000, // Poll every 60 seconds
		staleTime: 0, // Always consider data stale to enable background updates
		enabled: typeof window !== "undefined", // Only run on client
	});

	return {
		state: data || null,
		isLoading,
	};
}

interface RateLimitProviderProps {
	children: React.ReactNode;
}

/**
 * Provider component for rate limit context
 * Note: This is a thin wrapper. The actual token should be passed to useRateLimit hook
 */
export function RateLimitProvider({ children }: RateLimitProviderProps) {
	return (
		<RateLimitContext.Provider value={null}>
			{children}
		</RateLimitContext.Provider>
	);
}

/**
 * Hook to access rate limit context
 * @deprecated Use useRateLimit(token) directly instead
 */
export function useRateLimitContext(): RateLimitContextType {
	const context = React.useContext(RateLimitContext);
	if (!context) {
		throw new Error(
			"useRateLimitContext must be used within a RateLimitProvider",
		);
	}
	return context;
}
