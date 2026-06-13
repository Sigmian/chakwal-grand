"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, Link2, Star, Trash2, Plus, Loader2, X, ImageIcon } from "lucide-react";
import { addRoomImages, setRoomCoverImage, deleteRoomImage } from "@/server/actions/rooms";
import { useImageUpload } from "@/features/shared/hooks/useImageUpload";
import { cn } from "@/utils";

interface RoomImage {
  id:       string;
  url:      string;
  altText:  string | null;
  isCover:  boolean;
  sortOrder: number;
}

interface Props {
  roomId: string;
  images: RoomImage[];
}

export function RoomImageManager({ roomId, images }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [addMode, setAddMode] = useState<"upload" | "url">("upload");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { uploading, pickFile, handleInputChange, inputRef } = useImageUpload({
    onUploaded: (url) => {
      saveImages([url]);
    },
  });

  const saveImages = (urls: string[]) => {
    startTransition(async () => {
      const res = await addRoomImages(roomId, urls);
      if (res.success) {
        toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} added`);
        setShowAdd(false);
        setUrlInput("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to add image");
      }
    });
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) { toast.error("Enter an image URL"); return; }
    if (!trimmed.startsWith("http")) { toast.error("Enter a valid URL starting with http"); return; }
    saveImages([trimmed]);
  };

  const handleSetCover = (imageId: string) => {
    startTransition(async () => {
      await setRoomCoverImage(roomId, imageId);
      toast.success("Cover image updated");
      router.refresh();
    });
  };

  const handleDelete = (imageId: string) => {
    if (!confirm("Remove this image?")) return;
    setDeletingId(imageId);
    startTransition(async () => {
      await deleteRoomImage(imageId);
      toast.success("Image removed");
      setDeletingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Image grid */}
      {images.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No images yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add photos to showcase this room</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square bg-accent">
              <Image
                src={img.url}
                alt={img.altText ?? "Room image"}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
              {/* Cover badge */}
              {img.isCover && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-gold-500 text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5" /> Cover
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isCover && (
                  <button
                    onClick={() => handleSetCover(img.id)}
                    disabled={isPending}
                    title="Set as cover"
                    className="w-8 h-8 rounded-full bg-gold-500 text-background flex items-center justify-center hover:bg-gold-400 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={isPending || deletingId === img.id}
                  title="Delete image"
                  className="w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-400 transition-colors"
                >
                  {deletingId === img.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add image panel */}
      {showAdd ? (
        <div className="card-luxury p-4 space-y-3">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {(["upload", "url"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setAddMode(m)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  addMode === m
                    ? "bg-gold-500/15 border-gold-500/30 text-gold-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "upload" ? <><Upload className="w-3 h-3" /> Upload file</> : <><Link2 className="w-3 h-3" /> Paste URL</>}
              </button>
            ))}
            <button onClick={() => setShowAdd(false)} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {addMode === "upload" ? (
            <div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInputChange}
                className="hidden"
              />
              <button
                onClick={pickFile}
                disabled={uploading || isPending}
                className="w-full py-8 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-gold-500/40 hover:text-foreground transition-all flex flex-col items-center gap-2 disabled:opacity-60"
              >
                {uploading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
                  : <><Upload className="w-5 h-5" /> Click to choose a photo (JPEG, PNG, WebP · max 10 MB)</>
                }
              </button>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Requires AWS S3 to be configured in environment variables.
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleUrlSubmit()}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 bg-surface-base border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50"
              />
              <button
                onClick={handleUrlSubmit}
                disabled={isPending}
                className="px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl disabled:opacity-60"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gold-500/30 text-gold-400 text-sm font-medium rounded-xl hover:border-gold-500/60 hover:bg-gold-500/5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Image
        </button>
      )}
    </div>
  );
}
