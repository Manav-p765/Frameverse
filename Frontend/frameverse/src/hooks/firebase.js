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

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ─── Providers ────────────────────────────────────────────────────────────────

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const githubProvider = new GithubAuthProvider();
githubProvider.addScope("user:email");

// ─── Social ───────────────────────────────────────────────────────────────────

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user.getIdToken();
};

export const signInWithGithub = async () => {
  const result = await signInWithPopup(auth, githubProvider);
  return result.user.getIdToken();
};

// ─── Email / Password ─────────────────────────────────────────────────────────

export const registerWithEmail = async (email, password) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user.getIdToken();
};

export const loginWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user.getIdToken();
};

// ─── Password Reset ───────────────────────────────────────────────────────────

export const sendFirebasePasswordReset = (email) =>
  sendPasswordResetEmail(auth, email);

// ─── Logout ───────────────────────────────────────────────────────────────────

export const firebaseLogout = () => firebaseSignOut(auth);