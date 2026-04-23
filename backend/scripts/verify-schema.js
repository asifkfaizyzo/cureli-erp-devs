// backend/scripts/verify-schema.js
import prisma from "../src/config/prisma.js";

async function verify() {
  // Test 1: Check Medicine can include masterMedicine
  const testQuery1 = await prisma.medicine.findFirst({
    include: {
      masterMedicine: true, // This should NOT error now
    },
  });
  console.log(" Medicine → MasterMedicine relation works");

  // Test 2: Check MasterMedicine can include linkedMedicines
  const testQuery2 = await prisma.masterMedicine.findFirst({
    include: {
      linkedMedicines: true, // This should NOT error now
    },
  });
  console.log(" MasterMedicine → Medicine relation works");

  console.log("\n🎉 Schema relations verified successfully!");
  process.exit(0);
}

verify().catch((e) => {
  console.error(" Verification failed:", e.message);
  process.exit(1);
});
