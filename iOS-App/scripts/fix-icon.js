const sharp = require('sharp');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets', 'icons');
const inputFile = path.join(assetsDir, 'adaptive-icon.png');
const outputFile = path.join(assetsDir, 'adaptive-icon.png');

async function main() {
  const metadata = await sharp(inputFile).metadata();
  const size = metadata.width;
  console.log(`Input: ${size}x${size}`);

  // Adaptive icon safe zone: visible content should be in center 72/108 of bounding box
  // For current image content, we need to add padding so content fills only 72/108
  const newSize = Math.round(size * (108 / 72));
  const pad = Math.round((newSize - size) / 2);
  console.log(`New canvas: ${newSize}x${newSize}, padding: ${pad}px on each side`);

  await sharp(inputFile)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(outputFile + '.tmp');

  // Replace original
  const fs = require('fs');
  fs.renameSync(outputFile + '.tmp', outputFile);

  const newMeta = await sharp(outputFile).metadata();
  console.log(`Output: ${newMeta.width}x${newMeta.height}`);
  console.log('Done - adaptive-icon.png updated with safe zone padding');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
