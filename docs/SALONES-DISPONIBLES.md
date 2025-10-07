# Módulo de Salones Disponibles

## Descripción

El módulo "Salones Disponibles" permite consultar qué salones están disponibles (sin ocupación) en un rango de fechas específico.

## Ubicación

- **Ruta:** `/salones-disponibles`
- **Componente:** `src/pages/SalonesDisponibles.tsx`
- **API Method:** `apiService.getAvailableRooms(startDate, endDate)`

## Funcionalidad

### Selector de Rango de Fechas

- Dos selectores de fecha (inicio y fin)
- Validación de que fecha inicio < fecha fin
- Formato de fecha: `yyyy-MM-dd`
- **Fix aplicado:** Corrección del desfase de zona horaria agregando `T00:00:00` al parsear fechas

### Lógica de Disponibilidad

El módulo determina si un salón está disponible verificando:

1. **Obtiene todos los salones** del sistema
2. **Obtiene todos los eventos** que se solapen con el rango de fechas
3. **Detecta solapamiento de fechas:**
   ```typescript
   const overlaps = eventStart <= requestEnd && eventEnd >= requestStart;
   ```
4. **Marca salones como ocupados** si tienen eventos asignados en el rango
5. **Filtra y retorna** solo salones:
   - NO ocupados en el rango
   - Con estado `roomActive = true`

### Correcciones Aplicadas

#### Problema 1: Salones ocupados aparecían como disponibles

**Causa:** No se verificaba si el evento se solapaba con el rango de fechas solicitado.

**Solución:** Implementada verificación de solapamiento de fechas:

```typescript
const requestStart = new Date(startDate + "T00:00:00");
const requestEnd = new Date(endDate + "T23:59:59");

const eventStart = new Date(event.startDate);
const eventEnd = new Date(event.endDate);

// Verificar solapamiento
const overlaps = eventStart <= requestEnd && eventEnd >= requestStart;
```

#### Problema 2: DatePicker seleccionaba día anterior

**Causa:** `new Date("2025-10-15")` se interpreta como UTC medianoche, que en zona horaria local puede ser el día anterior.

**Solución:** Agregar componente de tiempo para forzar zona horaria local:

```typescript
// Antes (incorrecto):
new Date(value); // "2025-10-15" → Oct 14 en zona -5

// Después (correcto):
new Date(value + "T00:00:00"); // "2025-10-15T00:00:00" → Oct 15
```

## Tabla de Resultados

Muestra los salones disponibles con:

- Nombre del salón
- Área (m²)
- Altura (m)
- Capacidad máxima
- Estado (Activo/Inactivo)
- Botón "Ver" para detalles

## Modal de Detalles

Al hacer clic en "Ver", muestra:

- Descripción del salón
- Dimensiones completas
- Montajes disponibles
- **Banner de disponibilidad** confirmando el rango de fechas

## Debugging

El método incluye logs en consola:

```
Disponibilidad de salones del 2025-10-15 al 2025-10-20:
- Total de salones: 25
- Salones ocupados: 8
- Salones disponibles: 17
```

## Navegación

- Acceso desde Sidebar: **"Salones Disponibles"**
- Icono: CalendarCheck
- Posición: Entre "Salones" e "Inventario"

## Casos de Uso

1. **Planificación de eventos:** Verificar disponibilidad antes de crear cotización
2. **Optimización de recursos:** Identificar salones subutilizados
3. **Resolución de conflictos:** Detectar salones alternativos para fechas solicitadas

## Validaciones

- ✅ Fecha de inicio requerida
- ✅ Fecha de fin requerida
- ✅ Fecha inicio <= Fecha fin
- ✅ Solo salones activos en resultados
- ✅ Verificación de solapamiento precisa

## Notas Técnicas

- Usa la misma tabla/modal que el módulo "Salones"
- Reutiliza componentes UI: DatePicker, Table, Dialog
- Implementa loading states y mensajes de estado
- Responsive design con grid adaptativo
