"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Link2, Trash2, Star, Plus, Loader2, ImageIcon, ChevronDown, ChevronUp, X } from "lucide-react";
import { addRoomImages, setRoomCoverImage, deleteRoomImage } from "@/server/actions/rooms";
import { useImageUpload } from "@/features/shared/hooks/useImageUpload";
import { cn } from "@/utils";

interface RoomImage { id: string; url: string; altText: string | null; isCover: boolean }
interface Room      { id: string; name: string; number: string; type: string; images: RoomImage[] }
interface Props     { rooms: Room[]; canEdit: boolean }

const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic", DELUXE: "Executive", SUITE: "Suite", FAMILY: "Family", VIP: "VIP",
};

function RoomSection({ room, canEdit }: { room: Room; canEdit: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(true);
  const [addMode, setAddMode]   = useState<"upload" | "url" | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { uploading, pickFile, handleInputChange, inputRef, isConfigured } = useImageUpload({
    onUploaded: (url) => {
      save([url]);
    },
  });

  const save = (urls: string[]) => {
    startTransition(async () => {
      const res = await addRoomImages(room.id, urls);
      if (res.success) {
        toast.success("Photo added!");
        setAddMode(null);
        setUrlInput("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const submitUrl = () => {
    const u = urlInput.trim();
    if (!u.startsWith("http")) { toast.error("Enter a valid URL"); return; }
    save([u]);
  };

  const makeCover = (imgId: string) => {
    startTransition(async () => {
      await setRoomCoverImage(room.id, imgId);
      toast.success("Cover photo set");
      router.refresh();
    });
  };

  const remove = (imgId: string) => {
    if (!confirm("Remove this photo?")) return;
    setDeletingId(imgId);
    startTransition(async () => {
      await deleteRoomImage(imgId);
      toast.success("Photo removed");
      setDeletingId(null);
      router.refresh();
    });
  };

  return (
    <div className="card-luxury rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gold-500/15 flex items-center justify-center text-sm font-bold text-gold-400">
            {room.number}
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground">{room.name}</p>
            <p className="text-xs text-muted-foreground">{TYPE_LABEL[room.type] ?? room.type} · {room.images.length} photo{room.images.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/50">
          {/* Photo grid */}
          {room.images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-4">
              {room.images.map(img => (
                <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-accent">
                  <img src={img.url} alt={img.altText ?? room.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  {img.isCover && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-gold-500 text-background text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      <Star className="w-2 h-2" /> Cover
                    </div>
                  )}
                  {canEdit && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.isCover && (
                        <button onClick={() => makeCover(img.id)} disabled={isPending} title="Set as cover" className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center">
                          <Star className="w-3 h-3 text-background" />
                        </button>
                      )}
                      <button onClick={() => remove(img.id)} disabled={isPending} title="Delete" className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                        {deletingId === img.id ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Trash2 className="w-3 h-3 text-white" />}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-4 text-center py-8 border border-dashed border-border rounded-xl">
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No photos yet</p>
            </div>
          )}

          {/* Add photo controls */}
          {canEdit && (
            <div>
              {addMode === null ? (
                <div className="flex gap-2">
                  {isConfigured && (
                    <button
                      onClick={() => { setAddMode("upload"); setTimeout(pickFile, 50); }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gold-500/30 text-gold-400 rounded-xl hover:bg-gold-500/10 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Photo
                    </button>
                  )}
                  <button
                    onClick={() => setAddMode("url")}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border text-muted-foreground rounded-xl hover:text-foreground hover:border-gold-500/30 transition-all"
                  >
                    <Link2 className="w-3.5 h-3.5" /> Add by URL
                  </button>
                </div>
              ) : addMode === "upload" ? (
                <div className="flex items-center gap-2">
                  <input ref={inputRef} type="file" accept="image/*" onChange={e => { handleInputChange(e); setAddMode(null); }} className="hidden" />
                  {uploading
                    ? <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</span>
                    : <button onClick={pickFile} className="text-xs text-gold-400">Choose file…</button>
                  }
                  <button onClick={() => setAddMode(null)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") submitUrl(); if (e.key === "Escape") setAddMode(null); }}
                    placeholder="Paste image URL and press Enter…"
                    className="flex-1 bg-surface-base border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50"
                  />
                  <button onClick={submitUrl} disabled={isPending || !urlInput} className="px-3 py-2 bg-gold-gradient text-background text-xs font-bold rounded-xl disabled:opacity-50">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                  </button>
                  <button onClick={() => setAddMode(null)} className="text-muted-foreground px-1"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GalleryManager({ rooms, canEdit }: Props) {
  const totalPhotos = rooms.reduce((s, r) => s + r.images.length, 0);

  if (rooms.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-12">No rooms found. Add rooms first.</p>;
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-sm text-blue-400">
          <strong>How to add photos:</strong> Expand any room below → click <strong>"Upload Photo"</strong> to upload from your device (requires Cloudinary setup), or <strong>"Add by URL"</strong> to paste any image link — no setup needed.
        </div>
      )}
      {rooms.map(room => (
        <RoomSection key={room.id} room={room} canEdit={canEdit} />
      ))}
    </div>
  );
}
