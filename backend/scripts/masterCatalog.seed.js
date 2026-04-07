/**
 * ═══════════════════════════════════════════════════════════════
 * MASTER CATALOG - SEED SCRIPT
 * ═══════════════════════════════════════════════════════════════
 * 
 * Reads CCSP transformed data and populates master catalog
 * 
 * Source: Q:/YourZeroesAndOnes/cureli/ccsp/transformed/medicines_page_*.json
 * Creates: master_medicines + master_medicine_variants + master_medicine_images
 * 
 * Run: node prisma/seeds/masterCatalog.seed.js
 * 
 * ⚠️  IMPORTANT: Run only ONCE or clear tables first
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const CCSP_DATA_DIR = 'Q:/YourZeroesAndOnes/cureli/ccsp/transformed';
const JSON_FILES = ['medicines_page_1.json', 'medicines_page_2.json', 'medicines_page_3.json'];
const BATCH_SIZE = 50; // Insert in batches

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 
    ? `${minutes}m ${remainingSeconds}s` 
    : `${seconds}s`;
}

// ══════════════════════════════════════════════════════════════
// LOAD VARIANTS FROM CCSP
// ══════════════════════════════════════════════════════════════

async function loadAllVariants() {
  console.log('📂 Loading CCSP data files...\n');
  
  const allVariants = [];
  
  for (const jsonFile of JSON_FILES) {
    const filePath = path.join(CCSP_DATA_DIR, jsonFile);
    
    if (!await fs.pathExists(filePath)) {
      console.warn(`⚠️  File not found: ${jsonFile} - Skipping`);
      continue;
    }
    
    const data = await fs.readJson(filePath);
    allVariants.push(...data);
    console.log(`   ✓ Loaded ${jsonFile}: ${data.length} products`);
  }
  
  console.log(`\n✅ Total variants loaded: ${allVariants.length}\n`);
  return allVariants;
}

// ══════════════════════════════════════════════════════════════
// BUILD MASTER RECORDS
// ══════════════════════════════════════════════════════════════

function buildMasters(variants) {
  console.log('🔑 Grouping variants by master_key...\n');
  
  const masterMap = new Map();
  
  for (const variant of variants) {
    const key = variant.master_key;
    
    if (!masterMap.has(key)) {
      // Build generic name
      let genericName = null;
      
      if (variant.composition && variant.composition.length > 0) {
        genericName = variant.composition.map(c => c.name).join(' + ');
      }
      
      if (!genericName) {
        genericName = variant.brand || variant.name;
      }
      
      if (variant.form) {
        genericName = `${genericName} ${variant.form}`;
      }
      
      // Extract composition names (for JSON field)
      const compositionData = variant.composition || [];
      
      masterMap.set(key, {
        master_key: key,
        generic_name: genericName,
        type: variant.type,
        form: variant.form || null,
        composition: compositionData, // Store as JSON
        prescription_required: variant.prescription_required || false,
        primary_category: variant.primary_category || null,
        variant_count: 0,
        variants: []
      });
    }
    
    const master = masterMap.get(key);
    master.variant_count++;
    master.variants.push(variant);
    
    // If any variant requires prescription, master should too
    if (variant.prescription_required) {
      master.prescription_required = true;
    }
    
    // Use DRUG type if any variant is DRUG
    if (variant.type === 'DRUG') {
      master.type = 'DRUG';
    }
  }
  
  const masters = Array.from(masterMap.values());
  console.log(`✅ Grouped into ${masters.length} unique masters\n`);
  
  return masters;
}

// ══════════════════════════════════════════════════════════════
// PREPARE IMAGE DATA
// ══════════════════════════════════════════════════════════════

function prepareImages(variant, masterMedicineId) {
  const images = [];
  let sequence = 0;
  
  // Find phase1_main.jpg (primary)
  const mainImage = variant.images?.find(img => 
    img.url.includes('phase1_main.jpg')
  );
  
  if (mainImage) {
    images.push({
      master_medicine_id: masterMedicineId,
      sku_id: variant.sku_id,
      url: `/static/medicine_images/${variant.sku_id}/phase1_main.jpg`,
      type: 'PRIMARY',
      sequence: sequence++
    });
  } else {
    // Fallback: use img_00_high.jpg as primary
    const firstHigh = variant.images?.find(img => 
      img.url.includes('img_00_high.jpg')
    );
    
    if (firstHigh) {
      images.push({
        master_medicine_id: masterMedicineId,
        sku_id: variant.sku_id,
        url: `/static/medicine_images/${variant.sku_id}/img_00_high.jpg`,
        type: 'PRIMARY',
        sequence: sequence++
      });
    }
  }
  
  // Add gallery images (img_*_high.jpg)
  const galleryImages = variant.images?.filter(img => 
    img.url.match(/img_\d{2}_high\.jpg$/) && 
    !img.url.includes('img_00_high.jpg') // Skip if already added as primary
  ) || [];
  
  for (const img of galleryImages) {
    const filename = path.basename(img.url);
    images.push({
      master_medicine_id: masterMedicineId,
      sku_id: variant.sku_id,
      url: `/static/medicine_images/${variant.sku_id}/${filename}`,
      type: 'GALLERY',
      sequence: sequence++
    });
  }
  
  return images;
}

// ══════════════════════════════════════════════════════════════
// PREPARE VARIANT DATA
// ══════════════════════════════════════════════════════════════

function prepareVariantData(variant, masterMedicineId) {
  // Prepare images array (just filenames for variant.images JSON field)
  const imageUrls = [];
  
  // Add phase1_main.jpg if exists
  if (variant.images?.some(img => img.url.includes('phase1_main.jpg'))) {
    imageUrls.push(`/static/medicine_images/${variant.sku_id}/phase1_main.jpg`);
  }
  
  // Add high-res images
  const highResImages = variant.images?.filter(img => 
    img.url.match(/img_\d{2}_high\.jpg$/)
  ) || [];
  
  for (const img of highResImages) {
    const filename = path.basename(img.url);
    imageUrls.push(`/static/medicine_images/${variant.sku_id}/${filename}`);
  }
  
  return {
    master_medicine_id: masterMedicineId,
    sku_id: variant.sku_id,
    name: variant.name,
    brand: variant.brand || null,
    composition: variant.composition || [],
    strength_value: variant.strength?.value || null,
    strength_unit: variant.strength?.unit || null,
    manufacturer: variant.manufacturer || null,
    marketer: variant.marketer || null,
    pack_size: variant.pack_size || null,
    mrp: variant.price?.mrp || null,
    selling_price: variant.price?.selling_price || null,
    discount_percent: variant.price?.discount_percent || null,
    description: variant.description || null,
    images: imageUrls
  };
}

// ══════════════════════════════════════════════════════════════
// SEED DATABASE
// ══════════════════════════════════════════════════════════════

async function seed() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║       🌱 MASTER CATALOG - DATABASE SEED                   ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  
  const stats = {
    masters: 0,
    variants: 0,
    images: 0,
    errors: []
  };

  try {
    // ── Step 1: Safety Check ─────────────────────────────────
    console.log('🔒 Safety check...\n');
    
    const existingMasters = await prisma.masterMedicine.count();
    const existingVariants = await prisma.masterMedicineVariant.count();
    
    if (existingMasters > 0 || existingVariants > 0) {
      console.error('❌ ERROR: Database already contains master catalog data!\n');
      console.error(`   Masters:  ${existingMasters}`);
      console.error(`   Variants: ${existingVariants}\n`);
      console.error('⚠️  To re-seed, first clear the tables:\n');
      console.error('   npx prisma migrate reset\n');
      process.exit(1);
    }
    
    console.log('✅ Database is empty - safe to proceed\n');
    console.log('─'.repeat(60) + '\n');

    // ── Step 2: Load CCSP Data ───────────────────────────────
    const variants = await loadAllVariants();
    
    if (variants.length === 0) {
      throw new Error('No variants loaded from CCSP data');
    }

    // ── Step 3: Build Masters ────────────────────────────────
    const masters = buildMasters(variants);

    // ── Step 4: Insert Masters ───────────────────────────────
    console.log('💾 Inserting master records...\n');
    
    for (let i = 0; i < masters.length; i += BATCH_SIZE) {
      const batch = masters.slice(i, i + BATCH_SIZE);
      
      for (const master of batch) {
        try {
          await prisma.masterMedicine.create({
            data: {
              master_key: master.master_key,
              generic_name: master.generic_name,
              type: master.type,
              form: master.form,
              composition: master.composition,
              prescription_required: master.prescription_required,
              primary_category: master.primary_category,
              variant_count: master.variant_count
            }
          });
          
          stats.masters++;
        } catch (err) {
          stats.errors.push({
            type: 'master',
            key: master.master_key,
            error: err.message
          });
        }
      }
      
      process.stdout.write(`\r   Progress: ${stats.masters}/${masters.length} masters`);
    }
    
    console.log('\n✅ Masters inserted\n');

    // ── Step 5: Insert Variants & Images ─────────────────────
    console.log('💾 Inserting variants and images...\n');
    
    for (let i = 0; i < masters.length; i++) {
      const master = masters[i];
      
      // Get the created master from DB
      const dbMaster = await prisma.masterMedicine.findUnique({
        where: { master_key: master.master_key }
      });
      
      if (!dbMaster) continue;
      
      for (const variant of master.variants) {
        try {
          // Prepare variant data
          const variantData = prepareVariantData(variant, dbMaster.master_medicine_id);
          
          // Insert variant
          await prisma.masterMedicineVariant.create({
            data: variantData
          });
          
          stats.variants++;
          
          // Prepare and insert images
          const imageData = prepareImages(variant, dbMaster.master_medicine_id);
          
          for (const img of imageData) {
            try {
              await prisma.masterMedicineImage.create({
                data: img
              });
              stats.images++;
            } catch (err) {
              stats.errors.push({
                type: 'image',
                sku: variant.sku_id,
                error: err.message
              });
            }
          }
          
        } catch (err) {
          stats.errors.push({
            type: 'variant',
            sku: variant.sku_id,
            error: err.message
          });
        }
      }
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\r   Progress: ${i + 1}/${masters.length} masters processed (${stats.variants} variants, ${stats.images} images)`);
      }
    }
    
    console.log('\n✅ Variants and images inserted\n');
    console.log('─'.repeat(60) + '\n');

    // ── Step 6: Verify ───────────────────────────────────────
    console.log('🔍 Verifying database...\n');
    
    const finalMasters = await prisma.masterMedicine.count();
    const finalVariants = await prisma.masterMedicineVariant.count();
    const finalImages = await prisma.masterMedicineImage.count();
    
    console.log(`   Masters in DB:  ${finalMasters}`);
    console.log(`   Variants in DB: ${finalVariants}`);
    console.log(`   Images in DB:   ${finalImages}\n`);

    // ── Summary ──────────────────────────────────────────────
    const duration = Date.now() - startTime;
    
    console.log('═'.repeat(60));
    console.log('  ✅ SEED COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n📊 Summary:\n');
    console.log(`   Masters created:  ${stats.masters}`);
    console.log(`   Variants created: ${stats.variants}`);
    console.log(`   Images created:   ${stats.images}`);
    console.log(`   Errors:           ${stats.errors.length}`);
    console.log(`   Duration:         ${formatDuration(duration)}\n`);

    // Show errors if any
    if (stats.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      console.log('─'.repeat(60));
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`   [${err.type}] ${err.key || err.sku}: ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more errors`);
      }
      console.log('');
    }

    // ── Sample Data ──────────────────────────────────────────
    console.log('🔍 Sample Master with Variants:\n');
    
    const sampleMaster = await prisma.masterMedicine.findFirst({
      where: { variant_count: { gt: 1 } },
      include: {
        variants: {
          take: 3,
          select: {
            sku_id: true,
            name: true,
            brand: true,
            strength_value: true,
            strength_unit: true,
            mrp: true
          }
        }
      }
    });
    
    if (sampleMaster) {
      console.log(`   Master: ${sampleMaster.generic_name}`);
      console.log(`   Key:    ${sampleMaster.master_key}`);
      console.log(`   Type:   ${sampleMaster.type}`);
      console.log(`   Variants (${sampleMaster.variant_count} total):`);
      
      for (const v of sampleMaster.variants) {
        const strength = v.strength_value 
          ? `${v.strength_value}${v.strength_unit}` 
          : 'N/A';
        const price = v.mrp ? `₹${v.mrp}` : 'N/A';
        console.log(`     - ${v.name} | ${v.brand || 'N/A'} | ${strength} | ${price}`);
      }
    }
    
    console.log('\n🎉 Master catalog seeded successfully!\n');

  } catch (error) {
    console.error('\n❌ SEED ERROR:\n');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ══════════════════════════════════════════════════════════════
// RUN
// ══════════════════════════════════════════════════════════════

seed()
  .then(() => {
    console.log('✓ Seed script finished\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Seed script failed:\n', err);
    process.exit(1);
  });