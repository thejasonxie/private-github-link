import * as Sentry from "@sentry/tanstackstart-react";
import { createFileRoute } from "@tanstack/react-router";

// Test endpoint for Sentry server-side error capture
// Only available in development

export const Route = createFileRoute("/api/test-error")({
	server: {
		handlers: {
			POST: async () => {
				// Only allow in development
				if (process.env.NODE_ENV === "production") {
					return new Response(
						JSON.stringify({ message: "Not available in production" }),
						{
							status: 403,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				try {
					// Create and capture a test error
					const testError = new Error(
						"Test server error from Sentry integration",
					);
					Sentry.captureException(testError);

					return new Response(
						JSON.stringify({ message: "Server error sent to Sentry!" }),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						},
					);
				} catch (error) {
					console.error("[test-error] Failed:", error);
					return new Response(
						JSON.stringify({ message: "Failed to capture error" }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			},
		},
	},
});
