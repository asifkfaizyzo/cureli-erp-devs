// scripts/test-direct.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    const medicine = await prisma.medicine.findFirst({
      include: {
        masterMedicine: true,
      },
    });
    console.log(" Success! Relation exists");
    console.log("Medicine:", medicine);
  } catch (error) {
    console.log(" Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
