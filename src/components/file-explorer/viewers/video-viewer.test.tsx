import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FileContent } from "@/lib/types/github";
import { VideoViewer } from "./video-viewer";

const createMockFile = (overrides: Partial<FileContent> = {}): FileContent => ({
	name: "test-video.mp4",
	path: "videos/test-video.mp4",
	sha: "abc123",
	size: 10240,
	content: "",
	encoding: "none",
	html_url: "https://github.com/owner/repo/blob/main/videos/test-video.mp4",
	download_url:
		"https://raw.githubusercontent.com/owner/repo/main/videos/test-video.mp4",
	...overrides,
});

describe("VideoViewer", () => {
	it("should render video element with controls", () => {
		const file = createMockFile();

		render(<VideoViewer file={file} />);

		const video = document.querySelector("video");
		expect(video).toBeInTheDocument();
		expect(video).toHaveAttribute("controls");
	});

	it("should use download_url as video source", () => {
		const file = createMockFile({
			download_url: "https://example.com/video.mp4",
		});

		render(<VideoViewer file={file} />);

		const video = document.querySelector("video");
		expect(video).toHaveAttribute("src", "https://example.com/video.mp4");
	});

	it("should include source element with correct MIME type", () => {
		const file = createMockFile({
			name: "movie.webm",
			download_url: "https://example.com/movie.webm",
		});

		render(<VideoViewer file={file} />);

		const source = document.querySelector("source");
		expect(source).toBeInTheDocument();
		expect(source).toHaveAttribute("type", "video/webm");
	});

	it("should render fallback text for unsupported browsers", () => {
		const file = createMockFile();

		render(<VideoViewer file={file} />);

		// The text content should be inside the video element
		const video = document.querySelector("video");
		expect(video?.textContent).toContain(
			"Your browser does not support the video tag.",
		);
	});

	it("should include captions track for accessibility", () => {
		const file = createMockFile();

		render(<VideoViewer file={file} />);

		const track = document.querySelector("track");
		expect(track).toBeInTheDocument();
		expect(track).toHaveAttribute("kind", "captions");
	});
});
