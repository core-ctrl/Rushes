import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Award01Icon,
  Compass01Icon,
  Diamond02Icon,
  FireIcon,
  GameController03Icon,
  LaughingIcon,
  LockIcon,
  MagicWand01Icon,
  PlayIcon,
  Rocket01Icon,
  SkullIcon,
  SparklesIcon,
  Sword01Icon,
  Ticket01Icon,
  Tv01Icon,
  Layers01Icon,
  Cards02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import HeroSlider from "../components/HeroSlider";
import TopCarousel from "../components/TopCarousel";
import SectionRow from "../components/SectionRow";
import GenreRow from "../components/GenreRow";
import BentoGrid from "../components/BentoGrid";
import AdBanner from "../components/AdBanner";
import AdSlot from "../components/AdSlot";
import SEOMeta from "../components/SEOMeta";
import { SkeletonRow } from "../components/SkeletonCard";
import { selectUser } from "../store/slices/authSlice";
import { selectWatchlist } from "../store/slices/watchlistSlice";
import { REGION_OPTIONS } from "../lib/preferenceOptions";
import {
  fetchTrending,
  fetchVideos,
  fetchTrendingMovies,
  fetchTrendingTV,
  fetchTopRatedMovies,
  fetchTopRatedTV,
  fetchByGenre,
  fetchNowPlaying,
  fetchWatchProviders,
} from "../lib/tmdb";
import axios from "axios";
import { readStoredPreferences } from "../lib/userPreferences";
import AppIcon from "../components/AppIcon";
import DailyPicks from "../components/DailyPicks";
import ErrorBoundary from "../components/ErrorBoundary";

import { preferencesFromUser } from "../lib/userPreferences";

