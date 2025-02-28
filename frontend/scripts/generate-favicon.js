const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SVG_PATH = path.join(__dirname, '../public/favicon.min.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');

async function generateFavicon() {
  try {
    const svgBuffer = fs.readFileSync(SVG_PATH);
    
    // Generate favicon.ico (multi-size ICO file)
    await sharp(svgBuffer)
      .resize(16, 16)
      .toFile(path.join(OUTPUT_DIR, 'favicon-16x16.png'));
      
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));
      
    await sharp(svgBuffer)
      .resize(48, 48)
      .toFile(path.join(OUTPUT_DIR, 'favicon-48x48.png'));
      
    await sharp(svgBuffer)
      .resize(192, 192)
      .toFile(path.join(OUTPUT_DIR, 'android-chrome-192x192.png'));
      
    await sharp(svgBuffer)
      .resize(512, 512)
      .toFile(path.join(OUTPUT_DIR, 'android-chrome-512x512.png'));
      
    await sharp(svgBuffer)
      .resize(180, 180)
      .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));

    console.log('Favicon assets generated successfully!');
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateFavicon();
