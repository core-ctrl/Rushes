import { useRef, useState, useEffect } from "react";
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
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [items, loading]);

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
      <div className="mb-4 px-1">
        <h3 className="text-xl font-bold text-white md:text-2xl">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden py-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : (
        <div className="group relative -mx-4 px-4 md:mx-0 md:px-0">
          {/* Left Scroll Button */}
          {showLeftScroll && (
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-0 z-20 hidden h-[calc(100%-16px)] w-14 items-center justify-center bg-gradient-to-r from-black/90 via-black/50 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100 md:flex"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110 hover:bg-black/80 border border-white/20">
                <AppIcon icon={ArrowLeft01Icon} size={18} />
              </div>
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto pb-4 scroll-row"
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

          {/* Right Scroll Button */}
          {showRightScroll && (
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-0 z-20 hidden h-[calc(100%-16px)] w-14 items-center justify-center bg-gradient-to-l from-black/90 via-black/50 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100 md:flex"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110 hover:bg-black/80 border border-white/20">
                <AppIcon icon={ArrowRight01Icon} size={18} />
              </div>
            </button>
          )}
        </div>
      )}
    </motion.section>
  );
}
