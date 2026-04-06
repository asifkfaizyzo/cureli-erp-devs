import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════
const SCRAP_DATA_PATH = 'Q:/YourZeroesAndOnes/cureli/SCRAP DUMMY';

// Placeholder image URL (using a standard medical placeholder)
const PLACEHOLDER_IMAGE = 'PLACEHOLDER/no-image.png';

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Normalize medicine name for fuzzy matching
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize type field
 */
function normalizeType(type) {
  if (!type) return 'DRUG';
  const normalized = type.toLowerCase();
  if (normalized === 'drugs' || normalized === 'drug') return 'DRUG';
  if (normalized === 'otc') return 'OTC';
  if (normalized === 'ayurveda' || normalized === 'ayurvedha') return 'OTC'; // Treat Ayurveda as OTC for now
  return 'DRUG';
}

/**
 * Normalize prescription_required to boolean
 */
function normalizePrescription(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase().includes('prescription');
  }
  return false;
}

/**
 * Find actual image folder (handles special characters)
 */
function findImageFolder(type, sku, basePath) {
  let imageType;
  
  if (type === 'DRUG') {
    imageType = 'DRUGS_IMAGES';
  } else if (type === 'OTC') {
    imageType = 'OTC_IMAGES';
  } else {
    imageType = 'AYURVEDHA_IMAGES';
  }
  
  const imageFolderPath = path.join(basePath, imageType);

  // Check if base path exists
  if (!fs.existsSync(imageFolderPath)) {
    return null;
  }

  // List all folders
  const folders = fs.readdirSync(imageFolderPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  // Find folder starting with SKU_
  const matchingFolder = folders.find(folder => folder.startsWith(`${sku}_`));

  if (!matchingFolder) {
    return null;
  }

  return {
    fullPath: path.join(imageFolderPath, matchingFolder),
    folderName: matchingFolder,
    imageType: imageType
  };
}

/**
 * Build image URLs from folder structure
 * Returns { images: [], usedPlaceholder: boolean }
 */
function buildImageUrls(type, sku, basePath) {
  const folderInfo = findImageFolder(type, sku, basePath);

  const images = [];
  let usedPlaceholder = false;

  // If folder not found, use placeholder
  if (!folderInfo) {
    images.push({
      url: PLACEHOLDER_IMAGE,
      type: 'PRIMARY'
    });
    usedPlaceholder = true;
    return { images, usedPlaceholder };
  }

  const { fullPath, folderName, imageType } = folderInfo;

  // Primary image (phase1_main.jpg)
  const primaryImagePath = path.join(fullPath, 'phase1_main.jpg');
  if (fs.existsSync(primaryImagePath)) {
    images.push({
      url: `${imageType}/${folderName}/phase1_main.jpg`,
      type: 'PRIMARY'
    });
  } else {
    // Use placeholder if primary image missing
    images.push({
      url: PLACEHOLDER_IMAGE,
      type: 'PRIMARY'
    });
    usedPlaceholder = true;
  }

  // Gallery images (img_00_medium.jpg, img_01_medium.jpg, etc.)
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    const galleryImages = files
      .filter(file => file.match(/^img_\d+_medium\.jpg$/))
      .sort()
      .map(file => ({
        url: `${imageType}/${folderName}/${file}`,
        type: 'GALLERY'
      }));

    images.push(...galleryImages);
  }

  return { images, usedPlaceholder };
}

// ══════════════════════════════════════════════════════════════
// SEED DATA
// ══════════════════════════════════════════════════════════════

