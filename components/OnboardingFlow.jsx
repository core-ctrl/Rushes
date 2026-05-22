import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, updateUser } from "../store/slices/authSlice";
import { toast } from "./ui/Toaster";

const GENRES = [
    { id: 28, label: "Action" },
    { id: 35, label: "Comedy" },
    { id: 18, label: "Drama" },
    { id: 27, label: "Horror" },
    { id: 10749, label: "Romance" },
    { id: 878, label: "Sci-Fi" },
    { id: 53, label: "Thriller" },
    { id: 99, label: "Documentary" },
    { id: 16, label: "Animation" },
    { id: 14, label: "Fantasy" },
    { id: 80, label: "Crime" },
    { id: 9648, label: "Mystery" },
    { id: 36, label: "Biography" },
    { id: 10770, label: "Sports" },
    { id: 10402, label: "Musical" },
];

const LANGUAGES = [
    { code: "te", label: "Telugu" },
    { code: "ta", label: "Tamil" },
    { code: "hi", label: "Hindi" },
    { code: "ml", label: "Malayalam" },
    { code: "kn", label: "Kannada" },
    { code: "en", label: "English" },
    { code: "ko", label: "Korean" },
    { code: "ja", label: "Japanese" },
    { code: "es", label: "Spanish" },
    { code: "bn", label: "Bengali" },
];

const PLATFORMS = [
    { id: "netflix", label: "Netflix" },
    { id: "prime", label: "Prime Video" },
    { id: "hotstar", label: "Hotstar" },
    { id: "zee5", label: "Zee5" },
    { id: "sonyliv", label: "SonyLIV" },
    { id: "aha", label: "Aha" },
    { id: "jiocinema", label: "JioCinema" },
    { id: "appletv", label: "Apple TV+" },
    { id: "mubi", label: "Mubi" },
    { id: "sunnxt", label: "Sun NXT" },
];

