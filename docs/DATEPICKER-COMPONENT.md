# Componente DatePicker

## Descripción

El componente `DatePicker` es un selector de fechas visual e intuitivo que reemplaza el input nativo de HTML5. Proporciona una experiencia de usuario mejorada con un calendario interactivo que facilita la selección de fechas.

## Características Principales

### ✨ **Interfaz Visual**

- 📅 **Mini calendario desplegable** con vista mensual
- 🎯 **Resaltado del día actual** con borde
- ✅ **Indicador visual** de fecha seleccionada
- 🌙 **Compatible con tema oscuro/claro**

### 🎮 **Interactividad**

- ⬅️➡️ **Navegación por meses** con flechas
- 📍 **Botón "Hoy"** para selección rápida
- 👆 **Click fuera para cerrar** el calendario
- ⌨️ **Formato de fecha legible** (ej: "15 de octubre de 2025")

### 📱 **Responsive**

- Adaptable a diferentes tamaños de pantalla
- Calendario con ancho mínimo de 280px
- Posicionamiento absoluto inteligente

## Uso Básico

```tsx
import { DatePicker } from "../components/ui/datepicker";
import { Label } from "../components/ui/label";

function MiComponente() {
  const [fecha, setFecha] = useState("");

  return (
    <div className="grid gap-2">
      <Label htmlFor="fecha">Selecciona una fecha</Label>
      <DatePicker
        id="fecha"
        value={fecha}
        onInput={(e) => setFecha((e.target as HTMLInputElement).value)}
        placeholder="Selecciona una fecha"
      />
    </div>
  );
}
```

## Props

| Prop          | Tipo                      | Requerido | Default                  | Descripción                             |
| ------------- | ------------------------- | --------- | ------------------------ | --------------------------------------- |
| `id`          | `string`                  | No        | -                        | ID del elemento para vincular con Label |
| `value`       | `string`                  | No        | `""`                     | Fecha en formato ISO (YYYY-MM-DD)       |
| `onInput`     | `(e: Event) => void`      | No        | -                        | Callback cuando cambia la fecha         |
| `onChange`    | `(value: string) => void` | No        | -                        | Callback alternativo con valor directo  |
| `className`   | `string`                  | No        | -                        | Clases CSS adicionales                  |
| `placeholder` | `string`                  | No        | `"Selecciona una fecha"` | Texto cuando no hay fecha               |

## Formato de Fecha

### Valor de Entrada/Salida

- **Formato**: `YYYY-MM-DD` (ISO 8601)
- **Ejemplo**: `"2025-10-15"`
- Compatible con el formato estándar de HTML5 date input

### Visualización

- **Formato**: Texto legible en español
- **Ejemplo**: `"15 de octubre de 2025"`
- Usa `toLocaleDateString("es-ES")` para formato local

## Ejemplos de Uso

### Ejemplo 1: Fecha Simple

```tsx
<DatePicker
  id="fechaNacimiento"
  value={fechaNacimiento}
  onInput={(e) => setFechaNacimiento((e.target as HTMLInputElement).value)}
/>
```

### Ejemplo 2: Con onChange

```tsx
<DatePicker
  id="fechaEvento"
  value={fechaEvento}
  onChange={(value) => setFechaEvento(value)}
  placeholder="¿Cuándo es el evento?"
/>
```

### Ejemplo 3: Rango de Fechas

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="grid gap-2">
    <Label htmlFor="inicio">Fecha Inicio</Label>
    <DatePicker
      id="inicio"
      value={fechaInicio}
      onInput={(e) => setFechaInicio((e.target as HTMLInputElement).value)}
    />
  </div>
  <div className="grid gap-2">
    <Label htmlFor="fin">Fecha Fin</Label>
    <DatePicker
      id="fin"
      value={fechaFin}
      onInput={(e) => setFechaFin((e.target as HTMLInputElement).value)}
    />
  </div>
