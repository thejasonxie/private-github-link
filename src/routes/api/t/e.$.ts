import { createFileRoute } from "@tanstack/react-router";

// Analytics reverse proxy for PostHog
// Bypasses ad blockers by routing through our domain
const API_HOST = "us.i.posthog.com";
const ASSET_HOST = "us-assets.i.posthog.com";

export const Route = createFileRoute("/api/t/e/$")({
	server: {
		handlers: {
			GET: handleRequest,
			POST: handleRequest,
		},
	},
});

async function handleRequest({ request }: { request: Request }) {
	try {
		const url = new URL(request.url);

		// Determine which host to use based on path
		const isStatic = url.pathname.includes("/static/");
		const targetHost = isStatic ? ASSET_HOST : API_HOST;

		// Strip the proxy prefix (/api/t/e) to get the actual path
		// e.g., /api/t/e/e/?ip=0 -> /e/?ip=0
		const targetPath = url.pathname.replace(/^\/api\/t\/e/, "");
		const targetUrl = `https://${targetHost}${targetPath}${url.search}`;

		// Forward headers, but fix the host
		const headers = new Headers();
		for (const [key, value] of request.headers.entries()) {
			if (
				!["host", "connection", "content-length"].includes(key.toLowerCase())
			) {
				headers.set(key, value);
			}
		}
		headers.set("host", targetHost);

		// Get body for non-GET requests
		let body: ArrayBuffer | undefined;
		if (request.method !== "GET" && request.method !== "HEAD") {
			body = await request.arrayBuffer();
		}

		const response = await fetch(targetUrl, {
			method: request.method,
			headers,
			body,
		});

		// Return response with cleaned headers
		const responseHeaders = new Headers();
		responseHeaders.set(
			"content-type",
			response.headers.get("content-type") || "application/json",
		);
		responseHeaders.set("access-control-allow-origin", "*");

		return new Response(response.body, {
			status: response.status,
			headers: responseHeaders,
		});
	} catch (error) {
		console.error("[posthog-proxy] Error:", error);
		return new Response("Proxy error", { status: 500 });
	}
}
