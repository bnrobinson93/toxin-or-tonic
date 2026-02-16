"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "meadow" | "forest" | "midnight";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "meadow",
  setTheme: () => {},
  themes: ["meadow", "forest", "midnight"],
});

const THEMES: Theme[] = ["meadow", "forest", "midnight"];
const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  // Read from document class (set by inline script before hydration)
  if (typeof document !== "undefined") {
    const htmlClass = document.documentElement.className;
    for (const theme of THEMES) {
      if (htmlClass.includes(theme)) {
        return theme;
      }
    }
  }
  return "meadow";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);

    // Update localStorage
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      // localStorage not available
    }

    // Update document class
    document.documentElement.classList.remove("meadow", "forest", "midnight");
    document.documentElement.classList.add(newTheme);
  }, []);

  // Re-apply theme class if it gets removed (e.g., by Clerk)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const html = document.documentElement;
          const hasThemeClass = THEMES.some((t) => html.classList.contains(t));
          if (!hasThemeClass) {
            html.classList.add(theme);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
