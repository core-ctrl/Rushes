import React, { useEffect, useState } from 'react';
import { motion, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Clapperboard, Popcorn, Film, Camera, Ticket, Projector, Video, Tv } from 'lucide-react';

const MovieDoodles = ({ opacity = 1 }) => {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    setMounted(true);
    const handleGlobalMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const moveX1 = useTransform(smoothMouseX, [0, 1920], [-30, 30]);
  const moveY1 = useTransform(smoothMouseY, [0, 1080], [-30, 30]);
  
  const moveX2 = useTransform(smoothMouseX, [0, 1920], [45, -45]);
  const moveY2 = useTransform(smoothMouseY, [0, 1080], [45, -45]);

  const moveX3 = useTransform(smoothMouseX, [0, 1920], [-60, 60]);
  const moveY3 = useTransform(smoothMouseY, [0, 1080], [-60, 60]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ opacity }}>
      {/* Set 1: Moves opposite to mouse */}
      <motion.div style={{ x: moveX2, y: moveY2 }} className="absolute inset-0">
        <Clapperboard className="absolute top-[15%] left-[10%] w-12 h-12 text-white/5 rotate-12" strokeWidth={1} />
        <Ticket className="absolute top-[80%] right-[15%] w-14 h-14 text-white/5 -rotate-12" strokeWidth={1} />
        <Camera className="absolute top-[40%] left-[80%] w-16 h-16 text-white/5 rotate-45" strokeWidth={1} />
      </motion.div>

      {/* Set 2: Moves with mouse slightly */}
      <motion.div style={{ x: moveX1, y: moveY1 }} className="absolute inset-0">
        <Popcorn className="absolute top-[25%] right-[25%] w-12 h-12 text-white/5 rotate-[20deg]" strokeWidth={1} />
        <Film className="absolute bottom-[20%] right-[35%] w-20 h-20 text-white/5 -rotate-[15deg]" strokeWidth={1} />
        <Video className="absolute top-[65%] left-[8%] w-10 h-10 text-white/5 rotate-6" strokeWidth={1} />
      </motion.div>

      {/* Set 3: Moves more dramatically */}
      <motion.div style={{ x: moveX3, y: moveY3 }} className="absolute inset-0">
        <Projector className="absolute top-[50%] right-[10%] w-14 h-14 text-white/5 -rotate-[5deg]" strokeWidth={1} />
        <Tv className="absolute bottom-[10%] left-[40%] w-12 h-12 text-white/5 rotate-12" strokeWidth={1} />
        <Film className="absolute top-[10%] right-[60%] w-10 h-10 text-white/5 rotate-90" strokeWidth={1} />
      </motion.div>
    </div>
  );
};

export default MovieDoodles;
