const express = require('express');
const router = express.Router();
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { formLimiter } = require("../lib/rateLimit");
const { getClientIp, sanitizeSearchQuery, sanitizeText } = require("../lib/security");

const eventSchema = z.object({
  event: z.enum([
    "trailer_play", "save", "unsave", "search", "watch_now_click", "page_view",
    "signup_completed", "onboarding_started", "onboarding_genres_picked",
    "onboarding_languages_picked", "onboarding_region_picked", "onboarding_completed",
    "first_take_posted", "take_posted", "first_follow",
    "returned_day_2", "returned_day_7",
  ]),
  mediaId: z.number().optional(),
  mediaType: z.string().optional(),
  query: z.string().optional(),
  page: z.string().optional(),
  provider: z.string().optional(),
  userId: z.string().optional(),
  count: z.number().optional(),
  genres_picked: z.number().optional(),
  languages_picked: z.number().optional(),
  platforms_picked: z.number().optional(),
  region: z.string().optional(),
});

router.post('/event', async (req, res) => {
  const ip = getClientIp(req);
  const limit = formLimiter(ip);
  if (!limit.allowed) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  const { success, data, error } = validate(eventSchema, req.body);
  if (!success) return res.status(400).json({ error });

  res.status(200).json({ ok: true });

  setImmediate(async () => {
    try {
      const jwt = require("jsonwebtoken");
      let decoded;
      const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {}
      }

      const payload = {
        ...data,
        query: data.query ? sanitizeSearchQuery(data.query) : undefined,
        page: data.page ? sanitizeText(data.page, { maxLength: 120 }) : undefined,
        provider: data.provider ? sanitizeText(data.provider, { maxLength: 80 }) : undefined,
      };

      if (process.env.NODE_ENV === "development") {
        console.log("ANALYTICS_EVENT", { userId: decoded?.id, ...payload });
      }
    } catch (err) {
      // Ignore analytics pipeline failures
    }
  });
});

module.exports = router;
