const STORAGE_KEY = "movie_finder_preferences_v1";

export const defaultPreferences = {
  genres: [],
  languages: [],
  regions: [],
  regionGroup: "",
  platforms: [],
  allowLocationRecommendations: false,
  completed: false,
  syncedUserId: "",
};

export function hasMeaningfulPreferences(preferences) {
  if (!preferences) return false;

  return (
    (preferences.genres?.length || 0) > 0 ||
    (preferences.languages?.length || 0) > 0 ||
    (preferences.regions?.length || 0) > 0 ||
    (preferences.platforms?.length || 0) > 0
  );
}

export function readStoredPreferences() {
  if (typeof window === "undefined") return defaultPreferences;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultPreferences;
  }
}

export function writeStoredPreferences(preferences) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...defaultPreferences, ...preferences })
  );
}

export function preferencesFromUser(user) {
  return {
    genres: user?.preferredGenres || [],
    languages: user?.preferredLanguages || [],
    regions: user?.preferredRegions || [],
    platforms: user?.preferredPlatforms || [],
    regionGroup: user?.preferredRegionGroup || "",
    allowLocationRecommendations: Boolean(user?.allowLocationRecommendations),
    completed:
      Boolean(user?.hasCompletedOnboarding) ||
      hasMeaningfulPreferences({
        genres: user?.preferredGenres,
        languages: user?.preferredLanguages,
        regions: user?.preferredRegions,
        platforms: user?.preferredPlatforms,
      }) || Boolean(user?.allowLocationRecommendations),
    syncedUserId: user?.id || user?._id || "",
  };
}

export function getPrimaryRegion(preferences) {
  return preferences?.regions?.[0] || "";
}
