// backend/src/scripts/diagnoseInventoryBranch.js

import prisma from "../src/config/prisma.js";

async function diagnoseInventoryBranch() {
  console.log("🔍 Diagnosing Inventory Branch Data...\n");

  // 1. Check inventory records without branch_id
  const inventoryWithoutBranch = await prisma.inventory.count({
    where: { branch_id: null }
  });
  
  const inventoryWithBranch = await prisma.inventory.count({
    where: { branch_id: { not: null } }
  });

  console.log("📊 INVENTORY TABLE:");
  console.log(`   - With branch_id: ${inventoryWithBranch}`);
  console.log(`   - Without branch_id (NULL): ${inventoryWithoutBranch}`);
  console.log("");

  // 2. Check medicine records without branch_id
  const medicineWithoutBranch = await prisma.medicine.count({
    where: { branch_id: null }
  });
  
  const medicineWithBranch = await prisma.medicine.count({
    where: { branch_id: { not: null } }
  });

  console.log("💊 MEDICINE TABLE:");
  console.log(`   - With branch_id: ${medicineWithBranch}`);
  console.log(`   - Without branch_id (NULL): ${medicineWithoutBranch}`);
  console.log("");

  // 3. Sample problematic inventory records
  if (inventoryWithoutBranch > 0) {
    const sampleNullBranch = await prisma.inventory.findMany({
      where: { branch_id: null },
      take: 5,
      include: {
        medicine: { select: { name: true, branch_id: true } },
        shop: { select: { business_name: true } }
      }
    });

    console.log("🔴 SAMPLE INVENTORY WITHOUT BRANCH:");
    sampleNullBranch.forEach((inv, i) => {
      console.log(`   ${i + 1}. ${inv.medicine?.name || 'Unknown'}`);
      console.log(`      - Inventory ID: ${inv.inventory_id}`);
      console.log(`      - Shop: ${inv.shop?.business_name}`);
      console.log(`      - Medicine branch_id: ${inv.medicine?.branch_id || 'NULL'}`);
    });
    console.log("");
  }

  // 4. Check if shops have main branches
  const shopsWithMainBranch = await prisma.shop.findMany({
    where: { is_active: true },
    include: {
      branches: {
        where: { branch_type: "main", is_active: true },
        select: { branch_id: true, branch_name: true }
      }
    }
  });

  console.log("🏢 SHOPS WITH MAIN BRANCHES:");
  shopsWithMainBranch.forEach(shop => {
    const mainBranch = shop.branches[0];
    console.log(`   - ${shop.business_name}: ${mainBranch ? mainBranch.branch_name : '❌ NO MAIN BRANCH'}`);
  });

  await prisma.$disconnect();
}

diagnoseInventoryBranch()
  .then(() => {
    console.log("\n✅ Diagnosis complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });