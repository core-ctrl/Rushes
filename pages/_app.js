import { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import "../styles/globals.css";
import store from "../store";
import Navbar from "../components/Navbar";
import AuthWidget from "../components/AuthWidget";
import TrailerModal from "../components/TrailerModal";
import CookieConsent from "../components/CookieConsent";
import BottomNav from "../components/BottomNav";
import Footer from "../components/Footer";
import FeedbackButton from "../components/FeedbackButton";
import Toaster, { toast } from "../components/ui/Toaster";
import useLenis from "../hooks/useLenis";
import { useLocation } from "../hooks/useLocation";
import { initAnalytics } from "../lib/firebase";
import {
  fetchCurrentUser, logoutUser, selectUser, selectInitialized, setUser,
} from "../store/slices/authSlice";
import {
  fetchWatchlist, toggleWatchlist, toggleGuestWatchlist,
  setWatchlist, clearWatchlist, selectWatchlist,
} from "../store/slices/watchlistSlice";
import {
  openAuthModal, closeAuthModal, openTrailer, closeTrailer,
  selectAuthModalOpen, selectTrailer,
} from "../store/slices/uiSlice";
import { readStoredPreferences } from "../lib/userPreferences";
import dynamic from "next/dynamic";
const OnboardingWrapper = dynamic(() => import("../components/onboarding/OnboardingWrapper"), { ssr: false });
import OnboardingFlow from "../components/OnboardingFlow";
import OnlinePresence from '../components/social/OnlinePresence';
import { Analytics } from '@vercel/analytics/react';
import { init as initOrbit } from '@orbitapp/nextjs';

if (typeof window !== 'undefined') {
  initOrbit({
    dsn: "IaZvKzgpNZCB49mXAwF69f4AqFwAyhEqE6ylvEOOa3s", // Using the real Project ID from DB!
    endpoint: "http://localhost:8000/api/v1"
  });
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

function AppInner({ Component, pageProps, router }) {
  useLenis();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const initialized = useSelector(selectInitialized);
  const wishlist = useSelector(selectWatchlist);
  const authOpen = useSelector(selectAuthModalOpen);
  const trailerState = useSelector(selectTrailer);
  const [authFeedback, setAuthFeedback] = useState({ type: "", message: "" });
  const currentUser = useSelector(selectUser);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Location hook - runs silently after consent
  useLocation();

  // Firebase analytics
  useEffect(() => {
    initAnalytics();
  }, []);

  // Boot: fetch current user from JWT cookie
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  // Handle auth query params (e.g. ?authError=... ?authSuccess=...)
  useEffect(() => {
    const { authError, authSuccess, authMode, ...rest } = router.query;
    const message = typeof authError === "string"
      ? authError
      : typeof authSuccess === "string" ? authSuccess : "";
    if (!message) return;

    setAuthFeedback({
      type: typeof authError === "string" ? "error" : "success",
      message,
    });
    toast({
      type: typeof authError === "string" ? "error" : "success",
      message,
    });
    dispatch(openAuthModal(typeof authMode === "string" ? authMode : "login"));
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  }, [dispatch, router]);

  // Sync guest preferences when user logs in
  useEffect(() => {
    if (!user) return;
    let active = true;

    async function syncGuestPreferences() {
      try {
        const {
          hasMeaningfulPreferences,
          preferencesFromUser,
          readStoredPreferences,
          writeStoredPreferences,
        } = await import("../lib/userPreferences");

        const currentUserId = user.id || user._id;
        const stored = readStoredPreferences();
        const fromUser = preferencesFromUser(user);

        if (fromUser.completed) { writeStoredPreferences(fromUser); return; }
        if (!hasMeaningfulPreferences(stored) || stored.syncedUserId === currentUserId) return;

        const response = await fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genres: stored.genres,
            languages: stored.languages,
            regions: stored.regions,
            regionGroup: stored.regionGroup,
            allowLocationRecommendations: stored.allowLocationRecommendations,
          }),
        });

        if (!response.ok) throw new Error("Preference sync failed");

        writeStoredPreferences({ ...stored, completed: true, syncedUserId: currentUserId });

        if (active) {
          dispatch(setUser({
            ...user,
            preferredGenres: stored.genres,
            preferredLanguages: stored.languages,
            preferredRegions: stored.regions,
            preferredRegionGroup: stored.regionGroup,
            allowLocationRecommendations: stored.allowLocationRecommendations,
          }));
        }
      } catch { }
    }

    syncGuestPreferences();
    return () => { active = false; };
  }, [dispatch, user]);

  // Sync wishlist when user changes
  useEffect(() => {
    if (!initialized) return;
    if (user) {
      dispatch(fetchWatchlist());
    } else {
      try {
        const stored = localStorage.getItem("watchlist");
        if (stored) dispatch(setWatchlist(JSON.parse(stored)));
        else dispatch(clearWatchlist());
      } catch { dispatch(clearWatchlist()); }
    }
  }, [user, initialized, dispatch]);

  const handleLogout = () => dispatch(logoutUser());

  const handleAddToWishlist = (movie) => {
    if (user) dispatch(toggleWatchlist(movie));
    else dispatch(toggleGuestWatchlist(movie));
  };

  const handleOpenTrailer = (key, title, id, type = "movie") => {
    if (!key) {
      toast({ type: "error", message: "Trailer is not available for this title yet." });
      return;
    }
    dispatch(openTrailer({ key, title, id, type }));
  };

  useEffect(() => {
    const onPlayTrailer = (event) => {
      const { key, title, id, type } = event.detail || {};
      handleOpenTrailer(key, title, id, type);
    };
    window.addEventListener("rushes:play-trailer", onPlayTrailer);
    return () => window.removeEventListener("rushes:play-trailer", onPlayTrailer);
  }, [dispatch]);

  useEffect(() => {
    // Only show onboarding if user is logged in AND hasCompletedOnboarding is explicitly false
    const needsOnboarding = currentUser && currentUser.hasCompletedOnboarding === false;
    console.log("Onboarding check:", { user: !!currentUser, hasCompleted: currentUser?.hasCompletedOnboarding, show: needsOnboarding });
    if (needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (showOnboarding) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showOnboarding]);

  const sharedProps = {
    user,
    wishlist,
    addToWishlist: handleAddToWishlist,
    openAuth: (mode) => dispatch(openAuthModal(mode || "login")),
    openTrailer: handleOpenTrailer,
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-6 overflow-y-auto">
        <OnboardingWrapper onComplete={(prefs) => {
          setShowOnboarding(false);
          // Mark complete
          if (user) {
            // Update user
          }
        }} />
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} logout={handleLogout} openAuth={(mode) => dispatch(openAuthModal(mode))} />
      <OnboardingFlow />

      <AnimatePresence mode="wait">
        <motion.div key={router.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <Component {...pageProps} {...sharedProps} />
        </motion.div>
      </AnimatePresence>

      {!router.pathname.startsWith('/messages') && <Footer />}

      {/* Social realtime presence */}
      <OnlinePresence />

      <AuthWidget
        open={authOpen && !user}
        onClose={() => { setAuthFeedback({ type: "", message: "" }); dispatch(closeAuthModal()); }}
        onLogin={() => dispatch(closeAuthModal())}
        externalFeedback={authFeedback}
      />

      <TrailerModal
        open={trailerState.open}
        videoIdOrUrl={trailerState.key}
        title={trailerState.title}
        mediaId={trailerState.id}
        mediaType={trailerState.type}
        onClose={() => dispatch(closeTrailer())}
      />

      <CookieConsent />
      {!router.pathname.startsWith('/messages') && <BottomNav />}
      <FeedbackButton />
      <Toaster />
      <Analytics />
    </>
  );
}

export default function App(props) {
  return (
    <Provider store={store}>
      <AppInner {...props} />
    </Provider>
  );
}
