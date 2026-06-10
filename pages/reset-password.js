import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import { LockIcon, ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import AppIcon from "../components/AppIcon";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/reset-password", { token, password });
      setSuccess(true);
      setTimeout(() => router.push("/"), 3000);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <Head>
        <title>Reset Password — Rushes</title>
      </Head>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-8">
        <h1 className="mb-2 text-2xl font-bold text-white">Reset Password</h1>
        <p className="mb-8 text-sm text-neutral-400">Enter your new password below.</p>

        {success ? (
          <div className="text-center">
            <p className="mb-2 text-lg text-green-400">Password reset!</p>
            <p className="text-sm text-neutral-400">Redirecting to home...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <AppIcon icon={LockIcon} size={16} />
              </span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder:text-neutral-500 focus:border-red-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
              >
                {showPass ? <AppIcon icon={ViewOffSlashIcon} size={14} /> : <AppIcon icon={ViewIcon} size={14} />}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <AppIcon icon={LockIcon} size={16} />
              </span>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-red-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-neutral-400 transition hover:text-white">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
