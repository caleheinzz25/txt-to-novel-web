"use client";

import { useState, useEffect, use } from "react";
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

  useEffect(() => {
    // Load saved font size
    const savedFontSize = localStorage.getItem("readerFontSize");
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize, 10));
    }
  }, []);

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
      } catch (err) {
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

  // Format content with paragraphs
  const formatContent = (content: string) => {
    // Split by double newlines or long whitespace sequences for paragraphs
    const paragraphs = content.split(/\n\n+|\r\n\r\n+/).filter((p) => p.trim());

    if (paragraphs.length <= 1) {
      // If no clear paragraph breaks, try single newlines
      const singleNewlineParagraphs = content
        .split(/\n|\r\n/)
        .filter((p) => p.trim());
      if (singleNewlineParagraphs.length > 1) {
        return singleNewlineParagraphs;
      }
      // Otherwise, split by sentences every ~3-5 sentences for readability
      return [content];
    }

    return paragraphs;
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
        </div>
      </div>
    );
  }

  const paragraphs = formatContent(chapter.content);

  return (
    <div className="reader-container">
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

      <article className="reader-content" style={{ fontSize: `${fontSize}px` }}>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>

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
