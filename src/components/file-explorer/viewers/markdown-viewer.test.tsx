import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FileContent } from "@/lib/types/github";
import { MarkdownViewer } from "./markdown-viewer";

const createMockFile = (overrides: Partial<FileContent> = {}): FileContent => ({
	name: "README.md",
	path: "README.md",
	sha: "abc123",
	size: 100,
	content: Buffer.from("# Hello World").toString("base64"),
	encoding: "base64",
	html_url: "https://github.com/owner/repo/blob/main/README.md",
	download_url: "https://raw.githubusercontent.com/owner/repo/main/README.md",
	...overrides,
});

describe("MarkdownViewer", () => {
	const defaultProps = {
		owner: "test-owner",
		repo: "test-repo",
		branch: "main",
	};

	it("should render heading from markdown", () => {
		const file = createMockFile({
			content: Buffer.from("# Hello World").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"Hello World",
		);
	});

	it("should render multiple heading levels", () => {
		const file = createMockFile({
			content: Buffer.from("# H1\n## H2\n### H3").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("H1");
		expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("H2");
		expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("H3");
	});

	it("should render paragraphs", () => {
		const file = createMockFile({
			content: Buffer.from("This is a paragraph.\n\nThis is another.").toString(
				"base64",
			),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		expect(screen.getByText("This is a paragraph.")).toBeInTheDocument();
		expect(screen.getByText("This is another.")).toBeInTheDocument();
	});

	it("should render links with rel attribute", () => {
		const file = createMockFile({
			content: Buffer.from("[Link](https://example.com)").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		const link = screen.getByRole("link", { name: "Link" });
		expect(link).toHaveAttribute("href", "https://example.com");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("should render unordered lists", () => {
		const file = createMockFile({
			content: Buffer.from("- Item 1\n- Item 2\n- Item 3").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		expect(screen.getByText("Item 1")).toBeInTheDocument();
		expect(screen.getByText("Item 2")).toBeInTheDocument();
		expect(screen.getByText("Item 3")).toBeInTheDocument();
	});

	it("should render ordered lists", () => {
		const file = createMockFile({
			content: Buffer.from("1. First\n2. Second\n3. Third").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		expect(screen.getByText("First")).toBeInTheDocument();
		expect(screen.getByText("Second")).toBeInTheDocument();
		expect(screen.getByText("Third")).toBeInTheDocument();
	});

	it("should render code blocks", () => {
		const file = createMockFile({
			content: Buffer.from("```js\nconst x = 1;\n```").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
	});

	it("should render inline code", () => {
		const file = createMockFile({
			content: Buffer.from("Use `npm install` to install.").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		const inlineCode = screen.getByText("npm install");
		expect(inlineCode.tagName).toBe("CODE");
	});

	it("should render bold text", () => {
		const file = createMockFile({
			content: Buffer.from("This is **bold** text.").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		const bold = screen.getByText("bold");
		expect(bold.tagName).toBe("STRONG");
	});

	it("should render italic text", () => {
		const file = createMockFile({
			content: Buffer.from("This is *italic* text.").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		const italic = screen.getByText("italic");
		expect(italic.tagName).toBe("EM");
	});

	it("should render images with resolved relative URLs", () => {
		const file = createMockFile({
			path: "docs/README.md",
			content: Buffer.from("![Alt text](./image.png)").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		const img = screen.getByRole("img", { name: "Alt text" });
		expect(img).toBeInTheDocument();
		// The URL should be resolved to a raw GitHub URL
		expect(img.getAttribute("src")).toContain("githubusercontent.com");
	});

	it("should render absolute image URLs as-is", () => {
		const file = createMockFile({
			content: Buffer.from("![Logo](https://example.com/logo.png)").toString(
				"base64",
			),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		const img = screen.getByRole("img", { name: "Logo" });
		expect(img).toHaveAttribute("src", "https://example.com/logo.png");
	});

	it("should render GFM tables", () => {
		const file = createMockFile({
			content: Buffer.from(
				"| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1 | Cell 2 |",
			).toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		expect(screen.getByText("Header 1")).toBeInTheDocument();
		expect(screen.getByText("Cell 1")).toBeInTheDocument();
	});

	it("should render GFM strikethrough", () => {
		const file = createMockFile({
			content: Buffer.from("~~strikethrough~~").toString("base64"),
		});

		render(<MarkdownViewer file={file} {...defaultProps} />);

		const strikethrough = screen.getByText("strikethrough");
		expect(strikethrough.tagName).toBe("DEL");
	});

	it("should have prose styling classes", () => {
		const file = createMockFile();

		const { container } = render(
			<MarkdownViewer file={file} {...defaultProps} />,
		);

		const proseDiv = container.querySelector(".prose");
		expect(proseDiv).toBeInTheDocument();
	});
});
