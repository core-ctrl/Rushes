// components/AuthModal.jsx
import React from "react";

export default function AuthModal({ open, onClose }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-neutral-900 text-white p-6 rounded-lg max-w-md w-full z-60">
                <h3 className="text-xl font-bold mb-4">Sign in</h3>
                <button
                    type="button"
                    onClick={() => window.location.assign("/api/auth/oauth/google")}
                    className="w-full bg-white text-black py-2 rounded mb-2 transition-colors hover:bg-neutral-200"
                >
                    Continue with Google
                </button>
                <button
                    type="button"
                    onClick={() => window.location.assign("/api/auth/oauth/github")}
                    className="w-full bg-white/10 py-2 rounded mb-2 transition-colors hover:bg-white/15"
                >
                    Continue with GitHub
                </button>
                <button className="w-full bg-white/10 py-2 rounded">Continue with Email</button>
                <div className="text-sm text-neutral-400 mt-4">Choose a sign-in method to continue.</div>
            </div>
        </div>
    );
}
