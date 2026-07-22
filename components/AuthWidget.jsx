import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  Cancel01Icon,
  GithubIcon,
  GoogleIcon,
  LockIcon,
  Mail01Icon,
  UserIcon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import {
  loginUser, registerUser, clearError,
  selectAuthStatus, selectAuthError,
} from "../store/slices/authSlice";
import {
  selectAuthModalMode, openAuthModal,
} from "../store/slices/uiSlice";
import axios from "axios";
import AppIcon from "./AppIcon";
import { toast } from "./ui/Toaster";
import { signIn } from "next-auth/react";
import { readStoredPreferences, hasMeaningfulPreferences } from "../lib/userPreferences";
import ExpandableTerms from "./ExpandableTerms";
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
      <div className="flex gap-3">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs transition-colors ${c.ok ? "text-green-400" : "text-neutral-600"}`}>
            {c.ok ? "✓" : "·"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function SocialButton({ provider, icon, label, disabled }) {
  const baseClasses = "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => signIn(provider)}
      className={`${baseClasses} hover:border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function AuthWidget({ open, onClose, onLogin, externalFeedback }) {
  const dispatch = useDispatch();
  const mode = useSelector(selectAuthModalMode);
  const status = useSelector(selectAuthStatus);
  const apiError = useSelector(selectAuthError);
  const loading = status === "loading";

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [success, setSuccess] = useState("");
  const [localErr, setLocalErr] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
  const password = watch("password", "");
  const confirmPassword = watch("confirmPassword", "");

  // Clear errors on mode change or when modal opens
  useEffect(() => { dispatch(clearError()); setSuccess(""); setLocalErr(""); reset(); }, [mode, dispatch]);

  // Clear error when modal opens
  useEffect(() => { if (open) { setLocalErr(""); dispatch(clearError()); } }, [open, dispatch]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!externalFeedback?.message) return;
    if (externalFeedback.type === "error") setLocalErr(externalFeedback.message);
    if (externalFeedback.type === "success") setSuccess(externalFeedback.message);
  }, [externalFeedback]);

  if (!open) return null;

  const setMode = (m) => dispatch(openAuthModal(m));

  const onSubmit = async (data) => {
    setLocalErr("");
    setSuccess("");
    if (mode === "forgot") {
      try {
        await axios.post("/api/auth/forgot-password", { email: data.email });
        setSuccess("Reset link sent — check your email 📧");
      } catch (e) { setLocalErr(e.response?.data?.error || "Something went wrong"); }
      return;
    }

    if (mode === "signup") {
      if (data.password !== data.confirmPassword) {
        setLocalErr("Passwords do not match.");
        return;
      }
    }

    const action = mode === "login"
      ? dispatch(loginUser({ email: data.email, password: data.password }))
      : dispatch(registerUser({ name: data.name, username: data.username, email: data.email, password: data.password }));

    const result = await action;
    if (!result.error) {
      // Sync preferences if needed
      const isSignup = mode === "signup";
      const localPrefs = readStoredPreferences();
      const userPayload = result.payload?.user;
      
      const userHasPrefs = userPayload && (
        userPayload.preferredGenres?.length > 0 ||
        userPayload.preferredLanguages?.length > 0 ||
        userPayload.hasCompletedOnboarding
      );

      if (hasMeaningfulPreferences(localPrefs) && (isSignup || !userHasPrefs)) {
        axios.post("/api/user/preferences", localPrefs).catch(console.error);
      }

      if (mode === "signup") {
        const isVerify = result.payload?.requiresVerification;
        const message = isVerify
          ? "Account created. Redirecting to verification..."
          : "Account created. Thanks for joining Movie Finder.";
        setSuccess(message);
        toast({ type: "success", message });
        if (isVerify) {
          setTimeout(() => {
            window.location.href = `/verify-email?email=${encodeURIComponent(data.email)}`;
          }, 1200);
        }
      }
      if (mode === "login") {
        const message = "Thanks for signing in. Your recommendations are ready.";
        setSuccess(message);
        toast({ type: "success", message });
        setTimeout(() => onLogin?.(), 700);
      }
    } else if (mode === "signup" && String(result.payload || "").includes("Please sign in instead")) {
      setMode("login");
    } else {
      const errMsg = String(result.payload || "Authentication failed.");
      toast({ type: "error", message: errMsg });
      if (mode === "login" && errMsg.toLowerCase().includes("verify")) {
        setTimeout(() => {
          window.location.href = `/verify-email?email=${encodeURIComponent(data.email)}`;
        }, 1200);
      }
    }
  };

  const err = localErr || apiError || Object.values(errors)[0]?.message || "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex justify-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md glass-strong rounded-2xl p-8 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white transition">
              <AppIcon icon={Cancel01Icon} size={16} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <motion.div className="text-4xl mb-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }}>
                🎬
              </motion.div>
              <h1 className="text-xl font-bold text-white">
                {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
              </h1>
              <p className="text-neutral-500 text-sm mt-1">
                {mode === "login" ? "Sign in to access your list"
                  : mode === "signup" ? "Join for personalised picks"
                    : "We'll email you a reset link"}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {mode !== "forgot" && (
                <div className="flex flex-col gap-3">
                  <SocialButton provider="google" icon={<AppIcon icon={GoogleIcon} size={14} />} label="Continue with Google" disabled={!termsAccepted} />
                  <SocialButton provider="github" icon={<AppIcon icon={GithubIcon} size={14} />} label="Continue with GitHub" disabled={!termsAccepted} />
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">or</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                      <AppIcon icon={UserIcon} size={14} />
                    </span>
                    <input {...register("name", { required: "Name is required", minLength: { value: 2, message: "Name too short" } })}
                      placeholder="Full Name" autoComplete="name"
                      className="w-full bg-white/5 border border-white/8 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600 transition-colors" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                      <AppIcon icon={UserIcon} size={14} />
                    </span>
                    <input
                      {...register("username", {
                        required: "Username is required",
                        minLength: { value: 3, message: "Username must be at least 3 characters" },
                        maxLength: { value: 20, message: "Username must be at most 20 characters" },
                        pattern: { value: /^[a-zA-Z0-9_]+$/, message: "Username can only contain letters, numbers, and underscores" },
                      })}
                      placeholder="Username"
                      autoComplete="username"
                      className="w-full bg-white/5 border border-white/8 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600 transition-colors"
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                  <AppIcon icon={Mail01Icon} size={14} />
                </span>
                <input {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } })}
                  type="email" placeholder="Email address" autoComplete="email"
                  className="w-full bg-white/5 border border-white/8 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600 transition-colors" />
              </div>

              {mode !== "forgot" && (
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">
                      <AppIcon icon={LockIcon} size={14} />
                    </span>
                    <input {...register("password", { required: "Password is required", minLength: { value: 8, message: "Min 8 characters" } })}
                      type={showPass ? "text" : "password"} placeholder="Password" autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="w-full bg-white/5 border border-white/8 text-white rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600 transition-colors" />
                    <button type="button" onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors">
                      {showPass ? <AppIcon icon={ViewOffSlashIcon} size={13} /> : <AppIcon icon={ViewIcon} size={13} />}
                    </button>
                  </div>
                  {mode === "signup" && <PasswordStrength password={password} />}
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-xs text-neutral-600 hover:text-accent transition-colors mt-1.5 float-right">
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              {mode === "signup" && (
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
                    onClick={() => setShowConfirmPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors"
                  >
                    {showConfirmPass ? <AppIcon icon={ViewOffSlashIcon} size={13} /> : <AppIcon icon={ViewIcon} size={13} />}
                  </button>
                </div>
              )}

              {mode !== "forgot" && (
                <ExpandableTerms isChecked={termsAccepted} setIsChecked={setTermsAccepted} />
              )}

              <AnimatePresence>
                {err && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">
                    {err}
                  </motion.p>
                )}
                {success && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-xs text-center bg-green-500/10 border border-green-500/20 rounded-lg py-2 px-3">
                    {success}
                  </motion.p>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading || (mode !== "forgot" && !termsAccepted)}
                className="mt-1 bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all hover:shadow-glow-red text-sm">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait...
                  </span>
                ) : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </button>
            </form>

            <div className="flex justify-center gap-4 mt-5 text-sm">
              {mode !== "login" && <button onClick={() => setMode("login")} className="text-neutral-500 hover:text-accent transition-colors">Sign In</button>}
              {mode !== "signup" && <button onClick={() => setMode("signup")} className="text-neutral-500 hover:text-accent transition-colors">Create Account</button>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
