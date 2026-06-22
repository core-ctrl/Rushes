import { motion } from 'framer-motion';

export default function ClapperLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Clapperboard */}
      <div className="relative w-16 h-14">
        {/* Bottom board */}
        <div className="absolute bottom-0 left-0 right-0 h-9 bg-neutral-800 rounded-lg border border-white/10 overflow-hidden">
          <div className="flex h-full">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex-1 flex">
                <div className="w-1/2 bg-neutral-800" />
                <div className="w-1/2 bg-neutral-700" />
              </div>
            ))}
          </div>
        </div>

        {/* Clapper arm (animated) */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-5 origin-bottom-left"
          animate={{ rotateZ: [0, -30, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-full h-full bg-gradient-to-r from-red-600 to-red-500 rounded-t-lg border border-red-400/30 overflow-hidden">
            <div className="flex h-full">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex-1 flex">
                  <div className="w-1/2 bg-red-600/0" />
                  <div className="w-1/2 bg-black/20" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Loading text */}
      <motion.p
        className="text-sm text-neutral-500 font-medium"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  );
}