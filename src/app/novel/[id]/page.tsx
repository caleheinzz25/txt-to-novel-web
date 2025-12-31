"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ChevronLeft, BookOpen, FileText, Calendar, Clock } from "lucide-react";

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
      } catch (err) {
        setError("Failed to load novel");
      } finally {
        setLoading(false);
      }
    }

    fetchNovel();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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

  if (loading) {
    return (
      <main className="main-container">
        <div className="loading">
          <div className="loading-spinner" />
          <p>Loading novel...</p>
        </div>
      </main>
    );
  }

  if (error || !novel) {
    return (
      <main className="main-container">
        <div className="empty-state">
          <h3>{error || "Novel not found"}</h3>
          <Link href="/" className="back-link">
            <ChevronLeft size={20} />
            Back to Library
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="main-container">
      <div className="novel-detail">
        <Link href="/" className="back-link">
          <ChevronLeft size={20} />
          Back to Library
        </Link>

        <div className="novel-header">
          <div className="novel-cover">
            <BookOpen size={64} />
          </div>

          <div className="novel-info">
            <h1>{novel.name}</h1>

            <div className="novel-meta">
              <div className="stat">
                <FileText size={18} />
                <span>{novel.totalChapters} Chapters</span>
              </div>
              <div className="stat">
                <BookOpen size={18} />
                <span>{formatWordCount(novel.totalWords)} Words</span>
              </div>
              <div className="stat">
                <Calendar size={18} />
                <span>{formatDate(novel.createdAt)}</span>
              </div>
            </div>

            {novel.chapters.length > 0 && (
              <Link
                href={`/novel/${novel._id}/chapter/${novel.chapters[0]._id}`}
                className="upload-btn"
                style={{ display: "inline-flex", marginTop: "1rem" }}
              >
                Start Reading
              </Link>
            )}
          </div>
        </div>

        <section className="chapters-section">
          <h2>Chapters</h2>

          <div className="chapters-list">
            {novel.chapters.map((chapter) => (
              <Link
                key={chapter._id}
                href={`/novel/${novel._id}/chapter/${chapter._id}`}
                className="chapter-item"
              >
                <span className="chapter-num">{chapter.chap}</span>
                <span className="chapter-title">{chapter.name}</span>
                <span className="chapter-words">
                  {formatWordCount(chapter.wordCount)} words
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
