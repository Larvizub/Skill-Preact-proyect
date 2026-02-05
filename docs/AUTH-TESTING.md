# Pruebas de Autenticación (Actualizado)

## 🔐 ¿Cómo funciona la autenticación hoy?

- `authService.authenticate()` hace POST a `${API_CONFIG.baseURL}/authenticate` con las credenciales de `API_CONFIG`.
- Si `API_CONFIG.baseURL` está vacío, por defecto es `/api` y la petición pasa por el **Cloud Function proxy**.
- En caso de éxito se guarda el token en `localStorage` bajo `skill_auth_token` y `skill_token_expires`.

## 🚀 Pasos rápidos para probar localmente

1. Inicia la aplicación:
   ```bash
   pnpm install
   pnpm dev
   ```
2. Abre `http://localhost:5173/`.
3. Haz clic en "Iniciar Sesión" en la pantalla de login.
4. Abre DevTools → Network y revisa la petición `POST /api/authenticate` (o `/authenticate` si usas VITE_API_BASE directamente).
5. Verifica que `localStorage.getItem('skill_auth_token')` contenga el token.

## 🔍 Errores comunes y soluciones

- CORS (en dev): usa la Cloud Function proxy o revisa la configuración del servidor remoto. Si usas Firebase Hosting con rewrite la petición debería llegar al proxy y evitar CORS.
- `TypeError: Failed to fetch`: comprueba conectividad, VPN/Firewall o que el proxy/función esté desplegada.
- 401/403: revisa `API_CONFIG` y logs de la petición (Network / Console). Un 401 activa `authService.logout()` y redirige a `/login`.

## 🧪 Modo desarrollo (mock)

Si no quieres depender del backend durante desarrollo, puedes simular `authenticate()` temporalmente en `src/services/auth.service.ts`:

```ts
// MODO MOCK - SOLO PARA DESARROLLO
async authenticate(): Promise<boolean> {
  console.log('Mock auth enabled');
  const mockToken = 'mock-' + Date.now();
  this.token = mockToken;
  localStorage.setItem('skill_auth_token', mockToken);
  return true;
}
```

> Recuerda revertir este cambio antes de subir a repos remoto.

## ⚠️ Recomendaciones

- Evita hardcodear credenciales en entornos públicos.
- Para pruebas de integración usa `VITE_API_BASE` apuntando al API real y ejecuta las Cloud Functions en producción o usa el emulator de Firebase para pruebas locales.

Si quieres, agrego scripts y ejemplos para ejecutar autenticación contra el emulator de Firebase o un mock server con `msw` (mock service worker). ✅
