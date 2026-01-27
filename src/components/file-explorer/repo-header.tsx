import { useQuery } from "@tanstack/react-query";
import { ClientOnly, Link } from "@tanstack/react-router";
import {
	BookOpen,
	Check,
	Copy,
	Download,
	ExternalLink,
	Eye,
	GitBranch,
	GitFork,
	Globe,
	Lock,
	Newspaper,
	Scale,
	Star,
} from "lucide-react";
import * as React from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CLIPBOARD_FEEDBACK_DURATION } from "@/lib/constants";
import { getUser } from "@/lib/github/api";
import type { Contributor, RepoInfo } from "@/lib/types/github";
import { cn } from "@/lib/utils";
import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";

interface RepoHeaderProps {
	repo: RepoInfo;
	https: string;
	contributors?: Contributor[];
	totalContributors?: number;
	branchCount?: number;
	accessToken?: string;
	onShowBranches?: () => void;
	className?: string;
}

// Format large numbers (e.g., 1234 -> 1.2k)
function formatCount(count: number | undefined): string {
	if (count === undefined) return "0";
	if (count >= 1000000) {
		return `${(count / 1000000).toFixed(1)}m`;
	}
	if (count >= 1000) {
		return `${(count / 1000).toFixed(1)}k`;
	}
	return count.toString();
}

