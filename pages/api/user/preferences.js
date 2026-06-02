import { connectDB } from "../../../lib/mongodb";
import User from "../../../models/User";
import { getApiAuthUser } from "../../../lib/apiAuth";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const decoded = await getApiAuthUser(req, res);

    try {
      await connectDB();

      // Handle field name variations from onboarding flow
      const incomingGenres = req.body.genres || req.body.preferredGenres || [];
      const incomingLanguages = req.body.languages || req.body.preferredLanguages || [];
      const incomingPlatforms = req.body.platforms || req.body.preferredPlatforms || req.body.ottPlatforms || [];

      const updateData = {
        preferredGenres: incomingGenres,
        preferredLanguages: incomingLanguages,
        preferredRegions: req.body.regions || [],
        preferredRegionGroup: req.body.regionGroup || "",
        allowLocationRecommendations: Boolean(req.body.allowLocationRecommendations),
        preferredPlatforms: incomingPlatforms,
        ottPlatforms: incomingPlatforms,
      };
      if (typeof req.body.hasCompletedOnboarding === "boolean") {
        updateData.hasCompletedOnboarding = req.body.hasCompletedOnboarding;
      } else if (req.body.completed === true) {
        updateData.hasCompletedOnboarding = true;
      }

      let user;
      if (decoded) {
        // Authenticated user
        user = await User.findByIdAndUpdate(
          decoded.id,
          updateData,
          { new: true, runValidators: true }
        ).select("preferredGenres preferredLanguages preferredRegions preferredRegionGroup allowLocationRecommendations preferredPlatforms ottPlatforms hasCompletedOnboarding");
      } else {
        // Guest - return success but no DB save
        res.status(201).json({ message: "Guest preferences saved locally", data: updateData });
        return;
      }

      res.status(200).json({
        message: "Preferences updated",
        data: user
      });

    } catch (error) {
      console.error("PREFS_ERROR:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
