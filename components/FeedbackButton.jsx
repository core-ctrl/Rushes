// components/FeedbackButton.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

const TYPES = [
  { id: 'bug', emoji: '🐛', label: 'Bug' },
  { id: 'idea', emoji: '💡', label: 'Idea' },
  { id: 'other', emoji: '💬', label: 'Other' },
];

export default function FeedbackButton() {
  const user = useSelector(selectUser);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/feedback', {
        type,
        message: message.trim(),
        userId: user?.id || user?._id || null,
      });
      setSuccess(true);
      setMessage('');
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-4 z-[200] flex flex-col items-start gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-72 bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-2xl"
          >
            {success ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-white font-bold text-sm">Thanks for the feedback!</p>
                <p className="text-neutral-500 text-xs mt-1">We read every message.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white text-sm font-bold">Send Feedback</p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-neutral-500 hover:text-white text-lg leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Type selector */}
                <div className="flex gap-2 mb-3">
                  {TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-colors border ${
                        type === t.id
                          ? 'bg-red-600/20 border-red-500/40 text-white'
                          : 'bg-neutral-800 border-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === 'bug'
                      ? 'Describe the bug...'
                      : type === 'idea'
                      ? 'Share your idea...'
                      : 'What\'s on your mind?'
                  }
                  rows={3}
                  maxLength={1000}
                  required
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:border-red-500 placeholder:text-neutral-600 mb-3"
                />

                {error && (
                  <p className="text-red-400 text-xs mb-3">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  {loading ? 'Sending…' : 'Send Feedback'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold shadow-lg transition-all border ${
          open
            ? 'bg-neutral-800 border-white/10 text-neutral-300'
            : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800'
        }`}
        aria-label="Send feedback"
      >
        <span>💬</span>
        <span>Feedback</span>
      </motion.button>
    </div>
  );
}
