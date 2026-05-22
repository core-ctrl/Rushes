import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Info, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

const TOAST_EVENT = "rushes:toast";

export function toast({ type = "info", message = "", title = "" }) {
  if (typeof window === "undefined" || !message) return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { type, message, title } }));
}

export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = (event) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const item = { id, ...event.detail };
      setItems((current) => [item, ...current].slice(0, 4));
      window.setTimeout(() => {
        setItems((current) => current.filter((entry) => entry.id !== id));
      }, 4200);
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  const iconFor = (type) => {
    if (type === "success") return <CheckCircle className="h-4 w-4 text-emerald-300" />;
    if (type === "error") return <XCircle className="h-4 w-4 text-red-300" />;
    return <Info className="h-4 w-4 text-sky-300" />;
  };

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[300] flex w-[min(92vw,360px)] flex-col gap-3">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-white/12 bg-black/70 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8">
                {iconFor(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                {item.title ? <p className="text-sm font-bold">{item.title}</p> : null}
                <p className="text-sm leading-relaxed text-neutral-300">{item.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                className="rounded-full p-1 text-neutral-500 transition hover:bg-white/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
