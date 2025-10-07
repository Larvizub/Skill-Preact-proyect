declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VITE_API_BASE?: string;
    }
  }
}

export {};
