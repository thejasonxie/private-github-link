import { getMimeType } from "@/lib/file-utils";
import type { FileContent } from "@/lib/types/github";

interface VideoViewerProps {
	file: FileContent;
}

export function VideoViewer({ file }: VideoViewerProps) {
	const mimeType = getMimeType(file.name);

	return (
		<div className="flex items-center justify-center p-8 min-h-[400px]">
			<video
				controls
				className="max-w-full max-h-[600px] rounded shadow-lg"
				src={file.download_url}
			>
				<source src={file.download_url} type={mimeType} />
				<track kind="captions" />
				Your browser does not support the video tag.
			</video>
		</div>
	);
}
