import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download01Icon, Cancel01Icon, Link01Icon } from '@hugeicons/core-free-icons';
import AppIcon from '../AppIcon';
import { toast } from '../ui/Toaster';

export default function MovieShareStoryCard({ isOpen, onClose, movie, mediaType }) {
  const cardRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

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
      
      const fileName = `rushes-${(movie?.title || movie?.name || 'share').replace(/\s+/g, '-').toLowerCase()}.jpg`;

      // Try native share first
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: movie?.title || movie?.name,
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
          title: movie?.title || movie?.name,
          text: `Check this out on Rushes`,
          url: window.location.href,
        });
        setIsExporting(false);
        return;
      }
      
      // Fallback 2: Trigger download (only for old browsers)
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

  if (!isOpen || !movie) return null;

  const title = movie.title || movie.name;
  const releaseYear = (movie.release_date || movie.first_air_date || '').slice(0, 4);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` 
    : posterUrl;

  const RUSHES_LOGO_URL = 'https://res.cloudinary.com/dkrvtfbor/image/upload/e_make_transparent/v1782761174/RUSHES_uupcnx.png';

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
            className="w-full aspect-[9/16] rounded-[2rem] overflow-hidden relative shadow-2xl bg-[#0a0a0a]"
          >
            {/* Background Blur */}
            <div className="absolute inset-0 z-0">
              <img 
                src={backdropUrl} 
                alt="bg" 
                className="w-full h-full object-cover opacity-30 blur-[40px] scale-125"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full h-full flex flex-col p-6 pt-10">
              {/* Header Branding */}
              <div className="flex items-center justify-center mb-8">
                <img 
                  src={RUSHES_LOGO_URL} 
                  alt="Rushes" 
                  className="h-10 object-contain drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]" 
                  crossOrigin="anonymous"
                />
              </div>

              {/* Poster */}
              <div className="w-[75%] mx-auto aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0">
                <img 
                  src={posterUrl} 
                  alt={title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Title & Info */}
              <div className="mt-8 text-center flex flex-col items-center flex-1">
                <h2 className="text-3xl font-black text-white mb-2 leading-tight px-2 line-clamp-3">
                  {title}
                </h2>
                <div className="flex items-center gap-3 text-white/60 font-medium text-sm mt-1">
                  {releaseYear && <span>{releaseYear}</span>}
                  {releaseYear && rating && <span>•</span>}
                  {rating && <span>⭐ {rating}</span>}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="mt-auto pb-4 flex items-center justify-center gap-2">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/90">Watch on Rushes</span>
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
                const url = `${window.location.origin}/${mediaType === 'tv' ? 'series' : 'movies'}/${movie.id}`;
                navigator.clipboard.writeText(url);
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
