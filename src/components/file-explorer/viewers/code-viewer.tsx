import hljs from "highlight.js";
import * as React from "react";
import { decodeContent, getFileExtension } from "@/lib/file-utils";
import type { FileContent } from "@/lib/types/github";
import { cn } from "@/lib/utils";

interface CodeViewerProps {
	file: FileContent;
	wrapText?: boolean;
}

/**
 * Map file extensions to highlight.js language identifiers
 */
function getLanguageFromFilename(filename: string): string | undefined {
	const ext = getFileExtension(filename);

	const languageMap: Record<string, string> = {
		// JavaScript/TypeScript
		js: "javascript",
		jsx: "javascript",
		ts: "typescript",
		tsx: "typescript",
		mjs: "javascript",
		cjs: "javascript",
		// Web
		html: "html",
		htm: "html",
		css: "css",
		scss: "scss",
		sass: "scss",
		less: "less",
		// Data formats
		json: "json",
		xml: "xml",
		yaml: "yaml",
		yml: "yaml",
		toml: "ini",
		// Programming languages
		py: "python",
		rb: "ruby",
		java: "java",
		kt: "kotlin",
		scala: "scala",
		go: "go",
		rs: "rust",
		c: "c",
		cpp: "cpp",
		h: "c",
		hpp: "cpp",
		cs: "csharp",
		php: "php",
		swift: "swift",
		m: "objectivec",
		// Shell/Scripts
		sh: "bash",
		bash: "bash",
		zsh: "bash",
		fish: "bash",
		ps1: "powershell",
		bat: "dos",
		cmd: "dos",
		// Config files
		dockerfile: "dockerfile",
		makefile: "makefile",
		cmake: "cmake",
		gradle: "gradle",
		// Markup/Docs
		md: "markdown",
		markdown: "markdown",
		tex: "latex",
		rst: "plaintext",
		// SQL
		sql: "sql",
		// Other
		graphql: "graphql",
		gql: "graphql",
		prisma: "prisma",
		vue: "html",
		svelte: "html",
	};

	return languageMap[ext];
}

export function CodeViewer({ file, wrapText = false }: CodeViewerProps) {
	const decodedContent = decodeContent(file.content, file.encoding);

	// Get the language for this file
	const language = getLanguageFromFilename(file.name);

	// Highlighted HTML for each line
	const highlightedLines = React.useMemo(() => {
		let highlighted: string;

		try {
			if (language) {
				highlighted = hljs.highlight(decodedContent, { language }).value;
			} else {
				// Auto-detect language
				highlighted = hljs.highlightAuto(decodedContent).value;
			}
		} catch {
			// Fallback to plain text if highlighting fails
			highlighted = decodedContent
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;");
		}

		// Split by newlines, preserving the HTML
		return highlighted.split("\n");
	}, [decodedContent, language]);

	return (
		<div
			className={cn("font-mono text-sm hljs", !wrapText && "overflow-x-auto")}
		>
			<table className="w-full border-collapse">
				<tbody>
					{highlightedLines.map((lineHtml, index) => {
						const lineNumber = index + 1;
						return (
							<tr
								key={`line-${lineNumber}`}
								className="hover:bg-accent/30 group"
							>
								<td className="sticky left-0 z-10 px-4 py-0 text-right text-muted-foreground select-none bg-background group-hover:bg-accent/30 w-12 align-top">
									{lineNumber}
								</td>
								<td
									className={cn(
										"px-4 py-0",
										wrapText
											? "whitespace-pre-wrap break-all"
											: "whitespace-pre",
									)}
									// biome-ignore lint/security/noDangerouslySetInnerHtml: Required for syntax highlighting
									dangerouslySetInnerHTML={{ __html: lineHtml || " " }}
								/>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
