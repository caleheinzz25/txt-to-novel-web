"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  BookOpen,
  FileText,
  Calendar,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  ArrowUpDown,
  XCircle,
  Play,
} from "lucide-react";
import ThemeSelector from "@/components/ThemeSelector";

interface Chapter {
  _id: string;
  name: string;
  chap: number;
  wordCount: number;
}

interface Novel {
  _id: string;
  name: string;
  totalChapters: number;
  totalWords: number;
  createdAt: string;
  chapters: Chapter[];
}

export default function NovelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chapter list filter & sort
  const [chapterSearch, setChapterSearch] = useState("");
  const [chapterAscending, setChapterAscending] = useState(true);

  // Split mode state: 'fixed_words' or 'auto_heading'
  const [splitMode, setSplitMode] = useState<"fixed_words" | "auto_heading">(
    "fixed_words"
  );
  const [wordsPerChapter, setWordsPerChapter] = useState(2000);
  const [headingPreset, setHeadingPreset] = useState<
    | "auto"
    | "chinese"
    | "japanese"
    | "korean"
    | "cjk"
    | "indonesian"
    | "english"
    | "numeric"
    | "custom"
  >("auto");
  const [customPattern, setCustomPattern] = useState("");
  const [resplitting, setResplitting] = useState(false);
  const [resplitStatus, setResplitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function fetchNovel() {
      try {
        const response = await fetch(`/api/novels/${id}`);
        const data = await response.json();

        if (data.success) {
          setNovel(data.data);
        } else {
          setError(data.message || "Novel not found");
        }
      } catch {
        setError("Failed to load novel");
      } finally {
        setLoading(false);
      }
    }

    fetchNovel();
  }, [id]);

  const handleResplit = async (
    targetMode: "fixed_words" | "auto_heading" = splitMode
  ) => {
    if (!novel || resplitting) return;

    setResplitting(true);
    setResplitStatus(null);

    const isFixedWords = targetMode === "fixed_words";

    try {
      const response = await fetch(`/api/novels/${id}/resplit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordsPerChapter,
          forceWordSplit: isFixedWords,
          headingPreset: isFixedWords ? "auto" : headingPreset,
          customPattern: isFixedWords ? "" : customPattern,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNovel(data.data);
        setResplitStatus({
          type: "success",
          message:
            data.message ||
            `Berhasil membagi ulang menjadi ${data.data.totalChapters} bab!`,
        });
      } else {
        setResplitStatus({
          type: "error",
          message: data.message || "Gagal memproses pemisahan bab",
        });
      }
    } catch {
      setResplitStatus({
        type: "error",
        message: "Gagal terhubung dengan server",
      });
    } finally {
      setResplitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatWordCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const filteredChapters = useMemo(() => {
    if (!novel) return [];
    let list = novel.chapters;

    if (chapterSearch.trim()) {
      const q = chapterSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.chap.toString().includes(q)
      );
    }

    if (!chapterAscending) {
      list = [...list].reverse();
    }

    return list;
  }, [novel, chapterSearch, chapterAscending]);

  if (loading) {
    return (
      <main className="main-container">
        <div className="loading">
          <div className="loading-spinner" />
          <p>Memuat novel...</p>
        </div>
      </main>
    );
  }

  if (error || !novel) {
    return (
      <main className="main-container">
        <div className="empty-state">
          <h3>{error || "Novel tidak ditemukan"}</h3>
          <Link href="/" className="back-link">
            <ChevronLeft size={20} />
            Kembali ke Library
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="main-container">
      {/* Top Navigation */}
      <nav className="app-navbar" style={{ borderRadius: "16px", marginBottom: "1.5rem" }}>
        <Link href="/" className="app-navbar-brand">
          <ChevronLeft size={20} />
          <span>Library</span>
        </Link>
        <div className="app-navbar-actions">
          <ThemeSelector />
        </div>
      </nav>

      <div className="novel-detail">
        <div className="novel-header">
          <div className="novel-cover">
            <BookOpen size={64} />
          </div>

          <div className="novel-info">
            <h1>{novel.name}</h1>

            <div className="novel-meta">
              <div className="stat">
                <FileText size={18} />
                <span>{novel.totalChapters} Bab</span>
              </div>
              <div className="stat">
                <BookOpen size={18} />
                <span>{formatWordCount(novel.totalWords)} Kata</span>
              </div>
              <div className="stat">
                <Calendar size={18} />
                <span>{formatDate(novel.createdAt)}</span>
              </div>
            </div>

            {/* Tombol Aksi Mulai Baca */}
            {novel.chapters.length > 0 && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                <Link
                  href={`/novel/${novel._id}/chapter/${novel.chapters[0]._id}`}
                  className="upload-btn"
                  style={{ display: "inline-flex", gap: "0.5rem" }}
                >
                  <Play size={18} fill="currentColor" />
                  <span>Mulai Baca (Bab 1)</span>
                </Link>
                {novel.chapters.length > 1 && (
                  <Link
                    href={`/novel/${novel._id}/chapter/${novel.chapters[novel.chapters.length - 1]._id}`}
                    className="chapter-sort-btn"
                    style={{ padding: "0.75rem 1.25rem", borderRadius: "12px" }}
                  >
                    <span>Bab Terakhir (#{novel.chapters[novel.chapters.length - 1].chap})</span>
                  </Link>
                )}
              </div>
            )}

            {/* 2 Opsi Pemisahan Bab (Chapter Splitting) */}
            <div className="words-control-box">
              <div className="words-control-title">
                <Sliders size={18} />
                <span>Pilih Metode Pemisahan Bab</span>
              </div>

              {/* Tab Selector 2 Opsi */}
              <div className="split-mode-tabs">
                <button
                  type="button"
                  className={`split-tab-btn ${
                    splitMode === "fixed_words" ? "active" : ""
                  }`}
                  onClick={() => setSplitMode("fixed_words")}
                >
                  <FileText size={16} />
                  <span>Fixed Word Count</span>
                </button>
                <button
                  type="button"
                  className={`split-tab-btn ${
                    splitMode === "auto_heading" ? "active" : ""
                  }`}
                  onClick={() => setSplitMode("auto_heading")}
                >
                  <BookOpen size={16} />
                  <span>Deteksi Heading Otomatis</span>
                </button>
              </div>

              {/* Konten Opsi 1: Fixed Word Count */}
              {splitMode === "fixed_words" ? (
                <div className="split-mode-content">
                  <p className="split-mode-desc">
                    Membagi bab secara rata berdasarkan jumlah kata yang ditentukan tanpa bergantung pada penanda bab.
                  </p>

                  <div className="words-control-inputs">
                    <div className="words-input-wrapper">
                      <input
                        type="number"
                        min={200}
                        max={50000}
                        step={500}
                        value={wordsPerChapter}
                        onChange={(e) =>
                          setWordsPerChapter(
                            Math.max(100, parseInt(e.target.value, 10) || 100)
                          )
                        }
                        className="words-number-input"
                      />
                      <span className="words-unit">words / chapter</span>
                    </div>

                    <div className="preset-btn-group">
                      {[1000, 2000, 3000, 5000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className={`preset-chip ${
                            wordsPerChapter === preset ? "active" : ""
                          }`}
                          onClick={() => setWordsPerChapter(preset)}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleResplit("fixed_words")}
                      disabled={resplitting}
                      className="resplit-btn"
                    >
                      {resplitting ? (
                        <>
                          <Loader2 size={16} className="spin" />
                          <span>Memproses pemisahan...</span>
                        </>
                      ) : (
                        <>
                          <FileText size={16} />
                          <span>Split per {wordsPerChapter} Kata</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Konten Opsi 2: Deteksi Heading Otomatis */
                <div className="split-mode-content">
                  <p className="split-mode-desc">
                    Otomatis mencari dan memisahkan bab mengikuti judul bab asli (Bab, Chapter, 第X章, dll.) yang ada di dalam teks.
                  </p>

                  <div className="heading-selector-group">
                    <div className="heading-selector-row">
                      <span className="heading-label">Format Penanda:</span>
                      <select
                        value={headingPreset}
                        onChange={(e) => setHeadingPreset(e.target.value as any)}
                        className="heading-select"
                      >
                        <option value="auto">Auto-Detect (Semua Bahasa)</option>
                        <option value="chinese">Chinese / 中文 (第X章, 第X回, 序章)</option>
                        <option value="japanese">Japanese / 日本語 (第X話, X話, プロローグ)</option>
                        <option value="korean">Korean / 한국어 (X화, 제X화, 프롤로그)</option>
                        <option value="indonesian">Bahasa Indonesia (Bab, Bagian, Episode)</option>
                        <option value="english">English (Chapter, Ch., Part, Book)</option>
                        <option value="numeric">Angka / Romawi (1., 2., I., II.)</option>
                        <option value="custom">Custom Pattern / Regex...</option>
                      </select>
                    </div>

                    {headingPreset === "custom" && (
                      <div className="custom-pattern-box">
                        <input
                          type="text"
                          placeholder="e.g. Arc \d+|STAGE \d+|Day \d+"
                          value={customPattern}
                          onChange={(e) => setCustomPattern(e.target.value)}
                          className="custom-pattern-input"
                        />
                        <span className="custom-pattern-hint">
                          Masukkan awalan atau pola regex judul bab Anda
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleResplit("auto_heading")}
                      disabled={resplitting}
                      className="resplit-btn auto-detect-btn"
                    >
                      {resplitting ? (
                        <>
                          <Loader2 size={16} className="spin" />
                          <span>Mendeteksi judul bab...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen size={16} />
                          <span>Deteksi Heading & Split Otomatis</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {resplitStatus && (
                <div className={`resplit-feedback ${resplitStatus.type}`}>
                  {resplitStatus.type === "success" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span>{resplitStatus.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chapters Section with Search and Sorting */}
        <section className="chapters-section">
          <div className="chapters-toolbar">
            <h2 style={{ margin: 0 }}>
              Daftar Bab ({filteredChapters.length}
              {chapterSearch ? ` dari ${novel.chapters.length}` : ""})
            </h2>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
              <div className="chapter-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Cari nomor atau judul bab..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  aria-label="Cari bab"
                />
                {chapterSearch && (
                  <XCircle
                    size={16}
                    className="clear-icon"
                    onClick={() => setChapterSearch("")}
                  />
                )}
              </div>

              <button
                type="button"
                className="chapter-sort-btn"
                onClick={() => setChapterAscending(!chapterAscending)}
                title={chapterAscending ? "Urutan: Bab 1 -> Terakhir" : "Urutan: Terakhir -> Bab 1"}
              >
                <ArrowUpDown size={16} />
                <span>{chapterAscending ? "Bab 1 → N" : "Bab N → 1"}</span>
              </button>
            </div>
          </div>

          {filteredChapters.length === 0 ? (
            <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
              <p>Tidak ada bab yang cocok dengan pencarian &quot;{chapterSearch}&quot;</p>
            </div>
          ) : (
            <div className="chapters-list">
              {filteredChapters.map((chapter) => (
                <Link
                  key={chapter._id}
                  href={`/novel/${novel._id}/chapter/${chapter._id}`}
                  className="chapter-item"
                >
                  <span className="chapter-num">{chapter.chap}</span>
                  <span className="chapter-title">{chapter.name}</span>
                  <span className="chapter-words">
                    {formatWordCount(chapter.wordCount)} kata
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
