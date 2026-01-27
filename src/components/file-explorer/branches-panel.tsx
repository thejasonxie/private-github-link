import { ChevronLeft, Copy, Search, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface BranchesPanelProps {
	branches: string[];
	currentBranch: string;
	defaultBranch?: string;
	onBranchSelect: (branch: string) => void;
	onClose: () => void;
}

export function BranchesPanel({
	branches,
	currentBranch,
	defaultBranch = "main",
	onBranchSelect,
	onClose,
}: BranchesPanelProps) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const searchInputRef = React.useRef<HTMLInputElement>(null);

	// Focus search input when panel opens
	React.useEffect(() => {
		searchInputRef.current?.focus();
	}, []);

	// Filter branches based on search
	const filteredBranches = React.useMemo(() => {
		if (!searchQuery) return branches;
		return branches.filter((b) =>
			b.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [branches, searchQuery]);

	const handleCopyBranchName = (e: React.MouseEvent, branchName: string) => {
		e.stopPropagation();
		navigator.clipboard.writeText(branchName);
	};

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						aria-label="Close"
					>
						<ChevronLeft className="size-5" />
					</Button>
					<h2 className="text-lg font-semibold">Branches</h2>
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="size-4" />
				</Button>
			</div>

			{/* Search */}
			<div className="px-4 py-3 border-b shrink-0">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						ref={searchInputRef}
						type="text"
						placeholder="Search branches..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Branch list */}
			<ScrollArea className="flex-1 min-h-0">
				<div className="py-2">
					{filteredBranches.length === 0 ? (
						<div className="px-4 py-8 text-center text-muted-foreground">
							No branches found
						</div>
					) : (
						<table className="w-full">
							<thead>
								<tr className="text-left text-xs text-muted-foreground border-b">
									<th className="px-4 py-2 font-medium">Branch</th>
								</tr>
							</thead>
							<tbody>
								{filteredBranches.map((branchName) => {
									const isDefault = branchName === defaultBranch;
									const isCurrent = branchName === currentBranch;

									return (
										<tr
											key={branchName}
											className={cn(
												"border-b hover:bg-accent/30 cursor-pointer",
												isCurrent && "bg-accent/20",
											)}
											onClick={() => onBranchSelect(branchName)}
										>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2 min-w-0">
													<span
														className={cn(
															"text-sm font-mono truncate",
															isCurrent
																? "text-blue-500 font-medium"
																: "text-blue-500 hover:underline",
														)}
														title={branchName}
													>
														{branchName}
													</span>
													<Button
														variant="ghost"
														size="icon-xs"
														onClick={(e) => handleCopyBranchName(e, branchName)}
														aria-label="Copy branch name"
													>
														<Copy className="size-3.5 text-muted-foreground" />
													</Button>
													{isDefault && (
														<span className="px-2 py-0.5 text-xs bg-muted rounded border shrink-0">
															Default
														</span>
													)}
													{isCurrent && !isDefault && (
														<span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-500 rounded shrink-0">
															Current
														</span>
													)}
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
