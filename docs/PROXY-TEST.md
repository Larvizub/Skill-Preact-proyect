# Test de Cloud Function Proxy

## Pasos para Verificar

1. **Ver si la función está desplegada:**

```powershell
npx firebase functions:list
```

2. **Hacer una petición de prueba directa a la Cloud Function:**

```powershell
# Usando curl (si está instalado)
curl -X POST https://us-central1-gh-skillsuit.cloudfunctions.net/proxyApi/authenticate `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"wsSk4Api\",\"password\":\"5qT2Uu!qIjG%$XeD\",\"companyAuthId\":\"xudQREZBrfGdw0ag8tE3NR3XhM6LGa\",\"companyId\":\"\"}'
```

3. **Verificar en el navegador:**

- Abre: https://gh-skillsuit.web.app
- Shift + F5 (hard reload)
- Intenta login
- Abre Network tab y busca la petición `/api/authenticate`
- Revisa el Response

## Estado Esperado

La función debería:

- Recibir `/api/authenticate` desde el navegador
- Filtrar los prefijos y construir: `https://grupoheroicaapi.skillsuite.net/app/wssuite/api/authenticate`
- Reenviar la petición POST con el body JSON
- Retornar la respuesta (éxito o error del backend)

Si aún ves 403, es posible que:

1. El deploy no se haya propagado completamente (esperar 2-3 minutos)
2. Hay cache en el navegador o en Firebase Hosting
3. La función no se está ejecutando (ver logs con `npx firebase functions:log`)
