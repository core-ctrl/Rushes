import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

export default function HoverCard({ item, index, showTopBadge = false, landscape = false }) {
  const router = useRouter();

  const isTV = item.media_type === 'tv' || !!item.first_air_date;
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : null;
  const backdrop = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
    : poster;

  const rating = item.vote_average?.toFixed(1);
  const runtime = item.runtime ? `${item.runtime}min` : null;
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);

  // Availability logic
  const flatrate = item.providers?.flatrate || item.availability?.flatrate || [];
  const hasOTT = flatrate.length > 0;
  
  const releaseDate = item.release_date || item.first_air_date;
  const daysSinceRelease = releaseDate
    ? (Date.now() - new Date(releaseDate).getTime()) / (1000 * 60 * 60 * 24)
    : null;
  const isInTheaters = !hasOTT && daysSinceRelease !== null && daysSinceRelease >= -7 && daysSinceRelease <= 45;

  const statusLabel = hasOTT ? 'ON OTT' : isInTheaters ? 'IN THEATERS' : 'DISCOVER';
  const statusStyle = {
    'ON OTT': 'bg-emerald-500/90 text-white',
    'IN THEATERS': 'bg-amber-500/90 text-white',
    'DISCOVER': 'bg-black/70 text-neutral-300',
  }[statusLabel];

  const handleClick = (e) => {
    const type = item.media_type === 'tv' || isTV ? 'series' : 'movies';
    router.push(`/${type}/${item.id}`);
  };

  return (
    <div
      className={`relative flex-shrink-0 cursor-pointer ${landscape ? 'w-[240px] md:w-[280px]' : 'w-[140px] md:w-[160px]'}`}
      onClick={handleClick}
    >
      <motion.div
        className="flex flex-col gap-2 w-full h-full relative rounded-2xl overflow-hidden group transition-transform hover:scale-105 duration-300"
      >
        <div className={`w-full ${landscape ? 'aspect-video' : 'aspect-[2/3]'} rounded-xl overflow-hidden bg-neutral-800 relative`}>
          {landscape ? (
            backdrop || poster ? (
              <img
                src={backdrop || poster}
                alt={item.title || item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  if (backdrop && poster) e.target.src = poster;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-xs text-neutral-600">
                No image
              </div>
            )
          ) : (
            poster || backdrop ? (
              <img
                src={poster || backdrop}
                alt={item.title || item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  if (poster && backdrop) e.target.src = backdrop;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-xs text-neutral-600">
                No image
              </div>
            )
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

          {/* Top Left: Rating Pill */}
          {rating && rating > 0 && (
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold text-white shadow-sm border border-white/10 z-10">
              <span className={parseFloat(rating) >= 7 ? 'text-emerald-400' : parseFloat(rating) >= 5 ? 'text-amber-400' : 'text-red-400'}>{rating} ★</span>
            </div>
          )}

          {/* Top Right: Rank Badge */}
          {showTopBadge && index < 10 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-sm z-10">
              #{index + 1}
            </div>
          )}

          {/* Bottom Left: Runtime */}
          {runtime && (
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-sm border border-white/10 z-10">
              {runtime}
            </div>
          )}

          {/* Bottom Center/Right: Status Label */}
          <div className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider shadow-sm backdrop-blur-md border border-white/10 z-10 ${statusStyle}`}>
            {statusLabel}
          </div>
        </div>

        {/* Below Poster Info */}
        <div className="px-0.5 flex flex-col items-start">
          <h3 className="font-bold text-white text-sm line-clamp-1 w-full">
            {item.title || item.name}
          </h3>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            {year && <span className="mr-1">{year} •</span>}
            {isTV ? 'Series' : 'Movie'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
