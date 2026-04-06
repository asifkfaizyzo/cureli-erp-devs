// backend/src/modules/cadmin/master-medicines/cadminMasterMedicines.service.js

import prisma from "../../../config/prisma.js";

/**
 * Get paginated master medicines with search and filters
 */
export async function getMasterMedicines({
  search = "",
  type = "",
  page = 1,
  limit = 20,
  sort = "created_at",
  order = "desc",
}) {
  // Validate pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where = {
    is_active: true,
  };

  // Search filter (name + normalized_name)
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { normalized_name: { contains: searchTerm, mode: "insensitive" } },
      { composition: { contains: searchTerm, mode: "insensitive" } },
      { manufacturer: { contains: searchTerm, mode: "insensitive" } },
      { marketer: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Type filter
  if (type && (type === "DRUG" || type === "OTC")) {
    where.type = type;
  }

  // Build orderBy
  const validSortFields = ["name", "type", "created_at", "pack_size", "manufacturer", "marketer"];
  const sortField = validSortFields.includes(sort) ? sort : "created_at";
  const sortOrder = order === "asc" ? "asc" : "desc";

  // Execute queries
  const [medicines, total] = await Promise.all([
    prisma.masterMedicine.findMany({
      where,
      include: {
        images: {
          where: { type: "PRIMARY" },
          take: 1,
        },
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limitNum,
    }),
    prisma.masterMedicine.count({ where }),
  ]);

  // Transform data for response
  const transformedMedicines = medicines.map((med) => ({
    id: med.master_medicine_id,
    name: med.name,
    normalizedName: med.normalized_name,
    composition: med.composition,
    type: med.type,
    manufacturer: med.manufacturer,
    marketer: med.marketer,
    packSize: med.pack_size,
    prescriptionRequired: med.prescription_required,
    isActive: med.is_active,
    primaryImage: med.images[0]?.url || null,
    hasPlaceholder: med.images[0]?.url?.includes("PLACEHOLDER") || false,
    createdAt: med.created_at,
    updatedAt: med.updated_at,
  }));

  return {
    medicines: transformedMedicines,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Get single master medicine by ID with all images
 */
export async function getMasterMedicineById(id) {
  const medicine = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: id },
    include: {
      images: {
        orderBy: [
          { type: "asc" }, // PRIMARY first
          { created_at: "asc" },
        ],
      },
    },
  });

  if (!medicine) {
    return null;
  }

  return {
    id: medicine.master_medicine_id,
    name: medicine.name,
    normalizedName: medicine.normalized_name,
    composition: medicine.composition,
    type: medicine.type,
    manufacturer: medicine.manufacturer,
    marketer: medicine.marketer,
    packSize: medicine.pack_size,
    prescriptionRequired: medicine.prescription_required,
    isActive: medicine.is_active,
    images: medicine.images.map((img) => ({
      id: img.image_id,
      url: img.url,
      type: img.type,
      isPlaceholder: img.url?.includes("PLACEHOLDER") || false,
    })),
    createdAt: medicine.created_at,
    updatedAt: medicine.updated_at,
  };
}

/**
 * Get statistics for master medicines
 */
export async function getMasterMedicineStats() {
  const [total, drugCount, otcCount, needsImages] = await Promise.all([
    prisma.masterMedicine.count({ where: { is_active: true } }),
    prisma.masterMedicine.count({ where: { is_active: true, type: "DRUG" } }),
    prisma.masterMedicine.count({ where: { is_active: true, type: "OTC" } }),
    prisma.masterMedicineImage.count({
      where: { url: { contains: "PLACEHOLDER" } },
    }),
  ]);

  return {
    total,
    drugCount,
    otcCount,
    needsImages,
  };
}