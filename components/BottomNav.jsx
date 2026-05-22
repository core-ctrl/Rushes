import { Home, Search, Rss, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const tabs = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/social', icon: Rss, label: 'Feed' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
    const router = useRouter();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur-md border-t border-white/5 z-30 md:hidden">
            <div className="flex items-center justify-around py-2">
                {tabs.map(({ href, icon: Icon, label }) => {
                    const active = router.pathname === href || (href !== '/' && router.pathname.startsWith(href));
                    return (
                        <Link key={href} href={href} className="flex flex-col items-center gap-1 px-4 py-2">
                            <Icon className={`w-5 h-5 ${active ? 'text-red-500' : 'text-neutral-500'}`} />
                            <span className={`text-[10px] ${active ? 'text-red-500' : 'text-neutral-600'}`}>{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
