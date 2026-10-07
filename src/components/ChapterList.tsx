"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { X, BookOpen, Search, ArrowUpDown, XCircle } from "lucide-react";

interface Chapter {
  _id: string;
  name: string;
  chap: number;
  wordCount: number;
}

interface ChapterListProps {
  novelId: string;
  chapters: Chapter[];
  currentChapterId: string;
  onClose: () => void;
}

export default function ChapterList({
  novelId,
  chapters,
  currentChapterId,
  onClose,
}: ChapterListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ascending, setAscending] = useState(true);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  const formatWordCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const filteredChapters = useMemo(() => {
    let list = chapters;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.chap.toString().includes(q)
      );
    }

    if (!ascending) {
      list = [...list].reverse();
    }

    return list;
  }, [chapters, searchQuery, ascending]);

  // Auto-scroll to active chapter once loaded
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  return (
    <div className="chapter-list-overlay" onClick={onClose}>
      <div className="chapter-list-panel" onClick={(e) => e.stopPropagation()}>
        <div className="chapter-list-header">
          <h3>
            <BookOpen size={20} />
            <span>Daftar Bab ({chapters.length})</span>
          </h3>
          <button
            onClick={onClose}
            className="close-btn"
            type="button"
            aria-label="Tutup daftar bab"
          >
            <X size={22} />
          </button>
        </div>

        {/* Quick Search & Sort in Drawer */}
        <div className="drawer-search-wrapper">
          <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.6rem",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Cari nomor atau judul bab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="drawer-search-input"
              style={{ paddingLeft: "2rem", paddingRight: searchQuery ? "2rem" : "0.75rem" }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  color: "var(--text-muted)",
                  padding: "0.2rem",
                }}
              >
                <XCircle size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="drawer-sort-btn"
            onClick={() => setAscending(!ascending)}
            title={ascending ? "Urutan: 1 -> Terakhir" : "Urutan: Terakhir -> 1"}
            aria-label="Ubah urutan bab"
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        <div className="chapter-list-content">
          {filteredChapters.length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
              Tidak ada bab yang cocok dengan &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredChapters.map((chapter) => {
              const isActive = chapter._id === currentChapterId;
              return (
                <Link
                  key={chapter._id}
                  ref={isActive ? activeItemRef : null}
                  href={`/novel/${novelId}/chapter/${chapter._id}`}
                  className={`chapter-list-item ${isActive ? "active" : ""}`}
                  onClick={onClose}
                >
                  <span className="chapter-number">{chapter.chap}</span>
                  <span className="chapter-name">{chapter.name}</span>
                  <span className="chapter-words">
                    {formatWordCount(chapter.wordCount)} words
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
