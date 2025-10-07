// Declaraciones para módulos que pueden no exponer tipos para TypeScript
declare module "firebase/app";
declare module "firebase/auth";
declare module "firebase/firestore";
declare module "vite";
declare module "@preact/preset-vite";

declare module "vite/client" {
  interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY?: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
    readonly VITE_FIREBASE_PROJECT_ID?: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
    readonly VITE_FIREBASE_APP_ID?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
