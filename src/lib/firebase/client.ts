import { getApp, getApps, initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, initializeAuth } from "firebase/auth";
import type { Auth, Persistence, ReactNativeAsyncStorage } from "firebase/auth";

let cachedAuth: Auth | null = null;

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing Firebase config: ${name}`);
  }

  return value;
}

function getFirebaseConfig() {
  return {
    apiKey: requireEnv(
      "EXPO_PUBLIC_FIREBASE_API_KEY",
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    ),
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: requireEnv(
      "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    ),
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: requireEnv(
      "EXPO_PUBLIC_FIREBASE_APP_ID",
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    ),
  };
}

function getReactNativePersistence(
  storage: ReactNativeAsyncStorage,
): Persistence {
  return class {
    static type = "LOCAL" as const;
    readonly type = "LOCAL" as const;

    async _isAvailable() {
      try {
        await storage.setItem("firebase:storageAvailable", "1");
        await storage.removeItem("firebase:storageAvailable");
        return true;
      } catch {
        return false;
      }
    }

    _set(key: string, value: unknown) {
      return storage.setItem(key, JSON.stringify(value));
    }

    async _get<T>(key: string) {
      const value = await storage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    }

    _remove(key: string) {
      return storage.removeItem(key);
    }

    _addListener() {
      return;
    }

    _removeListener() {
      return;
    }
  } as Persistence;
}

function initializeFirebaseAuth() {
  const firebaseApp = getApps().length
    ? getApp()
    : initializeApp(getFirebaseConfig());

  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code === "auth/already-initialized") {
      return getAuth(firebaseApp);
    }

    throw error;
  }
}

export function getFirebaseAuth() {
  if (!cachedAuth) {
    cachedAuth = initializeFirebaseAuth();
  }

  return cachedAuth;
}
