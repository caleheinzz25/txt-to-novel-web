"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface FileUploadProps {
  onUploadSuccess?: (novelId: string) => void;
  onUploadError?: (error: string) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function FileUpload({
  onUploadSuccess,
  onUploadError,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
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
  const [encoding, setEncoding] = useState("auto");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus("idle");
      setMessage("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);
    setMessage("");

    const isFixedWords = splitMode === "fixed_words";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("forceWordSplit", isFixedWords ? "true" : "false");
    formData.append("wordsPerChapter", wordsPerChapter.toString());
    formData.append("headingPreset", isFixedWords ? "auto" : headingPreset);
    formData.append("encoding", encoding);
    if (!isFixedWords && headingPreset === "custom" && customPattern.trim()) {
      formData.append("customPattern", customPattern.trim());
    }

    try {
      // Smooth progress indicator
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 95));
      }, 300);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        let errorMsg = `Server error (${response.status})`;
        try {
          const errData = await response.json();
          if (errData && errData.message) errorMsg = errData.message;
        } catch {
          if (response.status === 413) {
            errorMsg = "Ukuran file terlalu besar untuk server (413 Payload Too Large).";
          } else if (response.status === 504) {
            errorMsg = "Proses upload memakan waktu terlalu lama (504 Timeout).";
          }
        }
        setStatus("error");
        setMessage(errorMsg);
        onUploadError?.(errorMsg);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setProgress(100);
        setStatus("success");
        setMessage(result.message || `${result.data.totalChapters} bab berhasil dibuat`);
        onUploadSuccess?.(result.novelId);

        // Reset after success
        setTimeout(() => {
          setFile(null);
          setStatus("idle");
          setProgress(0);
          setMessage("");
        }, 2000);
      } else {
        setStatus("error");
        setMessage(result.message || "Gagal memproses file.");
        onUploadError?.(result.message);
      }
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : "Upload gagal. Silakan periksa koneksi dan coba lagi.";
      setStatus("error");
      setMessage(errMsg);
      onUploadError?.(errMsg);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setMessage("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="upload-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "dropzone-active" : ""} ${
          file ? "dropzone-has-file" : ""
        }`}
      >
        <input {...getInputProps()} />

        {!file ? (
          <div className="dropzone-content">
            <div className="dropzone-icon">
              <Upload size={48} />
            </div>
            <p className="dropzone-text">
              {isDragActive
                ? "Drop your TXT file here..."
                : "Drag & drop a TXT file here, or click to select"}
            </p>
            <p className="dropzone-hint">Max file size: 50MB</p>
          </div>
        ) : (
          <div className="file-preview" onClick={(e) => e.stopPropagation()}>
            <div className="file-info">
              <FileText size={32} className="file-icon" />
              <div className="file-details">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{formatFileSize(file.size)}</p>
              </div>
            </div>
            {status === "idle" && (
              <button
                onClick={handleRemove}
                className="remove-btn"
                type="button"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      {file && (
        <div className="upload-actions">
          {status === "uploading" && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}

          {status === "success" && (
            <div className="status-message success">
              <CheckCircle size={20} />
              <span>{message}</span>
            </div>
          )}

          {status === "error" && (
            <div className="status-message error">
              <AlertCircle size={20} />
              <span>{message}</span>
            </div>
          )}

          {(status === "idle" || status === "error") && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.75rem",
                width: "100%",
                maxWidth: "460px",
                padding: "1rem",
                background: "var(--bg-primary)",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* Selector 2 Opsi */}
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  gap: "0.35rem",
                  background: "var(--bg-secondary)",
                  padding: "0.3rem",
                  borderRadius: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSplitMode("fixed_words")}
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.5rem",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      splitMode === "fixed_words"
                        ? "var(--accent-primary)"
                        : "transparent",
                    color:
                      splitMode === "fixed_words"
                        ? "white"
                        : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Fixed Word Count
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode("auto_heading")}
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.5rem",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      splitMode === "auto_heading"
                        ? "var(--accent-primary)"
                        : "transparent",
                    color:
                      splitMode === "auto_heading"
                        ? "white"
                        : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Deteksi Heading
                </button>
              </div>

              {splitMode === "fixed_words" ? (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>Target Kata / Bab:</span>
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
                      style={{
                        width: "90px",
                        padding: "0.35rem 0.5rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        fontWeight: 600,
                        textAlign: "center",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  {/* Preset chips for fast tap */}
                  <div style={{ display: "flex", gap: "0.35rem", width: "100%" }}>
                    {[1000, 2000, 3000, 5000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWordsPerChapter(preset)}
                        style={{
                          flex: 1,
                          padding: "0.35rem 0.25rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          background: wordsPerChapter === preset ? "var(--accent-primary)" : "var(--bg-secondary)",
                          color: wordsPerChapter === preset ? "white" : "var(--text-secondary)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>Format Penanda:</span>
                    <select
                      value={headingPreset}
                      onChange={(e) => setHeadingPreset(e.target.value as any)}
                      style={{
                        padding: "0.35rem 0.5rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      <option value="auto">Auto-Detect</option>
                      <option value="chinese">Chinese (第X章)</option>
                      <option value="japanese">Japanese (第X話)</option>
                      <option value="korean">Korean (X화)</option>
                      <option value="indonesian">Bab (Indo)</option>
                      <option value="english">Chapter (Eng)</option>
                      <option value="numeric">1., 2. (Numbers)</option>
                      <option value="custom">Custom...</option>
                    </select>
                  </div>

                  {headingPreset === "custom" && (
                    <div style={{ width: "100%", marginTop: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="e.g. Arc \d+|STAGE \d+"
                        value={customPattern}
                        onChange={(e) => setCustomPattern(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.35rem 0.5rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-primary)",
                          fontSize: "0.85rem",
                          fontFamily: "monospace",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Encoding Selector Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  paddingTop: "0.6rem",
                  borderTop: "1px dashed var(--border-color)",
                }}
              >
                <span>Encoding / Karakter:</span>
                <select
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value)}
                  style={{
                    padding: "0.35rem 0.5rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    fontSize: "0.825rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="auto">Auto-Detect (Rekomendasi)</option>
                  <option value="gb18030">GBK / GB18030 (Chinese / 中文)</option>
                  <option value="utf-8">UTF-8 Standar</option>
                  <option value="big5">Big5 (Trad. Chinese / 繁體)</option>
                  <option value="shift_jis">Shift-JIS (Japanese / 日本語)</option>
                  <option value="euc-kr">EUC-KR (Korean / 한국어)</option>
                </select>
              </div>
            </div>
          )}

          {(status === "idle" || status === "error") && (
            <button onClick={handleUpload} className="upload-btn">
              <Upload size={20} />
              {status === "error" ? "Coba Lagi (Retry Upload)" : "Upload & Process"}
            </button>
          )}

          {status === "uploading" && (
            <button disabled className="upload-btn uploading">
              <Loader2 size={20} className="spin" />
              Processing...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
