import { File, Folder, FolderUp } from "lucide-react";
import * as React from "react";
import { formatDate } from "@/lib/format";
import type { DirectoryContent, DirectoryEntry } from "@/lib/types/github";

interface DirectoryViewerProps {
	directory: DirectoryContent;
	onNavigate?: (path: string) => void;
	onFileSelect?: (path: string) => void;
}

export function DirectoryViewer({
	directory,
	onNavigate,
	onFileSelect,
}: DirectoryViewerProps) {
	// Sort entries: folders first, then files, alphabetically within each group
	const sortedEntries = React.useMemo(() => {
		return [...directory.entries].sort((a, b) => {
			if (a.type === "tree" && b.type !== "tree") return -1;
			if (a.type !== "tree" && b.type === "tree") return 1;
			return a.name.localeCompare(b.name);
		});
	}, [directory.entries]);

	const handleEntryClick = (entry: DirectoryEntry) => {
		if (entry.type === "tree") {
			onNavigate?.(entry.path);
		} else {
			onFileSelect?.(entry.path);
		}
	};

	const handleParentClick = () => {
		if (directory.path) {
			const parentPath = directory.path.split("/").slice(0, -1).join("/");
			onNavigate?.(parentPath);
		}
	};

	return (
		<div className="w-full overflow-hidden">
			<table className="w-full table-fixed">
				<thead>
					<tr className="border-b text-left text-sm text-muted-foreground">
						<th className="px-4 py-2 font-medium w-1/3">Name</th>
						<th className="px-4 py-2 font-medium w-1/2">Last commit message</th>
						<th className="px-4 py-2 font-medium text-right w-1/6">
							Last commit date
						</th>
					</tr>
				</thead>
				<tbody>
					{/* Parent directory link */}
					{directory.path && (
						<tr
							className="border-b hover:bg-accent/30 cursor-pointer"
							onClick={handleParentClick}
						>
							<td className="px-4 py-2">
								<div className="flex items-center gap-2">
									<FolderUp
										className="size-4 text-muted-foreground"
										fill="currentColor"
									/>
									<span>..</span>
								</div>
							</td>
							<td className="px-4 py-2 text-muted-foreground" />
							<td className="px-4 py-2 text-right text-muted-foreground" />
						</tr>
					)}
					{sortedEntries.map((entry) => (
						<tr
							key={entry.path}
							className="border-b hover:bg-accent/30 cursor-pointer"
							onClick={() => handleEntryClick(entry)}
						>
							<td className="px-4 py-2">
								<div className="flex items-center gap-2 min-w-0">
									{entry.type === "tree" ? (
										<Folder
											className="size-4 text-blue-400 shrink-0"
											fill="currentColor"
										/>
									) : (
										<File className="size-4 text-muted-foreground shrink-0" />
									)}
									<span className="hover:text-blue-500 hover:underline truncate">
										{entry.name}
									</span>
								</div>
							</td>
							<td className="px-4 py-2 text-muted-foreground truncate">
								{entry.commitMessage || ""}
							</td>
							<td className="px-4 py-2 text-right text-muted-foreground text-sm whitespace-nowrap">
								{entry.commitDate ? formatDate(entry.commitDate) : ""}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
