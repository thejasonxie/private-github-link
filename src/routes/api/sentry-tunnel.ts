import { createFileRoute } from "@tanstack/react-router";

// Sentry tunnel to bypass ad-blockers
// Proxies requests from /api/sentry-tunnel to Sentry's ingest endpoint
// See: https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option

export const Route = createFileRoute("/api/sentry-tunnel")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = await request.text();

					// Parse the envelope to extract the DSN and determine the project
					const pieces = body.split("\n");
					const header = JSON.parse(pieces[0]) as { dsn: string };
					const dsn = new URL(header.dsn);

					// Construct Sentry ingest URL from DSN
					// DSN format: https://<key>@o<org_id>.ingest.<region>.sentry.io/<project_id>
					const projectId = dsn.pathname.slice(1); // Remove leading slash
					const sentryIngestUrl = `https://${dsn.host}/api/${projectId}/envelope/`;

					// Forward the request to Sentry
					const response = await fetch(sentryIngestUrl, {
						method: "POST",
						headers: {
							"Content-Type": "application/x-sentry-envelope",
						},
						body,
					});

					return new Response(response.body, {
						status: response.status,
						headers: {
							"Content-Type": "application/json",
						},
					});
				} catch (error) {
					console.error("[sentry-tunnel] Error:", error);
					return new Response("Tunnel error", { status: 500 });
				}
			},
		},
	},
});
