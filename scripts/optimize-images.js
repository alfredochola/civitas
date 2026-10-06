const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PROJECTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'projects');
const PROJECTS_JSON = path.join(__dirname, '..', 'src', 'assets', 'data', 'projects.json');

const LIGHTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'lights');
const LIGHTS_JSON = path.join(__dirname, '..', 'src', 'assets', 'data', 'lights.json');

const HOME_HTML = path.join(__dirname, '..', 'src', 'app', 'components', 'home', 'home.html');

const RAW_EXTS = ['.png', '.jpg', '.jpeg'];
const MAX_FULL_WIDTH = 1600;
const FULL_QUALITY = 82;
const THUMB_WIDTH = 500;
const THUMB_QUALITY = 80;

function getAllFiles(dir, filterFn, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, filterFn, fileList);
    } else if (entry.isFile() && filterFn(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function generateThumbnail(fullWebpPath, thumbPath) {
  await sharp(fullWebpPath)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY, effort: 4 })
    .toFile(thumbPath);
}

async function processDirectory(categoryName, dirPath, jsonPath) {
  console.log(`\nScanning ${categoryName}: ${dirPath}`);

  // 1. Process any uncompressed RAW images
  const rawImages = getAllFiles(dirPath, name => RAW_EXTS.includes(path.extname(name).toLowerCase()));
  if (rawImages.length > 0) {
    console.log(`Found ${rawImages.length} uncompressed ${categoryName.toLowerCase()} images to convert.`);
    for (let i = 0; i < rawImages.length; i++) {
      const filePath = rawImages[i];
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);
      const webpPath = path.join(dir, `${baseName}.webp`);
      const thumbPath = path.join(dir, `${baseName}-thumb.webp`);

      try {
        await sharp(filePath)
          .resize({ width: MAX_FULL_WIDTH, withoutEnlargement: true })
          .webp({ quality: FULL_QUALITY, effort: 4 })
          .toFile(webpPath);

        await generateThumbnail(webpPath, thumbPath);

        fs.unlinkSync(filePath);
        console.log(`[RAW ${i + 1}/${rawImages.length}] ${path.basename(filePath)} -> full & thumb WebP`);
      } catch (err) {
        console.error(`Error processing ${filePath}:`, err.message);
      }
    }
  }

  // 2. Check for missing thumbnails on existing WebP images
  const webpImages = getAllFiles(dirPath, name => {
    const lower = name.toLowerCase();
    return lower.endsWith('.webp') && !lower.endsWith('-thumb.webp');
  });

  let createdThumbs = 0;
  for (let i = 0; i < webpImages.length; i++) {
    const fullWebpPath = webpImages[i];
    const dir = path.dirname(fullWebpPath);
    const baseName = path.basename(fullWebpPath, '.webp');
    const thumbPath = path.join(dir, `${baseName}-thumb.webp`);

    if (!fs.existsSync(thumbPath)) {
      try {
        await generateThumbnail(fullWebpPath, thumbPath);
        createdThumbs++;
        const thumbStats = fs.statSync(thumbPath);
        console.log(`[THUMB ${createdThumbs}] Created ${baseName}-thumb.webp (${Math.round(thumbStats.size / 1024)} KB)`);
      } catch (err) {
        console.error(`Error creating thumbnail for ${fullWebpPath}:`, err.message);
      }
    }
  }

  if (rawImages.length === 0 && createdThumbs === 0) {
    console.log(`All ${categoryName.toLowerCase()} images and thumbnails are already up to date.`);
  }

  // Update json paths to .webp if needed
  if (fs.existsSync(jsonPath)) {
    let jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const updatedJson = jsonContent.replace(/\.(png|jpg|jpeg)(",?)/gi, '.webp$2');
    if (updatedJson !== jsonContent) {
      fs.writeFileSync(jsonPath, updatedJson, 'utf-8');
      console.log(`Updated ${path.basename(jsonPath)} paths.`);
    }
  }

  return { rawCount: rawImages.length, thumbCount: createdThumbs };
}

async function optimizeAll() {
  console.log('--- Civitas Automated Two-Tier Image & Thumbnail Optimizer ---');

  const projResult = await processDirectory('Projects', PROJECTS_DIR, PROJECTS_JSON);
  const lightsResult = await processDirectory('Lights', LIGHTS_DIR, LIGHTS_JSON);

  // Update home.html if references exist
  if (fs.existsSync(HOME_HTML)) {
    let homeContent = fs.readFileSync(HOME_HTML, 'utf-8');
    homeContent = homeContent.replace(
      /assets\/images\/(projects|lights)\/([^"']+)\.(png|jpg|jpeg)/gi,
      'assets/images/$1/$2.webp'
    );
    fs.writeFileSync(HOME_HTML, homeContent, 'utf-8');
  }

  const totalThumbs = projResult.thumbCount + lightsResult.thumbCount;
  const totalRaws = projResult.rawCount + lightsResult.rawCount;

  console.log('\n=== Optimizer Summary ===');
  console.log(`Raw images converted:  ${totalRaws}`);
  console.log(`Thumbnails generated:  ${totalThumbs}`);
  console.log('=========================\n');
}

optimizeAll().catch((err) => {
  console.error('Fatal error during optimization:', err);
  process.exit(1);
});
