import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, "../public/icons/icon.svg");
const svgBuffer = readFileSync(svgPath);

const sizes = [192, 512];

for (const size of sizes) {
  const outputPath = resolve(__dirname, `../public/icons/icon-${size}.png`);
  await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);
  console.log(`Generated icon-${size}.png`);
}
