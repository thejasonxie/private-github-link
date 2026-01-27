import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDate, formatDateForGrouping, formatFileSize } from "./format";

describe("formatFileSize", () => {
	it("should format bytes", () => {
		expect(formatFileSize(0)).toBe("0 B");
		expect(formatFileSize(500)).toBe("500 B");
		expect(formatFileSize(1023)).toBe("1023 B");
	});

	it("should format kilobytes", () => {
		expect(formatFileSize(1024)).toBe("1.00 KB");
		expect(formatFileSize(1536)).toBe("1.50 KB");
		expect(formatFileSize(10240)).toBe("10.00 KB");
		expect(formatFileSize(1024 * 1024 - 1)).toBe("1024.00 KB");
	});

	it("should format megabytes", () => {
		expect(formatFileSize(1024 * 1024)).toBe("1.00 MB");
		expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.50 MB");
		expect(formatFileSize(10 * 1024 * 1024)).toBe("10.00 MB");
	});
});

describe("formatDate", () => {
	beforeEach(() => {
		// Mock current time to 2024-06-15 12:00:00 UTC
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should return 'just now' for very recent times", () => {
		expect(formatDate("2024-06-15T12:00:00Z")).toBe("just now");
		expect(formatDate("2024-06-15T11:59:30Z")).toBe("just now");
	});

	it("should format minutes ago", () => {
		expect(formatDate("2024-06-15T11:59:00Z")).toBe("1 minute ago");
		expect(formatDate("2024-06-15T11:55:00Z")).toBe("5 minutes ago");
		expect(formatDate("2024-06-15T11:01:00Z")).toBe("59 minutes ago");
	});

	it("should format hours ago", () => {
		expect(formatDate("2024-06-15T11:00:00Z")).toBe("1 hour ago");
		expect(formatDate("2024-06-15T07:00:00Z")).toBe("5 hours ago");
		expect(formatDate("2024-06-14T13:00:00Z")).toBe("23 hours ago");
	});

	it("should format days ago", () => {
		expect(formatDate("2024-06-14T12:00:00Z")).toBe("yesterday");
		expect(formatDate("2024-06-13T12:00:00Z")).toBe("2 days ago");
		expect(formatDate("2024-06-09T12:00:00Z")).toBe("6 days ago");
	});

	it("should format weeks ago", () => {
		expect(formatDate("2024-06-08T12:00:00Z")).toBe("last week");
		expect(formatDate("2024-06-01T12:00:00Z")).toBe("2 weeks ago");
		expect(formatDate("2024-05-20T12:00:00Z")).toBe("3 weeks ago");
	});

	it("should format months ago", () => {
		expect(formatDate("2024-05-15T12:00:00Z")).toBe("last month");
		expect(formatDate("2024-04-15T12:00:00Z")).toBe("2 months ago");
		expect(formatDate("2024-01-15T12:00:00Z")).toBe("5 months ago");
	});

	it("should format years ago", () => {
		expect(formatDate("2023-06-15T12:00:00Z")).toBe("last year");
		expect(formatDate("2022-06-15T12:00:00Z")).toBe("2 years ago");
		expect(formatDate("2020-06-15T12:00:00Z")).toBe("4 years ago");
	});

	it("should handle future dates gracefully", () => {
		expect(formatDate("2024-06-16T12:00:00Z")).toBe("just now");
	});
});

describe("formatDateForGrouping", () => {
	it("should format date for grouping", () => {
		// Use noon UTC to avoid timezone issues
		expect(formatDateForGrouping("2024-06-15T12:00:00Z")).toBe("Jun 15, 2024");
		expect(formatDateForGrouping("2024-01-15T12:00:00Z")).toBe("Jan 15, 2024");
		expect(formatDateForGrouping("2023-12-25T12:00:00Z")).toBe("Dec 25, 2023");
	});
});
