import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { FileContent } from "@/lib/types/github";
import { PdfViewer } from "./pdf-viewer";

const createMockFile = (overrides: Partial<FileContent> = {}): FileContent => ({
	name: "document.pdf",
	path: "docs/document.pdf",
	sha: "abc123",
	size: 10240,
	content: "",
	encoding: "none",
	html_url: "https://github.com/owner/repo/blob/main/docs/document.pdf",
	download_url:
		"https://raw.githubusercontent.com/owner/repo/main/docs/document.pdf",
	...overrides,
});

describe("PdfViewer", () => {
	// Mock URL.createObjectURL and revokeObjectURL
	const mockCreateObjectURL = vi.fn(
		() => "blob:http://localhost/mock-blob-url",
	);
	const mockRevokeObjectURL = vi.fn();

	beforeAll(() => {
		global.URL.createObjectURL = mockCreateObjectURL;
		global.URL.revokeObjectURL = mockRevokeObjectURL;
	});

	afterEach(() => {
		mockCreateObjectURL.mockClear();
		mockRevokeObjectURL.mockClear();
	});

	it("should render iframe with PDF title", () => {
		const file = createMockFile({ name: "report.pdf" });

		render(<PdfViewer file={file} />);

		const iframe = screen.getByTitle("report.pdf");
		expect(iframe).toBeInTheDocument();
		expect(iframe.tagName).toBe("IFRAME");
	});

	it("should use download_url directly for non-base64 content", () => {
		const file = createMockFile({
			encoding: "none",
			download_url: "https://example.com/document.pdf",
		});

		render(<PdfViewer file={file} />);

		const iframe = screen.getByTitle("document.pdf");
		expect(iframe).toHaveAttribute("src", "https://example.com/document.pdf");
	});

	it("should create blob URL for base64 content", () => {
		// Base64 encoded "hello" -> aGVsbG8=
		const file = createMockFile({
			encoding: "base64",
			content: "aGVsbG8=",
		});

		render(<PdfViewer file={file} />);

		expect(mockCreateObjectURL).toHaveBeenCalled();
		const iframe = screen.getByTitle("document.pdf");
		expect(iframe).toHaveAttribute(
			"src",
			"blob:http://localhost/mock-blob-url",
		);
	});

	it("should cleanup blob URL on unmount", () => {
		const file = createMockFile({
			encoding: "base64",
			content: "aGVsbG8=",
		});

		const { unmount } = render(<PdfViewer file={file} />);
		unmount();

		expect(mockRevokeObjectURL).toHaveBeenCalledWith(
			"blob:http://localhost/mock-blob-url",
		);
	});

	it("should not cleanup non-blob URLs on unmount", () => {
		const file = createMockFile({
			encoding: "none",
			download_url: "https://example.com/document.pdf",
		});

		const { unmount } = render(<PdfViewer file={file} />);
		unmount();

		// Should not call revokeObjectURL for non-blob URLs
		expect(mockRevokeObjectURL).not.toHaveBeenCalled();
	});
});
