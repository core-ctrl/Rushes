import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Film, Copy, ExternalLink, Check } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { TMDB_BLUR_DATA_URL } from '../../lib/imageBlur';
import { toast } from '../../components/ui/Toaster';

export default function SharedWatchlist() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/watchlist/shared?id=${id}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ type: 'success', message: 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="text-center">
          <Film className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">List not found</h2>
          <p className="text-neutral-500">This watchlist doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{data.displayName || data.username}'s Watchlist — Rushes</title>
        <meta name="description" content={`Check out ${data.username}'s watchlist with ${data.totalItems} titles on Rushes`} />
      </Head>
      <div className="min-h-screen bg-neutral-950 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <img
              src={data.avatar || '/avatar.svg'}
              alt={data.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/20 mx-auto mb-4"
            />
            <h1 className="text-3xl font-black text-white mb-1">
              {data.displayName || `@${data.username}`}'s Watchlist
            </h1>
            <p className="text-neutral-500 mb-4">{data.totalItems} titles</p>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-neutral-300 hover:text-white hover:bg-white/10 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share this list'}
            </button>
          </motion.div>

          {data.items.length === 0 ? (
            <div className="text-center py-20">
              <Film className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500">This watchlist is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.items.map((item, index) => (
                <motion.a
                  key={`${item.mediaId}-${item.mediaType}`}
                  href={`/${item.mediaType === 'tv' ? 'series' : 'movies'}/${item.mediaId}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 bg-neutral-900 transition-all hover:scale-[1.02] hover:shadow-2xl"
                >
                  {item.posterPath ? (
                    <Image
                      src={`/tmdb-proxy/w300${item.posterPath}`}
                      alt={item.title}
                      width={300}
                      height={450}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-neutral-800 flex items-center justify-center">
                      <Film className="w-10 h-10 text-neutral-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <p className="text-sm font-bold text-white line-clamp-2">{item.title}</p>
                    <p className="text-xs text-neutral-400 capitalize mt-0.5 flex items-center gap-1">
                      {item.mediaType} <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
