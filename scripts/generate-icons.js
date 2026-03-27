import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];
const input = path.resolve(__dirname, "../public/icons/syncgrade-icon.svg");
const outputDir = path.resolve(__dirname, "../public/icons");

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  for (const size of sizes) {
    await sharp(input)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
  await sharp(input)
    .resize(32, 32)
    .png()
    .toFile(path.resolve(__dirname, "../public/favicon.png"));
  console.log("Generated favicon.png");
})();
