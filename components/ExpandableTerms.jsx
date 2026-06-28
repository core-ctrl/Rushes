import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ExpandableTerms({ isChecked, setIsChecked }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col mb-4">
      {/* Checkbox row */}
      <div className="p-4 flex items-start gap-3 bg-black/20">
        <div className="pt-0.5">
          <input
            type="checkbox"
            id="terms"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="w-4 h-4 rounded bg-black/50 border-white/20 text-[#e50914] focus:ring-[#e50914] cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer font-medium select-none">
            I accept the <span className="text-white">Terms & Conditions</span> and <span className="text-white">Privacy Policy</span>
          </label>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10"
          >
            <div className="p-4 max-h-48 overflow-y-auto text-xs text-gray-400 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <h4 className="font-bold text-white text-sm">Terms of Service & Privacy Policy</h4>
              <p>
                By creating an account on Rushes, you agree to abide by our community guidelines and terms of service. 
                Rushes is a platform for discovering, reviewing, and watching content together with friends.
              </p>
              <h5 className="font-bold text-white mt-2">1. Watch Party Usage</h5>
              <p>
                When participating in Watch Parties, you acknowledge that synchronized playback requires an active, 
                valid subscription to the respective streaming platforms (Netflix, Prime Video, etc.). 
                Rushes does not pirate or host copyrighted full-length movies on its servers.
              </p>
              <h5 className="font-bold text-white mt-2">2. Data & Privacy</h5>
              <p>
                We collect minimal data necessary for core features, such as your username, email, and watch history. 
                Your passwords are securely hashed. We do not sell your personal data to third parties.
              </p>
              <h5 className="font-bold text-white mt-2">3. User Conduct</h5>
              <p>
                You agree not to use our social features (reviews, lists, chat, Watch Parties) to harass, abuse, 
                or distribute inappropriate content. Violations may result in account termination.
              </p>
              <h5 className="font-bold text-white mt-2">4. Content Rights & Revenue</h5>
              <p>
                All movie, television show, and actor metadata, including posters and backdrop images, are provided by 
                and are the exclusive property of TMDB (The Movie Database). We do not claim ownership of TMDB's content. 
                However, the Rushes platform, its source code, and its design are our exclusive property. Any revenue 
                generated through the platform, including but not limited to future AdSense or advertising revenue, 
                belongs exclusively to Rushes.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
