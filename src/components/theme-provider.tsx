import { ScriptOnce } from "@tanstack/react-router";
import React from "react";

import { useLocalStorage } from "usehooks-ts";

type Theme = "system" | "dark" | "light";

// Inline script to prevent flash of unstyled content (FOUC)
// This runs before React hydrates to set the theme class immediately
const themeScript = `(function() {
  try {
    const stored = localStorage.getItem('private-github-link.theme');
    const theme = stored ? JSON.parse(stored) : 'system';
    const resolved = theme === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.classList.add(resolved);
  } catch (e) {}
})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	return (
		<>
			<ScriptOnce>{themeScript}</ScriptOnce>
			{children}
		</>
	);
}

export const useThemes = () => {
	const [theme, setTheme] = useLocalStorage<Theme>(
		"private-github-link.theme",
		"system",
	);
	const [systemTheme, setSystemTheme] = React.useState<"dark" | "light">(
		window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light",
	);

	React.useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove("light", "dark");

		if (theme === "system") {
			const queryMedia = window.matchMedia("(prefers-color-scheme: dark)");
			const systemTheme = queryMedia.matches ? "dark" : "light";
			root.classList.add(systemTheme);

			setSystemTheme(systemTheme);
			// listen for changes to the system theme
			const listener = (e: MediaQueryListEvent) => {
				root.classList.remove("light", "dark");
				root.classList.add(e.matches ? "dark" : "light");
				setSystemTheme(e.matches ? "dark" : "light");
			};
			queryMedia.addEventListener("change", listener);
			return () => queryMedia.removeEventListener("change", listener);
		} else {
			setSystemTheme(theme);
		}

		root.classList.add(theme);
	}, [theme]);

	return { theme, setTheme, systemTheme };
};
