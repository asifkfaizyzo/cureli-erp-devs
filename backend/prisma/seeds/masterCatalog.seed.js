/**
 * ═══════════════════════════════════════════════════════════════
 * Q:\YourZeroesAndOnes\cureli\curely_erp\backend\prisma\seeds\masterCatalog.seed.js
 * MASTER CATALOG - SEED SCRIPT
 * ═══════════════════════════════════════════════════════════════
 *
 * Reads CCSP transformed data and populates master catalog.
 *
 * Source:   H:/ASIF-Work/1mg_scrapper/ccsp_output/
 * Creates:  master_medicines + master_medicine_variants + master_medicine_images
 *
 * Image URLs point to S3 (uploaded separately by upload_to_s3.js)
 *
 * Run: node prisma/seeds/masterCatalog.seed.js
 *
 * ⚠️  IMPORTANT: Run only ONCE or clear tables first.
 * ⚠️  Run upload_to_s3.js BEFORE this script so images exist in S3.
 *
 * Required env vars (in backend .env):
 *   AWS_S3_BUCKET
 *   AWS_REGION       (default: ap-south-1)
 *   CDN_DOMAIN       (optional — if set, used instead of direct S3 URL)
 * ═══════════════════════════════════════════════════════════════
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

// Path to CCSP output — updated to new scraper location
const CCSP_DATA_DIR = "H:/ASIF-Work/1mg_scrapper/ccsp_output";

// Auto-discover all page files from index (no more hardcoded list)
const INDEX_FILE = path.join(CCSP_DATA_DIR, "_index.json");

// S3 config — must match exactly what upload_to_s3.js uses
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_REGION    = process.env.AWS_REGION    || "ap-south-1";
const CDN_DOMAIN    = process.env.CDN_DOMAIN    || null;
const S3_PREFIX     = "medicine_images";

const BATCH_SIZE = 50;

// ══════════════════════════════════════════════════════════════
// VALIDATE ENV
// ══════════════════════════════════════════════════════════════

if (!AWS_S3_BUCKET) {
  console.error("\n❌ Missing required env var: AWS_S3_BUCKET");
  console.error("   Add it to your backend .env file\n");
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════

function formatDuration(ms) {
  const seconds          = Math.floor(ms / 1000);
  const minutes          = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${seconds}s`;
}

// ══════════════════════════════════════════════════════════════
// URL BUILDER
// ══════════════════════════════════════════════════════════════

/**
 * Build the public URL for an image in S3.
 * Must produce identical URLs to upload_to_s3.js → buildImageUrl().
 *
 * Uses CDN if CDN_DOMAIN env var is set, otherwise direct S3 URL.
 *
 * @param {string} skuId
 * @param {string} filename
 * @returns {string}
 */
function buildS3Url(skuId, filename) {
  const key = `${S3_PREFIX}/${skuId}/${filename}`;

  if (CDN_DOMAIN) {
    return `https://${CDN_DOMAIN}/${key}`;
  }

  return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

// ══════════════════════════════════════════════════════════════
// LOAD VARIANTS FROM CCSP
// ══════════════════════════════════════════════════════════════

/**
 * Reads _index.json from CCSP output to discover all page files,
 * then loads every medicine variant from those pages.
 *
 * No hardcoded file list — works regardless of how many pages CCSP generated.
 */
async function loadAllVariants() {
  console.log("📂 Loading CCSP data files...\n");

  // Check index exists
  if (!(await fs.pathExists(INDEX_FILE))) {
    throw new Error(
      `CCSP index not found: ${INDEX_FILE}\n` +
      `Run CCSP first: cd H:/ASIF-Work/1mg_scrapper/ccsp && node src/main.js`
    );
  }

  const index     = await fs.readJson(INDEX_FILE);
  const jsonFiles = index.files; // ["medicines_page_1.json", ...]

  console.log(`   Found ${index.total_pages} page files (${index.total_items} total items)\n`);

  const allVariants = [];

  for (const jsonFile of jsonFiles) {
    const filePath = path.join(CCSP_DATA_DIR, jsonFile);

    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        console.warn(`⚠️  File not found: ${jsonFile} — Skipping`);
        continue;
      }

      const data = await fs.readJson(filePath);
      allVariants.push(...data);
      console.log(`   ✓ Loaded ${jsonFile}: ${data.length} products`);

    } catch (err) {
      console.warn(`⚠️  Error loading ${jsonFile}: ${err.message}`);
    }
  }

  console.log(`\n   Total variants loaded: ${allVariants.length}\n`);
  return allVariants;
}

