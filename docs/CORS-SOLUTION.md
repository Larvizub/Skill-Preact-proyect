# Solución al Problema de CORS

## 🔴 Problema Identificado

El error que experimentaste fue:

```
Access to fetch at 'https://grupoheroicaapi.skillsuite.net/app/wssuite/api/Login'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### ¿Qué es CORS?

CORS (Cross-Origin Resource Sharing) es una política de seguridad del navegador que bloquea peticiones HTTP desde un origen diferente al del servidor.

En tu caso:

- **Origen local**: `http://localhost:5173`
- **Servidor API**: `https://grupoheroicaapi.skillsuite.net`
- **Problema**: El servidor API no incluye el header `Access-Control-Allow-Origin` necesario

## ✅ Solución Implementada: Proxy de Vite

### Cambios Realizados

#### 1. Configuración del Proxy en `vite.config.ts`

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://grupoheroicaapi.skillsuite.net/app/wssuite/api',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      secure: false,
    },
  },
}
```

**¿Cómo funciona?**

- Todas las peticiones a `/api` se redirigen automáticamente al servidor de Skill
- El proxy actúa como intermediario, evitando el problema de CORS
- `changeOrigin: true` cambia el header `Origin` para que coincida con el destino

#### 2. Actualización de `auth.service.ts`

```typescript
baseURL: import.meta.env.DEV
  ? "/api"  // En desarrollo, usa el proxy local
  : "https://grupoheroicaapi.skillsuite.net/app/wssuite/api", // En producción, URL directa
```

**Beneficios**:

- En desarrollo: usa el proxy (`/api`)
- En producción: usa la URL real del API

## 🚀 Cómo Usar

### Nueva URL del Servidor

El servidor ahora está ejecutándose en:

```
http://localhost:5174/
```

### Probar la Autenticación

1. **Abre el navegador** en `http://localhost:5174/`
2. **Ingresa cualquier texto** en usuario/contraseña
3. **Haz clic en "Iniciar Sesión"**
4. **Revisa la consola** (F12 → Console)

Ahora deberías ver:

```
Attempting authentication...
Response status: 200
Auth response: {...}
Authentication successful, redirecting to dashboard
```

### Herramienta de Diagnóstico

También puedes probar: `http://localhost:5174/api-test`

## 🔍 Verificar que Funciona

### En la Consola del Navegador

**Antes** (con error CORS):

```
❌ Access to fetch at 'https://...' has been blocked by CORS policy
```

**Ahora** (sin error CORS):

```
✅ Response status: 200
✅ Auth response: { ... }
```

### Endpoints Disponibles

Con el proxy configurado, todas las rutas `/api/*` se redirigen automáticamente:

- `/api/Login` → `https://grupoheroicaapi.skillsuite.net/app/wssuite/api/Login`
- `/api/GetEvents` → `https://grupoheroicaapi.skillsuite.net/app/wssuite/api/GetEvents`
- `/api/GetRooms` → `https://grupoheroicaapi.skillsuite.net/app/wssuite/api/GetRooms`
- etc.

## 📝 Notas Importantes

### Desarrollo vs Producción

- **Desarrollo**: El proxy de Vite maneja CORS automáticamente
- **Producción**: Necesitarás configurar CORS en el servidor o usar un proxy en tu servidor de producción

### Si el Problema Persiste

Si aún ves errores de CORS:

1. **Limpia la caché del navegador**: Ctrl + Shift + Delete
2. **Recarga sin caché**: Ctrl + F5
3. **Verifica la URL**: Asegúrate de usar `http://localhost:5174/`
4. **Revisa la consola**: Busca otros mensajes de error

### Puerto Diferente

El servidor cambió del puerto **5173** al **5174** porque el primero estaba en uso. Si quieres usar específicamente el 5173:

1. Cierra cualquier otro servidor que esté usando ese puerto
2. Reinicia con `pnpm dev`

## 🎯 Próximos Pasos

1. **Abre**: `http://localhost:5174/`
2. **Intenta hacer login**
3. **Si funciona**: ¡Ya puedes usar toda la plataforma!
4. **Si no funciona**: Comparte los nuevos logs de la consola

## 🛠️ Soluciones Alternativas (Si el proxy no funciona)

### Opción A: Modo de Desarrollo sin API

Edita `src/services/auth.service.ts`:

```typescript
async authenticate(): Promise<boolean> {
  // MODO DESARROLLO: Bypass de autenticación
  console.log('Using mock authentication - DEVELOPMENT ONLY');
  const mockToken = 'dev-token-' + Date.now();
  this.token = mockToken;
  localStorage.setItem("skill_auth_token", mockToken);
  return true;
}
```

### Opción B: Extensión del Navegador

Instala una extensión para deshabilitar CORS temporalmente:

- Chrome: "Allow CORS: Access-Control-Allow-Origin"
- Firefox: "CORS Everywhere"

**⚠️ Advertencia**: Solo para desarrollo, nunca uses esto en producción.

## 📚 Recursos Adicionales

- [Documentación de Vite Proxy](https://vitejs.dev/config/server-options.html#server-proxy)
- [MDN - CORS](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [Skill API Documentation](https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2057437200/Por+Token)
