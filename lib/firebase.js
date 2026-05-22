import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase config at runtime to fail fast with a clear message
const REQUIRED_FIREBASE_KEYS = [
    "apiKey",
    "authDomain",
    "projectId",
    "appId",
];
const missing = REQUIRED_FIREBASE_KEYS.filter((k) => !firebaseConfig[k]);
if (missing.length > 0) {
    const msg = `[Firebase] Missing required environment variables: ${missing.map((k) => `NEXT_PUBLIC_FIREBASE_${k.toUpperCase().replace(/[A-Z]/g, (m) => `_${m}`).replace(/^_/, "")}`).join(", ")}. Check your .env.local or Vercel Environment Variables.`;
    if (typeof window !== "undefined") {
        console.error(msg);
    } else {
        throw new Error(msg);
    }
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

export async function initAnalytics() {
    const supported = await isSupported();
    if (supported) {
        const { getAnalytics } = await import("firebase/analytics");
        return getAnalytics(app);
    }
    return null;
}

export default app;