function TitleWithIcon({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-red-400">
        <AppIcon icon={Icon} size={20} />
      </div>
      <div>
        <div className="text-xl font-bold text-white md:text-2xl">{title}</div>
        {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function PremiumRecommendationLock({ onLogin }) {
  return (
    <motion.section
      className="relative my-12 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(229,9,20,0.16),transparent_38%,rgba(14,165,233,0.09))]" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-red-200 shadow-[0_0_40px_rgba(229,9,20,0.2)]">
            <AppIcon icon={LockIcon} size={22} />
          </div>
          <div>
            <p className="text-xl font-black text-white md:text-2xl">Personalized recommendations are locked</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
              Sign in to unlock a private taste model built from your genres, languages, watch history, and streaming platforms.
            </p>
          </div>
        </div>
        <button
          onClick={() => onLogin?.("login")}
          className="group relative overflow-hidden rounded-2xl border border-red-400/30 bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-glow-red transition-all hover:-translate-y-0.5 hover:bg-red-500"
        >
          <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
          <span className="relative">Login to unlock</span>
        </button>
      </div>
    </motion.section>
  );
}

export default function Home({
  heroSlides = [],
  trendingItems = [],
  trendingMovies = [],
  trendingTV = [],
  goatedMovies = [],
  goatedSeries = [],
  goatedAnime = [],
  action = [],
  comedy = [],
  thriller = [],
  horror = [],
  romance = [],
  anime = [],
  scifi = [],
  documentary = [],
  fantasy = [],
  openTrailer,
  openAuth,
}) {
  const user = useSelector(selectUser);
  const wishlist = useSelector(selectWatchlist);
  const [recs, setRecs] = useState(null);
  const [recLoad, setRecLoad] = useState(false);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [nowPlayingLoad, setNowPlayingLoad] = useState(false);
  const [localTrendingMovies, setLocalTrendingMovies] = useState(trendingMovies);
  
  const regionLabel = user?.preferredRegions?.length
    ? REGION_OPTIONS.find((region) => region.code === user.preferredRegions[0])?.label || user.preferredRegions[0]
    : null;

  // Scroll animations for 3D card effect
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [0, 800], [1, 0.85]);
  const heroOpacity = useTransform(scrollY, [0, 800], [1, 0.3]);
  const heroY = useTransform(scrollY, [0, 800], [0, 150]);

  useEffect(() => {
    if (!user) {
      setRecs(null);
      setRecLoad(false);
      return;
    }

    setRecLoad(true);
    axios
      .get("/api/recommendations")
      .then(({ data }) => setRecs(data))
      .catch(() => setRecs(null))
      .finally(() => setRecLoad(false));
  }, [user]);

  useEffect(() => {
    // Fetch localized trending if language pref exists
    const prefs = user ? preferencesFromUser(user) : readStoredPreferences();
    if (prefs.languages && prefs.languages.length > 0) {
      axios.get(`/api/trending/localized?lang=${prefs.languages[0]}&type=movie`)
        .then(res => {
          if (res.data && res.data.length > 0) {
            setLocalTrendingMovies(res.data);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const region = user?.preferredRegions?.[0] || readStoredPreferences().regions?.[0] || "US";
    setNowPlayingLoad(true);
    axios
      .get("/api/movies/now-playing", { params: { region } })
      .then(({ data }) => {
        setNowPlaying((data.results || []).slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: true })));
      })
      .catch(() => setNowPlaying([]))
      .finally(() => setNowPlayingLoad(false));
  }, [user?.preferredRegions?.[0]]);

  const nowPlayingIds = new Set(nowPlaying.map((m) => m.id));

  const rowProps = {
    wishlist,
    addToWishlist: () => { },
    openAuth,
    onPlayTrailer: openTrailer,
    nowPlayingIds,
  };

  return (
    <>
      <SEOMeta
        title="Discover Movies, Series, Anime, and Streaming Providers"
        description="Discover trending movies, top series, anime picks, trailers, and where-to-watch provider links with personalized recommendations."
        url="/"
        keywords={["movie discovery", "series recommendations", "anime picks", "watch trailers", "where to watch"]}
      />

      <main className="min-h-screen bg-black text-white pb-20 md:pb-0">
        <ErrorBoundary>

          
          <motion.div 
            style={{ scale: heroScale, opacity: heroOpacity, y: heroY }} 
            className="sticky top-0 w-full z-0 origin-top"
          >
            <HeroSlider slides={heroSlides} onPlayTrailer={openTrailer} openAuth={openAuth} />
          </motion.div>

          <div className="relative z-10 w-full bg-[#050505] rounded-t-[40px] md:rounded-t-[60px] shadow-[0_-30px_60px_rgba(0,0,0,0.8)] -mt-10 md:-mt-16 pt-10 md:pt-16 pb-10 border-t border-white/5">
            <div className="mx-auto max-w-7xl px-4 md:px-8">

          {/* Mini-Nav removed per user request */}

          <TopCarousel
            items={trendingItems}
            title={<TitleWithIcon icon={FireIcon} title="Trending Now" subtitle="Top OTT hits and latest theater releases" />}
            {...rowProps}
          />

          {user ? (
            <section className="mb-14">
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <TitleWithIcon
                  icon={Compass01Icon}
                  title="Recommended for You"
                  subtitle={`Based on your taste, watch history${regionLabel ? `, and ${regionLabel} preferences` : ""}`}
                />
              </motion.div>

              {recLoad ? (
                <>
                  <SkeletonRow count={7} />
                  <SkeletonRow count={7} />
                </>
              ) : recs ? (
                <>
                  {recs.movies.length > 0 ? (
                    <SectionRow title="Movies You'll Love" items={recs.movies} {...rowProps} />
                  ) : null}

                  {recs.tv.length > 0 ? (
                    <SectionRow title="Series You'll Love" items={recs.tv} {...rowProps} />
                  ) : null}

                  {recs.becauseYouWatched?.map((byw) =>
                    byw.items.length > 0 ? (
                      <SectionRow
                        key={byw.because}
                        title={`Because You Watched "${byw.because}"`}
                        items={byw.items}
                        {...rowProps}
                      />
                    ) : null
                  )}

                  {recs.hiddenGems?.length > 0 ? (
                    <SectionRow
                      title="Hidden Gems"
                      subtitle="High-rated titles you might have missed"
                      items={recs.hiddenGems}
                      {...rowProps}
                    />
                  ) : null}
                </>
              ) : null}
            </section>
          ) : (
            <PremiumRecommendationLock onLogin={openAuth} />
          )}

          <AdSlot slot="1000000000" className="mb-10" label="Featured sponsor" />

          <BentoGrid
            items={localTrendingMovies.slice(0, 5)}
            title={<TitleWithIcon icon={PlayIcon} title="Top Movies This Week" subtitle="High momentum picks across the platform" />}
          />

          <TopCarousel
            items={trendingTV}
            title={<TitleWithIcon icon={Tv01Icon} title="Top Series This Week" subtitle="The most talked-about shows right now" />}
            {...rowProps}
          />

          {nowPlayingLoad ? (
            <SkeletonRow count={7} />
          ) : nowPlaying.length > 0 ? (
            <SectionRow
              title={<TitleWithIcon icon={Ticket01Icon} title="In Theaters" subtitle={`Now playing in ${regionLabel || "your region"}`} />}
              items={nowPlaying}
              {...rowProps}
            />
          ) : null}

          <AdBanner slot="horizontal" />

          {/* Recommended for You moved to top */}

          <div className="my-8">
            <TitleWithIcon
              icon={Award01Icon}
              title="The GOATs"
              subtitle="Greatest of all time across movies, series, and anime"
            />
          </div>

          <SectionRow title="Goated Movies" subtitle="Greatest films ever made" items={goatedMovies} {...rowProps} />
          <SectionRow title="Goated Series" subtitle="Legendary television" items={goatedSeries} {...rowProps} />
          <SectionRow title="Goated Anime" subtitle="Essential anime classics" items={goatedAnime} {...rowProps} />

          <AdBanner slot="horizontal" />

          <div className="my-10 border-t border-white/5" />

          <GenreRow title={<TitleWithIcon icon={Sword01Icon} title="Action" />} items={action} genreId={28} {...rowProps} />
          <GenreRow title={<TitleWithIcon icon={LaughingIcon} title="Comedy" />} items={comedy} genreId={35} {...rowProps} />
          <GenreRow title={<TitleWithIcon icon={SparklesIcon} title="Thriller" />} items={thriller} genreId={53} {...rowProps} />
          <GenreRow title={<TitleWithIcon icon={SkullIcon} title="Horror" />} items={horror} genreId={27} {...rowProps} />
          <GenreRow title={<TitleWithIcon icon={PlayIcon} title="Romance" />} items={romance} genreId={10749} {...rowProps} />
          <GenreRow title={<TitleWithIcon icon={GameController03Icon} title="Anime" />} items={anime} genreId={16} {...rowProps} />
          <GenreRow title={<TitleWithIcon icon={Rocket01Icon} title="Sci-Fi" />} items={scifi} genreId={878} {...rowProps} />
          <GenreRow title={<TitleWithIcon icon={Diamond02Icon} title="Documentary" />} items={documentary} genreId={99} {...rowProps} />
          <GenreRow title={<TitleWithIcon icon={MagicWand01Icon} title="Fantasy" />} items={fantasy} genreId={14} {...rowProps} />

          <footer className="my-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/8 px-5 py-3 glass">
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                alt="TMDB"
                className="h-4 opacity-60"
              />
              <p className="text-xs text-neutral-600">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
                All content belongs to its respective rights holders.
              </p>
            </div>
          </footer>
            </div>
          </div>
        </ErrorBoundary>
      </main>
    </>
  );
}

function compactMedia(item, overrides = {}) {
  if (!item) return null;

  return {
    id: item.id,
    title: item.title || null,
    name: item.name || null,
    media_type: item.media_type || (item.title ? "movie" : "tv"),
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    overview: item.overview || "",
    vote_average: item.vote_average || 0,
    release_date: item.release_date || null,
    first_air_date: item.first_air_date || null,
    genre_ids: item.genre_ids || [],
    popularity: item.popularity || 0,
    origin_country: item.origin_country || [],
    original_language: item.original_language || null,
    trailerKey: item.trailerKey || null,
    ...overrides,
  };
}

function sortByRating(items) {
  return [...items].sort((a, b) => b.vote_average - a.vote_average);
}

function sortByNewest(items) {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.release_date || a.first_air_date || '1900-01-01');
    const dateB = new Date(b.release_date || b.first_air_date || '1900-01-01');
    const diff = dateB - dateA;
    return diff !== 0 ? diff : (b.popularity || 0) - (a.popularity || 0);
  });
}

