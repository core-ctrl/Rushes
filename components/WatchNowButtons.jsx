import {
  ArrowRight01Icon,
  MapsIcon,
  PlayIcon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import AppIcon from "./AppIcon";
import { trackWatchNowClick } from "../lib/analytics";
import { findRegionOption } from "../lib/preferenceOptions";
import { TMDB_BLUR_DATA_URL } from "../lib/imageBlur";

const STREAMING_SEARCH_LINKS = [
  { match: /netflix/i, build: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}` },
  { match: /prime|amazon/i, build: (title) => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(title)}` },
  { match: /disney/i, build: (title) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}` },
  { match: /hotstar/i, build: (title) => `https://www.hotstar.com/in/search?q=${encodeURIComponent(title)}` },
  { match: /apple/i, build: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}` },
  { match: /hulu/i, build: (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}` },
  { match: /max|hbo/i, build: (title) => `https://www.max.com/search?q=${encodeURIComponent(title)}` },
  { match: /jiocinema|jio/i, build: (title) => `https://www.jiocinema.com/search/${encodeURIComponent(title)}` },
  { match: /zee5|zee/i, build: (title) => `https://www.zee5.com/search?q=${encodeURIComponent(title)}` },
  { match: /sony/i, build: (title) => `https://www.sonyliv.com/search?q=${encodeURIComponent(title)}` },
  { match: /youtube/i, build: (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} movie`)}` },
  { match: /mubi/i, build: (title) => `https://mubi.com/search/films?query=${encodeURIComponent(title)}` },
  { match: /aha/i, build: (title) => `https://www.aha.video/search?q=${encodeURIComponent(title)}` },
];

const BOOKING_LINKS = {
  bookmyshow: { label: "BookMyShow", build: (title) => `https://in.bookmyshow.com/explore/movies?q=${encodeURIComponent(title)}` },
  paytm: { label: "Paytm Movies", build: (title) => `https://paytm.com/movies/search?q=${encodeURIComponent(title)}` },
  pvr: { label: "PVR INOX", build: (title) => `https://www.pvrcinemas.com/search?q=${encodeURIComponent(title)}` },
  fandango: { label: "Fandango", build: (title) => `https://www.fandango.com/search?q=${encodeURIComponent(title)}` },
  atom: { label: "Atom Tickets", build: (title) => `https://www.atomtickets.com/search?query=${encodeURIComponent(title)}` },
  amc: { label: "AMC", build: (title) => `https://www.amctheatres.com/search?q=${encodeURIComponent(title)}` },
  cineplex: { label: "Cineplex", build: (title) => `https://www.cineplex.com/search?query=${encodeURIComponent(title)}` },
  odeon: { label: "ODEON", build: (title) => `https://www.odeon.co.uk/search?query=${encodeURIComponent(title)}` },
  vox: { label: "VOX Cinemas", build: (title) => `https://uae.voxcinemas.com/search?query=${encodeURIComponent(title)}` },
  hoyts: { label: "HOYTS", build: (title) => `https://www.hoyts.com.au/search?query=${encodeURIComponent(title)}` },
  cgv: { label: "CGV", build: (title) => `https://www.cgv.co.kr/search/?query=${encodeURIComponent(title)}` },
  toho: { label: "TOHO Cinemas", build: (title) => `https://hlo.tohotheater.jp/net/search/?word=${encodeURIComponent(title)}` },
  gv: { label: "Golden Village", build: (title) => `https://www.gv.com.sg/GVSearch.jsp?query=${encodeURIComponent(title)}` },
  "major-cineplex": { label: "Major Cineplex", build: (title) => `https://www.majorcineplex.com/search?title=${encodeURIComponent(title)}` },
  xxi: { label: "Cinema XXI", build: (title) => `https://www.cinema21.co.id/search?query=${encodeURIComponent(title)}` },
  pathe: { label: "Pathe", build: (title) => `https://www.pathe.fr/recherche?q=${encodeURIComponent(title)}` },
  cinestar: { label: "CineStar", build: (title) => `https://www.cinestar.de/suche?query=${encodeURIComponent(title)}` },
  cinesa: { label: "Cinesa", build: (title) => `https://www.cinesa.es/busqueda?texto=${encodeURIComponent(title)}` },
  "the-space": { label: "The Space Cinema", build: (title) => `https://www.thespacecinema.it/cerca?q=${encodeURIComponent(title)}` },
  ingresso: { label: "Ingresso", build: (title) => `https://www.ingresso.com/filmes/busca?texto=${encodeURIComponent(title)}` },
  cinemark: { label: "Cinemark", build: (title) => `https://www.cinemarkhoyts.com.ar/search?query=${encodeURIComponent(title)}` },
  cinemex: { label: "Cinemex", build: (title) => `https://cinemex.com/search?query=${encodeURIComponent(title)}` },
  "event-cinemas": { label: "Event Cinemas", build: (title) => `https://www.eventcinemas.co.nz/Search?query=${encodeURIComponent(title)}` },
  google: { label: "Google showtimes", build: (title, regionLabel) => `https://www.google.com/search?q=${encodeURIComponent(`${title} movie tickets ${regionLabel}`)}` },
};

