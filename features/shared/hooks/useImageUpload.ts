"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME    ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

function isCloudinaryConfigured() {
  return CLOUD_NAME && UPLOAD_PRESET &&
    CLOUD_NAME !== "your_cloud_name" &&
    UPLOAD_PRESET !== "your_preset";
}

interface Options { onUploaded?: (url: string) => void }

export function useImageUpload({ onUploaded }: Options = {}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!isCloudinaryConfigured()) {
      toast.error("Image upload not set up yet — paste an image URL instead.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",         file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder",       "chakwal-grand");

      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body:   fd,
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? "Upload failed — check Cloudinary settings.");
        return;
      }

      onUploaded?.(data.secure_url as string);
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

  return { uploading, pickFile, handleInputChange, inputRef, isConfigured: isCloudinaryConfigured() };
}
