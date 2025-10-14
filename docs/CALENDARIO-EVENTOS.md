# Módulo: Calendario de Eventos — Documentación Actualizada

## Detalle del Modulo:

El módulo de Calendario muestra eventos mensuales con barras horizontales continuas que reflejan la duración real del evento y colores por estatus. Está diseñado para Preact + TypeScript (Vite), estilado con Tailwind CSS + Shadcn UI, gestionado con pnpm y con soporte automático de tema claro/oscuro.

Requisitos:

- date-fns para manejo de fechas
- API: https://grupoheroicaapi.skillsuite.net/app/wssuite/api (credenciales provistas por el crack de Douglas)

## Estructura de la Interfaz

- Barra superior: navegación de mes y leyenda de colores.
- Grid mensual: 7 columnas (Dom–Sáb) responsive.
- Cada celda: hasta MAX_VISIBLE_EVENTS eventos visibles y contador de overflow.
- Panel inferior o modal: lista detallada de eventos del día o todos los eventos si hay overflow.
- Diseño responsivo y accesible (teclado/aria).

## Integración con API (autenticación y endpoints relevantes)

Credenciales / URL base (proporcionadas por el equipo):

- Base URL: https://grupoheroicaapi.skillsuite.net/app/wssuite/api
- username: wsSk4Api
- password: 5qT2Uu!qIjG%$XeD
- companyAuthId: xudQREZBrfGdw0ag8tE3NR3XhM6LGa
- idData: 14

Endpoints principales usados por Calendario:

- GetEvents: (ver wiki interno) — obtiene eventos filtrados por rango (start, end)
- GetEventStatuses, GetEventTypes, GetEventCoordinators, GetSchedules — para metadatos y filtros
- GetEventQuote / GetEventInvoices — acceso a cotizaciones y facturas desde detalle de evento

Autenticación recomendada:

- Token con credenciales del ws; implementar reintento/autorefresh y almacenamiento seguro en memory/secure cookie.
- Agregar companyAuthId en headers cuando la API lo requiera (X-Company-Auth o según especificación interna).

## Modelo de Datos (esquema mínimo)

- id: string | number
- name: string
- startDate: ISO string
- endDate: ISO string
- status: string
- roomId?: string
- coordinatorId?: string
- metadata?: Record<string, any>

## Constantes de Configuración

- MAX_VISIBLE_EVENTS = 3
- WEEK_START = 0 // Domingo (configurable)
- DATE_FORMAT = 'yyyy-MM-dd'

## Mapeo de colores por estatus

Usar clases Tailwind (Shadcn-compatible). Mapear según estatus retornado por API (normalizar minúsculas y buscar keywords).

Ejemplo de mapeo actualizado:

```ts
const STATUS_COLOR_MAP: Record<string, string> = {
  confirmado: "bg-green-600",
  "por confirmar": "bg-yellow-500",
  opcion1: "bg-blue-400",
  opcion2: "bg-blue-500",
  opcion3: "bg-blue-600",
  "reunion interna": "bg-purple-500",
  "evento interno": "bg-indigo-500",
  cancelado: "bg-red-500",
  otros: "bg-gray-500",
};

function getEventStatusColor(status: string) {
  if (!status) return "bg-gray-500";
  const key = status.trim().toLowerCase();
  // Buscar coincidencias por palabra clave
  for (const k of Object.keys(STATUS_COLOR_MAP)) {
    if (key.includes(k)) return STATUS_COLOR_MAP[k];
  }
  return "bg-gray-500";
}
```

## Funciones clave (TypeScript / Preact)

1. Cargar eventos por mes

```ts
async function loadEventsForMonth(api: ApiService, currentDate: Date) {
  const start = format(startOfMonth(currentDate), DATE_FORMAT);
  const end = format(endOfMonth(currentDate), DATE_FORMAT);
  const events = await api.getEvents({ startDate: start, endDate: end });
  return events; // normalizar fechas a Date objects
}
```

2. Obtener eventos que abarcan una fecha

```ts
function getEventsSpanningDate(events: Event[], date: Date) {
  return events.filter((e) =>
    isWithinInterval(date, {
      start: parseISO(e.startDate),
      end: parseISO(e.endDate),
    })
  );
}
```

3. Calcular posición y span de una barra visible

```ts
function calculateEventPosition(
  event: Event,
  visibleMonthStart: Date,
  visibleMonthEnd: Date,
  currentCellDate: Date
) {
  const evStart = max([parseISO(event.startDate), visibleMonthStart]);
  const evEnd = min([parseISO(event.endDate), visibleMonthEnd]);
  const isStartDay = isSameDay(currentCellDate, evStart);
  const totalDays = differenceInCalendarDays(evEnd, evStart) + 1;
  const span = isStartDay
    ? Math.min(
        totalDays,
        differenceInCalendarDays(visibleMonthEnd, currentCellDate) + 1
      )
    : 0;
  return { isStartDay, span, totalDays };
}
```

4. Renderizado en grid

- Solo renderizar barra en el día que es start visible (isStartDay).
- Usar CSS grid + utility Tailwind: grid-column: span X (via style or utility).
- Para accesibilidad, cada barra debe tener aria-label con nombre y rango.

## Manejo de overflow

- Mostrar máximo MAX_VISIBLE_EVENTS en la celda.
- Si hay más, mostrar "+X Eventos" (botón) que abre modal/panel con lista completa.
- Suprimir renderizado de DOM de eventos no visibles para mejorar rendimiento.

## Interactividad y UX

- Hover: tooltip con nombre completo y rango (usar componente Tooltip de Shadcn).
- Click en barra: abrir panel lateral con detalle (coordinador, sala, cotización, facturas).
- Drag & Drop: plan futuro (guardar orden y nuevas fechas al soltar).
- Detección automática de tema: prefer-color-scheme media query y persistir preferencia del usuario.

## Performance

- Memoizar cálculos por mes (useMemo / signals / stores).
- Evitar map/filter costosos en render; preprocesar eventos en batches.
- Utilizar virtualization para listas largas en el panel de detalle.
- Date-fns para operaciones rápidas y tree-shaking friendly.

## Accesibilidad

- Teclas: navegar días con flechas, abrir detalles con Enter.
- Roles ARIA: role="grid", role="gridcell", aria-selected en día activo.
- Contraste del texto sobre color de barra: aplicar overlay o usar clase text-white/black según luminancia.

## Pruebas y QA

- Unit tests: calcular spans, color mapping, función de overflow.
- Integration: mock del API para calendarios multi-mes y eventos borde (inicio fuera del mes, fin fuera del mes).
- E2E: cubrir navegación mes a mes, apertura de detalles, contador de overflow.

## Ejemplo de ApiService (esqueleto)

```ts
class ApiService {
  base = "https://grupoheroicaapi.skillsuite.net/app/wssuite/api";

  async request(path: string, params = {}) {
    /* incluir auth headers, manejo errores */
  }

  async getEvents({
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }) {
    const res = await this.request("/GetEvents", { startDate, endDate });
    return res.events || [];
  }

  // otros métodos: getEventStatuses, getRooms, getServices...
}
```
