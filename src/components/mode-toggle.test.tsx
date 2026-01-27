import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModeToggle } from "./mode-toggle";

// Mock the useThemes hook
vi.mock("./theme-provider", () => ({
	useThemes: vi.fn(() => ({
		theme: "system",
		setTheme: vi.fn(),
		systemTheme: "light",
	})),
}));

import { useThemes } from "./theme-provider";

describe("ModeToggle", () => {
	const mockSetTheme = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useThemes).mockReturnValue({
			theme: "system",
			setTheme: mockSetTheme,
			systemTheme: "light",
		});
	});

	it("should render Theme button", () => {
		render(<ModeToggle />);

		expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument();
	});

	it("should open dropdown menu when clicked", async () => {
		render(<ModeToggle />);

		const button = screen.getByRole("button", { name: /theme/i });
		fireEvent.click(button);

		// Wait for menu to open
		expect(await screen.findByText("System")).toBeInTheDocument();
		expect(screen.getByText("Light")).toBeInTheDocument();
		expect(screen.getByText("Dark")).toBeInTheDocument();
	});

	it("should show all theme options", async () => {
		render(<ModeToggle />);

		fireEvent.click(screen.getByRole("button", { name: /theme/i }));

		expect(await screen.findByText("System")).toBeInTheDocument();
		expect(screen.getByText("Light")).toBeInTheDocument();
		expect(screen.getByText("Dark")).toBeInTheDocument();
	});

	it("should call setTheme when selecting light theme", async () => {
		render(<ModeToggle />);

		fireEvent.click(screen.getByRole("button", { name: /theme/i }));

		const lightOption = await screen.findByText("Light");
		fireEvent.click(lightOption);

		expect(mockSetTheme).toHaveBeenCalledWith("light");
	});

	it("should call setTheme when selecting dark theme", async () => {
		render(<ModeToggle />);

		fireEvent.click(screen.getByRole("button", { name: /theme/i }));

		const darkOption = await screen.findByText("Dark");
		fireEvent.click(darkOption);

		expect(mockSetTheme).toHaveBeenCalledWith("dark");
	});

	it("should call setTheme when selecting system theme", async () => {
		// Start with dark theme selected
		vi.mocked(useThemes).mockReturnValue({
			theme: "dark",
			setTheme: mockSetTheme,
			systemTheme: "dark",
		});

		render(<ModeToggle />);

		fireEvent.click(screen.getByRole("button", { name: /theme/i }));

		const systemOption = await screen.findByText("System");
		fireEvent.click(systemOption);

		expect(mockSetTheme).toHaveBeenCalledWith("system");
	});
});
