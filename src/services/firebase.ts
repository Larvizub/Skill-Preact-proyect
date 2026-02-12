// Inicialización mínima de Firebase para uso en frontend
// Usa variables de entorno prefijadas con VITE_
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

export type FirebaseDatabaseKey = "CCCR" | "CCCI" | "CEVP";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const databaseUrlByKey: Record<FirebaseDatabaseKey, string> = {
  CCCR:
    import.meta.env.VITE_FIREBASE_DATABASE_URL_CCCR ||
    import.meta.env.VITE_FIREBASE_DATABASE_URL,
  CCCI:
    import.meta.env.VITE_FIREBASE_DATABASE_URL_CCCI ||
    import.meta.env.VITE_FIREBASE_DATABASE_URL,
  CEVP:
    import.meta.env.VITE_FIREBASE_DATABASE_URL_CEVP ||
    import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

let app: any = null;
try {
  app = initializeApp(firebaseConfig as any);
} catch (e) {
  // Si ya está inicializada en HMR, ignorar
  // console.warn('Firebase init error', e);
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

const realtimeDbCache = new Map<FirebaseDatabaseKey, ReturnType<typeof getDatabase>>();

export const FIREBASE_DATABASE_OPTIONS: Array<{
  value: FirebaseDatabaseKey;
  label: string;
}> = [
  { value: "CCCR", label: "CCCR" },
  { value: "CCCI", label: "CCCI" },
  { value: "CEVP", label: "CEVP" },
];

export function getFirebaseDatabaseByKey(key: FirebaseDatabaseKey) {
  if (!app) {
    throw new Error("Firebase no está inicializado.");
  }

  const resolvedKey = key in databaseUrlByKey ? key : "CCCR";
  const cached = realtimeDbCache.get(resolvedKey);
  if (cached) {
    return cached;
  }

  const url = databaseUrlByKey[resolvedKey];
  const instance = getDatabase(app, url);
  realtimeDbCache.set(resolvedKey, instance);
  return instance;
}

export default app;
