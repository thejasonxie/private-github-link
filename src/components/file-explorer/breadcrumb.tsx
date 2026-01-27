import { Copy } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

interface BreadcrumbProps {
	repoName: string;
	path: string;
	onNavigate?: (path: string) => void;
}

export function Breadcrumb({ repoName, path, onNavigate }: BreadcrumbProps) {
	const parts = path.split("/").filter(Boolean);

	const handleCopyPath = () => {
		navigator.clipboard.writeText(path);
	};

	return (
		<div className="flex items-center gap-1 text-sm min-w-0">
			<Button
				variant="link"
				size="sm"
				className="h-auto p-0 text-blue-500 shrink-0"
				onClick={() => onNavigate?.("")}
			>
				{repoName}
			</Button>
			{parts.map((part, index) => {
				const isLast = index === parts.length - 1;
				const key = `${part}-${index}`;
				// Build the path up to this part
				const pathUpToHere = parts.slice(0, index + 1).join("/");
				return (
					<React.Fragment key={key}>
						<span className="text-muted-foreground shrink-0">/</span>
						{isLast ? (
							<span className="font-medium truncate">{part}</span>
						) : (
							<Button
								variant="link"
								size="sm"
								className="h-auto p-0 text-blue-500 shrink-0 max-w-32 truncate"
								onClick={() => onNavigate?.(pathUpToHere)}
							>
								{part}
							</Button>
						)}
					</React.Fragment>
				);
			})}
			{path && (
				<Button
					variant="ghost"
					size="icon-xs"
					className="ml-1 shrink-0"
					aria-label="Copy path"
					onClick={handleCopyPath}
				>
					<Copy className="size-3.5 text-muted-foreground" />
				</Button>
			)}
		</div>
	);
}