const SEED_FILES = [
  // ══════════════════════════════════════════════════════════════
  // DRUGS - Will use placeholder images (JSON/Image mismatch)
  // ══════════════════════════════════════════════════════════════
  { type: 'DRUG', folder: 'DRUGS_DETAILED', file: '5216.json' },
  { type: 'DRUG', folder: 'DRUGS_DETAILED', file: '5222.json' },
  { type: 'DRUG', folder: 'DRUGS_DETAILED', file: '5226.json' },
  { type: 'DRUG', folder: 'DRUGS_DETAILED', file: '5228.json' },
  { type: 'DRUG', folder: 'DRUGS_DETAILED', file: '5318.json' },
  
  // ══════════════════════════════════════════════════════════════
  // OTC - Should have real images ✅
  // ══════════════════════════════════════════════════════════════
  { type: 'OTC', folder: 'OTC_DETAILED', file: '1000000.json' },
  { type: 'OTC', folder: 'OTC_DETAILED', file: '1000001.json' },
  { type: 'OTC', folder: 'OTC_DETAILED', file: '1000003.json' },
  { type: 'OTC', folder: 'OTC_DETAILED', file: '1000004.json' },
  { type: 'OTC', folder: 'OTC_DETAILED', file: '1000005.json' },
  { type: 'OTC', folder: 'OTC_DETAILED', file: '1000009.json' },
  { type: 'OTC', folder: 'OTC_DETAILED', file: '1000010.json' },
  
  // ══════════════════════════════════════════════════════════════
  // AYURVEDA - Will use placeholder images (not scraped yet)
  // ══════════════════════════════════════════════════════════════
  { type: 'OTC', folder: 'AYURVEDHA_DETAILED', file: '1.json' },
  { type: 'OTC', folder: 'AYURVEDHA_DETAILED', file: '2.json' },
  { type: 'OTC', folder: 'AYURVEDHA_DETAILED', file: '3.json' },
];

// ══════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ══════════════════════════════════════════════════════════════

async function seedMasterMedicines() {
  console.log('🌱 Starting Master Medicine Catalog seed...\n');

  let successCount = 0;
  let errorCount = 0;
  const needsImages = []; // Track medicines that need images uploaded

  for (const seedFile of SEED_FILES) {
    try {
      const filePath = path.join(SCRAP_DATA_PATH, seedFile.folder, seedFile.file);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        errorCount++;
        continue;
      }

      // Read and parse JSON
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawData);

      // Extract fields
      const medicineData = {
        name: data.name,
        normalized_name: normalizeName(data.name),
        composition: data.composition || null,
        type: normalizeType(data.type || seedFile.type),
        manufacturer: data.manufacturer?.name || null,
        marketer: data.marketer?.name || null,
        pack_size: data.pack_size || data.pack_size_label || null,
        prescription_required: normalizePrescription(data.prescription_required),
      };

      // Create medicine record
      const medicine = await prisma.masterMedicine.create({
        data: medicineData,
      });

      console.log(`✅ Created: ${medicine.name} (${medicine.type})`);

      // Build and insert images (with placeholder fallback)
      const { images, usedPlaceholder } = buildImageUrls(
        medicine.type,
        data.sku_id,
        SCRAP_DATA_PATH
      );

      if (images.length > 0) {
        await prisma.masterMedicineImage.createMany({
          data: images.map(img => ({
            master_medicine_id: medicine.master_medicine_id,
            url: img.url,
            type: img.type,
          })),
        });
        
        if (usedPlaceholder) {
          console.log(`   📦 Using placeholder image (needs upload)`);
          needsImages.push({
            id: medicine.master_medicine_id,
            name: medicine.name,
            type: medicine.type,
            sku: data.sku_id
          });
        } else {
          console.log(`   📸 Added ${images.length} image(s)`);
        }
      }

      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${seedFile.file}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Seed completed: ${successCount} success, ${errorCount} errors`);
  console.log(`${'═'.repeat(60)}`);

  // Report medicines needing images
  if (needsImages.length > 0) {
    console.log(`\n📋 MEDICINES NEEDING IMAGES (${needsImages.length}):`);
    console.log(`${'─'.repeat(60)}`);
    needsImages.forEach(med => {
      console.log(`   • ${med.name} (${med.type}) - SKU: ${med.sku}`);
    });
    console.log(`\n💡 TIP: Upload images via CAdmin later for these medicines`);
  }
}

// ══════════════════════════════════════════════════════════════
// RUN SEED
// ══════════════════════════════════════════════════════════════

seedMasterMedicines()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });