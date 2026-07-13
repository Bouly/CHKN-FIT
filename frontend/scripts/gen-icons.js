// Génère les icônes PWA (PNG) à partir du SVG de l'app : node scripts/gen-icons.js
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svg = fs.readFileSync(path.join(__dirname, "..", "app", "icon.svg"));

Promise.all([
  sharp(svg, { density: 300 }).resize(192, 192).png()
    .toFile(path.join(__dirname, "..", "public", "icon-192.png")),
  sharp(svg, { density: 300 }).resize(512, 512).png()
    .toFile(path.join(__dirname, "..", "public", "icon-512.png")),
])
  .then(() => console.log("icons ok"))
  .catch((e) => {
    console.error("sharp KO:", e.message);
    process.exit(1);
  });
