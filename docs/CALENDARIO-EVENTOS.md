# Calendario de Eventos - Visualización Mejorada

## Descripción

El módulo de Calendario ha sido mejorado para mostrar los eventos como barras continuas que se extienden a lo largo de los días que duran, con colores diferenciados según el estatus del evento.

## Características Implementadas

### 1. Barras de Eventos Continuas

Los eventos ahora se muestran como barras horizontales que:

- Se extienden a lo largo de múltiples días cuando el evento dura más de un día
- Se muestran visualmente sobre las celdas del calendario
- Ocupan el ancho correspondiente al número de días que duran
- Son clicables para ver más detalles

### 2. Codificación de Colores por Estatus

Cada evento tiene un color específico según su estatus:

| Estatus             | Color       | Clase CSS       |
| ------------------- | ----------- | --------------- |
| **Confirmado**      | Verde       | `bg-green-600`  |
| **Por Confirmar**   | Amarillo    | `bg-yellow-500` |
| **Opción 1**        | Azul claro  | `bg-blue-400`   |
| **Opción 2**        | Azul medio  | `bg-blue-500`   |
| **Opción 3**        | Azul oscuro | `bg-blue-600`   |
| **Reunión Interna** | Púrpura     | `bg-purple-500` |
| **Evento Interno**  | Índigo      | `bg-indigo-500` |
| **Cancelado**       | Rojo        | `bg-red-500`    |
| **Otros**           | Gris        | `bg-gray-500`   |

### 3. Leyenda de Colores

Se agregó una leyenda visual en la parte superior del calendario que muestra:

- Todos los posibles estatus
- El color asociado a cada estatus
- Una referencia rápida para el usuario

### 4. Vista de Detalles Mejorada

Cuando se selecciona un día:

- Los eventos se muestran en una lista debajo del calendario
- Cada evento muestra una barra de color lateral indicando su estatus
- Se incluye un indicador de color junto al nombre del estatus
- Se muestra el rango completo de fechas del evento

### 5. Gestión de Overflow de Eventos

Para mantener una interfaz limpia y evitar sobrecarga visual:

- **Límite de eventos visibles**: Se muestran máximo 3 eventos por día
- **Contador de overflow**: Si hay más de 3 eventos, se muestra "**+ X Eventos**"
- **Interacción**: Al hacer clic en el contador o en el día, se abre el panel de detalles con todos los eventos
- **Constante configurable**: `MAX_VISIBLE_EVENTS = 3` puede ajustarse según necesidades

**Beneficios:**

- Previene que las barras de eventos se salgan de las celdas del calendario
- Mantiene una vista de calendario limpia y organizada
- Los usuarios pueden ver fácilmente cuántos eventos adicionales hay
- Mejora el rendimiento al limitar elementos DOM renderizados

## Funciones Principales

### `getEventStatusColor(event: Event)`

Determina el color que debe tener la barra del evento según su estatus.

**Parámetros:**

- `event`: Objeto del evento que contiene la información del estatus

**Retorna:**

- String con la clase CSS del color (`bg-green-500`, `bg-yellow-500`, etc.)

**Lógica:**

```typescript
- Busca palabras clave en el nombre del estatus
- Retorna el color correspondiente
- Si no coincide con ninguna categoría, retorna gris
```

### `getEventsSpanningDate(date: Date)`

Obtiene todos los eventos que abarcan una fecha específica.

**Parámetros:**

- `date`: Fecha a verificar

**Retorna:**

- Array de eventos que incluyen esa fecha en su rango

**Uso:**

```typescript
const spanningEvents = getEventsSpanningDate(day);
```

### `calculateEventPosition(event: Event, date: Date)`

Calcula la posición y el ancho de la barra del evento en el calendario.

**Parámetros:**

- `event`: Evento a posicionar
- `date`: Fecha actual del día en el calendario

**Retorna:**

```typescript
{
  isStartDay: boolean,    // Si este día es el inicio visible del evento
  span: number,           // Cuántos días abarca desde este día
  totalDays: number       // Total de días que dura el evento
}
```

**Lógica:**

- Determina si el evento comienza en este día o antes
- Calcula cuántos días se extiende desde este punto
- Considera los límites del mes actual
- Asegura que las barras no se extiendan más allá del mes visible

## Comportamiento Visual

### Eventos de un Solo Día

- Se muestran como una barra que ocupa solo una celda
- Color según su estatus
- Texto truncado si el nombre es muy largo

### Eventos Multi-Día

- La barra comienza en el día de inicio
- Se extiende horizontalmente a través de los días
- Si cruza el fin de semana, continúa en la siguiente fila
- Si comienza antes del mes, la barra aparece desde el día 1
- Si termina después del mes, la barra se extiende hasta el último día

### Interactividad

- Hover sobre la barra muestra tooltip con:
  - Nombre completo del evento
  - Rango de fechas completo
- Click en la barra o en el día selecciona ese día
- Los eventos del día seleccionado se muestran en detalle abajo

## Estructura del Layout

```
┌─────────────────────────────────────┐
│  ← [Mes Año] →          [Leyenda]   │
├─────────────────────────────────────┤
│  Dom Lun Mar Mié Jue Vie Sáb        │
├─────────────────────────────────────┤
│  [1] [2] [3] [4] [5] [6] [7]        │
│       ▓▓▓▓▓▓▓▓▓▓▓▓ Evento 1         │
│  [8] [9] [10][11][12][13][14]       │
│  ▓▓▓▓▓▓▓ Evento 2                    │
│       ▓▓▓ Evento 3                   │
│  ...                                 │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Eventos del [Fecha Seleccionada]   │
│  ▌ Evento 1 - [Detalles]            │
│  ▌ Evento 2 - [Detalles]            │
└─────────────────────────────────────┘
```

## Consideraciones Técnicas

### Renderizado

- Los eventos se procesan para cada día del calendario
- Solo se renderizan barras en el día de inicio visible
- El ancho de las barras se calcula dinámicamente
- Se usa `grid-column: span X` para extender las barras

### Performance

- Filtrado eficiente usando `isWithinInterval` de date-fns
- Cálculo de posición solo cuando es necesario
- Re-renderizado optimizado al cambiar de mes

### Responsividad

- El calendario se adapta al tamaño de pantalla
- Las barras mantienen proporciones correctas
- Texto truncado automáticamente en espacios pequeños

## Mejoras Futuras Sugeridas

1. **Drag & Drop**: Permitir arrastrar eventos para cambiar fechas
2. **Vista Semanal**: Agregar vista de semana además de la mensual
3. **Filtros**: Filtrar eventos por estatus o categoría
4. **Exportación**: Exportar calendario a formatos iCal o PDF
5. **Colores Personalizables**: Permitir al usuario configurar colores por estatus
6. **Vista de Agenda**: Lista cronológica de todos los eventos
7. **Recordatorios**: Notificaciones de eventos próximos

## Ejemplo de Uso

El calendario carga automáticamente los eventos del mes actual al iniciar:

```typescript
// Al cambiar de mes
const loadEvents = async () => {
  const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
  const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
  const data = await apiService.getEvents(start, end);
  setEvents(data);
};
```

Los eventos se muestran automáticamente con sus colores correspondientes según el estatus que traigan del API.
