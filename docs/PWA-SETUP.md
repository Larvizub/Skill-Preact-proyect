# PWA (Progressive Web App) - Configuración

## ✅ Archivos Configurados

### 1. Manifest (`public/manifest.json`)

- ✅ Configuración completa de Web App Manifest
- ✅ Iconos definidos (192px, 512px, 180px)
- ✅ Display mode: `standalone`
- ✅ Theme colors configurados
- ✅ Shortcuts a Dashboard y Eventos

### 2. Service Worker (`public/service-worker.js`)

- ✅ Estrategia: Network First, fallback a Cache
- ✅ Funciona offline con contenido cacheado
- ✅ Auto-actualización cada minuto
- ✅ Limpieza automática de caches antiguos

### 3. HTML Meta Tags (`index.html`)

- ✅ Meta tags para PWA
- ✅ Apple Touch Icons
- ✅ Theme color (claro y oscuro)
- ✅ Microsoft Tiles configurados
- ✅ Viewport optimizado para PWA

### 4. Registro de Service Worker (`src/main.tsx`)

- ✅ Registro automático al cargar
- ✅ Verificación de actualizaciones
- ✅ Logs en consola para debugging

## 🎯 Próximos Pasos

### 1. Generar Iconos

**Opción A: Usar Logo de Heroica**

```bash
# 1. Descarga el logo
curl -o heroica-logo.png https://costaricacc.com/cccr/Logoheroica.png

# 2. Usa una herramienta online para redimensionar:
# - https://realfavicongenerator.net/
# - https://www.pwabuilder.com/imageGenerator

# 3. Guarda los iconos generados en public/:
#    - icon-192.png (192x192)
#    - icon-512.png (512x512)
#    - apple-touch-icon.png (180x180)
```

**Opción B: Usar el SVG Placeholder**

```bash
# Si tienes ImageMagick instalado:
node generate-icons.js

# O convierte manualmente icon.svg a PNG en los tamaños necesarios
```

### 2. Compilar y Desplegar

```bash
# Compilar la aplicación
pnpm build

# Desplegar a Firebase
firebase deploy --only hosting
```

### 3. Verificar Instalación

#### Chrome/Edge Desktop

1. Abre DevTools (F12)
2. Ve a **Application** → **Manifest**
3. Verifica que aparezca el manifest correctamente
4. Ve a **Service Workers**
5. Confirma que el SW esté registrado y activo

#### Chrome Android

1. Visita el sitio en Chrome Android
2. Toca menú (⋮) → **Agregar a pantalla de inicio**
3. Debería aparecer el diálogo de instalación
4. Instala la app
5. El icono aparecerá en la pantalla de inicio

#### Safari iOS

1. Visita el sitio en Safari
2. Toca el botón **Compartir** (□↑)
3. Selecciona **Agregar a pantalla de inicio**
4. Personaliza el nombre si es necesario
5. Toca **Agregar**

## 🔍 Debugging

### Verificar Service Worker

```javascript
// En la consola del navegador:
navigator.serviceWorker
  .getRegistrations()
  .then((registrations) => console.log(registrations));
```

### Verificar Manifest

```javascript
// En la consola del navegador:
fetch("/manifest.json")
  .then((r) => r.json())
  .then((manifest) => console.log(manifest));
```

### Lighthouse Audit

1. Abre Chrome DevTools (F12)
2. Ve a la pestaña **Lighthouse**
3. Selecciona **Progressive Web App**
4. Click en **Analyze page load**
5. Revisa las sugerencias de mejora

## 📱 Compatibilidad

| Navegador/OS     | Instalación PWA | Offline | Notas                            |
| ---------------- | --------------- | ------- | -------------------------------- |
| Chrome Desktop   | ✅              | ✅      | Icono en barra de direcciones    |
| Edge Desktop     | ✅              | ✅      | Menú de apps                     |
| Chrome Android   | ✅              | ✅      | Banner de instalación automático |
| Samsung Internet | ✅              | ✅      | Similar a Chrome                 |
| Safari iOS 11.3+ | ✅              | ✅      | "Agregar a pantalla de inicio"   |
| Safari Desktop   | ⚠️              | ✅      | Sin instalación, pero funciona   |
| Firefox Desktop  | ⚠️              | ✅      | Instalación limitada             |
| Firefox Android  | ✅              | ✅      | Instalación completa             |

## ⚙️ Configuración Avanzada

### Actualizar Theme Colors

Edita `public/manifest.json`:

```json
{
  "theme_color": "#TU_COLOR_AQUI",
  "background_color": "#TU_COLOR_AQUI"
}
```

También actualiza en `index.html`:

```html
<meta name="theme-color" content="#TU_COLOR_AQUI" />
```

### Agregar Más Shortcuts

Edita `shortcuts` en `public/manifest.json`:

```json
{
  "shortcuts": [
    {
      "name": "Nueva Sección",
      "url": "/tu-ruta",
      "icons": [...]
    }
  ]
}
```

### Cambiar Estrategia de Caché

Edita `public/service-worker.js` y cambia la estrategia en el evento `fetch`.

Estrategias comunes:

- **Network First**: Intenta red primero, fallback a cache (actual)
- **Cache First**: Intenta cache primero, fallback a red
- **Network Only**: Solo red, no cache
- **Cache Only**: Solo cache, no red
- **Stale While Revalidate**: Sirve de cache mientras actualiza

## 🚀 Performance

### Optimizaciones Implementadas

- ✅ Service Worker con caché inteligente
- ✅ Recursos estáticos pre-cacheados
- ✅ Estrategia Network First para contenido dinámico
- ✅ Auto-actualización del Service Worker

### Métricas Esperadas (Lighthouse)

- Performance: 90+
- PWA: 100 (con iconos correctos)
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## 📚 Recursos

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox (Google)](https://developers.google.com/web/tools/workbox)

## ❓ Troubleshooting

### La app no se puede instalar

1. Verifica que todos los iconos existan en `public/`
2. Confirma que `manifest.json` sea válido (usa JSONLint)
3. Asegúrate de estar en HTTPS (o localhost)
4. Limpia cache y recarga: Ctrl+Shift+R

### El Service Worker no se registra

1. Verifica la consola de errores
2. Asegúrate de que `service-worker.js` esté en `public/`
3. Verifica que el build copió los archivos correctamente
4. En DevTools → Application → Service Workers → Unregister y vuelve a cargar

### Los cambios no se reflejan

1. El Service Worker cachea recursos
2. Desregistra el SW en DevTools
3. Limpia todo el cache
4. Recarga la página
5. O incrementa `CACHE_NAME` en `service-worker.js`

### iOS no muestra el icono correcto

1. Asegúrate de que `apple-touch-icon.png` exista
2. Debe ser exactamente 180x180 px
3. Formato PNG, no JPG
4. Sin transparencia (fondo sólido)
