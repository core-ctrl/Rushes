import { motion } from 'framer-motion';
import Link from 'next/link';

export default function RushesLogo() {
    return (
        <Link href="/" className="group flex flex-col items-start gap-0.5 no-underline">
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
            >
                <h1
                    className="text-3xl font-black tracking-tighter text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] uppercase"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    Rushes
                </h1>
                {/* Decorative underline */}
                <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
                    className="absolute -bottom-1 left-0 h-[3px] w-full bg-gradient-to-r from-red-600 to-transparent origin-left"
                />
            </motion.div>
            <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-[9px] font-bold tracking-[0.2em] text-neutral-400 uppercase ml-0.5"
            >
                Discover & Connect
            </motion.span>
        </Link>
    );
}
