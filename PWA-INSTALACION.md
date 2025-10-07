# 📱 PWA Instalable - Configuración Completa

## ✅ ¿Qué se ha configurado?

### 1. **Progressive Web App (PWA) Completa**

Tu aplicación ahora es **instalable** en todos los dispositivos y navegadores modernos como una app nativa.

### 2. **Archivos Creados/Modificados:**

#### ✨ Nuevos Archivos:

- ✅ `public/manifest.json` - Configuración de la Web App
- ✅ `public/service-worker.js` - Funcionalidad offline
- ✅ `public/browserconfig.xml` - Configuración para Windows
- ✅ `public/icon.svg` - Icono principal de la app
- ✅ `public/icon-192.svg` - Icono 192x192 (Android, navegadores)
- ✅ `public/icon-512.svg` - Icono 512x512 (splash screens)
- ✅ `public/apple-touch-icon.svg` - Icono iOS (iPhone/iPad)

#### 🔧 Archivos Modificados:

- ✅ `index.html` - Meta tags PWA, Apple, Microsoft
- ✅ `src/main.tsx` - Registro automático del Service Worker

#### 📚 Documentación:

- ✅ `docs/PWA-SETUP.md` - Guía completa de configuración
- ✅ `PWA_ICONS_INSTRUCTIONS.md` - Instrucciones para iconos
- ✅ `create-placeholder-icons.js` - Script para generar iconos

---

## 🚀 Cómo Instalar la App (Usuarios)

### 📱 **Android (Chrome/Samsung Internet)**

1. Abre el sitio en Chrome o Samsung Internet
2. Aparecerá un banner **"Agregar a pantalla de inicio"**
3. Toca **"Instalar"** o **"Agregar"**
4. La app se instalará como una aplicación nativa
5. El icono aparecerá en tu pantalla de inicio

### 🍎 **iOS (Safari)**

1. Abre el sitio en Safari
2. Toca el botón **Compartir** (□↑) en la parte inferior
3. Desplázate y selecciona **"Agregar a pantalla de inicio"**
4. Personaliza el nombre si quieres
5. Toca **"Agregar"**
6. El icono aparecerá en tu pantalla de inicio

### 💻 **Desktop (Chrome/Edge)**

1. Abre el sitio en Chrome o Edge
2. Busca el ícono **⊕** en la barra de direcciones (esquina derecha)
3. Click en **"Instalar Skill Platform"**
4. La app se abrirá en su propia ventana
5. Puedes anclarla a la barra de tareas

---

## 🎨 Paso IMPORTANTE: Reemplazar Iconos Placeholder

### Los iconos actuales son **placeholders temporales** con la letra "S"

### Para usar el logo de Heroica:

#### **Método 1: Herramienta Online (Recomendado) - 5 minutos**

1. **Ve a:** https://realfavicongenerator.net/

2. **Descarga el logo de Heroica:**

   ```
   https://costaricacc.com/cccr/Logoheroica.png
   ```

3. **Sube el logo** a RealFaviconGenerator

4. **Genera los iconos** (el sitio creará todos los tamaños automáticamente)

5. **Descarga el paquete** de iconos

6. **Copia estos 3 archivos a `public/`:**

   - `android-chrome-192x192.png` → renombrar a `icon-192.png`
   - `android-chrome-512x512.png` → renombrar a `icon-512.png`
   - `apple-touch-icon.png` (ya tiene el nombre correcto)

7. **Actualiza `public/manifest.json`** (cambiar de `.svg` a `.png`):

   ```json
   "icons": [
     {
       "src": "/icon-192.png",
       "sizes": "192x192",
       "type": "image/png",
       "purpose": "any maskable"
     },
     {
       "src": "/icon-512.png",
       "sizes": "512x512",
       "type": "image/png",
       "purpose": "any maskable"
     },
     {
       "src": "/apple-touch-icon.png",
       "sizes": "180x180",
       "type": "image/png"
     }
   ]
   ```

8. **Actualiza `index.html`** (cambiar de `.svg` a `.png`):

   ```html
   <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
   ```

9. **Actualiza `public/service-worker.js`** (cambiar de `.svg` a `.png`):
   ```javascript
   const STATIC_CACHE_URLS = [
     "/",
     "/index.html",
     "/manifest.json",
     "/icon-192.png",
     "/icon-512.png",
     "/apple-touch-icon.png",
   ];
   ```

#### **Método 2: Photoshop/GIMP/Canva**

1. Abre el logo de Heroica en tu editor favorito
2. Redimensiona a **192x192 px** y exporta como `icon-192.png`
3. Redimensiona a **512x512 px** y exporta como `icon-512.png`
4. Redimensiona a **180x180 px** y exporta como `apple-touch-icon.png`
5. Guarda los 3 archivos en la carpeta `public/`
6. Sigue los pasos 7-9 del Método 1

