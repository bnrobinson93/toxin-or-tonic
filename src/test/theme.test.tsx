import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FloatingThemeToggle } from "../components/floating-theme-toggle";
import { ThemeProvider, useTheme } from "../components/theme-provider";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Test component that displays current theme
function TestComponent() {
  const { theme } = useTheme();
  return <div data-testid="current-theme">{theme}</div>;
}

describe("Theme System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document class
    document.documentElement.className = "";
  });

  describe("ThemeProvider", () => {
    it("should default to meadow theme", () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("current-theme").textContent).toBe("meadow");
    });

    it("should read theme from localStorage", () => {
      localStorageMock.getItem.mockReturnValue("forest");
      document.documentElement.classList.add("forest");

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("current-theme").textContent).toBe("forest");
    });

    it("should apply theme class to document when setTheme is called", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      function ThemeSetter() {
        const { setTheme } = useTheme();
        return (
          <button
            onClick={() => setTheme("midnight")}
            data-testid="set-midnight"
          >
            Set Midnight
          </button>
        );
      }

      render(
        <ThemeProvider>
          <ThemeSetter />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByTestId("set-midnight"));

      await waitFor(() => {
        expect(document.documentElement.classList.contains("midnight")).toBe(
          true,
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "theme",
          "midnight",
        );
      });
    });
  });

  describe("FloatingThemeToggle", () => {
    it("should render current theme name", () => {
      localStorageMock.getItem.mockReturnValue("meadow");

      render(
        <ThemeProvider>
          <FloatingThemeToggle />
        </ThemeProvider>,
      );

      expect(screen.getByText("Meadow")).toBeInTheDocument();
    });

    it("should change theme when clicking a different option", async () => {
      localStorageMock.getItem.mockReturnValue("meadow");

      render(
        <ThemeProvider>
          <FloatingThemeToggle />
        </ThemeProvider>,
      );

      // Open dropdown
      fireEvent.click(screen.getByText("Meadow"));

      // Click forest option
      fireEvent.click(screen.getByText("Forest"));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "theme",
          "forest",
        );
        expect(document.documentElement.classList.contains("forest")).toBe(
          true,
        );
      });
    });

    it("should show checkmark for current theme", () => {
      localStorageMock.getItem.mockReturnValue("forest");
      document.documentElement.classList.add("forest");

      render(
        <ThemeProvider>
          <FloatingThemeToggle />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByText("Forest"));

      // Checkmark should be visible for forest
      const forestItem = screen
        .getByText("Forest")
        .closest('[role="menuitem"]');
      expect(forestItem?.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("CSS Variables", () => {
    it("should have meadow theme CSS variables defined", () => {
      const styles = getComputedStyle(document.documentElement);
      // Check that CSS custom properties are being used
      expect(styles.getPropertyValue("--background")).toBeTruthy();
    });
  });
});
