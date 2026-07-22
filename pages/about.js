import SEOMeta from '../components/SEOMeta';
import Link from 'next/link';
import CreatorsSection from '../components/about/CreatorsSection';

export default function AboutPage() {
  return (
    <>
      <SEOMeta
        title="About"
        description="Rushes is a social movie platform built for Indian cinema lovers. Discover, discuss, and share movies with people who feel cinema like you do."
        url="/about"
        keywords={['about rushes', 'movie social platform', 'indian cinema app']}
      />

      <main className="min-h-screen bg-neutral-950 text-white pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="mb-16 text-center">
            <h1 className="flex justify-center mb-4">
              <img src="/logo.png" alt="Rushes" className="w-48 h-48 md:w-72 md:h-72 object-contain drop-shadow-2xl hover:scale-105 transition-transform" />
            </h1>
            <p className="text-2xl text-neutral-300 font-medium">Where movie people connect</p>
            <p className="text-neutral-500 mt-4 max-w-xl mx-auto leading-relaxed">
              A social platform built for people who feel cinema — not just watch it.
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-neutral-400 leading-relaxed">
                Rushes was built for the movie fan who argues about climaxes at midnight, who discovers hidden gems from around the world, who knows the difference between a good movie and a movie that moved them. We exist to connect those people.
              </p>
              <p className="text-neutral-400 leading-relaxed mt-4">
                We're passionate about cinema in all its forms — from massive blockbusters to independent art house films. Because at the end of the day, a great movie is a great movie, no matter where it's from. We're here to celebrate every kind of story.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">What You Can Do on Rushes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { emoji: '🎬', title: 'Discover Movies & Series', desc: 'Personalized picks based on your taste, region, and watch history' },
                  { emoji: '🗣️', title: 'Share Takes', desc: 'Post hot takes on movies you love (or hate) and get reactions' },
                  { emoji: '🤝', title: 'Find Your People', desc: 'Follow users with similar taste, build your movie tribe' },
                  { emoji: '📋', title: 'My List', desc: 'Save movies and series to watch later, synced across devices' },
                  { emoji: '🎥', title: 'Watch Trailers', desc: 'Watch trailers directly in the app without leaving' },
                  { emoji: '🔍', title: 'Smart Search', desc: 'Find any movie, series, or actor instantly' },
                ].map((item) => (
                  <div key={item.title} className="bg-neutral-900 border border-white/5 rounded-2xl p-5">
                    <p className="text-2xl mb-2">{item.emoji}</p>
                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-neutral-500 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Built in India 🇮🇳</h2>
              <p className="text-neutral-400 leading-relaxed">
                Rushes was built by a college student from India, frustrated by the lack of dedicated social discovery tools for genuine movie fans. It's a passion project, designed from scratch with an absolute love for cinema. Everything from the recommendation engine to the social features was built to serve the global movie community.
              </p>
              <p className="text-neutral-400 leading-relaxed mt-4">
                We're a small, independent team — not backed by a streaming platform, not trying to sell you subscriptions. Just building a place for movie people.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Powered by TMDB</h2>
              <p className="text-neutral-400 leading-relaxed">
                All movie and TV data on Rushes is sourced from{' '}
                <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                  The Movie Database (TMDB)
                </a>
                . This product uses the TMDB API but is not endorsed or certified by TMDB. We are deeply grateful for the work of the TMDB community in building one of the most comprehensive open movie databases in the world.
              </p>
              <div className="mt-4">
                <img
                  src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                  alt="The Movie Database"
                  className="h-5 opacity-50"
                />
              </div>
            </section>

            {/* The brand new Creators Section embedded right here! */}
            <CreatorsSection />

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
              <p className="text-neutral-400 leading-relaxed">
                Have feedback, found a bug, or just want to talk movies? We'd love to hear from you.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="mailto:admin@theorbit.in"
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Contact Us (admin@theorbit.in - our only official email)
                </a>
                <a
                  href="https://discord.gg/vP9FkcKnz8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                  Join Discord
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
