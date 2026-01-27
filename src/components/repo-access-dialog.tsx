import { Link } from "@tanstack/react-router";
import {
	AlertTriangle,
	Check,
	CheckCircle2,
	ChevronRight,
	Copy,
	ExternalLink,
	Eye,
	EyeOff,
	Github,
	Lock,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_DOMAIN } from "@/lib/constants";
import { getRepoInfo } from "@/lib/github";
import { getAuthenticatedUser } from "@/lib/github/api";
import type { RepoInfo } from "@/lib/types/github";

interface RepoAccessDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	repoOwner?: string;
	repoName?: string;
	defaultBranch?: string;
	variant?: "not-found" | "rate-limit" | "rate-limit-wait";
}

type VerificationStep =
	| "idle"
	| "verifying-token"
	| "verifying-repo"
	| "success"
	| "error";

export function RepoAccessDialog({
	open,
	onOpenChange,
	repoOwner = "owner",
	repoName = "repository",
	defaultBranch = "main",
	variant = "not-found",
}: RepoAccessDialogProps) {
	// All variants start with explanation screen first
	const [showTokenInput, setShowTokenInput] = React.useState(false);
	const [showInstructions, setShowInstructions] = React.useState(false);
	const [token, setToken] = React.useState<string>("");
	const [showToken, setShowToken] = React.useState(false);
	const [copiedStep, setCopiedStep] = React.useState<number | null>(null);

	// Verification state
	const [verificationStep, setVerificationStep] =
		React.useState<VerificationStep>("idle");
	const [error, setError] = React.useState<string | null>(null);
	const [verifiedRepoInfo, setVerifiedRepoInfo] =
		React.useState<RepoInfo | null>(null);

	// Reset showTokenInput when dialog opens
	React.useEffect(() => {
		if (open) {
			setShowTokenInput(false);
		}
	}, [open]);

	const isRateLimitWait = variant === "rate-limit-wait";

	const fullRepoName = `${repoOwner}/${repoName}`;
	const tokenInputId = React.useId();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token.trim()) return;

		setError(null);
		setVerificationStep("verifying-token");

		try {
			// Step 1: Verify token is valid by getting authenticated user
			await getAuthenticatedUser(token);

			// Step 2: Verify token has access to the repository
			setVerificationStep("verifying-repo");
			const repoInfo = await getRepoInfo(repoOwner, repoName, token);

			// Success! Store the repo info
			setVerifiedRepoInfo(repoInfo);
			setVerificationStep("success");
		} catch (err) {
			setVerificationStep("error");

			if (err instanceof Error) {
				const message = err.message.toLowerCase();

				if (message.includes("bad credentials") || message.includes("401")) {
					setError("Invalid token. Please check your token and try again.");
				} else if (message.includes("not found") || message.includes("404")) {
					setError(
						"Repository not found or token doesn't have access to this repository. Make sure your token has the 'Contents' permission for this repository.",
					);
				} else if (message.includes("rate limit")) {
					setError("GitHub API rate limit exceeded. Please try again later.");
				} else {
					setError(
						err.message || "An unexpected error occurred. Please try again.",
					);
				}
			} else {
				setError("An unexpected error occurred. Please try again.");
			}
		}
	};

	const getRepoUrl = () => {
		const branch = verifiedRepoInfo?.defaultBranch || defaultBranch;
		return `/${repoOwner}/${repoName}/tree/${branch}?access_token=${encodeURIComponent(token)}`;
	};

	const copyToClipboard = (text: string, step: number) => {
		navigator.clipboard.writeText(text);
		setCopiedStep(step);
		setTimeout(() => setCopiedStep(null), 2000);
	};

	const resetState = () => {
		setShowTokenInput(false);
		setShowInstructions(false);
		setToken("");
		setShowToken(false);
		setVerificationStep("idle");
		setError(null);
		setVerifiedRepoInfo(null);
	};

	const isVerifying =
		verificationStep === "verifying-token" ||
		verificationStep === "verifying-repo";

	console.log({ variant, verificationStep, showTokenInput, showInstructions });
	return (
		<Dialog
			open={open}
			onOpenChange={(newOpen) => {
				if (!newOpen) resetState();
				onOpenChange(newOpen);
			}}
		>
			<DialogContent
				className="sm:max-w-[80%] overflow-hidden [&>button]:hidden"
				overlayClassName="bg-black/25 supports-backdrop-filter:backdrop-blur-none"
			>
				{/* Success State */}
				{verificationStep === "success" && verifiedRepoInfo && (
					<>
						<DialogHeader className="space-y-4">
							<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
								<CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
							</div>
							<div className="space-y-2 text-center">
								<DialogTitle className="text-xl">
									Successfully Connected!
								</DialogTitle>
								<DialogDescription className="text-sm">
									Your token has been verified and you now have access to{" "}
									<code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
										{fullRepoName}
									</code>
								</DialogDescription>
							</div>
						</DialogHeader>

						<div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
							<div className="flex items-start gap-3">
								<Github className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
								<div className="space-y-1 text-sm">
									<p className="font-medium text-foreground">
										Repository Details
									</p>
									<ul className="space-y-1 text-muted-foreground">
										<li className="flex items-center gap-2">
											<span className="h-1 w-1 rounded-full bg-muted-foreground" />
											{verifiedRepoInfo.isPrivate ? "Private" : "Public"}{" "}
											repository
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1 w-1 rounded-full bg-muted-foreground" />
											Default branch: {verifiedRepoInfo.defaultBranch}
										</li>
										{verifiedRepoInfo.description && (
											<li className="flex items-center gap-2">
												<span className="h-1 w-1 rounded-full bg-muted-foreground" />
												{verifiedRepoInfo.description}
											</li>
										)}
									</ul>
								</div>
							</div>
						</div>

						<DialogFooter className="flex-col gap-2 sm:flex-col">
							<Link
								to="/$"
								params={{ _splat: `${repoOwner}/${repoName}` }}
								search={{ access_token: token }}
								className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
							>
								<ExternalLink className="h-4 w-4" />
								Open Repository
							</Link>
							<Button
								variant="outline"
								onClick={() => {
									navigator.clipboard.writeText(
										`https://${APP_DOMAIN}` + getRepoUrl(),
									);
								}}
								className="w-full"
							>
								<Copy className="mr-2 h-4 w-4" />
								Copy Link
							</Button>
						</DialogFooter>
					</>
				)}

				{/* Rate Limit Wait State - has token but exhausted quota */}
				{isRateLimitWait && (
					<>
						<DialogHeader className="space-y-4">
							<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
								<AlertTriangle className="h-7 w-7 text-[oklch(0.75_0.15_85)]" />
							</div>
							<div className="space-y-2 text-center">
								<DialogTitle className="text-xl">
									Rate Limit Exceeded
								</DialogTitle>
								<DialogDescription className="text-sm">
									You{"'"}ve exceeded the GitHub API rate limit (5,000
									requests/hour). Please wait before continuing to browse{" "}
									<code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
										{fullRepoName}
									</code>
								</DialogDescription>
							</div>
						</DialogHeader>

						<div className="rounded-lg border border-[oklch(0.75_0.15_85)]/30 bg-[oklch(0.75_0.15_85)]/10 p-4">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[oklch(0.75_0.15_85)]" />
								<div className="space-y-1 text-sm">
									<p className="font-medium text-foreground">
										Rate limits reset every hour
									</p>
									<p className="text-muted-foreground">
										Try again in a few minutes, or come back later.
									</p>
								</div>
							</div>
						</div>
					</>
				)}

				{/* Initial State - Not Found or Rate Limit Message */}
				{verificationStep !== "success" &&
					!showTokenInput &&
					!showInstructions &&
					!isRateLimitWait && (
						<>
							<DialogHeader className="space-y-4">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
									{variant === "rate-limit" ? (
										<AlertTriangle className="h-7 w-7 text-[oklch(0.75_0.15_85)]" />
									) : (
										<Lock className="h-7 w-7 text-muted-foreground" />
									)}
								</div>
								<div className="space-y-2 text-center">
									<DialogTitle className="text-xl">
										{variant === "rate-limit"
											? "Rate Limit Exceeded"
											: "Repository Not Found"}
									</DialogTitle>
									<DialogDescription className="text-sm">
										{variant === "rate-limit" ? (
											<>
												GitHub API rate limit has been exceeded. Add a token to
												get a higher rate limit and continue viewing{" "}
												<code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
													{fullRepoName}
												</code>
											</>
										) : (
											<>
												The repository{" "}
												<code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
													{fullRepoName}
												</code>{" "}
												doesn{"'"}t exist or you don{"'"}t have permission to
												access it.
											</>
										)}
									</DialogDescription>
								</div>
							</DialogHeader>

							{variant === "rate-limit" ? (
								<div className="rounded-lg border border-[oklch(0.75_0.15_85)]/30 bg-[oklch(0.75_0.15_85)]/10 p-4">
									<div className="flex items-start gap-3">
										<Github className="mt-0.5 h-5 w-5 shrink-0 text-[oklch(0.75_0.15_85)]" />
										<div className="space-y-1 text-sm">
											<p className="font-medium text-foreground">
												Why use a token?
											</p>
											<ul className="space-y-1 text-muted-foreground">
												<li className="flex items-center gap-2">
													<span className="h-1 w-1 rounded-full bg-muted-foreground" />
													Unauthenticated: 60 requests/hour
												</li>
												<li className="flex items-center gap-2">
													<span className="h-1 w-1 rounded-full bg-muted-foreground" />
													With token: 5,000 requests/hour
												</li>
												<li className="flex items-center gap-2">
													<span className="h-1 w-1 rounded-full bg-muted-foreground" />
													Access private repositories
												</li>
											</ul>
										</div>
									</div>
								</div>
							) : (
								<div className="rounded-lg border border-border bg-secondary/50 p-4">
									<div className="flex items-start gap-3">
										<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[oklch(0.75_0.15_85)]" />
										<div className="space-y-1 text-sm">
											<p className="font-medium text-foreground">
												This could mean:
											</p>
											<ul className="space-y-1 text-muted-foreground">
												<li className="flex items-center gap-2">
													<span className="h-1 w-1 rounded-full bg-muted-foreground" />
													The repository doesn{"'"}t exist
												</li>
												<li className="flex items-center gap-2">
													<span className="h-1 w-1 rounded-full bg-muted-foreground" />
													The repository is private
												</li>
												<li className="flex items-center gap-2">
													<span className="h-1 w-1 rounded-full bg-muted-foreground" />
													You don{"'"}t have access to this repository
												</li>
											</ul>
										</div>
									</div>
								</div>
							)}

							<DialogFooter className="flex-col gap-2 sm:flex-col">
								<Button
									onClick={() => setShowTokenInput(true)}
									className="w-full"
								>
									<Github className="mr-2 h-4 w-4" />
									{variant === "rate-limit"
										? "Add token for higher rate limit"
										: "I'm the owner - Authenticate with token"}
								</Button>
							</DialogFooter>
						</>
					)}

				{/* Token Input State */}
				{verificationStep !== "success" &&
					showTokenInput &&
					!showInstructions && (
						<>
							<DialogHeader className="space-y-4">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
									<Github className="h-7 w-7 text-muted-foreground" />
								</div>
								<div className="space-y-2 text-center">
									<DialogTitle className="text-xl">
										Enter GitHub Token
									</DialogTitle>
									<DialogDescription className="text-sm">
										Provide a personal access token with repository read access
										to view private repositories.
									</DialogDescription>
								</div>
							</DialogHeader>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor={tokenInputId}>Personal Access Token</Label>
									<div className="relative">
										<Input
											id={tokenInputId}
											type={showToken ? "text" : "password"}
											value={token}
											onChange={(e) => setToken(e.target.value)}
											placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
											className="pr-10 font-mono text-sm"
											disabled={isVerifying}
										/>
										<Button
											onClick={() => setShowToken(!showToken)}
											variant="outline"
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
											disabled={isVerifying}
										>
											{showToken ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
									<p className="text-xs text-muted-foreground">
										Your token is used only to access the repository and is not
										stored.
									</p>
								</div>

								{/* Error Message */}
								{error && (
									<div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
										<div className="flex items-start gap-2">
											<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
											<p className="text-sm text-red-600 dark:text-red-400">
												{error}
											</p>
										</div>
									</div>
								)}

								<Button
									type="button"
									onClick={() => setShowInstructions(true)}
									className="flex items-center gap-1 text-sm hover:underline transition-colors h-auto"
								>
									How do I create a token?
									<ChevronRight className="h-3 w-3" />
								</Button>

								<DialogFooter className="flex-col gap-2 sm:flex-row">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setShowTokenInput(false);
											setError(null);
											setVerificationStep("idle");
										}}
										className="w-full sm:w-auto"
										disabled={isVerifying}
									>
										Back
									</Button>
									<Button
										type="submit"
										disabled={!token.trim() || isVerifying}
										className="w-full sm:w-auto"
									>
										{isVerifying ? (
											<>
												<span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
												{verificationStep === "verifying-token"
													? "Verifying token..."
													: "Checking repository access..."}
											</>
										) : (
											"Connect Repository"
										)}
									</Button>
								</DialogFooter>
							</form>
						</>
					)}

				{/* Instructions State */}
				{showInstructions && (
					<>
						<DialogHeader className="space-y-2">
							<DialogTitle>Create a Personal Access Token</DialogTitle>
							<DialogDescription>
								Follow these steps to generate a fine-grained personal access
								token on GitHub.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
							{/* Step 1 */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium">
										1
									</span>
									<h4 className="font-medium text-sm">
										Go to GitHub Token Settings
									</h4>
								</div>
								<p className="text-sm text-muted-foreground ml-8">
									Navigate to your GitHub settings and create a new fine-grained
									personal access token.
								</p>
								<div className="ml-8">
									<a
										href="https://github.com/settings/personal-access-tokens/new"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
									>
										Open GitHub Settings
										<ExternalLink className="h-3.5 w-3.5" />
									</a>
								</div>
							</div>

							{/* Step 2 */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium">
										2
									</span>
									<h4 className="font-medium text-sm">
										Configure Token Details
									</h4>
								</div>
								<p className="text-sm text-muted-foreground ml-8">
									Give your token a descriptive name and set an expiration date.
									Select either{" "}
									<span className="underline font-medium text-foreground">
										all or the specific repository
									</span>{" "}
									you want to access.
								</p>
								<div className="ml-8 overflow-hidden rounded-lg border border-border">
									<img
										src="/github-token-access.png"
										alt="GitHub token configuration page showing token name and repository access options"
										width={440}
										height={280}
										className="w-full object-cover"
									/>
								</div>
								<div className="ml-8 space-y-2">
									<p className="text-xs text-muted-foreground">
										Suggested token name:
									</p>
									<div className="flex items-center gap-2">
										<code className="flex-1 rounded bg-secondary px-3 py-2 font-mono text-xs">
											private-github-link
										</code>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => copyToClipboard("private-github-link", 2)}
										>
											{copiedStep === 2 ? (
												<Check className="h-4 w-4 text-accent" />
											) : (
												<Copy className="h-4 w-4 text-muted-foreground" />
											)}
										</Button>
									</div>
								</div>
							</div>

							{/* Step 3 */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium">
										3
									</span>
									<h4 className="font-medium text-sm">
										Set Repository Permissions
									</h4>
								</div>
								<p className="text-sm text-muted-foreground ml-8">
									Under {'"'}Repository permissions{'"'}, enable{" "}
									<strong>Contents</strong> with{" "}
									<span className="text-foreground">Read-only</span> access.
									This allows viewing repository files.
								</p>
								<div className="ml-8 overflow-hidden rounded-lg border border-border">
									<img
										src="/github-token-permissions.png"
										alt="GitHub permissions settings showing Contents with Read-only access"
										width={440}
										height={280}
										className="w-full object-cover"
									/>
								</div>
							</div>

							{/* Step 4 */}
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium">
										4
									</span>
									<h4 className="font-medium text-sm">Generate & Copy Token</h4>
								</div>
								<p className="text-sm text-muted-foreground ml-8">
									Click {'"'}Generate token{'"'} at the bottom of the page. Copy
									the token immediately — you won{"'"}t be able to see it again!
								</p>
								<div className="ml-8 rounded-lg border border-[oklch(0.75_0.15_85)]/30 bg-[oklch(0.75_0.15_85)]/10 p-3">
									<p className="text-xs text-[oklch(0.75_0.15_85)]">
										<strong>Important:</strong> Store your token securely.
										GitHub will only show it once.
									</p>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setShowInstructions(false)}
								className="w-full sm:w-auto"
							>
								Back to Token Input
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
