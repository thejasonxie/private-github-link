import { describe, expect, it } from "vitest";
import { findNode } from "./tree-utils";
import type { TreeNode } from "./types/github";

describe("findNode", () => {
	const mockTree: TreeNode[] = [
		{
			name: "README.md",
			path: "README.md",
			type: "blob",
			sha: "abc123",
			size: 1024,
		},
		{
			name: "src",
			path: "src",
			type: "tree",
			sha: "def456",
			children: [
				{
					name: "index.ts",
					path: "src/index.ts",
					type: "blob",
					sha: "ghi789",
					size: 2048,
				},
				{
					name: "components",
					path: "src/components",
					type: "tree",
					sha: "jkl012",
					children: [
						{
							name: "Button.tsx",
							path: "src/components/Button.tsx",
							type: "blob",
							sha: "mno345",
							size: 512,
						},
					],
				},
			],
		},
		{
			name: "package.json",
			path: "package.json",
			type: "blob",
			sha: "pqr678",
			size: 256,
		},
	];

	it("should find a file at root level", () => {
		const result = findNode(mockTree, "README.md");
		expect(result).not.toBeNull();
		expect(result?.name).toBe("README.md");
		expect(result?.type).toBe("blob");
	});

	it("should find a directory at root level", () => {
		const result = findNode(mockTree, "src");
		expect(result).not.toBeNull();
		expect(result?.name).toBe("src");
		expect(result?.type).toBe("tree");
	});

	it("should find a file in nested directory", () => {
		const result = findNode(mockTree, "src/index.ts");
		expect(result).not.toBeNull();
		expect(result?.name).toBe("index.ts");
		expect(result?.path).toBe("src/index.ts");
	});

	it("should find a file in deeply nested directory", () => {
		const result = findNode(mockTree, "src/components/Button.tsx");
		expect(result).not.toBeNull();
		expect(result?.name).toBe("Button.tsx");
		expect(result?.path).toBe("src/components/Button.tsx");
	});

	it("should find a nested directory", () => {
		const result = findNode(mockTree, "src/components");
		expect(result).not.toBeNull();
		expect(result?.name).toBe("components");
		expect(result?.type).toBe("tree");
	});

	it("should return null for non-existent path", () => {
		const result = findNode(mockTree, "non-existent.txt");
		expect(result).toBeNull();
	});

	it("should return null for non-existent nested path", () => {
		const result = findNode(mockTree, "src/non-existent.ts");
		expect(result).toBeNull();
	});

	it("should return null for empty tree", () => {
		const result = findNode([], "README.md");
		expect(result).toBeNull();
	});

	it("should handle nodes without children", () => {
		const simpleTree: TreeNode[] = [
			{
				name: "file.txt",
				path: "file.txt",
				type: "blob",
				sha: "abc",
				size: 100,
			},
		];
		const result = findNode(simpleTree, "file.txt");
		expect(result).not.toBeNull();
		expect(result?.name).toBe("file.txt");
	});
});
