import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";
import { getDailyPicks } from "../../../services/recommendationService";
import { sendDecisionAlertEmail } from "../../../lib/mailer";

// Only runs on Vercel cron (POST to /api/jobs/daily-picks)
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST (cron)" });
    }

    try {
        await connectDB();

        // Find active users (last login/activity < 7 days, email notifications on)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const users = await User.find({
            // Has preferences
            $or: [
                { "preferredGenres.0": { $exists: true } },
                { "preferredLanguages.0": { $exists: true } },
                { "preferredRegions.0": { $exists: true } },
            ],
            // Email notifications enabled
            "notificationSettings.email": true,
            // Recent activity
            updatedAt: { $gt: sevenDaysAgo },
        }).select("name email preferredRegions.0").limit(100);

        console.log(`📧 Sending daily picks to ${users.length} users`);

        const results = [];
        for (const user of users) {
            try {
                const picks = await getDailyPicks(user);
                if (picks.movies.length === 0 && picks.series.length === 0) continue;

                await sendDailyPicksEmail(user.email, user.name, picks);

                results.push({ user: user.email, success: true });
            } catch (userError) {
                console.error(`Failed for ${user.email}:`, userError.message);
                results.push({ user: user.email, success: false, error: userError.message });
            }
        }

        res.status(200).json({
            success: true,
            processed: users.length,
            results: results.slice(0, 10), // First 10 for logs
            totalSent: results.filter(r => r.success).length,
        });

    } catch (error) {
        console.error("DAILY_PICKS_CRON_ERROR:", error);
        res.status(500).json({ error: "Cron failed", details: error.message });
    }
}
