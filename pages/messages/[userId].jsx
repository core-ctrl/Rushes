import { useRouter } from 'next/router';
import ChatWindow from '../../components/chat/ChatWindow';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import axios from 'axios';
import Head from 'next/head';

export default function ChatPage() {
    const router = useRouter();
    const { userId } = router.query;
    const [otherUser, setOtherUser] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const currentUser = useSelector(selectUser);

    useEffect(() => {
        if (!userId || !currentUser) return;

        const fetchUser = async () => {
            try {
                // Use user profile API
                const { data } = await axios.get(`/api/users/${userId}/profile`);
                if (data.user) {
                    setOtherUser(data.user);
                    setShowChat(true);
                } else {
                    router.push('/messages');
                }
            } catch (error) {
                console.error('User fetch error:', error);
                router.push('/messages');
            }
        };

        fetchUser();
    }, [userId, currentUser, router]);

    if (!currentUser || !otherUser) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-white text-center">
                    Loading chat...
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Chat | MovieFinder</title>
            </Head>
            <ChatWindow otherUser={otherUser} onClose={() => router.back()} />
        </>
    );
}
