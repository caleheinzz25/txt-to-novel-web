"use client";

import { useTheme, Theme } from "./ThemeProvider";
import { Sun, Moon, Coffee } from "lucide-react";

export default function ThemeSelector() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return <div className="theme-pill-selector" style={{ minWidth: "110px", height: "36px" }} />;
  }

  const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "oled", label: "OLED", icon: Moon },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "sepia", label: "Sepia", icon: Coffee },
    { id: "light", label: "Light", icon: Sun },
  ];

  return (
    <div className="theme-pill-selector" role="group" aria-label="Theme selector">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            className={`theme-pill-btn ${isActive ? "active" : ""}`}
            onClick={() => setTheme(t.id)}
            title={`Switch to ${t.label} theme`}
            aria-label={`${t.label} theme`}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
