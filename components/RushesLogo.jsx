import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

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
            className="group flex items-center gap-2 no-underline select-none"
        >
            {/* ── Cinematic Badge Icon ── */}
            <motion.div
                className="relative flex-shrink-0"
                style={{ width: 42, height: 42 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
                <svg viewBox="0 0 120 120" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.35))' }}>
                    <defs>
                        {/* Gold metallic gradient for rays */}
                        <radialGradient id="rushes-ray-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.7" />
                            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
                        </radialGradient>

                        {/* Red cinematic gradient */}
                        <linearGradient id="rushes-red" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#991b1b" />
                        </linearGradient>

                        {/* Deep red for bucket */}
                        <linearGradient id="rushes-bucket" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#7f1d1d" />
                        </linearGradient>

                        {/* Gold accent */}
                        <linearGradient id="rushes-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fde68a" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>

                        {/* Film strip gradient */}
                        <linearGradient id="rushes-film" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#374151" />
                            <stop offset="50%" stopColor="#1f2937" />
                            <stop offset="100%" stopColor="#111827" />
                        </linearGradient>

                        {/* Popcorn kernel gradient */}
                        <radialGradient id="rushes-kernel" cx="40%" cy="35%" r="60%">
                            <stop offset="0%" stopColor="#fefce8" />
                            <stop offset="40%" stopColor="#fef08a" />
                            <stop offset="100%" stopColor="#eab308" />
                        </radialGradient>

                        {/* Glow filter */}
                        <filter id="rushes-glow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Shadow filter */}
                        <filter id="rushes-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
                        </filter>

                        {/* Bucket shape clip */}
                        <clipPath id="rushes-bucket-clip">
                            <path d="M 42 60 L 78 60 L 73 96 L 47 96 Z" />
                        </clipPath>
                    </defs>

                    {/* ── Radiating Cinema Rays ── */}
                    <motion.g
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: '60px 60px' }}
                    >
                        {Array.from({ length: 16 }, (_, i) => {
                            const angle = (i * 22.5) * Math.PI / 180;
                            return (
                                <line
                                    key={i}
                                    x1="60" y1="60"
                                    x2={60 + Math.cos(angle) * 55}
                                    y2={60 + Math.sin(angle) * 55}
                                    stroke="url(#rushes-ray-glow)"
                                    strokeWidth={i % 2 === 0 ? "1.5" : "0.8"}
                                    strokeLinecap="round"
                                    opacity={i % 2 === 0 ? 0.6 : 0.3}
                                />
                            );
                        })}
                    </motion.g>

                    {/* ── Outer Ring (Cinema badge border) ── */}
                    <circle cx="60" cy="60" r="52" fill="none" stroke="url(#rushes-gold)" strokeWidth="1.5" opacity="0.25" />
                    <circle cx="60" cy="60" r="49" fill="none" stroke="url(#rushes-gold)" strokeWidth="0.5" opacity="0.15" />

                    {/* ── CLAPPERBOARD ── */}
                    <g filter="url(#rushes-shadow)">
                        {/* Board body — dark charcoal with subtle texture */}
                        <rect x="28" y="42" width="48" height="28" rx="2.5" fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
                        {/* Scene/Take detail lines on board */}
                        <text x="33" y="53" fontSize="5" fill="#dc2626" fontWeight="700" fontFamily="monospace">RUSHES</text>
                        <line x1="33" y1="56" x2="66" y2="56" stroke="#333" strokeWidth="0.4" />
                        <text x="33" y="61" fontSize="3.5" fill="#555" fontFamily="monospace">SCENE</text>
                        <text x="50" y="61" fontSize="3.5" fill="#555" fontFamily="monospace">TAKE</text>
                        <line x1="33" y1="63" x2="66" y2="63" stroke="#333" strokeWidth="0.4" />
                        <text x="33" y="67.5" fontSize="3.5" fill="#555" fontFamily="monospace">DATE</text>

                        {/* Hinge circle */}
                        <circle cx="30" cy="38" r="3" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
                        <circle cx="30" cy="38" r="1.2" fill="#fbbf24" />

                        {/* Bottom clapper bar (static) */}
                        <rect x="28" y="36" width="48" height="6" rx="1" fill="#262626" stroke="#444" strokeWidth="0.5" />
                        {/* Diagonal stripes on static bar */}
                        <g opacity="0.95">
                            <polygon points="32,36 37,36 34,42 29,42" fill="#fefce8" />
                            <polygon points="39,36 44,36 41,42 36,42" fill="#dc2626" />
                            <polygon points="46,36 51,36 48,42 43,42" fill="#fefce8" />
                            <polygon points="53,36 58,36 55,42 50,42" fill="#dc2626" />
                            <polygon points="60,36 65,36 62,42 57,42" fill="#fefce8" />
                            <polygon points="67,36 72,36 69,42 64,42" fill="#dc2626" />
                        </g>

                        {/* Top clapper bar (animated — snaps on hover) */}
                        <motion.g
                            animate={isHovered ? { rotate: 0 } : { rotate: -22 }}
                            transition={{ type: "spring", stiffness: 500, damping: 12, mass: 0.6 }}
                            style={{ transformOrigin: '30px 36px' }}
                        >
                            <rect x="28" y="30" width="48" height="6" rx="1" fill="#1f1f1f" stroke="#444" strokeWidth="0.5" />
                            {/* Diagonal stripes on moving bar */}
                            <g opacity="0.95">
                                <polygon points="32,30 37,30 34,36 29,36" fill="#fefce8" />
                                <polygon points="39,30 44,30 41,36 36,36" fill="#dc2626" />
                                <polygon points="46,30 51,30 48,36 43,36" fill="#fefce8" />
                                <polygon points="53,30 58,30 55,36 50,36" fill="#dc2626" />
                                <polygon points="60,30 65,30 62,36 57,36" fill="#fefce8" />
                                <polygon points="67,30 72,30 69,36 64,36" fill="#dc2626" />
                            </g>
                        </motion.g>
                    </g>

                    {/* ── Film Strip (curling on left side) ── */}
                    <g opacity="0.55">
                        <rect x="14" y="35" width="10" height="40" rx="1" fill="url(#rushes-film)" stroke="#4b5563" strokeWidth="0.5" />
                        {/* Sprocket holes */}
                        {[39, 45, 51, 57, 63, 69].map((y) => (
                            <rect key={y} x="16" y={y} width="6" height="3" rx="0.8" fill="#111" stroke="#374151" strokeWidth="0.3" />
                        ))}
                    </g>

                    {/* ── POPCORN BUCKET (Foreground, overlapping board) ── */}
                    <g filter="url(#rushes-shadow)">
                        {/* Bucket body */}
                        <path d="M 42 60 L 78 60 L 73 96 L 47 96 Z" fill="url(#rushes-bucket)" stroke="#991b1b" strokeWidth="0.8" />
                        {/* White stripes on bucket */}
                        <g clipPath="url(#rushes-bucket-clip)" opacity="0.3">
                            <rect x="48" y="58" width="3.5" height="40" fill="#fef2f2" />
                            <rect x="55" y="58" width="3.5" height="40" fill="#fef2f2" />
                            <rect x="62" y="58" width="3.5" height="40" fill="#fef2f2" />
                            <rect x="69" y="58" width="3.5" height="40" fill="#fef2f2" />
                        </g>
                        {/* Gold band at top of bucket */}
                        <path d="M 42 60 L 78 60 L 77.3 63 L 42.7 63 Z" fill="url(#rushes-gold)" opacity="0.6" />
                        {/* Gold band at bottom */}
                        <path d="M 47.8 93 L 72.2 93 L 73 96 L 47 96 Z" fill="url(#rushes-gold)" opacity="0.4" />
                    </g>

                    {/* ── Popcorn Kernels (overflowing out of bucket) ── */}
                    <g filter="url(#rushes-glow)">
                        {/* Back layer — warm golden */}
                        <path d="M 40 61 C 37 57, 38 50, 44 49 C 47 45, 53 44, 56 48 C 58 44, 64 43, 67 48 C 71 45, 77 50, 76 57 C 79 58, 80 62, 78 62 Z"
                            fill="#fde047" stroke="#a16207" strokeWidth="0.6" />
                        {/* Individual kernel clusters */}
                        <circle cx="48" cy="54" r="5.5" fill="url(#rushes-kernel)" stroke="#a16207" strokeWidth="0.5" />
                        <circle cx="55" cy="51" r="6" fill="url(#rushes-kernel)" stroke="#a16207" strokeWidth="0.5" />
                        <circle cx="63" cy="53" r="5.5" fill="url(#rushes-kernel)" stroke="#a16207" strokeWidth="0.5" />
                        <circle cx="71" cy="54" r="5" fill="url(#rushes-kernel)" stroke="#a16207" strokeWidth="0.5" />
                        <circle cx="44" cy="56" r="4.5" fill="url(#rushes-kernel)" stroke="#a16207" strokeWidth="0.5" />
                        <circle cx="52" cy="48" r="4.5" fill="#fef9c3" stroke="#a16207" strokeWidth="0.4" />
                        <circle cx="60" cy="47" r="5" fill="#fef9c3" stroke="#a16207" strokeWidth="0.4" />
                        <circle cx="67" cy="49" r="4.5" fill="#fef9c3" stroke="#a16207" strokeWidth="0.4" />
                        <circle cx="74" cy="56" r="4" fill="url(#rushes-kernel)" stroke="#a16207" strokeWidth="0.5" />
                        {/* Highlight spots on front kernels */}
                        <circle cx="54" cy="49" r="1.5" fill="#fffbeb" opacity="0.8" />
                        <circle cx="62" cy="51" r="1.2" fill="#fffbeb" opacity="0.7" />
                        <circle cx="48" cy="52" r="1" fill="#fffbeb" opacity="0.7" />
                    </g>

                    {/* ── Flying kernels (animated on hover) ── */}
                    <motion.g
                        animate={isHovered ? { y: -8, opacity: 1 } : { y: 0, opacity: 0.5 }}
                        transition={{ type: "spring", stiffness: 250, damping: 15 }}
                    >
                        <circle cx="36" cy="44" r="3" fill="url(#rushes-kernel)" stroke="#a16207" strokeWidth="0.4" />
                        <circle cx="37" cy="43" r="1" fill="#fffbeb" opacity="0.8" />
                    </motion.g>
                    <motion.g
                        animate={isHovered ? { y: -10, x: 2, opacity: 1 } : { y: 0, x: 0, opacity: 0.4 }}
                        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.04 }}
                    >
                        <circle cx="82" cy="42" r="3.5" fill="url(#rushes-kernel)" stroke="#a16207" strokeWidth="0.4" />
                        <circle cx="83" cy="41" r="1.2" fill="#fffbeb" opacity="0.8" />
                    </motion.g>
                    <motion.g
                        animate={isHovered ? { y: -12, x: -1, opacity: 1, rotate: 15 } : { y: 0, x: 0, opacity: 0.3, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 180, damping: 10, delay: 0.08 }}
                    >
                        <circle cx="56" cy="38" r="2.5" fill="#fef9c3" stroke="#a16207" strokeWidth="0.3" />
                        <circle cx="57" cy="37" r="0.8" fill="#fffbeb" opacity="0.9" />
                    </motion.g>

                    {/* ── Decorative gold stars ── */}
                    <g fill="#fbbf24" opacity="0.7">
                        <polygon points="95,28 96.5,32.5 101,32.5 97.5,35.5 99,40 95,37 91,40 92.5,35.5 89,32.5 93.5,32.5" transform="scale(0.5) translate(115,20)" />
                        <polygon points="95,28 96.5,32.5 101,32.5 97.5,35.5 99,40 95,37 91,40 92.5,35.5 89,32.5 93.5,32.5" transform="scale(0.4) translate(38,12)" />
                    </g>
                </svg>
            </motion.div>

            {/* ── Typography ── */}
            <div className="flex flex-col items-start" style={{ gap: '1px' }}>
                <motion.div className="relative">
                    <h1
                        className="text-[22px] md:text-[26px] font-black tracking-tight uppercase transition-colors duration-300"
                        style={{
                            fontFamily: 'Inter, system-ui, sans-serif',
                            lineHeight: '1',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 40%, #fbbf24 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: 'drop-shadow(0 0 12px rgba(220,38,38,0.5))',
                        }}
                    >
                        Rushes
                    </h1>
                    {/* Animated accent underline */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
                        className="absolute -bottom-[1px] left-0 h-[2px] w-full origin-left"
                        style={{
                            background: 'linear-gradient(90deg, #dc2626, #f59e0b 60%, transparent)',
                        }}
                    />
                </motion.div>
                <span
                    className="text-[7.5px] font-bold uppercase ml-[1px] transition-colors duration-300 group-hover:text-amber-400/80"
                    style={{
                        letterSpacing: '0.2em',
                        color: '#a8a29e',
                    }}
                >
                    Discover & Connect
                </span>
            </div>
        </Link>
    );
}
