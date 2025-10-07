import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Crea archivos placeholder PNG para PWA
 *
 * NOTA: Estos son solo placeholders temporales.
 * Reemplázalos con iconos reales usando:
 * 1. El logo de Heroica: https://costaricacc.com/cccr/Logoheroica.png
 * 2. Herramientas online: https://realfavicongenerator.net/
 */

const publicDir = path.join(__dirname, "public");

// Crear un SVG simple para cada tamaño
const createSVGIcon = (size, filename) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#1a1a2e" rx="${size * 0.125}"/>
  <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="${
    size * 0.4
  }" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">S</text>
  <text x="50%" y="85%" font-family="Arial, sans-serif" font-size="${
    size * 0.095
  }" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" opacity="0.8">SKILL</text>
</svg>`;

  const filepath = path.join(publicDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`✅ Creado: ${filename} (${size}x${size})`);
};

console.log("🎨 Creando iconos SVG placeholder para PWA...\n");

// Crear iconos SVG (navegadores modernos los aceptan)
createSVGIcon(192, "icon-192.svg");
createSVGIcon(512, "icon-512.svg");
createSVGIcon(180, "apple-touch-icon.svg");

console.log("\n⚠️  IMPORTANTE:");
console.log(
  "Los archivos SVG funcionan en navegadores modernos, pero para mejor compatibilidad:"
);
console.log("");
console.log("1. Descarga el logo de Heroica:");
console.log("   https://costaricacc.com/cccr/Logoheroica.png");
console.log("");
console.log("2. Usa una herramienta para convertirlo a PNG:");
console.log("   • https://realfavicongenerator.net/ (recomendado)");
console.log("   • https://www.pwabuilder.com/imageGenerator");
console.log("   • Photoshop/GIMP/Canva");
console.log("");
console.log("3. Genera estos archivos PNG y guárdalos en public/:");
console.log("   • icon-192.png (192x192 px)");
console.log("   • icon-512.png (512x512 px)");
console.log("   • apple-touch-icon.png (180x180 px)");
console.log("");
console.log("4. Actualiza manifest.json para usar PNG en lugar de SVG");
console.log("");
