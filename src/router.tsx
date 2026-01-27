import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter, Link } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Default not found component
function DefaultNotFound() {
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
				<p className="text-lg text-muted-foreground mb-4">Page not found</p>
				<Link
					to="/"
					className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
				>
					Go Home
				</Link>
			</div>
		</div>
	);
}

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();

	const router = createRouter({
		routeTree,
		context: {
			...rqContext,
		},
		defaultNotFoundComponent: DefaultNotFound,
		defaultPreload: "intent",
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContext.queryClient,
	});

	if (!router.isServer) {
		const dsn = import.meta.env.VITE_SENTRY_DSN;
		if (dsn) {
			Sentry.init({
				dsn,
				environment: import.meta.env.MODE,
				integrations: [],
				// Adjust sample rates for production
				tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
				sendDefaultPii: true,
				// Tunnel through our own domain to bypass ad-blockers
				tunnel: "/api/sentry-tunnel",
			});
		} else {
			console.warn(
				"[Sentry] VITE_SENTRY_DSN not configured, skipping client initialization",
			);
		}
	}

	return router;
};
