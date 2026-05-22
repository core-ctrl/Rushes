import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import MovieCard from "./MovieCard";
import AppIcon from "./AppIcon";
import HoverCard from "./cards/HoverCard";

export default function TopCarousel({
  items = [],
  title = "Top Picks",
  onPlayTrailer,
  addToWishlist,
  wishlist,
  openAuth,
  nowPlayingIds,
}) {
  const ref = useRef(null);

  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * 640, behavior: "smooth" });
  };

  return (
    <motion.section
      className="relative mb-14"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white md:text-2xl">{title}</h3>
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

      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto px-4 pb-4 scroll-row"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <style>{`.scroll-row::-webkit-scrollbar{display:none}`}</style>
        {items.map((item, i) => (
          <HoverCard key={item.id} item={item} index={i} showTopBadge onPlayTrailer={onPlayTrailer} />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-black to-transparent" />
    </motion.section>
  );
}
