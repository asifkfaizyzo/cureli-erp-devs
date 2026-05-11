import prisma from './src/config/prisma.js';

const masters  = await prisma.masterMedicine.count();
const variants = await prisma.masterMedicineVariant.count();
const images   = await prisma.masterMedicineImage.count();
const linked   = await prisma.medicine.count({
  where: { master_medicine_id: { not: null } }
});
const linkedVariant = await prisma.medicine.count({
  where: { linked_variant_id: { not: null } }
});

console.log('Masters:                ', masters);
console.log('Variants:               ', variants);
console.log('Images:                 ', images);
console.log('Medicines with master:  ', linked);
console.log('Medicines with variant: ', linkedVariant);

await prisma.$disconnect();