// scripts/check-client.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  // Get the model metadata
  const medicineModel = prisma.medicine;
  console.log('Medicine model fields:', Object.keys(medicineModel));
  
  // Try to inspect what relations are available
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'medicines'
      AND column_name LIKE '%master%'
    `;
    console.log('Database columns with "master":', result);
  } catch (e) {
    console.log('Query error:', e.message);
  }
  
  await prisma.$disconnect();
}

checkSchema();