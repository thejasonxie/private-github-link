/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format date as relative time (e.g., "5 minutes ago", "yesterday")
 */
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();

	// Handle future dates (shouldn't happen, but just in case)
	if (diffMs < 0) return "just now";

	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffSeconds < 60) return "just now";
	if (diffMinutes === 1) return "1 minute ago";
	if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
	if (diffHours === 1) return "1 hour ago";
	if (diffHours < 24) return `${diffHours} hours ago`;
	if (diffDays === 1) return "yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 14) return "last week";
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
	if (diffDays < 60) return "last month";
	if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
	if (diffDays < 730) return "last year";
	return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Format date for commit history grouping (e.g., "Jan 16, 2026")
 */
export function formatDateForGrouping(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}
