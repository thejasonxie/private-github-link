import posthog from "posthog-js";

// Re-export posthog for use in components
export { posthog };

// PostHog configuration
const POSTHOG_OPTIONS = {
	// Use reverse proxy to bypass blockers
	api_host: "/api/t/e",
	// Required when using a reverse proxy
	ui_host: "https://us.posthog.com",
	// Disable compression - proxy doesn't preserve gzip encoding
	disable_compression: true,
	// Capture pageviews automatically
	capture_pageview: true,
	// Capture pageleave events for accurate time-on-page
	capture_pageleave: true,
	// Disable session recording
	disable_session_recording: true,
	// Respect Do Not Track browser setting
	respect_dnt: true,
};

// Get the PostHog API key from environment
export function getPostHogApiKey(): string | undefined {
	if (typeof window === "undefined") return undefined;
	return import.meta.env.VITE_POSTHOG_API_KEY;
}

// PostHog options for the provider
export const posthogOptions = POSTHOG_OPTIONS;

// Initialize PostHog imperatively (alternative to provider)
let initialized = false;

export function initPostHog() {
	if (typeof window === "undefined") return;
	if (initialized) return;

	const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;

	if (!apiKey) {
		console.warn(
			"[PostHog] VITE_POSTHOG_API_KEY not configured, skipping initialization",
		);
		return;
	}

	posthog.init(apiKey, POSTHOG_OPTIONS);
	initialized = true;
}
