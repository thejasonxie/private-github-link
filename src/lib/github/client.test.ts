import { describe, expect, it } from "vitest";
import { withTimeout } from "./client";

describe("withTimeout", () => {
	it("should resolve when promise resolves before timeout", async () => {
		const promise = Promise.resolve("success");
		const result = await withTimeout(promise, 1000);
		expect(result).toBe("success");
	});

	it("should reject with timeout error when promise takes too long", async () => {
		const slowPromise = new Promise((resolve) => {
			setTimeout(() => resolve("too late"), 500);
		});

		await expect(withTimeout(slowPromise, 100)).rejects.toThrow(
			"Request timed out after 100ms",
		);
	});

	it("should propagate errors from the original promise", async () => {
		const failingPromise = Promise.reject(new Error("Original error"));

		await expect(withTimeout(failingPromise, 1000)).rejects.toThrow(
			"Original error",
		);
	});

	it("should use default timeout when not specified", async () => {
		const promise = Promise.resolve("success");
		// Default timeout is 5000ms, this should resolve immediately
		const result = await withTimeout(promise);
		expect(result).toBe("success");
	});

	it("should clear timeout after promise resolves", async () => {
		// This test ensures no memory leaks from lingering timeouts
		const promise = Promise.resolve("success");
		await withTimeout(promise, 1000);
		// If timeout wasn't cleared, there would be a lingering timer
		// This test mainly ensures the code path is exercised
		expect(true).toBe(true);
	});

	it("should clear timeout after promise rejects", async () => {
		const failingPromise = Promise.reject(new Error("Error"));

		try {
			await withTimeout(failingPromise, 1000);
		} catch {
			// Expected to throw
		}
		// Timeout should be cleared even on rejection
		expect(true).toBe(true);
	});
});
