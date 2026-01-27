import {
	Archive,
	Download,
	File,
	FileAudio,
	FileVideo,
	Image,
} from "lucide-react";
import {
	AUDIO_EXTENSIONS,
	getFileExtension,
	IMAGE_EXTENSIONS,
	VIDEO_EXTENSIONS,
} from "@/lib/file-utils";
import { formatFileSize } from "@/lib/format";
import type { FileContent } from "@/lib/types/github";

interface BinaryFileViewerProps {
	file: FileContent;
}

export function BinaryFileViewer({ file }: BinaryFileViewerProps) {
	const ext = getFileExtension(file.name);

	const getIcon = () => {
		if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) {
			return <Archive className="size-24 text-muted-foreground/50" />;
		}
		if (VIDEO_EXTENSIONS.includes(ext)) {
			return <FileVideo className="size-24 text-muted-foreground/50" />;
		}
		if (AUDIO_EXTENSIONS.includes(ext)) {
			return <FileAudio className="size-24 text-muted-foreground/50" />;
		}
		if (IMAGE_EXTENSIONS.includes(ext)) {
			return <Image className="size-24 text-muted-foreground/50" />;
		}
		return <File className="size-24 text-muted-foreground/50" />;
	};

	return (
		<div className="flex flex-col items-center justify-center p-8 min-h-[400px] gap-4">
			{getIcon()}
			<div className="text-center">
				<div className="text-lg font-medium">{file.name}</div>
				<div className="text-sm text-muted-foreground mt-1">
					{formatFileSize(file.size)} · {ext.toUpperCase()} file
				</div>
			</div>
			<div className="text-sm text-muted-foreground">
				This file type cannot be previewed in the browser
			</div>
			<a
				href={file.download_url}
				target="_blank"
				rel="noopener noreferrer"
				className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mt-2"
			>
				<Download className="size-4" />
				Download File
			</a>
		</div>
	);
}
