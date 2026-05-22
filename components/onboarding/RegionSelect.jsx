import React, { useState, useEffect } from "react";
import { REGION_OPTIONS } from "../../lib/preferenceOptions";

export default function RegionSelect({ value = "IN", onChange }) {
    const [selected, setSelected] = useState(value);

    useEffect(() => {
        onChange?.(selected);
    }, [selected, onChange]);

    return (
        <div className="mx-auto max-w-3xl rounded-lg bg-neutral-900 p-6 text-white">
            <h2 className="mb-3 text-2xl font-bold">What's your region?</h2>
            <p className="mb-6 text-sm text-neutral-400">
                Helps us show relevant content and availability. Default: India.
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {REGION_OPTIONS.map((region) => {
                    const active = selected === region.code;
                    return (
                        <button
                            key={region.code}
                            onClick={() => setSelected(region.code)}
                            className={`rounded-xl p-4 text-left transition-all ${active
                                    ? "border-2 border-red-500 bg-red-600/20 shadow-lg shadow-red-500/25"
                                    : "border border-white/10 bg-white/5 hover:bg-white/10"
                                }`}
                        >
                            <div className="font-bold">{region.label}</div>
                            <div className="mt-1 text-xs text-neutral-400">{region.providers?.slice(0, 2).join(", ")}</div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 p-4 bg-neutral-800/50 rounded-lg">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={selected === "auto"}
                        onChange={(e) => setSelected(e.target.checked ? "auto" : "IN")}
                        className="rounded"
                    />
                    Use my location (beta)
                </label>
            </div>
        </div>
    );
}
