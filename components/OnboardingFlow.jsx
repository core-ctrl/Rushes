import { useDispatch, useSelector } from "react-redux";
import PreferencesGate from "./PreferencesGate";
import { selectUser, setUser } from "../store/slices/authSlice";

export default function OnboardingFlow({ forceOpen, onClose, onComplete }) {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  if (!user) return null;

  return (
    <PreferencesGate
      user={user}
      forceOpen={forceOpen}
      onClose={onClose}
      onComplete={(preferences) => {
        dispatch(setUser({
          ...user,
          preferredGenres: preferences.genres || [],
          preferredLanguages: preferences.languages || [],
          preferredRegions: preferences.regions || [],
          preferredRegionGroup: preferences.regionGroup || "",
          preferredPlatforms: preferences.platforms || [],
          ottPlatforms: preferences.platforms || [],
          allowLocationRecommendations: Boolean(preferences.allowLocationRecommendations),
          hasCompletedOnboarding: true,
        }));
        onComplete?.(preferences);
      }}
    />
  );
}
