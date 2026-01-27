import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FileContent } from "@/lib/types/github";
import { ImageViewer } from "./image-viewer";

const createMockFile = (overrides: Partial<FileContent> = {}): FileContent => ({
	name: "test-image.png",
	path: "images/test-image.png",
	sha: "abc123",
	size: 1024,
	content: "base64encodedcontent",
	encoding: "base64",
	html_url: "https://github.com/owner/repo/blob/main/images/test-image.png",
	download_url:
		"https://raw.githubusercontent.com/owner/repo/main/images/test-image.png",
	...overrides,
});

describe("ImageViewer", () => {
	it("should render image with base64 data URI for base64 encoded content", () => {
		const file = createMockFile({
			name: "photo.jpg",
			content: "aGVsbG8gd29ybGQ=",
			encoding: "base64",
		});

		render(<ImageViewer file={file} />);

		const img = screen.getByRole("img", { name: "photo.jpg" });
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute(
			"src",
			"data:image/jpeg;base64,aGVsbG8gd29ybGQ=",
		);
	});

	it("should render image with download_url for non-base64 content", () => {
		const file = createMockFile({
			name: "photo.png",
			encoding: "none",
			download_url: "https://example.com/image.png",
		});

		render(<ImageViewer file={file} />);

		const img = screen.getByRole("img", { name: "photo.png" });
		expect(img).toHaveAttribute("src", "https://example.com/image.png");
	});

	it("should have correct alt text from file name", () => {
		const file = createMockFile({ name: "my-screenshot.gif" });

		render(<ImageViewer file={file} />);

		expect(screen.getByAltText("my-screenshot.gif")).toBeInTheDocument();
	});

	it("should use correct MIME type for different image formats", () => {
		const svgFile = createMockFile({
			name: "icon.svg",
			content: "svgcontent",
			encoding: "base64",
		});

		render(<ImageViewer file={svgFile} />);

		const img = screen.getByRole("img");
		expect(img).toHaveAttribute(
			"src",
			expect.stringContaining("image/svg+xml"),
		);
	});
});
