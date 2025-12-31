"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
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
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  const handleFontDecrease = () => {
    if (fontSize > 12) {
      onFontSizeChange(fontSize - 2);
    }
  };

  const handleFontIncrease = () => {
    if (fontSize < 28) {
      onFontSizeChange(fontSize + 2);
    }
  };

  return (
    <div className="reader-controls">
      <div className="reader-header">
        <Link href={`/novel/${novelId}`} className="back-btn">
          <ChevronLeft size={24} />
        </Link>

        <div className="reader-title">
          <h2>{novelName}</h2>
          <span>
            Chapter {currentChapter} of {totalChapters}
          </span>
        </div>

        <div className="reader-actions">
          <button
            onClick={onShowChapterList}
            className="action-btn"
            title="Chapter List"
          >
            <List size={20} />
          </button>
          <button
            onClick={toggleTheme}
            className="action-btn"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`action-btn font-btn ${showSettings ? "active" : ""}`}
            title="Font Settings"
          >
            Aa
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="font-settings">
          <span>Font Size</span>
          <div className="font-size-controls">
            <button onClick={handleFontDecrease} disabled={fontSize <= 12}>
              <Minus size={16} />
            </button>
            <span>{fontSize}px</span>
            <button onClick={handleFontIncrease} disabled={fontSize >= 28}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="reader-nav">
        {prevChapterId ? (
          <Link
            href={`/novel/${novelId}/chapter/${prevChapterId}`}
            className="nav-btn prev"
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </Link>
        ) : (
          <div className="nav-btn prev disabled">
            <ChevronLeft size={20} />
            <span>Previous</span>
          </div>
        )}

        <Link href="/" className="nav-btn home">
          <Home size={20} />
        </Link>

        {nextChapterId ? (
          <Link
            href={`/novel/${novelId}/chapter/${nextChapterId}`}
            className="nav-btn next"
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </Link>
        ) : (
          <div className="nav-btn next disabled">
            <span>Next</span>
            <ChevronRight size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
