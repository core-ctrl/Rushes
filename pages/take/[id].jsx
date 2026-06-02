// pages/take/[id].jsx
// Public shareable take URL — SSR for full WhatsApp/Twitter/OG preview

import Image from 'next/image';
import Link from 'next/link';
import SEOMeta from '../../components/SEOMeta';
import { TMDB_BLUR_DATA_URL } from '../../lib/imageBlur';
import { connectDB } from '../../lib/mongodb';
import Take from '../../models/Take';
import { UserIcon } from '@hugeicons/core-free-icons';
import AppIcon from '../../components/AppIcon';

const MOOD_EMOJI = {
  loved: '❤️',
  hyped: '🔥',
  bored: '😴',
  mindblown: '🤯',
  crying: '😭',
  laughing: '😂',
  scared: '😱',
  meh: '😐',
};

const RATING_STARS = (r) => {
  if (!r) return null;
  const n = Number(r);
  return '★'.repeat(Math.min(5, Math.max(1, Math.round(n)))) + '☆'.repeat(5 - Math.min(5, Math.round(n)));
};

function renderContent(content) {
    if (!content) return null;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 transition-colors underline break-all">
                    {part}
                </a>
            );
        }
        
        const mentionParts = part.split(/(@[a-zA-Z0-9_]+)/g);
        return mentionParts.map((mPart, j) => {
            if (mPart.startsWith('@')) {
                const username = mPart.slice(1);
                return (
                    <Link key={`${i}-${j}`} href={`/u/${username}`} className="text-red-400 hover:text-red-300 font-medium transition-colors">
                        {mPart}
                    </Link>
                );
            }
            return <span key={`${i}-${j}`}>{mPart}</span>;
        });
    });
}

