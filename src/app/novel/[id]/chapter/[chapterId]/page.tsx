"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  List,
  ArrowUp,
  BookOpen,
} from "lucide-react";
import ReaderControls from "@/components/ReaderControls";
import ChapterList from "@/components/ChapterList";

interface Chapter {
  _id: string;
  novelId: string;
  novelName: string;
  totalChapters: number;
  name: string;
  chap: number;
  content: string;
  wordCount: number;
  navigation: {
    prevId: string | null;
    nextId: string | null;
  };
}

interface ChapterListItem {
  _id: string;
  name: string;
  chap: number;
  wordCount: number;
}

export default function ChapterReaderPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id: novelId, chapterId } = use(params);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [showChapterList, setShowChapterList] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // Load saved font size
    const savedFontSize = localStorage.getItem("readerFontSize");
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }
  }, []);

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(
          100,
          Math.max(0, (window.scrollY / totalHeight) * 100)
        );
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top when chapterId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setScrollProgress(0);
  }, [chapterId]);

  useEffect(() => {
    async function fetchChapter() {
      setLoading(true);
      try {
        const response = await fetch(`/api/chapters/${chapterId}`);
        const data = await response.json();

        if (data.success) {
          setChapter(data.data);
        } else {
          setError(data.message || "Chapter not found");
        }
      } catch {
        setError("Failed to load chapter");
      } finally {
        setLoading(false);
      }
    }

    fetchChapter();
  }, [chapterId]);

  useEffect(() => {
    async function fetchChapters() {
      try {
        const response = await fetch(`/api/chapters?novelId=${novelId}`);
        const data = await response.json();

        if (data.success) {
          setChapters(data.data);
        }
      } catch (err) {
        console.error("Failed to load chapters:", err);
      }
    }

    fetchChapters();
  }, [novelId]);

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem("readerFontSize", size.toString());
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Format content into readable paragraphs preserving line breaks and indentation
  const formatContent = (content: string) => {
    if (!content) return [];
    return content
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.trim().length > 0);
  };

  if (loading) {
    return (
      <div className="reader-container">
        <div className="loading" style={{ minHeight: "100vh" }}>
          <div className="loading-spinner" />
          <p>Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="reader-container">
        <div className="loading" style={{ minHeight: "100vh" }}>
          <h3>{error || "Chapter not found"}</h3>
          <Link
            href={`/novel/${novelId}`}
            className="back-btn"
            style={{ marginTop: "1rem", display: "inline-flex" }}
          >
            Kembali ke Daftar Bab
          </Link>
        </div>
      </div>
    );
  }

  const paragraphs = formatContent(chapter.content);

  return (
    <div className="reader-container">
      {/* Real-time reading progress bar at the very top */}
      <div
        className="reader-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <ReaderControls
        novelId={novelId}
        novelName={chapter.novelName}
        currentChapter={chapter.chap}
        totalChapters={chapter.totalChapters}
        prevChapterId={chapter.navigation.prevId}
        nextChapterId={chapter.navigation.nextId}
        onFontSizeChange={handleFontSizeChange}
        fontSize={fontSize}
        onShowChapterList={() => setShowChapterList(true)}
      />

      <article
        className="reader-content"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: fontSize > 20 ? 1.8 : 1.9,
        }}
      >
        <header style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.4em",
              fontWeight: 700,
              marginBottom: "0.5rem",
              lineHeight: 1.3,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {chapter.name}
          </h1>
          <div
            style={{
              fontSize: "0.8em",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <span>Bab {chapter.chap}</span>
            <span>•</span>
            <span>{chapter.wordCount.toLocaleString()} kata</span>
          </div>
        </header>

        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>

      {/* Interactive Bottom Navigation for Readers */}
      <nav className="reader-bottom-nav" aria-label="Navigasi bab selesai">
        <div className="reader-bottom-progress">
          <span>
            Bab {chapter.chap} dari {chapter.totalChapters}
          </span>
          <span>Progres Baca: {Math.round(scrollProgress)}%</span>
        </div>

        <div className="reader-bottom-actions">
          {chapter.navigation.prevId ? (
            <Link
              href={`/novel/${novelId}/chapter/${chapter.navigation.prevId}`}
              className="bottom-nav-btn"
            >
              <ChevronLeft size={20} />
              <span>Sebelumnya</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="bottom-nav-btn disabled"
            >
              <ChevronLeft size={20} />
              <span>Sebelumnya</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowChapterList(true)}
            className="bottom-nav-btn"
            title="Buka Daftar Bab"
            aria-label="Buka Daftar Bab"
          >
            <List size={20} />
            <span>Daftar Bab</span>
          </button>

          {chapter.navigation.nextId ? (
            <Link
              href={`/novel/${novelId}/chapter/${chapter.navigation.nextId}`}
              className="bottom-nav-btn primary"
            >
              <span>Selanjutnya</span>
              <ChevronRight size={20} />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="bottom-nav-btn disabled"
            >
              <span>Tamat</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={scrollToTop}
          className="back-to-top-btn"
          aria-label="Kembali ke atas"
        >
          <ArrowUp size={16} />
          <span>Kembali ke Atas</span>
        </button>
      </nav>

      {showChapterList && (
        <ChapterList
          novelId={novelId}
          chapters={chapters}
          currentChapterId={chapterId}
          onClose={() => setShowChapterList(false)}
        />
      )}
    </div>
  );
}
