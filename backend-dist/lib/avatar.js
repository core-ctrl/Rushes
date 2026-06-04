const DEFAULT_AVATAR = "/avatar.svg";

function defaultAvatarForUser(seed = "") {
  const value = String(seed || "").trim();
  if (!value) return DEFAULT_AVATAR;

  const initials = value
    .replace(/[^a-zA-Z0-9\s._-]/g, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (!initials) return DEFAULT_AVATAR;

  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(value)}&backgroundColor=111827,7f1d1d,312e81&textColor=ffffff&radius=50`;
}

function avatarOrDefault(avatar, seed = "") {
  return typeof avatar === "string" && avatar.trim() ? avatar.trim() : defaultAvatarForUser(seed);
}

module.exports = {
  defaultAvatarForUser,
  avatarOrDefault
};
