import { FileAudio } from "lucide-react";
import { getMimeType } from "@/lib/file-utils";
import type { FileContent } from "@/lib/types/github";

interface AudioViewerProps {
	file: FileContent;
}

export function AudioViewer({ file }: AudioViewerProps) {
	const mimeType = getMimeType(file.name);

	return (
		<div className="flex flex-col items-center justify-center p-8 min-h-[300px] gap-6">
			<FileAudio className="size-24 text-muted-foreground/50" />
			<div className="text-lg font-medium">{file.name}</div>
			<audio controls className="w-full max-w-md">
				<source src={file.download_url} type={mimeType} />
				<track kind="captions" />
				Your browser does not support the audio element.
			</audio>
		</div>
	);
}
