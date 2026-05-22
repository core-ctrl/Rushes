import { useState, useEffect } from "react";
import Head from "next/head";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cancel01Icon,
  ChartBarLineIcon,
  CheckmarkCircle01Icon,
  CloudServerIcon,
  CpuIcon,
  DatabaseIcon,
  Delete02Icon,
  FavouriteIcon,
  Key01Icon,
  Logout01Icon,
  Message01Icon,
  PlayIcon,
  Shield01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { getCacheStats } from "../../lib/cache";
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
        await axios.post("/api/auth/logout"); // Log them out immediately
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

        <p className="text-center text-xs text-neutral-700 mt-6">
          Requires <code className="bg-white/5 px-1 rounded">isAdmin: true</code> in MongoDB
        </p>
      </motion.div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = "text-white", sub }) {
  return (
    <motion.div className="card p-5" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <div className={`${color} text-xl mb-3`}>{icon}</div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-neutral-700 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ── Main admin panel ──────────────────────────────────────────────
export default function AdminPage() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("overview");
  const [cache, setCache] = useState(null);

  // Check if already logged in as admin
  useEffect(() => {
    axios.get("/api/auth/me").then(res => {
      if (res.data.user?.isAdmin) {
        setAdmin(res.data.user);
        loadData();
      }
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const loadData = async () => {
    try {
      const [s, u, c] = await Promise.all([
        axios.get("/api/admin/stats").then(r => r.data),
        axios.get("/api/admin/users").then(r => r.data),
        axios.get("/api/admin/cache").then(r => r.data).catch(() => null),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setCache(c);
    } catch (err) {
      console.error("Admin data load failed:", err);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user and all their data?")) return;
    await axios.delete(`/api/admin/users?id=${id}`);
    setUsers(u => u.filter(x => x._id !== id));
  };

  const toggleAdmin = async (id, current) => {
    await axios.patch("/api/admin/users", { id, isAdmin: !current });
    setUsers(u => u.map(x => x._id === id ? { ...x, isAdmin: !current } : x));
  };

  const clearCacheAction = async () => {
    await axios.post("/api/admin/cache").catch(() => { });
    loadData();
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

  if (!admin) return <AdminLogin onLogin={(user) => { setAdmin(user); loadData(); }} />;

  const tabs = [
    { id: "overview", icon: <AppIcon icon={ChartBarLineIcon} size={14} />, label: "Overview" },
    { id: "users", icon: <AppIcon icon={UserMultipleIcon} size={14} />, label: "Users" },
    { id: "system", icon: <AppIcon icon={CloudServerIcon} size={14} />, label: "System" },
  ];

  return (
    <div className="min-h-screen bg-surface-0 text-white flex">
      <Head><title>Admin — MovieFinder</title></Head>

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
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${tab === t.id
                ? "bg-accent/15 text-accent border border-accent/20"
                : "text-neutral-500 hover:text-white hover:bg-white/5"
                }`}>
              <span className="text-xs">{t.icon}</span>
              {t.label}
            </button>
          ))}
          <a href="/admin/feedback"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left text-neutral-500 hover:text-white hover:bg-white/5">
            <span className="text-xs"><AppIcon icon={Message01Icon} size={14} /></span>
            Feedback
          </a>
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
        <AnimatePresence mode="wait">

          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <motion.div key="overview"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Overview</h2>
                  <p className="text-neutral-500 text-sm mt-0.5">Platform health at a glance</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <StatCard icon={<AppIcon icon={UserMultipleIcon} />} label="Total Users" value={stats?.totalUsers ?? "—"} color="text-blue-400" />
                <StatCard icon={<AppIcon icon={FavouriteIcon} />} label="Saved Titles" value={stats?.totalWishlists ?? "—"} color="text-red-400" />
                <StatCard icon={<AppIcon icon={PlayIcon} />} label="Data Source" value="TMDB" sub="Live API" color="text-yellow-400" />
                <StatCard icon={<AppIcon icon={DatabaseIcon} />} label="Database" value="Atlas" sub="Connected" color="text-green-400" />
              </div>

              {/* Recent users table */}
              <h3 className="text-base font-bold mb-4 text-neutral-300">Recent Signups</h3>
              <div className="card overflow-hidden mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Name", "Email", "Joined", "Saved", "Role"].map(h => (
                        <th key={h} className="text-left p-4 text-xs text-neutral-600 font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recentUsers || []).map(u => (
                      <tr key={u._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="p-4 font-medium">{u.name}</td>
                        <td className="p-4 text-neutral-500 text-xs">{u.email}</td>
                        <td className="p-4 text-neutral-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-xs">{u.wishlist?.length ?? 0}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isAdmin ? "bg-accent/20 text-accent" : "bg-white/8 text-neutral-500"}`}>
                            {u.isAdmin ? "Admin" : "User"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* USERS TAB */}
          {tab === "users" && (
            <motion.div key="users"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Users</h2>
                  <p className="text-neutral-500 text-sm mt-0.5">{users.length} registered accounts</p>
                </div>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["User", "Email", "Joined", "Genres", "Saved", "Role", "Actions"].map(h => (
                        <th key={h} className="text-left p-4 text-xs text-neutral-600 font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <motion.tr key={u._id} layout
                        className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center text-xs font-bold text-accent">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-neutral-500 text-xs">{u.email}</td>
                        <td className="p-4 text-neutral-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-xs text-neutral-400">{u.preferredGenres?.length ?? 0}</td>
                        <td className="p-4 text-xs">{u.wishlist?.length ?? 0}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isAdmin ? "bg-accent/20 text-accent border border-accent/20" : "bg-white/8 text-neutral-500"}`}>
                            {u.isAdmin ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => toggleAdmin(u._id, u.isAdmin)}
                              title={u.isAdmin ? "Remove Admin" : "Make Admin"}
                              className="w-7 h-7 bg-white/8 hover:bg-white/15 rounded-lg flex items-center justify-center transition-colors">
                              <AppIcon icon={Key01Icon} size={10} className={u.isAdmin ? "text-accent" : "text-neutral-400"} />
                            </button>
                            <button onClick={() => deleteUser(u._id)}
                              title="Delete User"
                              className="w-7 h-7 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors">
                              <AppIcon icon={Delete02Icon} size={10} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* SYSTEM TAB */}
          {tab === "system" && (
            <motion.div key="system"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold mb-8">System</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cache stats */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AppIcon icon={CpuIcon} className="text-yellow-400" />
                      <h3 className="font-bold">TMDB Cache</h3>
                    </div>
                    <button onClick={clearCacheAction}
                      className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
                      Clear Cache
                    </button>
                  </div>
                  {cache ? (
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-neutral-500">Total entries</span><span className="font-mono">{cache.total}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-500">Alive</span><span className="font-mono text-green-400">{cache.alive}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-500">Expired</span><span className="font-mono text-neutral-600">{cache.expired}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-500">Max size</span><span className="font-mono">{cache.maxSize}</span></div>
                    </div>
                  ) : <p className="text-neutral-600 text-sm">No cache data</p>}
                </div>

                {/* API status */}
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AppIcon icon={CloudServerIcon} className="text-blue-400" />
                    <h3 className="font-bold">API Status</h3>
                  </div>
                  {[
                    { label: "TMDB API", ok: true, note: "Live" },
                    { label: "MongoDB", ok: true, note: "Atlas" },
                    { label: "Email SMTP", ok: !!process.env.EMAIL_USER, note: "Gmail" },
                    { label: "JWT Auth", ok: true, note: "Active" },
                    { label: "Rate Limiter", ok: true, note: "5/15min" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <span className="text-sm text-neutral-300">{s.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-600">{s.note}</span>
                        {s.ok
                          ? <AppIcon icon={CheckmarkCircle01Icon} size={10} className="text-green-400" />
                          : <AppIcon icon={Cancel01Icon} size={10} className="text-red-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}


