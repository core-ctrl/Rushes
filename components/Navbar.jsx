// components/Navbar.jsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Cancel01Icon,
  FavouriteIcon,
  Logout01Icon,
  Menu01Icon,
  Search01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import SmartSearch from "./SmartSearch";
import NotificationBell from "./chat/NotificationBell";
import { MessageCircle, Users } from "lucide-react";
import { logoutUser, selectUser } from "../store/slices/authSlice";
import { openAuthModal } from "../store/slices/uiSlice";
import AppIcon from "./AppIcon";
import ErrorBoundary from "./ErrorBoundary";
import RushesLogo from "./RushesLogo";

export default function Navbar() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleStartParty = () => {
    router.push(`/watch-party/create`);
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close menus on route change
  useEffect(() => { setMobile(false); setMenuOpen(false); setSearchOpen(false); }, [router.pathname]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadMessages(0);
      return;
    }

    let active = true;
    fetch("/api/user/notifications")
      .then((response) => response.ok ? response.json() : { notifications: [] })
      .then((data) => {
        if (active) setNotifications((data.notifications || []).slice(0, 5));
      })
      .catch(() => {
        if (active) setNotifications([]);
      });
      
    fetch("/api/messages/unread")
      .then((response) => response.ok ? response.json() : { totalUnread: 0 })
      .then((data) => {
        if (active) setUnreadMessages(data.totalUnread || 0);
      })
      .catch(() => {
        if (active) setUnreadMessages(0);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Movies", href: "/movies" },
    { name: "Series", href: "/series" },
    { name: "Feed", href: "/social" },
    { name: "Watch Party", href: "/watch-party/live" },
    { name: "Blog", href: "/blog" },
    { name: "My List", href: "/my-list" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${scrolled ? "bg-black/90 backdrop-blur-2xl border-b border-white/5 shadow-2xl" : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <RushesLogo />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  onClick={(e) => { if (active) e.preventDefault(); }}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? "text-white" : "text-neutral-400 hover:text-white"}`}>
                  {active && <motion.span layoutId="nav-pill" className="absolute inset-0 bg-white/8 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Smart Search — desktop inline */}
            <div className="hidden md:block">
              <SmartSearch />
            </div>

            {/* Social icons */}
            <button
              onClick={handleStartParty}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-full bg-red-600/10 text-red-500 font-medium text-xs hover:bg-red-600 hover:text-white transition-colors border border-red-600/20"
            >
              <Users className="w-4 h-4" /> Start Party
            </button>
            <ErrorBoundary>
              <NotificationBell />
            </ErrorBoundary>
            <Link href="/messages" className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <MessageCircle className="w-5 h-5 relative">
                {unreadMessages > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  />
                )}
              </MessageCircle>
            </Link>

            {/* Search icon — mobile */}
            <button onClick={() => setSearchOpen(true)} className="md:hidden w-9 h-9 glass rounded-full flex items-center justify-center text-white border border-white/10">
              <AppIcon icon={Search01Icon} size={12} />
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen((o) => !o)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm border-2 border-white/10 hover:border-white/30 transition-all overflow-hidden relative"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <AppIcon icon={UserIcon} size={18} className="text-neutral-500" />
                    </div>
                  )}
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -8 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl p-2 shadow-2xl border border-white/10"
                    >
                      <div className="px-3 py-2 border-b border-white/8 mb-1">
                        <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-neutral-600 text-xs truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/5 rounded-xl transition-colors">
                        <AppIcon icon={UserIcon} size={11} className="text-neutral-500" /> Profile
                      </Link>
                      <Link href="/my-list" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/5 rounded-xl transition-colors">
                        <AppIcon icon={FavouriteIcon} size={11} className="text-neutral-500" /> My List
                      </Link>
                      {notifications.length > 0 ? (
                        <div className="mt-1 border-t border-white/8 pt-2">
                          <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                            Alerts {unreadCount > 0 ? `(${unreadCount})` : ""}
                          </div>
                          {notifications.map((item) => (
                            <Link
                              key={`${item.type}-${item.mediaType}-${item.mediaId}-${item.createdAt}`}
                              href={item.mediaType === "tv" ? `/series/${item.mediaId}` : `/movies/${item.mediaId}`}
                              onClick={() => setMenuOpen(false)}
                              className="block rounded-xl px-3 py-2 text-xs text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
                            >
                              <span className="line-clamp-2">{item.message}</span>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                      <div className="border-t border-white/8 mt-1 pt-1">
                        <button onClick={() => { setMenuOpen(false); window.dispatchEvent(new Event('open-feedback')); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                          <MessageCircle size={14} className="text-neutral-500" /> Send Feedback
                        </button>
                        <button onClick={() => { setMenuOpen(false); dispatch(logoutUser()); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/8 rounded-xl transition-colors">
                          <AppIcon icon={Logout01Icon} size={11} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button onClick={() => dispatch(openAuthModal("login"))}
                className="bg-accent hover:bg-accent-dark text-white text-sm font-semibold px-5 py-2 rounded-full transition-all hover:shadow-glow-red">
                Sign In
              </button>
            )}

            <button onClick={() => setMobile((o) => !o)} className="md:hidden text-white p-2">
              {mobileOpen ? <AppIcon icon={Cancel01Icon} size={18} /> : <AppIcon icon={Menu01Icon} size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-2xl">
              <div className="px-5 py-4 flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = router.pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} 
                      onClick={(e) => { 
                        setMobile(false); 
                        if (active) e.preventDefault(); 
                      }}
                      className="px-3 py-3 text-neutral-300 hover:text-white text-sm font-medium rounded-xl hover:bg-white/5 transition-colors">
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Fullscreen search overlay — mobile */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl p-6 pt-20"
          >
            <button onClick={() => setSearchOpen(false)} className="absolute top-5 right-5 text-neutral-400 hover:text-white">
              <AppIcon icon={Cancel01Icon} size={20} />
            </button>
            <SmartSearch fullscreen onClose={() => setSearchOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
