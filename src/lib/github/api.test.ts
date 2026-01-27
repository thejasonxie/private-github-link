import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import {
	mockCommit,
	mockContributors,
	mockFileContent,
	mockUser,
} from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import {
	getAuthenticatedUser,
	getCommitHistory,
	getContributors,
	getFileContent,
	getTotalCommitCount,
	getUser,
	RateLimitError,
} from "./api";

/**
 * NOTE: Some API functions (getRepoInfo, getBranches, getRepoTree) use AbortSignal.timeout()
 * which is incompatible with MSW in jsdom/Node.js test environment due to how undici validates
 * the AbortSignal instance. These functions are tested via integration tests instead.
 *
 * Functions tested here: getContributors, getFileContent, getCommitHistory, getTotalCommitCount,
 * getUser, getAuthenticatedUser - which don't use AbortSignal.timeout()
 */

describe("RateLimitError", () => {
	it("should be an instance of Error", () => {
		const error = new RateLimitError("Rate limit exceeded");
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(RateLimitError);
	});

	it("should have the correct name", () => {
		const error = new RateLimitError("Rate limit exceeded");
		expect(error.name).toBe("RateLimitError");
	});

	it("should have the correct message", () => {
		const error = new RateLimitError("Custom rate limit message");
		expect(error.message).toBe("Custom rate limit message");
	});
});

// NOTE: getRepoInfo and getBranches tests are skipped because they use AbortSignal.timeout()
// which is incompatible with MSW in jsdom. See comment at top of file.

describe("getContributors", () => {
	it("should return contributors on success", async () => {
		const result = await getContributors(
			"test-owner",
			"test-repo",
			"test-token",
		);

		expect(result.contributors).toHaveLength(2);
		expect(result.contributors[0]).toEqual({
			login: "contributor1",
			avatarUrl: "https://github.com/contributor1.png",
			profileUrl: "https://github.com/contributor1",
			contributions: 100,
		});
	});

	it("should return empty contributors on error", async () => {
		server.use(
			http.get("https://api.github.com/repos/:owner/:repo/contributors", () => {
				return HttpResponse.json({ message: "Server Error" }, { status: 500 });
			}),
		);

		const result = await getContributors(
			"test-owner",
			"test-repo",
			"test-token",
		);

		expect(result.contributors).toEqual([]);
		expect(result.totalCount).toBe(0);
	});

	it("should parse total count from Link header", async () => {
		server.use(
			http.get(
				"https://api.github.com/repos/:owner/:repo/contributors",
				({ request }) => {
					const url = new URL(request.url);
					const perPage = url.searchParams.get("per_page");

					// First request with per_page=1 to get count
					if (perPage === "1") {
						return HttpResponse.json([mockContributors[0]], {
							headers: {
								Link: '<https://api.github.com/repos/test-owner/test-repo/contributors?per_page=1&page=2>; rel="next", <https://api.github.com/repos/test-owner/test-repo/contributors?per_page=1&page=42>; rel="last"',
							},
						});
					}

					// Second request with per_page=10 to get actual contributors
					return HttpResponse.json(mockContributors);
				},
			),
		);

		const result = await getContributors(
			"test-owner",
			"test-repo",
			"test-token",
		);

		expect(result.totalCount).toBe(42);
		expect(result.contributors).toHaveLength(2);
	});

	it("should handle contributors with missing fields", async () => {
		server.use(
			http.get("https://api.github.com/repos/:owner/:repo/contributors", () => {
				return HttpResponse.json([
					{
						login: null,
						avatar_url: null,
						html_url: null,
						contributions: null,
					},
				]);
			}),
		);

		const result = await getContributors(
			"test-owner",
			"test-repo",
			"test-token",
		);

		expect(result.contributors[0]).toEqual({
			login: "unknown",
			avatarUrl: "",
			profileUrl: "",
			contributions: 0,
		});
	});
});

// NOTE: getRepoTree tests are skipped because it uses AbortSignal.timeout()
// which is incompatible with MSW in jsdom. See comment at top of file.

