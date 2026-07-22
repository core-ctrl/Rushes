// pages/dmca.js
import Head from "next/head";
import Link from "next/link";
import { SITE_CONTACT } from "../lib/site";

export default function DMCAPage() {
  const contactEmail = SITE_CONTACT.email;
  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4">
      <Head><title>DMCA Policy — Rushes</title></Head>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-red-400 hover:underline text-sm">← Back to Home</Link>
        <h1 className="text-3xl font-bold mt-6 mb-2">DMCA Policy</h1>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <p className="text-neutral-300 leading-relaxed mb-4">
            Rushes is a <strong className="text-white">discovery and aggregation platform</strong>. We do not host, store, upload or distribute any movies, TV shows or other copyrighted content.
          </p>
          <p className="text-neutral-300 leading-relaxed">
            All movie data and images are served directly from <strong className="text-white">TMDB (themoviedb.org)</strong>. All trailers are embedded from <strong className="text-white">YouTube</strong>. We do not control or host this content.
          </p>
        </div>

        <h2 className="text-xl font-bold mb-3">If You Believe Your Content Is Being Infringed</h2>
        <p className="text-neutral-300 leading-relaxed mb-6">
          Since we do not host content, the correct DMCA contact for movie data is <a href="https://www.themoviedb.org/talk/5f9c9c9c9c9c9c9c9c9c9c9c" className="text-red-400 hover:underline">TMDB</a> and for trailers it is <a href="https://www.youtube.com/t/dmca_policy" className="text-red-400 hover:underline">YouTube</a>.
        </p>

        <h2 className="text-xl font-bold mb-3">Contact Us</h2>
        <p className="text-neutral-300 leading-relaxed">
          If you have a concern specific to Rushes platform content, email:<br />
          <a href={`mailto:${contactEmail}`} className="text-red-400 hover:underline">{contactEmail}</a> (our only official email)
        </p>
      </div>
    </div>
  );
}
