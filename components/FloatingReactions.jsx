import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingReactions = forwardRef((props, ref) => {
  const [reactions, setReactions] = useState([]);

  useImperativeHandle(ref, () => ({
    addReaction(emoji) {
      const id = Date.now() + Math.random();
      // Random starting X position between 5% and 95% of the container width
      const startX = 5 + Math.random() * 90;
      
      setReactions((prev) => [...prev, { id, emoji, startX }]);

      // Remove the reaction after animation completes (e.g. 3s)
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    }
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            initial={{ 
              opacity: 0, 
              y: 50, 
              x: `${reaction.startX}%`,
              scale: 0.5 
            }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: -200, 
              x: [
                `${reaction.startX}%`, 
                `${reaction.startX - 10 + Math.random() * 20}%`, 
                `${reaction.startX - 10 + Math.random() * 20}%`
              ],
              scale: [0.5, 1.2, 1] 
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 2.5, 
              ease: "easeOut",
              times: [0, 0.2, 0.8, 1]
            }}
            className="absolute bottom-0 text-3xl md:text-5xl"
            style={{ left: 0 }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

FloatingReactions.displayName = 'FloatingReactions';

export default FloatingReactions;
