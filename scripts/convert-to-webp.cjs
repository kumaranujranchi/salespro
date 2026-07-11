const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(process.cwd(), 'public', 'images');

// Only convert the integration logos (not company logos / app logos)
const targets = [
  'facebook_ads.png',
  'whatsApp.png',
  'google_ads.png',
  'google_form.png',
  'Googlesheet.png',
  '99acres.png',
  'magicbricks.png',
  'hosing.png',
];

async function convert() {
  for (const file of targets) {
    const input = path.join(imagesDir, file);
    const outputName = path.basename(file, path.extname(file)) + '.webp';
    const output = path.join(imagesDir, outputName);

    if (!fs.existsSync(input)) {
      console.log(`SKIP (not found): ${file}`);
      continue;
    }

    const before = fs.statSync(input).size;
    await sharp(input)
      .webp({ quality: 85 })
      .toFile(output);
    const after = fs.statSync(output).size;
    console.log(
      `✅ ${file} → ${outputName}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB  (saved ${((1 - after / before) * 100).toFixed(1)}%)`
    );
  }
}

convert().catch(console.error);
