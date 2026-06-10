import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useDispatch } from "react-redux";
import { LockIcon, Mail01Icon, ViewIcon, ViewOffSlashIcon, GithubIcon, GoogleIcon } from "@hugeicons/core-free-icons";
import AppIcon from "../components/AppIcon";
import { fetchCurrentUser, loginUser } from "../store/slices/authSlice";
import { toast } from "../components/ui/Toaster";
import { signIn } from "next-auth/react";
export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPass, setShowPass] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        setError("");

        try {
            await dispatch(loginUser({
                email: data.email,
                password: data.password,
            })).unwrap();

            await dispatch(fetchCurrentUser());
            toast({ type: "success", message: "Signed in. Your recommendations are ready." });
            router.push("/");
        } catch (err) {
            let message = err?.message || err || "Login failed. Please try again.";

            // Map status codes
            if (err.response?.status === 401) {
                message = "Invalid email or password";
            } else if (err.response?.status === 500) {
                message = "Server error, please try again later";
            } else if (err.response?.data?.success === false) {
                message = err.response.data.error;
            }

            // Check if email not verified
            if (message.includes("verify")) {
                toast({ type: "info", message: "Please verify your email. Redirecting..." });
                setTimeout(() => {
                    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
                }, 1200);
            } else {
                setError(message);
                toast({ type: "error", message });
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <Head>
                <title>Sign In — Rushes</title>
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
                            🎬
                        </motion.div>
                        <h1 className="text-xl font-bold text-white">Welcome back</h1>
                        <p className="text-neutral-500 text-sm mt-1">Sign in to access your list</p>
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

                        <div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                                    <AppIcon icon={LockIcon} size={14} />
                                </span>
                                <input
                                    {...register("password", { required: "Password is required" })}
                                    type={showPass ? "text" : "password"}
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    className="w-full bg-white/5 border border-white/8 text-white rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors"
                                >
                                    {showPass ? <AppIcon icon={ViewOffSlashIcon} size={13} /> : <AppIcon icon={ViewIcon} size={13} />}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push("/forgot-password")}
                                className="text-xs text-neutral-600 hover:text-accent transition-colors mt-1.5 float-right"
                            >
                                Forgot password?
                            </button>
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
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        <div className="flex items-center gap-3 py-2">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">or</span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => signIn("google")}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                            >
                                <AppIcon icon={GoogleIcon} size={14} />
                                <span>Continue with Google</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => signIn("github")}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                            >
                                <AppIcon icon={GithubIcon} size={14} />
                                <span>Continue with GitHub</span>
                            </button>
                        </div>
                    </form>

                    <div className="flex justify-center gap-4 mt-6 text-sm">
                        <Link href="/register" className="text-neutral-500 hover:text-accent transition-colors">
                            Don't have an account? Sign up
                        </Link>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