// ══════════════════════════════════════════════════════════════
// BUILD MASTER RECORDS
// ══════════════════════════════════════════════════════════════

/**
 * Groups all variants by master_key.
 * One master = one molecule+form combination.
 * Multiple variants = same molecule in different strengths/brands.
 */
function buildMasters(variants) {
  console.log("🔑 Grouping variants by master_key...\n");

  const masterMap = new Map();

  for (const variant of variants) {
    const key = variant.master_key;

    if (!key) {
      console.warn(`⚠️  Variant ${variant.sku_id} has no master_key — Skipping`);
      continue;
    }

    if (!masterMap.has(key)) {
      // Build generic name from composition
      let genericName = null;

      if (variant.composition && variant.composition.length > 0) {
        genericName = variant.composition.map((c) => c.name).join(" + ");
      }

      if (!genericName) {
        genericName = variant.brand || variant.name;
      }

      if (variant.form) {
        genericName = `${genericName} ${variant.form}`;
      }

      masterMap.set(key, {
        master_key:           key,
        generic_name:         genericName,
        type:                 variant.type  || "OTC",
        form:                 variant.form  || null,
        composition:          variant.composition || [],
        prescription_required: variant.prescription_required || false,
        primary_category:     variant.primary_category || null,
        variant_count:        0,
        variants:             [],
      });
    }

    const master = masterMap.get(key);
    master.variant_count++;
    master.variants.push(variant);

    // If any variant requires prescription, master requires it too
    if (variant.prescription_required) {
      master.prescription_required = true;
    }

    // If any variant is DRUG type, master is DRUG
    if (variant.type === "DRUG") {
      master.type = "DRUG";
    }
  }

  const masters = Array.from(masterMap.values());
  console.log(`   Grouped into ${masters.length} unique masters\n`);

  return masters;
}

// ══════════════════════════════════════════════════════════════
// PREPARE IMAGE DATA
// ══════════════════════════════════════════════════════════════

/**
 * Builds master_medicine_images rows for a variant.
 *
 * CCSP v3.2 images[] format: [{ filename, type }]
 * Empty array = placeholder SKU = no image rows inserted.
 *
 * Priority:
 *   PRIMARY → phase1_main.jpg (if exists) → fallback img_00_high.jpg
 *   GALLERY → remaining img_*_high.jpg files
 *
 * URLs are S3 URLs constructed by buildS3Url().
 */
function prepareImages(variant, masterMedicineId) {
  const images = [];
  let sequence = 0;

  // Placeholder SKU — no images
  if (!variant.images || variant.images.length === 0) {
    return images;
  }

  // ── Primary image ────────────────────────────────────────────────────────

  const mainImage = variant.images.find(
    (img) => img.filename === "phase1_main.jpg"
  );

  if (mainImage) {
    images.push({
      master_medicine_id: masterMedicineId,
      sku_id:             variant.sku_id,
      url:                buildS3Url(variant.sku_id, "phase1_main.jpg"),
      type:               "PRIMARY",
      sequence:           sequence++,
    });
  } else {
    // Fallback primary: img_00_high.jpg
    const firstHigh = variant.images.find(
      (img) => img.filename === "img_00_high.jpg"
    );

    if (firstHigh) {
      images.push({
        master_medicine_id: masterMedicineId,
        sku_id:             variant.sku_id,
        url:                buildS3Url(variant.sku_id, "img_00_high.jpg"),
        type:               "PRIMARY",
        sequence:           sequence++,
      });
    }
  }

  // ── Gallery images ───────────────────────────────────────────────────────

  // img_*_high.jpg excluding img_00 (already used as primary fallback)
  const galleryImages = variant.images.filter(
    (img) =>
      /^img_\d{2}_high\.jpg$/.test(img.filename) &&
      img.filename !== "img_00_high.jpg"
  );

  for (const img of galleryImages) {
    images.push({
      master_medicine_id: masterMedicineId,
      sku_id:             variant.sku_id,
      url:                buildS3Url(variant.sku_id, img.filename),
      type:               "GALLERY",
      sequence:           sequence++,
    });
  }

  return images;
}

// ══════════════════════════════════════════════════════════════
// PREPARE VARIANT DATA
// ══════════════════════════════════════════════════════════════

/**
 * Builds master_medicine_variants row for a variant.
 *
 * images field on the variant = JSON array of S3 URLs
 * (only phase1_main.jpg and img_*_high.jpg)
 */
