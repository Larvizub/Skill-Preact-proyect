# Filtros Avanzados del Módulo de Eventos

## Descripción General

El módulo de Eventos ahora cuenta con un sistema de filtros avanzados que permite buscar eventos de manera específica, evitando cargar todos los eventos de una vez y mejorando el rendimiento de la aplicación.

## Tipos de Filtros Disponibles

### 1. **Búsqueda por Rango de Fechas**

- **Cuándo usar**: Para ver todos los eventos dentro de un período específico
- **Cómo funciona**:
  - Selecciona una fecha de inicio
  - Selecciona una fecha de fin
  - Presiona "Buscar Eventos"
- **Ejemplo**: Ver todos los eventos del 1 de enero al 31 de marzo de 2025

### 2. **Búsqueda por ID del Evento**

- **Cuándo usar**: Cuando conoces el ID específico del evento que buscas
- **Cómo funciona**:
  - Cambia el selector a "ID del Evento"
  - Ingresa el ID o parte del ID del evento
  - Selecciona también un rango de fechas (requerido para acotar la búsqueda)
  - Presiona "Buscar Eventos"
- **Ejemplo**: Buscar evento con ID "12345" en los últimos 3 meses
- **Nota**: La búsqueda es parcial, por lo que "123" encontrará eventos con IDs como 123, 1234, 12345, etc.

### 3. **Búsqueda por Nombre del Evento**

- **Cuándo usar**: Cuando recuerdas parte del nombre del evento pero no el ID
- **Cómo funciona**:
  - Cambia el selector a "Nombre del Evento"
  - Ingresa el nombre o parte del nombre del evento
  - Selecciona también un rango de fechas (requerido para acotar la búsqueda)
  - Presiona "Buscar Eventos"
- **Ejemplo**: Buscar "Conferencia" encontrará "Conferencia Anual 2025", "Conferencia de Tecnología", etc.
- **Nota**: La búsqueda no distingue entre mayúsculas y minúsculas

## Características Principales

### ✅ **Búsqueda Bajo Demanda**

- Los eventos NO se cargan automáticamente al abrir la página
- Solo se consultan cuando presionas el botón "Buscar Eventos"
- Esto mejora significativamente el rendimiento y reduce la carga del servidor

### ✅ **Validación de Campos**

- El sistema valida que hayas completado los campos necesarios antes de buscar
- Muestra alertas si falta información requerida

### ✅ **Rango de Fechas por Defecto**

- Fecha inicio: Hoy
- Fecha fin: Dentro de 3 meses
- Puedes ajustar estas fechas según tus necesidades

### ✅ **Botón Limpiar**

- Restablece todos los filtros a sus valores por defecto
- Limpia los resultados de búsqueda anteriores
- Permite empezar una nueva búsqueda desde cero

### ✅ **Contador de Resultados**

- Muestra cuántos eventos se encontraron con los filtros aplicados
- Aparece justo después de realizar una búsqueda exitosa

### ✅ **Estados Visuales**

- **Sin buscar**: Muestra un mensaje invitando a usar los filtros
- **Buscando**: Muestra un spinner de carga
- **Sin resultados**: Muestra un mensaje amigable
- **Con resultados**: Muestra la tabla con los eventos encontrados

## Flujo de Trabajo Recomendado

### Escenario 1: Buscar eventos de un período específico

1. Mantén el filtro en "Rango de Fechas"
2. Ajusta las fechas de inicio y fin
3. Haz clic en "Buscar Eventos"

### Escenario 2: Buscar un evento específico por ID

1. Cambia el filtro a "ID del Evento"
2. Ingresa el ID del evento
3. Ajusta el rango de fechas si es necesario
4. Haz clic en "Buscar Eventos"

### Escenario 3: Buscar eventos por nombre

1. Cambia el filtro a "Nombre del Evento"
2. Ingresa palabras clave del nombre
3. Ajusta el rango de fechas si es necesario
4. Haz clic en "Buscar Eventos"

### Escenario 4: Empezar una nueva búsqueda

1. Haz clic en el botón "Limpiar" (icono X)
2. Los filtros volverán a sus valores por defecto
3. Configura los nuevos criterios de búsqueda

## Beneficios de Rendimiento

- ✅ **Carga Inicial Rápida**: La página se carga instantáneamente sin esperar datos
- ✅ **Consultas Específicas**: Solo se consultan los eventos que realmente necesitas
- ✅ **Menos Tráfico de Red**: Reduce la cantidad de datos transferidos
- ✅ **Mejor Experiencia de Usuario**: Búsquedas más rápidas y dirigidas

## Interacción con la Tabla de Resultados

Una vez que obtienes resultados:

- Los eventos se muestran en una tabla organizada
- Cada fila muestra: Nombre, Fecha Inicio, Fecha Fin, ID
- Haz clic en el botón "Ver" (icono de ojo) para ver detalles completos
- La cotización del evento se carga automáticamente al seleccionarlo
- La fila seleccionada se resalta con un fondo diferente

## Notas Importantes

⚠️ **Rango de Fechas Obligatorio**: Todas las búsquedas requieren un rango de fechas para acotar los resultados y mejorar el rendimiento.

⚠️ **Búsquedas Parciales**: Al buscar por ID o nombre, la búsqueda es parcial (encuentra coincidencias que contengan el texto ingresado).

⚠️ **Sin Autocarga**: A diferencia de la versión anterior, los eventos NO se cargan automáticamente. Esto es intencional para mejorar el rendimiento.

## Ejemplos de Uso

### Ejemplo 1: Ver eventos de la próxima semana

```
Filtro: Rango de Fechas
Fecha Inicio: 02/10/2025
Fecha Fin: 09/10/2025
→ Buscar Eventos
```

### Ejemplo 2: Buscar un evento específico

```
Filtro: ID del Evento
ID: 15234
Fecha Inicio: 01/01/2025
Fecha Fin: 31/12/2025
→ Buscar Eventos
```

### Ejemplo 3: Buscar eventos de un cliente

```
Filtro: Nombre del Evento
Nombre: Bodas García
Fecha Inicio: 01/10/2025
Fecha Fin: 31/12/2025
→ Buscar Eventos
```
