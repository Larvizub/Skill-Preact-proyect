# Calendario de Eventos — Implementación y buenas prácticas (actualizado)

## 📌 Componentes principales

- **Componente:** `src/pages/Calendario.tsx` (vista principal del calendario).
- **Dependencias:** `date-fns` para cálculos de fecha.
- **Estilos:** Tailwind CSS + Shadcn UI.

## 🧭 Comportamiento actual

- Vista mensual con 7 columnas (Dom–Sáb).
- Cada evento se muestra como una barra horizontal que representa su duración real (puede abarcar días fuera del mes visible).
- Se muestran hasta `MAX_VISIBLE_EVENTS` por celda; si hay overflow aparece un botón `+X Eventos` que abre modal con la lista completa.

## ⚙️ Integración con API

- Carga datos mediante `apiService.getEvents({ startDate, endDate })`.
- Metadatos (estatus, tipos, coordinadores) vienen de endpoints como `GetEventStatuses`, `GetEventTypes`, `GetEventCoordinators`.
- Recomendación: pedir todos los metadatos al cargar el módulo y cachearlos durante la sesión para evitar llamadas repetidas.

## Cálculos clave (resumen)

- Normaliza las fechas del API a objetos `Date` usando `parseISO`.
- Para evitar problemas de zona horaria, parsear fechas completas o forzar `T00:00:00`/`T23:59:59` cuando sea apropiado.
- `calculateEventPosition` determina en qué celda se renderiza la barra (día de inicio visible) y el `span` (número de días consecutivos que ocupa en la vista).

Ejemplo (simplificado):

```ts
const start = parseISO(event.startDate);
const end = parseISO(event.endDate);
const isStartDay = isSameDay(cellDate, max([start, visibleMonthStart]));
const span = calculateSpan(start, end, visibleMonthEnd);
```

## Mapas de color y accesibilidad

- Usa un mapeo central `STATUS_COLOR_MAP` y función `getEventStatusColor(status)` para mantener consistencia visual.
- Asegúrate de contraste: usa `text-white` o `text-black` según luminancia y agrega `aria-label` con nombre y rango.

## Performance

- Memoiza el resultado de `loadEventsForMonth` por mes para evitar recalcular en cada render.
- No renderices eventos ocultos (usar `MAX_VISIBLE_EVENTS`).
- Cuando el modal de día muestra muchas entradas, aplica virtualización para listas largas.

## Tests recomendados

- Unit: `calculateEventPosition`, `getEventStatusColor`, detección de eventos que abarcan días fuera del mes.
- Integration: cargar varios meses y validar renderizado de spans y overflow.
- E2E: navegación mes a mes, apertura de detalles, creación/edición básica (si aplica).

## UX y accesibilidad

- Navegación por teclado: flechas para moverse por días; Enter para abrir detalles.
- Roles ARIA: `role="grid"`, `role="gridcell"` y `aria-selected` en la celda activa.
- Tooltips: mostrar nombre completo y rango en hover/focus.

---

Si quieres, agrego fragmentos de tests unitarios de ejemplo (jest/tsx) o un ejemplo de snapshot del DOM para una semana con eventos cruzados. ✅```
