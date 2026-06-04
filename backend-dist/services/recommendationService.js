const { getCache, setCache } = require("../lib/cache");
const { fetchByGenre, fetchDetails, fetchTrendingMovies, fetchTrendingTV, fetchWatchProviders } = require("../lib/tmdb");
const { DEFAULT_REGION, matchesOttFilter, withDecisionMetadata } = require("../lib/decisionEngine");

function scoreForUser(item, profile) {
    let score = 0;

    const {
        preferredGenres = [],
        preferredLanguages = [],
        preferredRegions = [],
        preferredPlatforms = [],
        watchedIds = [],
        searchGenres = [],
    } = profile;
    const itemGenres = item.genre_ids || item.genres?.map((g) => g.id) || [];

    const prefOverlap = itemGenres.filter((g) => preferredGenres.includes(g)).length;
    score += prefOverlap * 15;

    const searchOverlap = itemGenres.filter((g) => searchGenres.includes(g)).length;
    score += searchOverlap * 8;

    if (watchedIds.includes(item.id)) score -= 1000;

    if (preferredLanguages.length && item.original_language && preferredLanguages.includes(item.original_language)) {
        score += 12;
    }

    if (preferredRegions.length && Array.isArray(item.origin_country)) {
        const regionOverlap = item.origin_country.filter((country) => preferredRegions.includes(country)).length;
        score += regionOverlap * 10;
    }

    if (preferredPlatforms.length && item.availability) {
        const platformMatch = item.availability.flatrate?.some(p =>
            preferredPlatforms.includes(p.provider_name.toLowerCase().replace(/ /g, '')) ||
            preferredPlatforms.includes(p.provider_id)
        ) || 0;
        score += platformMatch * 18;
    }

    const releaseDate = new Date(item.release_date || item.first_air_date || '1970');
    const daysOld = (Date.now() - releaseDate) / (1000 * 60 * 60 * 24);
    if (daysOld < 30) score += 8;
    if (daysOld < 7) score += 5;

    score += Math.log10(Math.max(item.popularity || 1, 1)) * 5;

    if (item.vote_average >= 8) score += 20;
    else if (item.vote_average >= 7) score += 10;
    else if (item.vote_average < 5) score -= 10;

    if (item.vote_count < 50) score -= 15;

    return score;
}

function buildUserProfile(user) {
    const preferredGenres = user.preferredGenres || [];
    const preferredLanguages = user.preferredLanguages || [];
    const preferredRegions = user.preferredRegions || [];
    const preferredPlatforms = user.preferredPlatforms || [];
    const preferredRegionGroup = user.preferredRegionGroup || "";

    const watchedIds = (user.watchHistory || []).map((h) => h.mediaId);
    const searchGenres = [];

    return { preferredGenres, preferredLanguages, preferredRegions, preferredPlatforms, preferredRegionGroup, watchedIds, searchGenres };
}

