import { fileURLToPath, URL } from "url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			exclude: [
				"node_modules/",
				"src/test/",
				"**/*.d.ts",
				"src/routeTree.gen.ts",
				"src/components/ui/", // shadcn components - external library
				"**/*.config.{ts,js}",
				".sst/",
				".output/",
			],
			// Thresholds temporarily disabled - will be incrementally increased as coverage improves
			// thresholds: {
			// 	lines: 80,
			// 	functions: 80,
			// 	branches: 80,
			// 	statements: 80,
			// },
		},
	},
});
