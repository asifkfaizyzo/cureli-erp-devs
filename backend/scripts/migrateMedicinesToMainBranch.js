// backend/src/scripts/migrateInventoryBranch.js

import prisma from "../src/config/prisma.js";

/**
 * Migration: Assign branch_id to old inventory records that don't have it
 * 
 * Strategy:
 * 1. For each shop, get the main branch
 * 2. Update all inventory records without branch_id to use main branch
 * 3. Also update medicines without branch_id
 */
async function migrateInventoryBranch() {
  console.log("🔄 Starting Inventory Branch Migration...\n");

  try {
    // Get all active shops with their main branches
    const shops = await prisma.shop.findMany({
      where: { is_active: true },
      include: {
        branches: {
          where: { branch_type: "main", is_active: true },
          take: 1,
        },
      },
    });

    console.log(`📊 Found ${shops.length} shops to process\n`);

    let totalInventoryMigrated = 0;
    let totalMedicineMigrated = 0;
    let shopsProcessed = 0;

    for (const shop of shops) {
      const mainBranch = shop.branches[0];

      if (!mainBranch) {
        console.warn(`⚠️  Shop "${shop.business_name}" has no main branch - SKIPPING`);
        continue;
      }

      console.log(`\n🏢 Processing: ${shop.business_name}`);
      console.log(`   Main Branch: ${mainBranch.branch_name} (${mainBranch.branch_id})`);

      // ============================================
      // 1. UPDATE INVENTORY RECORDS
      // ============================================
      const inventoryResult = await prisma.inventory.updateMany({
        where: {
          shop_id: shop.shop_id,
          branch_id: null,
        },
        data: {
          branch_id: mainBranch.branch_id,
        },
      });

      if (inventoryResult.count > 0) {
        console.log(`   ✅ Inventory: Migrated ${inventoryResult.count} records`);
        totalInventoryMigrated += inventoryResult.count;
      } else {
        console.log(`   ℹ️  Inventory: No records needed migration`);
      }

      // ============================================
      // 2. UPDATE MEDICINE RECORDS
      // ============================================
      const medicineResult = await prisma.medicine.updateMany({
        where: {
          shop_id: shop.shop_id,
          branch_id: null,
        },
        data: {
          branch_id: mainBranch.branch_id,
        },
      });

      if (medicineResult.count > 0) {
        console.log(`   ✅ Medicines: Migrated ${medicineResult.count} records`);
        totalMedicineMigrated += medicineResult.count;
      } else {
        console.log(`   ℹ️  Medicines: No records needed migration`);
      }

      // ============================================
      // 3. UPDATE STOCK LEDGER RECORDS (if any have null branch_id)
      // ============================================
      const ledgerResult = await prisma.stockLedger.updateMany({
        where: {
          shop_id: shop.shop_id,
          branch_id: null,
        },
        data: {
          branch_id: mainBranch.branch_id,
        },
      });

      if (ledgerResult.count > 0) {
        console.log(`   ✅ Stock Ledger: Migrated ${ledgerResult.count} records`);
      }

      // ============================================
      // 4. UPDATE PURCHASE INVOICES (if any have null branch_id)
      // ============================================
      const purchaseResult = await prisma.purchaseInvoice.updateMany({
        where: {
          shop_id: shop.shop_id,
          branch_id: null,
        },
        data: {
          branch_id: mainBranch.branch_id,
        },
      });

      if (purchaseResult.count > 0) {
        console.log(`   ✅ Purchase Invoices: Migrated ${purchaseResult.count} records`);
      }

      shopsProcessed++;
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log("\n" + "=".repeat(50));
    console.log("📈 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`   Shops Processed: ${shopsProcessed}`);
    console.log(`   Inventory Records Migrated: ${totalInventoryMigrated}`);
    console.log(`   Medicine Records Migrated: ${totalMedicineMigrated}`);
    console.log("=".repeat(50));

    // ============================================
    // VERIFICATION
    // ============================================
    console.log("\n🔍 Verifying migration...");

    const remainingNullInventory = await prisma.inventory.count({
      where: { branch_id: null }
    });

    const remainingNullMedicine = await prisma.medicine.count({
      where: { branch_id: null }
    });

    if (remainingNullInventory === 0 && remainingNullMedicine === 0) {
      console.log("✅ All records now have branch_id assigned!");
    } else {
      console.log(`⚠️  Remaining records without branch_id:`);
      console.log(`   - Inventory: ${remainingNullInventory}`);
      console.log(`   - Medicine: ${remainingNullMedicine}`);
    }

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateInventoryBranch()
  .then(() => {
    console.log("\n✅ Migration complete!");
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });