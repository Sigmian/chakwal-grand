"use client";

// ============================================================
// Grand Opening Fireworks — full-screen canvas celebration
// Shows once per browser session (localStorage key: cgh_grand_opening_seen)
// Auto-dismisses after 9 seconds. Click anywhere to dismiss early.
// ============================================================

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "cgh_grand_opening_seen_v1";

// Expire on: 2026-08-01 (after Grand Opening period)
const EXPIRES_AT = new Date("2026-08-01T00:00:00+05:00");

export function GrandOpeningFireworks() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef<number>(0);
  const [visible, setVisible] = useState(false);

  const dismiss = () => {
    setVisible(false);
    cancelAnimationFrame(rafRef.current);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  };

  useEffect(() => {
    // Don't show after expiry date
    if (new Date() >= EXPIRES_AT) return;
    // Don't show if already seen this session
    try { if (localStorage.getItem(STORAGE_KEY)) return; } catch {}

    setVisible(true);

    // Auto-dismiss after 9 seconds
    const autoTimer = setTimeout(dismiss, 9000);
    return () => clearTimeout(autoTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Types ──────────────────────────────────────────────────
    interface Tail { x: number; y: number; alpha: number }

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      alpha: number; color: string; size: number;
      gravity: number; drag: number;
      glitter: boolean; tail: Tail[];
      update: () => void;
      draw: (c: CanvasRenderingContext2D) => void;
    }

    interface Rocket {
      x: number; y: number; vy: number;
      targetY: number; color: string;
      trail: { x: number; y: number }[];
      exploded: boolean; delay: number;
      update: (ps: Particle[]) => void;
      draw: (c: CanvasRenderingContext2D) => void;
    }

    interface Flash { x: number; y: number; r: number; alpha: number }

    const COLORS = [
      "255,80,30",   // orange-red
      "255,200,0",   // gold
      "255,50,120",  // pink
      "80,200,255",  // cyan
      "160,80,255",  // purple
      "50,230,100",  // green
      "255,255,100", // yellow
    ];
    const rndColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

    const flashes: Flash[] = [];

    const makeParticle = (x: number, y: number, color: string): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      const p: Particle = {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        alpha: 1,
        color,
        size: 2 + Math.random() * 3,
        gravity: 0.08 + Math.random() * 0.04,
        drag: 0.97,
        glitter: Math.random() > 0.5,
        tail: [],
        update() {
          this.tail.push({ x: this.x, y: this.y, alpha: this.alpha });
          if (this.tail.length > 6) this.tail.shift();
          this.vx *= this.drag;
          this.vy  = this.vy * this.drag + this.gravity;
          this.x  += this.vx;
          this.y  += this.vy;
          this.alpha -= 0.013;
          if (this.glitter) this.alpha -= Math.random() * 0.01;
        },
        draw(c) {
          for (let i = 0; i < this.tail.length; i++) {
            const t = this.tail[i];
            const a = t.alpha * (i / this.tail.length) * 0.4;
            c.beginPath();
            c.arc(t.x, t.y, this.size * 0.6, 0, Math.PI * 2);
            c.fillStyle = `rgba(${this.color},${a})`;
            c.fill();
          }
          c.beginPath();
          c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          c.fillStyle = `rgba(${this.color},${this.alpha})`;
          c.fill();
          if (this.glitter && Math.random() > 0.7) {
            c.beginPath();
            c.arc(this.x, this.y, this.size * 1.8, 0, Math.PI * 2);
            c.fillStyle = `rgba(255,255,255,${this.alpha * 0.3})`;
            c.fill();
          }
        },
      };
      return p;
    };

    const explode = (x: number, y: number, color: string, ps: Particle[]) => {
      const count = 80 + Math.floor(Math.random() * 60);
      for (let i = 0; i < count; i++) ps.push(makeParticle(x, y, color));
      for (let i = 0; i < 20; i++) {
        const p = makeParticle(x, y, "255,215,0");
        p.size = 1.5; p.vx *= 1.5; p.vy *= 1.5; p.alpha = 0.8;
        ps.push(p);
      }
      flashes.push({ x, y, r: 0, alpha: 0.8 });
    };

    const makeRocket = (ps: Particle[]): Rocket => {
      const color = rndColor();
      const r: Rocket = {
        x: canvas.width * (0.1 + Math.random() * 0.8),
        y: canvas.height + 10,
        vy: -(9 + Math.random() * 7),
        targetY: canvas.height * (0.08 + Math.random() * 0.45),
        color, trail: [], exploded: false,
        delay: Math.floor(Math.random() * 60),
        update(p) {
          if (this.delay > 0) { this.delay--; return; }
          if (this.exploded) return;
          this.trail.push({ x: this.x, y: this.y });
          if (this.trail.length > 14) this.trail.shift();
          this.vy += 0.12;
          this.y  += this.vy;
          if (this.y <= this.targetY || this.vy >= 0) {
            this.exploded = true;
            this.trail = [];
            explode(this.x, this.y, this.color, p);
          }
        },
        draw(c) {
          if (this.delay > 0 || this.exploded) return;
          for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const a = (i / this.trail.length) * 0.9;
            c.beginPath();
            c.arc(t.x, t.y, 2.5 * (i / this.trail.length), 0, Math.PI * 2);
            c.fillStyle = `rgba(${this.color},${a})`;
            c.fill();
          }
          c.beginPath();
          c.arc(this.x, this.y, 3, 0, Math.PI * 2);
          c.fillStyle = "rgba(255,255,230,0.95)";
          c.fill();
        },
      };
      return r;
    };

    const particles: Particle[] = [];
    const rockets:   Rocket[]   = [];
    let spawnTimer    = 0;
    let spawnInterval = 30;

    const spawn = () => {
      rockets.push(makeRocket(particles));
      if (Math.random() > 0.55) rockets.push(makeRocket(particles));
      if (Math.random() > 0.8)  rockets.push(makeRocket(particles));
    };

    // Initial burst
    for (let i = 0; i < 5; i++) spawn();

    const loop = () => {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Flash rings
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.r += 14; f.alpha -= 0.06;
        if (f.alpha <= 0) { flashes.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,235,160,${f.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        rockets[i].update(particles);
        rockets[i].draw(ctx);
        if (rockets[i].exploded) rockets.splice(i, 1);
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].alpha <= 0) particles.splice(i, 1);
      }

      spawnTimer++;
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnInterval = 25 + Math.floor(Math.random() * 40);
        spawn();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] cursor-pointer"
      onClick={dismiss}
      aria-label="Grand Opening celebration — click to dismiss"
    >
      {/* Dark canvas background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "rgba(0,0,12,0.92)" }}
      />

      {/* Central banner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <div
          className="relative px-10 py-8 rounded-2xl text-center"
          style={{
            background: "linear-gradient(135deg, #6b1f00, #c94800, #ff6a00)",
            border: "3px solid #ffd700",
            boxShadow: "0 0 60px rgba(255,140,0,0.7), 0 0 120px rgba(255,60,0,0.35)",
            animation: "cgh-pulse 2s ease-in-out infinite",
          }}
        >
          <p className="text-4xl mb-1">🎇</p>
          <h1
            className="text-3xl font-bold tracking-widest mb-1"
            style={{ color: "#ffd700", textShadow: "0 0 24px rgba(255,215,0,0.8)", fontFamily: "Georgia, serif" }}
          >
            Grand Opening
          </h1>
          <h2
            className="text-base font-semibold tracking-[0.3em] uppercase mb-3"
            style={{ color: "#ffe8a0" }}
          >
            Chakwal Guest House
          </h2>
          <p className="text-sm tracking-widest" style={{ color: "#ffcc88" }}>
            Madina Town Branch — Now Open!
          </p>
          <div className="mt-4 flex justify-center gap-3 flex-wrap">
            <span
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: "#ffd700", color: "#7c2900" }}
            >
              🔥 50% OFF Opening Special
            </span>
          </div>
          <p className="text-xs mt-4 opacity-60" style={{ color: "#ffcc88" }}>
            Tap anywhere to continue
          </p>
        </div>
      </div>

      <style>{`
        @keyframes cgh-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