export default function TakePage({ take, notFound }) {
  if (notFound || !take) {
    return (
      <>
        <SEOMeta title="Take not found" description="This take doesn't exist or was removed." noindex />
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center gap-4">
          <p className="text-5xl">🎬</p>
          <h1 className="text-2xl font-bold">Take not found</h1>
          <p className="text-neutral-500 text-sm">It may have been deleted or the link is broken.</p>
          <Link href="/" className="mt-4 text-red-400 hover:underline text-sm">← Back to Rushes</Link>
        </div>
      </>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rushes.in';
  const ogImage = take.moviePoster
    ? `https://image.tmdb.org/t/p/w780${take.moviePoster}`
    : `${baseUrl}/og-default.png`;

  const ogTitle = take.movieTitle ? `${take.username}'s take on ${take.movieTitle}` : `${take.username}'s take`;
  const ogDescription = take.content
    ? take.content.slice(0, 160)
    : `${MOOD_EMOJI[take.mood] || '🎬'} Rated ${take.rating}/5 on Rushes`;

  const likesCount = take.likes?.length || 0;
  const linkedMediaType = take.tmdbMediaType || (take.mediaType === 'tv' ? 'tv' : 'movie');
  const attachmentType = take.attachmentType || (['image', 'video'].includes(take.mediaType) ? take.mediaType : 'none');

  return (
    <>
      <SEOMeta
        title={ogTitle}
        description={ogDescription}
        image={ogImage}
        url={`/take/${take.id}`}
        type="article"
        keywords={[take.movieTitle || 'take', 'rushes take', 'movie review', take.username]}
      />

      <main className="min-h-screen bg-neutral-950 text-white pt-20">
        {/* Movie backdrop */}
        {take.moviePoster && (
          <div className="absolute top-0 left-0 right-0 h-80 w-full overflow-hidden z-0">
            <Image
              src={`https://image.tmdb.org/t/p/w1280${take.movieBackdrop || take.moviePoster}`}
              alt={take.movieTitle}
              fill
              className="object-cover opacity-20"
              priority
              sizes="100vw"
              placeholder="blur"
              blurDataURL={TMDB_BLUR_DATA_URL}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 relative z-10 pb-20 mt-12">
          {/* Movie poster + title */}
          {take.movieTitle && (
              <div className="flex gap-4 items-end mb-6">
                {take.moviePoster && (
                  <div className="relative w-24 md:w-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-2xl aspect-[2/3]">
                    <Image
                      src={`https://image.tmdb.org/t/p/w342${take.moviePoster}`}
                      alt={take.movieTitle}
                      fill
                      className="object-cover"
                      sizes="128px"
                      placeholder="blur"
                      blurDataURL={TMDB_BLUR_DATA_URL}
                    />
                  </div>
                )}
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Take on</p>
                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{take.movieTitle}</h1>
                  {take.rating && (
                    <p className="text-amber-400 text-sm mt-1 font-mono tracking-widest">
                      {RATING_STARS(take.rating)}
                    </p>
                  )}
                </div>
              </div>
          )}

          {/* Take card */}
          <div className="bg-neutral-900 border border-white/8 rounded-2xl p-6 mb-6 shadow-2xl">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              {take.avatar ? (
                  <img
                      src={take.avatar}
                      alt={`@${take.username}`}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-neutral-700/50 shadow-lg"
                  />
              ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center ring-2 ring-neutral-700/50 shadow-lg">
                      <AppIcon icon={UserIcon} size={20} className="text-neutral-500" />
                  </div>
              )}
              <div>
                <Link href={`/u/${take.username}`} className="font-bold text-white hover:text-red-400 transition-colors">
                  @{take.username}
                </Link>
                <p className="text-xs text-neutral-600">
                  {take.createdAt ? new Date(take.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Just now'}
                </p>
              </div>
              {take.mood && (
                <span className="ml-auto text-2xl" title={take.mood}>{MOOD_EMOJI[take.mood] || '🎬'}</span>
              )}
            </div>

            {/* Spoiler gate */}
            {take.spoiler ? (
              <details className="group">
                <summary className="cursor-pointer text-yellow-400 text-sm font-medium select-none mb-3 list-none flex items-center gap-2">
                  <span className="border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 rounded text-xs">⚠️ Spoiler</span>
                  Click to reveal
                </summary>
                <p className="text-white text-lg leading-relaxed whitespace-pre-wrap mt-3">{renderContent(take.content)}</p>
              </details>
            ) : (
              <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">{renderContent(take.content)}</p>
            )}

            {take.mediaUrl && attachmentType !== 'none' && (
              <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-black">
                {attachmentType === 'video' ? (
                  <video src={take.mediaUrl} controls className="max-h-[560px] w-full object-contain" />
                ) : (
                  <img src={take.mediaUrl} alt="Take attachment" className="max-h-[560px] w-full object-cover" />
                )}
              </div>
            )}
          </div>

          {/* Likes */}
          {likesCount > 0 && (
            <p className="text-neutral-500 text-sm mb-6">
              ❤️ {likesCount} {likesCount === 1 ? 'person' : 'people'} liked this
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/social"
              className="flex-1 text-center bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              See more Takes on Rushes
            </Link>
            {take.tmdbId && (
                <Link
                  href={`/${linkedMediaType === 'tv' ? 'series' : 'movies'}/${take.tmdbId}`}
                  className="flex-1 text-center bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors border border-white/8"
                >
                  View {take.movieTitle}
                </Link>
            )}
          </div>

          {/* Rushes branding footer */}
          <div className="mt-10 text-center">
            <Link href="/" className="inline-flex flex-col items-center gap-1 group">
              <span className="text-2xl font-black text-red-500 group-hover:text-red-400 transition-colors">Rushes</span>
              <span className="text-xs text-neutral-600">Where movie people connect</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { id } = params;

  try {
    await connectDB();
    const take = await Take.findById(id).lean();

    if (!take) {
      return { props: { notFound: true, take: null } };
    }

    take.id = take._id.toString();

    // Serialize dates — Next.js can't serialize Date objects natively in getServerSideProps
    return {
      props: {
        take: JSON.parse(JSON.stringify(take)),
        notFound: false,
      },
    };
  } catch (err) {
    console.error('Take SSR error:', err.message);
    return { props: { notFound: true, take: null } };
  }
}
