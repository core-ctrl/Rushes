import { useState, useEffect } from "react";
import Head from "next/head";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChartBarLineIcon,
  CloudServerIcon,
  Delete02Icon,
  ChatFeedback01Icon,   // ✅ FIXED
  Logout01Icon,
  MessageSquareDiffIcon, // ✅ FIXED
  Shield01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import AppIcon from "../../components/AppIcon";

// ── Admin login form ──────────────────────────────────────────────
function AdminLogin({ onLogin }) {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const res = await axios.post("/api/auth/login", { email, password: pass });
            if (res.data.user?.isAdmin) {
                onLogin(res.data.user);
            } else {
                setError("⛔ Not an admin account.");
                await axios.post("/api/auth/logout");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md glass-strong rounded-2xl p-8 border border-white/10"
            >
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AppIcon icon={Shield01Icon} className="text-accent" size={24} />
                    </div>
                    <h1 className="text-2xl font-black text-white">Admin Portal</h1>
                    <p className="text-neutral-500 text-sm mt-1">MovieFinder — Secure Admin Access</p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <input type="email" placeholder="Admin Email" value={email}
                        onChange={e => setEmail(e.target.value)} required
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600" />
                    <input type="password" placeholder="Password" value={pass}
                        onChange={e => setPass(e.target.value)} required
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600" />

                    {error && <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2">{error}</p>}

                    <button type="submit" disabled={loading}
                        className="bg-accent hover:bg-accent-dark text-white font-bold py-3 rounded-xl transition-all hover:shadow-glow-red disabled:opacity-50">
                        {loading ? "Verifying..." : "Sign In to Admin"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

// ── Main feedback admin page ──────────────────────────────────────
export default function AdminFeedbackPage() {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        axios.get("/api/auth/me").then(res => {
            if (res.data.user?.isAdmin) {
                setAdmin(res.data.user);
                loadFeedback();
            }
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const loadFeedback = async () => {
        try {
            setError("");
            const res = await axios.get("/api/admin/feedback");
            setFeedback(res.data.feedback || []);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to load feedback");
        }
    };

    const deleteFeedback = async (id) => {
        if (!confirm("Delete this feedback?")) return;
        try {
            await axios.delete(`/api/admin/feedback?id=${id}`);
            setFeedback(f => f.filter(x => x._id !== id));
        } catch (err) {
            setError(err.response?.data?.error || "Failed to delete feedback");
        }
    };

    const handleLogout = async () => {
        await axios.post("/api/auth/logout");
        setAdmin(null);
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!admin) return <AdminLogin onLogin={(user) => { setAdmin(user); loadFeedback(); }} />;

    const navItems = [
        { id: "overview", href: "/admin", icon: <AppIcon icon={ChartBarLineIcon} size={14} />, label: "Overview" },
        { id: "users", href: "/admin", icon: <AppIcon icon={UserMultipleIcon} size={14} />, label: "Users" },
        { id: "system", href: "/admin", icon: <AppIcon icon={CloudServerIcon} size={14} />, label: "System" },
        { id: "feedback", href: "/admin/feedback", icon: <AppIcon icon={Feedback01Icon} size={14} />, label: "Feedback", active: true },
    ];

    return (
        <div className="min-h-screen bg-surface-0 text-white flex">
            <Head><title>Feedback — Admin</title></Head>

            {/* ── Sidebar ── */}
            <aside className="w-56 min-h-screen bg-surface-1 border-r border-white/5 fixed top-0 left-0 flex flex-col pt-6 px-3 z-50">
                <div className="px-3 mb-8">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-1 font-semibold">MovieFinder</p>
                    <h1 className="text-base font-black gradient-text-red">Admin Portal</h1>
                    <div className="flex items-center gap-2 mt-3 p-2 bg-white/4 rounded-xl">
                        <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center text-xs font-bold">
                            {admin.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">{admin.name}</p>
                            <p className="text-[10px] text-accent">Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map(t => (
                        <a key={t.id} href={t.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${t.active
                                ? "bg-accent/15 text-accent border border-accent/20"
                                : "text-neutral-500 hover:text-white hover:bg-white/5"
                                }`}>
                            <span className="text-xs">{t.icon}</span>
                            {t.label}
                        </a>
                    ))}
                </nav>

                <div className="pb-6 px-3 flex flex-col gap-2">
                    <a href="/" className="flex items-center gap-2 text-xs text-neutral-700 hover:text-neutral-400 transition-colors px-3 py-2">
                        ← Back to site
                    </a>
                    <button onClick={handleLogout}
                        className="flex items-center gap-2 text-xs text-red-500/70 hover:text-red-400 transition-colors px-3 py-2">
                        <AppIcon icon={Logout01Icon} size={10} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="ml-56 flex-1 p-8 min-h-screen">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold">User Feedback</h2>
                            <p className="text-neutral-500 text-sm mt-0.5">{feedback.length} submissions</p>
                        </div>
                        <button onClick={loadFeedback}
                            className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl transition-colors">
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {feedback.length === 0 ? (
                        <div className="card p-12 text-center">
                            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AppIcon icon={MessageSquare01Icon} className="text-neutral-500" size={24} />
                            </div>
                            <p className="text-neutral-400 font-medium">No feedback yet</p>
                            <p className="text-neutral-600 text-sm mt-1">When users submit feedback, it will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {feedback.map((item) => (
                                    <motion.div
                                        key={item._id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="card p-5 flex flex-col gap-3"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>
                                            </div>
                                            <button
                                                onClick={() => deleteFeedback(item._id)}
                                                title="Delete Feedback"
                                                className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors shrink-0"
                                            >
                                                <AppIcon icon={Delete02Icon} size={12} className="text-red-400" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2 border-t border-white/5">
                                            {item.userEmail ? (
                                                <span className="text-neutral-400">{item.userEmail}</span>
                                            ) : (
                                                <span className="text-neutral-600 italic">Anonymous</span>
                                            )}
                                            <span className="text-neutral-700">•</span>
                                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

