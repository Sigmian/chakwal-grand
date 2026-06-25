/** @type {import('next').NextConfig} */
const nextConfig = {

  // ─── Image Optimization ───────────────────────
  images: {
    remotePatterns: [
      // Allow any https image URL — needed for room images added via URL in admin
      {
        protocol: "https",
        hostname: "**",
      },
      // http fallback for local/dev images
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // ─── Experimental Features ────────────────────
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "chakwalgrand.pk", "www.chakwalgrand.pk",
        "staychakwal.de",  "www.staychakwal.de",
      ],
    },
    ppr: false,
  },

  // ─── Headers ──────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },

  // ─── Redirects ────────────────────────────────
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },

  // ─── Webpack ──────────────────────────────────
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },

  // ─── Logging ──────────────────────────────────
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default nextConfig;