function prepareVariantData(variant, masterMedicineId) {

  // Manufacturer — handle string or { name } object
  let manufacturer = null;
  if (variant.manufacturer) {
    manufacturer = typeof variant.manufacturer === "string"
      ? variant.manufacturer
      : variant.manufacturer?.name || null;
  }

  // Marketer — handle string or { name } object
  let marketer = null;
  if (variant.marketer) {
    marketer = typeof variant.marketer === "string"
      ? variant.marketer
      : variant.marketer?.name || null;
  }

  // Build S3 URL list for variant.images JSON field
  const imageUrls = [];

  if (variant.images && variant.images.length > 0) {
    // phase1_main.jpg first if it exists
    if (variant.images.some((img) => img.filename === "phase1_main.jpg")) {
      imageUrls.push(buildS3Url(variant.sku_id, "phase1_main.jpg"));
    }

    // All high-res images
    const highResImages = variant.images.filter(
      (img) => /^img_\d{2}_high\.jpg$/.test(img.filename)
    );

    for (const img of highResImages) {
      imageUrls.push(buildS3Url(variant.sku_id, img.filename));
    }
  }

  return {
    master_medicine_id: masterMedicineId,
    sku_id:             variant.sku_id,
    name:               variant.name,
    brand:              variant.brand              || null,
    composition:        variant.composition        || [],
    strength_value:     variant.strength?.value    || null,
    strength_unit:      variant.strength?.unit     || null,
    manufacturer,
    marketer,
    pack_size:          variant.pack_size          || null,
    mrp:                variant.price?.mrp         || null,
    selling_price:      variant.price?.selling_price    || null,
    discount_percent:   variant.price?.discount_percent || null,
    description:        variant.description        || null,
    images:             imageUrls,
  };
}

// ══════════════════════════════════════════════════════════════
// SEED DATABASE
// ══════════════════════════════════════════════════════════════

