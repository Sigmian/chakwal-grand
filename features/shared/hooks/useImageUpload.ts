"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

interface UseImageUploadOptions {
  folder?: string;
  onUploaded?: (url: string) => void;
}

export function useImageUpload({ folder = "uploads", onUploaded }: UseImageUploadOptions = {}) {
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setProgress(10);

    try {
      // 1. Get presigned URL from our API
      const presignRes = await fetch("/api/upload/presign", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ contentType: file.type, folder }),
      });

      const presignData = await presignRes.json();

      if (!presignRes.ok) {
        if (presignData.notConfigured) {
          toast.error("File upload not configured — please paste an image URL instead.");
        } else {
          toast.error(presignData.error ?? "Upload failed");
        }
        return;
      }

      setProgress(30);

      // 2. Upload directly to S3
      const uploadRes = await fetch(presignData.uploadUrl, {
        method:  "PUT",
        body:    file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        toast.error("Failed to upload to storage. Please try again.");
        return;
      }

      setProgress(90);
      onUploaded?.(presignData.publicUrl);
      setProgress(100);
    } catch {
      toast.error("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return { uploading, progress, pickFile, handleInputChange, inputRef };
}
