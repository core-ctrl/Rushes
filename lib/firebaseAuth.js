import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getAuth } from "firebase/auth";
import app from "./firebase";

const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithGithub = () => signInWithPopup(auth, githubProvider);
export const logout = () => signOut(auth);

export default auth;
