import { describe, expect, it } from "vitest";
import {
	countLines,
	decodeContent,
	getFileExtension,
	getFileType,
	getMimeType,
	resolveRelativeUrl,
} from "./file-utils";

describe("getFileExtension", () => {
	it("should return the file extension", () => {
		expect(getFileExtension("file.txt")).toBe("txt");
		expect(getFileExtension("file.test.ts")).toBe("ts");
		expect(getFileExtension("README.md")).toBe("md");
	});

	it("should return lowercase extension", () => {
		expect(getFileExtension("FILE.TXT")).toBe("txt");
		expect(getFileExtension("Image.PNG")).toBe("png");
	});

	it("should return empty string for files without extension", () => {
		expect(getFileExtension("Makefile")).toBe("");
		expect(getFileExtension("Dockerfile")).toBe("");
		expect(getFileExtension(".gitignore")).toBe("gitignore");
	});
});

describe("getFileType", () => {
	it("should detect markdown files", () => {
		expect(getFileType("README.md")).toBe("markdown");
		expect(getFileType("docs.markdown")).toBe("markdown");
		expect(getFileType("page.mdx")).toBe("markdown");
	});

	it("should detect image files", () => {
		expect(getFileType("photo.png")).toBe("image");
		expect(getFileType("image.jpg")).toBe("image");
		expect(getFileType("icon.svg")).toBe("image");
		expect(getFileType("animation.gif")).toBe("image");
		expect(getFileType("photo.webp")).toBe("image");
	});

	it("should detect video files", () => {
		expect(getFileType("video.mp4")).toBe("video");
		expect(getFileType("clip.webm")).toBe("video");
		expect(getFileType("movie.mov")).toBe("video");
	});

	it("should detect audio files", () => {
		expect(getFileType("song.mp3")).toBe("audio");
		expect(getFileType("sound.wav")).toBe("audio");
		expect(getFileType("music.flac")).toBe("audio");
	});

	it("should detect PDF files", () => {
		expect(getFileType("document.pdf")).toBe("pdf");
	});

	it("should detect binary files", () => {
		expect(getFileType("archive.zip")).toBe("binary");
		expect(getFileType("package.tar")).toBe("binary");
		expect(getFileType("font.woff2")).toBe("binary");
		expect(getFileType("app.exe")).toBe("binary");
	});

	it("should default to text for unknown extensions", () => {
		expect(getFileType("script.js")).toBe("text");
		expect(getFileType("style.css")).toBe("text");
		expect(getFileType("data.json")).toBe("text");
		expect(getFileType("Makefile")).toBe("text");
	});
});

describe("getMimeType", () => {
	it("should return correct MIME types for images", () => {
		expect(getMimeType("image.png")).toBe("image/png");
		expect(getMimeType("photo.jpg")).toBe("image/jpeg");
		expect(getMimeType("photo.jpeg")).toBe("image/jpeg");
		expect(getMimeType("icon.svg")).toBe("image/svg+xml");
		expect(getMimeType("image.webp")).toBe("image/webp");
	});

	it("should return correct MIME types for videos", () => {
		expect(getMimeType("video.mp4")).toBe("video/mp4");
		expect(getMimeType("clip.webm")).toBe("video/webm");
		expect(getMimeType("movie.mov")).toBe("video/quicktime");
	});

	it("should return correct MIME types for audio", () => {
		expect(getMimeType("song.mp3")).toBe("audio/mpeg");
		expect(getMimeType("sound.wav")).toBe("audio/wav");
		expect(getMimeType("music.flac")).toBe("audio/flac");
	});

	it("should return correct MIME type for PDF", () => {
		expect(getMimeType("document.pdf")).toBe("application/pdf");
	});

	it("should return octet-stream for unknown types", () => {
		expect(getMimeType("file.xyz")).toBe("application/octet-stream");
		expect(getMimeType("script.js")).toBe("application/octet-stream");
	});
});

describe("decodeContent", () => {
	it("should decode base64 content", () => {
		const encoded = btoa("Hello, World!");
		expect(decodeContent(encoded, "base64")).toBe("Hello, World!");
	});

	it("should return content as-is for non-base64 encoding", () => {
		expect(decodeContent("plain text", "utf-8")).toBe("plain text");
		expect(decodeContent("some content", "")).toBe("some content");
	});

	it("should handle invalid base64 gracefully", () => {
		// Invalid base64 should return the original content
		expect(decodeContent("not valid base64!!!", "base64")).toBe(
			"not valid base64!!!",
		);
	});
});

describe("countLines", () => {
	it("should count lines correctly", () => {
		expect(countLines("line1")).toBe(1);
		expect(countLines("line1\nline2")).toBe(2);
		expect(countLines("line1\nline2\nline3")).toBe(3);
	});

	it("should handle empty string", () => {
		expect(countLines("")).toBe(1);
	});

	it("should handle trailing newline", () => {
		expect(countLines("line1\n")).toBe(2);
		expect(countLines("line1\nline2\n")).toBe(3);
	});
});

describe("resolveRelativeUrl", () => {
	const owner = "test-owner";
	const repo = "test-repo";
	const branch = "main";

	it("should return absolute URLs unchanged", () => {
		expect(
			resolveRelativeUrl(
				"https://example.com/image.png",
				"README.md",
				owner,
				repo,
				branch,
			),
		).toBe("https://example.com/image.png");

		expect(
			resolveRelativeUrl(
				"http://example.com/image.png",
				"README.md",
				owner,
				repo,
				branch,
			),
		).toBe("http://example.com/image.png");
	});

	it("should return data URLs unchanged", () => {
		const dataUrl = "data:image/png;base64,abc123";
		expect(resolveRelativeUrl(dataUrl, "README.md", owner, repo, branch)).toBe(
			dataUrl,
		);
	});

	it("should resolve relative paths with ./", () => {
		expect(
			resolveRelativeUrl("./image.png", "docs/README.md", owner, repo, branch),
		).toBe(
			"https://raw.githubusercontent.com/test-owner/test-repo/main/docs/image.png",
		);
	});

	it("should resolve relative paths without prefix", () => {
		expect(
			resolveRelativeUrl("image.png", "docs/README.md", owner, repo, branch),
		).toBe(
			"https://raw.githubusercontent.com/test-owner/test-repo/main/docs/image.png",
		);
	});

	it("should resolve absolute paths from repo root", () => {
		expect(
			resolveRelativeUrl(
				"/assets/image.png",
				"docs/README.md",
				owner,
				repo,
				branch,
			),
		).toBe(
			"https://raw.githubusercontent.com/test-owner/test-repo/main/assets/image.png",
		);
	});

	it("should resolve parent directory paths", () => {
		expect(
			resolveRelativeUrl(
				"../image.png",
				"docs/guide/README.md",
				owner,
				repo,
				branch,
			),
		).toBe(
			"https://raw.githubusercontent.com/test-owner/test-repo/main/docs/image.png",
		);

		expect(
			resolveRelativeUrl(
				"../../image.png",
				"docs/guide/deep/README.md",
				owner,
				repo,
				branch,
			),
		).toBe(
			"https://raw.githubusercontent.com/test-owner/test-repo/main/docs/image.png",
		);
	});

	it("should handle files at root level", () => {
		expect(
			resolveRelativeUrl("image.png", "README.md", owner, repo, branch),
		).toBe(
			"https://raw.githubusercontent.com/test-owner/test-repo/main/image.png",
		);

		expect(
			resolveRelativeUrl("./image.png", "README.md", owner, repo, branch),
		).toBe(
			"https://raw.githubusercontent.com/test-owner/test-repo/main/image.png",
		);
	});
});
