import * as Sentry from "@sentry/tanstackstart-react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { PostHogProvider } from "posthog-js/react";
import { ErrorFallback } from "@/components/error-fallback";
import { SentryTestButton } from "@/components/sentry-test-button";
import { ThemeProvider } from "@/components/theme-provider";
import { getPostHogApiKey, posthogOptions } from "@/lib/posthog.client";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: ({ params }) => {
		const splatPath = (params as any)?.["_splat"] || "";
		const segments = splatPath.split("/").filter(Boolean);
		const [owner, repo] = segments;

		return {
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					title: owner && repo ? `${owner}/${repo}` : "Private Github",
				},
			],
			links: [
				{
					rel: "stylesheet",
					href: appCss,
				},
			],
		};
	},

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const posthogApiKey = getPostHogApiKey();

	const content = (
		<ThemeProvider>
			<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
				{children}
			</Sentry.ErrorBoundary>
		</ThemeProvider>
	);

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{posthogApiKey ? (
					<PostHogProvider apiKey={posthogApiKey} options={posthogOptions}>
						{content}
					</PostHogProvider>
				) : (
					content
				)}
				<SentryTestButton />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>

				<Scripts />
			</body>
		</html>
	);
}
