import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

/* ─────────────────────────────────────────────
   FIREBASE CONFIG
───────────────────────────────────────────── */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* Validate env variables (helps debugging) */

Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.warn(`⚠️ Missing Firebase env variable: ${key}`);
  }
});

/* ─────────────────────────────────────────────
   INITIALIZE
───────────────────────────────────────────── */

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/* ─────────────────────────────────────────────
   PROVIDERS
───────────────────────────────────────────── */

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

const githubProvider = new GithubAuthProvider();
githubProvider.addScope("user:email");

/* ─────────────────────────────────────────────
   HELPER
───────────────────────────────────────────── */

const getToken = async (user) => {
  if (!user) throw new Error("User not authenticated");
  return user.getIdToken(true); // force refresh token
};

/* ─────────────────────────────────────────────
   SOCIAL AUTH
───────────────────────────────────────────── */

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await getToken(result.user);
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
};

export const signInWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    return await getToken(result.user);
  } catch (error) {
    console.error("GitHub login error:", error);
    throw error;
  }
};

/* ─────────────────────────────────────────────
   EMAIL / PASSWORD AUTH
───────────────────────────────────────────── */

export const registerWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    return await getToken(result.user);
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return await getToken(result.user);
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/* ─────────────────────────────────────────────
   PASSWORD RESET
───────────────────────────────────────────── */

export const sendFirebasePasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
};

/* ─────────────────────────────────────────────
   LOGOUT
───────────────────────────────────────────── */

export const firebaseLogout = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Firebase logout error:", error);
  }
};