async function getRecommendations(user, options = {}) {
    const { limit = 20, type = "all", daily = false, ott = {} } = options;

    if (daily) {
        return getDailyPicks(user, options);
    }
    const cacheIdentity = user?._id || JSON.stringify({
        genres: user.preferredGenres || [],
        languages: user.preferredLanguages || [],
        regions: user.preferredRegions || [],
        group: user.preferredRegionGroup || "",
    });
    const cacheKey = `recs:${cacheIdentity}:${type}:${JSON.stringify(ott)}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const profile = buildUserProfile(user);

    if (!profile.preferredGenres.length) {
        const [movies, tv] = await Promise.all([
            fetchTrendingMovies().then((r) => r.slice(0, limit)),
            fetchTrendingTV().then((r) => r.slice(0, limit)),
        ]);
        const result = {
            movies: await prioritizeByAvailability(movies, profile.preferredRegions[0] || DEFAULT_REGION, "movie", limit, profile, ott),
            tv: await prioritizeByAvailability(tv, profile.preferredRegions[0] || DEFAULT_REGION, "tv", limit, profile, ott),
            source: "trending",
        };
        setCache(cacheKey, result);
        return result;
    }

    const genreBatches = profile.preferredGenres.slice(0, 3);

    const [movieCandidates, tvCandidates, trendingMovies, trendingTV] = await Promise.all([
        Promise.all(genreBatches.map((g) => fetchByGenre(g, 1, "movie"))).then((r) => r.flat()),
        Promise.all(genreBatches.map((g) => fetchByGenre(g, 1, "tv"))).then((r) => r.flat()),
        fetchTrendingMovies(),
        fetchTrendingTV(),
    ]);

    const dedup = (arr) => {
        const seen = new Set();
        return arr.filter((i) => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });
    };

    const allMovies = dedup([...trendingMovies, ...movieCandidates]);
    const allTV = dedup([...trendingTV, ...tvCandidates]);

    const movies = allMovies
        .map((i) => ({ ...i, _score: scoreForUser(i, profile) }))
        .sort((a, b) => b._score - a._score)
        .slice(0, limit);

    const tv = allTV
        .map((i) => ({ ...i, _score: scoreForUser(i, profile) }))
        .sort((a, b) => b._score - a._score)
        .slice(0, limit);

    const moviesWithMeta = await prioritizeByAvailabilityWithRuntime(
        movies,
        profile.preferredRegions[0] || DEFAULT_REGION,
        "movie",
        limit,
        profile,
        ott
    );

    const tvWithMeta = await prioritizeByAvailabilityWithRuntime(
        tv,
        profile.preferredRegions[0] || DEFAULT_REGION,
        "tv",
        limit,
        profile,
        ott
    );

    const result = {
        movies: moviesWithMeta,
        tv: tvWithMeta,
        source: "personalized",
        genres: profile.preferredGenres,
    };
    setCache(cacheKey, result);
    return result;
}

async function getDailyPicks(user, options = {}) {
    const profile = buildUserProfile(user || {});
    const recs = await getRecommendations(user || {}, { ...options, limit: 30, daily: false });

    const topMovies = [...(recs.movies || [])]
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 5);
    const topTV = [...(recs.tv || [])]
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 5);

    const moviesWithRuntime = await Promise.all(topMovies.map(item => enhanceForDaily(item, "movie", profile)));
    const tvWithRuntime = await Promise.all(topTV.map(item => enhanceForDaily(item, "tv", profile)));

    return {
        movies: moviesWithRuntime,
        series: tvWithRuntime,
        source: "daily_picks",
        message: "🔥 Today's Picks For You",
        updated: new Date().toISOString(),
    };
}

async function enhanceForDaily(item, mediaType, profile) {
    let runtime = null;
    let numberOfSeasons = item.number_of_seasons || null;
    let genres = item.genres || null;

    try {
        const details = mediaType === "movie" && !item.runtime
            ? await fetchDetails(item.id, mediaType)
            : mediaType === "tv" && (!item.number_of_seasons || !item.genres)
                ? await fetchDetails(item.id, mediaType)
                : null;

        if (mediaType === "movie") {
            runtime = item.runtime || details?.runtime || null;
        } else {
            numberOfSeasons = item.number_of_seasons || details?.number_of_seasons || null;
        }

        genres = item.genres || details?.genres || null;
    } catch (err) {
        runtime = item.runtime || null;
        numberOfSeasons = item.number_of_seasons || null;
    }

    return {
        ...item,
        whyRecommended: [],
        runtime,
        number_of_seasons: numberOfSeasons,
        genres,
        providers: item.availability?.flatrate?.map(p => p.provider_name) || [],
    };
}

async function prioritizeByAvailabilityWithRuntime(items, regionCode, mediaType, limit, profile, ott) {
    const prioritized = await prioritizeByAvailability(items, regionCode, mediaType, limit + 3, profile, ott);
    return prioritized.slice(0, limit).map(item => ({
        ...item,
        whyRecommended: []
    }));
}

async function prioritizeByAvailability(items, regionCode, mediaType, limit, profile = {}, ott = {}) {
    if (!regionCode || !items.length) {
        return items.slice(0, limit).map((item) => withDecisionMetadata(item, { profile }));
    }

    const inspected = await Promise.all(
        items.slice(0, Math.min(items.length, limit + 6)).map(async (item) => {
            try {
                const availability = await fetchWatchProviders(item.id, mediaType, regionCode);
                const availabilityBoost =
                    (availability?.flatrate?.length || 0) * 20 +
                    (availability?.rent?.length || 0) * 8 +
                    (availability?.buy?.length || 0) * 6 +
                    (availability?.theatrical?.length || 0) * 16;

                return withDecisionMetadata({ ...item, availability, media_type: mediaType, _availabilityBoost: availabilityBoost }, { profile });
            } catch (err) {
                return withDecisionMetadata({ ...item, media_type: mediaType, _availabilityBoost: 0 }, { profile });
            }
        })
    );

    return inspected
        .filter((item) => matchesOttFilter(item, ott))
        .sort((a, b) => (b._score + b._availabilityBoost) - (a._score + a._availabilityBoost))
        .slice(0, limit);
}

async function decideForMe(user, options = {}) {
    const profile = buildUserProfile(user || {});
    const recs = await getRecommendations(user || {}, {
        limit: 12,
        ott: {
            availableOnly: true,
            access: options.access || "all",
            provider: options.provider || "",
        },
    });

    const pool = [...(recs.movies || []), ...(recs.tv || [])]
        .filter((item) => item.contentStatus?.key === "ott")
        .map((item) => withDecisionMetadata(item, { profile }))
        .sort((a, b) => {
            const aReasonScore = (a.reasons || []).length * 20;
            const bReasonScore = (b.reasons || []).length * 20;
            return (bReasonScore + (b.vote_average || 0) + (b.popularity || 0) / 20) -
                (aReasonScore + (a.vote_average || 0) + (a.popularity || 0) / 20);
        });

    return pool.slice(0, 3);
}

async function getBecauseYouWatched(user) {
    const history = (user.watchHistory || []).slice(0, 3);
    if (!history.length) return [];

    const results = [];
    for (const item of history) {
        const cacheKey = `byw:${item.mediaId}:${item.mediaType}`;
        let recs = getCache(cacheKey);

        if (!recs) {
            try {
                const details = await fetchDetails(item.mediaId, item.mediaType || "movie");
                recs = details?.similar?.results?.slice(0, 10) || details?.recommendations?.results?.slice(0, 10) || [];
                if (recs.length) setCache(cacheKey, recs);
            } catch (err) {
                recs = [];
            }
        }

        if (recs.length) {
            results.push({
                because: item.title,
                items: recs.slice(0, 8),
                mediaType: item.mediaType,
            });
        }
    }

    return results;
}

async function getHiddenGems(genreIds = []) {
    const cacheKey = `hidden:${genreIds.join(",")}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const candidates = genreIds.length
        ? await Promise.all(genreIds.slice(0, 2).map((g) => fetchByGenre(g, 2))).then((r) => r.flat())
        : await fetchByGenre(18, 2);

    const gems = candidates
        .filter((i) => i.vote_average >= 7.5 && i.vote_count >= 100 && i.popularity < 50)
        .sort((a, b) => b.vote_average - a.vote_average)
        .slice(0, 15);

    setCache(cacheKey, gems);
    return gems;
}

module.exports = {
  buildUserProfile,
  getRecommendations,
  getDailyPicks,
  decideForMe,
  getBecauseYouWatched,
  getHiddenGems
};
