// components/AuthModal.jsx
import React, { useState } from "react";
import ExpandableTerms from "./ExpandableTerms";

export default function AuthModal({ open, onClose }) {
    const [termsAccepted, setTermsAccepted] = useState(false);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#111] border border-white/10 text-white p-6 rounded-2xl max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-center">Sign in to Rushes</h3>
                
                <ExpandableTerms isChecked={termsAccepted} setIsChecked={setTermsAccepted} />

                <div className="flex flex-col gap-3 mt-4">
                    <button
                        type="button"
                        disabled={!termsAccepted}
                        onClick={() => window.location.assign("/api/auth/oauth/google")}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl transition-colors hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue with Google
                    </button>
                    <button
                        type="button"
                        disabled={!termsAccepted}
                        onClick={() => window.location.assign("/api/auth/oauth/github")}
                        className="w-full bg-white/10 py-3 font-bold rounded-xl transition-colors hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                    >
                        Continue with GitHub
                    </button>
                    <button 
                        disabled={!termsAccepted}
                        onClick={() => window.location.assign("/login")}
                        className="w-full bg-white/10 py-3 font-bold rounded-xl transition-colors hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                    >
                        Continue with Email
                    </button>
                </div>
                <div className="text-xs text-neutral-500 mt-5 text-center">
                    You must accept the Terms of Service to continue.
                </div>
            </div>
        </div>
    );
}
