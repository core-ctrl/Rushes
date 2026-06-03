export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Expect lat/lng to be passed, but since it's mock data we just return a static list
  // scaled/offset slightly by the lat/lng hash to make it look dynamic
  const { lat, lng } = req.query;

  // Mock currently popular TMDB movies (these are hardcoded to showcase the UI)
  // In a real app, you'd fetch from TMDB 'now_playing' and map to local showtimes.
  const nowPlaying = [
    { tmdbId: 533535, title: "Deadpool & Wolverine", poster: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" },
    { tmdbId: 1022789, title: "Inside Out 2", poster: "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg" },
    { tmdbId: 1160018, title: "Kill", poster: "/okVLmXL5y18df0ZqCweDOQ2rwe4.jpg" },
    { tmdbId: 748783, title: "The Garfield Movie", poster: "/p6AbOJvMQhBmffd0PIv0u8ghWeY.jpg" },
  ];

  const theaters = [
    {
      id: "th_1",
      name: "AMC Empire 25",
      distance: "1.2 mi",
      chain: "AMC",
      address: "234 W 42nd St",
      movies: [
        {
          ...nowPlaying[0],
          formats: ["IMAX", "3D", "Standard"],
          showtimes: ["10:30 AM", "1:15 PM", "4:45 PM", "8:30 PM", "11:00 PM"]
        },
        {
          ...nowPlaying[1],
          formats: ["Standard", "RealD 3D"],
          showtimes: ["9:00 AM", "11:30 AM", "2:00 PM", "6:15 PM"]
        }
      ]
    },
    {
      id: "th_2",
      name: "Regal Union Square",
      distance: "2.8 mi",
      chain: "Regal",
      address: "850 Broadway",
      movies: [
        {
          ...nowPlaying[0],
          formats: ["Standard", "4DX"],
          showtimes: ["11:00 AM", "2:30 PM", "7:00 PM", "10:15 PM"]
        },
        {
          ...nowPlaying[2],
          formats: ["Standard"],
          showtimes: ["12:15 PM", "3:45 PM", "9:30 PM"]
        },
        {
          ...nowPlaying[3],
          formats: ["Standard"],
          showtimes: ["10:00 AM", "12:30 PM", "3:00 PM"]
        }
      ]
    },
    {
      id: "th_3",
      name: "Alamo Drafthouse",
      distance: "4.5 mi",
      chain: "Alamo",
      address: "28 Liberty St",
      movies: [
        {
          ...nowPlaying[1],
          formats: ["Standard", "Dine-In"],
          showtimes: ["1:00 PM", "4:30 PM", "8:00 PM"]
        },
        {
          ...nowPlaying[2],
          formats: ["Standard"],
          showtimes: ["7:30 PM", "10:45 PM"]
        }
      ]
    }
  ];

  // Randomize distances slightly based on coordinates to fake localization
  if (lat && lng) {
    const salt = (Math.abs(parseFloat(lat)) + Math.abs(parseFloat(lng))) % 5;
    theaters.forEach(t => {
      const baseDist = parseFloat(t.distance);
      t.distance = (baseDist + salt).toFixed(1) + " mi";
    });
  }

  return res.status(200).json({ theaters });
}
