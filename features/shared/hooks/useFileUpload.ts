"use client";

// ============================================================
// features/shared/hooks/useFileUpload.ts
// Generalised Cloudinary upload for HR documents — images AND PDFs
// (uses the `auto` endpoint). Mirrors useImageUpload but reports the
// resulting file kind so the UI can render a preview vs a file link.
// ============================================================

import { useState, useRef } from "react";
import { toast } from "sonner";

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME    ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

function isConfigured() {
  return CLOUD_NAME && UPLOAD_PRESET &&
    CLOUD_NAME !== "your_cloud_name" && UPLOAD_PRESET !== "your_preset";
}

export type FileKind = "image" | "pdf" | "raw";

interface Options {
  onUploaded?: (url: string, kind: FileKind) => void;
  maxBytes?: number; // default 10 MB
}

export function useFileUpload({ onUploaded, maxBytes = 10 * 1024 * 1024 }: Options = {}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!isConfigured()) {
      toast.error("File upload isn't set up yet — add your Cloudinary keys to enable it.");
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`File is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).`);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", "chakwal-grand/staff-docs");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST", body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? "Upload failed — check Cloudinary settings.");
        return;
      }

      const format = String(data.format ?? "").toLowerCase();
      const kind: FileKind =
        format === "pdf" ? "pdf"
        : data.resource_type === "image" ? "image"
        : "raw";
      onUploaded?.(data.secure_url as string, kind);
    } catch {
      toast.error("Upload failed. Check your internet connection.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return { uploading, pickFile, handleInputChange, inputRef, isConfigured: isConfigured() };
}
