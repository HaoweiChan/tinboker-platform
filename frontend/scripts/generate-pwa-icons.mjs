import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const APPLE_ICON_SIZE = 180;
const MASKABLE_SIZES = [192, 512];

// Maskable icons need 10% padding (safe zone)
const MASKABLE_PADDING_RATIO = 0.1;

async function generateIcons() {
  const sourceIcon = path.join(__dirname, '..', 'public', 'favicon.png');
  const outputDir = path.join(__dirname, '..', 'public', 'icons', 'pwa');

  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ Source icon not found:', sourceIcon);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎨 Generating PWA icons from favicon.png...\n');

  // Generate standard icons
  for (const size of ICON_SIZES) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated icon-${size}x${size}.png`);
  }

  // Generate Apple Touch Icon
  const applePath = path.join(outputDir, 'apple-touch-icon.png');
  await sharp(sourceIcon)
    .resize(APPLE_ICON_SIZE, APPLE_ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(applePath);
  console.log(`✓ Generated apple-touch-icon.png (${APPLE_ICON_SIZE}x${APPLE_ICON_SIZE})`);

  // Generate maskable icons with safe zone padding
  for (const size of MASKABLE_SIZES) {
    const padding = Math.round(size * MASKABLE_PADDING_RATIO);
    const innerSize = size - (padding * 2);
    const outputPath = path.join(outputDir, `maskable-${size}x${size}.png`);

    // Create canvas with background, then composite the icon centered
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 2, g: 6, b: 23, alpha: 1 } // Slate 950 (#020617)
      }
    })
      .composite([{
        input: await sharp(sourceIcon)
          .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated maskable-${size}x${size}.png (with safe zone)`);
  }

  console.log('\n✅ All PWA icons generated successfully!');
  console.log(`   Output directory: ${outputDir}`);
}

generateIcons().catch(console.error);
