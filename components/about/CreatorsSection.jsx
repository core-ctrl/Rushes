import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Github, Linkedin, Globe, ArrowUpRight } from 'lucide-react';
import MovieDoodles from '../MovieDoodles';

const ProfileCard = ({ profile, isDominant, isDimmed }) => {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);
  const rotateX = useTransform(smoothY, [-100, 100], [8, -8]);
  const rotateY = useTransform(smoothX, [-100, 100], [-8, 8]);

  const handleMouseMove = (event) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Dynamic styling based on dominant state
  const baseScale = isDominant ? 1.05 : isDimmed ? 0.95 : 1;
  const baseOpacity = isDimmed ? 0.4 : 1;
  const dominantGlow = isDominant ? `shadow-[0_0_60px_rgba(34,211,238,0.2)] border-cyan-500/40` : `shadow-2xl border-white/5 hover:border-white/10`;

  return (
    <motion.div
      id={profile.id}
      ref={cardRef}
      style={{ 
        rotateX, 
        rotateY, 
        perspective: 1000,
        // Hand-drawn sketchy border radius!
        borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: baseOpacity, y: 0, scale: baseScale }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative z-10 w-full max-w-sm bg-neutral-900 border-2 p-8 flex flex-col items-center group transition-all duration-500 ${dominantGlow}`}
    >
      {isDominant && (
        <div 
          className="absolute inset-0 bg-cyan-500/5 animate-pulse pointer-events-none" 
          style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}
        />
      )}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
        style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}
      />
      
      {/* Sleek, professional Name & Role but slightly doodled */}
      <div className="flex flex-col items-center mb-6 w-full pt-2">
        <h3 className="text-3xl font-bold text-white mb-3 tracking-tight text-center relative">
          <span className="relative z-10">{profile.name}</span>
          {/* Subtle marker highlight behind name */}
          <span className={`absolute bottom-1 left-[-5%] w-[110%] h-3 ${profile.colorBg} -rotate-2 -z-0 opacity-50 blur-sm rounded-full`} />
        </h3>
        <div 
          className={`px-5 py-2 border-2 ${profile.colorBorder} ${profile.colorBg} -rotate-2 transform hover:rotate-2 transition-transform duration-300`}
          style={{ borderRadius: '20px 255px 15px 225px/255px 15px 225px 15px' }}
        >
          <p className={`font-black text-xs tracking-[0.2em] uppercase ${profile.colorText}`}>
            {profile.role}
          </p>
        </div>
      </div>

      {/* Secret Hover Message for specific cards */}
      {profile.hoverMessage && (
        <div className="h-0 group-hover:h-12 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center overflow-hidden w-full mb-2">
          <p className="text-cyan-400/90 text-sm font-medium text-center italic">
            {profile.hoverMessage}
          </p>
        </div>
      )}

      <div className="flex flex-col w-full gap-3 mt-auto">
        {profile.links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}
            className="flex items-center justify-between w-full px-5 py-4 bg-white/[0.02] hover:bg-white/[0.06] border-2 border-white/10 hover:border-white/20 transition-all duration-300 group/link relative z-20"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-neutral-400 group-hover/link:text-white transition-colors duration-300 group-hover/link:rotate-12 transform">
                {link.icon}
              </span>
              <span className="text-sm font-medium text-neutral-300 group-hover/link:text-white transition-colors">
                {link.label}
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover/link:text-white transition-colors opacity-0 group-hover/link:opacity-100 -translate-x-2 group-hover/link:translate-x-0" />
          </a>
        ))}
      </div>
    </motion.div>
  );
};

export default function CreatorsSection() {
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash) {
        setHighlightedId(window.location.hash.substring(1)); // removes the '#'
      } else {
        setHighlightedId(null);
      }
    };
    
    handleHashChange(); // initial check
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const profiles = [
    {
      id: "harshitha",
      name: "Sai Harshitha",
      role: "Technical",
      colorText: "text-neutral-300",
      colorBorder: "border-white/10",
      colorBg: "bg-white/5",
      links: [
        { label: "Portfolio", url: "https://parupallisaiharshitha.in", icon: <Globe className="w-5 h-5" /> },
        { label: "GitHub", url: "https://github.com/core-ctrl", icon: <Github className="w-5 h-5" /> },
        { label: "LinkedIn", url: "https://www.linkedin.com/in/parupalli-saiharshitha-51087b325/", icon: <Linkedin className="w-5 h-5" /> },
      ]
    },
    {
      id: "khyati",
      name: "Kvl Khyati",
      role: "Creative",
      colorText: "text-neutral-300",
      colorBorder: "border-white/10",
      colorBg: "bg-white/5",
      hoverMessage: "The Logo Designer & Creative Team",
      links: [
        { label: "GitHub", url: "https://github.com/Khyatikvl", icon: <Github className="w-5 h-5" /> },
        { label: "LinkedIn", url: "https://www.linkedin.com/in/khyati-kvl-7b7969364/", icon: <Linkedin className="w-5 h-5" /> },
      ]
    }
  ];

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <MovieDoodles />
      </div>
      
      <section className="relative py-20 mt-10 rounded-3xl bg-neutral-900/40 border border-white/5 backdrop-blur-sm overflow-hidden z-10">
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight text-center">
            The Creators
          </h2>
          <p className="text-neutral-400 mb-12 text-center text-sm">
            Building the future of how movie people connect.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full px-6">
            {profiles.map((profile, i) => {
              const isDominant = highlightedId === profile.id;
              const isDimmed = highlightedId && highlightedId !== profile.id;

              return (
                <ProfileCard 
                  key={i} 
                  profile={profile} 
                  isDominant={isDominant} 
                  isDimmed={isDimmed} 
                />
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
