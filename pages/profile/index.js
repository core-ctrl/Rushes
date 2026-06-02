// pages/profile/index.js
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Head from "next/head";
import axios from "axios";
import { setUser, logoutUser } from "../../store/slices/authSlice";
import { Search01Icon, Logout01Icon, LockIcon, UserIcon } from "@hugeicons/core-free-icons";
import { ALL_GENRES, LANGUAGE_OPTIONS, REGION_GROUPS, REGION_OPTIONS, OTT_PLATFORMS } from "../../lib/preferenceOptions";
import AppIcon from "../../components/AppIcon";
import OnboardingFlow from "../../components/OnboardingFlow";
import { toast } from "../../components/ui/Toaster";

const GENRE_MAP = {
  28: "Action",
  35: "Comedy",
  18: "Drama",
  27: "Horror",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  99: "Documentary",
  16: "Animation",
  14: "Fantasy",
  80: "Crime",
  9648: "Mystery",
  36: "Biography",
  10770: "Sports",
  10402: "Musical",
};

export default function ProfilePage({ user, wishlist = [], openAuth }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [selectedGenres, setSelectedGenres] = useState(user?.preferredGenres || []);
  const [selectedLanguages, setSelectedLanguages] = useState(user?.preferredLanguages || []);
  const [selectedRegions, setSelectedRegions] = useState(user?.preferredRegions || []);
  const [selectedRegionGroup, setSelectedRegionGroup] = useState(user?.preferredRegionGroup || "");
  const [selectedPlatforms, setSelectedPlatforms] = useState(user?.preferredPlatforms || []);
  const [regionSearch, setRegionSearch] = useState("");
  const [allowLocationRecommendations, setAllowLocationRecommendations] = useState(
    Boolean(user?.allowLocationRecommendations)
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Avatar update state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Logout loading state
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <Head><title>Profile — Movie Finder</title></Head>
        <p className="text-4xl">👤</p>
        <p className="text-xl font-bold">Sign in to view your profile</p>
        <button onClick={openAuth} className="mt-4 bg-red-600 text-white px-6 py-3 rounded-xl font-medium">
          Sign In
        </button>
      </div>
    );
  }

  const toggleGenre = (id) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
    setSaved(false);
  };

  const toggleLanguage = (code) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
    setSaved(false);
  };

  const toggleRegion = (code) => {
    setSelectedRegions((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
    setSaved(false);
  };

  const visibleRegions = REGION_OPTIONS.filter((region) => {
    const matchesGroup = selectedRegionGroup ? region.group === selectedRegionGroup : true;
    const term = regionSearch.trim().toLowerCase();
    const matchesSearch = !term || region.label.toLowerCase().includes(term) || region.code.toLowerCase().includes(term);
    return matchesGroup && matchesSearch;
  });

  const savePreferences = async () => {
    setSaving(true);
    await axios.post("/api/user/preferences", {
      genres: selectedGenres,
      languages: selectedLanguages,
      regions: selectedRegions,
      platforms: selectedPlatforms,
      regionGroup: selectedRegionGroup,
      allowLocationRecommendations,
      hasCompletedOnboarding: true,
    });
    dispatch(setUser({
      ...user,
      preferredGenres: selectedGenres,
      preferredLanguages: selectedLanguages,
      preferredRegions: selectedRegions,
      preferredPlatforms: selectedPlatforms,
      ottPlatforms: selectedPlatforms,
      preferredRegionGroup: selectedRegionGroup,
      allowLocationRecommendations,
      hasCompletedOnboarding: true,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  // Handle avatar update
  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    setAvatarError("");
    setUpdatingAvatar(true);
    try {
      const { data } = await axios.put("/api/user/profile", { avatar: avatarUrl });
      dispatch(setUser(data.user));
      setShowAvatarModal(false);
      toast({ type: "success", message: "Profile picture updated" });
    } catch (error) {
      console.error("Avatar update failed:", error);
      const message = error.response?.data?.error || "Failed to update profile picture";
      setAvatarError(message);
      toast({ type: "error", message });
    } finally {
      setUpdatingAvatar(false);
    }
  };

  // Handle file upload via Cloudinary
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const message = 'Please upload an image file.';
      setAvatarError(message);
      toast({ type: "error", message });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      const message = 'Image must be under 5MB.';
      setAvatarError(message);
      toast({ type: "error", message });
      return;
    }

    try {
      setAvatarError("");
      setUpdatingAvatar(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const { data } = await axios.post('/api/user/upload-avatar', {
            image: reader.result,
          });

          if (data.success) {
            setAvatarUrl(data.avatar);
            dispatch(setUser({ ...user, avatar: data.avatar }));
            setShowAvatarModal(false);
            toast({ type: "success", message: "Profile picture updated" });
          }
        } catch (error) {
          console.error('Upload error:', error);
          const message = error.response?.data?.error || 'Failed to upload image.';
          setAvatarError(message);
          toast({ type: "error", message });
        } finally {
          setUpdatingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      setUpdatingAvatar(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;
    setLoggingOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== user.username) return;
    setDeleting(true);
    try {
      await axios.delete('/api/user/delete-account');
      await dispatch(logoutUser()).unwrap();
      dispatch(setUser(null));
      router.push('/');
    } catch (error) {
      console.error('Delete account failed:', error);
      toast({ type: "error", message: "Failed to delete account" });
    } finally {
      setDeleting(false);
    }
  };

  // Handle change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(passwordForm.newPassword)) {
      setPasswordError("New password must contain an uppercase letter");
      return;
    }
    if (!/[0-9]/.test(passwordForm.newPassword)) {
      setPasswordError("New password must contain a number");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setChangingPassword(true);
    try {
      await axios.post("/api/auth/change-password", {
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error) {
      setPasswordError(error.response?.data?.error || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 px-4 md:px-6">
      <Head><title>Profile — Movie Finder</title></Head>

      <div className="max-w-3xl mx-auto">
        {/* Avatar + Name */}
        <div className="flex items-center justify-between gap-5 mb-10">
          <div className="flex items-center gap-5">
            <div 
              className="relative w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-3xl font-bold overflow-hidden cursor-pointer group"
              onClick={() => {
                setAvatarUrl(user.avatar || "");
                setAvatarError("");
                setShowAvatarModal(true);
              }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                  <AppIcon icon={UserIcon} size={40} className="text-neutral-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] uppercase font-bold text-white tracking-wider">Edit</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hi, {user.displayName || user.name || user.username}</h1>
              <p className="text-neutral-400 text-sm">{user.email}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-white/10 hover:text-white"
            >
              <AppIcon icon={LockIcon} size={16} />
              Change Password
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              <AppIcon icon={Logout01Icon} size={16} />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{wishlist.length}</p>
            <p className="text-sm text-neutral-400 mt-1">Saved Titles</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{selectedGenres.length}</p>
            <p className="text-sm text-neutral-400 mt-1">Favourite Genres</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{selectedLanguages.length}</p>
            <p className="text-sm text-neutral-400 mt-1">Preferred Languages</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{selectedRegions.length}</p>
            <p className="text-sm text-neutral-400 mt-1">Preferred Regions</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center col-span-2 md:col-span-1">
            <p className="text-3xl font-bold text-red-400">{selectedPlatforms.length}</p>
            <p className="text-sm text-neutral-400 mt-1">OTT Platforms</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 mt-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">My Taste</h3>
            <button
              onClick={() => setShowOnboarding(true)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Edit preferences
            </button>
          </div>

          {selectedGenres?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Favourite Genres</p>
              <div className="flex flex-wrap gap-2">
                {selectedGenres.map((genreId) => (
                  <span key={genreId} className="px-3 py-1 bg-red-600/20 text-red-300 border border-red-500/30 rounded-full text-xs">
                    {GENRE_MAP[genreId] || genreId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedLanguages?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((lang) => (
                  <span key={lang} className="px-3 py-1 bg-white/5 text-neutral-300 border border-white/10 rounded-full text-xs capitalize">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedPlatforms?.length > 0 && (
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">My OTTs</p>
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map((platform) => (
                  <span key={platform} className="px-3 py-1 bg-white/5 text-neutral-300 border border-white/10 rounded-full text-xs capitalize">
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!selectedGenres?.length && !selectedLanguages?.length && (
            <p className="text-neutral-500 text-sm">
              No taste profile yet.{" "}
              <button onClick={() => setShowOnboarding(true)} className="text-red-400 underline">
                Set up now
              </button>
            </p>
          )}
        </div>

        {/* Platforms section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">OTT Platforms You Use</h2>
          <p className="text-sm text-neutral-400 mb-5">We prioritize content available on your subscriptions for daily picks.</p>
          <div className="flex flex-wrap gap-3">
            {OTT_PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  setSelectedPlatforms(prev =>
                    prev.includes(platform.id)
                      ? prev.filter(p => p !== platform.id)
                      : [...prev, platform.id]
                  );
                  setSaved(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${selectedPlatforms.includes(platform.id)
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
                  }`}
              >
                <img src={platform.logo} alt={platform.name} className="h-4 w-4 rounded" />
                {platform.name}
              </button>
            ))}
          </div>
        </div>

        {/* Genre Preferences */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Favourite Genres</h2>
          <p className="text-sm text-neutral-400 mb-5">
            Select genres to get personalised recommendations on the home page.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            {ALL_GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedGenres.includes(genre.id)
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
                  }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Languages You Watch In</h2>
          <p className="text-sm text-neutral-400 mb-5">
            Choose the languages you usually enjoy. This helps us prioritize titles closer to your taste.
          </p>
          <div className="flex flex-wrap gap-3">
            {LANGUAGE_OPTIONS.map((language) => (
              <button
                key={language.code}
                onClick={() => toggleLanguage(language.code)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedLanguages.includes(language.code)
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
                  }`}
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Region and Market Preferences</h2>
          <p className="text-sm text-neutral-400 mb-5">
            Pick the broad region first, then the countries or markets you watch from most often so recommendations, theater links, and platform hints stay relevant.
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            {REGION_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedRegionGroup(group.id);
                  setSelectedRegions((prev) => prev.filter((code) => REGION_OPTIONS.find((region) => region.code === code)?.group === group.id));
                  setSaved(false);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedRegionGroup === group.id
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
                  }`}
              >
                {group.label}
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <AppIcon icon={Search01Icon} size={15} />
            </span>
            <input
              type="text"
              value={regionSearch}
              onChange={(event) => setRegionSearch(event.target.value)}
              placeholder="Search country or market"
              className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-red-500/50"
            />
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            {visibleRegions.map((region) => (
              <button
                key={region.code}
                onClick={() => toggleRegion(region.code)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedRegions.includes(region.code)
                  ? "bg-red-600 text-white"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20"
                  }`}
              >
                {region.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-white">Allow location-aware recommendations</p>
                <p className="text-sm text-neutral-400">
                  Turn this on if you want us to use your chosen market and future location signals to tune results more accurately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAllowLocationRecommendations((value) => !value);
                  setSaved(false);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${allowLocationRecommendations
                  ? "bg-green-600/20 text-green-400 border border-green-600/30"
                  : "bg-white/10 text-neutral-300 border border-white/10"
                  }`}
              >
                {allowLocationRecommendations ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>

          <button
            onClick={savePreferences}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium transition text-sm disabled:opacity-60"
            disabled={saving}
          >
            {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        <div className="bg-neutral-900 border border-red-500/20 rounded-2xl p-6 mt-8">
          <h3 className="font-bold text-red-400 mb-2">Danger Zone</h3>
          <p className="text-neutral-400 text-sm mb-4">
            Permanently delete your account and all your data. This cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-600/30 transition-colors"
            >
              Delete my account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-neutral-300">
                Type <strong className="text-white">@{user.username}</strong> to confirm:
              </p>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={user.username}
                className="w-full bg-neutral-800 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  className="flex-1 py-2.5 bg-white/5 rounded-xl text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== user.username || deleting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded-xl text-sm font-bold transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete forever'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Update Profile Picture</h2>
              <button
                onClick={() => { setAvatarError(""); setShowAvatarModal(false); }}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateAvatar}>
              <div className="space-y-4">
                {avatarError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {avatarError}
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">
                    Upload new picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-red-700 focus:border-red-500/50"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <span className="text-xs text-neutral-500 font-bold uppercase">or</span>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-red-500/50"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Paste a direct link to an image. Leave blank to use your default avatar.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAvatarError(""); setShowAvatarModal(false); }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-neutral-300 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingAvatar}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {updatingAvatar ? "Saving..." : "Save Picture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Change Password</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setPasswordSuccess("");
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-red-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-red-500/50"
                    required
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Min 8 characters, 1 uppercase, 1 number
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-red-500/50"
                    required
                  />
                </div>

                {passwordError && (
                  <p className="text-sm text-red-400">{passwordError}</p>
                )}

                {passwordSuccess && (
                  <p className="text-sm text-green-400">{passwordSuccess}</p>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-neutral-300 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showOnboarding && (
        <OnboardingFlow
          forceOpen
          onClose={() => setShowOnboarding(false)}
          onComplete={(preferences) => {
            setSelectedGenres(preferences.genres || []);
            setSelectedLanguages(preferences.languages || []);
            setSelectedRegions(preferences.regions || []);
            setSelectedRegionGroup(preferences.regionGroup || "");
            setSelectedPlatforms(preferences.platforms || []);
            setAllowLocationRecommendations(Boolean(preferences.allowLocationRecommendations));
          }}
        />
      )}
    </div>
  );
}