describe("getFileContent", () => {
	it("should return file content on success", async () => {
		const result = await getFileContent(
			"test-owner",
			"test-repo",
			"README.md",
			"main",
			1024,
			"test-token",
		);

		expect(result.content.name).toBe("README.md");
		expect(result.content.path).toBe("README.md");
		expect(result.content.encoding).toBe("base64");
		expect(result.commit.sha).toBe(mockCommit.sha);
	});

	it("should throw error for file too large", async () => {
		const hugeSize = 200 * 1024 * 1024; // 200MB

		await expect(
			getFileContent(
				"test-owner",
				"test-repo",
				"huge-file.bin",
				"main",
				hugeSize,
				"test-token",
			),
		).rejects.toThrow(/too large/);
	});

	it("should use raw format for large files (>1MB)", async () => {
		const largeSize = 2 * 1024 * 1024; // 2MB

		server.use(
			http.get(
				"https://api.github.com/repos/:owner/:repo/contents/:path*",
				({ request }) => {
					const accept = request.headers.get("Accept");

					if (accept?.includes("raw")) {
						// Return raw content for large files
						return HttpResponse.text("Raw file content here");
					}

					return HttpResponse.json(mockFileContent);
				},
			),
		);

		const result = await getFileContent(
			"test-owner",
			"test-repo",
			"large-file.txt",
			"main",
			largeSize,
			"test-token",
		);

		expect(result.content.encoding).toBe("none");
		expect(result.content.content).toBe("Raw file content here");
	});

	it("should throw error for file not found", async () => {
		server.use(
			http.get(
				"https://api.github.com/repos/:owner/:repo/contents/:path*",
				() => {
					return HttpResponse.json({ message: "Not Found" }, { status: 404 });
				},
			),
		);

		await expect(
			getFileContent(
				"test-owner",
				"test-repo",
				"nonexistent.txt",
				"main",
				100,
				"test-token",
			),
		).rejects.toThrow("File not found");
	});

	it("should throw error if path is a directory", async () => {
		server.use(
			http.get(
				"https://api.github.com/repos/:owner/:repo/contents/:path*",
				() => {
					return HttpResponse.json({
						...mockFileContent,
						type: "dir",
					});
				},
			),
		);

		await expect(
			getFileContent(
				"test-owner",
				"test-repo",
				"src",
				"main",
				undefined,
				"test-token",
			),
		).rejects.toThrow("Selected item is not a file");
	});

	it("should handle too_large error from GitHub", async () => {
		server.use(
			http.get(
				"https://api.github.com/repos/:owner/:repo/contents/:path*",
				() => {
					return HttpResponse.json(
						{
							message:
								"This API returns blobs up to 1 MB in size. The requested blob is too_large to fetch via the API.",
						},
						{ status: 403 },
					);
				},
			),
		);

		await expect(
			getFileContent(
				"test-owner",
				"test-repo",
				"large.bin",
				"main",
				500000, // Under our limit but GitHub says too_large
				"test-token",
			),
		).rejects.toThrow(/too large/);
	});
});

describe("getCommitHistory", () => {
	it("should return commit history on success", async () => {
		const result = await getCommitHistory(
			"test-owner",
			"test-repo",
			"",
			"main",
			1,
			10,
			"test-token",
		);

		expect(result.commits).toHaveLength(1);
		expect(result.commits[0].sha).toBe(mockCommit.sha);
		expect(result.commits[0].message).toBe(mockCommit.commit.message);
		expect(result.commits[0].author).toBe(mockCommit.commit.author.name);
		expect(result.page).toBe(1);
	});

	it("should indicate hasMore when page is full", async () => {
		const commits = Array(10)
			.fill(null)
			.map((_, i) => ({
				...mockCommit,
				sha: `sha${i}`,
			}));

		server.use(
			http.get("https://api.github.com/repos/:owner/:repo/commits", () => {
				return HttpResponse.json(commits);
			}),
		);

		const result = await getCommitHistory(
			"test-owner",
			"test-repo",
			"",
			"main",
			1,
			10,
			"test-token",
		);

		expect(result.commits).toHaveLength(10);
		expect(result.hasMore).toBe(true);
	});

	it("should indicate no more when page is not full", async () => {
		const commits = Array(5)
			.fill(null)
			.map((_, i) => ({
				...mockCommit,
				sha: `sha${i}`,
			}));

		server.use(
			http.get("https://api.github.com/repos/:owner/:repo/commits", () => {
				return HttpResponse.json(commits);
			}),
		);

		const result = await getCommitHistory(
			"test-owner",
			"test-repo",
			"",
			"main",
			1,
			10,
			"test-token",
		);

		expect(result.commits).toHaveLength(5);
		expect(result.hasMore).toBe(false);
	});

	it("should filter by path", async () => {
		server.use(
			http.get(
				"https://api.github.com/repos/:owner/:repo/commits",
				({ request }) => {
					const url = new URL(request.url);
					const path = url.searchParams.get("path");

					if (path === "src/index.ts") {
						return HttpResponse.json([
							{ ...mockCommit, sha: "path-specific-commit" },
						]);
					}

					return HttpResponse.json([mockCommit]);
				},
			),
		);

		const result = await getCommitHistory(
			"test-owner",
			"test-repo",
			"src/index.ts",
			"main",
			1,
			10,
			"test-token",
		);

		expect(result.commits[0].sha).toBe("path-specific-commit");
	});

	it("should handle commits with missing author info", async () => {
		server.use(
			http.get("https://api.github.com/repos/:owner/:repo/commits", () => {
				return HttpResponse.json([
					{
						sha: "abc123",
						commit: {
							message: "Test commit",
							author: null,
							committer: null,
						},
						author: null,
					},
				]);
			}),
		);

		const result = await getCommitHistory(
			"test-owner",
			"test-repo",
			"",
			"main",
			1,
			10,
			"test-token",
		);

		expect(result.commits[0].author).toBe("Unknown");
		expect(result.commits[0].authorAvatarUrl).toBeUndefined();
	});
});

