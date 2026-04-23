// scripts/migrate-suppliers-to-branches.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateSuppliersToBranches() {
  console.log("🔄 Starting supplier migration...");

  try {
    // Get all suppliers
    const suppliers = await prisma.supplier.findMany({
      select: {
        supplier_id: true,
        shop_id: true,
        created_by: true,
      },
    });

    console.log(`📦 Found ${suppliers.length} suppliers to migrate`);

    for (const supplier of suppliers) {
      // Get all branches for this shop
      const branches = await prisma.branch.findMany({
        where: {
          shop_id: supplier.shop_id,
          is_active: true,
        },
        select: {
          branch_id: true,
        },
      });

      console.log(
        `  ➜ Supplier ${supplier.supplier_id}: Linking to ${branches.length} branch(es)`,
      );

      // Link supplier to all branches in the shop
      for (const branch of branches) {
        await prisma.supplierBranch.upsert({
          where: {
            supplier_id_branch_id: {
              supplier_id: supplier.supplier_id,
              branch_id: branch.branch_id,
            },
          },
          create: {
            supplier_id: supplier.supplier_id,
            branch_id: branch.branch_id,
            created_by: supplier.created_by,
            is_active: true,
          },
          update: {
            is_active: true,
          },
        });
      }
    }

    console.log(" Migration completed successfully!");
  } catch (error) {
    console.error(" Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateSuppliersToBranches().catch(console.error);