export async function getServerSideProps() {
  try {
    const [
      trendingRaw,
      nowPlayingRaw,
      trendingMoviesRaw,
      trendingTVRaw,
      goatedMoviesRaw,
      goatedSeriesRaw,
      goatedAnimeRaw,
      actionRaw,
      comedyRaw,
      thrillerRaw,
      horrorRaw,
      romanceRaw,
      animeRaw,
      scifiRaw,
      documentaryRaw,
      fantasyRaw,
    ] = await Promise.all([
      fetchTrending(),
      fetchNowPlaying("US"), // Theater movies
      fetchTrendingMovies(),
      fetchTrendingTV(),
      fetchTopRatedMovies(2),
      fetchTopRatedTV(2),
      fetchByGenre(16, 1, "tv"),
      fetchByGenre(28),
      fetchByGenre(35),
      fetchByGenre(53),
      fetchByGenre(27),
      fetchByGenre(10749),
      fetchByGenre(16),
      fetchByGenre(878),
      fetchByGenre(99),
      fetchByGenre(14),
    ]);

    const trendingSorted = [...trendingRaw].sort((a, b) => b.popularity - a.popularity);
    const heroBase = trendingSorted.slice(0, 5);

    const heroSlides = await Promise.all(
      heroBase.map(async (item) => {
        const mediaType = item.media_type || (item.title ? "movie" : "tv");
        const videos = await fetchVideos(item.id, mediaType);
        return compactMedia(item, { trailerKey: videos[0]?.key || null });
      })
    );

    const nowPlayingIdsSet = new Set(nowPlayingRaw.map((m) => m.id));

    // Mix OTT (Trending) and Theater (Now Playing) together
    const mixedTrending = [];
    const maxLen = Math.max(trendingRaw.length, nowPlayingRaw.length);
    const seenIds = new Set();
    
    for (let i = 0; i < maxLen; i++) {
      if (trendingRaw[i] && !seenIds.has(trendingRaw[i].id)) {
        mixedTrending.push({
          ...trendingRaw[i],
          isNowPlaying: nowPlayingIdsSet.has(trendingRaw[i].id),
        });
        seenIds.add(trendingRaw[i].id);
      }
      if (nowPlayingRaw[i] && !seenIds.has(nowPlayingRaw[i].id)) {
        mixedTrending.push({
          ...nowPlayingRaw[i],
          media_type: "movie",
          isNowPlaying: true,
        });
        seenIds.add(nowPlayingRaw[i].id);
      }
    }

    const mixedTrendingSlice = mixedTrending.slice(0, 16);
    const trendingItems = await Promise.all(
      mixedTrendingSlice.map(async (item) => {
        const mediaType = item.media_type || (item.title ? "movie" : "tv");
        try {
          const providers = await fetchWatchProviders(item.id, mediaType, "US");
          return compactMedia(item, {
            providers,
            availability: providers,
            isNowPlaying: item.isNowPlaying || false,
          });
        } catch (e) {
          return compactMedia(item, {
            isNowPlaying: item.isNowPlaying || false,
          });
        }
      })
    );

    return {
      props: {
        heroSlides,
        trendingItems,
        trendingMovies: sortByNewest(trendingMoviesRaw).slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
        trendingTV: sortByNewest(trendingTVRaw).slice(0, 10).map((item) => compactMedia(item, { media_type: "tv" })),
        goatedMovies: sortByRating(goatedMoviesRaw).slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
        goatedSeries: sortByRating(goatedSeriesRaw).slice(0, 10).map((item) => compactMedia(item, { media_type: "tv" })),
        goatedAnime: sortByRating(goatedAnimeRaw).slice(0, 10).map((item) => compactMedia(item, { media_type: "tv" })),
        action: actionRaw.slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
        comedy: comedyRaw.slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
        thriller: thrillerRaw.slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
        horror: horrorRaw.slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
        romance: romanceRaw.slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
        anime: animeRaw.slice(0, 10).map((item) => compactMedia(item, { media_type: "movie" })),
        scifi: scifiRaw.slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
        documentary: documentaryRaw.slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
        fantasy: fantasyRaw.slice(0, 10).map((item) => compactMedia(item, { media_type: "movie", isNowPlaying: nowPlayingIdsSet.has(item.id) || false })),
      },
    };
  } catch (error) {
    console.error("HOME_ERROR:", error.message);
    return { props: {} };
  }
}
