# Skill Platform - Plataforma de Gestión de Eventos (Estado actual)

Plataforma web desarrollada con Vite + Preact + TypeScript para la gestión y consulta de eventos, integrada con la API de Skill Suite. A continuación se describe el estado real del proyecto, módulos implementados y puntos pendientes.

## Tecnologías principales

- Preact + TypeScript
- Vite
- Tailwind CSS + Shadcn UI
- pnpm (gestor de paquetes obligatorio)
- date-fns
- Lucide Preact (iconos)
- preact-router

## Módulos implementados

Las siguientes páginas/funcionalidades están implementadas bajo `src/pages` y en uso:

- Login (`Login.tsx`) — Autenticación basada en token, flujo de login/logout y protección de rutas.
- Dashboard (`Dashboard.tsx`) — KPIs, tarjetas y métricas principales.
- Eventos (`Eventos.tsx`) — Búsqueda, filtrado y listado de eventos.
- Evento Detalle (`EventoDetalle.tsx`) — Información completa del evento: actividades, servicios, tarifas, cotizaciones y facturas.
- Calendario (`Calendario.tsx`) — Vista mensual con filtros por estatus/segmento y navegación por fecha.
- Salones (`Salones.tsx`) — Catálogo y detalles de salones.
- Salones Disponibles (`SalonesDisponibles.tsx`) — Consulta de disponibilidad por rango de fechas.
- Inventario (`Inventario.tsx`) — Listado de artículos y servicios para cotizaciones.
- Coordinadores (`Coordinadores.tsx`) — Agentes de ventas / coordinadores de cuenta.
- Clientes (`Clientes.tsx`) — Gestión básica de clientes (funcionalidad parcial).
- Contactos (`Contactos.tsx`) — Gestión básica de contactos (funcionalidad parcial).
- Personal Eventos (`PersonalEventos.tsx`) — Revisar asignaciones y costos (básico).
- Parqueos Eventos (`ParqueosEventos.tsx`) — Desglose por actividades de parqueo.
- ApiTest (`ApiTest.tsx`) — Página para pruebas y debug de llamadas al API.

Si detectas módulos nuevos en `src/pages` que no están listados aquí, indícalo y lo actualizo.

## UI/UX en producción

- Diseño responsivo (móvil y escritorio)
- Tema oscuro/claro automático según preferencia del sistema
- Barra lateral de navegación con acceso a los módulos principales
- Componentes reutilizables basados en Shadcn UI

## 🔧 Instalación y uso local

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Construir para producción
pnpm build

# Vista previa de producción
pnpm preview
```

Asegúrate de tener pnpm instalado globalmente:

```bash
npm install -g pnpm
```

## 🌐 Integración con API (estado)

Base: `https://grupoheroicaapi.skillsuite.net/app/wssuite/api`  
Se utiliza autenticación token-based (JWT). El token se guarda en localStorage y se incluye en las llamadas mediante el servicio de API (interceptor).

Endpoints actualmente consumidos en producción / desarrollo:

- Autenticación (token)
- GetRooms, GetRoomRates, GetRoomsAvailability
- GetServices, GetServiceRates
- GetEvents, GetEventQuote, GetEventInvoices
- GetSalesAgents (coordinadores)
- GetEventStatuses, GetEventTypes, GetEventMarketSegments
- GetSchedules, GetEventCoordinators

Otros endpoints disponibles en la API (implementados parcialmente o en pruebas): EventCharacters, EventSectors, EventSizes, ReservationTypes/Uses, EventStages, ActivityTypes.

Nota: Las llamadas al API están centralizadas en `src/services` (ej. `api.service.ts`, `auth.service.ts`) con manejo de errores y reintentos básicos en desarrollo.

## Estructura relevante del proyecto (simplificada)

src/

- components/ (layout, ui)
- contexts/ (Theme, Auth)
- pages/ (Login, Dashboard, Eventos, EventoDetalle, Calendario, Salones, SalonesDisponibles, Inventario, Coordinadores, Clientes, Contactos, PersonalEventos, ParqueosEventos, ApiTest)
- services/ (auth.service.ts, api.service.ts, rooms.service.ts, events.service.ts, quotes.service.ts, invoices.service.ts)
- lib/ (utils)
- main.tsx, app.css

## Autenticación y seguridad

- Token JWT en localStorage (actualmente).
- Interceptor para adjuntar Authorization header en peticiones.
- Redirección automática al login si token inválido o expirado.
  (Se recomienda migrar a cookies seguras/refresh tokens en próximos sprints).

## Pendientes y roadmap corto

- Completar CRUD avanzado para Clientes y Contactos.
- Mejorar manejo de sesiones (refresh token / cookies seguras).
- Exportación de reportes (PDF/CSV).
- Implementar notificaciones en tiempo real (WebSocket/SignalR).
- Tests e2e y CI/CD básico.
- Optimización de carga y mejoras de accesibilidad.

## Contribución rápida

1. Crear una rama nueva desde main
2. Ejecutar pnpm install y pnpm dev
3. Seguir las convenciones de código (Prettier, ESLint)
4. Probar en modo claro/oscuro y en móvil

---

Desarrollado con Preact + TypeScript + Tailwind CSS. Si necesitas que actualice detalles concretos (por ejemplo: endpoints implementados, páginas nuevas o flujo de autenticación), indícame el punto y lo reflejo en el README.
