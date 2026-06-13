"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Link2, Trash2, Loader2, X, ImageIcon } from "lucide-react";
import { updateProductImage } from "@/server/actions/inventory";
import { useImageUpload } from "@/features/shared/hooks/useImageUpload";
import { cn } from "@/utils";

interface Props {
  productId:   string;
  productName: string;
  currentImage: string | null;
}

export function ProductImagePicker({ productId, productName, currentImage }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen]     = useState(false);
  const [mode, setMode]     = useState<"upload" | "url">("url");
  const [urlInput, setUrl]  = useState("");

  const saveImage = (url: string | null) => {
    startTransition(async () => {
      await updateProductImage(productId, url);
      toast.success(url ? "Image updated" : "Image removed");
      setOpen(false);
      setUrl("");
      router.refresh();
    });
  };

  const { uploading, pickFile, handleInputChange, inputRef } = useImageUpload({
    onUploaded: saveImage,
  });

  return (
    <div className="relative">
      {/* Thumbnail / placeholder */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-12 h-12 rounded-xl overflow-hidden bg-accent border border-border hover:border-gold-500/40 transition-colors flex-shrink-0 group"
        title="Change product image"
      >
        {currentImage ? (
          <img src={currentImage} alt={productName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground group-hover:text-gold-400 transition-colors">
            <ImageIcon className="w-5 h-5" />
          </div>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-14 z-20 w-72 card-luxury p-4 shadow-xl space-y-3 rounded-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Product Image</p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>

          {/* Mode */}
          <div className="flex gap-2">
            {(["url", "upload"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  mode === m
                    ? "bg-gold-500/15 border-gold-500/30 text-gold-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "url" ? <><Link2 className="w-3 h-3" /> URL</> : <><Upload className="w-3 h-3" /> Upload</>}
              </button>
            ))}
          </div>

          {mode === "url" ? (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && urlInput && saveImage(urlInput)}
                placeholder="https://…/photo.jpg"
                className="flex-1 bg-surface-base border border-border rounded-lg px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50"
              />
              <button
                onClick={() => urlInput && saveImage(urlInput)}
                disabled={isPending || !urlInput}
                className="px-3 py-2 bg-gold-gradient text-background text-xs font-bold rounded-lg disabled:opacity-60"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
              </button>
            </div>
          ) : (
            <div>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInputChange} className="hidden" />
              <button
                onClick={pickFile}
                disabled={uploading || isPending}
                className="w-full py-4 border-2 border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-gold-500/40 transition-all flex flex-col items-center gap-1 disabled:opacity-60"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Choose photo</>}
              </button>
            </div>
          )}

          {currentImage && (
            <button
              onClick={() => saveImage(null)}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Remove image
            </button>
          )}
        </div>
      )}
    </div>
  );
}