async function seed() {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║                                                           ║");
  console.log("║       🌱 MASTER CATALOG - DATABASE SEED                   ║");
  console.log("║                                                           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log(`   S3 Bucket:  ${AWS_S3_BUCKET}`);
  console.log(`   S3 Region:  ${AWS_REGION}`);
  console.log(`   CDN:        ${CDN_DOMAIN || "none (direct S3 URLs)"}\n`);

  const startTime = Date.now();

  const stats = {
    masters:  0,
    variants: 0,
    images:   0,
    errors:   [],
  };

  try {
    // ── Step 1: Safety Check ─────────────────────────────────────────────
    console.log("🔒 Safety check...\n");

    const existingMasters  = await prisma.masterMedicine.count();
    const existingVariants = await prisma.masterMedicineVariant.count();

    if (existingMasters > 0 || existingVariants > 0) {
      console.error("❌ ERROR: Database already contains master catalog data!\n");
      console.error(`   Masters:  ${existingMasters}`);
      console.error(`   Variants: ${existingVariants}\n`);
      console.error("⚠️  To re-seed, first clear the tables:\n");
      console.error("   DELETE FROM master_medicine_images;");
      console.error("   DELETE FROM master_medicine_variants;");
      console.error("   DELETE FROM master_medicines;\n");
      process.exit(1);
    }

    console.log("   ✓ Database is empty — safe to proceed\n");
    console.log("─".repeat(60) + "\n");

    // ── Step 2: Load CCSP Data ───────────────────────────────────────────
    const variants = await loadAllVariants();

    if (variants.length === 0) {
      throw new Error("No variants loaded from CCSP data. Check file paths.");
    }

    // ── Step 3: Build Masters ────────────────────────────────────────────
    const masters = buildMasters(variants);

    // ── Step 4: Insert Masters ───────────────────────────────────────────
    console.log("💾 Inserting master records...\n");

    for (let i = 0; i < masters.length; i += BATCH_SIZE) {
      const batch = masters.slice(i, i + BATCH_SIZE);

      for (const master of batch) {
        try {
          await prisma.masterMedicine.create({
            data: {
              master_key:            master.master_key,
              generic_name:          master.generic_name,
              type:                  master.type,
              form:                  master.form,
              composition:           master.composition,
              prescription_required: master.prescription_required,
              primary_category:      master.primary_category,
              variant_count:         master.variant_count,
            },
          });

          stats.masters++;

        } catch (err) {
          stats.errors.push({
            type:  "master",
            key:   master.master_key,
            error: err.message,
          });
        }
      }

      process.stdout.write(
        `\r   Progress: ${stats.masters}/${masters.length} masters`
      );
    }

    console.log("\n\n   ✓ Masters inserted\n");

    // ── Step 5: Insert Variants & Images ─────────────────────────────────
    console.log("💾 Inserting variants and images...\n");

    for (let i = 0; i < masters.length; i++) {
      const master = masters[i];

      const dbMaster = await prisma.masterMedicine.findUnique({
        where: { master_key: master.master_key },
      });

      if (!dbMaster) continue;

      for (const variant of master.variants) {
        try {
          // Insert variant
          const variantData = prepareVariantData(variant, dbMaster.master_medicine_id);

          await prisma.masterMedicineVariant.create({
            data: variantData,
          });

          stats.variants++;

          // Insert image rows
          const imageData = prepareImages(variant, dbMaster.master_medicine_id);

          for (const img of imageData) {
            try {
              await prisma.masterMedicineImage.create({ data: img });
              stats.images++;
            } catch (err) {
              // Ignore duplicate image errors (safe re-run guard)
              if (!err.message.includes("Unique constraint")) {
                stats.errors.push({
                  type:  "image",
                  sku:   variant.sku_id,
                  error: err.message,
                });
              }
            }
          }

        } catch (err) {
          stats.errors.push({
            type:  "variant",
            sku:   variant.sku_id,
            error: err.message,
          });
        }
      }

      // Progress indicator every 10 masters
      if ((i + 1) % 10 === 0 || i === masters.length - 1) {
        process.stdout.write(
          `\r   Progress: ${i + 1}/${masters.length} masters ` +
          `(${stats.variants} variants, ${stats.images} images)`
        );
      }
    }

    console.log("\n\n   ✓ Variants and images inserted\n");
    console.log("─".repeat(60) + "\n");

    // ── Step 6: Verify ───────────────────────────────────────────────────
    console.log("🔍 Verifying database...\n");

    const finalMasters  = await prisma.masterMedicine.count();
    const finalVariants = await prisma.masterMedicineVariant.count();
    const finalImages   = await prisma.masterMedicineImage.count();

    console.log(`   Masters in DB:  ${finalMasters}`);
    console.log(`   Variants in DB: ${finalVariants}`);
    console.log(`   Images in DB:   ${finalImages}\n`);

    // ── Summary ──────────────────────────────────────────────────────────
    const duration = Date.now() - startTime;

    console.log("═".repeat(60));
    console.log("   SEED COMPLETE");
    console.log("═".repeat(60));
    console.log("\n📊 Summary:\n");
    console.log(`   Masters created:  ${stats.masters}`);
    console.log(`   Variants created: ${stats.variants}`);
    console.log(`   Images created:   ${stats.images}`);
    console.log(`   Errors:           ${stats.errors.length}`);
    console.log(`   Duration:         ${formatDuration(duration)}\n`);

    if (stats.errors.length > 0) {
      console.log("⚠️  Errors encountered:");
      console.log("─".repeat(60));
      stats.errors.slice(0, 10).forEach((err) => {
        console.log(`   [${err.type}] ${err.key || err.sku}: ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`   ... and ${stats.errors.length - 10} more errors`);
      }
      console.log("");
    }

    // ── Sample ───────────────────────────────────────────────────────────
    console.log("🔍 Sample Master with Variants:\n");

    const sampleMaster = await prisma.masterMedicine.findFirst({
      where: { variant_count: { gt: 1 } },
      include: {
        variants: {
          take: 3,
          select: {
            sku_id:         true,
            name:           true,
            brand:          true,
            strength_value: true,
            strength_unit:  true,
            mrp:            true,
          },
        },
      },
    });

    if (sampleMaster) {
      console.log(`   Master: ${sampleMaster.generic_name}`);
      console.log(`   Key:    ${sampleMaster.master_key}`);
      console.log(`   Type:   ${sampleMaster.type}`);
      console.log(`   Variants (${sampleMaster.variant_count} total):`);

      for (const v of sampleMaster.variants) {
        const strength = v.strength_value
          ? `${v.strength_value}${v.strength_unit}`
          : "N/A";
        const price = v.mrp ? `₹${v.mrp}` : "N/A";
        console.log(
          `     - ${v.name} | ${v.brand || "N/A"} | ${strength} | ${price}`
        );
      }
    }

    console.log("\n🎉 Master catalog seeded successfully!\n");
    console.log("   Images are served from S3:");
    console.log(`   ${buildS3Url("example_sku", "img_00_high.jpg")}\n`);

  } catch (error) {
    console.error("\n❌ SEED ERROR:\n");
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
    console.log("✓ Seed script finished\n");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Seed script failed:\n", err);
    process.exit(1);
  });