</div>
```

## Interacción del Usuario

### Abrir el Calendario

1. **Click en el campo**: Abre/cierra el calendario
2. **Click en el icono**: También abre/cierra

### Navegación

1. **Flecha izquierda (◀)**: Mes anterior
2. **Flecha derecha (▶)**: Mes siguiente
3. **Click en día**: Selecciona y cierra
4. **Botón "Hoy"**: Selecciona fecha actual y cierra

### Cerrar el Calendario

1. **Seleccionar una fecha**: Cierra automáticamente
2. **Click fuera del calendario**: Cierra sin cambios
3. **Botón "Hoy"**: Cierra después de seleccionar

## Características Visuales

### Día Actual

- **Borde primario**: Indica el día de hoy
- Se mantiene visible aunque no esté seleccionado

### Día Seleccionado

- **Fondo primario**: Color de fondo completo
- **Texto en contraste**: Color de texto invertido
- Fácil de identificar en cualquier mes

### Estados Hover

- **Días**: Fondo de acento al pasar el cursor
- **Botones de navegación**: Efecto hover suave
- **Botón "Hoy"**: Efecto de oscurecimiento al hover

## Layout del Calendario

```
┌─────────────────────────────────┐
│  ◀  octubre de 2025  ▶         │ ← Header con navegación
├─────────────────────────────────┤
│ D  L  M  X  J  V  S            │ ← Días de semana
│                1  2  3  4  5   │
│ 6  7  8  9 [10] 11 12          │ ← [10] = Hoy
│13 14 ⦿15 16 17 18 19           │ ← ⦿15 = Seleccionado
│20 21 22 23 24 25 26            │
│27 28 29 30 31                  │
├─────────────────────────────────┤
│          [ Hoy ]                │ ← Botón acción rápida
└─────────────────────────────────┘
```

## Integración con Formularios

### Con React Hook Form

```tsx
import { Controller } from "react-hook-form";

<Controller
  name="fecha"
  control={control}
  render={({ field }) => (
    <DatePicker id="fecha" value={field.value} onChange={field.onChange} />
  )}
/>;
```

### Validación Manual

```tsx
const handleSubmit = () => {
  if (!fecha) {
    alert("Por favor selecciona una fecha");
    return;
  }

  const selectedDate = new Date(fecha);
  const today = new Date();

  if (selectedDate < today) {
    alert("La fecha debe ser futura");
    return;
  }

  // Procesar formulario
};
```

## Compatibilidad

- ✅ **Preact**: Totalmente compatible
- ✅ **TypeScript**: Tipado completo
- ✅ **Tailwind CSS**: Estilos integrados
- ✅ **Shadcn UI**: Sigue los patrones de diseño
- ✅ **Tema oscuro**: Auto-adaptable

## Ventajas vs Input Nativo

| Característica      | Input Nativo             | DatePicker          |
| ------------------- | ------------------------ | ------------------- |
| Visual consistente  | ❌ Varía por navegador   | ✅ Igual en todos   |
| Calendario visual   | 🔶 Depende del navegador | ✅ Siempre visible  |
| Navegación de meses | 🔶 Variable              | ✅ Flechas claras   |
| Botón "Hoy"         | ❌ No disponible         | ✅ Incluido         |
| Formato legible     | ❌ YYYY-MM-DD            | ✅ Texto en español |
| Tema oscuro         | 🔶 Inconsistente         | ✅ Perfecto         |
| Móvil               | ✅ Nativo                | ✅ Responsive       |

## Accesibilidad

- ✅ **Labels vinculados**: Usa `htmlFor` e `id`
- ✅ **aria-label**: En botones de navegación
- ✅ **Keyboard**: Compatible con Tab
- ✅ **Focus**: Anillos visibles en foco
- ⚠️ **Navegación por teclado**: A implementar en futuro

## Limitaciones Actuales

1. **Sin navegación por teclado completa**: No se puede navegar con flechas del teclado (próxima versión)
2. **Sin restricciones de fechas**: No tiene min/max date (se puede añadir si es necesario)
3. **Sin selección de rango**: Solo fecha individual (para rangos usar dos DatePickers)

## Próximas Mejoras

- [ ] Navegación con teclado (arrows, Enter, Escape)
- [ ] Props `minDate` y `maxDate` para restricciones
- [ ] Selector de año rápido (dropdown)
- [ ] Animaciones de transición entre meses
- [ ] Modo "rango" para selección de inicio y fin
- [ ] Presets comunes (Última semana, Último mes, etc.)

## Casos de Uso

### ✅ Perfecto para:

- Formularios de eventos
- Filtros de búsqueda por fecha
- Selección de fechas de reserva
- Planificación de tareas
- Cualquier selección de fecha individual

### ⚠️ No recomendado para:

- Selección de hora (solo fecha)
- Rangos de fechas complejos (usar dos componentes)
- Fechas muy lejanas (mejor input de año primero)

## Soporte

Si encuentras problemas o tienes sugerencias:

1. Verifica que `lucide-preact` esté instalado
2. Asegúrate de que Tailwind CSS esté configurado
3. Revisa que el componente esté importado correctamente
4. Verifica el formato de fecha (debe ser YYYY-MM-DD)
