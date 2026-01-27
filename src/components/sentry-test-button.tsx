import * as Sentry from "@sentry/tanstackstart-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SentryTestButton() {
	const [status, setStatus] = useState<string | null>(null);

	const triggerClientError = () => {
		try {
			throw new Error("Test client error from Sentry integration");
		} catch (error) {
			Sentry.captureException(error);
			setStatus("Client error sent to Sentry!");
		}
	};

	const triggerServerError = async () => {
		setStatus("Sending...");
		try {
			const res = await fetch("/api/test-error", { method: "POST" });
			const data = await res.json();
			setStatus(data.message);
		} catch (error) {
			setStatus("Failed to trigger server error");
		}
	};

	// Only show in development
	if (import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) return null;

	return (
		<div className="fixed bottom-20 left-4 z-50 rounded-md border border-border bg-background p-4 shadow-lg">
			<p className="mb-2 text-sm font-semibold text-foreground">Sentry Test</p>
			<div className="flex gap-2">
				<Button variant="destructive" size="sm" onClick={triggerClientError}>
					Client Error
				</Button>
				<Button variant="outline" size="sm" onClick={triggerServerError}>
					Server Error
				</Button>
			</div>
			{status && (
				<p className="mt-2 text-xs text-green-600 dark:text-green-400">
					{status}
				</p>
			)}
		</div>
	);
}
