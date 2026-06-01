// components/FeedbackButton.jsx
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-feedback', handleOpen);
    return () => window.removeEventListener('open-feedback', handleOpen);
  }, []);

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
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-2xl p-5 shadow-2xl"
          >
            {success ? (
              <div className="text-center py-6">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-white font-bold text-lg">Thanks for the feedback!</p>
                <p className="text-neutral-500 text-sm mt-1">We read every message.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white text-lg font-bold">Send Feedback</p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-neutral-500 hover:text-white text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Type selector */}
                <div className="flex gap-2 mb-4">
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
                      <span className="text-xl">{t.emoji}</span>
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
                  rows={4}
                  maxLength={1000}
                  required
                  className="w-full bg-neutral-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-red-500 placeholder:text-neutral-600 mb-4"
                />

                {error && (
                  <p className="text-red-400 text-xs mb-4">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-bold py-3 rounded-xl transition-colors"
                >
                  {loading ? 'Sending…' : 'Send Feedback'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
