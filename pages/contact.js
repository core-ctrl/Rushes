import { useState } from 'react';
import SEOMeta from '../components/SEOMeta';
import Link from 'next/link';
import axios from 'axios';

const SUBJECTS = [
  'General Enquiry',
  'Bug Report',
  'Feature Request',
  'Partnership',
  'Press',
  'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Enquiry', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/contact', form);
      setSuccess(true);
      setForm({ name: '', email: '', subject: 'General Enquiry', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOMeta
        title="Contact"
        description="Get in touch with the Rushes team. We respond to all messages within 48 hours."
        url="/contact"
        keywords={['contact rushes', 'rushes support', 'movie platform contact']}
      />

      <main className="min-h-screen bg-neutral-950 text-white pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-black mb-2">Contact Us</h1>
          <p className="text-neutral-400 mb-10">
            We typically respond within 48 hours. For urgent issues, see our{' '}
            <Link href="/report-abuse" className="text-red-400 hover:underline">
              Report Abuse
            </Link>{' '}
            page.
          </p>

          {success ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
              <p className="text-4xl mb-4">✅</p>
              <h2 className="text-xl font-bold text-white mb-2">Message sent!</h2>
              <p className="text-neutral-400 text-sm">
                Thanks for reaching out. We'll get back to you within 48 hours.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-6 text-sm text-red-400 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Subject
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  maxLength={3000}
                  placeholder="Tell us what's on your mind..."
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder:text-neutral-600 resize-none"
                />
                <p className="text-right text-xs text-neutral-600 mt-1">{form.message.length}/3000</p>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}

          <div className="mt-10 text-center text-sm text-neutral-600">
            <p>
              You can also email us directly at{' '}
              <a href="mailto:hello@rushes.in" className="text-red-400 hover:underline">
                hello@rushes.in
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
