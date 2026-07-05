import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download01Icon, Cancel01Icon, Link01Icon } from '@hugeicons/core-free-icons';
import AppIcon from '../AppIcon';
import { toast } from '../ui/Toaster';

export default function ShareStoryCard({ isOpen, onClose, list }) {
  const cardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    if (list?.movies) {
      // Get up to 4 posters
      const validMovies = list.movies.filter(m => m.posterPath || m.poster_path).slice(0, 4);
      setPosters(validMovies);
    }
  }, [list]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleExport = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#050505',
        scale: 2, // High res for IG stories
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      const fileName = `rushes-list-${list.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;

      // Try native share first (works on iOS/Android for direct IG Story sharing)
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: list.title,
          });
          setIsExporting(false);
          return; // Success, exit early
        }
      } catch (shareError) {
        console.log("Native share failed", shareError);
      }
      
      // Fallback 1: Native Share without files (pops up the Windows Share menu)
      if (navigator.share) {
        await navigator.share({
          title: list.title,
          text: `Check out ${list.title} on Rushes`,
          url: window.location.href,
        });
        setIsExporting(false);
        return;
      }
      
      // Fallback 2: Trigger download
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Failed to export image", e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen || !list) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="min-h-screen flex items-center justify-center p-4 py-20 relative z-10 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm flex flex-col items-center pointer-events-auto"
          >
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <AppIcon icon={Cancel01Icon} size={20} />
            </button>

          {/* 9:16 Aspect Ratio Card Container */}
          <div 
            ref={cardRef}
            className="w-full aspect-[9/16] rounded-3xl overflow-hidden relative shadow-2xl bg-[#111]"
          >
            {/* Background Blur */}
            <div className="absolute inset-0 z-0">
              {posters[0] && (
                <img 
                  src={`https://image.tmdb.org/t/p/w300${posters[0].posterPath || posters[0].poster_path}`} 
                  alt="bg" 
                  className="w-full h-full object-cover opacity-40 blur-3xl scale-110"
                  crossOrigin="anonymous"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-[#0a0a0a]" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-white/50 font-bold tracking-widest text-xs uppercase">Rushes Curated</span>
                <span className="text-white/80 font-medium text-xs bg-white/10 px-3 py-1 rounded-full">
                  {list.movies?.length || 0} Titles
                </span>
              </div>

              {/* Grid of Posters */}
              <div className="flex-1 flex items-center justify-center w-full">
                <div className={`grid gap-3 w-full ${posters.length === 1 ? 'grid-cols-1' : posters.length === 2 ? 'grid-cols-2' : posters.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {posters.map((m, i) => (
                    <div 
                      key={m.tmdbId || i} 
                      className={`aspect-[2/3] rounded-xl overflow-hidden shadow-xl border border-white/10 ${posters.length === 3 && i === 0 ? 'col-span-2 w-2/3 mx-auto' : ''}`}
                    >
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${m.posterPath || m.poster_path}`} 
                        alt={m.title}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ))}
                  {posters.length === 0 && (
                    <div className="col-span-2 aspect-[2/3] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                      <span className="text-4xl">🎬</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer / List Info */}
              <div className="mt-8 text-center flex flex-col items-center">
                <h2 className="text-3xl font-black text-white mb-2 leading-tight">
                  {list.title}
                </h2>
                {list.userId?.username ? (
                  <p className="text-white/60 font-medium text-sm">
                    curated by @{list.userId.username}
                  </p>
                ) : (
                  <p className="text-white/60 font-medium text-sm">
                    curated by you
                  </p>
                )}
                
                <div className="mt-8 flex items-center justify-center gap-2 text-white/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  <span className="text-[10px] font-bold tracking-widest uppercase">Available on Rushes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons (Not included in export) */}
          <div className="mt-6 flex flex-col w-full gap-3">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <AppIcon icon={Download01Icon} size={20} />
              )}
              {isExporting ? 'Generating...' : 'Share to Story'}
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/lists/${list._id}`);
                toast({ type: 'success', message: 'Link copied! Add it as a Link Sticker on Instagram.' });
              }}
              className="w-full bg-white/10 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
            >
              <AppIcon icon={Link01Icon} size={20} />
              Copy Link
            </button>
          </div>
        </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
