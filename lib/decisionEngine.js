
const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_REGION = "IN";

export function generateWhyReasons(item, profile) {
  const reasons = [];

  if (profile.preferredGenres.some(g => item.genre_ids?.includes(g))) {
    reasons.push("Your favorite genre");
  }

  if (profile.preferredLanguages.includes(item.original_language)) {
    reasons.push("Preferred language");
  }

  if (item.availability?.flatrate?.length > 0) {
    reasons.push("Available to stream now");
  }

  if (item.vote_average >= 8) {
    reasons.push("Highly rated");
  }

  if (item.popularity > 50) {
    reasons.push("Trending now");
  }

  return reasons;
}

export const CONTENT_STATUS = {
  OTT: "ON OTT",
  THEATERS: "IN THEATERS",
  COMING_SOON: "COMING SOON",
  UNKNOWN: "DISCOVER",
};

export const PRIORITY_PROVIDERS = [
  "Netflix",
  "Amazon Prime Video",
  "Disney Plus Hotstar",
  "Hotstar",
  "JioCinema",
  "Zee5",
  "Sony LIV",
];

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getReleaseDate(item = {}) {
  return item.release_date || item.first_air_date || item.air_date || "";
}

export function getTitle(item = {}) {
  return item.title || item.name || item.original_title || item.original_name || "Untitled";
}

export function normalizeProviderBuckets(providers = null) {
  return {
    flatrate: providers?.flatrate || [],
    rent: providers?.rent || [],
    buy: providers?.buy || [],
    free: providers?.free || [],
    ads: providers?.ads || [],
    link: providers?.link || "",
  };
}

export function getWatchProviders(providers = null, mode = "all") {
  const normalized = normalizeProviderBuckets(providers);
  const paid = [...normalized.flatrate, ...normalized.rent, ...normalized.buy];
  const free = [...normalized.free, ...normalized.ads];
  const selected = mode === "free" ? free : mode === "paid" ? paid : [...free, ...paid];
  const seen = new Set();

  return selected
    .filter((provider) => {
      const id = provider.provider_id || provider.provider_name;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => {
      const aRank = PRIORITY_PROVIDERS.indexOf(a.provider_name);
      const bRank = PRIORITY_PROVIDERS.indexOf(b.provider_name);
      return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank);
    });
}

export function getContentStatus(item = {}, providers = item.availability || item.providers || null, today = new Date()) {
  const watchProviders = getWatchProviders(providers);
  if (watchProviders.length > 0) {
    return {
      key: "ott",
      label: CONTENT_STATUS.OTT,
      tone: "emerald",
      reason: "Available on OTT in your region",
    };
  }

  const releaseDate = parseDate(getReleaseDate(item));
  if (releaseDate && releaseDate.getTime() > today.getTime()) {
    return {
      key: "coming_soon",
      label: CONTENT_STATUS.COMING_SOON,
      tone: "sky",
      reason: "Future release",
    };
  }

  const isTV = item.media_type === "tv" || !!item.first_air_date;
  if (releaseDate) {
    const diffDays = Math.floor((today.getTime() - releaseDate.getTime()) / DAY_MS);
    if (!isTV && diffDays >= 0 && diffDays <= 45) {
      return {
        key: "theaters",
        label: CONTENT_STATUS.THEATERS,
        tone: "amber",
        reason: "Recent release with no OTT availability",
      };
    }
  }

  return {
    key: "unknown",
    label: CONTENT_STATUS.UNKNOWN,
    tone: "neutral",
    reason: "Availability not confirmed yet",
  };
}

export function getWhereToWatch(item = {}) {
  const providers = getWatchProviders(item.availability || item.providers);
  if (providers.length) return providers.slice(0, 3).map((provider) => provider.provider_name).join(", ");
  const status = item.contentStatus || getContentStatus(item);
  if (status.key === "theaters") return "Theaters";
  if (status.key === "coming_soon") return "Trailer / reminders";
  return "Check availability";
}

export function getRuntimeLabel(item = {}) {
  const runtime = item.runtime || item.episode_run_time?.[0] || null;
  if (!runtime) return "";
  if (runtime < 60) return `${runtime}m`;
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function buildRecommendationReasons(item = {}, profile = {}) {
  const reasons = [];
  const providers = getWatchProviders(item.availability || item.providers);
  const genreIds = item.genre_ids || item.genres?.map((genre) => genre.id) || [];

  if ((item.runtime || 999) <= 105) reasons.push("Short runtime");
  if ((item.popularity || 0) >= 80 || item.trending) reasons.push("Trending");
  if (profile.preferredGenres?.some((genre) => genreIds.includes(genre))) reasons.push("Matches your taste");
  if (profile.preferredLanguages?.includes(item.original_language)) reasons.push("Matches your taste");
  if (providers.length) reasons.push("Available on your OTT");
  if (item.vote_average >= 7.5) reasons.push("Highly rated");

  return [...new Set(reasons)].slice(0, 3);
}

export function withDecisionMetadata(item = {}, options = {}) {
  const contentStatus = getContentStatus(item, item.availability || item.providers, options.today);
  const reasons = item.reasons || buildRecommendationReasons(item, options.profile || {});

  return {
    ...item,
    contentStatus,
    whereToWatch: item.whereToWatch || getWhereToWatch({ ...item, contentStatus }),
    runtimeLabel: item.runtimeLabel || getRuntimeLabel(item),
    reasons,
    whyRecommended: item.whyRecommended || reasons[0] || contentStatus.reason,
  };
}

export function matchesOttFilter(item = {}, filters = {}) {
  const providers = getWatchProviders(item.availability || item.providers, filters.access || "all");
  if (filters.availableOnly && providers.length === 0) return false;
  if (filters.provider) {
    return providers.some((provider) =>
      provider.provider_name?.toLowerCase().includes(String(filters.provider).toLowerCase())
    );
  }
  return true;
}
