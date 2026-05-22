import SEOMeta from '../components/SEOMeta';
import Link from 'next/link';

const LAST_UPDATED = 'May 7, 2025';

export default function TermsPage() {
  return (
    <>
      <SEOMeta
        title="Terms of Service"
        description="Read Rushes' Terms of Service. By using Rushes, you agree to these terms governing content ownership, prohibited uses, and platform rules."
        url="/terms-and-conditions"
        keywords={['terms of service', 'rushes terms', 'user agreement']}
      />

      <main className="min-h-screen bg-neutral-950 text-white pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-neutral-500 text-sm mb-2">Last updated: {LAST_UPDATED}</p>
          <h1 className="text-4xl font-black mb-8">Terms of Service</h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-neutral-400 leading-relaxed">
                By accessing or using Rushes ("the Platform", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">2. Content Ownership — Your Takes Are Yours</h2>
              <p className="text-neutral-400 leading-relaxed">
                You retain full ownership of all content you create on Rushes, including your Takes, reviews, comments, and profile information. By posting content, you grant Rushes a non-exclusive, royalty-free, worldwide license to display, distribute, and promote your content within the platform. We will never sell or license your original content to third parties without your explicit consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">3. Zero-Tolerance Piracy Policy</h2>
              <p className="text-neutral-400 leading-relaxed">
                Rushes has a strict zero-tolerance policy toward piracy and copyright infringement. You may not:
              </p>
              <ul className="text-neutral-400 list-disc ml-6 mt-2 space-y-1">
                <li>Share, post, or link to unauthorized streams, torrents, or pirated copies of movies or series</li>
                <li>Distribute copyrighted content without the rights holder's permission</li>
                <li>Use Rushes to facilitate or encourage copyright infringement in any form</li>
              </ul>
              <p className="text-neutral-400 mt-3 leading-relaxed">
                Violations will result in immediate account termination and may be reported to the appropriate rights holders. Rushes uses the TMDB API for movie data and does not host any streaming content itself.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">4. Community Standards</h2>
              <p className="text-neutral-400 leading-relaxed">You agree not to:</p>
              <ul className="text-neutral-400 list-disc ml-6 mt-2 space-y-1">
                <li>Post hateful, discriminatory, or harassing content</li>
                <li>Impersonate any person or entity</li>
                <li>Share personal information of others without consent</li>
                <li>Spam or engage in coordinated inauthentic behavior</li>
                <li>Attempt to hack, scrape, or disrupt the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">5. Age Requirement</h2>
              <p className="text-neutral-400 leading-relaxed">
                You must be at least 13 years of age to use Rushes. If you are under 18, you represent that you have your parent or guardian's permission to use the platform. By using Rushes, you warrant that you meet this age requirement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">6. Account Termination</h2>
              <p className="text-neutral-400 leading-relaxed">
                Rushes reserves the right to suspend or permanently terminate any account, at our sole discretion, for violations of these terms, abusive behavior, or for any other reason that we deem appropriate. We will make reasonable efforts to notify you via email before termination, except in cases of severe or repeated violations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">7. No Warranty Disclaimer</h2>
              <p className="text-neutral-400 leading-relaxed">
                Rushes is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free of viruses. Your use of the platform is at your sole risk. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">8. TMDB Attribution</h2>
              <p className="text-neutral-400 leading-relaxed">
                This product uses the TMDB API but is not endorsed or certified by TMDB. All movie and TV series data, images, and related metadata are sourced from The Movie Database (TMDB). Rushes does not claim ownership of this data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">9. Jurisdiction and Governing Law</h2>
              <p className="text-neutral-400 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in Telangana, India. By using Rushes, you consent to the jurisdiction of such courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-3">10. Changes to Terms</h2>
              <p className="text-neutral-400 leading-relaxed">
                We may update these Terms from time to time. When we do, we will update the "Last updated" date at the top. Continued use of the platform after changes constitutes your acceptance of the new terms. For material changes, we will provide notice via email to registered users.
              </p>
            </section>

            <div className="border-t border-white/5 pt-8">
              <p className="text-neutral-600 text-sm">
                Questions? See our{' '}
                <Link href="/privacy-policy" className="text-red-400 hover:underline">Privacy Policy</Link>
                {' '}or{' '}
                <Link href="/contact" className="text-red-400 hover:underline">Contact Us</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
