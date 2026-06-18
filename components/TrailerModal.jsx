import { useEffect, useRef } from "react";

/**
 * TrailerModal
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - videoIdOrUrl: string (YouTube video id)
 *  - title: string
 */
export default function TrailerModal({
    open = false,
    onClose = () => { },
    videoIdOrUrl = null,
    title = "",
}) {
    const iframeRef = useRef(null);

    // Close on ESC key
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open || !videoIdOrUrl) return null;

    const embedUrl = `https://www.youtube.com/embed/${videoIdOrUrl}?autoplay=1&rel=0&modestbranding=1`;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`Trailer for ${title}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal content */}
            <div 
                className="relative z-10 w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black"
                style={{
                    boxShadow: '0 0 120px 20px rgba(var(--theme-color), 0.6), 0 0 40px 10px rgba(var(--theme-color), 0.4)'
                }}
            >
                {/* Title bar */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
                    <span className="text-white font-semibold text-sm md:text-base truncate pr-4">
                        {title ? `${title} — Trailer` : "Trailer"}
                    </span>
                    <button
                        onClick={onClose}
                        aria-label="Close trailer"
                        className="text-white hover:text-red-400 transition text-xl font-bold leading-none p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* YouTube iframe */}
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    title={`${title || "Video"} trailer`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </div>
    );
}

