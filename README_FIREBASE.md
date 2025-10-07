Firebase hosting - quick start

Pasos rápidos para preparar y desplegar en Firebase Hosting:

1. Instalar Firebase CLI globalmente (o usar npx):

   pnpm add -D firebase-tools

   # o

   npx firebase login

2. Configurar variables de entorno para Vite (archivo .env):

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

3. Inicializar hosting (solo si quieres configurar interactivamente):

   npx firebase init hosting

4. Desplegar:

   pnpm run deploy

Notas:

- `firebase.json` ya está configurado para una SPA (rewrites a index.html)
- Reemplaza `YOUR_FIREBASE_PROJECT_ID` en `.firebaserc` por tu project id o usa `firebase use --add`
- Si no quieres instalar dependencias de firebase SDK en el frontend, puedes omitir `src/services/firebase.ts` o instalar `firebase` con:

  pnpm add firebase
