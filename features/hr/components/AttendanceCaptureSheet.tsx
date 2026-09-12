"use client";

// ============================================================
// features/hr/components/AttendanceCaptureSheet.tsx
// Guided selfie + location capture before a check-in / check-out.
// Live front-camera preview with capture/retake, downscaled JPEG
// (kept well under the server's 2 MB cap), and a location step.
// Falls back to the native camera file-picker if getUserMedia is
// unavailable or blocked. Server still re-verifies both.
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin, Camera, Check, X, Loader2, RefreshCw, AlertTriangle, LogIn, LogOut,
} from "lucide-react";
import { cn } from "@/utils";

export interface PresencePayload { lat?: number; lng?: number; selfie?: string }

type GeoState = "idle" | "loading" | "done" | "error";
type CamState = "idle" | "starting" | "live" | "captured" | "error";

const MAX_DIM = 720;     // longest edge of the stored selfie
const JPEG_QUALITY = 0.72;

// Draw a video frame or image onto a canvas, scaled so the longest edge
// is MAX_DIM, and return a compact JPEG data URL.
function toScaledJpeg(src: HTMLVideoElement | HTMLImageElement, w: number, h: number): string {
  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export function AttendanceCaptureSheet({
  mode, require, pending, onCancel, onSubmit,
}: {
  mode: "in" | "out";
  require: { selfie: boolean; geo: boolean };
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: PresencePayload) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [geo, setGeo] = useState<GeoState>(require.geo ? "loading" : "done");
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const coords = useRef<{ lat: number; lng: number } | null>(null);

  const [cam, setCam] = useState<CamState>(require.selfie ? "starting" : "done" as CamState);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  // ── location ──────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeo("error"); setGeoErr("This device can't share its location.");
      return;
    }
    setGeo("loading"); setGeoErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { coords.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setGeo("done"); },
      (err) => {
        setGeo("error");
        setGeoErr(err.code === err.PERMISSION_DENIED
          ? "Location access was blocked. Please allow it and retry."
          : "Couldn't get your location. Move to an open area and retry.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, []);

  // ── camera ────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCam("starting"); setCamErr(null); setSelfie(null);
    if (!navigator.mediaDevices?.getUserMedia) { setCam("error"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) { v.srcObject = stream; await v.play().catch(() => {}); }
      setCam("live");
    } catch {
      setCam("error");
      setCamErr("Camera unavailable. You can take a photo instead.");
    }
  }, []);

  const capture = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    setSelfie(toScaledJpeg(v, v.videoWidth, v.videoHeight));
    setCam("captured");
    stopCamera();
  }, [stopCamera]);

  // Native file-picker fallback (opens the OS camera on mobile).
  const onPickFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSelfie(toScaledJpeg(img, img.naturalWidth, img.naturalHeight));
      setCam("captured");
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); setCamErr("Couldn't read that photo. Try again."); };
    img.src = url;
  }, []);

  // Kick off required steps on mount; tear the camera down on unmount.
  useEffect(() => {
    if (require.geo) requestLocation();
    if (require.selfie) startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const geoReady = !require.geo || geo === "done";
  const selfieReady = !require.selfie || !!selfie;
  const canSubmit = geoReady && selfieReady && !pending;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      lat: coords.current?.lat, lng: coords.current?.lng,
      selfie: selfie ?? undefined,
    });
  };

  const close = () => { stopCamera(); onCancel(); };

  const title = mode === "in" ? "Confirm check-in" : "Confirm check-out";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/12 bg-[#12151a]/97 p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold">{title}</h3>
          <button onClick={close} className="rounded-lg p-1.5 text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        {/* ── Location step ── */}
        {require.geo && (
          <div className="mb-4">
            <StepHead icon={<MapPin className="h-3.5 w-3.5" />} label="Location" done={geo === "done"} />
            <div className={cn(
              "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm",
              geo === "done" ? "border-green-500/25 bg-green-500/10 text-green-300"
                : geo === "error" ? "border-red-500/25 bg-red-500/10 text-red-300"
                : "border-white/12 bg-white/[0.04] text-white/70",
            )}>
              {geo === "loading" && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
              {geo === "done" && <Check className="h-4 w-4 flex-shrink-0" />}
              {geo === "error" && <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
              <span className="flex-1">
                {geo === "loading" && "Getting your location…"}
                {geo === "done" && "Location confirmed"}
                {geo === "error" && (geoErr ?? "Location unavailable")}
              </span>
              {geo === "error" && (
                <button onClick={requestLocation} className="flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10">
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Selfie step ── */}
        {require.selfie && (
          <div className="mb-4">
            <StepHead icon={<Camera className="h-3.5 w-3.5" />} label="Attendance photo" done={!!selfie} />
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-black">
              <div className="relative aspect-[3/4] w-full">
                {/* live preview */}
                <video
                  ref={videoRef} playsInline muted
                  className={cn("h-full w-full object-cover -scale-x-100", cam === "live" ? "block" : "hidden")}
                />
                {/* captured still */}
                {selfie && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selfie} alt="Attendance selfie" className="h-full w-full -scale-x-100 object-cover" />
                )}
                {/* starting / error placeholders */}
                {cam === "starting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
                    <Loader2 className="h-6 w-6 animate-spin" /><span className="text-xs">Starting camera…</span>
                  </div>
                )}
                {cam === "error" && !selfie && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/60">
                    <AlertTriangle className="h-6 w-6 text-amber-300" />
                    <span className="text-xs">{camErr ?? "Camera unavailable."}</span>
                  </div>
                )}
              </div>

              {/* camera controls */}
              <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-white/[0.03] p-3">
                {cam === "live" && (
                  <button onClick={capture}
                    className="flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-bold text-background active:scale-95">
                    <Camera className="h-4 w-4" /> Capture
                  </button>
                )}
                {selfie && (
                  <button onClick={startCamera}
                    className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
                    <RefreshCw className="h-4 w-4" /> Retake
                  </button>
                )}
                {cam === "error" && !selfie && (
                  <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-bold text-background active:scale-95">
                    <Camera className="h-4 w-4" /> Take a photo
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileRef} type="file" accept="image/*" capture="user" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ""; }}
            />
            <p className="mt-2 text-[11px] text-white/40">Your photo is stored with today&apos;s attendance so your manager can verify it was you.</p>
          </div>
        )}

        {/* ── Submit ── */}
        <button onClick={submit} disabled={!canSubmit}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] disabled:opacity-50",
            mode === "in" ? "bg-gold-gradient text-background" : "border border-white/20 bg-white/10 text-white",
          )}>
          {pending ? <Loader2 className="h-5 w-5 animate-spin" />
            : mode === "in" ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
          {mode === "in" ? "Check In" : "Check Out"}
        </button>
        {!canSubmit && !pending && (
          <p className="mt-2 text-center text-[11px] text-white/45">
            {!geoReady ? "Waiting for your location…" : "Take your attendance photo to continue."}
          </p>
        )}
      </div>
    </div>
  );
}

function StepHead({ icon, label, done }: { icon: React.ReactNode; label: string; done: boolean }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full",
        done ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50")}>
        {done ? <Check className="h-3 w-3" /> : icon}
      </span>
      <span className={done ? "text-green-300" : "text-white/50"}>{label}</span>
    </div>
  );
}
