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

1. **Autenticación** - Sistema de login con API de Skill
2. **Dashboard** - Vista general con estadísticas
3. **Eventos** - Consulta de eventos con cotizaciones y detalles
4. **Calendario** - Vista mensual de eventos
5. **Salones** - Gestión de salones y tarifas
6. **Inventario** - Artículos y servicios disponibles
7. **Coordinadores** - Equipo de coordinación de cuentas
8. **Clientes** - (En desarrollo)
9. **Contactos** - (En desarrollo)

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
