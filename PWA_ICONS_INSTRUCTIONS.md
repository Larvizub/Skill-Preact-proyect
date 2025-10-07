# PWA Icons Instructions

Para completar la instalación de PWA, necesitas agregar los siguientes iconos en la carpeta `public/`:

## Iconos Requeridos:

1. **icon-192.png** (192x192 px)

   - Icono principal de la app
   - Usado en dispositivos Android y navegadores

2. **icon-512.png** (512x512 px)

   - Icono de alta resolución
   - Usado para splash screens y dispositivos de alta densidad

3. **apple-touch-icon.png** (180x180 px)
   - Icono para dispositivos iOS (iPhone/iPad)
   - Usado cuando se agrega a la pantalla de inicio

## Cómo Crear los Iconos:

### Opción 1: Usar el Logo Existente de Heroica

Puedes usar el logo de Heroica: https://costaricacc.com/cccr/Logoheroica.png

1. Descarga el logo
2. Usa una herramienta online como:

   - https://www.favicon-generator.org/
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

3. Genera los tamaños necesarios:

   - 192x192 px → guárdalo como `icon-192.png`
   - 512x512 px → guárdalo como `icon-512.png`
   - 180x180 px → guárdalo como `apple-touch-icon.png`

4. Coloca todos los iconos en la carpeta `public/`

### Opción 2: Crear Iconos Personalizados

Diseña un icono cuadrado con:

- Fondo sólido (color del tema: #1a1a2e)
- Logo/símbolo centrado
- Márgenes de al menos 10% en todos los lados
- Formato PNG con transparencia (opcional)

## Verificación:

Después de agregar los iconos, verifica que la PWA funcione:

1. **Chrome/Edge Desktop:**

   - Abre DevTools (F12)
   - Ve a la pestaña "Application"
   - Verifica "Manifest" y "Service Workers"

2. **Chrome Android:**

   - Visita el sitio
   - Menú → "Agregar a pantalla de inicio"
   - Debería mostrar el diálogo de instalación

3. **Safari iOS:**
   - Visita el sitio
   - Toca el botón "Compartir"
   - Selecciona "Agregar a pantalla de inicio"

## Colores del Tema:

- **Modo Claro:** #ffffff (blanco)
- **Modo Oscuro:** #1a1a2e (azul oscuro)
- **Acento:** Según tu tema de Tailwind

## Testing:

Prueba en:

- ✅ Chrome Desktop
- ✅ Chrome Android
- ✅ Safari iOS
- ✅ Edge Desktop
- ✅ Firefox Desktop
