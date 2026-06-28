import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import axios from "axios";
import { LockIcon, Mail01Icon, UserIcon, ViewIcon, ViewOffSlashIcon, CheckmarkCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import AppIcon from "../components/AppIcon";
import ExpandableTerms from "../components/ExpandableTerms";

function PasswordStrength({ password = "" }) {
    const checks = [
        { label: "8+ chars", ok: password.length >= 8 },
        { label: "Uppercase", ok: /[A-Z]/.test(password) },
        { label: "Number", ok: /[0-9]/.test(password) },
    ];
    const score = checks.filter((c) => c.ok).length;
    const colors = ["", "bg-red-500", "bg-yellow-500", "bg-green-500"];
    if (!password) return null;
    return (
        <div className="mt-1.5">
            <div className="flex gap-1 mb-1.5">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : "bg-white/10"}`} />
                ))}
            </div>
            <div className="flex gap-3 flex-wrap">
                {checks.map((c) => (
                    <span key={c.label} className={`text-xs transition-colors ${c.ok ? "text-green-400" : "text-neutral-600"}`}>
                        {c.ok ? "✓" : "·"} {c.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

function UsernameInput({ value, onChange, register, error }) {
    const [checking, setChecking] = useState(false);
    const [available, setAvailable] = useState(null);

    const checkUsername = useCallback(async (username) => {
        if (!username || username.length < 3) { setAvailable(null); return; }
        setChecking(true);
        try {
            const res = await axios.get(`/api/users/check-username?u=${encodeURIComponent(username)}`);
            setAvailable(res.data.available);
        } catch {
            setAvailable(null);
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        if (!value || value.length < 3) { setAvailable(null); return; }
        const timer = setTimeout(() => checkUsername(value), 500);
        return () => clearTimeout(timer);
    }, [value, checkUsername]);

    const { onChange: rhfOnChange, ...rhfRest } = register("username", {
        required: "Username is required",
        minLength: { value: 3, message: "Min 3 characters" },
        maxLength: { value: 20, message: "Max 20 characters" },
        pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Only letters, numbers & underscores" },
    });

    return (
        <div>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                    <AppIcon icon={UserIcon} size={14} />
                </span>
                <input
                    {...rhfRest}
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
                        onChange(val);
                        rhfOnChange({ target: { name: "username", value: val } });
                    }}
                    placeholder="Username"
                    autoComplete="username"
                    className={`w-full bg-white/5 border text-white rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none placeholder:text-neutral-600 transition-colors ${
                        available === false ? "border-red-500/60 focus:border-red-500" :
                        available === true  ? "border-green-500/60 focus:border-green-500" :
                        "border-white/8 focus:border-accent"
                    }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checking ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : available === true ? (
                        <AppIcon icon={CheckmarkCircle01Icon} size={14} className="text-green-400" />
                    ) : available === false ? (
                        <AppIcon icon={Cancel01Icon} size={14} className="text-red-400" />
                    ) : null}
                </div>
            </div>
            {/* Availability badge */}
            {value && value.length >= 3 && !checking && available === true && (
                <p className="text-xs text-green-400 mt-1 pl-1">✓ @{value} is available</p>
            )}
            {value && value.length >= 3 && !checking && available === false && (
                <p className="text-xs text-red-400 mt-1 pl-1">✗ @{value} is already taken — choose another</p>
            )}
            {error && <p className="text-xs text-red-400 mt-1 pl-1">{error}</p>}
        </div>
    );
}

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [username, setUsername] = useState("");

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
    const password = watch("password", "");
    const termsAccepted = watch("terms", false);

    const onSubmit = async (data) => {
        setLoading(true);
        setError("");

        try {
            await axios.post("/api/auth/register", {
                name: data.name,
                username: data.username,
                email: data.email,
                password: data.password,
            });
            router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Create Account — Rushes</title>
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
                        <h1 className="text-xl font-bold text-white">Create your account</h1>
                        <p className="text-neutral-500 text-sm mt-1">Join Rushes and discover cinema that moves you</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                                <AppIcon icon={UserIcon} size={14} />
                            </span>
                            <input
                                {...register("name", { required: "Name is required", minLength: { value: 2, message: "Name too short" } })}
                                placeholder="Full Name"
                                autoComplete="name"
                                className="w-full bg-white/5 border border-white/8 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600 transition-colors"
                            />
                        </div>

                        <UsernameInput value={username} onChange={setUsername} register={register} error={errors.username?.message} />

                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                                <AppIcon icon={Mail01Icon} size={14} />
                            </span>
                            <input
                                {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } })}
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
                                    {...register("password", { required: "Password is required", minLength: { value: 8, message: "Min 8 characters" } })}
                                    type={showPass ? "text" : "password"}
                                    placeholder="Password"
                                    autoComplete="new-password"
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
                            <PasswordStrength password={password} />
                        </div>

                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                                <AppIcon icon={LockIcon} size={14} />
                            </span>
                            <input
                                {...register("confirmPassword", {
                                    required: "Please confirm your password",
                                    validate: (value) => value === password || "Passwords do not match",
                                })}
                                type={showConfirmPass ? "text" : "password"}
                                placeholder="Confirm Password"
                                autoComplete="new-password"
                                className="w-full bg-white/5 border border-white/8 text-white rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors"
                            >
                                {showConfirmPass ? <AppIcon icon={ViewOffSlashIcon} size={13} /> : <AppIcon icon={ViewIcon} size={13} />}
                            </button>
                        </div>

                        <ExpandableTerms 
                            isChecked={termsAccepted} 
                            setIsChecked={(val) => setValue("terms", val, { shouldValidate: true })} 
                        />
                        {/* Hidden input for react-hook-form validation */}
                        <input type="checkbox" className="hidden" {...register("terms", { required: "You must accept the terms" })} />

                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-glow-red text-sm"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="flex justify-center gap-4 mt-6 text-sm">
                        <Link href="/login" className="text-neutral-500 hover:text-accent transition-colors">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
