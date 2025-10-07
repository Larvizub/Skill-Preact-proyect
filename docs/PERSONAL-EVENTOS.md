# Módulo Personal de Eventos

## Descripción

Módulo para consultar y visualizar el personal asignado a eventos en la plataforma Skill.

## Ubicación

- **Ruta**: `/personal-eventos`
- **Archivo**: `src/pages/PersonalEventos.tsx`
- **Menú**: Aparece en la barra lateral como "Personal Eventos" con el ícono UsersRound

## Funcionalidades

### 1. Búsqueda de Eventos

El módulo permite buscar eventos de tres formas diferentes:

#### Por Mes

- Selector de mes (formato YYYY-MM)
- Inicializado automáticamente con el mes actual
- Busca todos los eventos en el mes seleccionado

#### Por Nombre

- Campo de texto libre
- Búsqueda parcial (insensible a mayúsculas)
- Soporta rangos progresivos de búsqueda (1, 2 y 5 años)

#### Por ID

- Campo numérico
- Búsqueda directa por idEvent

### 2. Visualización del Evento

Una vez encontrado el evento, se muestra:

- Título del evento
- ID del evento (idEvent)
- Número del evento (eventNumber)
- Fecha de inicio (startDate)
- Fecha de fin (endDate)

### 3. Tabla de Personal

La tabla muestra el personal agrupado por tipo de servicio:

#### Tipos de Personal Detectados

- **Auxiliar de Limpieza** (incluye variantes: "Auxiliar de Aseo")
- **Auxiliar de Montajes**
- **Oficial Gestión de la Protección**

#### Columnas de la Tabla

1. **Tipo de Personal**: Nombre normalizado del servicio
2. **Cantidad Total**: Suma de todas las cantidades del personal en todas las actividades
3. **Precio Unitario (TNI)**: Precio promedio sin impuestos
4. **Total Cotización (TNI)**: Total sin impuestos (cantidad × precio)
5. **Total Cotización (TI)**: Total con impuestos incluidos

#### Fila de Totales

- Muestra la suma de todos los tipos de personal
- Resaltada con fondo gris
- **Cantidad Total**: Total de personas
- **Total Cotización (TNI)**: Monto total sin impuestos
- **Total Cotización (TI)**: Monto total con impuestos

## Lógica de Procesamiento

### Extracción de Datos

1. Se recorren todas las actividades del evento
2. En cada actividad, se analiza el array `services`
3. Se filtran solo los servicios que contengan palabras clave de personal:
   - "auxiliar de limpieza"
   - "auxiliar de montajes"
   - "oficial gestion de la proteccion"
   - "oficial gestión de la protección"
   - "auxiliar de aseo"

### Normalización de Nombres

Los nombres de los servicios se normalizan para agruparlos correctamente:

- Todas las variantes de limpieza → "Auxiliar de Limpieza"
- Todas las variantes de montajes → "Auxiliar de Montajes"
- Todas las variantes de protección → "Oficial Gestión de la Protección"

### Cálculo de Totales

Para cada tipo de personal:

- **Cantidad Total**: Suma de `service.quantity` de todas las actividades
- **Precio TNI**: `service.priceTNI`
- **Precio TI**: `service.priceTI`
- **Total TNI**: `Σ(service.priceTNI × service.quantity)`
- **Total TI**: `Σ(service.priceTI × service.quantity)`

## Formato de Moneda

Los precios se formatean con:

- Locale: `es-CR` (Costa Rica)
- Moneda: USD (Dólar Americano)
- Decimales: 2 dígitos mínimos

## Manejo de Errores

- Si no se encuentra el evento: Alerta informativa
- Si el evento no tiene actividades: Mensaje "No se encontró personal asignado"
- Si ocurre un error en el API: Mensaje de error genérico

## Ejemplo de Uso

### Evento "Blockchain 2025" (ID: 5256)

Actividades con personal:

- **Jueves 6 Nov**: 1 Auxiliar Limpieza, 1 Auxiliar Montajes, 1 Oficial Protección
- **Viernes 7 Nov**: 10 Auxiliares Limpieza, 6 Auxiliares Montajes, 10 Oficiales Protección
- **Sábado 8 Nov**: 10 Auxiliares Limpieza, 6 Auxiliares Montajes, 10 Oficiales Protección
- **Domingo 9 Nov (Desmontaje)**: 10 Auxiliares Limpieza, 6 Auxiliares Montajes, 10 Oficiales Protección
- **Lunes 10 Nov**: 3 Auxiliares Limpieza, 1 Auxiliar Montajes, 1 Oficial Protección
- **Domingo 9 Nov (Evento)**: 10 Auxiliares Limpieza, 6 Auxiliares Montajes, 10 Oficiales Protección

**Resultado Esperado:**
| Tipo de Personal | Cantidad Total | Precio Unit (TNI) | Total TNI | Total TI |
|-----------------|----------------|-------------------|-----------|----------|
| Auxiliar de Limpieza | 44 | $78-104 | ~$3,848 | ~$4,346 |
| Auxiliar de Montajes | 26 | $97.76-98 | ~$2,543 | ~$2,873 |
| Oficial Gestión Protección | 42 | $127.92-152 | ~$5,772 | ~$6,522 |
| **TOTALES** | **112** | - | **~$12,163** | **~$13,741** |

## Mejoras Futuras

- [ ] Soportar múltiples eventos simultáneamente
- [ ] Exportar a Excel/PDF
- [ ] Filtrar por tipo de personal
- [ ] Desglose detallado por actividad
- [ ] Gráficos de distribución del personal
