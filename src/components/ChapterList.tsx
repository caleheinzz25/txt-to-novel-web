"use client";

import Link from "next/link";
import { X, BookOpen } from "lucide-react";

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
  const formatWordCount = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  return (
    <div className="chapter-list-overlay" onClick={onClose}>
      <div className="chapter-list-panel" onClick={(e) => e.stopPropagation()}>
        <div className="chapter-list-header">
          <h3>
            <BookOpen size={20} />
            Chapters
          </h3>
          <button onClick={onClose} className="close-btn" type="button">
            <X size={24} />
          </button>
        </div>

        <div className="chapter-list-content">
          {chapters.map((chapter) => (
            <Link
              key={chapter._id}
              href={`/novel/${novelId}/chapter/${chapter._id}`}
              className={`chapter-list-item ${
                chapter._id === currentChapterId ? "active" : ""
              }`}
              onClick={onClose}
            >
              <span className="chapter-number">{chapter.chap}</span>
              <span className="chapter-name">{chapter.name}</span>
              <span className="chapter-words">
                {formatWordCount(chapter.wordCount)} words
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
