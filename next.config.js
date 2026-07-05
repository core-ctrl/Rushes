const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const isProduction = process.env.NODE_ENV === "production";
const adminPanelUrl = process.env.ADMIN_PANEL_URL || "http://localhost:3002";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://partner.googleadservices.com https://www.youtube.com https://www.youtube-nocookie.com https://www.clarity.ms https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://wsrv.nl https://image.tmdb.org https://www.themoviedb.org https://i.ytimg.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://images.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://secure.gravatar.com https://api.dicebear.com https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.themoviedb.org https://nominatim.openstreetmap.org https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com https://pagead2.googlesyndication.com https://*.googleapis.com https://*.firebaseio.com https://rushes-watchtogether.onrender.com wss://rushes-watchtogether.onrender.com https://rushes-call.onrender.com wss://rushes-call.onrender.com https://*.onrender.com wss://*.onrender.com wss: ws:",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://googleads.g.doubleclick.net",
  "media-src 'self' data: blob: https://www.youtube.com https://www.youtube-nocookie.com",
  isProduction ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  images: {
    unoptimized: true,
    domains: ["image.tmdb.org"],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "www.themoviedb.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  async redirects() {
    return [
      { source: "/admin", destination: adminPanelUrl, permanent: false },
      { source: "/admin/:path*", destination: `${adminPanelUrl}/:path*`, permanent: false },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/terms", destination: "/terms-and-conditions", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self), display-capture=(self)" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        ],
      },
      {
        source: "/api/media/(.*)",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=1800, stale-while-revalidate=86400" }],
      },
      {
        source: "/api/trending",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=3600" }],
      },
      {
        source: "/api/search/autocomplete",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=900" }],
      },
      {
        source: "/blog/:slug*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
