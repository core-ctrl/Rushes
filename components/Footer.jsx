// components/Footer.jsx
import Link from 'next/link';

const links = {
  Platform: [
    { label: 'Home', href: '/' },
    { label: 'Movies', href: '/movies' },
    { label: 'Series', href: '/series' },
    { label: 'Social Feed', href: '/social' },
    { label: 'My List', href: '/my-list' },
    { label: 'About', href: '/about' },
  ],
  Legal: [
    { label: 'Terms', href: '/terms-and-conditions' },
    { label: 'Privacy', href: '/privacy-policy' },
    { label: 'DMCA', href: '/dmca' },
    { label: 'Report Abuse', href: '/report-abuse' },
    { label: 'Contact', href: '/contact' },
  ],
  Connect: [
    { label: 'Discord Community', href: 'https://discord.gg/vP9FkcKnz8', external: true },
    { label: 'Instagram', href: 'https://instagram.com/rushesapp', external: true },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-16 px-4 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <h3 className="text-red-500 font-black text-2xl mb-1">Rushes</h3>
            <p className="text-neutral-600 text-xs leading-relaxed">Where movie people connect</p>
            <p className="text-neutral-700 text-xs mt-3">Made in India 🇮🇳</p>
          </div>
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="font-bold text-sm text-neutral-300 mb-4">{section}</h4>
              <div className="space-y-2.5">
                {items.map((item) =>
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-neutral-600 hover:text-white text-sm transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block text-neutral-600 hover:text-white text-sm transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-neutral-700 text-xs">
            © {new Date().getFullYear()} Rushes · Where movie people connect
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                alt="TMDB"
                className="h-3 opacity-30 hover:opacity-60 transition-opacity"
              />
            </a>
            <p className="text-neutral-800 text-xs">Not affiliated with any streaming platform</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
