"use client";

import { Check } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const themes = [
  {
    id: "meadow" as const,
    label: "Meadow",
    description: "Bright and warm",
    icon: "☀️",
  },
  {
    id: "forest" as const,
    label: "Forest",
    description: "Deep and cozy",
    icon: "🌲",
  },
  {
    id: "midnight" as const,
    label: "Midnight",
    description: "Calm and mystical",
    icon: "🌙",
  },
];

export function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <span className="mr-2">{currentTheme.icon}</span>
          <span className="font-medium">{currentTheme.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-48">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="text-lg">{t.icon}</span>
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
