import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";

export default function VerifyEmailPage() {
    const router = useRouter();
    const { token } = router.query;
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) return;

        const verify = async () => {
            try {
                await axios.post("/api/auth/verify-email", { token });
                setStatus("success");
            } catch (err) {
                setError(err.response?.data?.error || "Verification failed");
                setStatus("error");
            }
        };

        verify();
    }, [token]);

    if (status === "loading") {
        return (
            <>
                <Head>
                    <title>Verifying — MovieFinder</title>
                </Head>
                <div className="min-h-screen flex items-center justify-center bg-neutral-950">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-neutral-400">Verifying your email...</p>
                    </div>
                </div>
            </>
        );
    }

    if (status === "error") {
        return (
            <>
                <Head>
                    <title>Verification Failed — MovieFinder</title>
                </Head>
                <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md p-8 rounded-2xl bg-neutral-900 border border-red-500/30 text-center"
                    >
                        <div className="text-5xl mb-4">❌</div>
                        <h1 className="text-xl font-bold text-white mb-2">Verification Failed</h1>
                        <p className="text-neutral-400 text-sm mb-6">{error}</p>
                        <Link
                            href="/forgot-password"
                            className="inline-block px-4 py-2 rounded-lg bg-white/5 text-sm text-neutral-300 hover:bg-white/10 transition-colors"
                        >
                            Request new verification link
                        </Link>
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors">
                                Back to sign in
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Email Verified — MovieFinder</title>
            </Head>
            <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md p-8 rounded-2xl bg-neutral-900 border border-green-500/30 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.1 }}
                        className="text-5xl mb-4"
                    >
                        ✅
                    </motion.div>
                    <h1 className="text-xl font-bold text-white mb-2">Email Verified!</h1>
                    <p className="text-neutral-400 text-sm mb-6">
                        Your email has been verified. You can now sign in to your account.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block w-full py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-semibold transition-colors"
                    >
                        Sign In
                    </Link>
                </motion.div>
            </div>
        </>
    );
}
