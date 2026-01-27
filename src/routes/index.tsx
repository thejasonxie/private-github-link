import {
	ClientOnly,
	createFileRoute,
	useNavigate,
} from "@tanstack/react-router";
import {
	ArrowRight,
	Check,
	Code2,
	Copy,
	ExternalLink,
	Eye,
	EyeOff,
	FolderTree,
	GitBranch,
	Github,
	Link,
	Lock,
	Server,
	Share2,
	Shield,
	Users,
	Zap,
} from "lucide-react";
import * as React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_DOMAIN, LANDING_DOMAIN } from "@/lib/constants";

export const Route = createFileRoute("/")({
	component: LandingPage,
	head: () => ({
		meta: [
			{
				title:
					"Private Github Link - Share Private Repos Without Adding Collaborators",
			},
			{
				name: "description",
				content:
					"Create shareable links to private GitHub repositories. Share code with clients, contractors, or teammates without adding them as collaborators.",
			},
		],
	}),
});

// Parse GitHub URL to extract owner and repo
function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
	const trimmed = input.trim();

	// Handle full URLs: https://github.com/owner/repo or github.com/owner/repo
	const urlPattern =
		/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s#?]+)/i;
	const urlMatch = trimmed.match(urlPattern);
	if (urlMatch) {
		return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, "") };
	}

	// Handle shorthand: owner/repo
	const shortPattern = /^([^/\s]+)\/([^/\s]+)$/;
	const shortMatch = trimmed.match(shortPattern);
	if (shortMatch) {
		return { owner: shortMatch[1], repo: shortMatch[2] };
	}

	return null;
}

const features = [
	{
		icon: Share2,
		title: "Instant Sharing",
		description:
			"Generate a shareable link in seconds. Recipients can view your code immediately.",
	},
	{
		icon: Shield,
		title: "No Collaborator Access",
		description:
			"Share code without granting write access or adding people to your repo.",
	},
	{
		icon: Users,
		title: "Perfect for Teams",
		description:
			"Share with clients, contractors, or reviewers who don't need full repo access.",
	},
	{
		icon: Code2,
		title: "Syntax Highlighting",
		description:
			"Beautiful code viewing with syntax highlighting for 100+ languages.",
	},
	{
		icon: FolderTree,
		title: "Full Navigation",
		description:
			"Browse the complete directory tree, view files, and explore the codebase.",
	},
	{
		icon: GitBranch,
		title: "Branch Access",
		description:
			"Share specific branches. Recipients can switch between available branches.",
	},
];

const steps = [
	{
		step: 1,
		title: "Enter your repo",
		description: "Paste your private GitHub repository URL",
		icon: Github,
	},
	{
		step: 2,
		title: "Add your token",
		description: "Provide a personal access token with read access",
		icon: Lock,
	},
	{
		step: 3,
		title: "Share the link",
		description: "Copy the generated link and share it with anyone",
		icon: Link,
	},
];

// Check if we're on the landing-only domain
function isOnLandingDomain(): boolean {
	if (typeof window === "undefined") return false;
	const host = window.location.hostname;
	return host === LANDING_DOMAIN || host === `www.${LANDING_DOMAIN}`;
}

// Get the app base URL (either current origin or app domain)
function getAppBaseUrl(): string {
	if (typeof window === "undefined") return "";
	if (isOnLandingDomain()) {
		return `https://${APP_DOMAIN}`;
	}
	return window.location.origin;
}

