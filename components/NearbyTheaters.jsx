import { useState, useEffect } from "react";
import { MapPin, Navigation, Film, Clock, ExternalLink } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";

export default function NearbyTheaters() {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationEnabled(true);
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await axios.get(`/api/theaters/nearby?lat=${latitude}&lng=${longitude}`);
          setTheaters(data.theaters || []);
          setError(null);
        } catch (err) {
          setError("Failed to find nearby theaters");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("Location access denied. Displaying default theaters.");
        // Fallback fetch
        axios.get("/api/theaters/nearby").then(({ data }) => {
          setTheaters(data.theaters || []);
          setLoading(false);
        });
      }
    );
  };

  useEffect(() => {
    // Automatically try to fetch without prompt if already granted, otherwise let user click
    navigator.permissions?.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        requestLocation();
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!locationEnabled && theaters.length === 0 && !error) {
    return (
      <div className="my-8 rounded-3xl border border-white/10 bg-neutral-900/50 p-8 text-center backdrop-blur-xl">
        <MapPin className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-2xl font-bold text-white">In Theaters Near You</h2>
        <p className="mb-6 text-neutral-400">Enable location services to see showtimes at your local cinemas.</p>
        <button
          onClick={requestLocation}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white shadow-glow-red transition-colors hover:bg-red-500"
        >
          <Navigation className="h-5 w-5" />
          Find Nearby Theaters
        </button>
      </div>
    );
  }

  return (
    <div className="my-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <MapPin className="h-6 w-6 text-red-500" />
            In Theaters Near You
          </h2>
          {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
        {theaters.map((theater, i) => (
          <motion.div
            key={theater.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[320px] max-w-[360px] snap-center rounded-3xl border border-white/10 bg-neutral-900 p-5 shadow-2xl transition-colors hover:border-white/20"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white line-clamp-1">{theater.name}</h3>
                <p className="text-sm text-neutral-400">{theater.address}</p>
              </div>
              <div className="rounded-lg bg-red-500/10 px-2 py-1 text-xs font-bold text-red-400">
                {theater.distance}
              </div>
            </div>

            <div className="space-y-4">
              {theater.movies.map((movie) => (
                <div key={movie.tmdbId} className="flex gap-3 border-t border-white/5 pt-4">
                  <img
                    src={`https://image.tmdb.org/t/p/w154${movie.poster}`}
                    alt={movie.title}
                    className="h-24 w-16 rounded-lg object-cover shadow-md"
                  />
                  <div className="flex-1">
                    <h4 className="mb-1 font-bold text-white line-clamp-1">{movie.title}</h4>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {movie.formats.map(f => (
                        <span key={f} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">
                          {f}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {movie.showtimes.map(st => (
                        <span key={st} className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[11px] font-medium text-red-300">
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20">
              <ExternalLink className="h-4 w-4" />
              Book Tickets
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
