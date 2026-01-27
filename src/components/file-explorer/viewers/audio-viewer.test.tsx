import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FileContent } from "@/lib/types/github";
import { AudioViewer } from "./audio-viewer";

const createMockFile = (overrides: Partial<FileContent> = {}): FileContent => ({
	name: "test-audio.mp3",
	path: "audio/test-audio.mp3",
	sha: "abc123",
	size: 5120,
	content: "",
	encoding: "none",
	html_url: "https://github.com/owner/repo/blob/main/audio/test-audio.mp3",
	download_url:
		"https://raw.githubusercontent.com/owner/repo/main/audio/test-audio.mp3",
	...overrides,
});

describe("AudioViewer", () => {
	it("should render audio element with controls", () => {
		const file = createMockFile();

		render(<AudioViewer file={file} />);

		const audio = document.querySelector("audio");
		expect(audio).toBeInTheDocument();
		expect(audio).toHaveAttribute("controls");
	});

	it("should display file name", () => {
		const file = createMockFile({ name: "song.mp3" });

		render(<AudioViewer file={file} />);

		expect(screen.getByText("song.mp3")).toBeInTheDocument();
	});

	it("should use download_url as audio source", () => {
		const file = createMockFile({
			download_url: "https://example.com/audio.mp3",
		});

		render(<AudioViewer file={file} />);

		const source = document.querySelector("source");
		expect(source).toHaveAttribute("src", "https://example.com/audio.mp3");
	});

	it("should include source element with correct MIME type", () => {
		const file = createMockFile({
			name: "sound.wav",
			download_url: "https://example.com/sound.wav",
		});

		render(<AudioViewer file={file} />);

		const source = document.querySelector("source");
		expect(source).toHaveAttribute("type", "audio/wav");
	});

	it("should render fallback text for unsupported browsers", () => {
		const file = createMockFile();

		render(<AudioViewer file={file} />);

		const audio = document.querySelector("audio");
		expect(audio?.textContent).toContain(
			"Your browser does not support the audio element.",
		);
	});

	it("should include captions track for accessibility", () => {
		const file = createMockFile();

		render(<AudioViewer file={file} />);

		const track = document.querySelector("track");
		expect(track).toBeInTheDocument();
		expect(track).toHaveAttribute("kind", "captions");
	});

	it("should render audio icon", () => {
		const file = createMockFile();

		render(<AudioViewer file={file} />);

		// The FileAudio icon from lucide-react should be rendered
		const svg = document.querySelector("svg");
		expect(svg).toBeInTheDocument();
	});
});
