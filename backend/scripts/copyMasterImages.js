/**
 * ═══════════════════════════════════════════════════════════════
 * MASTER CATALOG - IMAGE COPY SCRIPT
 * ═══════════════════════════════════════════════════════════════
 * 
 * Copies CCSP images to backend static folder
 * 
 * Source: Q:/YourZeroesAndOnes/cureli/ccsp/transformed/images/{sku_id}/
 * Dest:   backend/static/medicine_images/{sku_id}/
 * 
 * Only copies: phase1_main.jpg, img_*_high.jpg
 * 
 * Run: node scripts/copyMasterImages.js
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const SOURCE_DIR = 'Q:/YourZeroesAndOnes/cureli/ccsp/transformed/images';
const DEST_DIR = path.join(__dirname, '../static/medicine_images');

// Image patterns to copy
const IMAGE_PATTERNS = {
  main: 'phase1_main.jpg',
  high: /^img_\d{2}_high\.jpg$/
};

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 
    ? `${minutes}m ${remainingSeconds}s` 
    : `${seconds}s`;
}

// ══════════════════════════════════════════════════════════════
// MAIN LOGIC
// ══════════════════════════════════════════════════════════════

async function copyImages() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║       🖼️  MASTER CATALOG - IMAGE COPY SCRIPT              ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  
  // Stats
  const stats = {
    foldersProcessed: 0,
    imagesFound: 0,
    imagesCopied: 0,
    imagesSkipped: 0,
    totalSize: 0,
    errors: []
  };

  try {
    // Check source directory exists
    if (!await fs.pathExists(SOURCE_DIR)) {
      throw new Error(`Source directory not found: ${SOURCE_DIR}`);
    }

    // Create destination directory
    await fs.ensureDir(DEST_DIR);
    console.log(`📁 Source: ${SOURCE_DIR}`);
    console.log(`📁 Destination: ${DEST_DIR}\n`);

    // Get all SKU folders
    const skuFolders = await fs.readdir(SOURCE_DIR);
    console.log(`📊 Found ${skuFolders.length} product folders\n`);
    console.log('─'.repeat(60));

    // Process each SKU folder
    for (const skuId of skuFolders) {
      const sourcePath = path.join(SOURCE_DIR, skuId);
      const destPath = path.join(DEST_DIR, skuId);

      // Check if it's a directory
      const stat = await fs.stat(sourcePath);
      if (!stat.isDirectory()) continue;

      stats.foldersProcessed++;

      // Get all files in folder
      const files = await fs.readdir(sourcePath);
      
      // Filter images to copy
      const imagesToCopy = [];

      // Check for phase1_main.jpg (primary)
      if (files.includes(IMAGE_PATTERNS.main)) {
        imagesToCopy.push(IMAGE_PATTERNS.main);
      }

      // Check for img_*_high.jpg (gallery)
      const highResImages = files.filter(file => IMAGE_PATTERNS.high.test(file));
      imagesToCopy.push(...highResImages);

      if (imagesToCopy.length === 0) {
        stats.imagesSkipped++;
        continue;
      }

      // Create destination folder
      await fs.ensureDir(destPath);

      // Copy images
      for (const imageFile of imagesToCopy) {
        const sourceFile = path.join(sourcePath, imageFile);
        const destFile = path.join(destPath, imageFile);

        try {
          // Check if already exists
          if (await fs.pathExists(destFile)) {
            stats.imagesSkipped++;
            continue;
          }

          // Copy file
          await fs.copy(sourceFile, destFile);
          
          // Get file size
          const fileStats = await fs.stat(destFile);
          stats.totalSize += fileStats.size;
          stats.imagesCopied++;
          stats.imagesFound++;

        } catch (err) {
          stats.errors.push({
            sku: skuId,
            file: imageFile,
            error: err.message
          });
        }
      }

      // Progress indicator
      if (stats.foldersProcessed % 100 === 0) {
        process.stdout.write(`\r✓ Processed ${stats.foldersProcessed} folders... (${stats.imagesCopied} images copied)`);
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ COPY COMPLETE\n');

    // Display stats
    const duration = Date.now() - startTime;
    
    console.log('📊 Statistics:');
    console.log('─'.repeat(60));
    console.log(`   Folders processed:    ${stats.foldersProcessed.toLocaleString()}`);
    console.log(`   Images found:         ${stats.imagesFound.toLocaleString()}`);
    console.log(`   Images copied:        ${stats.imagesCopied.toLocaleString()}`);
    console.log(`   Images skipped:       ${stats.imagesSkipped.toLocaleString()}`);
    console.log(`   Total size:           ${formatBytes(stats.totalSize)}`);
    console.log(`   Errors:               ${stats.errors.length}`);
    console.log(`   Duration:             ${formatDuration(duration)}`);
    console.log('─'.repeat(60));

    // Show errors if any
    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      console.log('─'.repeat(60));
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`   SKU ${err.sku} - ${err.file}: ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more errors`);
      }
    }

    console.log('\n🎉 Image copy completed successfully!\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:\n');
    console.error(error);
    process.exit(1);
  }
}

// ══════════════════════════════════════════════════════════════
// RUN
// ══════════════════════════════════════════════════════════════

copyImages()
  .then(() => {
    console.log('✓ Script finished\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Script failed:\n', err);
    process.exit(1);
  });