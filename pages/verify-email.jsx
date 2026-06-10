import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Mail, Key, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "../components/ui/Toaster";

export default function VerifyEmailPage() {
    const router = useRouter();
    const { email: queryEmail } = router.query;

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Pre-fill email from query parameter
    useEffect(() => {
        if (queryEmail) {
            setEmail(decodeURIComponent(queryEmail));
        }
    }, [queryEmail]);

    // Resend countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!email) {
            toast({ type: "error", message: "Email is required" });
            return;
        }
        if (!code || code.length !== 6) {
            toast({ type: "error", message: "Please enter the 6-digit verification code" });
            return;
        }

        setLoading(true);
        try {
            await axios.post("/api/auth/verify-email", {
                email: email.trim(),
                code: code.trim(),
            });
            setSuccess(true);
            toast({ type: "success", message: "Account verified successfully!" });
        } catch (err) {
            toast({ type: "error", message: err.response?.data?.error || "Invalid or expired code" });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            toast({ type: "error", message: "Please enter your email first" });
            return;
        }

        setResendLoading(true);
        try {
            const res = await axios.post("/api/auth/resend-verification", { email: email.trim() });
            toast({ type: "success", message: res.data.message || "Verification code sent!" });
            setCountdown(60); // 60s cooldown
        } catch (err) {
            toast({ type: "error", message: err.response?.data?.error || "Failed to resend code" });
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Verify Your Account — Rushes</title>
            </Head>

            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                {/* Subtle animated background shapes */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-neutral-900/80 border border-white/10 backdrop-blur-xl shadow-2xl"
                >
                    <AnimatePresence mode="wait">
                        {!success ? (
                            <motion.div
                                key="verify-form"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                            >
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/10 to-red-800/20 border border-red-500/20 mb-4 text-red-500">
                                        <Mail className="w-8 h-8" />
                                    </div>
                                    <h1 className="text-2xl font-black text-white">Verify your account</h1>
                                    <p className="text-neutral-500 text-sm mt-1">
                                        We sent a 6-digit verification code to your email.
                                    </p>
                                </div>

                                <form onSubmit={handleVerify} className="space-y-5">
                                    {/* Email input */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-neutral-400 font-semibold pl-1">Email Address</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600">
                                                <Mail className="w-4 h-4" />
                                            </span>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email"
                                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-neutral-600 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Code input */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-neutral-400 font-semibold pl-1">Verification Code</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600">
                                                <Key className="w-4 h-4" />
                                            </span>
                                            <input
                                                type="text"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                                                placeholder="Enter 6-digit code"
                                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-4 py-3 text-sm tracking-[0.25em] font-mono font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-neutral-600 placeholder:tracking-normal transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Submit button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/10 hover:shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            "Confirm & Activate"
                                        )}
                                    </button>
                                </form>

                                {/* Resend option */}
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={handleResend}
                                        disabled={resendLoading || countdown > 0}
                                        className="text-xs text-neutral-400 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-400 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
                                        {countdown > 0
                                            ? `Resend code in ${countdown}s`
                                            : "Didn't receive code? Resend"}
                                    </button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                                    <Link href="/login" className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                                        <ArrowLeft className="w-3 h-3" />
                                        Back to Login
                                    </Link>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="verify-success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-4"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mb-6"
                                >
                                    <CheckCircle2 className="w-10 h-10" />
                                </motion.div>
                                <h1 className="text-2xl font-black text-white mb-2">Account Activated!</h1>
                                <p className="text-neutral-400 text-sm mb-8 max-w-xs mx-auto">
                                    Your email has been verified. Welcome to Rushes! Let's get you signed in.
                                </p>
                                <Link
                                    href="/login"
                                    className="block w-full py-3.5 bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all"
                                >
                                    Proceed to Sign In
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </>
    );
}
