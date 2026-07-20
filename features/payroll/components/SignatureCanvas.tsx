"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Eraser, PenLine } from "lucide-react";

interface SignatureCanvasProps {
  onChange: (dataUrl: string | null) => void;
  label?: string;
}

export function SignatureCanvas({ onChange, label = "Staff Signature" }: SignatureCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const drawing    = useRef(false);
  const hasStrokes = useRef(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#d4a853";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasStrokes.current = true;
  }

  const endDraw = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    if (hasStrokes.current) {
      setSigned(true);
      onChange(canvasRef.current!.toDataURL("image/png"));
    }
  }, [onChange]);

  function clear() {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    setSigned(false);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <PenLine className="w-3.5 h-3.5" />
          {label}
        </label>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Eraser className="w-3 h-3" />
          Clear
        </button>
      </div>

      <div className={`rounded-xl border-2 transition-colors overflow-hidden ${
        signed ? "border-gold-500/50" : "border-border hover:border-gold-500/30"
      }`}>
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full touch-none cursor-crosshair"
          style={{ display: "block" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      <p className="text-2xs text-muted-foreground">
        {signed ? "✓ Signature captured" : "Draw signature above using mouse or touch"}
      </p>
    </div>
  );
}
