import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { formatDistanceToNow } from 'date-fns';
import api from '../../lib/axios';

export default function NotificationBell() {
    const user = useSelector(selectUser);
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!user?.id) return;

        const loadNotifications = async () => {
            try {
                const { data } = await api.get('/api/notifications');
                setNotifications(data.notifications || []);
            } catch (err) {
                console.error("Failed to load notifications:", err);
            }
        };

        loadNotifications();
        
        // Poll every 30 seconds as a fallback for realtime
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [user?.id]);

    const markAllRead = async () => {
        try {
            await api.put('/api/notifications');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error("Failed to mark notifications read:", error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative">
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    setOpen(!open);
                    if (!open) markAllRead();
                }}
                className="relative p-2 rounded-xl hover:bg-white/5 transition-all group"
            >
                <Bell className="w-5 h-5 text-neutral-400 group-hover:text-white" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold text-white shadow-lg"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -8 }}
                        className="absolute top-full right-0 mt-2 w-80 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto"
                    >
                        <div className="p-4 border-b border-white/5 sticky top-0 bg-neutral-900/50 backdrop-blur-sm z-10">
                            <h3 className="font-semibold text-sm text-white flex items-center justify-between">
                                Notifications
                                {unreadCount > 0 && (
                                    <motion.button
                                        onClick={markAllRead}
                                        className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" />
                                        Mark all read
                                    </motion.button>
                                )}
                            </h3>
                        </div>

                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <motion.div
                                    key={notif.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex items-start gap-3 p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-all ${!notif.read ? 'bg-gradient-to-r from-red-500/5 to-transparent border-red-500/20' : ''
                                        }`}
                                >
                                    <img
                                        src={notif.fromAvatar || '/default-avatar.png'}
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-white/20"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white font-medium leading-tight">
                                            {notif.content}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now'}
                                        </p>
                                    </div>
                                    {!notif.read && (
                                        <motion.div
                                            className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 shadow-lg"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                        />
                                    )}
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
