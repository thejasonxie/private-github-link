import { Button } from "./ui/button";

export function ErrorFallback() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="text-center">
				<h1 className="text-2xl font-bold text-foreground">
					Something went wrong
				</h1>
				<p className="mt-2 text-muted-foreground">
					An unexpected error occurred. Please refresh the page to try again.
				</p>
				<Button
					onClick={() => window.location.reload()}
					className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Refresh Page
				</Button>
			</div>
		</div>
	);
}
