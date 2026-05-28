import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Shield, Trash2, Power, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../store/slices/authSlice';
import { toast } from '../components/ui/Toaster';

export default function SettingsPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [processing, setProcessing] = useState(false);

    if (!user) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
                <p className="text-neutral-500">Please sign in to access settings.</p>
            </div>
        );
    }

    const handleDeactivate = async () => {
        setProcessing(true);
        try {
            await axios.post('/api/user/deactivate');
            toast({ type: 'info', message: 'Account deactivated. You can reactivate by logging in again.' });
            dispatch(logoutUser());
            router.push('/');
        } catch (err) {
            toast({ type: 'error', message: err.response?.data?.error || 'Failed to deactivate account.' });
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        setProcessing(true);
        try {
            await axios.delete('/api/user/delete-account');
            toast({ type: 'info', message: 'Account permanently deleted.' });
            dispatch(logoutUser());
            router.push('/');
        } catch (err) {
            toast({ type: 'error', message: err.response?.data?.error || 'Failed to delete account.' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Head>
                <title>Settings — MovieFinder</title>
            </Head>
            <div className="min-h-screen bg-neutral-950 pt-24 pb-16">
                <div className="max-w-2xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                        <p className="text-neutral-500 mb-10">Manage your account preferences</p>

                        {/* Account Info */}
                        <section className="bg-neutral-900 border border-white/10 rounded-2xl p-6 mb-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-neutral-400" />
                                Account
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-neutral-400">Username</span>
                                    <span className="text-white font-medium">@{user.username}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-neutral-400">Email</span>
                                    <span className="text-white font-medium">{user.email}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-neutral-400">Email Verified</span>
                                    <span className={`font-medium ${user.isEmailVerified ? 'text-green-400' : 'text-amber-400'}`}>
                                        {user.isEmailVerified ? '✓ Verified' : '⏳ Pending'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Danger Zone */}
                        <section className="bg-neutral-900 border border-red-500/20 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-red-400 mb-1 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Danger Zone
                            </h2>
                            <p className="text-neutral-500 text-sm mb-6">These actions are serious. Please proceed with caution.</p>

                            {/* Deactivate */}
                            <div className="flex items-start justify-between gap-4 pb-6 mb-6 border-b border-white/5">
                                <div>
                                    <h3 className="text-sm font-semibold text-white mb-1">Deactivate Account</h3>
                                    <p className="text-xs text-neutral-500">
                                        Temporarily disable your account. Your data is preserved and you can reactivate anytime by logging in.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeactivateConfirm(true)}
                                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition-colors"
                                >
                                    <Power className="w-4 h-4" />
                                    Deactivate
                                </button>
                            </div>

                            {/* Deactivate Confirmation */}
                            {showDeactivateConfirm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6"
                                >
                                    <p className="text-sm text-neutral-300 mb-4">
                                        Are you sure you want to deactivate your account? You can come back anytime.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDeactivate}
                                            disabled={processing}
                                            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                                        >
                                            {processing ? 'Processing...' : 'Yes, deactivate'}
                                        </button>
                                        <button
                                            onClick={() => setShowDeactivateConfirm(false)}
                                            className="px-4 py-2 rounded-xl border border-white/10 text-neutral-400 text-sm hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Delete */}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-white mb-1">Delete Account</h3>
                                    <p className="text-xs text-neutral-500">
                                        Permanently delete your account and all associated data. This action cannot be undone.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>

                            {/* Delete Confirmation */}
                            {showDeleteConfirm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mt-6"
                                >
                                    <p className="text-sm text-neutral-300 mb-3">
                                        This will permanently delete your account, messages, takes, and all data. Type <strong className="text-red-400">DELETE</strong> to confirm.
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Type DELETE"
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-red-500 placeholder:text-neutral-600"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDelete}
                                            disabled={processing || deleteConfirmText !== 'DELETE'}
                                            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {processing ? 'Deleting...' : 'Permanently Delete'}
                                        </button>
                                        <button
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                            className="px-4 py-2 rounded-xl border border-white/10 text-neutral-400 text-sm hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </section>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
