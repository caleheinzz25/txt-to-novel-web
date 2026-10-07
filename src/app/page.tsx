"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { BookOpen } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import NovelCard from "@/components/NovelCard";
import SearchBar from "@/components/SearchBar";
import ThemeSelector from "@/components/ThemeSelector";

interface Novel {
  _id: string;
  name: string;
  totalChapters: number;
  totalWords: number;
  createdAt: string;
}

export default function HomePage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchNovels = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const response = await fetch(`/api/novels?${params}`);
      const data = await response.json();

      if (data.success) {
        setNovels(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch novels:", error);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, sortOrder]);

  useEffect(() => {
    fetchNovels();
  }, [fetchNovels]);

  const handleSearch = (query: string) => {
    setSearch(query);
  };

  const handleSort = (newSortBy: string, newSortOrder: "asc" | "desc") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleUploadSuccess = () => {
    fetchNovels();
  };

  const handleDelete = (id: string) => {
    setNovels((prev) => prev.filter((novel) => novel._id !== id));
  };

  return (
    <main className="main-container">
      <nav className="app-navbar" style={{ borderRadius: "16px", marginBottom: "2rem" }}>
        <div className="app-navbar-brand">
          <BookOpen className="brand-icon" size={24} />
          <span>NovelReader</span>
        </div>
        <div className="app-navbar-actions">
          <ThemeSelector />
        </div>
      </nav>

      <header className="header">
        <h1>NovelReader</h1>
        <p>
          Upload novel TXT dan nikmati membaca dengan tampilan interaktif & nyaman di web dan mobile
        </p>
      </header>

      <section>
        <FileUpload onUploadSuccess={handleUploadSuccess} />
      </section>

      <section className="novels-section">
        <h2>Your Library</h2>

        <SearchBar onSearch={handleSearch} onSort={handleSort} />

        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <p>Loading novels...</p>
          </div>
        ) : novels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <BookOpen size={64} />
            </div>
            <h3>No novels yet</h3>
            <p>Upload a TXT file to get started</p>
          </div>
        ) : (
          <div className="novels-grid">
            {novels.map((novel) => (
              <NovelCard
                key={novel._id}
                id={novel._id}
                name={novel.name}
                totalChapters={novel.totalChapters}
                totalWords={novel.totalWords}
                createdAt={novel.createdAt}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
