// pages/api/admin/cache.js
import { requireAdmin } from "@/middleware/requireAuth";
import { getCacheStats, clearCache } from "@/lib/cache";

export default async function handler(req, res) {
    const admin = await await requireAdmin(req, res);
    if (!admin) return res.status(403).json({ error: "Forbidden" });

    if (req.method === "GET") return res.status(200).json(getCacheStats());
    if (req.method === "POST") { clearCache(); return res.status(200).json({ message: "Cache cleared" }); }
    return res.status(405).json({ error: "Method not allowed" });
}
