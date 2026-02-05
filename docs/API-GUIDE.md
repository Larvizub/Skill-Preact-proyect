# Guía de Uso de la API de la plataforma (actualizada)

## 🔧 Resumen rápido

- La aplicación está implementada con **Preact + TypeScript** y usa un **proxy HTTP** para comunicarse con el API remoto de Skill.
- La configuración por defecto usa `/api` como base para que el desarrollo local y Firebase Hosting pasen por el **Cloud Function proxy**.
- Para cambiar el target en build/producción, define `VITE_API_BASE` en el entorno (por ejemplo, `https://grupoheroicaapi.skillsuite.net/app/wssuite/api`).

## ⚙️ Configuración (fuente: `src/services/auth.service.ts`)

```ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  username: "wsSk4Api",
  password: "5qT2Uu!qIjG%$XeD",
  companyAuthId: "xudQREZBrfGdw0ag8tE3NR3XhM6LGa",
  idData: "14",
};
```

> Nota: Las credenciales se encuentran en el repo por conveniencia de desarrollo; evita exponer secretos en entornos públicos.

## 📡 Endpoints y comportamiento actual

La app consulta endpoints en dos formas (dependiendo del endpoint): rutas REST bajo `/events/...` o las rutas tradicionales `/GetXxx`. La Cloud Function proxy intenta primero la ruta moderna y si falla prueba la ruta legacy (ej.: `/events/getrooms` → `/GetRooms`).

Principales endpoints usados:

- POST `/authenticate` — Login y obtención de token.
- GET `/events/getrooms` / POST `/GetRooms` — Lista de salones.
- POST `/events/getservices` / POST `/GetServices` — Lista de servicios.
- POST `/GetRoomRates`, `/GetServiceRates` — Tarifas.
- POST `/GetRoomsAvailability` — Disponibilidad de salones.
- POST `/GetEvents` — Obtener eventos por rango.
- POST `/GetEventQuote`, `/GetEventInvoices` — Cotizaciones y facturas.

Documentación original (wiki interna): https://skill4it.atlassian.net/wiki/spaces/FWS

## 🧩 Cómo usa la app el API (`src/services/api.service.ts`)

- Todas las peticiones agregan automáticamente los headers `idData` y `companyAuthId`.
- Si existe token se incluye `Authorization: Bearer {token}`.
- Manejo especial de 401: el `authService` realiza `logout()` y redirige a `/login`.

Ejemplo de uso:

```ts
import { apiService } from "src/services/api.service";

// Obtener eventos dentro de un rango
const events = await apiService.getEvents({
  startDate: "2025-01-01",
  endDate: "2025-01-31",
});

// Obtener salones
const rooms = await apiService.getRooms();
```

## 🔍 Recomendaciones de pruebas y depuración

- En desarrollo, la base por defecto es `/api`. Comprueba el tráfico en DevTools (POST `/api/authenticate`).
- Si hay problemas de CORS, prueba la Cloud Function proxy o despliega la función (ver `docs/PROXY-TEST.md`).
- Para inspeccionar los intentos de fallback, revisa logs de la Cloud Function (`npx firebase functions:log` o consola de Firebase).

## 🔐 Autenticación y tokens

- `authService.authenticate()` realiza POST a `${API_CONFIG.baseURL}/authenticate`.
- En una autenticación exitosa el token se guarda en `localStorage` bajo `skill_auth_token` y `skill_token_expires`.
- `authService.getToken()` lo recupera y `apiRequest` lo incluye en `Authorization`.

---

Si quieres, puedo añadir ejemplos de payloads para cada endpoint (salones, servicios, eventos) o agregar una sección con respuestas típicas y códigos de error. ✅
