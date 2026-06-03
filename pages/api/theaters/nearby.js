import axios from "axios";

// Haversine distance calculation in miles
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1) + ' mi';
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lat, lng } = req.query;

  const nowPlaying = [
    { tmdbId: 533535, title: "Deadpool & Wolverine", poster: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" },
    { tmdbId: 1022789, title: "Inside Out 2", poster: "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg" },
    { tmdbId: 1160018, title: "Kill", poster: "/okVLmXL5y18df0ZqCweDOQ2rwe4.jpg" },
    { tmdbId: 748783, title: "The Garfield Movie", poster: "/p6AbOJvMQhBmffd0PIv0u8ghWeY.jpg" },
  ];

  const defaultMovies = [
    [
      { ...nowPlaying[0], formats: ["IMAX", "3D", "Standard"], showtimes: ["10:30 AM", "1:15 PM", "4:45 PM", "8:30 PM", "11:00 PM"] },
      { ...nowPlaying[1], formats: ["Standard", "RealD 3D"], showtimes: ["9:00 AM", "11:30 AM", "2:00 PM", "6:15 PM"] }
    ],
    [
      { ...nowPlaying[0], formats: ["Standard", "4DX"], showtimes: ["11:00 AM", "2:30 PM", "7:00 PM", "10:15 PM"] },
      { ...nowPlaying[2], formats: ["Standard"], showtimes: ["12:15 PM", "3:45 PM", "9:30 PM"] },
      { ...nowPlaying[3], formats: ["Standard"], showtimes: ["10:00 AM", "12:30 PM", "3:00 PM"] }
    ],
    [
      { ...nowPlaying[1], formats: ["Standard", "Dine-In"], showtimes: ["1:00 PM", "4:30 PM", "8:00 PM"] },
      { ...nowPlaying[2], formats: ["Standard"], showtimes: ["7:30 PM", "10:45 PM"] }
    ]
  ];

  let theaters = [];

  // If we have coordinates and a SearchAPI key, dynamically fetch REAL local theaters
  if (lat && lng && process.env.SEARCHAPI_KEY) {
    try {
      const response = await axios.get(`https://www.searchapi.io/api/v1/search`, {
        params: {
          engine: 'google_maps',
          q: 'movie theater',
          ll: `@${lat},${lng},14z`,
          api_key: process.env.SEARCHAPI_KEY
        }
      });

      const localResults = response.data.local_results || [];
      
      // Map Google Maps results to our UI structure, injecting mock showtimes
      theaters = localResults.slice(0, 5).map((place, index) => {
        let distance = "Unknown";
        if (place.gps_coordinates) {
          distance = getDistance(
            parseFloat(lat), 
            parseFloat(lng), 
            place.gps_coordinates.latitude, 
            place.gps_coordinates.longitude
          );
        }

        return {
          id: place.place_id || \`th_\${index}\`,
          name: place.title,
          distance: distance,
          address: place.address || "Local Theater",
          movies: defaultMovies[index % defaultMovies.length]
        };
      });

      // Sort by distance if possible
      theaters.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    } catch (err) {
      console.error("SearchAPI Error:", err?.response?.data || err.message);
    }
  }

  // Fallback to mock theaters if API fails or is missing
  if (theaters.length === 0) {
    theaters = [
      {
        id: "th_1", name: "AMC Empire 25", distance: "1.2 mi", address: "234 W 42nd St",
        movies: defaultMovies[0]
      },
      {
        id: "th_2", name: "Regal Union Square", distance: "2.8 mi", address: "850 Broadway",
        movies: defaultMovies[1]
      },
      {
        id: "th_3", name: "Alamo Drafthouse", distance: "4.5 mi", address: "28 Liberty St",
        movies: defaultMovies[2]
      }
    ];

    if (lat && lng) {
      const salt = (Math.abs(parseFloat(lat)) + Math.abs(parseFloat(lng))) % 5;
      theaters.forEach(t => {
        const baseDist = parseFloat(t.distance);
        t.distance = (baseDist + salt).toFixed(1) + " mi";
      });
    }
  }

  return res.status(200).json({ theaters });
}
