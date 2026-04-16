import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.masterMedicineVariant.findMany({
  where: { name: { contains: "Penidure", mode: "insensitive" } },
  select: {
    variant_id: true,
    name: true,
    brand: true,
    strength_value: true,
    strength_unit: true,
    manufacturer: true,
    marketer: true,
  }
});
console.log("RESULT:", JSON.stringify(result, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());