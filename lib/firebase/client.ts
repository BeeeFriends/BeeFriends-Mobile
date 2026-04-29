import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing Firebase config: ${name}`);
  }

  return value;
}

const firebaseConfig = {
  apiKey: requireEnv("EXPO_PUBLIC_FIREBASE_API_KEY"),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: requireEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: requireEnv("EXPO_PUBLIC_FIREBASE_APP_ID"),
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

