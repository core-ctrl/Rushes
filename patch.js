const fs = require('fs');
let code = fs.readFileSync('components/HeroSlider.jsx', 'utf8');

// 1. Add state and refs
code = code.replace('const [dominant, setDominant] = useState([200, 30, 30]);', 
const [dominant, setDominant] = useState([200, 30, 30]);
    const [showVideo, setShowVideo] = useState(false);
    const [muted, setMuted] = useState(true);
    const [volume, setVolume] = useState(60);
    const [isPlaying, setIsPlaying] = useState(false);

    const ytPlayer = useRef(null);
    const ytContainer = useRef(null);
    const ytApiLoaded = useRef(false);

    const ytQuality = useAdaptiveVideoQuality(););

// 2. Add YouTube logic where the old comment was
code = code.replace('// Removed background YouTube auto-player logic',
// -- YouTube API loader ------------------------------------------
    const ensureYTApi = useCallback(() => {
        if (typeof window === "undefined") return Promise.resolve();
        if (window.YT?.Player) return Promise.resolve();
        return new Promise((resolve) => {
            if (!ytApiLoaded.current) {
                ytApiLoaded.current = true;
                if (!document.getElementById("yt-api")) {
                    const tag = document.createElement("script");
                    tag.src = "https://www.youtube.com/iframe_api";
                    tag.id = "yt-api";
                    document.body.appendChild(tag);
                }
            }
            const check = setInterval(() => {
                if (window.YT?.Player) { clearInterval(check); resolve(); }
            }, 100);
        });
    }, []);

    // -- Create / update inline player ------------------------------
    const createPlayer = useCallback(async (videoId) => {
        if (!videoId) return;
        await ensureYTApi();

        if (ytPlayer.current) {
            try {
                ytPlayer.current.loadVideoById(videoId);
                ytPlayer.current.setVolume(volume);
                muted ? ytPlayer.current.mute() : ytPlayer.current.unMute();
            } catch (e) { }
            return;
        }

        const id = \ytp-\\;
        if (!ytContainer.current) return;
        ytContainer.current.innerHTML = \<div id="\"></div>\;

        ytPlayer.current = new window.YT.Player(id, {
            videoId,
            playerVars: {
                autoplay: 1, controls: 0, modestbranding: 1, rel: 0, loop: 1,
                playlist: videoId, playsinline: 1, vq: 'hd2160', iv_load_policy: 3,
                showinfo: 0, fs: 0, disablekb: 1, cc_load_policy: 0,
                origin: typeof window !== 'undefined' ? window.location.origin : '',
            },
            events: {
                onReady: (e) => {
                    try {
                        e.target.setVolume(volume);
                        muted ? e.target.mute() : e.target.unMute();
                        e.target.setPlaybackQuality(ytQuality || 'hd2160');
                    } catch (err) { }
                },
                onStateChange: (e) => {
                    if (e.data === window.YT.PlayerState.PLAYING) {
                        setIsPlaying(true);
                    } else {
                        setIsPlaying(false);
                    }
                },
            },
        });
    }, [ensureYTApi, muted, volume, ytQuality]);

    useEffect(() => {
        if (!videoKey) {
            if (ytContainer.current) ytContainer.current.innerHTML = "";
            if (ytPlayer.current) { try { ytPlayer.current.destroy(); } catch (e) { } ytPlayer.current = null; }
            return;
        }
        if (showVideo) createPlayer(videoKey);
    }, [videoKey, showVideo, createPlayer]);

    useEffect(() => {
        if (!ytPlayer.current) return;
        try { muted ? ytPlayer.current.mute() : ytPlayer.current.unMute(); ytPlayer.current.setVolume(volume); } catch (e) { }
    }, [muted, volume]););

// 3. Update Slide Timings
code = code.replace('setZoom(false);\\n        const t3 = setTimeout(() => setZoom(true), 900);\\n        return () => { clearTimeout(t3); };',
setShowVideo(false);
        setZoom(false);
        const t2 = setTimeout(() => setShowVideo(true), 4200);
        const t3 = setTimeout(() => setZoom(true), 900);
        return () => { clearTimeout(t2); clearTimeout(t3); };);

// 4. Update isPlaying in Auto-rotate
code = code.replace('if (interacting.current) { clearTimeout(rotateTimer.current); return; }',
'if (interacting.current || isPlaying) { clearTimeout(rotateTimer.current); return; }');

// 5. Add DOM elements for the video player
code = code.replace('{/* Removed inline video player */}',
{/* Background video player */}
            <div 
                ref={ytContainer} 
                className={\bsolute inset-0 z-[2] w-full h-[140%] -top-[20%] pointer-events-none transition-opacity duration-1000 \\}
                aria-hidden={!showVideo}
            />

            {/* YouTube UI overlay masks */}
            {showVideo && (
                <div className="absolute inset-0 z-[5] pointer-events-none" aria-hidden>
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/70 to-transparent" />
                    <div className="absolute bottom-0 right-0 w-28 h-16 bg-gradient-to-tl from-black/90 to-transparent" />
                    <div className="absolute top-0 right-0 w-36 h-16 bg-gradient-to-bl from-black/80 to-transparent" />
                </div>
            )});

// 6. Add Playback Controls UI
code = code.replace('{/* Persistent Slide Navigation Arrows */}',
{/* Playback controls (bg video) */}
            {videoKey && showVideo && (
                <div className="absolute bottom-6 left-6 z-50 flex items-center gap-3">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!ytPlayer.current) return;
                            try { isPlaying ? ytPlayer.current.pauseVideo() : ytPlayer.current.playVideo(); } catch (err) { }
                        }}
                        className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white hover:bg-black/80 transition-colors"
                    >
                        {isPlaying ? <AppIcon icon={PauseIcon} size={18} /> : <AppIcon icon={PlayIcon} size={18} className="fill-current" />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }} 
                        className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 text-white hover:bg-black/80 transition-colors"
                    >
                        {muted ? <AppIcon icon={VolumeMute02Icon} size={18} /> : <AppIcon icon={VolumeHighIcon} size={18} />}
                    </button>
                </div>
            )}

            {/* Persistent Slide Navigation Arrows */});

fs.writeFileSync('components/HeroSlider.jsx', code);
console.log('Patched HeroSlider.jsx');
