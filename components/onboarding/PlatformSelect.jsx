import React, { useState, useEffect } from "react";
import { OTT_PLATFORMS } from "../../lib/preferenceOptions";

export default function PlatformSelect({ value = [], onChange }) {
    const [selected, setSelected] = useState(value || []);
    const [skipped, setSkipped] = useState(false);

    useEffect(() => {
        onChange?.(skipped ? [] : selected);
    }, [selected, skipped, onChange]);

    const toggle = (platformId) => {
        if (skipped) return;
        setSelected((current) =>
            current.includes(platformId)
                ? current.filter((id) => id !== platformId)
                : [...current, platformId]
        );
    };

    return (
        <div className="mx-auto max-w-3xl rounded-lg bg-neutral-900 p-6 text-white">
            <h2 className="mb-3 text-2xl font-bold">Which OTT platforms do you use?</h2>
            <p className="mb-6 text-sm text-neutral-400">
                We'll prioritize content available on your subscriptions.
                <span className="font-semibold"> Skip if you want all options</span>.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {OTT_PLATFORMS.map((platform) => {
                    const active = selected.includes(platform.id);
                    return (
                        <button
                            key={platform.id}
                            onClick={() => toggle(platform.id)}
                            disabled={skipped}
                            className={`group relative rounded-xl p-4 transition-all ${active
                                    ? "bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-500/25"
                                    : skipped
                                        ? "opacity-50 bg-white/5 cursor-not-allowed"
                                        : "border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={platform.logo}
                                    alt={platform.name}
                                    className={`h-8 w-8 rounded object-contain ${active ? "ring-2 ring-white/20" : ""}`}
                                />
                                <div>
                                    <div className="font-semibold">{platform.name}</div>
                                    <div className="text-xs text-neutral-400">{platform.quality}</div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-8 flex items-center justify-center space-x-4">
                <button
                    onClick={() => setSkipped(true)}
                    className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all text-sm"
                >
                    Skip (show all platforms)
                </button>
                {selected.length > 0 && (
                    <div className="text-sm text-neutral-400">
                        {selected.length} selected
                    </div>
                )}
            </div>
        </div>
    );
}
