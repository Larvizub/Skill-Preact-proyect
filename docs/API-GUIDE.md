# Guía de Uso de la API de Skill

## Configuración de Autenticación

La plataforma utiliza las siguientes credenciales para conectarse al API de Skill:

```typescript
{
  baseURL: 'https://grupoheroicaapi.skillsuite.net/app/wssuite/api',
  username: 'wsSk4Api',
  password: '5qT2Uu!qIjG%$XeD',
  companyAuthId: 'xudQREZBrfGdw0ag8tE3NR3XhM6LGa',
  idData: '14'
}
```

## Endpoints Disponibles

### Autenticación

**Endpoint**: `/authenticate`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2057437200/Por+Token

```json
{
  "username": "wsSk4Api",
  "password": "5qT2Uu!qIjG%$XeD",
  "companyAuthId": "xudQREZBrfGdw0ag8tE3NR3XhM6LGa",
  "idData": "14"
}
```

### Salones

**Endpoint**: `/GetRooms`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374465/GetRooms

### Servicios

**Endpoint**: `/GetServices`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374481/GetServices

### Tarifas de Salones

**Endpoint**: `/GetRoomRates`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374498/GetRoomRates

### Tarifas de Servicios

**Endpoint**: `/GetServiceRates`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374514/GetServiceRates

### Disponibilidad de Salones

**Endpoint**: `/GetRoomsAvailability`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109865985/GetRoomsAvailability

```json
{
  "companyAuthId": "xudQREZBrfGdw0ag8tE3NR3XhM6LGa",
  "idData": "14",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

### Tipos de Eventos

**Endpoint**: `/GetEventTypes`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109898753/GetEventTypes

### Segmentos de Mercado

**Endpoint**: `/GetEventMarketSegments`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109866001/GetEventMarketSegments

### Coordinadores de Cuenta

**Endpoint**: `/GetSalesAgents`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2109374546/GetSalesAgents

### Estados de Eventos

**Endpoint**: `/GetEventStatuses`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2139455489/GetEventStatuses

### Carácter del Evento

**Endpoint**: `/GetEventCharacters`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143584257/GetEventCharacters

### Sector del Evento

**Endpoint**: `/GetEventSectors`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143617025/GetEventSectors

### Tamaño del Evento

**Endpoint**: `/GetEventSizes`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143682561/GetEventSizes

### Tipos de Reservación

**Endpoint**: `/GetReservationTypes`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143617041/GetReservationTypes

### Usos de Reservación

**Endpoint**: `/GetReservationUses`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2143682577/GetReservationUses

### Etapas del Evento

**Endpoint**: `/GetEventStages`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2334326800/GetEventStages

### Tipos de Actividades

**Endpoint**: `/GetActivityTypes`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2334326785/GetActivityTypes

### Coordinadores de Eventos

**Endpoint**: `/GetEventCoordinators`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2172583937/GetEventCoordinators

### Calendarios

**Endpoint**: `/GetSchedules`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2186575873/GetSchedules

```json
{
  "companyAuthId": "xudQREZBrfGdw0ag8tE3NR3XhM6LGa",
  "idData": "14",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

### Eventos

**Endpoint**: `/GetEvents`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2204532737/GetEvents

```json
{
  "companyAuthId": "xudQREZBrfGdw0ag8tE3NR3XhM6LGa",
  "idData": "14",
  "startDate": "2025-01-01", // Opcional
  "endDate": "2025-01-31" // Opcional
}
```

### Cotización de Eventos

**Endpoint**: `/GetEventQuote`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2219114497/GetEventQuote

```json
{
  "companyAuthId": "xudQREZBrfGdw0ag8tE3NR3XhM6LGa",
  "idData": "14",
  "eventId": "123"
}
```

### Facturas de Eventos

**Endpoint**: `/GetEventInvoices`  
**Método**: POST  
**Documentación**: https://skill4it.atlassian.net/wiki/spaces/FWS/pages/2231762946/GetEventInvoices

```json
{
  "companyAuthId": "xudQREZBrfGdw0ag8tE3NR3XhM6LGa",
  "idData": "14",
  "eventId": "123"
}
```

## Uso en el Código

### Ejemplo de Llamada API

```typescript
import { apiService } from "./services/api.service";

// Obtener eventos
const events = await apiService.getEvents();

// Obtener eventos con rango de fechas
const eventsInRange = await apiService.getEvents("2025-01-01", "2025-01-31");

// Obtener cotización de un evento
const quote = await apiService.getEventQuote("event-id-123");
```

### Estructura de Respuesta

Todas las respuestas del API incluyen los campos estándar:

```typescript
{
  companyAuthId: string;
  idData: string;
}
```

Los datos específicos varían según el endpoint consultado.

## Manejo de Errores

El servicio de API implementa manejo de errores:

```typescript
try {
  const data = await apiService.getEvents();
  // Procesar datos
} catch (error) {
  console.error("Error loading events:", error);
  // Manejar error
}
```

## Autenticación

El token de autenticación se almacena automáticamente en localStorage tras un login exitoso:

```typescript
const success = await authService.authenticate();
if (success) {
  // Usuario autenticado
  const token = authService.getToken();
}
```

El token se incluye automáticamente en todas las peticiones subsiguientes mediante el header `Authorization: Bearer {token}`.
