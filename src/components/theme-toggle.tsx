"use client";

import { Check, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const themes = [
	{
		id: "meadow",
		label: "Meadow",
		description: "Bright and warm",
		colors: "from-amber-100 to-green-50",
	},
	{
		id: "forest",
		label: "Forest",
		description: "Deep and cozy",
		colors: "from-green-900 to-emerald-950",
	},
	{
		id: "midnight",
		label: "Midnight",
		description: "Calm and mystical",
		colors: "from-slate-900 to-teal-950",
	},
];

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Palette className="h-4 w-4" />
					<span className="hidden sm:inline">Theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				{themes.map((t) => (
					<DropdownMenuItem
						key={t.id}
						onClick={() => setTheme(t.id)}
						className="flex items-center gap-3 cursor-pointer"
					>
						<div
							className={`w-4 h-4 rounded-full bg-gradient-to-br ${t.colors} border border-border`}
						/>
						<div className="flex-1">
							<div className="text-sm font-medium">{t.label}</div>
							<div className="text-xs text-muted-foreground">
								{t.description}
							</div>
						</div>
						{theme === t.id && <Check className="h-4 w-4 text-primary" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
