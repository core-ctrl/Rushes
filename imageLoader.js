export default function myImageLoader({ src }) {
  if (src.includes('image.tmdb.org') || src.includes('themoviedb.org')) {
    try {
      const path = src.split('/t/p/')[1];
      if (path) {
        return `/tmdb-proxy/${path}`;
      }
    } catch (e) {
      return src;
    }
  }
  return src;
}
