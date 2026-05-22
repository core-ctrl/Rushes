// components/GenreRow.jsx
import MovieCard from "./MovieCard";
import Link from "next/link";
import HoverCard from "./cards/HoverCard";

export default function GenreRow({
    title,
    items = [],
    genreId,

    // NEW: global props
    wishlist,
    addToWishlist,
    openAuth,
    onPlayTrailer,
}) {
    return (
        <section className="my-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-3 px-1">
                <h2 className="text-2xl font-bold">{title}</h2>

                <Link href={`/genre/${genreId}`}>
                    <p className="text-gray-300 hover:text-white transition cursor-pointer">
                        See All →
                    </p>
                </Link>
            </div>

            <div
              className="flex gap-3 overflow-x-auto px-4 pb-4 scroll-row"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <style>{`.scroll-row::-webkit-scrollbar{display:none}`}</style>
              {items.map((item, i) => (
                <HoverCard key={item.id} item={item} index={i} onPlayTrailer={onPlayTrailer} />
              ))}
            </div>
        </section>
    );
}
