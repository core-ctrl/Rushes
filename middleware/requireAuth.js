// middleware/requireAuth.js
// Use in API routes: const user = await requireAuth(req, res); if (!user) return res.status(401)...
import { getUserFromRequest } from "../lib/auth.js";
import { connectDB } from "../lib/mongodb.js";
import User from "../models/User.js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

// Returns decoded JWT payload (fast, no DB)
export async function requireAuth(req, res) {
    let decoded = getUserFromRequest(req);
    if (decoded && decoded.id) return decoded;
    
    if (res) {
        try {
            const session = await getServerSession(req, res, authOptions);
            if (session?.user?.id) {
                return { id: session.user.id };
            }
        } catch (e) {
            console.error("requireAuth next-auth error:", e);
        }
    }
    return null;
}

// Returns full user from DB (slower, use only when needed)
export async function requireAuthFull(req, res) {
    const decoded = await requireAuth(req, res);
    if (!decoded) return null;
    await connectDB();
    return User.findById(decoded.id).select("-password");
}

// Returns user only if admin
export async function requireAdmin(req, res) {
    const user = await requireAuthFull(req, res);
    if (!user?.isAdmin) return null;
    return user;
}
