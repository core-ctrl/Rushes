// components/CastList.jsx
import Image from "next/image";
import { TMDB_BLUR_DATA_URL } from "../lib/imageBlur";

export default function CastList({ cast = [] }) {
  if (!cast.length) return null;
  return (
    <div 
      className="flex gap-4 overflow-x-auto pb-4 scroll-container"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        overflowX: 'auto',
      }}
    >
      <style>{`
        .scroll-container::-webkit-scrollbar { display: none; }
      `}</style>
      {cast.slice(0, 12).map((actor) => (
        <div key={actor.id} className="flex-shrink-0 w-24">
          <div className="w-full h-32 rounded-xl overflow-hidden bg-white/5 mb-2">
            {actor.profile_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                alt={actor.name}
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
            )}
          </div>
          <p className="text-xs font-medium truncate">{actor.name}</p>
          <p className="text-xs text-neutral-500 truncate">{actor.character}</p>
        </div>
      ))}
    </div>
  );
}
