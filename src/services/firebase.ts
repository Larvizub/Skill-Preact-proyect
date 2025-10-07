// Inicialización mínima de Firebase para uso en frontend
// Usa variables de entorno prefijadas con VITE_
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
export default app;
