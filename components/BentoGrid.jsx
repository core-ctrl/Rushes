// components/BentoGrid.jsx
// Magic Bento Grid for homepage — shows featured content in editorial layout
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { PlayIcon, Tv01Icon } from "@hugeicons/core-free-icons";
import AppIcon from "./AppIcon";
import { TMDB_BLUR_DATA_URL } from "../lib/imageBlur";

function BentoCell({ item, size = "normal", rank }) {
  if (!item) return <div className="bento-cell skeleton" />;
  const isMovie = item.media_type === "movie" || item.title;
  const href    = isMovie ? `/movies/${item.id}` : `/series/${item.id}`;
  const img     = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
    : item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "/fallback.jpg";
  const TypeIcon = isMovie ? PlayIcon : Tv01Icon;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bento-cell group cursor-pointer"
    >
      <Link href={href} className="block w-full h-full relative">
        <Image
          src={img}
          alt={item.title || item.name}
          width={780}
          height={440}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {rank && (
          <span className="absolute top-4 left-4 text-5xl font-black text-white/20 select-none leading-none">{rank}</span>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          {size === "large" && (
            <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
              <AppIcon icon={TypeIcon} size={14} />
              {isMovie ? "Movie" : "Series"}
            </span>
          )}
          <h3 className={`font-bold text-white leading-tight ${size === "large" ? "text-2xl" : "text-base"}`}>
            {item.title || item.name}
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            {item.vote_average > 0 && <span className="text-yellow-400 text-xs">★ {item.vote_average.toFixed(1)}</span>}
            <span className="text-neutral-400 text-xs">{(item.release_date || item.first_air_date || "").slice(0, 4)}</span>
          </div>
          {size === "large" && item.overview && (
            <p className="text-neutral-300 text-xs mt-2 line-clamp-2 max-w-sm">{item.overview}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function BentoGrid({ items = [], title }) {
  const [a, b, c, d, e] = items;

  return (
    <section className="mb-16">
      {title && (
        <motion.div className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <h2 className="heading-1">{title}</h2>
        </motion.div>
      )}

      {/* Bento Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 h-auto min-h-[320px] md:h-[520px]">
        {/* Large feature — col 1-2, row 1-2 */}
        <div className="col-span-2 row-span-2">
          <BentoCell item={a} size="large" />
        </div>
        {/* Top right 2 — col 3-4, row 1 */}
        <div className="col-span-1 row-span-1 h-full">
          <BentoCell item={b} rank="2" />
        </div>
        <div className="col-span-1 row-span-1 h-full">
          <BentoCell item={c} rank="3" />
        </div>
        {/* Bottom right 2 — col 3-4, row 2 */}
        <div className="col-span-1 row-span-1 h-full">
          <BentoCell item={d} rank="4" />
        </div>
        <div className="col-span-1 row-span-1 h-full">
          <BentoCell item={e} rank="5" />
        </div>
      </div>
    </section>
  );
}
