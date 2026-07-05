// services/searchService.js
// Smart search: fuzzy matching, typo correction, intent detection
import { getCache, setCache } from "../lib/cache.js";

// ── Levenshtein distance (edit distance between two strings) ──────
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

// ── Soundex phonetic algorithm ────────────────────────────────────
function soundex(word) {
    const codes = { b: 1, f: 1, p: 1, v: 1, c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2, d: 3, t: 3, l: 4, m: 5, n: 5, r: 6 };
    const w = word.toUpperCase();
    let result = w[0];
    let prev = codes[w[0].toLowerCase()] || 0;
    for (let i = 1; i < w.length && result.length < 4; i++) {
        const c = codes[w[i].toLowerCase()];
        if (c && c !== prev) { result += c; prev = c; } else if (!c) { prev = 0; }
    }
    return result.padEnd(4, "0");
}

// ── Common typo corrections ───────────────────────────────────────
const CORRECTIONS = {
    "avngers": "avengers", "avengers endgame": "avengers endgame",
    "intrstllr": "interstellar", "intrstellar": "interstellar",
    "batmn": "batman", "suprmn": "superman", "spidrmn": "spiderman",
    "godfthr": "godfather", "schndlr": "schindler", "breakng bad": "breaking bad",
    "strnger things": "stranger things", "gameof thrones": "game of thrones",
};

// ── Intent detection ──────────────────────────────────────────────
const MOOD_MAP = {
    funny: { genres: [35], query: "comedy" },
    hilarious: { genres: [35], query: "comedy" },
    scary: { genres: [27], query: "horror" },
    horror: { genres: [27], query: "horror" },
    sad: { genres: [18], query: "drama" },
    romantic: { genres: [10749], query: "romance" },
    action: { genres: [28], query: "action" },
    thriller: { genres: [53], query: "thriller" },
    animated: { genres: [16], query: "animation" },
    anime: { genres: [16], query: "anime" },
    scifi: { genres: [878], query: "science fiction" },
    "sci-fi": { genres: [878], query: "science fiction" },
    mystery: { genres: [9648], query: "mystery" },
    family: { genres: [10751], query: "family" },
};

const LANGUAGE_MAP = {
    english: "en",
    telugu: "te",
    hindi: "hi",
    tamil: "ta",
    malayalam: "ml",
    korean: "ko",
    japanese: "ja",
    spanish: "es",
    french: "fr",
    kannada: "kn",
};

export function detectIntent(query) {
    const q = query.toLowerCase().trim();

    // Mood queries: "funny movies", "sad anime", "scary series"
    for (const [mood, data] of Object.entries(MOOD_MAP)) {
        if (q.includes(mood)) {
            return { type: "mood", mood, ...data };
        }
    }

    // Actor patterns: "movies with [name]", "films starring [name]"
    const actorMatch = q.match(/(?:movies?|films?|series|shows?)\s+(?:with|starring|featuring)\s+(.+)/);
    if (actorMatch) return { type: "actor", actor: actorMatch[1] };

    // Year: "movies from 2020", "2019 films"
    const yearMatch = q.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) return { type: "year", year: parseInt(yearMatch[1]) };

    // Language patterns: "telugu movies", "hindi horror"
    let languageIntent = null;
    let languageCode = null;
    let languageName = null;
    let cleanedQuery = q;
    
    for (const [lang, code] of Object.entries(LANGUAGE_MAP)) {
        if (q.includes(lang)) {
            languageCode = code;
            languageName = lang.charAt(0).toUpperCase() + lang.slice(1);
            // Remove the language word from query to see if it's purely a category search
            cleanedQuery = cleanedQuery.replace(lang, "").trim();
            languageIntent = { type: "language", language: code, languageName };
            break;
        }
    }

    // Default: title search or combined language + title/mood
    const baseIntent = { type: "title", query: cleanedQuery };
    
    // If language is detected and the rest of the query is just "movies", "films", etc.
    // Or if it's entirely empty, return a language discover intent.
    const isGenericSuffix = /^(movie|movies|film|films|series|shows|)$/.test(cleanedQuery.replace(/\s+/g, ''));
    if (languageIntent && isGenericSuffix) {
        return { type: "discover", language: languageCode, languageName, genres: [], originalQuery: q };
    }

    // Combine language with mood if both present (e.g. "telugu horror")
    if (languageIntent) {
        for (const [mood, data] of Object.entries(MOOD_MAP)) {
            if (cleanedQuery.includes(mood)) {
                return { type: "discover", language: languageCode, languageName, ...data, originalQuery: q };
            }
        }
    }

    if (languageIntent) {
        return { ...baseIntent, language: languageCode, languageName };
    }

    return baseIntent;
}

// ── Typo correction ───────────────────────────────────────────────
export function correctTypo(query) {
    const q = query.toLowerCase().trim();

    // Exact correction map
    if (CORRECTIONS[q]) return CORRECTIONS[q];

    // If query is short (≤3 chars) or looks clean, skip
    if (q.length <= 3) return q;

    // Check each word — if very short edit distance to a known title word,
    // it's likely a typo (handled by TMDB search naturally).
    // This is a fast path — real fuzzy happens in TMDB results scoring below.
    return q;
}

// ── Score results by relevance + popularity ────────────────────────
export function scoreResults(results, query, userGenres = []) {
    const q = query.toLowerCase();

    return results
        .filter((r) => r.media_type !== "person" && (r.poster_path || r.backdrop_path))
        .map((r) => {
            const title = (r.title || r.name || "").toLowerCase();
            const editD = levenshtein(q, title);
            const soundD = soundex(q) === soundex(title.split(" ")[0]) ? 0 : 1;

            // Title match scoring
            let score = 0;
            if (title === q) score += 100;  // Exact match
            else if (title.startsWith(q)) score += 80; // Prefix match
            else if (title.includes(q)) score += 60; // Contains match
            else if (editD <= 2) score += 40; // Typo tolerance
            else if (soundD === 0) score += 30; // Phonetic match
            else if (editD <= 4) score += 20; // Loose match

            // Popularity boost (TMDB popularity 0-1000+)
            score += Math.min(r.popularity / 10, 20);

            // Rating boost
            if (r.vote_average > 7) score += 10;
            if (r.vote_average > 8) score += 10;

            // Personalization: boost genres user likes
            const rGenres = r.genre_ids || [];
            const overlap = rGenres.filter((g) => userGenres.includes(g)).length;
            score += overlap * 5;

            return { ...r, _score: score, _editDistance: editD };
        })
        .sort((a, b) => b._score - a._score);
}

// ── Autocomplete suggestions from cache ──────────────────────────
const suggestions = new Map(); // prefix → titles array

export function buildSuggestionsIndex(titles) {
    suggestions.clear();
    for (const t of titles) {
        const lower = t.toLowerCase();
        for (let i = 1; i <= Math.min(lower.length, 10); i++) {
            const prefix = lower.slice(0, i);
            if (!suggestions.has(prefix)) suggestions.set(prefix, []);
            if (suggestions.get(prefix).length < 8) suggestions.get(prefix).push(t);
        }
    }
}

export function getSuggestions(prefix, limit = 6) {
    return suggestions.get(prefix.toLowerCase().trim()) || [];
}
