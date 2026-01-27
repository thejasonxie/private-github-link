import { sentryTanstackStart } from "@sentry/tanstackstart-react";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	build: {
		rollupOptions: {
			external: ["fsevents"],
		},
		// Disable SSR sourcemaps to avoid missing .map file warnings from node_modules
		sourcemap: false,
	},
	optimizeDeps: {
		exclude: ["fsevents"],
	},
	ssr: {
		// Don't process sourcemaps for node_modules packages
		noExternal: [],
	},
	plugins: [
		devtools(),
		nitro(),
		// this is the plugin that enables path aliases
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		sentryTanstackStart({
			org: "na-dg0",
			project: "private-github-link",
			authToken: process.env.SENTRY_AUTH_TOKEN,
		}),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
	],
	nitro: {
		preset: "aws-lambda",
		awsLambda: {
			streaming: true,
		},
		scanDirs: ["server"],
	},
});

export default config;
