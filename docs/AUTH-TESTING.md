# Guía de Prueba de Autenticación

## 🔐 Proceso de Autenticación

La plataforma está configurada para autenticarse automáticamente con el API de Skill usando credenciales pre-configuradas.

## 📝 Pasos para Probar el Login

1. **Abrir la aplicación**

   ```
   http://localhost:5173/
   ```

2. **Formulario de Login**

   - Puedes ingresar cualquier texto en usuario y contraseña
   - Estos campos son decorativos y no afectan la autenticación real

3. **Hacer clic en "Iniciar Sesión"**
   - El sistema intentará conectarse al API de Skill
   - Revisa la consola del navegador (F12) para ver los logs detallados

## 🔍 Verificar la Autenticación

### En la Consola del Navegador (F12 → Console)

Deberías ver mensajes como:

```
Attempting authentication...
Response status: 200
Auth response: { ... }
Authentication successful, redirecting to dashboard
```

### Posibles Problemas

#### 1. Error CORS

Si ves errores de CORS en la consola:

```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solución**: El servidor de Skill necesita permitir peticiones desde tu origen. Esto es normal en desarrollo.

#### 2. Error de Red

Si ves:

```
TypeError: Failed to fetch
```

**Posibles causas**:

- No hay conexión a internet
- El servidor de Skill está inaccesible
- Firewall bloqueando la petición

#### 3. Error 401/403

Si la respuesta es 401 o 403:

```
Authentication failed: 401
```

**Posibles causas**:

- Credenciales incorrectas en `auth.service.ts`
- Token expirado
- Permisos insuficientes

## 🛠️ Modo de Desarrollo sin API

Si no puedes conectarte al API de Skill, puedes usar un modo de desarrollo:

### Opción 1: Mock del Servicio de Autenticación

Edita `src/services/auth.service.ts`:

```typescript
async authenticate(): Promise<boolean> {
  // MODO DESARROLLO: Autenticación simulada
  console.log('Using mock authentication');
  const mockToken = 'mock-token-' + Date.now();
  this.token = mockToken;
  localStorage.setItem("skill_auth_token", mockToken);
  return true;
}
```

### Opción 2: Bypass del Login

Edita `src/main.tsx` y comenta la verificación de autenticación.

## 📊 Estados de la Autenticación

### Exitosa ✅

- Token guardado en localStorage
- Redirección automática a `/dashboard`
- Todas las llamadas al API incluirán el token

### Fallida ❌

- Mensaje de error en pantalla
- Detalles en consola del navegador
- Usuario permanece en la página de login

## 🧪 Pruebas Adicionales

### Verificar Token Almacenado

```javascript
// En la consola del navegador
localStorage.getItem("skill_auth_token");
```

### Limpiar Sesión

```javascript
// En la consola del navegador
localStorage.removeItem("skill_auth_token");
location.reload();
```

### Verificar Estado de Autenticación

```javascript
// En la consola del navegador
import { authService } from "./src/services/auth.service";
console.log(authService.isAuthenticated());
```

## 📞 Información de Contacto del API

- **Base URL**: https://grupoheroicaapi.skillsuite.net/app/wssuite/api
- **Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2057437200/Por+Token
- **Método de Autenticación**: Basic Auth con token Bearer

## 🔄 Endpoints Alternativos Probados

El servicio intenta diferentes endpoints:

1. `/Login` (Actual)
2. `/authenticate` (Alternativo)
3. `/auth` (Alternativo)

Si ninguno funciona, puede ser necesario revisar la documentación actualizada del API.
