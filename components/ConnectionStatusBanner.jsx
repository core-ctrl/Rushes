import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Construction, AlertTriangle, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  online: {
    show: false,
  },
  offline: {
    icon: WifiOff,
    message: "You're offline. Check your internet connection.",
    color: 'bg-amber-600/90',
    textColor: 'text-amber-100',
  },
  server_down: {
    icon: AlertTriangle,
    message: 'Our servers are temporarily unavailable. We\'re working on it.',
    color: 'bg-red-600/90',
    textColor: 'text-red-100',
  },
  maintenance: {
    icon: Construction,
    message: 'MovieFinder is under maintenance. We\'ll be back shortly.',
    color: 'bg-blue-600/90',
    textColor: 'text-blue-100',
  },
  reconnecting: {
    icon: RefreshCw,
    message: 'Reconnecting...',
    color: 'bg-amber-600/90',
    textColor: 'text-amber-100',
  },
};

export default function ConnectionStatusBanner() {
  const [status, setStatus] = useState('online');
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
      } else if (!res.ok) {
        setStatus('server_down');
        setDismissed(false);
      } else {
        setStatus('online');
      }
    } catch {
      // If the fetch itself fails, likely server is down
      if (navigator.onLine) {
        setStatus('server_down');
        setDismissed(false);
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

  const config = STATUS_CONFIG[status];
  if (!config?.show === undefined && config?.show === false) return null;
  if (status === 'online' || dismissed) return null;

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
            className={`ml-2 text-xs ${config.textColor} opacity-70 hover:opacity-100 transition-opacity`}
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
