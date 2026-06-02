import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Globe02Icon,
  LanguageCircleIcon,
  Search01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import AppIcon from "./AppIcon";
import {
  ALL_GENRES,
  LANGUAGE_OPTIONS,
  OTT_PLATFORMS,
  REGION_GROUPS,
} from "../lib/preferenceOptions";
import {
  defaultPreferences,
  preferencesFromUser,
  readStoredPreferences,
  writeStoredPreferences,
} from "../lib/userPreferences";

const STEPS = [
  {
    key: "region",
    title: "Choose your region first",
    description: "Pick a broad region like Asia or Europe. You can skip now and fine-tune country or market later.",
    icon: Globe02Icon,
  },
  {
    key: "languages",
    title: "Choose your viewing languages",
    description: "Search for something specific, pick all languages, or skip and decide later.",
    icon: LanguageCircleIcon,
  },
  {
    key: "genres",
    title: "Pick your favorite genres",
    description: "Search, choose specific genres, or keep everything broad with All genres.",
    icon: SparklesIcon,
  },
  {
    key: "platforms",
    title: "Which OTT platforms do you use?",
    description: "Pick the services you actually have so recommendations can prioritize what you can watch.",
    icon: CheckmarkCircle01Icon,
  },
];

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "border-red-500 bg-red-500 text-white shadow-[0_10px_30px_rgba(229,9,20,0.25)]"
          : "border-white/10 bg-white/5 text-neutral-300 hover:border-white/25 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function PreferencesGate({ user, onComplete, forceOpen = false, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");
  const [genreSearch, setGenreSearch] = useState("");
  const [preferences, setPreferences] = useState(defaultPreferences);

  const currentStep = STEPS[step];

  const initialState = useMemo(() => {
    if (user) {
      const userPreferences = preferencesFromUser(user);
      if (userPreferences.completed) return userPreferences;
    }

    return readStoredPreferences();
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setPreferences(initialState);
    setOpen(forceOpen || !initialState.completed);
  }, [forceOpen, initialState, mounted]);

  const visibleLanguages = LANGUAGE_OPTIONS.filter((language) =>
    !languageSearch.trim() || language.label.toLowerCase().includes(languageSearch.trim().toLowerCase())
  );

  const visibleGenres = ALL_GENRES.filter((genre) =>
    !genreSearch.trim() || genre.name.toLowerCase().includes(genreSearch.trim().toLowerCase())
  );

  const submitPreferences = async (nextPreferences) => {
    const payload = {
      genres: nextPreferences.genres || [],
      languages: nextPreferences.languages || [],
      regions: [],
      regionGroup: nextPreferences.regionGroup || "",
      platforms: nextPreferences.platforms || [],
      allowLocationRecommendations: false,
      completed: true,
      hasCompletedOnboarding: true,
      syncedUserId: user?.id || user?._id || "",
    };

    setSaving(true);

    try {
      writeStoredPreferences(payload);

      if (user) {
        const response = await fetch("/api/user/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Could not save preferences");
      }

      setPreferences((current) => ({ ...current, ...payload }));
      setOpen(false);
      onComplete?.(payload);
      onClose?.();
    } catch (saveError) {
      setError(saveError.message || "Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    setError("");

    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    await submitPreferences(preferences);
  };

  const handleSkip = async () => {
    setError("");

    const skippedPreferences = {
      ...preferences,
      ...(currentStep.key === "region" ? { regionGroup: "" } : {}),
      ...(currentStep.key === "languages" ? { languages: [] } : {}),
      ...(currentStep.key === "genres" ? { genres: [] } : {}),
      ...(currentStep.key === "platforms" ? { platforms: [] } : {}),
    };

    if (step < STEPS.length - 1) {
      setPreferences(skippedPreferences);
      setStep((current) => current + 1);
      return;
    }

    await submitPreferences(skippedPreferences);
  };

  if (!mounted || !open) return null;

  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950 shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
        <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.22),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-6 py-5 md:px-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400">Personalize your feed</p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Start broad, refine later</h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-red-400">
              <AppIcon icon={StepIcon} size={24} />
            </div>
          </div>

          <div className="flex gap-2">
            {STEPS.map((item, index) => (
              <div key={item.key} className={`h-2 flex-1 rounded-full transition-all ${index <= step ? "bg-red-500" : "bg-white/10"}`} />
            ))}
          </div>
        </div>

        <div className="px-6 py-6 md:px-8 md:py-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white">{currentStep.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">{currentStep.description}</p>
          </div>

          {currentStep.key === "region" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <Pill
                  active={!preferences.regionGroup}
                  onClick={() => setPreferences((current) => ({ ...current, regionGroup: "" }))}
                >
                  All regions
                </Pill>
                {REGION_GROUPS.map((group) => (
                  <Pill
                    key={group.id}
                    active={preferences.regionGroup === group.id}
                    onClick={() => setPreferences((current) => ({ ...current, regionGroup: group.id }))}
                  >
                    {group.label}
                  </Pill>
                ))}
              </div>

              <p className="text-sm leading-6 text-neutral-400">
                This broad region helps shape your feed first. Specific country and ticket-platform tuning can be added later from your profile.
              </p>
            </div>
          ) : null}

          {currentStep.key === "languages" ? (
            <div className="space-y-5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  <AppIcon icon={Search01Icon} size={16} />
                </span>
                <input
                  type="text"
                  value={languageSearch}
                  onChange={(event) => setLanguageSearch(event.target.value)}
                  placeholder="Search language"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-red-500/50"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Pill
                  active={preferences.languages.length === 0}
                  onClick={() => setPreferences((current) => ({ ...current, languages: [] }))}
                >
                  All languages
                </Pill>
                <Pill
                  active={preferences.languages.includes("other")}
                  onClick={() =>
                    setPreferences((current) => ({
                      ...current,
                      languages: current.languages.includes("other") ? [] : ["other"],
                    }))
                  }
                >
                  Other / choose later
                </Pill>
              </div>

              <div className="flex flex-wrap gap-3">
                {visibleLanguages.map((language) => (
                  <Pill
                    key={language.code}
                    active={preferences.languages.includes(language.code) && !preferences.languages.includes("other")}
                    onClick={() =>
                      setPreferences((current) => ({
                        ...current,
                        languages: current.languages.includes(language.code)
                          ? current.languages.filter((item) => item !== language.code)
                          : [...current.languages.filter((item) => item !== "other"), language.code].slice(0, 8),
                      }))
                    }
                  >
                    {language.label}
                  </Pill>
                ))}
              </div>
            </div>
          ) : null}

          {currentStep.key === "genres" ? (
            <div className="space-y-5">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  <AppIcon icon={Search01Icon} size={16} />
                </span>
                <input
                  type="text"
                  value={genreSearch}
                  onChange={(event) => setGenreSearch(event.target.value)}
                  placeholder="Search genre"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-red-500/50"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Pill
                  active={preferences.genres.length === 0}
                  onClick={() => setPreferences((current) => ({ ...current, genres: [] }))}
                >
                  All genres
                </Pill>
              </div>

              <div className="flex flex-wrap gap-3">
                {visibleGenres.map((genre) => (
                  <Pill
                    key={genre.id}
                    active={preferences.genres.includes(genre.id)}
                    onClick={() =>
                      setPreferences((current) => ({
                        ...current,
                        genres: current.genres.includes(genre.id)
                          ? current.genres.filter((item) => item !== genre.id)
                          : [...current.genres, genre.id].slice(0, 10),
                      }))
                    }
                  >
                    {genre.name}
                  </Pill>
                ))}
              </div>
            </div>
          ) : null}

          {currentStep.key === "platforms" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <Pill
                  active={preferences.platforms.length === 0}
                  onClick={() => setPreferences((current) => ({ ...current, platforms: [] }))}
                >
                  I will choose later
                </Pill>
              </div>

              <div className="flex flex-wrap gap-3">
                {OTT_PLATFORMS.map((platform) => (
                  <Pill
                    key={platform.id}
                    active={preferences.platforms.includes(platform.id)}
                    onClick={() =>
                      setPreferences((current) => ({
                        ...current,
                        platforms: current.platforms.includes(platform.id)
                          ? current.platforms.filter((item) => item !== platform.id)
                          : [...current.platforms, platform.id].slice(0, 12),
                      }))
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <img src={platform.logo} alt="" className="h-4 w-4 rounded-sm" />
                      {platform.name}
                    </span>
                  </Pill>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-5 text-sm text-red-400">{error}</p> : null}

          <div className="mt-8 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">You can update these anytime from your profile.</p>

            <div className="flex items-center gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => current - 1)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  Back
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleSkip}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:bg-white/5"
              >
                Skip
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {step === STEPS.length - 1 ? (
                  <>
                    <AppIcon icon={CheckmarkCircle01Icon} size={16} />
                    {saving ? "Saving..." : "Save preferences"}
                  </>
                ) : (
                  <>
                    Continue
                    <AppIcon icon={ArrowRight01Icon} size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
