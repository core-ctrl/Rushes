import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import MovieCard from "./MovieCard";
import { SkeletonCard } from "./SkeletonCard";
import AppIcon from "./AppIcon";
import HoverCard from "./cards/HoverCard";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function SectionRow({
  title,
  subtitle,
  items = [],
  renderItem,
  isEmptyFallbackMessage,
  wishlist,
  addToWishlist,
  openAuth,
  onPlayTrailer,
  loading = false,
  nowPlayingIds,
}) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 640, behavior: "smooth" });
  };

  if (!loading && (!items || items.length === 0)) {
    return (
      <section className="mb-12">
        <h3 className="mb-3 text-xl font-bold">{title}</h3>
        <p className="text-sm text-neutral-500">{isEmptyFallbackMessage || "Nothing here yet."}</p>
      </section>
    );
  }

  return (
    <motion.section
      className="mb-14"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex items-end justify-between px-0.5">
        <div>
          <h3 className="text-xl font-bold text-white md:text-2xl">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
        </div>
        <div className="hidden gap-1.5 md:flex">
          <button
            onClick={() => scroll(-1)}
            className="glass flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition-all hover:border-white/30"
          >
            <AppIcon icon={ArrowLeft01Icon} size={10} />
          </button>
          <button
            onClick={() => scroll(1)}
            className="glass flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition-all hover:border-white/30"
          >
            <AppIcon icon={ArrowRight01Icon} size={10} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden py-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-4 pb-4 scroll-row"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <style>{`.scroll-row::-webkit-scrollbar{display:none}`}</style>
          {items.map((item, i) => (
            renderItem ? (
              renderItem(item)
            ) : (
              <HoverCard key={item.id} item={item} index={i} onPlayTrailer={onPlayTrailer} />
            )
          ))}
        </div>
      )}
    </motion.section>
  );
}
