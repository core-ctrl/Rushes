import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const RUSHES_LOGO_URL = 'https://res.cloudinary.com/dkrvtfbor/image/upload/e_make_transparent/v1782761174/RUSHES_uupcnx.png';

export default function RushesLogo() {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const handleClick = (e) => {
        if (router.pathname === '/') {
            e.preventDefault();
        }
    };

    return (
        <Link
            href="/"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group flex items-center no-underline select-none"
        >
            <motion.div
                className="relative flex-shrink-0 flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
                <img
                    src={RUSHES_LOGO_URL}
                    alt="Rushes"
                    className="w-auto object-contain"
                    style={{
                        height: '120px',
                        maxHeight: '120px',
                        filter: isHovered
                            ? 'drop-shadow(0 0 16px rgba(220,38,38,0.6))'
                            : 'drop-shadow(0 0 8px rgba(220,38,38,0.3))',
                        transition: 'filter 0.3s ease',
                    }}
                />
            </motion.div>
        </Link>
    );
}
