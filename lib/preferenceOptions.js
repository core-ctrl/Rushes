export const ALL_GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
];

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "pa", label: "Punjabi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
];

export const REGION_GROUPS = [
  { id: "asia", label: "Asia" },
  { id: "middle-east", label: "Middle East" },
  { id: "europe", label: "Europe" },
  { id: "north-america", label: "North America" },
  { id: "south-america", label: "South America" },
  { id: "oceania", label: "Oceania" },
];

export const REGION_OPTIONS = [
  { code: "IN", label: "India", group: "asia", bookingApp: "bookmyshow" },
  { code: "JP", label: "Japan", group: "asia", bookingApp: "toho" },
  { code: "KR", label: "South Korea", group: "asia", bookingApp: "cgv" },
  { code: "SG", label: "Singapore", group: "asia", bookingApp: "gv" },
  { code: "TH", label: "Thailand", group: "asia", bookingApp: "major-cineplex" },
  { code: "ID", label: "Indonesia", group: "asia", bookingApp: "xxi" },
  { code: "AE", label: "UAE", group: "middle-east", bookingApp: "vox" },
  { code: "SA", label: "Saudi Arabia", group: "middle-east", bookingApp: "vox" },
  { code: "GB", label: "United Kingdom", group: "europe", bookingApp: "odeon" },
  { code: "FR", label: "France", group: "europe", bookingApp: "pathe" },
  { code: "DE", label: "Germany", group: "europe", bookingApp: "cinestar" },
  { code: "ES", label: "Spain", group: "europe", bookingApp: "cinesa" },
  { code: "IT", label: "Italy", group: "europe", bookingApp: "the-space" },
  { code: "US", label: "United States", group: "north-america", bookingApp: "fandango" },
  { code: "CA", label: "Canada", group: "north-america", bookingApp: "cineplex" },
  { code: "MX", label: "Mexico", group: "north-america", bookingApp: "cinemex" },
  { code: "BR", label: "Brazil", group: "south-america", bookingApp: "ingresso" },
  { code: "AR", label: "Argentina", group: "south-america", bookingApp: "cinemark" },
  { code: "AU", label: "Australia", group: "oceania", bookingApp: "hoyts" },
  { code: "NZ", label: "New Zealand", group: "oceania", bookingApp: "event-cinemas" },
];

export const OTT_PLATFORMS = [
  { id: "netflix", name: "Netflix", logo: "/providers/netflix.svg", quality: "Premium" },
  { id: "primevideo", name: "Prime Video", logo: "/providers/primevideo.svg", quality: "Premium" },
  { id: "hotstar", name: "Disney+ Hotstar", logo: "/providers/hotstar.svg", quality: "Premium" },
  { id: "zee5", name: "Zee5", logo: "/providers/zee5.svg", quality: "Premium" },
  { id: "sonyliv", name: "SonyLIV", logo: "/providers/sonyliv.svg", quality: "Premium" },
  { id: "jiocinema", name: "JioCinema", logo: "/providers/jiocinema.svg", quality: "Free/Premium" },
];

export function findRegionOption(code) {
  return REGION_OPTIONS.find((region) => region.code === code);
}
