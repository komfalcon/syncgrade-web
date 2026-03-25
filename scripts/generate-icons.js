const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];
const input = path.resolve(__dirname, '../client/public/icons/syncgrade-icon.svg');
const outputDir = path.resolve(__dirname, '../client/public/icons');

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
    .toFile(path.resolve(__dirname, '../client/public/favicon.png'));
  console.log('Generated favicon.png');
})();
