export const SITE_NAME = "Rushes";
export const SITE_DOMAIN = "rushes.theorbit.in";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || `https://www.${SITE_DOMAIN}`).replace(/\/+$/, "");
export const SITE_DESCRIPTION =
  "Discover trending movies, binge-worthy series, anime, trailers, and streaming providers with a privacy-conscious recommendation experience.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";
export const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";

export const SITE_CONTACT = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "admin@theorbit.in",
  city: "Hyderabad",
  region: "Telangana",
  country: "India",
};

export const SITE_AUTHOR = {
  name: "Rushes Editorial Team",
  role: "Entertainment discovery editors",
  bio: "Rushes Editorial Team covers streaming trends, movie discovery, TV recommendations, and practical viewing guides for global audiences.",
  avatar: `${SITE_URL}/apple-touch-icon.png`,
};

export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatDateIso(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
