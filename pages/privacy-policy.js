import SEOMeta from '../components/SEOMeta';
import Link from 'next/link';

const LAST_UPDATED = 'May 7, 2025';

export default function PrivacyPolicyPage() {
  return (
    <>
      <SEOMeta
        title="Privacy Policy"
        description="Learn how Rushes collects, uses, and protects your personal data. We never sell your data or share it with advertisers."
        url="/privacy-policy"
        keywords={['privacy policy', 'data protection', 'rushes privacy']}
      />

      <main className="min-h-screen bg-neutral-950 text-white pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-neutral-500 text-sm mb-2">Last updated: {LAST_UPDATED}</p>
          <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">1. What We Collect</h2>
              <p className="text-neutral-400 leading-relaxed">When you use Rushes, we may collect:</p>
              <ul className="text-neutral-400 list-disc ml-6 mt-2 space-y-1">
                <li><strong className="text-neutral-300">Account information:</strong> Email address, username, and password (stored as a bcrypt hash)</li>
                <li><strong className="text-neutral-300">Profile information:</strong> Display name, bio, avatar (optional)</li>
                <li><strong className="text-neutral-300">Preferences:</strong> Preferred genres, languages, and regional cinema preferences that you set during onboarding</li>
                <li><strong className="text-neutral-300">Location (optional):</strong> City-level location, only if you explicitly grant permission, used solely for regional recommendations</li>
                <li><strong className="text-neutral-300">Watch history and taste profile:</strong> Movies and series you add to My List, ratings, and Takes you post</li>
                <li><strong className="text-neutral-300">Device information:</strong> Browser type, device type, and IP address (used for security and rate limiting)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">2. How We Use Your Data</h2>
              <p className="text-neutral-400 leading-relaxed">We use your information to:</p>
              <ul className="text-neutral-400 list-disc ml-6 mt-2 space-y-1">
                <li>Provide personalized movie and series recommendations</li>
                <li>Power social features like the social feed, following, and Takes</li>
                <li>Match you with people who share your cinema taste</li>
                <li>Send transactional emails (account verification, password reset)</li>
                <li>Send occasional platform updates and announcements (you can opt out)</li>
                <li>Detect and prevent abuse, fraud, and spam</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">3. What We Don't Do</h2>
              <p className="text-neutral-400 leading-relaxed">We commit to never:</p>
              <ul className="text-neutral-400 list-disc ml-6 mt-2 space-y-1">
                <li>Sell your personal data to any third party</li>
                <li>Share your data with advertisers or ad networks</li>
                <li>Use your data to build advertising profiles</li>
                <li>Access your watch history without your knowledge</li>
                <li>Share your private messages with anyone (they are end-to-end encrypted)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">4. Data Storage & Security</h2>
              <p className="text-neutral-400 leading-relaxed">
                Your account data is stored in MongoDB Atlas (India region). Social features and real-time data are stored in Supabase. All passwords are hashed using bcrypt. Data is transmitted over HTTPS (TLS 1.2+). We use HTTP-only cookies for session management, preventing client-side script access.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">5. Your Rights</h2>
              <p className="text-neutral-400 leading-relaxed">You have the right to:</p>
              <ul className="text-neutral-400 list-disc ml-6 mt-2 space-y-1">
                <li><strong className="text-neutral-300">Delete your account:</strong> You can delete your account at any time from Settings. All your data will be permanently removed within 30 days.</li>
                <li><strong className="text-neutral-300">Export your data:</strong> Contact us at admin@theorbit.in (our only official email) to request a copy of your data</li>
                <li><strong className="text-neutral-300">Opt out of location:</strong> You can revoke location access at any time from your profile settings</li>
                <li><strong className="text-neutral-300">Opt out of emails:</strong> Use the unsubscribe link in any email we send</li>
                <li><strong className="text-neutral-300">Correct your data:</strong> Update your profile information at any time from your account settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">6. Cookies</h2>
              <p className="text-neutral-400 leading-relaxed">
                We use session cookies only — a single HTTP-only cookie to keep you logged in. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. We do not use Google Analytics or Facebook Pixel.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">7. Third-Party Services</h2>
              <p className="text-neutral-400 leading-relaxed">
                Rushes uses The Movie Database (TMDB) API to fetch movie and TV data. We do not share your personal information with TMDB. We may use third-party infrastructure services (MongoDB Atlas, Supabase, Vercel, Upstash) which process data according to their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">8. Children's Privacy</h2>
              <p className="text-neutral-400 leading-relaxed">
                Rushes is not directed at children under 13. If we discover that a child under 13 has provided us with personal information, we will promptly delete that information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">9. Contact</h2>
              <p className="text-neutral-400 leading-relaxed">
                For privacy-related requests, email us at{' '}
                <a href="mailto:admin@theorbit.in" className="text-red-400 hover:underline">admin@theorbit.in</a> (our only official email).
                We aim to respond within 48 hours.
              </p>
            </section>

            <div className="border-t border-white/5 pt-8">
              <p className="text-neutral-600 text-sm">
                See also:{' '}
                <Link href="/terms-and-conditions" className="text-red-400 hover:underline">Terms of Service</Link>
                {' · '}
                <Link href="/contact" className="text-red-400 hover:underline">Contact</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
