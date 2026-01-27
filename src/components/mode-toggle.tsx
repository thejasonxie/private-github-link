import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemes } from "@/components/theme-provider";

export function ModeToggle() {
	const { theme, setTheme } = useThemes();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={(props) => (
					<Button {...props} variant="outline" size="lg">
						Theme
					</Button>
				)}
			/>

			<DropdownMenuContent className="w-32">
				<DropdownMenuGroup>
					<DropdownMenuRadioGroup
						value={theme}
						onValueChange={(value) => setTheme(value)}
					>
						<DropdownMenuRadioItem value="system">
							<LaptopIcon /> System
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="light">
							<SunIcon />
							Light
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="dark">
							<MoonIcon />
							Dark
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
