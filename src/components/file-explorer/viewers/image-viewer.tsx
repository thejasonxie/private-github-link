import { getMimeType } from "@/lib/file-utils";
import type { FileContent } from "@/lib/types/github";

interface ImageViewerProps {
	file: FileContent;
}

export function ImageViewer({ file }: ImageViewerProps) {
	const mimeType = getMimeType(file.name);
	const src =
		file.encoding === "base64"
			? `data:${mimeType};base64,${file.content}`
			: file.download_url;

	return (
		<div className="flex items-center justify-center p-8 min-h-[400px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjBmMGYwIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMGYwZjAiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
			<img
				src={src}
				alt={file.name}
				className="max-w-full max-h-[600px] object-contain shadow-lg rounded"
			/>
		</div>
	);
}
