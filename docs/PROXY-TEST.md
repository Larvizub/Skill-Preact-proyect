# Pruebas del Cloud Function Proxy (actualizado)

La app usa una Cloud Function (Gen2) como proxy para evitar CORS y para soportar rutas legacy. El código está en `functions/src/index.ts` y su base remota por defecto es `https://grupoheroicaapi.skillsuite.net/app/wssuite/api`.

## ✅ Comprobaciones rápidas

- Ver funciones desplegadas:

```bash
npx firebase functions:list
```

- Ver logs (Gen2):

```bash
npx firebase functions:log --region us-central1
```

## 🧪 Probar la función localmente (Emulator)

1. Instala y corre los emuladores:

```bash
pnpm install
pnpm -w firebase emulators:start --only functions
```

2. Llama al endpoint local (ejemplo con curl):

```bash
curl -X POST http://localhost:5001/<YOUR_PROJECT>/us-central1/proxyApiV2/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"wsSk4Api","password":"5qT2Uu!qIjG%$XeD","companyAuthId":"xudQREZBrfGdw0ag8tE3NR3XhM6LGa","companyId":""}'
```

> Reemplaza `<YOUR_PROJECT>` por tu projectId de Firebase.

## 🔁 Llamada de prueba a producción (curl)

```bash
curl -X POST https://us-central1-gh-skillsuit.cloudfunctions.net/proxyApiV2/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"wsSk4Api","password":"5qT2Uu!qIjG%$XeD","companyAuthId":"xudQREZBrfGdw0ag8tE3NR3XhM6LGa","companyId":""}'
```

## 🔎 Qué revisar en caso de fallo

- **403/401**: revisa que `companyAuthId` e `idData` estén correctos; revisa las cabeceras que llegan al proxy.
- **CORS**: la función está configurada para permitir origenes (`cors({ origin: true })`) — los problemas habituales provienen del remote API.
- **404/405**: el proxy intenta rutas candidatas (por ejemplo `/events/getrooms` y fallback a `/GetRooms`). Revisa logs para ver qué ruta respondió.

## 🧾 Logs y diagnóstico

- El proxy imprime intentos y rutas en consola (`proxy: forwarding`, `proxy: response`). Revisa estos mensajes en los logs de Firebase para diagnosticar fallbacks y errores.

## Notas finales

- Para deploy: `pnpm -w firebase deploy --only functions` (ajusta según scripts del repo).
- Si quieres, agrego un script en `package.json` para facilitar llamadas de prueba con `curl` y un pequeño README con ejemplos de payloads para cada endpoint. ✅
