"use client";

import Link from "next/link";
import { BookOpen, Trash2, Calendar, FileText } from "lucide-react";

interface NovelCardProps {
  id: string;
  name: string;
  totalChapters: number;
  totalWords: number;
  createdAt: string;
  onDelete?: (id: string) => void;
}

export default function NovelCard({
  id,
  name,
  totalChapters,
  totalWords,
  createdAt,
  onDelete,
}: NovelCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatWordCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/novels/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete?.(id);
      }
    } catch (error) {
      console.error("Failed to delete novel:", error);
    }
  };

  return (
    <div className="novel-card">
      <Link href={`/novel/${id}`} className="novel-card-link">
        <div className="novel-card-cover">
          <BookOpen size={48} />
        </div>

        <div className="novel-card-content">
          <h3 className="novel-card-title">{name}</h3>

          <div className="novel-card-stats">
            <div className="stat">
              <FileText size={16} />
              <span>{totalChapters} Chapters</span>
            </div>
            <div className="stat">
              <BookOpen size={16} />
              <span>{formatWordCount(totalWords)} Words</span>
            </div>
          </div>

          <div className="novel-card-date">
            <Calendar size={14} />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>
      </Link>

      <button
        onClick={handleDelete}
        className="novel-card-delete"
        title="Delete novel"
        type="button"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