---

## 📦 Desplegar

```bash
# 1. Compilar con los cambios
pnpm build

# 2. Desplegar a Firebase
firebase deploy --only hosting

# 3. Limpiar cache del navegador en los dispositivos de prueba
# (Ctrl+Shift+R o Cmd+Shift+R)
```

---

## ✅ Verificar que Funciona

### **Chrome Desktop (DevTools)**

1. Presiona `F12` para abrir DevTools
2. Ve a la pestaña **"Application"**
3. En el menú izquierdo:
   - **Manifest:** Debe mostrar todos los campos correctamente
   - **Service Workers:** Debe mostrar "activated and running"
4. En la barra de direcciones, debe aparecer un ícono **⊕** para instalar

### **Chrome Android**

1. Visita el sitio en Chrome
2. Debe aparecer un banner de instalación automáticamente
3. O menú (⋮) → "Agregar a pantalla de inicio"

### **Safari iOS**

1. Visita el sitio en Safari
2. Toca Compartir → "Agregar a pantalla de inicio"
3. El icono debe verse bien (no genérico)

### **Lighthouse Audit**

1. En DevTools, ve a **"Lighthouse"**
2. Selecciona **"Progressive Web App"**
3. Click **"Analyze page load"**
4. Debe obtener **100/100** en PWA (con iconos PNG correctos)

---

## 🎯 Características PWA Implementadas

### ✅ **Instalable**

- Se puede agregar a la pantalla de inicio en todos los dispositivos
- Icono personalizado en el home screen
- Nombre personalizado de la app

### ✅ **Funciona Offline**

- Service Worker cachea recursos estáticos
- Estrategia "Network First" con fallback a cache
- Contenido disponible sin conexión

### ✅ **Standalone**

- Se abre en ventana propia (sin barra de navegador)
- Experiencia tipo app nativa
- Barra de estado personalizada (iOS)

### ✅ **Actualizable**

- Verifica actualizaciones cada minuto
- Auto-actualización del Service Worker
- Limpieza automática de caches antiguos

### ✅ **Multi-plataforma**

- Android (Chrome, Samsung Internet, Firefox)
- iOS (Safari)
- Desktop (Chrome, Edge, Firefox)
- Tablet (iPad, Android)

---

## 📊 Compatibilidad

| Plataforma       | Instalación | Offline | Standalone |
| ---------------- | ----------- | ------- | ---------- |
| Chrome Android   | ✅ Banner   | ✅      | ✅         |
| Samsung Internet | ✅ Banner   | ✅      | ✅         |
| Safari iOS       | ✅ Manual   | ✅      | ✅         |
| Chrome Desktop   | ✅ Ícono    | ✅      | ✅         |
| Edge Desktop     | ✅ Menú     | ✅      | ✅         |
| Firefox Android  | ✅ Manual   | ✅      | ✅         |

---

## 🆘 Troubleshooting

### ❓ **No aparece el banner de instalación**

- Verifica que estés en HTTPS (no HTTP)
- Asegúrate de que todos los iconos existan
- Revisa que `manifest.json` sea válido
- Limpia cache y recarga: `Ctrl+Shift+R`

### ❓ **El icono se ve mal/genérico**

- Reemplaza los SVG con PNG del logo de Heroica
- Asegúrate de que los archivos tengan el tamaño exacto
- iOS requiere PNG, no acepta SVG
- Limpia cache y reinstala la app

### ❓ **No funciona offline**

- Abre DevTools → Application → Service Workers
- Verifica que esté "activated and running"
- Si no está, desregístralo y recarga la página
- Incrementa la versión en `CACHE_NAME` si hiciste cambios

### ❓ **Los cambios no se reflejan**

- Limpia cache del navegador
- Desregistra el Service Worker en DevTools
- Incrementa `CACHE_NAME` en `service-worker.js`
- Haz hard reload: `Ctrl+Shift+R`

---

## 📞 Soporte

Si tienes problemas:

1. **Lee la documentación completa:** `docs/PWA-SETUP.md`
2. **Verifica en DevTools:** Application → Manifest y Service Workers
3. **Prueba en modo incógnito** para evitar cache
4. **Lighthouse Audit** te dirá qué falta

---

## 🎉 ¡Listo!

Tu aplicación ahora es una **Progressive Web App completa** que se puede instalar en cualquier dispositivo.

**Próximos pasos:**

1. ✅ Reemplazar iconos SVG con PNG del logo de Heroica
2. ✅ Hacer `pnpm build`
3. ✅ Desplegar con `firebase deploy --only hosting`
4. ✅ Probar la instalación en diferentes dispositivos
5. ✅ Compartir el link con usuarios para que instalen

---

**¿Necesitas ayuda?** Revisa `docs/PWA-SETUP.md` para más detalles técnicos.
