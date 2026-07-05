// pages/my-list/index.js
import Head from "next/head";
import Link from "next/link";

import ListNavigation from "../../components/lists/ListNavigation";
import Image from "next/image";
import { TMDB_BLUR_DATA_URL } from "../../lib/imageBlur";
import ListBuilder from "../../components/lists/ListBuilder";

function recentContext(item) {
  const seenAt = item.watchedAt || item.viewedAt || item.addedAt;
  if (!seenAt) return "";
  const diffDays = Math.floor((Date.now() - new Date(seenAt).getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return "You checked this today";
  if (diffDays === 1) return "You checked this yesterday";
  if (diffDays <= 7) return `You checked this ${diffDays} days ago`;
  return "";
}

export default function MyListPage({ wishlist = [], addToWishlist, user, openAuth }) {
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 pt-20">
        <Head><title>My List — Rushes</title></Head>
        <p className="text-4xl">🔒</p>
        <p className="text-xl font-bold">Sign in to see your list</p>
        <p className="text-neutral-400 text-sm">Save movies and series to watch later</p>
        <button
          onClick={openAuth}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-28 px-4 md:px-6">
      <Head><title>My List — Rushes</title></Head>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">❤️ My List</h1>
            <p className="text-neutral-400 text-sm">
              {wishlist.length} saved title{wishlist.length !== 1 ? "s" : ""}. Watchlist updates appear here when titles move to OTT.
            </p>
          </div>
          
          <ListNavigation />
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🎬</p>
            <p className="text-neutral-400">Nothing saved yet.</p>
            <Link href="/" className="mt-4 inline-block text-red-400 hover:underline">
              Browse titles →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {wishlist.map((item) => {
              const isMovie = item.mediaType === "movie" || item.media_type === "movie" || item.title;
              const href = isMovie
                ? `/movies/${item.mediaId || item.id}`
                : `/series/${item.mediaId || item.id}`;

              return (
                <div key={item.mediaId || item.id} className="group relative">
                  <Link href={href}>
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 mb-2">
                      {item.posterPath || item.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w300${item.posterPath || item.poster_path}`}
                          alt={item.title || item.name}
                          width={200}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
                      )}
                    </div>
                  </Link>
                  <p className="text-sm font-medium truncate">{item.title || item.name}</p>
                  {recentContext(item) ? (
                    <p className="mt-1 text-xs text-amber-300">{recentContext(item)}</p>
                  ) : null}
                  <button
                    onClick={() => addToWishlist({ id: item.mediaId || item.id, media_type: item.mediaType || item.media_type, ...item })}
                    className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600/60"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
        
        <ListBuilder 
          existingMovies={wishlist}
          onAddMovie={(item) => addToWishlist({ 
            id: item.tmdbId, 
            media_type: item.mediaType, 
            ...item 
          })}
        />
      </div>
    </div>
  );
}
