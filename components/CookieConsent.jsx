import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Cookie, Shield } from 'lucide-react';

export default function CookieConsent() {
    const [show, setShow] = useState(false);
    const [locationGranted, setLocationGranted] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('preksha_consent');
        if (!consent) {
            setTimeout(() => setShow(true), 1500);
        }
    }, []);

    const handleAccept = async () => {
        localStorage.setItem('preksha_consent', JSON.stringify({
            analytics: true,
            location: locationGranted,
            timestamp: Date.now(),
        }));

        localStorage.setItem('location_granted', locationGranted ? 'location_granted' : '');

        if (locationGranted) {
            navigator.geolocation?.getCurrentPosition(() => { });
        }

        setShow(false);
    };

    const handleDecline = () => {
        localStorage.setItem('preksha_consent', JSON.stringify({
            analytics: false,
            location: false,
            timestamp: Date.now(),
        }));
        setShow(false);
    };

    return (
        <AnimatePresence>
            {show && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl z-50 mx-4"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                                <Cookie className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-white">Before you continue</h3>
                                <p className="text-xs text-neutral-400">MovieFinder uses cookies and optional location</p>
                            </div>
                        </div>

                        <p className="text-sm text-neutral-300 mb-4">
                            We use cookies to keep you signed in and improve recommendations. We also optionally use your location to show theater movies near you.
                        </p>

                        {/* Location toggle */}
                        <div
                            onClick={() => setLocationGranted(!locationGranted)}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all mb-4 ${locationGranted
                                    ? 'border-red-500/40 bg-red-500/10'
                                    : 'border-white/10 bg-white/5'
                                }`}
                        >
                            <MapPin className={`w-4 h-4 ${locationGranted ? 'text-red-400' : 'text-neutral-500'}`} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">Share my location</p>
                                <p className="text-xs text-neutral-500">See theater movies near your area</p>
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-colors ${locationGranted ? 'bg-red-600' : 'bg-neutral-700'} relative`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${locationGranted ? 'left-5' : 'left-1'}`} />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleDecline}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm text-white hover:bg-white/10 transition-colors"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAccept}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-colors"
                            >
                                Accept
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 mt-3 justify-center">
                            <Shield className="w-3 h-3 text-neutral-600" />
                            <p className="text-xs text-neutral-600">We never sell your data</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
