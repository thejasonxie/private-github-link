import { FileExplorer } from "@/components/file-explorer/file-explorer";
import { FileViewer } from "@/components/file-explorer/file-viewer";
import { RepoHeader } from "@/components/file-explorer/repo-header";

export function RepoPending() {
	return (
		<div className="flex flex-col bg-muted min-h-screen">
			<RepoHeader
				repo={{
					fullName: "Loading...",
					owner: "",
					name: "",
					isPrivate: false,
					defaultBranch: "main",
				}}
				https=""
			/>
			<div className="flex gap-2 lg:gap-4 p-2 lg:p-4">
				<div className="hidden lg:block sticky top-4 h-[calc(100vh-2rem)] shrink-0">
					<FileExplorer
						tree={[]}
						isTreeLoading={true}
						title="Files"
						className="w-80 h-full"
					/>
				</div>
				<FileViewer
					file={null}
					directory={null}
					isLoading={true}
					repoName=""
					currentPath=""
					className="flex-1 min-w-0"
				/>
			</div>
		</div>
	);
}
