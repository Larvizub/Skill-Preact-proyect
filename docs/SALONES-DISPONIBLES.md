# Salones Disponibles — Documentación actualizada

## 📍 Resumen

El módulo muestra salones que no están ocupados en un rango de fechas dado y evita falsos positivos debido a problemas de zona horaria. Componente principal: `src/pages/SalonesDisponibles.tsx`.

## 🛠️ Comportamiento y flujo

1. Usuario selecciona `startDate` y `endDate` (formato `yyyy-MM-dd`).
2. El sistema convierte las fechas a rangos locales: `startDate + 'T00:00:00'` y `endDate + 'T23:59:59'` para evitar desfases por zona horaria.
3. Se solicita la lista de eventos y salones al backend (`apiService.getRooms()` y `apiService.getEvents({ startDate, endDate })`).
4. Se marca un salón como ocupado si existe al menos un evento que solape:

```ts
const requestStart = new Date(startDate + "T00:00:00");
const requestEnd = new Date(endDate + "T23:59:59");
const eventStart = new Date(event.startDate);
const eventEnd = new Date(event.endDate);
const overlaps = eventStart <= requestEnd && eventEnd >= requestStart;
```

5. Resultado: lista filtrada de salones con `roomActive === true` y que **no** tienen solapamiento en el rango.

## ✅ Validaciones

- `startDate` y `endDate` son obligatorios.
- `startDate` <= `endDate`.
- Mostrar mensajes claros si no hay salones disponibles.

## UI y detalles

- Tabla con columnas: Nombre, Área (m²), Altura, Capacidad, Estado, Acciones.
- Botón `Ver` abre modal con: descripción, dimensiones, montajes y banner de disponibilidad.
- Loading states y mensajes (No results / Error) para buena UX.

## Debugging y buenas prácticas

- Añadir logs durante la fase de desarrollo para ver conteos y rangos:

```
console.info(`Disponibilidad ${startDate} → ${endDate}: total ${rooms.length}, ocupados ${occupiedCount}, disponibles ${availableCount}`)
```

- Añadir tests unitarios para la función de solapamiento (edge cases: inicio/fin en el límite, eventos de un día, eventos multimensuales).

## Recomendaciones futuras

- Cachear resultados de `getRooms()` porque suelen cambiar poco.
- Permitir búsqueda por ubicación/área para filtrar resultados.
- Mostrar overlay en caso de salones con disponibilidad parcial (eventos que no ocupan todo el rango).

---

¿Quieres que agregue tests unitarios de ejemplo para la lógica de solapamiento? Puedo crear un pequeño archivo `src/lib/availability.test.ts` y añadirlo al pipeline de CI. ✅