export function RepoHeader({
	repo,
	https: httpsUrl,
	contributors,
	totalContributors,
	branchCount,
	accessToken,
	onShowBranches,
	className,
}: RepoHeaderProps) {
	const [copied, setCopied] = React.useState<string | null>(null);

	const { data: user } = useQuery({
		queryKey: ["getUser", repo.owner],
		queryFn: async () => await getUser(repo.owner),
	});

	const handleCopy = async (text: string, type: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(type);
		setTimeout(() => setCopied(null), CLIPBOARD_FEEDBACK_DURATION);
	};

	const handleDownloadZip = () => {
		const zipUrl = `https://github.com/${repo.fullName}/archive/refs/heads/${repo.defaultBranch}.zip`;
		window.open(zipUrl, "_blank");
	};

	return (
		<div
			className={cn(
				"flex flex-col gap-3 p-3 md:p-4 border-b bg-background shadow-lg z-30",
				className,
			)}
		>
			{/* Top row: Avatar, name, visibility, clone button */}
			<div className="flex items-center gap-3">
				{(repo.avatarUrl || user?.avatar_url) && (
					<a
						href={`https://github.com/${repo.owner}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						<img
							src={repo.avatarUrl || user?.avatar_url}
							alt={repo.owner}
							className="size-8 md:size-10 rounded-full"
						/>
					</a>
				)}
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<a
						href={`https://github.com/${repo.owner}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-500 hover:underline text-sm md:text-base truncate"
					>
						{repo.owner}
					</a>
					<span className="text-muted-foreground">/</span>
					<Link
						to="/$"
						params={{ _splat: repo.fullName }}
						search={accessToken ? { access_token: accessToken } : undefined}
						className="font-semibold text-blue-500 hover:underline text-sm md:text-base truncate"
					>
						{repo.name}
					</Link>
					<span
						className={cn(
							"px-1.5 py-0.5 text-xs rounded-full border shrink-0 border-muted-foreground/30 text-muted-foreground",
						)}
					>
						{repo.isPrivate ? (
							<span className="flex items-center gap-1">
								<Lock className="size-3" />
								<span className="hidden sm:inline">Private</span>
							</span>
						) : (
							<span className="flex items-center gap-1">
								<Globe className="size-3" />
								<span className="hidden sm:inline">Public</span>
							</span>
						)}
					</span>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 shrink-0">
					{/* Clone/Download popover */}
					<ClientOnly fallback={<div className="w-10 h-10" />}>
						<ModeToggle />
					</ClientOnly>
					<Popover>
						<PopoverTrigger
							className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border bg-primary text-primary-foreground hover:bg-primary/90"
							render={(props) => (
								<Button {...props} size="lg">
									<Download className="size-4" />
									<span className="hidden sm:inline">Code</span>
								</Button>
							)}
						/>

						<PopoverContent align="end" className="w-80 p-0">
							<div className="p-3 border-b">
								<div className="font-medium text-sm mb-2">Clone</div>
								{/* HTTPS */}
								<div className="mb-3">
									<div className="text-xs text-muted-foreground mb-1">
										HTTPS
									</div>
									<div className="flex items-center gap-2">
										<input
											type="text"
											readOnly
											value={httpsUrl}
											className="flex-1 px-2 py-1 text-xs font-mono bg-muted rounded border"
										/>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => handleCopy(httpsUrl, "https")}
										>
											{copied === "https" ? (
												<Check className="size-4 text-green-500" />
											) : (
												<Copy className="size-4" />
											)}
										</Button>
									</div>
								</div>
							</div>
							<div className="p-3">
								<Button
									variant="ghost"
									className="w-full justify-start"
									onClick={handleDownloadZip}
								>
									<Download className="size-4" />
									<span>Download ZIP</span>
								</Button>
							</div>
						</PopoverContent>
					</Popover>

					{/* View on GitHub */}
					<a
						href={`https://github.com/${repo.fullName}`}
						target="_blank"
						rel="noopener noreferrer"
						aria-label="View on GitHub"
					>
						<Button variant="outline">
							<ExternalLink className="size-4" />
						</Button>
					</a>
				</div>
			</div>

			{/* Description */}
			{repo.description && (
				<p className="text-sm text-muted-foreground hidden sm:block">
					{repo.description}
				</p>
			)}

			<div className="flex flex-row justify-between items-start">
				{/* Stats row */}
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-3 text-sm">
						{/* Readme */}
						<Link
							to="/$"
							params={{
								_splat: `${repo.fullName}/blob/${repo.defaultBranch}/README.md`,
							}}
							search={accessToken ? { access_token: accessToken } : undefined}
						>
							<Button
								variant="outline"
								className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors"
							>
								<BookOpen className="size-4" />
								<span>Readme</span>
							</Button>
						</Link>

						{/* Stars */}
						{repo.stars !== undefined && (
							<a
								href={`https://github.com/${repo.fullName}/stargazers`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
							>
								<Star className="size-4" />
								<span className="font-medium">{formatCount(repo.stars)}</span>
								<span className="hidden sm:inline">stars</span>
							</a>
						)}

						{/* Forks */}
						{repo.forks !== undefined && (
							<a
								href={`https://github.com/${repo.fullName}/forks`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
							>
								<GitFork className="size-4" />
								<span className="font-medium">{formatCount(repo.forks)}</span>
								<span className="hidden sm:inline">forks</span>
							</a>
						)}

						{/* Watchers */}
						{repo.watchers !== undefined && (
							<a
								href={`https://github.com/${repo.fullName}/watchers`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
							>
								<Eye className="size-4" />
								<span className="font-medium">
									{formatCount(repo.watchers)}
								</span>
								<span className="hidden sm:inline">watching</span>
							</a>
						)}

						{/* Branches */}
						{branchCount !== undefined && branchCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors h-auto px-1.5 py-0.5"
								onClick={onShowBranches}
							>
								<GitBranch className="size-4" />
								<span className="font-medium">{branchCount}</span>
								<span className="hidden sm:inline">
									{branchCount === 1 ? "branch" : "branches"}
								</span>
							</Button>
						)}

						{/* License */}
						{repo.license && (
							<a
								href={`https://github.com/${repo.fullName}/blob/${repo.defaultBranch}/LICENSE`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
							>
								<Scale className="size-4" />
								<span className="hidden sm:inline">{repo.license}</span>
							</a>
						)}
					</div>
					{/* Topics */}
					{repo.topics && repo.topics.length > 0 && (
						<div className="hidden md:flex flex-wrap gap-1.5">
							{repo.topics.slice(0, 5).map((topic) => (
								<a
									key={topic}
									href={`https://github.com/topics/${topic}`}
									target="_blank"
									rel="noopener noreferrer"
									className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
								>
									{topic}
								</a>
							))}
							{repo.topics.length > 5 && (
								<span className="px-2 py-0.5 text-xs text-muted-foreground">
									+{repo.topics.length - 5} more
								</span>
							)}
						</div>
					)}
				</div>

				{/* Topics and contributors row */}
				<div className="flex flex-wrap items-center gap-2">
					{/* Spacer */}
					<div className="flex-1" />

					{/* Contributors */}
					{contributors && contributors.length > 0 && (
						<div className="flex items-center gap-2">
							<div className="flex -space-x-2">
								{contributors.slice(0, 5).map((contributor) => (
									<a
										key={contributor.login}
										href={contributor.profileUrl}
										target="_blank"
										rel="noopener noreferrer"
										title={contributor.login}
									>
										<img
											src={contributor.avatarUrl}
											alt={contributor.login}
											className="size-6 rounded-full border-2 border-background hover:z-10 relative"
										/>
									</a>
								))}
							</div>
							{totalContributors && totalContributors > 5 && (
								<span className="text-xs text-muted-foreground">
									+{totalContributors - 5} contributors
								</span>
							)}
						</div>
					)}

					{/* Homepage link */}
					{repo.homepage && (
						<a
							href={repo.homepage}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
						>
							<Newspaper className="size-3" />
							<span className="hidden sm:inline">{repo.homepage}</span>
						</a>
					)}
				</div>
			</div>
		</div>
	);
}

interface MinimalRepoHeaderProps {
	owner: string;
	repo: string;
	className?: string;
}

/**
 * Minimal header for error states when repo info isn't available.
 * Shows owner/repo from URL with avatar (no API call needed).
 */
export function MinimalRepoHeader({
	owner,
	repo,
	className,
}: MinimalRepoHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-3 p-3 md:p-4 border-b bg-background shadow-lg z-30",
				className,
			)}
		>
			<div className="flex items-center gap-3">
				<a
					href={`https://github.com/${owner}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<img
						src={`https://github.com/${owner}.png?size=80`}
						alt={owner}
						className="size-8 md:size-10 rounded-full"
					/>
				</a>
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<a
						href={`https://github.com/${owner}`}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-500 hover:underline text-sm md:text-base truncate"
					>
						{owner}
					</a>
					<span className="text-muted-foreground">/</span>
					<a
						href={`https://github.com/${owner}/${repo}`}
						target="_blank"
						rel="noopener noreferrer"
						className="font-semibold text-blue-500 hover:underline text-sm md:text-base truncate"
					>
						{repo}
					</a>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<ClientOnly fallback={<div className="w-10 h-10" />}>
						<ModeToggle />
					</ClientOnly>
					<a
						href={`https://github.com/${owner}/${repo}`}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`View ${owner}/${repo} on GitHub`}
						className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border bg-primary text-primary-foreground hover:bg-primary/90"
					>
						<ExternalLink className="size-4" />
						<span className="hidden sm:inline">View on GitHub</span>
					</a>
				</div>
			</div>
		</div>
	);
}
