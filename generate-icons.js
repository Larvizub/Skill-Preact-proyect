#!/usr/bin/env node

/**
 * Script para generar iconos PNG desde SVG
 *
 * NOTA: Este script requiere tener ImageMagick instalado
 *
 * Instalación de ImageMagick:
 * - Windows: https://imagemagick.org/script/download.php#windows
 * - macOS: brew install imagemagick
 * - Linux: sudo apt-get install imagemagick
 *
 * Uso:
 * node generate-icons.js
 *
 * O usa herramientas online:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "public");
const svgPath = path.join(publicDir, "icon.svg");

// Verificar si existe el SVG
if (!fs.existsSync(svgPath)) {
  console.error("❌ No se encontró icon.svg en la carpeta public/");
  console.log("Por favor, crea un icono SVG primero.");
  process.exit(1);
}

// Tamaños a generar
const sizes = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
];

console.log("🎨 Generando iconos PNG desde SVG...\n");

let completed = 0;

sizes.forEach(({ size, name }) => {
  const outputPath = path.join(publicDir, name);
  const command = `magick convert -background none -resize ${size}x${size} "${svgPath}" "${outputPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error generando ${name}:`, error.message);
      console.log("\n💡 Alternativas:");
      console.log("1. Instala ImageMagick: https://imagemagick.org/");
      console.log(
        "2. Usa herramientas online: https://realfavicongenerator.net/"
      );
      console.log("3. Crea los iconos manualmente en Photoshop/GIMP\n");
      return;
    }

    completed++;
    console.log(`✅ ${name} generado (${size}x${size})`);

    if (completed === sizes.length) {
      console.log("\n🎉 ¡Todos los iconos generados exitosamente!");
      console.log("\nPróximos pasos:");
      console.log("1. Verifica los iconos en la carpeta public/");
      console.log("2. Ejecuta: pnpm build");
      console.log("3. Despliega: firebase deploy --only hosting");
      console.log("4. Prueba la instalación en diferentes dispositivos");
    }
  });
});
