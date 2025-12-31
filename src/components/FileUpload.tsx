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
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (result.success) {
        setProgress(100);
        setStatus("success");
        setMessage(`${result.data.totalChapters} chapters created`);
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
        setMessage(result.message);
        onUploadError?.(result.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Upload failed. Please try again.");
      onUploadError?.("Upload failed");
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
            <p className="dropzone-hint">Max file size: 10MB</p>
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

          {status === "idle" && (
            <button onClick={handleUpload} className="upload-btn">
              <Upload size={20} />
              Upload & Process
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
