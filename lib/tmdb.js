// lib/tmdb.js
// lib/tmdb.js
import axios from "axios";
import axiosRetry from "axios-retry";
import { getCache, setCache } from "./cache";

// ✅ CORRECT VARIABLE (no error)
const TMDB_BASE = "https://api.themoviedb.org/3";

// ✅ Retry setup
axiosRetry(axios, {
  retries: 3,
  retryDelay: (n) => n * 400,
  retryCondition: (e) =>
    e.code === "ECONNRESET" ||
    e.code === "ETIMEDOUT" ||
    !e.response ||
    e.response?.status >= 500,
});

// ✅ Params helper
const p = (extra = {}) => ({
  api_key: process.env.TMDB_API_KEY,
  language: "en-US",
  ...extra,
});

// ✅ Request helper with caching
async function req(url, params = {}) {
  const key = `${url}?${new URLSearchParams(params)}`;
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const res = await axios.get(url, { params, timeout: 8000 });
    if (res.data?.results || res.data?.id) {
      setCache(key, res.data);
    }
    return res.data;
  } catch (err) {
    console.error("TMDB_ERROR:", err.message);
    return { results: [] };
  }
}

/* =========================
   🔥 TRENDING
========================= */

// All trending
export async function fetchTrending(page = 1) {
  const d = await req(`${TMDB_BASE}/trending/all/week`, p({ page }));
  return d.results || [];
}

// TV trending
export async function fetchTrendingTV(page = 1) {
  const d = await req(`${TMDB_BASE}/trending/tv/week`, p({ page }));
  return d.results || [];
}

// Movies trending (week)
export async function fetchTrendingMovies(page = 1) {
  const d = await req(`${TMDB_BASE}/trending/movie/week`, p({ page }));
  return d.results || [];
}

// ✅ FIXED: Movies trending (day)
export async function fetchTrendingMoviesDay(page = 1) {
  const d = await req(`${TMDB_BASE}/trending/movie/day`, p({ page }));
  return d.results || [];
}

/* =========================
   🎬 MOVIES & TV
========================= */

export async function fetchNowPlaying(region = "US", page = 1) {
  const d = await req(`${TMDB_BASE}/movie/now_playing`, p({ region, page }));
  return d.results || [];
}

export async function fetchTopRatedMovies(page = 1) {
  const d = await req(`${TMDB_BASE}/movie/top_rated`, p({ page }));
  return d.results || [];
}

export async function fetchTopRatedTV(page = 1) {
  const d = await req(`${TMDB_BASE}/tv/top_rated`, p({ page }));
  return d.results || [];
}

export async function fetchOnAirTV(page = 1) {
  const d = await req(`${TMDB_BASE}/tv/on_the_air`, p({ page }));
  return d.results || [];
}

/* =========================
   🔍 DISCOVER / SEARCH
========================= */

export async function fetchByGenre(genreId, page = 1, type = "movie") {
  const endpoint = type === "tv" ? "discover/tv" : "discover/movie";

  const d = await req(
    `${TMDB_BASE}/${endpoint}`,
    p({
      with_genres: genreId,
      sort_by: "popularity.desc",
      page,
    })
  );

  return d.results || [];
}

export async function searchMulti(query, page = 1) {
  if (!query) return [];

  const d = await req(
    `${TMDB_BASE}/search/multi`,
    p({
      query,
      page,
      include_adult: false,
    })
  );

  return d.results || [];
}

/* =========================
   📄 DETAILS
========================= */

export async function fetchDetails(id, type = "movie") {
  return req(
    `${TMDB_BASE}/${type}/${id}`,
    p({
      append_to_response: "credits,videos,recommendations,similar",
    })
  );
}

export async function fetchMovieReleaseDates(id) {
  const d = await req(`${TMDB_BASE}/movie/${id}/release_dates`, p());
  return d.results || [];
}

/* =========================
   📺 WATCH PROVIDERS
========================= */

export async function fetchWatchProviders(id, type = "movie", region = "IN") {
  const d = await req(`${TMDB_BASE}/${type}/${id}/watch/providers`, p());
  return d.results?.[region] || d.results?.IN || d.results?.US || null;
}

/* =========================
   🎯 RECOMMENDATIONS
========================= */

export async function fetchRecommendedByGenres(genreIds = [], type = "movie") {
  if (!genreIds.length) return [];

  const endpoint = type === "tv" ? "discover/tv" : "discover/movie";

  const d = await req(
    `${TMDB_BASE}/${endpoint}`,
    p({
      with_genres: genreIds.join(","),
      sort_by: "popularity.desc",
      "vote_count.gte": 100,
    })
  );

  return d.results || [];
}

/* =========================
   🎥 VIDEOS
========================= */

function pickSafeTrailer(videos) {
  if (!videos?.length) return null;

  const trailer = videos.find(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );
  if (trailer) return trailer;

  const teaser = videos.find(
    (v) => v.site === "YouTube" && v.type === "Teaser"
  );
  if (teaser) return teaser;

  return videos.find((v) => v.site === "YouTube") || null;
}

export async function fetchVideos(id, media_type = "movie") {
  const d = await req(`${TMDB_BASE}/${media_type}/${id}/videos`, p());
  const chosen = pickSafeTrailer(d.results || []);
  return chosen ? [chosen] : [];
}
