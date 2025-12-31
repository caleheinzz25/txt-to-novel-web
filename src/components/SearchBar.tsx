"use client";

import { useState, useCallback } from "react";
import { Search, SortAsc, SortDesc, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export default function SearchBar({ onSearch, onSort }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const debounce = <T extends (...args: Parameters<T>) => void>(
    func: T,
    wait: number
  ) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
    }, 300),
    [onSearch]
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    onSort(newSortBy, sortOrder);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    onSort(sortBy, newOrder);
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search novels..."
          value={query}
          onChange={handleQueryChange}
          className="search-input"
        />
        {query && (
          <button onClick={handleClear} className="clear-btn" type="button">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="sort-controls">
        <select
          value={sortBy}
          onChange={handleSortChange}
          className="sort-select"
        >
          <option value="createdAt">Date</option>
          <option value="name">Title</option>
          <option value="totalChapters">Chapters</option>
          <option value="totalWords">Words</option>
        </select>

        <button
          onClick={toggleSortOrder}
          className="sort-order-btn"
          type="button"
        >
          {sortOrder === "asc" ? <SortAsc size={20} /> : <SortDesc size={20} />}
        </button>
      </div>
    </div>
  );
}