const BOOKING_GROUPS = {
  IN: ["bookmyshow", "paytm", "pvr"],
  US: ["fandango", "atom", "amc"],
  CA: ["cineplex", "google"],
  GB: ["odeon", "google"],
  AE: ["vox", "google"],
  AU: ["hoyts", "google"],
  JP: ["toho", "google"],
  KR: ["cgv", "google"],
  SG: ["gv", "google"],
  TH: ["major-cineplex", "google"],
  ID: ["xxi", "google"],
  FR: ["pathe", "google"],
  DE: ["cinestar", "google"],
  ES: ["cinesa", "google"],
  IT: ["the-space", "google"],
  BR: ["ingresso", "google"],
  AR: ["cinemark", "google"],
  MX: ["cinemex", "google"],
  NZ: ["event-cinemas", "google"],
};

function bookingLinksForRegion(regionCode, title) {
  const region = findRegionOption(regionCode);
  const keys = BOOKING_GROUPS[regionCode] || [region?.bookingApp, "google"].filter(Boolean);
  return keys
    .map((key) => {
      const booking = BOOKING_LINKS[key];
      if (!booking) return null;
      return {
        label: booking.label,
        href: booking.build(title, region?.label || regionCode),
      };
    })
    .filter(Boolean);
}

function isRecentRelease(releaseDate) {
  if (!releaseDate) return false;
  const date = new Date(releaseDate);
  if (Number.isNaN(date.getTime())) return false;
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= -7 && diffDays <= 60;
}

function providerDirectUrl(providerName, title, fallback) {
  const provider = String(providerName || "");
  const match = STREAMING_SEARCH_LINKS.find((entry) => entry.match.test(provider));
  return match ? match.build(title) : fallback;
}

export default function WatchNowButtons({
  providers = null,
  title,
  region = "IN",
  releaseDate = "",
  theatrical = false,
  availabilityStatus = null,
}) {
  const availability = providers || {};
  const flatrate = availability.flatrate || [];
  const rent = availability.rent || [];
  const buy = availability.buy || [];
  const providerRegionLink = availability.link || `https://www.justwatch.com/${region.toLowerCase()}/search?q=${encodeURIComponent(title)}`;

  // Use passed availabilityStatus or calculate it
  // If availabilityStatus is passed, use it directly
  // Otherwise, calculate based on providers and release date
  const hasOTTProviders = flatrate.length > 0;
  const isRecentReleaseDate = isRecentRelease(releaseDate);

  // Determine inTheaters: if explicitly passed as true, or if no OTT and recent release
  const inTheaters = theatrical || (!hasOTTProviders && isRecentReleaseDate);

  const theaterLinks = bookingLinksForRegion(region, title);

  const watchProviders = [...flatrate, ...rent, ...buy];

  const handleClick = (providerName, href) => {
    trackWatchNowClick({
      provider: providerName,
      title,
      destination: href,
    });
  };

  if (!watchProviders.length && !inTheaters) return null;

  return (
    <div className="mt-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        <AppIcon icon={PlayIcon} size={14} />
        {availabilityStatus === "STREAMING" ? "Streaming Now" : availabilityStatus === "IN THEATERS" ? "In Theaters" : "Watch now"}
      </p>

      <div className="flex flex-wrap gap-3">
        {inTheaters ? (
          <>
            {theaterLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => handleClick(link.label, link.href)}
                className="group flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 transition-all hover:border-amber-400/50 hover:bg-amber-500/15"
              >
                <AppIcon icon={Ticket01Icon} size={15} className="text-amber-300" />
                <span className="text-xs font-medium text-white">In theaters</span>
                <span className="text-[11px] text-amber-200/80">{link.label}</span>
              </a>
            ))}
          </>
        ) : null}

        {watchProviders.map((provider) => {
          const href = providerDirectUrl(provider.provider_name, title, providerRegionLink);

          return (
            <a
              key={`${provider.provider_id}-${provider.provider_name}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => handleClick(provider.provider_name, href)}
              className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-3 py-2 transition-all hover:border-white/20 hover:bg-white/15"
            >
              <Image
                src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                alt={provider.provider_name}
                width={100}
                height={100}
                className="h-6 w-6 rounded-lg"
              />
              <span className="text-xs font-medium text-white transition-colors group-hover:text-accent">
                {provider.provider_name}
              </span>
            </a>
          );
        })}

        <a
          href={providerRegionLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleClick("JustWatch", providerRegionLink)}
          className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-neutral-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <AppIcon icon={MapsIcon} size={13} />
          More in your region
          <AppIcon icon={ArrowRight01Icon} size={13} />
        </a>
      </div>
    </div>
  );
}
