import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { decodeContent, resolveRelativeUrl } from "@/lib/file-utils";
import type { FileContent } from "@/lib/types/github";

interface MarkdownViewerProps {
	file: FileContent;
	owner: string;
	repo: string;
	branch: string;
}

export function MarkdownViewer({
	file,
	owner,
	repo,
	branch,
}: MarkdownViewerProps) {
	const decodedContent = decodeContent(file.content, file.encoding);

	return (
		<div className="prose prose-sm dark:prose-invert max-w-none px-6 py-4">
			<Markdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[
					[rehypeRaw],
					[
						rehypeSanitize,
						{
							...defaultSchema,
							attributes: {
								...defaultSchema.attributes,
								a: [
									...(defaultSchema.attributes?.a || []),
									"href",
									"title",
									"target",
									"rel",
								],
								img: [
									...(defaultSchema.attributes?.img || []),
									"src",
									"alt",
									"title",
									"width",
									"height",
								],
								code: [...(defaultSchema.attributes?.code || []), "className"],
								span: [...(defaultSchema.attributes?.span || []), "className"],
								div: [...(defaultSchema.attributes?.div || []), "className"],
							},
							tagNames: [
								...(defaultSchema.tagNames || []),
								"img",
								"details",
								"summary",
							],
						},
					],
				]}
				components={{
					a({ node, ...props }) {
						return <a {...props} rel="noopener noreferrer" />;
					},
					img({ node, src, alt, ...props }) {
						const resolvedSrc = src
							? resolveRelativeUrl(src, file.path, owner, repo, branch)
							: "";
						return <img src={resolvedSrc} alt={alt || ""} {...props} />;
					},
				}}
			>
				{decodedContent}
			</Markdown>
		</div>
	);
}
