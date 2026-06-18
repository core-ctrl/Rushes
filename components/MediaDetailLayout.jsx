import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import SEOMeta from "./SEOMeta";
import WatchNowButtons from "./WatchNowButtons";
import TrailerModal from "./TrailerModal";
import WatchPartyModal from "./WatchPartyModal";
import ShareButton from "./ShareButton";
import ErrorBoundary from "./ErrorBoundary";
import { TMDB_BLUR_DATA_URL } from "../lib/imageBlur";
import { PlayIcon, PlusSignIcon, UserIcon } from "@hugeicons/core-free-icons";
import AppIcon from "./AppIcon";

export default function MediaDetailLayout({
  media,
  mediaType,
  regionCode,
  trailerKey,
  trailerLoading,
  isTrailerOpen,
  setIsTrailerOpen,
  handlePlayTrailer,
  isInList,
  addToWishlist,
}) {
  const [isWatchPartyModalOpen, setIsWatchPartyModalOpen] = React.useState(false);
  const [dominantColor, setDominantColor] = React.useState('147, 51, 234'); // Default purple
  const isMovie = mediaType === "movie";
  const title = media.title || media.name;
  const releaseDate = media.release_date || media.first_air_date;
  const year = releaseDate?.slice(0, 4);
  const ogImage = media.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
    : undefined;

  const creatorOrDirector = isMovie
    ? media.credits?.crew?.find((p) => p.job === "Director")
    : media.created_by?.[0];

  const regionalRelease = isMovie
    ? media.releaseDates?.find((e) => e.iso_3166_1 === regionCode)
    : null;
    
  const releaseDateForProviders = regionalRelease?.release_dates?.[0]?.release_date || releaseDate;

  const bgImage = media.backdrop_path || media.poster_path || "/fallback.jpg";
  const bgUrl = (p) => p?.startsWith("http") ? p : `https://image.tmdb.org/t/p/w780${p}`;

  React.useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = bgUrl(bgImage);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.height = 80;
        ctx.drawImage(img, 0, 0, 80, 80);
        const data = ctx.getImageData(0, 0, 80, 80).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 24) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        if (count > 0) setDominantColor(`${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}`);
      } catch (e) { }
    };
  }, [bgImage]);

  // THEATER TAG LOGIC (Movies only)
  const flatrate = media.providers?.flatrate || [];
  const hasOTTProviders = flatrate.length > 0;
  const isRecentRelease = (() => {
    if (!isMovie || !releaseDate) return false;
    const release = new Date(releaseDate);
    if (Number.isNaN(release.getTime())) return false;
    const daysSinceRelease = (Date.now() - release.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRelease >= -7 && daysSinceRelease <= 45;
  })();

  const inTheaters = isMovie && !hasOTTProviders && isRecentRelease;
  const isStreaming = hasOTTProviders;
  const availabilityStatus = isStreaming ? "STREAMING" : inTheaters ? "IN THEATERS" : "UNKNOWN";

  const streamUrl = flatrate.length > 0
    ? (() => {
        const name = flatrate[0].provider_name || '';
        const links = [
          { match: /netflix/i, url: `https://www.netflix.com/search?q=${encodeURIComponent(title)}` },
          { match: /prime|amazon/i, url: `https://www.primevideo.com/search?phrase=${encodeURIComponent(title)}` },
          { match: /disney/i, url: `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}` },
          { match: /hotstar/i, url: `https://www.hotstar.com/in/search?q=${encodeURIComponent(title)}` },
          { match: /jio/i, url: `https://www.jiocinema.com/search/${encodeURIComponent(title)}` },
          { match: /zee5/i, url: `https://www.zee5.com/search?q=${encodeURIComponent(title)}` },
          { match: /apple/i, url: `https://tv.apple.com/search?term=${encodeURIComponent(title)}` },
        ];
        return links.find(l => l.match.test(name))?.url || '';
      })()
    : '';

  return (
    <div 
      className="min-h-screen bg-black text-white transition-colors duration-1000"
      style={{ '--theme-color': dominantColor }}
    >
      <SEOMeta
        title={`${title} (${year}) — Watch Trailer & Where to Stream`}
        description={media.overview?.slice(0, 160)}
        image={ogImage}
        url={`/${isMovie ? 'movies' : 'series'}/${media.id}`}
        type={isMovie ? "video.movie" : "video.tv_show"}
        keywords={[
          title,
          `${isMovie ? 'movie' : 'series'} trailer`,
          "where to watch",
          ...(media.genres?.map((g) => g.name) || []),
        ]}
      />

      <ErrorBoundary>
        {/* Backdrop */}
        <div className="relative h-[55vh] w-full md:h-[75vh]">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute inset-0 z-10 mix-blend-color transition-colors duration-1000" style={{ backgroundColor: 'rgba(var(--theme-color), 0.5)' }} />
          <div className="absolute inset-0 z-10 transition-colors duration-1000 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(var(--theme-color), 0.15) 0%, transparent 40%)' }} />
          <Image
            src={`https://image.tmdb.org/t/p/original${media.backdrop_path}`}
            alt={title}
            width={780}
            height={440}
            className="h-full w-full object-cover"
            placeholder="blur"
            blurDataURL={TMDB_BLUR_DATA_URL}
          />
        </div>

        <div className="relative z-20 mx-auto -mt-40 max-w-6xl px-4 md:-mt-56 md:px-6">
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Poster */}
            <div className="flex-shrink-0 w-36 md:w-64">
              <motion.div layoutId={`poster-${media.id}`} className="relative aspect-[2/3] w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image
                  src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
                  alt={title}
                  width={256}
                  height={384}
                  className="h-full w-full object-cover"
                  priority
                  placeholder="blur"
                  blurDataURL={TMDB_BLUR_DATA_URL}
                />
              </motion.div>
            </div>

            <div className="md:pt-16">
              <h1 className="mb-3 text-3xl font-bold md:text-5xl">{title}</h1>
              
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-neutral-300">
                <span>⭐ {media.vote_average?.toFixed(1)}</span>
                {year && <span>{year}</span>}
                {isMovie && media.runtime > 0 && <span>{media.runtime}m</span>}
                {!isMovie && media.number_of_seasons > 0 && (
                  <span>
                    {media.number_of_seasons} Season{media.number_of_seasons !== 1 ? "s" : ""}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    media.status === "Released" || media.status === "Returning Series"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-yellow-600/20 text-yellow-400"
                  }`}
                >
                  {media.status === "Released" ? "Available" : media.status}
                </span>
              </div>
              
              <div className="mb-5 flex flex-wrap gap-2">
                {media.genres?.map((g) => (
                  <span key={g.id} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                    {g.name}
                  </span>
                ))}
              </div>
              
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-neutral-300 md:text-base">
                {media.overview}
              </p>
              
              {creatorOrDirector && (
                <p className="mb-6 text-sm text-neutral-400">
                  <span className="font-medium text-white">{isMovie ? 'Director' : 'Creator'}:</span> {creatorOrDirector.name}
                </p>
              )}
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePlayTrailer}
                  disabled={trailerLoading}
                  style={{ backgroundColor: 'rgb(var(--theme-color))' }}
                  className="flex items-center gap-2 rounded-xl px-6 py-3 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_20px_rgba(var(--theme-color),0.4)]"
                >
                  <AppIcon icon={PlayIcon} size={17} className="fill-current" />
                  {trailerLoading ? "Loading…" : "Play Trailer"}
                </button>
                <button
                  onClick={() => addToWishlist({ ...media, media_type: mediaType, title })}
                  className={`rounded-xl px-6 py-3 font-medium transition flex items-center gap-2 ${
                    isInList
                      ? "border border-green-600/40 bg-green-600/20 text-green-400"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {isInList ? "✓ In My List" : <><AppIcon icon={PlusSignIcon} size={16} /> My List</>}
                </button>
              </div>
              
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <ShareButton movie={{ ...media, media_type: mediaType, title }} />

                {/* Watch Together */}
                <button
                  onClick={() => setIsWatchPartyModalOpen(true)}
                  style={{ 
                    borderColor: 'rgba(var(--theme-color), 0.3)', 
                    backgroundColor: 'rgba(var(--theme-color), 0.1)',
                    color: 'rgb(var(--theme-color))'
                  }}
                  className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-black/20"
                >
                  👥 Watch Together
                </button>
              </div>
              
              <WatchNowButtons
                providers={media.providers}
                title={title}
                region={media.region || regionCode}
                releaseDate={releaseDateForProviders}
                theatrical={inTheaters}
                availabilityStatus={availabilityStatus}
              />
            </div>
          </div>

          {/* Cast */}
          {media.credits?.cast?.length > 0 && (
            <section className="mt-16">
              <h2 className="mb-6 text-2xl font-bold">Cast</h2>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
                {media.credits.cast.slice(0, 12).map((actor) => (
                  <div key={actor.id} className="w-24 flex-none md:w-28">
                    <div className="mb-2 h-32 w-full overflow-hidden rounded-xl bg-white/5 md:h-36">
                      {actor.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                          width={100}
                          height={100}
                          className="h-full w-full object-cover"
                          placeholder="blur"
                          blurDataURL={TMDB_BLUR_DATA_URL}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-500">
                          <AppIcon icon={UserIcon} size={26} />
                        </div>
                      )}
                    </div>
                    <p className="truncate text-xs font-medium">{actor.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {actor.character}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Similar */}
          {media.similar?.results?.length > 0 && (
            <section className="mb-20 mt-12">
              <h2 className="mb-6 text-2xl font-bold">You May Also Like</h2>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
                {media.similar.results.slice(0, 10).map((m) => {
                  const mTitle = m.title || m.name;
                  return (
                    <Link
                      key={m.id}
                      href={`/${isMovie ? 'movies' : 'series'}/${m.id}`}
                      className="group w-28 flex-none md:w-36"
                    >
                      <div className="mb-2 h-40 overflow-hidden rounded-xl border border-white/10 md:h-52">
                        <Image
                          src={
                            m.poster_path
                              ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
                              : "/fallback.jpg"
                          }
                          alt={mTitle}
                          width={200}
                          height={300}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          placeholder="blur"
                          blurDataURL={TMDB_BLUR_DATA_URL}
                        />
                      </div>
                      <p className="truncate text-xs font-medium transition group-hover:text-red-400">
                        {mTitle}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <div className="pb-12 text-center">
            <a
              href={`https://www.themoviedb.org/${isMovie ? 'movie' : 'tv'}/${media.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-neutral-500 transition hover:text-neutral-300"
            >
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                alt="TMDB"
                className="h-3 opacity-50"
              />
              Data from TMDB
            </a>
          </div>
        </div>
      </ErrorBoundary>

      <TrailerModal
        open={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        videoIdOrUrl={trailerKey}
        title={title}
      />

      <WatchPartyModal
        isOpen={isWatchPartyModalOpen}
        onClose={() => setIsWatchPartyModalOpen(false)}
        mediaTitle={title}
        mediaId={media.id}
        mediaType={mediaType}
        streamingUrl={streamUrl}
      />
    </div>
  );
}
