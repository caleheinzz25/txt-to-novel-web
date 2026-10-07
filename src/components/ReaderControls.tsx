"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  Minus,
  Plus,
  List,
  Home,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ReaderControlsProps {
  novelId: string;
  novelName: string;
  currentChapter: number;
  totalChapters: number;
  prevChapterId: string | null;
  nextChapterId: string | null;
  onFontSizeChange: (size: number) => void;
  fontSize: number;
  onShowChapterList: () => void;
}

export default function ReaderControls({
  novelId,
  novelName,
  currentChapter,
  totalChapters,
  prevChapterId,
  nextChapterId,
  onFontSizeChange,
  fontSize,
  onShowChapterList,
}: ReaderControlsProps) {
  const { theme, cycleTheme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  const handleFontDecrease = () => {
    if (fontSize > 12) {
      onFontSizeChange(fontSize - 2);
    }
  };

  const handleFontIncrease = () => {
    if (fontSize < 32) {
      onFontSizeChange(fontSize + 2);
    }
  };

  const getThemeIcon = () => {
    if (theme === "dark") return <Moon size={20} />;
    if (theme === "sepia") return <Coffee size={20} />;
    return <Sun size={20} />;
  };

  return (
    <div className="reader-controls">
      <div className="reader-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Link
            href={`/novel/${novelId}`}
            className="back-btn"
            title="Kembali ke Info Novel"
            aria-label="Kembali"
          >
            <ChevronLeft size={22} />
          </Link>
          <Link
            href="/"
            className="back-btn"
            title="Ke Beranda Library"
            aria-label="Beranda"
          >
            <Home size={18} />
          </Link>
        </div>

        <div className="reader-title">
          <h2>{novelName}</h2>
          <span>
            Bab {currentChapter} dari {totalChapters}
          </span>
        </div>

        <div className="reader-actions">
          <button
            onClick={onShowChapterList}
            className="action-btn"
            title="Daftar Bab"
            aria-label="Daftar Bab"
          >
            <List size={20} />
          </button>

          <button
            onClick={cycleTheme}
            className="action-btn"
            title={`Tema saat ini: ${theme} (Klik untuk ganti)`}
            aria-label="Ganti Tema"
          >
            {getThemeIcon()}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`action-btn font-btn ${showSettings ? "active" : ""}`}
            title="Pengaturan Tampilan"
            aria-label="Pengaturan Tampilan"
          >
            Aa
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="font-settings" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Ukuran Font:
            </span>
            <div className="font-size-controls">
              <button
                onClick={handleFontDecrease}
                disabled={fontSize <= 12}
                aria-label="Perkecil font"
              >
                <Minus size={16} />
              </button>
              <span style={{ minWidth: "35px", textAlign: "center" }}>{fontSize}px</span>
              <button
                onClick={handleFontIncrease}
                disabled={fontSize >= 32}
                aria-label="Perbesar font"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Tema:
            </span>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {(["light", "sepia", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  style={{
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "capitalize",
                    background: theme === t ? "var(--accent-primary)" : "var(--bg-secondary)",
                    color: theme === t ? "white" : "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick top previous/next bar */}
      <div className="reader-nav">
        {prevChapterId ? (
          <Link
            href={`/novel/${novelId}/chapter/${prevChapterId}`}
            className="nav-btn prev"
            aria-label="Bab Sebelumnya"
          >
            <ChevronLeft size={18} />
            <span>Sebelumnya</span>
          </Link>
        ) : (
          <div className="nav-btn prev disabled" aria-disabled="true">
            <ChevronLeft size={18} />
            <span>Sebelumnya</span>
          </div>
        )}

        <button
          type="button"
          onClick={onShowChapterList}
          className="nav-btn"
          style={{ fontSize: "0.825rem", padding: "0.4rem 0.75rem" }}
        >
          <List size={16} />
          <span>Bab {currentChapter} / {totalChapters}</span>
        </button>

        {nextChapterId ? (
          <Link
            href={`/novel/${novelId}/chapter/${nextChapterId}`}
            className="nav-btn next"
            aria-label="Bab Selanjutnya"
          >
            <span>Selanjutnya</span>
            <ChevronRight size={18} />
          </Link>
        ) : (
          <div className="nav-btn next disabled" aria-disabled="true">
            <span>Selanjutnya</span>
            <ChevronRight size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
