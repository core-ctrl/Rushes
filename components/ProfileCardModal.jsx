import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Share2, Check, Clapperboard, Users, Film, Download } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "./ui/Toaster";
import Image from "next/image";

export default function ProfileCardModal({ open, onClose, profile, takesCount, listsCount }) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  if (!profile) return null;

  const url = typeof window !== 'undefined' ? `${window.location.origin}/u/${profile.username}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ type: 'success', message: 'Link copied!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ type: 'error', message: 'Failed to copy link' });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `@${profile.username} on Rushes`,
          text: profile.bio || "Check out my movie taste profile!",
          url: url,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl border border-white/10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>

            {/* The Shareable Card Content */}
            <div ref={cardRef} className="relative overflow-hidden bg-gradient-to-br from-neutral-900 to-black p-6 pt-10 text-center">
              {/* Decorative Background Blob */}
              <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-red-600/20 blur-[60px]" />
              
              <div className="relative mx-auto mb-4 h-24 w-24">
                <img
                  src={profile.avatar || "/avatar.svg"}
                  alt={`@${profile.username}`}
                  className="h-full w-full rounded-full border-4 border-neutral-800 object-cover shadow-xl"
                />
                {profile.isVerified && (
                  <div className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-1 shadow-lg ring-2 ring-neutral-900">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black text-white">{profile.displayName || profile.name}</h2>
              <p className="text-sm font-medium text-red-400 mb-4">@{profile.username}</p>

              {profile.bio && (
                <p className="mb-6 text-sm text-neutral-300 line-clamp-3">
                  "{profile.bio}"
                </p>
              )}

              <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                    <Users className="h-3 w-3" />
                  </div>
                  <p className="text-lg font-bold text-white">{profile.followers?.length || 0}</p>
                  <p className="text-[10px] uppercase text-neutral-500">Followers</p>
                </div>
                <div className="text-center border-l border-r border-white/5">
                  <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                    <Clapperboard className="h-3 w-3" />
                  </div>
                  <p className="text-lg font-bold text-white">{takesCount || 0}</p>
                  <p className="text-[10px] uppercase text-neutral-500">Takes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-neutral-400 mb-1">
                    <Film className="h-3 w-3" />
                  </div>
                  <p className="text-lg font-bold text-white">{listsCount || 0}</p>
                  <p className="text-[10px] uppercase text-neutral-500">Lists</p>
                </div>
              </div>

              {/* Rushes Branding inside the card */}
              <div className="flex items-center justify-center gap-2 opacity-50">
                <div className="h-4 w-4 rounded-full bg-red-600" />
                <span className="text-xs font-bold tracking-widest text-white">RUSHES</span>
              </div>
            </div>

            {/* Actions (Not part of the screenshot, just tools) */}
            <div className="flex gap-2 border-t border-white/5 bg-black/40 p-4">
              <button
                onClick={handleCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </button>
              <button
                onClick={handleNativeShare}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-glow-red transition-all hover:bg-red-500"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
