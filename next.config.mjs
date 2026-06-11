/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Hostinger / standalone Node.js deployment
  output: "standalone",

  // ─── Image Optimization ───────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // ─── Experimental Features ────────────────────
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "chakwalgrand.pk", "www.chakwalgrand.pk"],
    },
    ppr: false,
  },

  // ─── Headers ──────────────────────────────────
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      {
        source: "/(dashboard)/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
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
