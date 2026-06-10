import Head from 'next/head';
import { motion } from 'framer-motion';
import { Film, RefreshCw, Mail } from 'lucide-react';
import { SITE_CONTACT } from '../lib/site';

export default function MaintenancePage() {
  return (
    <>
      <Head>
        <title>We'll Be Right Back — Rushes</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden relative">
        {/* Subtle animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center max-w-lg"
        >
          {/* Clapperboard icon */}
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/20 mb-8"
            animate={{ rotate: [0, -3, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Film className="w-12 h-12 text-red-400" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              We'll Be Right Back
            </span>
          </h1>

          <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
            We're making Rushes even better for you. 
            <br />
            <span className="text-neutral-500">Our team is working behind the scenes 🎬</span>
          </p>

          {/* Progress bar */}
          <div className="max-w-xs mx-auto mb-10">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '40%' }}
              />
            </div>
            <p className="text-xs text-neutral-600 mt-2">Updating systems...</p>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            <div className="bg-white/3 border border-white/5 rounded-xl px-4 py-3">
              <RefreshCw className="w-4 h-4 text-yellow-400 mx-auto mb-1.5 animate-spin" style={{ animationDuration: '3s' }} />
              <p className="text-xs text-neutral-400">Upgrading</p>
              <p className="text-[10px] text-neutral-600">Performance fixes</p>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-xl px-4 py-3">
              <div className="w-4 h-4 bg-green-400 rounded-full mx-auto mb-1.5 animate-pulse" />
              <p className="text-xs text-neutral-400">Data</p>
              <p className="text-[10px] text-neutral-600">Safe & secure</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-center justify-center gap-2 text-neutral-600">
            <Mail className="w-3.5 h-3.5" />
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              className="text-xs hover:text-neutral-400 transition-colors"
            >
              {SITE_CONTACT.email}
            </a>
          </div>

          <p className="text-[10px] text-neutral-800 mt-6">
            🎬 Rushes — Watch What Moves You
          </p>
        </motion.div>
      </div>
    </>
  );
}
