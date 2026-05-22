import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Mail01Icon } from "@hugeicons/core-free-icons";
import AppIcon from "../components/AppIcon";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        setError("");

        try {
            await axios.post("/api/auth/forgot-password", { email: data.email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <>
                <Head>
                    <title>Reset Link Sent — MovieFinder</title>
                </Head>
                <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md p-8 rounded-2xl bg-neutral-900 border border-white/10 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.1 }}
                            className="text-5xl mb-4"
                        >
                            📧
                        </motion.div>
                        <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
                        <p className="text-neutral-400 text-sm mb-6">
                            If that email exists, we've sent a password reset link. Check your inbox and click the link to reset your password.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block w-full py-3 rounded-xl bg-white/5 text-sm text-neutral-300 hover:bg-white/10 transition-colors"
                        >
                            Back to sign in
                        </Link>
                    </motion.div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Forgot Password — MovieFinder</title>
            </Head>
            <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-950">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md p-8 rounded-2xl bg-neutral-900 border border-white/10"
                >
                    <div className="text-center mb-8">
                        <motion.div
                            className="text-4xl mb-3"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.1 }}
                        >
                            🔐
                        </motion.div>
                        <h1 className="text-xl font-bold text-white">Reset your password</h1>
                        <p className="text-neutral-500 text-sm mt-1">
                            Enter your email and we'll send you a reset link
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                                <AppIcon icon={Mail01Icon} size={14} />
                            </span>
                            <input
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" }
                                })}
                                type="email"
                                placeholder="Email address"
                                autoComplete="email"
                                className="w-full bg-white/5 border border-white/8 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600 transition-colors"
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3"
                            >
                                {error}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-glow-red text-sm"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>
                    </form>

                    <div className="flex justify-center gap-4 mt-6 text-sm">
                        <Link href="/login" className="text-neutral-500 hover:text-accent transition-colors">
                            Remember password? Sign in
                        </Link>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
