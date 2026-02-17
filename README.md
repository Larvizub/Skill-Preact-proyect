# Skill Platform (Preact)

Plataforma web para operación de eventos (Skill Suite) con módulos de consulta operativa, calendario, salones, inventario y CRM.

Este README describe el estado **actual** de la aplicación según el código en `src/`.

## Stack

- Vite + Preact + TypeScript
- Tailwind CSS + componentes UI propios tipo shadcn
- `preact-router`
- `date-fns`
- `firebase` (Realtime Database para CRM)
- `xlsx` (reportes Excel)
- `sonner` (toasts)
- PWA básica con Service Worker (`public/service-worker.js`)

## Funcionalidades actuales

### 1) Autenticación y contexto de recinto

- Login por token contra Skill (`/authenticate`).
- Selección de recinto: `CCCR`, `CCCI`, `CEVP`.
- Persistencia en `localStorage` de token y recinto (`skill_auth_token`, `skill_recinto`, `skill_id_data`).
- Cierre de sesión desde sidebar.

### 2) Navegación y UX base

- Layout con sidebar colapsable en móvil.
- Tema claro/oscuro con detección y persistencia.
- Navegación por módulos: Dashboard, Calendario, CRM, Eventos, Consultas, Salones, Inventario, Clientes, Contactos, Coordinadores, Configuración.
- Interfaz responsiva para escritorio y móvil.

### 3) Dashboard

- KPIs por mes con navegación mensual (anterior/siguiente).
- Carga de eventos por mes con cache/prefetch de mes previo.
- Filtros por estatus del evento.
- Métricas de ocupación/tendencia y totales de cotización.

### 4) Eventos

- Búsqueda por rango de fechas o por número de evento.
- Filtros por estatus y segmento de mercado.
- Dedupe de eventos y normalización de rango real usando actividades/salones.
- Exportación de reporte Excel de resultados.
- Acceso a detalle de evento y formulario de creación de evento.

### 5) Detalle de evento y creación de evento

- Vista detallada con datos generales, actividades, salones, servicios, cotización e invoices.
- Edición de evento (campos comerciales/operativos) con catálogos dinámicos.
- Conteo regresivo para eventos en estatus de opción (`Opción 1/2/3`) basado en fecha de creación.
- Alta de eventos (`CrearEventoDetalle`) con carga de catálogos y búsqueda de cliente/contacto.

### 6) Consulta de servicios (`Consultas`)

- Búsqueda de eventos por rango o ID.
- Filtro por categoría/subcategoría de servicio.
- Filtro por estatus del evento (píldoras).
- Vista de eventos encontrados + desglose por servicio/actividad.
- Totales (cantidad, descuento, TNI y total) y exportación a Excel.

### 7) Calendario

- Tres vistas: mensual, por salones (gantt) y diaria.
- Filtros por estatus y segmento.
- Navegación por mes y selección de fecha.
- Cache de retorno para preservar contexto al volver al calendario.
- Integración con schedules por evento para visualizaciones de tiempo.

### 8) Salones y disponibilidad

- Catálogo de salones con detalle y estado.
- Carga de tarifas de salón (`GetRoomRates`) con estrategia de fallback.
- Exportación de reportes Excel (general y totales).
- Consulta de salones disponibles por rango:
  - Usa `GetRoomsAvailability` cuando hay datos.
  - Fallback por cruce de eventos/schedules cuando no hay disponibilidad directa.

### 9) Inventario

- Listado de servicios con búsqueda por nombre.
- Paginación local.
- Detalle modal del servicio (categoría, códigos, precios, estado).

### 10) Clientes, Contactos y Coordinadores

- Búsqueda manual para evitar carga inicial innecesaria (clientes/contactos).
- Tablas con paginación y modal de detalle.
- Coordinadores con carga directa y filtro por nombre.

### 11) CRM (Firebase Realtime Database)

- Gestión de oportunidades por base asociada al recinto (`CCCR/CCCI/CEVP`).
- Suscripción en tiempo real a oportunidades y timeline.
- Cambio de etapa, notas y eliminación.
- Enlace de oportunidad con evento Skill (actualiza etapa `cotizadoSkill`).
- Cálculo y asociación de monto cotizado desde Skill al enlazar evento.
- Consulta de oportunidades con filtros de negocio (proceso, etapa, propietario, segmento, territorio).
- Alta y edición de oportunidad con formulario por secciones (`oportunidadesForm`).

### 12) Configuración y diagnóstico

- `Configuracion`: módulo placeholder (en preparación).
- `ApiTest`: herramienta de diagnóstico para probar conectividad y endpoints de autenticación.

## Rutas actuales

- `/` y `/login` → Login
- `/dashboard`
- `/eventos`
- `/eventos/crear`
- `/eventos/:eventNumber`
- `/consultas`
- `/calendario`
- `/salones`
- `/salones-disponibles`
- `/inventario`
- `/clientes`
- `/contactos`
- `/coordinadores`
- `/crm`
- `/crm/oportunidades`
- `/crm/oportunidades/crear`
- `/crm/oportunidades/:opportunityId`
- `/configuracion`
- `/api-test`

## Integraciones de datos

### Skill API (módulo `src/services/api`)

Incluye servicios para:

- Eventos (`GetEvents`, `GetEventQuote`, `GetEventInvoices`, alta/edición)
- Salones (`GetRooms`, `GetRoomRates`, `GetRoomsAvailability`)
- Servicios e inventario (`GetServices`, `GetServiceRates`)
- Schedules (`GetSchedules`)
- Actividades (alta/actualización de actividad, salón y servicio en actividad)
- Clientes y contactos (`GetClients`, `GetContacts`, `AddClient`)
- Catálogos lookup (tipos, segmentos, estatus, coordinadores, tamaños, sectores, subtipos, etc.)

### Firebase (módulo CRM)

- Configuración por variables `VITE_FIREBASE_*`.
- Soporte de múltiples Realtime Database URLs por recinto:
  - `VITE_FIREBASE_DATABASE_URL_CCCR`
  - `VITE_FIREBASE_DATABASE_URL_CCCI`
  - `VITE_FIREBASE_DATABASE_URL_CEVP`

## Scripts

```bash
pnpm dev        # desarrollo local
pnpm build      # build producción
pnpm preview    # preview local del build
pnpm deploy     # build + deploy a Firebase Hosting
```

## Ejecución local

1. Instala dependencias:

```bash
pnpm install
```

2. Configura variables de entorno en `.env` (API y Firebase).

3. Inicia en modo desarrollo:

```bash
pnpm dev
```

## Estado general

- Aplicación funcional para operación diaria en consulta de eventos/servicios/salones y CRM.
- `Configuracion` permanece como módulo pendiente de implementación funcional.