function LandingPage() {
	const navigate = useNavigate();
	const [repoUrl, setRepoUrl] = React.useState("");
	const [accessToken, setAccessToken] = React.useState("");
	const [showToken, setShowToken] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [generatedLink, setGeneratedLink] = React.useState<string | null>(null);
	const [copied, setCopied] = React.useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setGeneratedLink(null);

		const parsed = parseGitHubUrl(repoUrl);
		if (!parsed) {
			setError("Please enter a valid GitHub URL (e.g., github.com/owner/repo)");
			return;
		}

		if (!accessToken.trim()) {
			setError("Access token is required for private repositories");
			return;
		}

		// Generate the shareable link (always use app domain)
		const baseUrl = getAppBaseUrl();
		const link = `${baseUrl}/${parsed.owner}/${parsed.repo}?access_token=${encodeURIComponent(accessToken)}`;
		setGeneratedLink(link);
	};

	const handleCopyLink = async () => {
		if (generatedLink) {
			await navigator.clipboard.writeText(generatedLink);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleOpenLink = () => {
		if (generatedLink) {
			const parsed = parseGitHubUrl(repoUrl);
			if (parsed) {
				// If on landing domain, navigate to app domain
				if (isOnLandingDomain()) {
					const url = `https://${APP_DOMAIN}/${parsed.owner}/${parsed.repo}?access_token=${encodeURIComponent(accessToken)}`;
					window.location.href = url;
				} else {
					navigate({
						to: "/$",
						params: { _splat: `${parsed.owner}/${parsed.repo}` },
						search: { access_token: accessToken },
					});
				}
			}
		}
	};

	const handleBrowsePublic = (owner: string, repo: string) => {
		// If on landing domain, navigate to app domain
		if (isOnLandingDomain()) {
			window.location.href = `https://${APP_DOMAIN}/${owner}/${repo}`;
		} else {
			navigate({
				to: "/$",
				params: { _splat: `${owner}/${repo}` },
			});
		}
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
				<div className="container mx-auto px-4 h-14 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Github className="size-6" />
						<span className="font-semibold">Private Github Link</span>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="lg"
							render={(props) => (
								<a
									{...props}
									href="https://github.com/thejasonxie/private-github-link"
									target="_blank"
									rel="noopener noreferrer"
								/>
							)}
						>
							<Github className="size-3" />
							GitHub
						</Button>
						<ClientOnly>
							<ModeToggle />
						</ClientOnly>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="relative pt-14 overflow-hidden">
				{/* Gradient Background */}
				<div className="absolute inset-0 -z-10">
					<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
					<div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
					<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
				</div>

				<div className="container mx-auto px-4 py-20 md:py-28 lg:py-36">
					<div className="max-w-4xl mx-auto text-center">
						{/* Badge */}
						<div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
							<Lock className="size-4" />
							<span>Share private repos securely</span>
						</div>

						{/* Headline */}
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
							Share Private Repos{" "}
							<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
								Without Adding Collaborators
							</span>
						</h1>

						{/* Subheadline */}
						<p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
							Create shareable links to your private GitHub repositories.
							Perfect for sharing code with clients, contractors, or anyone who
							needs read-only access.
						</p>

						{/* Link Generator Form */}
						<form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-8">
							<div className="space-y-3">
								{/* Repo URL Input */}
								<div className="relative">
									<Github className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
									<Input
										type="text"
										placeholder="github.com/owner/repo"
										value={repoUrl}
										onChange={(e) => {
											setRepoUrl(e.target.value);
											setError(null);
											setGeneratedLink(null);
										}}
										className="h-12 pl-11 text-base bg-background border-border"
									/>
								</div>

								{/* Token Input */}
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
									<Input
										type={showToken ? "text" : "password"}
										placeholder="Personal access token (ghp_...)"
										value={accessToken}
										onChange={(e) => {
											setAccessToken(e.target.value);
											setError(null);
											setGeneratedLink(null);
										}}
										className="h-12 pl-11 pr-11 text-base bg-background border-border font-mono"
									/>
									<Button
										variant="outline"
										onClick={() => setShowToken(!showToken)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
									>
										{showToken ? (
											<EyeOff className="size-5" />
										) : (
											<Eye className="size-5" />
										)}
									</Button>
								</div>

								{/* Generate Button */}
								<Button
									type="submit"
									size="lg"
									className="w-full h-12 text-base font-semibold"
								>
									<Link className="size-5 mr-2" />
									Generate Shareable Link
								</Button>
							</div>

							{error && (
								<p className="mt-3 text-sm text-destructive">{error}</p>
							)}

							{/* Generated Link Result */}
							{generatedLink && (
								<div className="mt-4 p-4 rounded-lg border bg-card animate-in fade-in slide-in-from-top-2 duration-200">
									<p className="text-sm text-muted-foreground mb-2">
										Your shareable link:
									</p>
									<div className="flex gap-2">
										<Input
											type="text"
											value={generatedLink}
											readOnly
											className="flex-1 font-mono text-sm bg-muted"
										/>
										<Button
											type="button"
											variant="outline"
											onClick={handleCopyLink}
											className="shrink-0"
										>
											{copied ? (
												<Check className="size-4 text-green-500" />
											) : (
												<Copy className="size-4" />
											)}
										</Button>
									</div>
									<div className="flex gap-2 mt-3">
										<Button
											type="button"
											onClick={handleOpenLink}
											className="flex-1"
										>
											Open in Browser
											<ArrowRight className="size-4 ml-2" />
										</Button>
									</div>
									<p className="text-xs text-muted-foreground mt-3">
										Anyone with this link can view the repository. The token is
										embedded in the URL.
									</p>
								</div>
							)}

							<p className="text-xs text-muted-foreground mt-3">
								Need a token?{" "}
								<a
									href="https://github.com/settings/personal-access-tokens/new"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									Create one on GitHub
								</a>{" "}
								with "Contents" read access.
							</p>
						</form>

						{/* Open Source Callout */}
						<div className="max-w-2xl mx-auto mb-6 p-4 rounded-lg border border-border bg-muted/50">
							<div className="flex items-start gap-3">
								<div className="size-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
									<Server className="size-4 text-green-600 dark:text-green-400" />
								</div>
								<div className="text-left">
									<p className="font-semibold text-sm mb-1">
										Open Source & Self-Hostable
									</p>
									<p className="text-sm text-muted-foreground mb-2">
										Don't want to trust a third party with your token? This
										project is fully open source. Inspect the code or deploy
										your own instance.
									</p>
									<a
										href="https://github.com/thejasonxie/private-github-link"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
									>
										View on GitHub
										<ExternalLink className="size-3" />
									</a>
								</div>
							</div>
						</div>

						{/* Pro Tip - URL Shortcut */}
						<div className="max-w-2xl mx-auto mb-8 p-4 rounded-lg border border-primary/30 bg-primary/5">
							<div className="flex items-start gap-3">
								<div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
									<Zap className="size-4 text-primary" />
								</div>
								<div className="text-left">
									<p className="font-semibold text-sm mb-1">
										Pro Tip: Quick URL Shortcut
									</p>
									<p className="text-sm text-muted-foreground mb-2">
										Prepend{" "}
										<code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs">
											share-
										</code>{" "}
										to any GitHub URL to instantly open it here:
									</p>
									<div className="flex flex-col sm:flex-row gap-2 text-sm font-mono">
										<span className="text-muted-foreground line-through">
											github.com/owner/repo
										</span>
										<span className="hidden sm:inline text-muted-foreground">
											→
										</span>
										<span className="text-primary font-semibold">
											share-github.com/owner/repo
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Browse Public Repos */}
						<div className="text-sm text-muted-foreground">
							<span>Or browse public repos: </span>
							{["facebook/react", "vercel/next.js", "microsoft/typescript"].map(
								(repo, i) => {
									const [owner, name] = repo.split("/");
									return (
										<span key={repo}>
											{i > 0 && ", "}
											<Button
												variant="secondary"
												onClick={() => handleBrowsePublic(owner, name)}
												className="text-primary hover:underline"
											>
												{repo}
											</Button>
										</span>
									);
								},
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 md:py-28 bg-muted/50">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Why Use Private Github?
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							The easiest way to share private repository access without the
							hassle of managing collaborators.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
						{features.map((feature) => (
							<Card
								key={feature.title}
								className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50"
							>
								<CardHeader>
									<div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
										<feature.icon className="size-6 text-primary" />
									</div>
									<CardTitle className="text-lg">{feature.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-sm leading-relaxed">
										{feature.description}
									</CardDescription>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-20 md:py-28">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							How It Works
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Share your private repo in three simple steps.
						</p>
					</div>

					<div className="max-w-4xl mx-auto">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							{steps.map((item, index) => (
								<div key={item.step} className="relative text-center">
									{/* Connector Line */}
									{index < steps.length - 1 && (
										<div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20" />
									)}

									{/* Step Icon */}
									<div className="relative z-10 size-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30">
										<item.icon className="size-10 text-primary" />
									</div>

									<div className="inline-flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground font-bold text-sm mb-3">
										{item.step}
									</div>

									<h3 className="text-xl font-semibold mb-2">{item.title}</h3>
									<p className="text-muted-foreground text-sm">
										{item.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Use Cases Section */}
			<section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-accent/10">
				<div className="container mx-auto px-4">
					<div className="max-w-3xl mx-auto text-center">
						<h2 className="text-3xl md:text-4xl font-bold mb-8">Perfect For</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
							{[
								{
									title: "Client Reviews",
									desc: "Share code with clients for review without giving them repo access",
								},
								{
									title: "Contractor Onboarding",
									desc: "Let contractors browse the codebase before starting work",
								},
								{
									title: "Code Interviews",
									desc: "Share specific code for technical discussions",
								},
								{
									title: "Documentation",
									desc: "Link to private code from internal docs or wikis",
								},
							].map((item) => (
								<div
									key={item.title}
									className="flex items-start gap-3 p-4 rounded-lg bg-card border"
								>
									<Check className="size-5 text-primary shrink-0 mt-0.5" />
									<div>
										<h3 className="font-semibold">{item.title}</h3>
										<p className="text-sm text-muted-foreground">{item.desc}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-8">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Github className="size-5" />
							<span className="text-sm">
								Private Github Link — Share private repos securely
							</span>
						</div>
						<div className="flex items-center gap-4 text-sm">
							<a
								href="https://github.com/thejasonxie/private-github-link"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Source Code
							</a>
							<span className="text-muted-foreground">|</span>
							<a
								href="https://github.com/settings/personal-access-tokens/new"
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Create Token
							</a>
							<span className="text-muted-foreground">|</span>
							<div>
								<span className="text-sm text-muted-foreground">Made by </span>
								<a
									href="https://github.com/thejasonxie"
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									@thejasonxie
								</a>
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