export default function OnboardingFlow({ forceOpen = false, onClose }) {
    const dispatch = useDispatch();
    const currentUser = useSelector(selectUser);
    const [step, setStep] = useState(0);
    const [displayName, setDisplayName] = useState(currentUser?.displayName || currentUser?.name || "");
    const [username, setUsername] = useState(currentUser?.username || "");
    const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || "");
    const [bio, setBio] = useState(currentUser?.bio || "");
    const [genres, setGenres] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [customLangInput, setCustomLangInput] = useState("");
    const [platforms, setPlatforms] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    if (!currentUser || (currentUser.hasCompletedOnboarding && !forceOpen)) return null;

    const toggleItem = (arr, setArr, val) => {
        setArr(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const addCustomLanguage = (e) => {
        if (e.key === "Enter" && customLangInput.trim()) {
            const val = customLangInput.trim();
            if (!languages.includes(val)) {
                setLanguages(prev => [...prev, val]);
            }
            setCustomLangInput("");
        }
    };

    const removeCustomLanguage = (lang) => {
        setLanguages(prev => prev.filter(l => l !== lang));
    };

    const handleSkip = async () => {
        try {
            if (username || displayName || avatarUrl || bio) {
                await axios.put("/api/user/profile", {
                    username,
                    displayName,
                    avatar: avatarUrl,
                    bio,
                });
                dispatch(updateUser({ username, displayName, avatar: avatarUrl, bio }));
            }
            await axios.post("/api/user/preferences", {
                preferredGenres: [],
                preferredLanguages: [],
                ottPlatforms: [],
                hasCompletedOnboarding: true,
            });
        } catch (e) {
            console.error("Skip failed:", e);
            toast({ type: "error", message: e.response?.data?.error || "Could not save profile setup." });
        } finally {
            dispatch(updateUser({ hasCompletedOnboarding: true }));
            onClose?.();
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const profileResponse = await axios.put("/api/user/profile", {
                username,
                displayName,
                avatar: avatarUrl,
                bio,
            });
            await axios.post("/api/user/preferences", {
                genres: genres,
                languages: languages,
                platforms: platforms,
                hasCompletedOnboarding: true,
            });
            dispatch(updateUser({
                ...(profileResponse.data?.user || {}),
                hasCompletedOnboarding: true,
            }));
            toast({ type: "success", message: "Profile tuned. Your personalized feed is unlocked." });
            onClose?.();
        } catch (e) {
            console.error(e);
            toast({ type: "error", message: e.response?.data?.error || "Could not save onboarding." });
        }
        setSubmitting(false);
    };

    const customLanguages = languages.filter(
        l => !LANGUAGES.find(lang => lang.code === l)
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-40">
                {/* Blurred backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Popup card */}
                <div className="relative z-50 flex items-center justify-center min-h-screen p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
                    >
                        {/* Progress dots */}
                        <div className="flex justify-center gap-2 mb-6">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === step
                                            ? "w-6 bg-red-500"
                                            : i < step
                                                ? "w-1.5 bg-red-500/40"
                                                : "w-1.5 bg-white/20"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Step 0 — Profile */}
                        {step === 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="text-xl font-black mb-1">
                                    Finish your profile
                                </h2>
                                <p className="text-neutral-400 text-sm mb-5">
                                    Choose how friends see you across messages, takes, and recommendations.
                                </p>
                                <div className="flex items-center gap-4 mb-5">
                                    <img
                                        src={avatarUrl || currentUser?.avatar || "/avatar.svg"}
                                        alt=""
                                        className="h-16 w-16 rounded-full border border-white/10 object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <input
                                            value={avatarUrl}
                                            onChange={(event) => setAvatarUrl(event.target.value)}
                                            placeholder="Avatar image URL"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-red-500 placeholder:text-neutral-600"
                                        />
                                        <p className="mt-1 text-xs text-neutral-600">Leave blank to use the default cinematic avatar.</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        value={displayName}
                                        onChange={(event) => setDisplayName(event.target.value)}
                                        placeholder="Display name"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-red-500 placeholder:text-neutral-600"
                                    />
                                    <input
                                        value={username}
                                        onChange={(event) => setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                                        placeholder="Username"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-red-500 placeholder:text-neutral-600"
                                    />
                                    <textarea
                                        value={bio}
                                        onChange={(event) => setBio(event.target.value)}
                                        placeholder="Short bio (optional)"
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-red-500 placeholder:text-neutral-600"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1 — Genres */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="text-xl font-black mb-1">
                                    What do you love watching?
                                </h2>
                                <p className="text-neutral-400 text-sm mb-5">
                                    Pick a few — you can always change later
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {GENRES.map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => toggleItem(genres, setGenres, g.id)}
                                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${genres.includes(g.id)
                                                    ? "bg-red-600 text-white scale-105"
                                                    : "bg-white/5 text-neutral-300 hover:bg-white/10"
                                                }`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2 — Languages */}
                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="text-xl font-black mb-1">
                                    Which languages do you watch in?
                                </h2>
                                <p className="text-neutral-400 text-sm mb-5">
                                    Can&apos;t find yours? Type it below
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {LANGUAGES.map(l => (
                                        <button
                                            key={l.code}
                                            onClick={() => toggleItem(languages, setLanguages, l.code)}
                                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${languages.includes(l.code)
                                                    ? "bg-red-600 text-white scale-105"
                                                    : "bg-white/5 text-neutral-300 hover:bg-white/10"
                                                }`}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom language input */}
                                <input
                                    type="text"
                                    value={customLangInput}
                                    onChange={e => setCustomLangInput(e.target.value)}
                                    onKeyDown={addCustomLanguage}
                                    placeholder="Type another language and press Enter..."
                                    className="w-full mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 placeholder:text-neutral-600 transition-colors"
                                />

                                {/* Custom language pills */}
                                {customLanguages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {customLanguages.map(lang => (
                                            <span
                                                key={lang}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm bg-red-600/20 text-red-300 border border-red-500/30"
                                            >
                                                {lang}
                                                <button
                                                    onClick={() => removeCustomLanguage(lang)}
                                                    className="hover:text-white transition-colors text-xs"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 3 — Platforms */}
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="text-xl font-black mb-1">
                                    Which OTTs do you have?
                                </h2>
                                <p className="text-neutral-400 text-sm mb-5">
                                    We&apos;ll only show what you can actually watch
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {PLATFORMS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => toggleItem(platforms, setPlatforms, p.id)}
                                            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${platforms.includes(p.id)
                                                    ? "bg-red-600 text-white scale-105"
                                                    : "bg-white/5 text-neutral-300 hover:bg-white/10"
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                            <button
                                onClick={handleSkip}
                                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-2"
                            >
                                Skip for now
                            </button>

                            <div className="flex gap-2">
                                {step > 0 && (
                                    <button
                                        onClick={() => setStep(s => s - 1)}
                                        className="px-4 py-2 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition-colors"
                                    >
                                        Back
                                    </button>
                                )}
                                <button
                                    onClick={step === 3 ? handleSubmit : () => setStep(s => s + 1)}
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm font-semibold transition-colors"
                                >
                                    {submitting
                                        ? "Saving..."
                                        : step === 3
                                            ? "Unlock feed"
                                            : "Next →"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
}
