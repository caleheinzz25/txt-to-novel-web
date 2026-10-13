"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Theme = "oled" | "dark" | "sepia" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "oled",
  toggleTheme: () => {},
  setTheme: () => {},
  cycleTheme: () => {},
  mounted: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("oled");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (
      savedTheme &&
      (savedTheme === "oled" ||
        savedTheme === "dark" ||
        savedTheme === "sepia" ||
        savedTheme === "light")
    ) {
      setThemeState(savedTheme);
    } else {
      // Default to oled for perfect deep blacks and eye comfort
      setThemeState("oled");
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  const cycleTheme = () => {
    setThemeState((prev) => {
      if (prev === "oled") return "dark";
      if (prev === "dark") return "sepia";
      if (prev === "sepia") return "light";
      return "oled";
    });
  };

  const toggleTheme = () => {
    cycleTheme();
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, cycleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}
