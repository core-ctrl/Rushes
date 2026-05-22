import { useState } from 'react';
import SEOMeta from '../components/SEOMeta';
import Link from 'next/link';
import axios from 'axios';

const REPORT_TYPES = [
  'Harassment or bullying',
  'Hate speech',
  'Spam or fake account',
  'Impersonation',
  'Self-harm or dangerous content',
  'Copyright infringement',
  'Privacy violation',
  'Other',
];

export default function ReportAbusePage() {
  const [form, setForm] = useState({
    reporterEmail: '',
    targetUsername: '',
    type: 'Harassment or bullying',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/report/abuse', form);
      setResult(data.reportId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOMeta
        title="Report Abuse"
        description="Report harmful content or abusive behavior on Rushes. Our team reviews all reports within 24 hours."
        url="/report-abuse"
        keywords={['report abuse', 'rushes safety', 'report user']}
        noindex
      />

      <main className="min-h-screen bg-neutral-950 text-white pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-black mb-2">Report Abuse</h1>
          <p className="text-neutral-400 mb-10">
            Help us keep Rushes safe. All reports are reviewed by our team within 24 hours. False
            reports may result in action against the reporting account.
          </p>

          {result ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
              <p className="text-4xl mb-4">🛡️</p>
              <h2 className="text-xl font-bold text-white mb-2">Report Submitted</h2>
              <p className="text-neutral-400 text-sm mb-4">
                Your report has been submitted successfully. Our team will review it within 24 hours.
              </p>
              <p className="text-xs text-neutral-600 font-mono bg-neutral-900 px-4 py-2 rounded-lg inline-block">
                Report ID: {result}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => { setResult(null); setForm({ reporterEmail: '', targetUsername: '', type: 'Harassment or bullying', description: '' }); }}
                  className="text-sm text-red-400 hover:underline"
                >
                  Submit another report
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Your Email <span className="text-neutral-600">(optional — for follow-up)</span>
                </label>
                <input
                  type="email"
                  name="reporterEmail"
                  value={form.reporterEmail}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Username being reported <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="targetUsername"
                  value={form.targetUsername}
                  onChange={handleChange}
                  required
                  placeholder="@username"
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Report Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  maxLength={2000}
                  placeholder="Please describe the issue in detail. Include links or screenshots if possible."
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 placeholder:text-neutral-600 resize-none"
                />
                <p className="text-right text-xs text-neutral-600 mt-1">{form.description.length}/2000</p>
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
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-neutral-700 mt-8">
            For legal matters, contact{' '}
            <a href="mailto:legal@rushes.in" className="text-neutral-500 hover:text-neutral-300">
              legal@rushes.in
            </a>
            . See our{' '}
            <Link href="/terms-and-conditions" className="text-neutral-500 hover:text-neutral-300">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}