describe("getTotalCommitCount", () => {
	it("should return count from Link header", async () => {
		server.use(
			http.get("https://api.github.com/repos/:owner/:repo/commits", () => {
				return HttpResponse.json([mockCommit], {
					headers: {
						Link: '<https://api.github.com/repos/test-owner/test-repo/commits?per_page=1&page=2>; rel="next", <https://api.github.com/repos/test-owner/test-repo/commits?per_page=1&page=1234>; rel="last"',
					},
				});
			}),
		);

		const result = await getTotalCommitCount(
			"test-owner",
			"test-repo",
			"main",
			"test-token",
		);

		expect(result).toBe(1234);
	});

	it("should return data length when no Link header", async () => {
		server.use(
			http.get("https://api.github.com/repos/:owner/:repo/commits", () => {
				return HttpResponse.json([mockCommit]);
			}),
		);

		const result = await getTotalCommitCount(
			"test-owner",
			"test-repo",
			"main",
			"test-token",
		);

		expect(result).toBe(1);
	});

	it("should return 0 on error", async () => {
		server.use(
			http.get("https://api.github.com/repos/:owner/:repo/commits", () => {
				return HttpResponse.json({ message: "Server Error" }, { status: 500 });
			}),
		);

		const result = await getTotalCommitCount(
			"test-owner",
			"test-repo",
			"main",
			"test-token",
		);

		expect(result).toBe(0);
	});
});

describe("getUser", () => {
	it("should return user info on success", async () => {
		const result = await getUser("test-user");

		expect(result.login).toBe("test-user");
		expect(result.id).toBe(mockUser.id);
		expect(result.avatar_url).toBe(mockUser.avatar_url);
	});

	it("should throw error for user not found", async () => {
		server.use(
			http.get("https://api.github.com/users/:username", () => {
				return HttpResponse.json({ message: "Not Found" }, { status: 404 });
			}),
		);

		await expect(getUser("nonexistent-user")).rejects.toThrow();
	});
});

describe("getAuthenticatedUser", () => {
	it("should return authenticated user info on success", async () => {
		const result = await getAuthenticatedUser("valid-token");

		expect(result.login).toBe(mockUser.login);
		expect(result.id).toBe(mockUser.id);
		expect(result.name).toBe(mockUser.name);
	});

	it("should throw error for invalid token", async () => {
		server.use(
			http.get("https://api.github.com/user", () => {
				return HttpResponse.json(
					{ message: "Bad credentials" },
					{ status: 401 },
				);
			}),
		);

		await expect(getAuthenticatedUser("invalid-token")).rejects.toThrow();
	});

	it("should throw error for expired token", async () => {
		server.use(
			http.get("https://api.github.com/user", () => {
				return HttpResponse.json(
					{ message: "Bad credentials" },
					{ status: 401 },
				);
			}),
		);

		await expect(getAuthenticatedUser("expired-token")).rejects.toThrow();
	});
});
