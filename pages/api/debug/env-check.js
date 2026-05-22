export default function handler(req, res) {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).end();
  }

  res.json({
    mongodb: !!process.env.MONGODB_URI,
    nextauth_secret: !!process.env.NEXTAUTH_SECRET,
    nextauth_url: process.env.NEXTAUTH_URL,
    google_configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github_configured: !!((process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID) && process.env.GITHUB_CLIENT_SECRET),
    supabase_configured: !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ),
    gmail_configured: !!(
      (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
      (process.env.SMTP_USER && process.env.SMTP_PASS)
    ),
    tmdb_configured: !!(process.env.NEXT_PUBLIC_TMDB_KEY || process.env.TMDB_API_KEY),
    app_url: process.env.NEXT_PUBLIC_APP_URL,
  });
}
