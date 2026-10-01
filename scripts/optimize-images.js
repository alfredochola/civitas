const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PROJECTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'projects');
const PROJECTS_JSON = path.join(__dirname, '..', 'src', 'assets', 'data', 'projects.json');
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

async function optimizeImages() {
  console.log('--- Civitas Project Image Optimizer ---');
  console.log(`Scanning: ${PROJECTS_DIR}`);

  const rawImages = getAllFiles(PROJECTS_DIR);
  console.log(`Found ${rawImages.length} images to optimize.`);

  if (rawImages.length === 0) {
    console.log('No uncompressed images found. Everything is up to date.');
    return;
  }

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let convertedCount = 0;

  for (let i = 0; i < rawImages.length; i++) {
    const filePath = rawImages[i];
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const webpPath = path.join(dir, `${baseName}.webp`);

    const originalStats = fs.statSync(filePath);
    totalOriginalSize += originalStats.size;

    try {
      // Convert to WebP with max-width constraint
      await sharp(filePath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toFile(webpPath);

      const webpStats = fs.statSync(webpPath);
      totalOptimizedSize += webpStats.size;
      convertedCount++;

      // Safely remove original raw image
      fs.unlinkSync(filePath);

      const pct = Math.round(((originalStats.size - webpStats.size) / originalStats.size) * 100);
      const origMB = (originalStats.size / 1024 / 1024).toFixed(2);
      const newKB = (webpStats.size / 1024).toFixed(0);
      console.log(`[${i + 1}/${rawImages.length}] ${path.basename(filePath)} (${origMB} MB) -> ${baseName}.webp (${newKB} KB, -${pct}%)`);
    } catch (err) {
      console.error(`Error optimizing ${filePath}:`, err.message);
    }
  }

  // Update projects.json paths to .webp
  if (fs.existsSync(PROJECTS_JSON)) {
    console.log('\nUpdating projects.json image paths...');
    let jsonContent = fs.readFileSync(PROJECTS_JSON, 'utf-8');
    // Replace .png, .jpg, .jpeg in project image paths with .webp
    const updatedJson = jsonContent.replace(/\.(png|jpg|jpeg)(",?)/gi, '.webp$2');
    fs.writeFileSync(PROJECTS_JSON, updatedJson, 'utf-8');
    console.log('Updated projects.json successfully.');
  }

  // Update home.html if references exist
  if (fs.existsSync(HOME_HTML)) {
    console.log('Updating home.html image paths...');
    let homeContent = fs.readFileSync(HOME_HTML, 'utf-8');
    homeContent = homeContent.replace(
      /assets\/images\/projects\/([^"']+)\.(png|jpg|jpeg)/gi,
      'assets/images/projects/$1.webp'
    );
    fs.writeFileSync(HOME_HTML, homeContent, 'utf-8');
    console.log('Updated home.html successfully.');
  }

  const savedMB = ((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2);
  const origTotalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
  const newTotalMB = (totalOptimizedSize / 1024 / 1024).toFixed(2);

  console.log('\n=== Image Optimization Summary ===');
  console.log(`Converted: ${convertedCount} photos`);
  console.log(`Original total size:  ${origTotalMB} MB`);
  console.log(`Optimized total size: ${newTotalMB} MB`);
  console.log(`Bandwidth saved:      ${savedMB} MB (${Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100)}% reduction)`);
  console.log('===================================\n');
}

optimizeImages().catch((err) => {
  console.error('Fatal error during image optimization:', err);
  process.exit(1);
});
