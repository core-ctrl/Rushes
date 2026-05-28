import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from './ui/Toaster';

const REASONS = [
  'Hate Speech',
  'Nudity / Sexual Content',
  'Piracy / Illegal Content',
  'Copyright Violation',
  'Spam',
  'Harassment',
  'Impersonation',
  'Other',
];

export default function ReportModal({ open, onClose, targetUsername, targetId, targetType = 'user' }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return toast({ type: 'error', message: 'Please select a reason.' });
    if (!description.trim()) return toast({ type: 'error', message: 'Please describe what happened.' });

    setSubmitting(true);
    try {
      await axios.post('/api/report/abuse', {
        targetUsername: targetUsername?.replace('@', ''),
        targetId,
        type: reason,
        description: description.trim(),
        targetType,
      });
      toast({ type: 'success', message: 'Report submitted. We\'ll review it shortly.' });
      setReason('');
      setDescription('');
      onClose();
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.error || 'Failed to submit report.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {targetUsername ? `Report @${targetUsername.replace('@', '')}` : 'Report Content'}
              </h2>
              <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-neutral-400 mb-3">Why are you reporting this?</p>
                <div className="flex flex-col gap-2">
                  {REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                        reason === r
                          ? 'border-accent bg-accent/10 text-white'
                          : 'border-white/8 bg-white/3 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="sr-only"
                      />
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        reason === r ? 'border-accent' : 'border-white/30'
                      }`}>
                        {reason === r && <span className="w-2 h-2 rounded-full bg-accent" />}
                      </span>
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us more about what happened..."
                  rows={3}
                  maxLength={1000}
                  className="w-full bg-white/5 border border-white/8 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent placeholder:text-neutral-600 transition-colors resize-none"
                />
                <p className="text-xs text-neutral-600 mt-1 text-right">{description.length}/1000</p>
              </div>

              <button
                type="submit"
                disabled={submitting || !reason || !description.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Report'
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
