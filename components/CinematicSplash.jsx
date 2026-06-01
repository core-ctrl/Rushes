import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CinematicSplash — A full-screen cinematic loading intro.
 *
 * Sequence:
 *  0.0s  – Film grain + projector flicker
 *  0.3s  – Countdown numbers (3, 2, 1) with film leader marks
 *  2.4s  – Clapperboard snaps shut
 *  3.0s  – Projector beam expands, RUSHES logo fades in
 *  4.0s  – Curtains part to reveal content
 *  4.8s  – Entire overlay fades out
 */
export default function CinematicSplash({ onComplete, minDuration = 4200 }) {
    const [phase, setPhase] = useState('countdown'); // countdown → clapper → logo → curtains → done
    const [countNum, setCountNum] = useState(3);
    const [done, setDone] = useState(false);

    useEffect(() => {
        // Countdown: 3 → 2 → 1
        const t1 = setTimeout(() => setCountNum(2), 700);
        const t2 = setTimeout(() => setCountNum(1), 1400);
        const t3 = setTimeout(() => setPhase('clapper'), 2100);
        const t4 = setTimeout(() => setPhase('logo'), 2800);
        const t5 = setTimeout(() => setPhase('curtains'), 3800);
        const t6 = setTimeout(() => {
            setDone(true);
            onComplete?.();
        }, minDuration);

        return () => {
            [t1, t2, t3, t4, t5, t6].forEach(clearTimeout);
        };
    }, []);

    if (done) return null;

    return (
        <AnimatePresence>
            {!done && (
                <motion.div
                    key="cinematic-splash"
                    className="fixed inset-0 z-[9999] bg-black overflow-hidden"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                    {/* ── Film grain overlay ── */}
                    <div
                        className="absolute inset-0 z-50 pointer-events-none opacity-[0.04]"
                        style={{
                            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='1'/></svg>\")",
                            mixBlendMode: 'overlay',
                        }}
                    />

                    {/* ── Projector flicker ── */}
                    <motion.div
                        className="absolute inset-0 z-40 pointer-events-none bg-amber-100"
                        animate={{ opacity: [0, 0.03, 0, 0.02, 0, 0.04, 0] }}
                        transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* ── Vignette ── */}
                    <div
                        className="absolute inset-0 z-30 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
                        }}
                    />

                    {/* ═══════════════════════════════════════════
                         PHASE: COUNTDOWN (3, 2, 1)
                    ═══════════════════════════════════════════ */}
                    <AnimatePresence mode="wait">
                        {phase === 'countdown' && (
                            <motion.div
                                key={`count-${countNum}`}
                                className="absolute inset-0 z-20 flex items-center justify-center"
                                initial={{ opacity: 0, scale: 1.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                            >
                                {/* Film leader circle */}
                                <svg viewBox="0 0 200 200" className="absolute w-48 h-48 md:w-64 md:h-64">
                                    {/* Outer ring */}
                                    <circle cx="100" cy="100" r="90" fill="none" stroke="#555" strokeWidth="2" />
                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#444" strokeWidth="1" />
                                    {/* Cross hairs */}
                                    <line x1="100" y1="10" x2="100" y2="190" stroke="#444" strokeWidth="0.8" />
                                    <line x1="10" y1="100" x2="190" y2="100" stroke="#444" strokeWidth="0.8" />
                                    {/* Diagonal lines */}
                                    <line x1="25" y1="25" x2="175" y2="175" stroke="#333" strokeWidth="0.5" />
                                    <line x1="175" y1="25" x2="25" y2="175" stroke="#333" strokeWidth="0.5" />
                                    {/* Countdown arc */}
                                    <motion.circle
                                        cx="100" cy="100" r="85"
                                        fill="none"
                                        stroke="#dc2626"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray="534"
                                        initial={{ strokeDashoffset: 0 }}
                                        animate={{ strokeDashoffset: 534 }}
                                        transition={{ duration: 0.65, ease: 'linear' }}
                                    />
                                </svg>

                                {/* Number */}
                                <motion.span
                                    className="relative text-8xl md:text-9xl font-black tabular-nums"
                                    style={{
                                        fontFamily: 'Inter, system-ui, monospace',
                                        color: '#e5e5e5',
                                        textShadow: '0 0 40px rgba(220,38,38,0.4)',
                                    }}
                                    initial={{ opacity: 0, scale: 2 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {countNum}
                                </motion.span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══════════════════════════════════════════
                         PHASE: CLAPPERBOARD SNAP
                    ═══════════════════════════════════════════ */}
                    <AnimatePresence>
                        {phase === 'clapper' && (
                            <motion.div
                                key="clapper"
                                className="absolute inset-0 z-20 flex items-center justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    <svg viewBox="0 0 200 160" className="w-52 h-40 md:w-72 md:h-56">
                                        <defs>
                                            <linearGradient id="splash-board-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#262626" />
                                                <stop offset="100%" stopColor="#171717" />
                                            </linearGradient>
                                        </defs>

                                        {/* Board body */}
                                        <rect x="20" y="65" width="160" height="80" rx="4" fill="url(#splash-board-grad)" stroke="#404040" strokeWidth="1.5" />
                                        {/* Text on board */}
                                        <text x="35" y="92" fontSize="12" fill="#dc2626" fontWeight="800" fontFamily="Inter, sans-serif">RUSHES</text>
                                        <text x="110" y="92" fontSize="8" fill="#666" fontFamily="monospace">PROD. 001</text>
                                        <line x1="35" y1="98" x2="165" y2="98" stroke="#333" strokeWidth="0.5" />
                                        <text x="35" y="112" fontSize="7" fill="#555" fontFamily="monospace">SCENE 01</text>
                                        <text x="95" y="112" fontSize="7" fill="#555" fontFamily="monospace">TAKE 01</text>
                                        <text x="140" y="112" fontSize="7" fill="#555" fontFamily="monospace">DAY</text>
                                        <line x1="35" y1="118" x2="165" y2="118" stroke="#333" strokeWidth="0.5" />
                                        <text x="35" y="132" fontSize="7" fill="#555" fontFamily="monospace">DIRECTOR</text>
                                        <text x="95" y="132" fontSize="7" fill="#555" fontFamily="monospace">CAMERA</text>

                                        {/* Hinge */}
                                        <circle cx="24" cy="56" r="5" fill="#dc2626" />
                                        <circle cx="24" cy="56" r="2" fill="#fbbf24" />

                                        {/* Static bottom bar */}
                                        <rect x="20" y="55" width="160" height="10" rx="2" fill="#1f1f1f" stroke="#404040" strokeWidth="0.8" />
                                        {/* Stripes on static bar */}
                                        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                                            <polygon
                                                key={`sb-${i}`}
                                                points={`${28 + i * 20},55 ${38 + i * 20},55 ${35 + i * 20},65 ${25 + i * 20},65`}
                                                fill={i % 2 === 0 ? '#fefce8' : '#dc2626'}
                                                opacity="0.9"
                                            />
                                        ))}

                                        {/* Animated top bar — snaps down */}
                                        <motion.g
                                            initial={{ rotate: -35 }}
                                            animate={{ rotate: 0 }}
                                            transition={{ delay: 0.15, type: 'spring', stiffness: 800, damping: 12, mass: 0.4 }}
                                            style={{ transformOrigin: '24px 55px' }}
                                        >
                                            <rect x="20" y="45" width="160" height="10" rx="2" fill="#262626" stroke="#404040" strokeWidth="0.8" />
                                            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                                                <polygon
                                                    key={`st-${i}`}
                                                    points={`${28 + i * 20},45 ${38 + i * 20},45 ${35 + i * 20},55 ${25 + i * 20},55`}
                                                    fill={i % 2 === 0 ? '#fefce8' : '#dc2626'}
                                                    opacity="0.9"
                                                />
                                            ))}
                                        </motion.g>
                                    </svg>
                                </motion.div>

                                {/* Flash effect when clapper snaps */}
                                <motion.div
                                    className="absolute inset-0 bg-white pointer-events-none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 0.6, 0] }}
                                    transition={{ delay: 0.2, duration: 0.25 }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══════════════════════════════════════════
                         PHASE: LOGO REVEAL
                    ═══════════════════════════════════════════ */}
                    <AnimatePresence>
                        {(phase === 'logo' || phase === 'curtains') && (
                            <motion.div
                                key="logo-reveal"
                                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Projector beam */}
                                <motion.div
                                    className="absolute pointer-events-none"
                                    style={{
                                        width: '300px',
                                        height: '300px',
                                        background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.12) 0%, rgba(220,38,38,0.05) 40%, transparent 70%)',
                                        borderRadius: '50%',
                                    }}
                                    initial={{ scale: 0.3, opacity: 0 }}
                                    animate={{ scale: 1.8, opacity: 1 }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                />

                                {/* Film reel decorations */}
                                <motion.div
                                    className="absolute"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.15 }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                >
                                    <svg viewBox="0 0 400 400" className="w-80 h-80 md:w-[500px] md:h-[500px]">
                                        {/* Rotating film reel */}
                                        <motion.g
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                            style={{ transformOrigin: '200px 200px' }}
                                        >
                                            <circle cx="200" cy="200" r="160" fill="none" stroke="#dc2626" strokeWidth="0.5" />
                                            <circle cx="200" cy="200" r="140" fill="none" stroke="#fbbf24" strokeWidth="0.3" />
                                            {/* Reel spokes */}
                                            {Array.from({ length: 8 }, (_, i) => {
                                                const angle = (i * 45) * Math.PI / 180;
                                                return (
                                                    <line
                                                        key={i}
                                                        x1="200" y1="200"
                                                        x2={200 + Math.cos(angle) * 155}
                                                        y2={200 + Math.sin(angle) * 155}
                                                        stroke="#dc2626"
                                                        strokeWidth="0.3"
                                                    />
                                                );
                                            })}
                                            {/* Sprocket holes around edge */}
                                            {Array.from({ length: 24 }, (_, i) => {
                                                const angle = (i * 15) * Math.PI / 180;
                                                return (
                                                    <circle
                                                        key={i}
                                                        cx={200 + Math.cos(angle) * 150}
                                                        cy={200 + Math.sin(angle) * 150}
                                                        r="4"
                                                        fill="none"
                                                        stroke="#444"
                                                        strokeWidth="0.5"
                                                    />
                                                );
                                            })}
                                        </motion.g>
                                    </svg>
                                </motion.div>

                                {/* RUSHES Logo */}
                                <motion.h1
                                    className="relative z-10 text-5xl md:text-7xl font-black uppercase tracking-tight"
                                    style={{
                                        fontFamily: 'Inter, system-ui, sans-serif',
                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 40%, #fbbf24 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        filter: 'drop-shadow(0 0 30px rgba(220,38,38,0.6))',
                                    }}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.8, type: 'spring', stiffness: 200 }}
                                >
                                    Rushes
                                </motion.h1>

                                {/* Tagline */}
                                <motion.p
                                    className="relative z-10 text-xs md:text-sm font-bold uppercase tracking-[0.3em]"
                                    style={{ color: '#a8a29e' }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                >
                                    Discover & Connect
                                </motion.p>

                                {/* Decorative underline */}
                                <motion.div
                                    className="relative z-10 h-[2px] rounded-full"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent, #dc2626, #f59e0b, #dc2626, transparent)',
                                    }}
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 180, opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                                />

                                {/* Loading dots */}
                                <motion.div
                                    className="relative z-10 flex items-center gap-1.5 mt-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full bg-red-500"
                                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══════════════════════════════════════════
                         PHASE: CURTAINS PART
                    ═══════════════════════════════════════════ */}
                    <AnimatePresence>
                        {phase === 'curtains' && (
                            <>
                                {/* Left curtain */}
                                <motion.div
                                    key="curtain-left"
                                    className="absolute top-0 left-0 h-full z-[60]"
                                    style={{
                                        width: '55%',
                                        background: 'linear-gradient(90deg, #1a0505 0%, #3b0a0a 40%, #5c1010 80%, #7c1515 100%)',
                                        boxShadow: 'inset -20px 0 60px rgba(0,0,0,0.6)',
                                    }}
                                    initial={{ x: 0 }}
                                    animate={{ x: '-100%' }}
                                    transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
                                >
                                    {/* Curtain fabric folds */}
                                    <div className="absolute inset-0 opacity-30"
                                        style={{
                                            background: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.3) 30px, rgba(0,0,0,0.3) 32px, transparent 32px, transparent 60px)',
                                        }}
                                    />
                                    {/* Gold trim */}
                                    <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-amber-600 via-yellow-500 to-amber-700 opacity-40" />
                                </motion.div>

                                {/* Right curtain */}
                                <motion.div
                                    key="curtain-right"
                                    className="absolute top-0 right-0 h-full z-[60]"
                                    style={{
                                        width: '55%',
                                        background: 'linear-gradient(-90deg, #1a0505 0%, #3b0a0a 40%, #5c1010 80%, #7c1515 100%)',
                                        boxShadow: 'inset 20px 0 60px rgba(0,0,0,0.6)',
                                    }}
                                    initial={{ x: 0 }}
                                    animate={{ x: '100%' }}
                                    transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
                                >
                                    {/* Curtain fabric folds */}
                                    <div className="absolute inset-0 opacity-30"
                                        style={{
                                            background: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.3) 30px, rgba(0,0,0,0.3) 32px, transparent 32px, transparent 60px)',
                                        }}
                                    />
                                    {/* Gold trim */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-600 via-yellow-500 to-amber-700 opacity-40" />
                                </motion.div>

                                {/* Curtain rod */}
                                <motion.div
                                    key="curtain-rod"
                                    className="absolute top-0 left-0 right-0 h-3 z-[65]"
                                    style={{
                                        background: 'linear-gradient(180deg, #b45309, #d97706, #92400e)',
                                    }}
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 0 }}
                                    transition={{ delay: 0.6, duration: 0.3 }}
                                />
                            </>
                        )}
                    </AnimatePresence>

                    {/* ── Cinematic film strip borders (top & bottom) ── */}
                    <div className="absolute top-0 left-0 right-0 h-6 z-10 flex items-center bg-neutral-900/80">
                        <div className="flex w-full justify-around px-2">
                            {Array.from({ length: 20 }, (_, i) => (
                                <div key={i} className="w-3 h-2 rounded-sm bg-neutral-800 border border-neutral-700/50" />
                            ))}
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-6 z-10 flex items-center bg-neutral-900/80">
                        <div className="flex w-full justify-around px-2">
                            {Array.from({ length: 20 }, (_, i) => (
                                <div key={i} className="w-3 h-2 rounded-sm bg-neutral-800 border border-neutral-700/50" />
                            ))}
                        </div>
                    </div>

                    {/* ── Inline styles for animations ── */}
                    <style>{`
                        @keyframes splash-flicker {
                            0%, 100% { opacity: 0.97; }
                            5% { opacity: 0.93; }
                            10% { opacity: 0.98; }
                            30% { opacity: 0.95; }
                            50% { opacity: 0.99; }
                            70% { opacity: 0.94; }
                            90% { opacity: 0.97; }
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
