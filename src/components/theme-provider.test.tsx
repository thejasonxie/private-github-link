import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useThemes } from "./theme-provider";

describe("useThemes", () => {
	// Mock localStorage
	const mockStorage: Record<string, string> = {};

	beforeEach(() => {
		// Clear mocks
		vi.clearAllMocks();

		// Mock localStorage
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(
			(key) => mockStorage[key] || null,
		);
		vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
			mockStorage[key] = value;
		});

		// Mock matchMedia
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query) => ({
				matches: false, // Default to light mode
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});

		// Reset classList
		document.documentElement.classList.remove("light", "dark");
	});

	afterEach(() => {
		// Clear storage mock
		for (const key of Object.keys(mockStorage)) {
			delete mockStorage[key];
		}
	});

	it("should return default theme as system", () => {
		const { result } = renderHook(() => useThemes());

		expect(result.current.theme).toBe("system");
	});

	it("should allow setting theme to light", () => {
		const { result } = renderHook(() => useThemes());

		act(() => {
			result.current.setTheme("light");
		});

		expect(result.current.theme).toBe("light");
	});

	it("should allow setting theme to dark", () => {
		const { result } = renderHook(() => useThemes());

		act(() => {
			result.current.setTheme("dark");
		});

		expect(result.current.theme).toBe("dark");
	});

	it("should add theme class to document element", () => {
		const { result } = renderHook(() => useThemes());

		act(() => {
			result.current.setTheme("dark");
		});

		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("should remove previous theme class when changing themes", () => {
		const { result } = renderHook(() => useThemes());

		act(() => {
			result.current.setTheme("dark");
		});
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		act(() => {
			result.current.setTheme("light");
		});
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		expect(document.documentElement.classList.contains("light")).toBe(true);
	});

	it("should return systemTheme based on prefers-color-scheme", () => {
		// Mock dark mode preference
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query) => ({
				matches: query === "(prefers-color-scheme: dark)",
				media: query,
				onchange: null,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});

		const { result } = renderHook(() => useThemes());

		// When theme is system and system prefers dark
		expect(result.current.systemTheme).toBe("dark");
	});
});
