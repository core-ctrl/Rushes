// components/onboarding/OnboardingWrapper.jsx
import React, { useState, useEffect } from "react";
import WelcomeScreen from "./WelcomeScreen";
import GenreSelect from "./GenreSelect";
import LanguageSelect from "./LanguageSelect";
import RegionSelect from "./RegionSelect";
import PlatformSelect from "./PlatformSelect";
import { writeStoredPreferences } from "../../lib/userPreferences";
import { useAnalytics } from "../../hooks/useAnalytics";
import axios from "axios";

export default function OnboardingWrapper({ onComplete }) {
    const { track } = useAnalytics();
    const [step, setStep] = useState(0);
    const [genres, setGenres] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [region, setRegion] = useState("IN");
    const [platforms, setPlatforms] = useState([]);

    // fetch location-based primary languages
    const [primaryLangs, setPrimaryLangs] = useState(["en", "hi", "te", "ta", "kn", "ml"]);

    useEffect(() => {
        // location detection stub (replace with ipapi or server-side detection later)
        async function detect() {
            try {
                const res = await fetch("https://ipapi.co/json").then(r => r.json()).catch(() => null);
                if (res?.country === "US") setPrimaryLangs(["en", "es", "fr"]);
                if (res?.country === "JP") setPrimaryLangs(["ja", "en"]);
                // more rules as needed
            } catch { }
        }
        detect();
    }, []);

    const next = () => {
        // Track each step transition
        if (step === 0) track('onboarding_started');
        if (step === 1) track('onboarding_genres_picked', { count: genres.length });
        if (step === 2) track('onboarding_languages_picked', { count: languages.length });
        if (step === 3) track('onboarding_region_picked', { region });
        setStep(s => s + 1);
    };
    const prev = () => setStep(s => Math.max(0, s - 1));

    const finishOnboarding = async () => {
        const prefs = {
            genres,
            languages,
            regions: [region],
            regionGroup: "",
            allowLocationRecommendations: region === "auto",
            platforms,
            completed: true
        };

        // Save to localStorage
        writeStoredPreferences(prefs);

        // Save to backend if user logged in
        try {
            const response = await axios.post("/api/user/preferences", {
                ...prefs,
                hasCompletedOnboarding: true
            });
            console.log("Onboarding saved:", response.data);
        } catch (e) {
            console.warn("Guest save skipped:", e.message);
        }

        track('onboarding_completed', {
            genres_picked: genres.length,
            languages_picked: languages.length,
            platforms_picked: platforms.length,
            region,
        });

        onComplete?.(prefs);
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-6">
            {step === 0 && <WelcomeScreen onNext={next} />}
            {step === 1 && (
                <div className="max-w-4xl mx-auto">
                    <GenreSelect onChange={setGenres} />
                    <div className="flex justify-between mt-6">
                        <button onClick={prev} className="px-4 py-2 bg-white/6 rounded">Back</button>
                        <button onClick={next} className="px-4 py-2 bg-red-600 rounded disabled:opacity-50" disabled={genres.length < 1}>Continue</button>
                    </div>
                </div>
            )}
            {step === 2 && (
                <div className="max-w-4xl mx-auto">
                    <LanguageSelect primary={primaryLangs} onChange={setLanguages} />
                    <div className="flex justify-between mt-6">
                        <button onClick={prev} className="px-4 py-2 bg-white/6 rounded">Back</button>
                        <button onClick={next} className="px-4 py-2 bg-red-600 rounded">Continue</button>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div className="max-w-4xl mx-auto">
                    <RegionSelect value={region} onChange={setRegion} />
                    <div className="flex justify-between mt-6">
                        <button onClick={prev} className="px-4 py-2 bg-white/6 rounded">Back</button>
                        <button onClick={next} className="px-4 py-2 bg-red-600 rounded">Continue</button>
                    </div>
                </div>
            )}
            {step === 4 && (
                <div className="max-w-4xl mx-auto">
                    <PlatformSelect value={platforms} onChange={setPlatforms} />
                    <div className="flex justify-between mt-6">
                        <button onClick={prev} className="px-4 py-2 bg-white/6 rounded">Back</button>
                        <button onClick={finishOnboarding} className="px-4 py-2 bg-red-600 rounded">Finish Setup</button>
                    </div>
                </div>
            )}
        </div>
    );
}
