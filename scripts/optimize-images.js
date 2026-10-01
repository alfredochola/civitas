const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PROJECTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'projects');
const PROJECTS_JSON = path.join(__dirname, '..', 'src', 'assets', 'data', 'projects.json');

const LIGHTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'lights');
const LIGHTS_JSON = path.join(__dirname, '..', 'src', 'assets', 'data', 'lights.json');

const HOME_HTML = path.join(__dirname, '..', 'src', 'app', 'components', 'home', 'home.html');

const SUPPORTED_EXTS = ['.png', '.jpg', '.jpeg'];
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTS.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

async function processDirectory(categoryName, dirPath, jsonPath) {
  console.log(`\nScanning ${categoryName}: ${dirPath}`);
  const rawImages = getAllFiles(dirPath);
  console.log(`Found ${rawImages.length} uncompressed ${categoryName.toLowerCase()} images to optimize.`);

  if (rawImages.length === 0) {
    console.log(`All ${categoryName.toLowerCase()} images are already optimized.`);
    return { count: 0, originalSize: 0, optimizedSize: 0 };
  }

  let originalSize = 0;
  let optimizedSize = 0;
  let count = 0;

  for (let i = 0; i < rawImages.length; i++) {
    const filePath = rawImages[i];
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const webpPath = path.join(dir, `${baseName}.webp`);

    const originalStats = fs.statSync(filePath);
    originalSize += originalStats.size;

    try {
      await sharp(filePath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toFile(webpPath);

      const webpStats = fs.statSync(webpPath);
      optimizedSize += webpStats.size;
      count++;

      fs.unlinkSync(filePath);

      const pct = Math.round(((originalStats.size - webpStats.size) / originalStats.size) * 100);
      const origMB = (originalStats.size / 1024 / 1024).toFixed(2);
      const newKB = (webpStats.size / 1024).toFixed(0);
      console.log(`[${i + 1}/${rawImages.length}] ${path.basename(filePath)} (${origMB} MB) -> ${baseName}.webp (${newKB} KB, -${pct}%)`);
    } catch (err) {
      console.error(`Error optimizing ${filePath}:`, err.message);
    }
  }

  if (fs.existsSync(jsonPath)) {
    console.log(`Updating ${path.basename(jsonPath)} image paths...`);
    let jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const updatedJson = jsonContent.replace(/\.(png|jpg|jpeg)(",?)/gi, '.webp$2');
    fs.writeFileSync(jsonPath, updatedJson, 'utf-8');
    console.log(`Updated ${path.basename(jsonPath)} successfully.`);
  }

  return { count, originalSize, optimizedSize };
}

async function optimizeAll() {
  console.log('--- Civitas Site-Wide Image Optimizer ---');

  const projResult = await processDirectory('Projects', PROJECTS_DIR, PROJECTS_JSON);
  const lightsResult = await processDirectory('Lights', LIGHTS_DIR, LIGHTS_JSON);

  // Update home.html if references exist
  if (fs.existsSync(HOME_HTML)) {
    console.log('\nUpdating home.html image paths...');
    let homeContent = fs.readFileSync(HOME_HTML, 'utf-8');
    homeContent = homeContent.replace(
      /assets\/images\/(projects|lights)\/([^"']+)\.(png|jpg|jpeg)/gi,
      'assets/images/$1/$2.webp'
    );
    fs.writeFileSync(HOME_HTML, homeContent, 'utf-8');
    console.log('Updated home.html successfully.');
  }

  const totalCount = projResult.count + lightsResult.count;
  const totalOrig = projResult.originalSize + lightsResult.originalSize;
  const totalOpt = projResult.optimizedSize + lightsResult.optimizedSize;

  if (totalCount > 0) {
    const savedMB = ((totalOrig - totalOpt) / 1024 / 1024).toFixed(2);
    const origMB = (totalOrig / 1024 / 1024).toFixed(2);
    const optMB = (totalOpt / 1024 / 1024).toFixed(2);
    const pct = Math.round(((totalOrig - totalOpt) / totalOrig) * 100);

    console.log('\n=== Total Optimization Summary ===');
    console.log(`Total images converted: ${totalCount}`);
    console.log(`Original total size:   ${origMB} MB`);
    console.log(`Optimized total size:  ${optMB} MB`);
    console.log(`Bandwidth saved:       ${savedMB} MB (${pct}% reduction)`);
    console.log('===================================\n');
  } else {
    console.log('\nAll images across projects and lights are up to date.\n');
  }
}

optimizeAll().catch((err) => {
  console.error('Fatal error during image optimization:', err);
  process.exit(1);
});
