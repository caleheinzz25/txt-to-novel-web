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

// Client-side cache to make chapter navigation instant
const chapterCache = new Map<string, Chapter>();
const pendingFetches = new Map<string, Promise<Chapter | null>>();

async function fetchChapterData(id: string): Promise<Chapter | null> {
  if (!id) return null;
  if (chapterCache.has(id)) return chapterCache.get(id)!;
  if (pendingFetches.has(id)) return pendingFetches.get(id)!;

  const promise = (async () => {
    try {
      const res = await fetch(`/api/chapters/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        chapterCache.set(id, data.data);
        return data.data as Chapter;
      }
      return null;
    } catch {
      return null;
    } finally {
      pendingFetches.delete(id);
    }
  })();

  pendingFetches.set(id, promise);
  return promise;
}

// Prefetch multiple chapters ahead so rapid clicking is completely buffered
async function prefetchChaptersAhead(startChapter: Chapter) {
  // 1. Fetch immediate next and previous
  const next1Promise = startChapter.navigation.nextId
    ? fetchChapterData(startChapter.navigation.nextId)
    : Promise.resolve(null);

  if (startChapter.navigation.prevId) {
    fetchChapterData(startChapter.navigation.prevId);
  }

  // 2. Once next1 arrives, immediately prefetch next2 (+2 chapters ahead)
  const next1 = await next1Promise;
  if (next1 && next1.navigation.nextId) {
    const next2Promise = fetchChapterData(next1.navigation.nextId);
    const next2 = await next2Promise;
    if (next2 && next2.navigation.nextId) {
      // Buffer +3 chapters ahead
      fetchChapterData(next2.navigation.nextId);
    }
  }
}

export default function ChapterReaderPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id: novelId, chapterId: initialChapterId } = use(params);
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);
  const [chapter, setChapter] = useState<Chapter | null>(() => chapterCache.get(initialChapterId) || null);
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [loading, setLoading] = useState(!chapterCache.has(initialChapterId));
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [showChapterList, setShowChapterList] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Sync state if user navigates with browser back/forward buttons
  useEffect(() => {
    setCurrentChapterId(initialChapterId);
  }, [initialChapterId]);

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

  // Navigate to a new chapter instantly in-memory without waiting for Next.js router
  const navigateToChapter = (targetId: string) => {
    if (!targetId || targetId === currentChapterId) return;

    // Instantly update browser URL and scroll to top
    window.history.pushState(null, "", `/novel/${novelId}/chapter/${targetId}`);
    setCurrentChapterId(targetId);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setScrollProgress(0);

    // If target chapter is already cached, switch view immediately
    if (chapterCache.has(targetId)) {
      const cached = chapterCache.get(targetId)!;
      setChapter(cached);
      setLoading(false);
      setError(null);
      prefetchChaptersAhead(cached);
    } else {
      setLoading(true);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadChapter() {
      // 1. Instant cache hit
      if (chapterCache.has(currentChapterId)) {
        const cached = chapterCache.get(currentChapterId)!;
        setChapter(cached);
        setLoading(false);
        setError(null);
        prefetchChaptersAhead(cached);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchChapterData(currentChapterId);

        if (isCancelled) return;

        if (data) {
          setChapter(data);
          prefetchChaptersAhead(data);
        } else {
          setError("Chapter not found");
        }
      } catch {
        if (!isCancelled) {
          setError("Failed to load chapter");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadChapter();

    return () => {
      isCancelled = true;
    };
  }, [currentChapterId]);

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
        onNavigateChapter={navigateToChapter}
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
              onClick={(e) => {
                e.preventDefault();
                navigateToChapter(chapter.navigation.prevId!);
              }}
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
              onClick={(e) => {
                e.preventDefault();
                navigateToChapter(chapter.navigation.nextId!);
              }}
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
          currentChapterId={currentChapterId}
          onClose={() => setShowChapterList(false)}
          onSelectChapter={navigateToChapter}
        />
      )}
    </div>
  );
}
