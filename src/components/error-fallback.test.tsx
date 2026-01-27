import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "./error-fallback";

describe("ErrorFallback", () => {
	it("should render error message", () => {
		render(<ErrorFallback />);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(
			screen.getByText(
				"An unexpected error occurred. Please refresh the page to try again.",
			),
		).toBeInTheDocument();
	});

	it("should render refresh button", () => {
		render(<ErrorFallback />);

		expect(
			screen.getByRole("button", { name: /refresh page/i }),
		).toBeInTheDocument();
	});

	it("should reload page when refresh button is clicked", () => {
		// Mock window.location.reload
		const mockReload = vi.fn();
		Object.defineProperty(window, "location", {
			value: { reload: mockReload },
			writable: true,
		});

		render(<ErrorFallback />);

		const refreshButton = screen.getByRole("button", { name: /refresh page/i });
		fireEvent.click(refreshButton);

		expect(mockReload).toHaveBeenCalledTimes(1);
	});
});
