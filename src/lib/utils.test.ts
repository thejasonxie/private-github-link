import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
	it("should merge class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar");
	});

	it("should handle conditional classes", () => {
		expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
		expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
	});

	it("should merge tailwind classes correctly", () => {
		// Later class should override earlier class
		expect(cn("px-2", "px-4")).toBe("px-4");
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
	});

	it("should handle undefined and null", () => {
		expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
	});

	it("should handle empty inputs", () => {
		expect(cn()).toBe("");
		expect(cn("")).toBe("");
	});

	it("should handle arrays", () => {
		expect(cn(["foo", "bar"])).toBe("foo bar");
	});

	it("should handle objects", () => {
		expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
	});
});
