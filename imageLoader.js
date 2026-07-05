export default function myImageLoader({ src, width, quality }) {
  if (src.includes('image.tmdb.org') || src.includes('themoviedb.org')) {
    // Strip the protocol to pass to wsrv.nl properly
    const cleanUrl = src.replace(/^https?:\/\//, '');
    return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&q=${quality || 75}&output=webp`;
  }
  return src;
}
