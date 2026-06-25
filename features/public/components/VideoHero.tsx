"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Wifi, Snowflake, Shield, Clock, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { siteConfig } from "@/config/site";
import { CountUp } from "@/features/public/components/CountUp";

interface Props {
  branches:     { id: string; name: string; city: string }[];
  startingFrom?: number;
  totalGuests?:  number;
  avgRating?:    number;
}

export function VideoHero({ branches, startingFrom = 2000, totalGuests, avgRating }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const [muted, setMuted]     = useState(true);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().then(() => setPlaying(true)).catch(() => {});
  }, []);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(m => !m);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* â”€â”€ Video Background â”€â”€ */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
        src="/videos/hero.mp4"
        poster="/images/blogs/chakwal-travel-mountains-punjab.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        onCanPlay={() => setLoaded(true)}
      />

      {/* Fallback gradient if video not loaded yet */}
      <div className={`absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111827] to-[#0a0a0a] transition-opacity duration-1000 ${loaded ? "opacity-0" : "opacity-100"}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(201,168,76,0.15),transparent_60%)]" />
      </div>

      {/* Dark overlay on video */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      {/* Gold bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

      {/* Animated gold orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gold-500/8 rounded-full blur-2xl animate-pulse delay-1000" />

      {/* â”€â”€ Content â”€â”€ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold-400 bg-gold-500/10 border border-gold-500/30 px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
            Chakwal Â· Kallar Kahar Â· Sargodha
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-serif text-white leading-[1.05] mb-6">
            Your Home<br />
            Away From{" "}
            <span className="text-transparent bg-clip-text bg-gold-gradient">Home</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-white/75 leading-relaxed mb-8 max-w-2xl">
            Premium accommodation in Chakwal with clean rooms, fast WiFi, 24/7 service, and unbeatable value.
            Starting from just{" "}
            <strong className="text-gold-400 font-bold">PKR {startingFrom.toLocaleString("en-PK")} / night</strong>.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mb-10">
            {[
              { icon: Wifi,      label: "Free WiFi"    },
              { icon: Snowflake, label: "A/C Rooms"    },
              { icon: Shield,    label: "Safe & Secure" },
              { icon: Clock,     label: "24/7 Service" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-white/80 bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full">
                <Icon className="w-4 h-4 text-gold-400" />
                {label}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all hover:-translate-y-0.5 text-base"
            >
              Book Your Room â€” Free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/rooms"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base"
            >
              View All Rooms
            </Link>
            <a
              href={`${siteConfig.social.whatsappUrl}?text=Hi%2C%20I%27d%20like%20to%20book%20a%20room%20at%20Chakwal%20Grand%20Guest%20House`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#25D366]/20 backdrop-blur-sm border border-[#25D366]/40 text-[#25D366] font-semibold rounded-xl hover:bg-[#25D366]/30 transition-colors text-base"
            >
              WhatsApp Us
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8">
            {[
              { num: totalGuests ?? 500,        decimals: 0, suffix: "+", label: "Happy Guests"   },
              { num: avgRating ?? 4.8,          decimals: 1, suffix: "â˜…", label: "Average Rating" },
              { num: branches.length || 3,      decimals: 0, suffix: "",  label: "Prime Locations" },
              { text: "24/7",                                             label: "Support"         },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold font-serif text-gold-400">
                  {"text" in s
                    ? s.text
                    : <CountUp value={s.num} decimals={s.decimals} suffix={s.suffix} />}
                </p>
                <p className="text-xs text-white/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mute/unmute button */}
      {loaded && (
        <button
          onClick={toggleMute}
          className="absolute bottom-8 right-6 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label={muted ? "Unmute video" : "Mute video"}
        >
          {muted
            ? <VolumeX className="w-4 h-4 text-white" />
            : <Volume2 className="w-4 h-4 text-white" />
          }
        </button>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-gold-500/60 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
