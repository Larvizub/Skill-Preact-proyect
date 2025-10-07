# Skill Preact Platform — GitHub Repository Setup

Este archivo contiene una descripción preparada para el repositorio, instrucciones paso a paso y los comandos exactos (PowerShell) para crear el repositorio en tu cuenta de GitHub y subir el proyecto desde tu máquina local.

---

## Sugerencia: nombre del repositorio

- Nombre recomendado: `skill-preact-platform` (o `Skill-Preact-proyect` si prefieres mantener el actual).

## Descripción corta (texto para el campo "Description" en GitHub)

Plataforma de gestión de eventos construida con Preact + TypeScript + Vite, interfaz basada en Shadcn UI + TailwindCSS. Integra con el API de Skill para gestión de salones, servicios, cotizaciones y calendario.

## Descripción larga (README summary)

Skill Preact Platform

Proyecto frontend para administrar eventos, cotizaciones, salones y coordinadores. Incluye:

- Preact + TypeScript + Vite
- Estilos con TailwindCSS y componentes Shadcn UI
- Módulos: Autenticación, Dashboard, Calendario, Salones, Inventario, Clientes, Contactos, Coordinadores
- Integración con la API de Skill (documentación interna y endpoints en `/docs`)

Nota: no subir credenciales (tokens, passwords, companyAuthId) al repositorio público. Utiliza variables de entorno y `.env` locales.

## Topics (etiquetas sugeridas)

`preact`, `typescript`, `vite`, `tailwindcss`, `shadcn-ui`, `events`, `calendar`, `dashboard`, `pnpm`, `firebase`

## Licencia sugerida

- MIT (o la que prefieras). Añade un archivo `LICENSE` si eliges MIT.

---

## Pasos para crear el repo y subir (PowerShell)

A continuación hay dos opciones: (A) usando GitHub CLI (`gh`) — la forma más sencilla si ya estás autenticado; (B) manual — crear el repo por la web y luego empujar.

Opción A — con `gh` (recomendado si tienes gh instalado y autenticado):

1. Desde el root del proyecto en PowerShell:

```powershell
# Asegúrate de estar en la carpeta del proyecto
cd C:\Dev\Preact\Skill-Preact-proyect

# Inicializar git si no está inicializado
git init

git add .
git commit -m "Initial commit: Skill Preact Platform"

# Crear repo público en tu cuenta y pushear (reemplaza REPO_NAME si quieres otro)
gh repo create YOUR_GITHUB_USERNAME/skill-preact-platform --public --source=. --remote=origin --push --description "Plataforma de gestión de eventos con Preact + Shadcn UI"
```

`gh` te pedirá autenticar si no lo estás. Tras correrlo, el repo quedará creado y el `origin` apuntará al remote creado y el `main` será pusheado.

Opción B — crear en web y pushear manualmente:

1. Ve a https://github.com/new y crea un repositorio nuevo (p. ej. `skill-preact-platform`).
2. Desde PowerShell en el root del proyecto:

```powershell
cd C:\Dev\Preact\Skill-Preact-proyect

# Inicializar git si no está
git init

git add .
git commit -m "Initial commit: Skill Preact Platform"

# Añadir remoto (reemplaza USERNAME y REPO)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/skill-preact-platform.git

# Forzar rama main y pushear
git branch -M main
git push -u origin main
```

Si Git te pide credenciales y no quieres usar `gh`, genera un Personal Access Token (PAT) en GitHub y úsalo como contraseña cuando Git lo pida.

---

## .gitignore recomendado (si no existe)

Si tu proyecto no tiene `.gitignore`, crea uno con al menos:

```
node_modules/
dist/
dev-dist/
.env
.env.*
.vscode/
.DS_Store
coverage/
.idea/
/.firebase
/functions/node_modules/
pnpm-lock.yaml
```

(No incluyas archivos sensibles con credenciales en el repo.)

---

## Opciones adicionales a configurar en GitHub

- Activar Issues, Projects y Wiki si quieres usar gestión interna.
- Configurar GitHub Pages o Actions si quieres despliegue automático.
- AÑADIR secretos (Settings > Secrets) para CI: FIREBASE*TOKEN, VITE*\* variables, etc.

## Pipeline recomendado (despliegue a Firebase Hosting)

Si quieres desplegar automáticamente al hacer push en `main`, puedo darte un `workflow` de GitHub Actions que:

- Instala node/pnpm
- Instala dependencias
- Build
- Usa `Firebase CLI` con `FIREBASE_TOKEN` (secret) para `firebase deploy --only hosting`

Dime si quieres que cree ese workflow y lo suba al repo (necesitarás añadir `FIREBASE_TOKEN` en GitHub Secrets).

---

## ¿Quieres que lo haga por ti?

Puedo ejecutar los comandos y subir el repo desde esta máquina si:

- me confirmas el nombre del repo que quieres y
- estás autenticado en `gh` en esta máquina **o** me proporcionas acceso temporal (no recomendado).

Si prefieres que solo genere los archivos (README mejorado, LICENSE, GitHub Actions workflow) también lo hago y te dejo los comandos para que lo publiques.

---

Listado de archivos útiles añadidos por este asistente (si decides aceptar cambios automáticos):

- `.github/REPO_SETUP.md` (este archivo)

---

Si quieres que haga los pasos automáticos, dime: 1) usa `gh` con tu username (indica el username o acepta que use `skill-preact-platform`), 2) confirmar si el repo debe ser público o privado, 3) si quieres que cree `LICENSE` y qué tipo.
