import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Breadcrumb } from "./breadcrumb";

describe("Breadcrumb", () => {
	it("should render repo name", () => {
		render(<Breadcrumb repoName="test-repo" path="" />);

		expect(screen.getByText("test-repo")).toBeInTheDocument();
	});

	it("should render path segments with separators", () => {
		render(<Breadcrumb repoName="test-repo" path="src/lib/utils.ts" />);

		expect(screen.getByText("test-repo")).toBeInTheDocument();
		expect(screen.getByText("src")).toBeInTheDocument();
		expect(screen.getByText("lib")).toBeInTheDocument();
		expect(screen.getByText("utils.ts")).toBeInTheDocument();
		// Check separators
		expect(screen.getAllByText("/")).toHaveLength(3);
	});

	it("should call onNavigate with empty string when clicking repo name", () => {
		const onNavigate = vi.fn();
		render(
			<Breadcrumb
				repoName="test-repo"
				path="src/index.ts"
				onNavigate={onNavigate}
			/>,
		);

		fireEvent.click(screen.getByText("test-repo"));
		expect(onNavigate).toHaveBeenCalledWith("");
	});

	it("should call onNavigate with path when clicking intermediate segment", () => {
		const onNavigate = vi.fn();
		render(
			<Breadcrumb
				repoName="test-repo"
				path="src/lib/utils.ts"
				onNavigate={onNavigate}
			/>,
		);

		// Click on "src" segment
		fireEvent.click(screen.getByText("src"));
		expect(onNavigate).toHaveBeenCalledWith("src");

		// Click on "lib" segment
		fireEvent.click(screen.getByText("lib"));
		expect(onNavigate).toHaveBeenCalledWith("src/lib");
	});

	it("should not render last segment as a link", () => {
		render(<Breadcrumb repoName="test-repo" path="src/utils.ts" />);

		// Last segment should be a span, not a button
		const utilsText = screen.getByText("utils.ts");
		expect(utilsText.tagName).toBe("SPAN");
		expect(utilsText).toHaveClass("font-medium");
	});

	it("should show copy button when path is not empty", () => {
		render(<Breadcrumb repoName="test-repo" path="src/index.ts" />);

		expect(
			screen.getByRole("button", { name: /copy path/i }),
		).toBeInTheDocument();
	});

	it("should not show copy button when path is empty", () => {
		render(<Breadcrumb repoName="test-repo" path="" />);

		expect(
			screen.queryByRole("button", { name: /copy path/i }),
		).not.toBeInTheDocument();
	});

	it("should copy path to clipboard when copy button is clicked", async () => {
		// Mock navigator.clipboard
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			clipboard: { writeText },
		});

		render(<Breadcrumb repoName="test-repo" path="src/lib/utils.ts" />);

		const copyButton = screen.getByRole("button", { name: /copy path/i });
		fireEvent.click(copyButton);

		expect(writeText).toHaveBeenCalledWith("src/lib/utils.ts");
	});

	it("should handle path with leading slash", () => {
		render(<Breadcrumb repoName="test-repo" path="/src/index.ts" />);

		// Leading slash should be filtered out
		expect(screen.getByText("src")).toBeInTheDocument();
		expect(screen.getByText("index.ts")).toBeInTheDocument();
	});

	it("should handle single file path", () => {
		render(<Breadcrumb repoName="test-repo" path="README.md" />);

		expect(screen.getByText("test-repo")).toBeInTheDocument();
		expect(screen.getByText("README.md")).toBeInTheDocument();
		expect(screen.getAllByText("/")).toHaveLength(1);
	});
});
