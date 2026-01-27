import * as React from "react";
import type { FileContent } from "@/lib/types/github";

interface PdfViewerProps {
	file: FileContent;
}

export function PdfViewer({ file }: PdfViewerProps) {
	// For base64 content, create a blob URL
	const pdfUrl = React.useMemo(() => {
		if (file.encoding === "base64") {
			const binaryString = atob(file.content);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			const blob = new Blob([bytes], { type: "application/pdf" });
			return URL.createObjectURL(blob);
		}
		return file.download_url;
	}, [file.content, file.encoding, file.download_url]);

	// Cleanup blob URL on unmount
	React.useEffect(() => {
		return () => {
			if (file.encoding === "base64" && pdfUrl.startsWith("blob:")) {
				URL.revokeObjectURL(pdfUrl);
			}
		};
	}, [pdfUrl, file.encoding]);

	return (
		<div className="flex flex-col h-full min-h-0">
			<iframe
				src={pdfUrl}
				title={file.name}
				className="w-full flex-1 border-0"
			/>
		</div>
	);
}
