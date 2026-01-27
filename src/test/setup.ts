import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

// Suppress console.error in tests to reduce noise from expected errors
// Comment this out if you need to debug test failures
vi.spyOn(console, "error").mockImplementation(() => {});

// Polyfill AbortSignal.timeout for jsdom compatibility with MSW
// The built-in AbortSignal.timeout creates signals that MSW can't intercept properly in jsdom
// We always override it in the test environment to ensure compatibility
const createTimeoutSignal = (ms: number): AbortSignal => {
	const controller = new AbortController();
	setTimeout(
		() => controller.abort(new DOMException("TimeoutError", "TimeoutError")),
		ms,
	);
	return controller.signal;
};
AbortSignal.timeout = createTimeoutSignal;

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test (removes any runtime handlers added during tests)
afterEach(() => {
	cleanup();
	server.resetHandlers();
});

// Clean up after all tests
afterAll(() => server.close());
