/** @type {import('next').NextConfig} */
const nextConfig = {

  // ─── Image Optimization ───────────────────────
  images: {
    remotePatterns: [
      // Cloudinary — primary image host
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Unsplash — placeholder images during dev
      { protocol: "https", hostname: "images.unsplash.com" },
      // WhatsApp / Facebook CDN (profile avatars)
      { protocol: "https", hostname: "**.fbcdn.net" },
      // Catch-all for admin-entered room image URLs (e.g. Google Photos, Drive)
      // Narrowed to https only — http images are never served via Next.js optimizer
      { protocol: "https", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7-day CDN cache
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
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
    // Next.js App Router injects inline <script> tags for hydration, so we must
    // allow 'unsafe-inline' for scripts. For style we must also allow 'unsafe-inline'
    // because Tailwind and CSS-in-JS emit inline styles.
    const ContentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // unsafe-eval needed by Next.js HMR in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com wss: ws:",
      "media-src 'self' https:",
      "frame-src 'self' https://www.google.com https://maps.google.com https://maps.googleapis.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy",   value: ContentSecurityPolicy },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",          value: "0" },            // deprecated; CSP takes over
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
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
      // Immutable cache for static assets (hashed filenames)
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
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
