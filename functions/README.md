# Functions (Cloud Functions / Proxy)

Este README explica, paso a paso, cómo preparar, compilar, probar y desplegar la carpeta `functions` que actúa como proxy a la API externa de Skill.

Resumen técnico
- Runtime: Node 20 (see `package.json` "engines")
- TypeScript: la fuente está en `functions/src`, salida en `functions/lib` tras `pnpm build` (usa `tsc`).
- Entrypoint: `functions/lib/index.js` (compilado desde `src/index.ts`).
- Dependencias principales: `firebase-admin`, `firebase-functions` (v2), `@google-cloud/functions-framework`, `express`, `node-fetch`, `cors`.

Pre-requisitos locales
- Node.js 20.x (recomendado).
- pnpm instalado globalmente (o puede usar npm/yarn adaptando los comandos).
- Firebase CLI instalado globalmente para despliegue (opcional si despliegas desde CI):
  ```powershell
  pnpm add -g firebase-tools
  ```

1) Instalación de dependencias (desde la raíz del repo)

Abrir una terminal en `c:\Dev\Preact\Skill-Preact-proyect\functions` y ejecutar:

```powershell
pnpm install
```

Si prefieres usar npm:

```powershell
npm install
```

2) Estructura y scripts disponibles
- `src/` - código TypeScript fuente
- `lib/` - código compilado (generado por `tsc`)

Scripts definidos en `package.json`:
- `pnpm build` — compila TypeScript a `lib` (ejecuta `tsc`).
- `pnpm watch` — compila en modo watch (útil en desarrollo local).
- `pnpm lint` — corre eslint contra `src`.

3) Variables de entorno importantes
- `VITE_API_BASE` (opcional) — si quieres cambiar la URL base que usa el proxy para la API remota.
- `COMPANY_AUTH_ID` — id de la empresa (por defecto ya está definida en el código; puedes sobreescribirla para entornos distintos).
- `ID_DATA` — id data usado por el API (por defecto `14`).

Al ejecutar localmente, puedes exportarlas en pwsh así:

```powershell
$env:VITE_API_BASE = "https://grupoheroicaapi.skillsuite.net/app/wssuite/api"
$env:COMPANY_AUTH_ID = "xudQREZBrfGdw0ag8tE3NR3XhM6LGa"
$env:ID_DATA = "14"
```

4) Compilar localmente

```powershell
pnpm build
```

Verifica que `lib/index.js` existe y que no hay errores de compilación.

5) Probar localmente (modo funciones HTTP locales)

Opción A — Usar `@google-cloud/functions-framework` directamente (útil para probar funciones genéricas fuera de Firebase CLI):

```powershell
# Asume que estás en functions/
node -e "require('./lib/index').proxyApiV2; console.log('Entrypoint cargado');"
# or run the functions-framework if you have it installed globally
npx @google-cloud/functions-framework --target=proxyApiV2 --source=lib --signature-type=http
```

Opción B — Emular con Firebase CLI (recomendado si vas a desplegar a Firebase):

```powershell
# Desde la raíz del proyecto
firebase emulators:start --only functions
```

Asegúrate de tener `firebase.json` y un proyecto Firebase configurado localmente.

6) Pruebas manuales simples
- Con el emulador en marcha, realiza una petición a la ruta proxy `/api/<endpoint>` que tu front llama (por ejemplo `/api/GetRooms`) y valida que el proxy reenvía y responde correctamente.
- Revisa los logs del emulador para ver el detalle de reenvío y fallos.

7) Despliegue a Firebase (producción)

A) Configura el proyecto Firebase e inicia sesión:

```powershell
firebase login
firebase use --add
```

B) Construye el código:

```powershell
pnpm build
```

C) Despliega solo las funciones:

```powershell
firebase deploy --only functions
```

Nota sobre funciones gen2 (Cloud Functions v2):
- En `src/index.ts` se usa `onRequest` de `firebase-functions/v2/https`. Si quieres beneficiarte de features de gen2 (concurrencia, regiones adicionales), asegúrate que el proyecto Firebase soporte gen2 y que el `firebase.json` no tenga restricciones que lancen a gen1.

8) Consideraciones de seguridad y CORS
- El proxy copia selectivamente cabeceras `idData` y `companyAuthId` desde la petición entrante hacia la API remota. Evita exponer credenciales sensibles en el cliente.
- El código ya aplica `cors({ origin: true })` para permitir orígenes dinámicos. En producción considera restringirlo a orígenes permitidos.

9) CI/CD (opcional)
- En un pipeline CI (GitHub Actions / Azure Pipelines):
  - Instala Node 20, pnpm
  - Ejecuta `pnpm install` en `functions/`
  - Ejecuta `pnpm build`
  - Ejecuta `firebase deploy --only functions --token $FIREBASE_TOKEN` (configura `FIREBASE_TOKEN` como secret)

10) Troubleshooting
- Error de puerto/puerto en uso: asegúrate de que el emulador no esté usando un puerto ocupado.
- Errores de compilación de TypeScript: corrige los tipos en `src/` o ajusta `tsconfig.json` en `functions/`.
- Respuestas 401/403 de la API remota: validar cabeceras `companyAuthId` y `idData` y tokens.

Contacto
- Si necesitas que prepare un workflow de GitHub Actions para compilar y desplegar automáticamente, puedo crearlo y añadirlo al repo.

---
Archivo creado automáticamente por el asistente. Si quieres, hago el commit y push ahora con mensaje en español.
