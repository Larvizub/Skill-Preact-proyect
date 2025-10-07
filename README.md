# Skill Platform - Plataforma de Gestión de Eventos

Plataforma web desarrollada con **Vite + Preact + TypeScript** para la gestión y consulta de eventos, integrando con la API de Skill Suite.

## 🚀 Tecnologías

- **Preact** - Framework ligero de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos utility-first
- **Shadcn UI** - Componentes UI personalizados
- **Lucide Preact** - Iconos
- **Preact Router** - Enrutamiento
- **date-fns** - Manipulación de fechas

## 📋 Características

### Módulos Implementados

La lista a continuación refleja los módulos actuales en `src/pages` del proyecto y una breve descripción de cada uno.

1. **Login** (`Login.tsx`) - Página de autenticación y flujo de inicio de sesión.
2. **Dashboard** (`Dashboard.tsx`) - Vista general con KPIs, tendencias y tarjetas de resumen.
3. **Eventos** (`Eventos.tsx`) - Búsqueda y listado de eventos con filtros y accesos a detalle.
4. **Evento Detalle** (`EventoDetalle.tsx`) - Vista detallada de un evento con actividades, servicios y facturas.
5. **Calendario** (`Calendario.tsx`) - Vista mensual tipo calendario con conteo y filtros por estatus/segmento.
6. **Salones** (`Salones.tsx`) - Gestión y visualización de salones y sus características.
7. **Salones Disponibles** (`SalonesDisponibles.tsx`) - Búsqueda de disponibilidad de salones por rango de fechas.
8. **Personal Eventos** (`PersonalEventos.tsx`) - Módulo para revisar asignaciones y costos de personal por actividad.
9. **Parqueos Eventos** (`ParqueosEventos.tsx`) - Desglose por actividades de parqueos y servicios relacionados.
10. **Inventario** (`Inventario.tsx`) - Catálogo de artículos y servicios disponibles para cotización.
11. **Coordinadores** (`Coordinadores.tsx`) - Lista y gestión de coordinadores de cuenta / agentes de ventas.
12. **Clientes** (`Clientes.tsx`) - Gestión básica de clientes y contactos asociados.
13. **Contactos** (`Contactos.tsx`) - Gestión de contactos relacionados con clientes y eventos.
14. **ApiTest** (`ApiTest.tsx`) - Página para pruebas rápidas y debug de llamadas al API.

Si falta algún módulo (por ejemplo importaciones nuevas en `src/pages`), házmelo saber y lo añado aquí.

### Características UI/UX

- ✅ Diseño responsivo (móvil y escritorio)
- ✅ Tema oscuro/claro automático
- ✅ Navegación lateral intuitiva
- ✅ Componentes reutilizables basados en Shadcn UI

## 🔧 Instalación

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

## 🌐 API de Conexión

La plataforma se conecta al API de Skill Suite:

- **URL Base**: `https://grupoheroicaapi.skillsuite.net/app/wssuite/api`
- **Autenticación**: Token-based authentication

### Endpoints Integrados

- Autenticación
- Salones y tarifas
- Servicios y tarifas
- Disponibilidad de salones
- Tipos de eventos
- Segmentos de mercado
- Coordinadores de cuenta
- Estados y características de eventos
- Calendarios y eventos
- Cotizaciones y facturas

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── layout/          # Layout y navegación
│   │   ├── Layout.tsx
│   │   └── Sidebar.tsx
│   └── ui/              # Componentes UI reutilizables
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── contexts/            # Context providers
│   └── ThemeContext.tsx
├── lib/                 # Utilidades
│   └── utils.ts
├── pages/              # Páginas de la aplicación
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Eventos.tsx
│   ├── Calendario.tsx
│   ├── Salones.tsx
│   ├── Inventario.tsx
│   ├── Clientes.tsx
│   ├── Contactos.tsx
│   └── Coordinadores.tsx
├── services/           # Servicios de API
│   ├── auth.service.ts
│   └── api.service.ts
├── app.css            # Estilos globales con Tailwind
└── main.tsx          # Punto de entrada
```

## 🎨 Diseño

La plataforma utiliza un sistema de diseño basado en variables CSS para soportar temas:

- Paleta de colores adaptable
- Componentes consistentes
- Espaciado y tipografía coherente
- Modo oscuro/claro

## 🔐 Autenticación

El sistema de autenticación utiliza:

- Token JWT almacenado en localStorage
- Redirección automática a login si no está autenticado
- Servicio centralizado de autenticación

## 📦 Gestión de Paquetes

Este proyecto utiliza **pnpm** como gestor de paquetes. Asegúrate de tener pnpm instalado:

```bash
npm install -g pnpm
```

## 🚧 Desarrollo Futuro

- [ ] Implementar módulo de Clientes
- [ ] Implementar módulo de Contactos
- [ ] Agregar funcionalidad de búsqueda avanzada
- [ ] Implementar filtros en todas las vistas
- [ ] Agregar exportación de reportes
- [ ] Implementar notificaciones en tiempo real

## 📝 Notas

- La plataforma está configurada para modo de desarrollo
- Los errores de lint de TypeScript con `preact-router` son esperados y no afectan la funcionalidad
- El tema se detecta automáticamente según las preferencias del sistema operativo

## 👨‍💻 Desarrollo

Para contribuir al proyecto:

1. Crea una rama nueva
2. Realiza tus cambios
3. Asegúrate de que el código compile sin errores críticos
4. Prueba en ambos temas (oscuro y claro)
5. Verifica la responsividad en diferentes dispositivos

---

Desarrollado con Preact + TypeScript + Tailwind CSS
