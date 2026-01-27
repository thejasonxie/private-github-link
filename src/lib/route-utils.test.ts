import { describe, expect, it } from "vitest";
import { parseRepoPath } from "./route-utils";

describe("parseRepoPath", () => {
	it("should parse owner and repo", () => {
		const result = parseRepoPath("owner/repo");
		expect(result).not.toBeNull();
		expect(result?.owner).toBe("owner");
		expect(result?.repo).toBe("repo");
		expect(result?.viewType).toBe("tree");
		expect(result?.branch).toBe("main");
		expect(result?.path).toBe("");
	});

	it("should parse with view type", () => {
		const result = parseRepoPath("owner/repo/tree");
		expect(result?.viewType).toBe("tree");

		const blobResult = parseRepoPath("owner/repo/blob");
		expect(blobResult?.viewType).toBe("blob");

		const commitsResult = parseRepoPath("owner/repo/commits");
		expect(commitsResult?.viewType).toBe("commits");
	});

	it("should parse with branch", () => {
		const result = parseRepoPath("owner/repo/tree/develop");
		expect(result?.branch).toBe("develop");
		expect(result?.path).toBe("");
	});

	it("should parse with path", () => {
		const result = parseRepoPath("owner/repo/blob/main/src/index.ts");
		expect(result?.viewType).toBe("blob");
		expect(result?.branch).toBe("main");
		expect(result?.path).toBe("src/index.ts");
	});

	it("should parse nested paths", () => {
		const result = parseRepoPath("owner/repo/tree/main/src/components/ui");
		expect(result?.path).toBe("src/components/ui");
	});

	it("should handle leading slashes", () => {
		const result = parseRepoPath("/owner/repo/tree/main");
		expect(result?.owner).toBe("owner");
		expect(result?.repo).toBe("repo");
	});

	it("should return null for invalid paths", () => {
		expect(parseRepoPath("")).toBeNull();
		expect(parseRepoPath("owner")).toBeNull();
		expect(parseRepoPath("/")).toBeNull();
	});

	it("should return null for invalid view type", () => {
		expect(parseRepoPath("owner/repo/invalid")).toBeNull();
		expect(parseRepoPath("owner/repo/pull")).toBeNull();
	});

	it("should handle complex branch names", () => {
		const result = parseRepoPath("owner/repo/tree/feature/my-feature");
		// Note: branch name would be "feature" and path would be "my-feature"
		// This is a limitation of the current parsing logic
		expect(result?.branch).toBe("feature");
		expect(result?.path).toBe("my-feature");
	});

	it("should default to tree view type when not specified", () => {
		// When only owner/repo is provided, defaults are applied
		const result = parseRepoPath("owner/repo");
		expect(result?.viewType).toBe("tree");
	});
});
