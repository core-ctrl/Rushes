const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const yts = require('yt-search');
const axios = require('axios');

const { connectDB } = require('../lib/mongodb');
const { rateLimit } = require('../lib/rateLimit');
const { getClientIp, sanitizeSearchQuery } = require('../lib/security');
const { getCached } = require('../lib/redis');
const { fetchVideos, fetchDetails } = require('../lib/tmdb');
const { decideForMe, getRecommendations, getBecauseYouWatched, getHiddenGems } = require('../services/recommendationService');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.GMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
  },
});

// GET /api/misc/health
router.get('/health', async (req, res) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      status: 'maintenance',
      message: process.env.MAINTENANCE_MESSAGE || 'We\'re making Rushes even better. Back soon!',
      estimatedTime: process.env.MAINTENANCE_ETA || null,
    });
  }

  try {
    await connectDB();
    res.json({
      status: 'ok',
      message: 'All systems operational',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      message: 'Some services are experiencing issues. We\'re on it.',
    });
  }
});

// POST /api/misc/contact
router.post('/contact', async (req, res) => {
  const ip = getClientIp(req) || 'unknown';
  try {
    await rateLimit(`contact:${ip}`, 5, 3600);
  } catch (limitErr) {
    return res.status(429).json({ error: limitErr.message });
  }

  const { name, email, subject, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  try {
    await transporter.sendMail({
      from: `"Rushes Contact" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
      to: process.env.SMTP_USER || process.env.GMAIL_USER,
      replyTo: email,
      subject: `[Rushes Contact] ${subject || 'General Enquiry'} — from ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;">
          <h2 style="color:#E63946;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border-color:#eee;" />
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap;">${message}</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact email error:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// POST /api/misc/feedback
router.post('/feedback', async (req, res) => {
  const ip = getClientIp(req) || 'unknown';
  try {
    await rateLimit(`feedback:${ip}`, 10, 3600);
  } catch (limitErr) {
    return res.status(429).json({ error: limitErr.message });
  }

  const { type = 'other', message, userId, userEmail } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!['bug', 'idea', 'other'].includes(type)) {
    return res.status(400).json({ error: 'Invalid feedback type' });
  }

  try {
    await connectDB();

    const feedback = await Feedback.create({
      type,
      message: message.trim(),
      userId: userId || null,
      userEmail: userEmail || null,
      createdAt: new Date(),
      status: 'new',
    });

    // Notify admin
    const adminEmail = process.env.SMTP_USER || process.env.GMAIL_USER;
    if (adminEmail) {
      const typeEmoji = type === 'bug' ? '🐛' : type === 'idea' ? '💡' : '💬';
      transporter.sendMail({
        from: `"Rushes Feedback" <${adminEmail}>`,
        to: adminEmail,
        subject: `${typeEmoji} New ${type} feedback on Rushes`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;">
            <h2 style="color:#E63946;">${typeEmoji} New ${type.charAt(0).toUpperCase() + type.slice(1)} Feedback</h2>
            <p>${message}</p>
            <hr style="border-color:#eee;" />
            <p style="color:#999;font-size:12px;">
              User: ${userId || 'anonymous'}<br/>
              Email: ${userEmail || 'not provided'}
            </p>
          </div>
        `,
      }).catch(() => {});
    }

    res.json({ success: true, id: feedback._id.toString() });
  } catch (err) {
    console.error('Feedback API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function parseGuestProfile(query) {
  const genres = String(query.genres || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
  const languages = String(query.languages || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const regions = String(query.regions || "IN")
    .split(",")
    .map((item) => sanitizeSearchQuery(item).toUpperCase())
    .filter(Boolean);

  return {
    preferredGenres: genres,
    preferredLanguages: languages,
    preferredRegions: regions.length ? regions : ["IN"],
    watchHistory: [],
  };
}

// GET & POST /api/misc/decide
const handleDecide = async (req, res) => {
  try {
    const jwt = require("jsonwebtoken");
    let decoded;
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {}
    }

    let user = null;
    if (decoded) {
      await connectDB();
      user = await User.findById(decoded.id).select(
        "preferredGenres preferredLanguages preferredRegions preferredRegionGroup allowLocationRecommendations watchHistory wishlist"
      );
    }

    const queryParams = { ...req.query, ...req.body };
    const picks = await decideForMe(user || parseGuestProfile(queryParams), {
      provider: typeof queryParams.provider === "string" ? sanitizeSearchQuery(queryParams.provider) : "",
    });

    res.setHeader("Cache-Control", "private, s-maxage=180");
    return res.status(200).json({ picks });
  } catch (err) {
    console.error("DECIDE_ERROR:", err);
    return res.status(500).json({ error: "Failed to decide what to watch" });
  }
};

router.get('/decide', handleDecide);
router.post('/decide', handleDecide);

// GET /api/misc/trailer
router.get('/trailer', async (req, res) => {
  const { id, media_type } = req.query;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const videos = await fetchVideos(id, media_type || "movie");
    let trailer = videos.length > 0 ? videos[0] : null;

    if (!trailer) {
      const details = await fetchDetails(id, media_type || "movie");
      const title = details.title || details.name;
      const year = (details.release_date || details.first_air_date || "").slice(0, 4);
      
      if (title) {
        const query = `${title} ${year} official trailer OR official teaser`;
        try {
          const r = await yts(query);
          if (r && r.videos && r.videos.length > 0) {
            const topResult = r.videos[0];
            trailer = {
              key: topResult.videoId,
              name: topResult.title,
              site: "YouTube",
              type: "Trailer"
            };
          }
        } catch (searchErr) {
          console.error("YouTube search fallback failed:", searchErr);
        }
      }
    }

    return res.status(200).json({ trailer, videos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// GET /api/misc/preview
router.get('/preview', async (req, res) => {
  try {
    const { id, media = "movie" } = req.query;
    const videos = await fetchVideos(id, media);
    const best = videos[0];
    return res.status(200).json({ key: best ? best.key : null });
  } catch (err) {
    console.error("PREVIEW_API_ERROR:", err.message);
    res.status(500).json({ key: null });
  }
});

// GET /api/misc/genres
router.get('/genres', async (req, res) => {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;

    const genres = await getCached('tmdb:genres', async () => {
      const [moviesRes, tvRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`),
        axios.get(`https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}&language=en-US`)
      ]);

      const map = new Map();
      moviesRes.data.genres.forEach(g => map.set(g.id, { ...g, type: 'movie' }));
      tvRes.data.genres.forEach(g => {
        if (!map.has(g.id)) map.set(g.id, { ...g, type: 'tv' });
        else map.set(g.id, { ...g, type: 'both' });
      });

      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, 86400 * 7);

    res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=86400');
    res.status(200).json({ genres });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/misc/recommendations
function parseOttFilters(query) {
  return {
    availableOnly: query.availableOnly === "true",
    access: ["all", "free", "paid"].includes(query.access) ? query.access : "all",
    provider: typeof query.provider === "string" ? sanitizeSearchQuery(query.provider) : "",
  };
}

function limitDailyPicks(recs) {
  return {
    ...recs,
    movies: [...(recs.movies || [])]
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 5),
    series: [...(recs.series || [])]
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 5),
  };
}

router.get('/recommendations', async (req, res) => {
  const jwt = require("jsonwebtoken");
  let decoded;
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {}
  }

  if (!decoded) {
    return res.status(401).json({
      error: "Login required",
      locked: true,
      message: "Sign in to unlock personalized recommendations.",
    });
  }

  try {
    await connectDB();
    const user = await User.findById(decoded.id).select(
      "preferredGenres preferredLanguages preferredRegions preferredRegionGroup allowLocationRecommendations watchHistory wishlist"
    );

    const isDaily = req.query.daily === "true";

    let recs;
    if (isDaily) {
      recs = await getRecommendations(user, { daily: true, ott: parseOttFilters(req.query) });
      res.setHeader("Cache-Control", "private, s-maxage=900");
      return res.status(200).json(limitDailyPicks(recs));
    }

    const [recsRegular, byw, gems] = await Promise.all([
      getRecommendations(user, { ott: parseOttFilters(req.query) }),
      getBecauseYouWatched(user),
      getHiddenGems(user.preferredGenres),
    ]);

    res.setHeader("Cache-Control", "private, s-maxage=300");
    return res.status(200).json({
      type: recsRegular.source,
      movies: recsRegular.movies,
      tv: recsRegular.tv,
      becauseYouWatched: byw,
      hiddenGems: gems,
    });
  } catch (err) {
    console.error("RECS_ERROR:", err);
    return res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

module.exports = router;
