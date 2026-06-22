import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Construction, RefreshCw, Film } from 'lucide-react';

export default function ConnectionStatusBanner() {
  const [status, setStatus] = useState('online'); // online, offline, maintenance, reconnecting
  const [dismissed, setDismissed] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus('offline');
      setDismissed(false);
      return;
    }

    try {
      const res = await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
      if (res.status === 503) {
        setStatus('maintenance');
        setDismissed(false);
      } else {
        setStatus('online');
      }
    } catch {
      // If the fetch itself fails, check navigator.onLine just in case
      if (!navigator.onLine) {
        setStatus('offline');
        setDismissed(false);
      } else {
        // We used to show 'server_down' here, but removed it per request
        setStatus('online');
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus('reconnecting');
      setDismissed(false);
      setTimeout(() => checkConnection(), 1500);
    };
    const handleOffline = () => {
      setStatus('offline');
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic health check every 30s
    const interval = setInterval(checkConnection, 30000);

    // Initial check
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection]);

  // FULL SCREEN CREATIVE OFFLINE PAGE
  if (status === 'offline') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070707] text-white backdrop-blur-3xl overflow-hidden"
        >
          {/* Background creative elements */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full blur-[128px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600 rounded-full blur-[128px]" />
          </div>

          <motion.div
            animate={{ rotate: [-2, 2, -2], y: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="mb-8 relative z-10"
          >
            <div className="relative flex items-center justify-center w-32 h-32 rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">
              <WifiOff className="w-16 h-16 text-red-500" />
            </div>
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 text-center z-10">
            You're <span className="text-red-500">Offline</span>
          </h1>
          <p className="text-neutral-400 text-lg max-w-md text-center z-10 font-medium">
            The connection to the servers was lost. Reconnect to the internet to continue watching and messaging.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="mt-10 px-8 py-4 bg-white hover:bg-neutral-200 text-black transition-colors rounded-full font-black flex items-center gap-3 z-10 shadow-xl shadow-white/10 hover:scale-105 active:scale-95 transform duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            Try Reconnecting
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // MAINTENANCE OR RECONNECTING BANNER
  if (status === 'online' || dismissed) return null;

  let config;
  if (status === 'maintenance') {
    config = {
      icon: Construction,
      message: 'MovieFinder is under maintenance. We\'ll be back shortly.',
      color: 'bg-blue-600/90',
      textColor: 'text-blue-100',
    };
  } else if (status === 'reconnecting') {
    config = {
      icon: RefreshCw,
      message: 'Reconnecting...',
      color: 'bg-amber-600/90',
      textColor: 'text-amber-100',
    };
  }

  if (!config) return null;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-[200] ${config.color} backdrop-blur-xl`}
      >
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
          <Icon className={`w-4 h-4 ${config.textColor} flex-shrink-0 ${status === 'reconnecting' ? 'animate-spin' : ''}`} />
          <p className={`text-sm font-medium ${config.textColor}`}>
            {config.message}
          </p>
          <button
            onClick={() => setDismissed(true)}
            className={`ml-2 text-xs ${config.textColor} opacity-70 hover:opacity-100 transition-opacity font-bold`}
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
