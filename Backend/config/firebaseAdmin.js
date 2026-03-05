/**
 * config/firebaseAdmin.js
 *
 * npm install firebase-admin
 *
 * 1. Firebase Console → Project Settings → Service accounts → Generate new private key
 * 2. Save the JSON file OUTSIDE your repo (e.g. /etc/secrets/firebase-service-account.json)
 *    OR paste the values into env vars (recommended for production)
 */

import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();  

if (!admin.apps.length) {
  admin.initializeApp({
   
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Newlines in env vars are escaped — this restores them
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export default admin;
