import { z } from "zod";
import { validate } from "@/middleware/validate";
import { formLimiter } from "@/lib/rateLimit";
import { getClientIp, sanitizeSearchQuery, sanitizeText } from "@/lib/security";
import { requireAuth } from "@/middleware/requireAuth";

const eventSchema = z.object({
  event: z.enum([
    // Existing
    "trailer_play", "save", "unsave", "search", "watch_now_click", "page_view",
    // Funnel
    "signup_completed", "onboarding_started", "onboarding_genres_picked",
    "onboarding_languages_picked", "onboarding_region_picked", "onboarding_completed",
    // Social
    "first_take_posted", "take_posted", "first_follow",
    // Retention
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = getClientIp(req);
  const limit = formLimiter(ip);
  if (!limit.allowed) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  const { success, data, error } = validate(eventSchema, req.body);
  if (!success) return res.status(400).json({ error });

  res.status(200).json({ ok: true });

  setImmediate(() => {
    try {
      const decoded = await requireAuth(req, res);
      const payload = {
        ...data,
        query: data.query ? sanitizeSearchQuery(data.query) : undefined,
        page: data.page ? sanitizeText(data.page, { maxLength: 120 }) : undefined,
        provider: data.provider ? sanitizeText(data.provider, { maxLength: 80 }) : undefined,
      };

      if (process.env.NODE_ENV === "development") {
        console.log("ANALYTICS_EVENT", { userId: decoded?.id, ...payload });
      }
    } catch {
      // Ignore analytics pipeline failures.
    }
  });
}
