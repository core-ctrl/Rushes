import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_GENRES, OTT_PLATFORMS } from "../lib/preferenceOptions";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import AppIcon from "./AppIcon";
import { useRouter } from "next/router";
import axios from "axios";

export default function RollTheDice({ floating }) {
  const [isOpen, setIsOpen] = useState(false);
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSurpriseMe = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (genre) params.append("genre", genre);
      if (platform) params.append("platform", platform);
      
      const res = await axios.get(`/api/movies/surprise?${params.toString()}`);
      
      if (res.data && res.data.id) {
        const route = res.data.media_type === "tv" ? "series" : "movies";
        router.push(`/${route}/${res.data.id}?playTrailer=true`);
        setIsOpen(false);
      }
    } catch (error) {
      alert("Oops! Couldn't find a match for that exact vibe. Try different filters.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          floating
            ? "fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
            : "w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 flex items-center justify-center gap-2 text-white font-medium shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all"
        }
        title="Roll the Dice"
      >
        <span className={floating ? "text-3xl" : "text-xl"}>🎲</span>
        {!floating && <span>Surprise Me</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass-strong rounded-3xl p-6 border border-white/10 relative"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 rounded-full"
              >
                <AppIcon icon={Cancel01Icon} size={16} />
              </button>

              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🎲</div>
                <h2 className="text-xl font-bold text-white mb-1">Roll the Dice</h2>
                <p className="text-sm text-neutral-400">Decision paralysis? Let us pick the perfect movie for you.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
                    Vibe / Genre (Optional)
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-purple-500"
                  >
                    <option value="" className="bg-black">Any Genre</option>
                    {ALL_GENRES.map((g) => (
                      <option key={g.id} value={g.id} className="bg-black">
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
                    Platform (Optional)
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-purple-500"
                  >
                    <option value="" className="bg-black">Any Platform</option>
                    {OTT_PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id} className="bg-black">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSurpriseMe}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Roll the Dice</span>
                    <span className="text-xl">🎲</span>
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
