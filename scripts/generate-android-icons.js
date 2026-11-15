import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const RES_DIR = path.join(ROOT_DIR, 'android/app/src/main/res');
const FAVICON_PATH = path.join(ROOT_DIR, 'public/images/RealSalePro_Favicon.png');
const LOGO_LIGHT_PATH = path.join(ROOT_DIR, 'public/images/RealSalePro_LighLogo.png');

const MIPMAP_SIZES = {
  'mipmap-mdpi': { icon: 48, foreground: 108 },
  'mipmap-hdpi': { icon: 72, foreground: 162 },
  'mipmap-xhdpi': { icon: 96, foreground: 216 },
  'mipmap-xxhdpi': { icon: 144, foreground: 324 },
  'mipmap-xxxhdpi': { icon: 192, foreground: 432 },
};

const SPLASH_SIZES = [
  { dir: 'drawable', width: 480, height: 800 },
  { dir: 'drawable-port-mdpi', width: 320, height: 480 },
  { dir: 'drawable-port-hdpi', width: 480, height: 800 },
  { dir: 'drawable-port-xhdpi', width: 720, height: 1280 },
  { dir: 'drawable-port-xxhdpi', width: 960, height: 1600 },
  { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920 },
  { dir: 'drawable-land-mdpi', width: 480, height: 320 },
  { dir: 'drawable-land-hdpi', width: 800, height: 480 },
  { dir: 'drawable-land-xhdpi', width: 1280, height: 720 },
  { dir: 'drawable-land-xxhdpi', width: 1600, height: 960 },
  { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280 },
];

async function generateIcons() {
  console.log('Generating Android Mipmap Icons...');

  for (const [folder, sizes] of Object.entries(MIPMAP_SIZES)) {
    const targetDir = path.join(RES_DIR, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. ic_launcher.png (standard icon)
    await sharp(FAVICON_PATH)
      .resize(sizes.icon, sizes.icon, { fit: 'cover' })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 2. ic_launcher_round.png (circular mask for Android circular icons)
    const radius = Math.floor(sizes.icon / 2);
    const circleSvg = Buffer.from(
      `<svg width="${sizes.icon}" height="${sizes.icon}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="#fff" /></svg>`
    );

    const baseRound = await sharp(FAVICON_PATH)
      .resize(sizes.icon, sizes.icon, { fit: 'cover' })
      .toBuffer();

    await sharp(baseRound)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // 3. ic_launcher_foreground.png (for adaptive icons, centered in 66% safe area)
    const innerSize = Math.round(sizes.foreground * 0.66);
    const innerIcon = await sharp(FAVICON_PATH)
      .resize(innerSize, innerSize, { fit: 'cover' })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: sizes.foreground,
        height: sizes.foreground,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: innerIcon, gravity: 'center' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for ${folder}`);
  }

  // Update background color for adaptive icons to match favicon (#23272b)
  const bgXmlPath = path.join(RES_DIR, 'values/ic_launcher_background.xml');
  fs.writeFileSync(
    bgXmlPath,
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#23272B</color>
</resources>
`
  );

  // Remove stale default capacitor vector foreground in drawable-v24 if present
  const oldVector = path.join(RES_DIR, 'drawable-v24/ic_launcher_foreground.xml');
  if (fs.existsSync(oldVector)) {
    fs.unlinkSync(oldVector);
    console.log('Removed stale drawable-v24/ic_launcher_foreground.xml');
  }

  // 4. Generate splash screens
  console.log('Generating Android Splash Screens...');
  for (const splash of SPLASH_SIZES) {
    const splashDir = path.join(RES_DIR, splash.dir);
    if (!fs.existsSync(splashDir)) {
      fs.mkdirSync(splashDir, { recursive: true });
    }

    // Scale logo to ~55% of the shortest screen dimension
    const minDim = Math.min(splash.width, splash.height);
    const logoWidth = Math.min(Math.round(minDim * 0.7), 400);

    const logoBuffer = await sharp(LOGO_LIGHT_PATH)
      .resize({ width: logoWidth, fit: 'inside' })
      .toBuffer();

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: { r: 14, g: 26, b: 21, alpha: 1 }, // #0E1A15 RealSalePro signature dark
      },
    })
      .composite([{ input: logoBuffer, gravity: 'center' }])
      .png()
      .toFile(path.join(splashDir, 'splash.png'));

    console.log(`Generated splash for ${splash.dir} (${splash.width}x${splash.height})`);
  }

  console.log('All Android assets generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
