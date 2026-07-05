import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import ShareButton from "../../components/ShareButton";
import { TMDB_BLUR_DATA_URL } from "../../lib/imageBlur";
import SEOMeta from "../../components/SEOMeta";
import HoverCard from "../../components/cards/HoverCard";

const GENRE_MAP = {
  10759: "Action & Adventure",
  35: "Comedy",
  18: "Drama",
  9648: "Mystery",
  10765: "Sci-Fi & Fantasy",
  80: "Crime",
  16: "Animation",
  99: "Documentary",
};

function NetflixRow({ title, items, loading, landscape = false }) {
  if (loading) {
    return (
      <section>
        <h2 className="mb-3 text-xl font-black">{title}</h2>
        <div className="flex gap-3 overflow-x-auto px-2 py-6 scroll-row" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={`flex-shrink-0 flex flex-col gap-2 ${landscape ? 'w-[240px] md:w-[280px]' : 'w-[140px] md:w-[160px]'}`}>
              <div className={`w-full ${landscape ? 'aspect-video' : 'aspect-[2/3]'} rounded-xl bg-neutral-900 animate-pulse`} />
              <div className="h-4 w-3/4 rounded bg-neutral-900 animate-pulse mt-1" />
              <div className="h-3 w-1/2 rounded-full bg-neutral-900 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!items?.length) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-black">{title}</h2>
      <div className="flex gap-3 overflow-x-auto px-2 py-6 scroll-row" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
        <style>{`.scroll-row::-webkit-scrollbar{display:none}`}</style>
        {items.map((item, i) => <HoverCard key={item.id} item={item} index={i} landscape={landscape} />)}
      </div>
    </section>
  );
}

export default function SeriesPage() {
  const user = useSelector(selectUser);
  const [trending, setTrending] = useState([]);
  const [picks, setPicks] = useState([]);
  const [byGenre, setByGenre] = useState({});
  const [loading, setLoading] = useState(true);
  const preferredGenres = useMemo(() => user?.preferredGenres || [], [user]);

  useEffect(() => {
    fetchSeriesData();
  }, [preferredGenres.join(",")]);

  const fetchSeriesData = async () => {
    setLoading(true);
    try {
      const genresParam = preferredGenres.join(",");
      const [trendingRes, picksRes] = await Promise.all([
        axios.get("/api/series/trending"),
        axios.get(`/api/series/recommendations${genresParam ? `?genres=${genresParam}` : ""}`),
      ]);
      const trendingSeries = trendingRes.data.series || [];
      const allPicks = picksRes.data.series || [];
      
      const trendingTasteMatches = trendingSeries.filter(m => 
        m.genre_ids?.some(id => preferredGenres.includes(id))
      );
      
      const top3Trending = trendingTasteMatches.length >= 3 
        ? trendingTasteMatches.slice(0, 3) 
        : trendingSeries.slice(0, 3);
        
      const top3Ids = new Set(top3Trending.map(m => m.id));
      const next6Picks = allPicks.filter(m => !top3Ids.has(m.id)).slice(0, 6);
      
      setTrending(trendingSeries.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)));
      setPicks([...top3Trending, ...next6Picks]);

      const genreRows = {};
      await Promise.all(preferredGenres.slice(0, 4).map(async (genreId) => {
        const { data } = await axios.get(`/api/series/recommendations?genres=${genreId}`);
        genreRows[genreId] = data.series || [];
      }));
      setByGenre(genreRows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const hero = trending[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <SEOMeta
        title="Series"
        description="Discover trending series, top-rated shows, and personalized picks on Rushes."
        url="/series"
        keywords={["series", "tv shows", "streaming series", "trending series", "web series"]}
      />
      {hero && (
        <section className="relative h-[58vh] min-h-[420px]">
          <Image
            src={`/tmdb-proxy/original${hero.backdrop_path || hero.poster_path}`}
            alt={hero.name}
            width={780}
            height={440}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
          <div className="absolute bottom-10 left-0 right-0 mx-auto max-w-7xl px-4">
            <p className="mb-2 text-sm font-bold text-red-400">Top trending series today</p>
            <h1 className="max-w-2xl text-4xl font-black md:text-6xl">{hero.name}</h1>
            <p className="mt-3 max-w-2xl line-clamp-3 text-sm text-neutral-200 md:text-base">{hero.overview}</p>
          </div>
        </section>
      )}
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
        <h1 className="text-3xl font-black">Series</h1>
        <NetflixRow title="Top Trending Series" items={trending} loading={loading} />
        {user && <NetflixRow title="🔥 Today's Picks For You" items={picks} loading={loading} landscape={true} />}
        {preferredGenres.slice(0, 4).map((genreId) => (
          <NetflixRow key={genreId} title={`${GENRE_MAP[genreId] || "Genre"} Series`} items={byGenre[genreId]} loading={loading} />
        ))}
        <NetflixRow title="Leaving Soon" items={[]} loading={false} />
      </div>
    </div>
  );
}
