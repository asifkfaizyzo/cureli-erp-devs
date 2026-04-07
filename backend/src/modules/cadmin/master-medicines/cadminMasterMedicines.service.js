/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 * backend\src\modules\cadmin\master-medicines\cadminMasterMedicines.service.js
 * ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 */

import prisma from "../../../config/prisma.js";

// ══════════════════════════════════════════════════════════════
// GET NEEDS REVIEW MEDICINES
// ══════════════════════════════════════════════════════════════

export async function getNeedsReviewMedicines({
  search = "",
  confidenceFilter = "",
  page = 1,
  limit = 20,
}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where = {
    link_status: "SUGGESTED",
    suggested_master_id: { not: null },
    link_rejected: false,
    is_active: true,
  };

  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { normalized_name: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Confidence filter
  if (confidenceFilter === "high") {
    where.link_confidence_score = { gte: 90 };
  } else if (confidenceFilter === "medium") {
    where.link_confidence_score = { gte: 70, lt: 90 };
  } else if (confidenceFilter === "low") {
    where.link_confidence_score = { lt: 70 };
  }

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      select: {
        medicine_id: true,
        name: true,
        normalized_name: true,
        manufacturer: true,
        link_confidence_score: true,
        suggestion_reason: true,
        suggested_master_id: true,
        shop_id: true,
        created_at: true,
        shop: {
          select: {
            shop_id: true,
            business_name: true,
          },
        },
      },
      orderBy: { link_confidence_score: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.medicine.count({ where }),
  ]);

  // Fetch suggested master details for each
  const suggestedMasterIds = [
    ...new Set(medicines.map((m) => m.suggested_master_id).filter(Boolean)),
  ];

  const suggestedMasters = await prisma.masterMedicine.findMany({
    where: { master_medicine_id: { in: suggestedMasterIds } },
    include: {
      images: {
        where: { type: "PRIMARY" },
        take: 1,
      },
    },
  });

  const masterMap = new Map(
    suggestedMasters.map((m) => [m.master_medicine_id, m])
  );

  // Re-validate suggestions (hybrid approach)
  const reviewItems = medicines.map((med) => {
    const suggestedMaster = masterMap.get(med.suggested_master_id);

    return {
      id: med.medicine_id,
      rawName: med.name,
      normalizedRaw: med.normalized_name || med.name.toLowerCase(),
      suggestedMaster: suggestedMaster
        ? {
            id: suggestedMaster.master_medicine_id,
            masterKey: suggestedMaster.master_key,
            name: suggestedMaster.generic_name,
            type: suggestedMaster.type,
            manufacturer: null, // Master doesn't have manufacturer directly
            hasImage: suggestedMaster.images.length > 0,
            imageStatus: computeImageStatus(suggestedMaster.images),
          }
        : null,
      confidenceScore: Math.round(med.link_confidence_score || 0),
      confidenceReason: med.suggestion_reason || "Auto-detected match",
      shopId: med.shop?.shop_id,
      shopName: med.shop?.business_name || "Unknown Shop",
      occurrenceCount: 1, // Individual medicine
      firstSeenAt: med.created_at,
    };
  });

  // Filter out items where suggested master no longer exists
  const validItems = reviewItems.filter((item) => item.suggestedMaster !== null);

  return {
    reviewItems: validItems,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

// ══════════════════════════════════════════════════════════════
// GET LINKED SHOP MEDICINES FOR A MASTER
// ══════════════════════════════════════════════════════════════

export async function getLinkedMedicines(masterMedicineId) {
  const linkedMedicines = await prisma.medicine.findMany({
    where: {
      master_medicine_id: masterMedicineId,
      link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED"] },
    },
    select: {
      medicine_id: true,
      name: true,
      normalized_name: true,
      manufacturer: true,
      linked_at: true,
      linked_by_type: true,
      link_status: true,
      link_confidence_score: true,
      shop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
    orderBy: { linked_at: "desc" },
  });

  return linkedMedicines.map((med) => ({
    id: med.medicine_id,
    originalName: med.name,
    normalizedName: med.normalized_name || med.name.toLowerCase(),
    shopId: med.shop?.shop_id,
    shopName: med.shop?.business_name || "Unknown Shop",
    manufacturer: med.manufacturer,
    occurrenceCount: 1,
    linkedAt: med.linked_at,
    linkedBy: med.linked_by_type === "SYSTEM" ? "System" : med.linked_by_type === "CADMIN" ? "CAdmin" : "Shop User",
    linkStatus: med.link_status,
    confidence: med.link_confidence_score,
  }));
}

// ══════════════════════════════════════════════════════════════
// CADMIN: ACCEPT REVIEW MATCH
// ══════════════════════════════════════════════════════════════

export async function acceptReviewMatch(medicineId, cadminId) {
  const medicine = await prisma.medicine.findUnique({
    where: { medicine_id: medicineId },
  });

  if (!medicine) throw new Error("Medicine not found");
  if (!medicine.suggested_master_id) throw new Error("No suggestion to accept");

  // Verify master still exists
  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: medicine.suggested_master_id },
  });

  if (!master) throw new Error("Suggested master no longer exists");

  // Link the medicine
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: medicine.suggested_master_id,
      link_status: "MANUAL_LINKED",
      link_confidence_score: medicine.link_confidence_score,
      linked_at: new Date(),
      linked_by_id: cadminId,
      linked_by_type: "CADMIN",
    },
  });

  return {
    success: true,
    medicine: updated,
    linkedTo: {
      master_id: master.master_medicine_id,
      master_key: master.master_key,
      generic_name: master.generic_name,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// CADMIN: REJECT REVIEW MATCH
// ══════════════════════════════════════════════════════════════

export async function rejectReviewMatch(medicineId) {
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      link_status: "PENDING",
      suggested_master_id: null,
      suggestion_reason: null,
      link_confidence_score: null,
    },
  });

  return { success: true, medicine: updated };
}

// ══════════════════════════════════════════════════════════════
// CADMIN: MATCH UNMAPPED TO EXISTING MASTER
// ══════════════════════════════════════════════════════════════

export async function matchUnmappedToMaster(medicineIds, masterMedicineId, cadminId) {
  // Verify master exists
  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
  });

  if (!master) throw new Error("Master medicine not found");

  // Link all medicines in the group
  const result = await prisma.medicine.updateMany({
    where: {
      medicine_id: { in: medicineIds },
    },
    data: {
      master_medicine_id: masterMedicineId,
      link_status: "MANUAL_LINKED",
      link_confidence_score: 100,
      linked_at: new Date(),
      linked_by_id: cadminId,
      linked_by_type: "CADMIN",
      suggested_master_id: null,
      suggestion_reason: null,
    },
  });

  return {
    success: true,
    linkedCount: result.count,
    linkedTo: {
      master_id: master.master_medicine_id,
      master_key: master.master_key,
      generic_name: master.generic_name,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// CADMIN: IGNORE UNMAPPED MEDICINES
// ══════════════════════════════════════════════════════════════

export async function ignoreUnmappedMedicines(medicineIds) {
  const result = await prisma.medicine.updateMany({
    where: {
      medicine_id: { in: medicineIds },
    },
    data: {
      link_status: "UNLINKED",
      link_rejected: true,
    },
  });

  return { success: true, ignoredCount: result.count };
}

// ══════════════════════════════════════════════════════════════
// CADMIN: UNLINK SHOP MEDICINE FROM MASTER
// ══════════════════════════════════════════════════════════════

export async function unlinkShopMedicine(medicineId) {
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: null,
      link_status: "PENDING",
      link_confidence_score: null,
      linked_at: null,
      linked_by_id: null,
      linked_by_type: null,
    },
  });

  return { success: true, medicine: updated };
}

// ══════════════════════════════════════════════════════════════
// CADMIN: UPLOAD IMAGE
// ══════════════════════════════════════════════════════════════

export async function uploadMasterImage(masterMedicineId, imageData, cadminName) {
  const { filename, type = "PRIMARY", skuId } = imageData;

  // Get master to determine sku_id
  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
    include: {
      variants: { take: 1, select: { sku_id: true } },
    },
  });

  if (!master) throw new Error("Master medicine not found");

  const effectiveSkuId = skuId || master.variants[0]?.sku_id || "master";
  const url = `/static/medicine_images/${effectiveSkuId}/${filename}`;

  // If setting as PRIMARY, unset existing primary
  if (type === "PRIMARY") {
    await prisma.masterMedicineImage.updateMany({
      where: {
        master_medicine_id: masterMedicineId,
        type: "PRIMARY",
      },
      data: { type: "GALLERY" },
    });
  }

  // Get next sequence
  const maxSeq = await prisma.masterMedicineImage.aggregate({
    where: { master_medicine_id: masterMedicineId },
    _max: { sequence: true },
  });

  const image = await prisma.masterMedicineImage.create({
    data: {
      master_medicine_id: masterMedicineId,
      sku_id: effectiveSkuId,
      url,
      type,
      source: "UPLOADED",
      sequence: (maxSeq._max.sequence || 0) + 1,
      uploaded_by: cadminName,
    },
  });

  return image;
}

// ══════════════════════════════════════════════════════════════
// CADMIN: DELETE IMAGE
// ══════════════════════════════════════════════════════════════

export async function deleteMasterImage(imageId) {
  const image = await prisma.masterMedicineImage.findUnique({
    where: { image_id: imageId },
  });

  if (!image) throw new Error("Image not found");

  await prisma.masterMedicineImage.delete({
    where: { image_id: imageId },
  });

  return { success: true, deletedImage: image };
}



// ══════════════════════════════════════════════════════════════
// HELPER: Compute Image Status
// ══════════════════════════════════════════════════════════════

function computeImageStatus(images) {
  if (!images || images.length === 0) return "NONE";
  
  // Check if any image has source = "UPLOADED"
  const hasUploaded = images.some((img) => img.source === "UPLOADED");
  if (hasUploaded) return "VERIFIED";
  
  // All images are scraped
  return "RAW";
}

// ══════════════════════════════════════════════════════════════
// GET MASTER MEDICINES (LIST WITH SEARCH & FILTERS)
// ══════════════════════════════════════════════════════════════

export async function getMasterMedicines({
  search = "",
  type = "",
  form = "",
  category = "",
  prescriptionRequired = null,
  minVariants = null,
  maxVariants = null,
  page = 1,
  limit = 20,
  sort = "generic_name",
  order = "asc",
}) {
  // Validate pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where = {
    is_active: true,
  };

  // Search filter
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { generic_name: { contains: searchTerm, mode: "insensitive" } },
      { master_key: { contains: searchTerm, mode: "insensitive" } },
      { primary_category: { contains: searchTerm, mode: "insensitive" } },
      // Search in variants
      {
        variants: {
          some: {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { brand: { contains: searchTerm, mode: "insensitive" } },
              { manufacturer: { contains: searchTerm, mode: "insensitive" } },
              { marketer: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  // Type filter (DRUG / OTC)
  if (type && (type === "DRUG" || type === "OTC")) {
    where.type = type;
  }

  // Form filter
  if (form && form.trim()) {
    where.form = { equals: form.trim(), mode: "insensitive" };
  }

  // Category filter
  if (category && category.trim()) {
    where.primary_category = { equals: category.trim(), mode: "insensitive" };
  }

  // Prescription filter
  if (prescriptionRequired !== null) {
    where.prescription_required = prescriptionRequired === "true" || prescriptionRequired === true;
  }

  // Variant count filters
  if (minVariants !== null) {
    where.variant_count = { ...where.variant_count, gte: parseInt(minVariants) };
  }
  if (maxVariants !== null) {
    where.variant_count = { ...where.variant_count, lte: parseInt(maxVariants) };
  }

  // Build orderBy
  const validSortFields = [
    "generic_name",
    "master_key",
    "type",
    "form",
    "variant_count",
    "created_at",
    "primary_category",
  ];
  const sortField = validSortFields.includes(sort) ? sort : "generic_name";
  const sortOrder = order === "desc" ? "desc" : "asc";

  // Execute queries
  const [medicines, total] = await Promise.all([
    prisma.masterMedicine.findMany({
      where,
      include: {
        variants: {
          take: 5, // Preview variants
          orderBy: { mrp: "asc" },
          select: {
            variant_id: true,
            sku_id: true,
            name: true,
            brand: true,
            strength_value: true,
            strength_unit: true,
            mrp: true,
            selling_price: true,
            discount_percent: true,
            manufacturer: true,
            marketer: true,
            pack_size: true,
            images: true,
          },
        },
        images: true, // ✅ CHANGED: Get ALL images to compute status
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limitNum,
    }),
    prisma.masterMedicine.count({ where }),
  ]);

  // Transform data for response
  const transformedMedicines = medicines.map((med) => {
    // Calculate price range from variants
    const prices = med.variants
      .map((v) => v.mrp)
      .filter((p) => p !== null)
      .map((p) => parseFloat(p));

    const priceRange =
      prices.length > 0
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
          }
        : null;

    // ✅ FIXED: Compute image status from ALL images
    const imageStatus = computeImageStatus(med.images);

    // ✅ FIXED: Get primary image properly
    const primaryImageObj = med.images.find((img) => img.type === "PRIMARY");
    const primaryImage = primaryImageObj?.url || med.variants[0]?.images?.[0] || null;

    return {
      id: med.master_medicine_id,
      masterKey: med.master_key,
      genericName: med.generic_name,
      type: med.type,
      form: med.form,
      composition: med.composition,
      prescriptionRequired: med.prescription_required,
      primaryCategory: med.primary_category,
      variantCount: med.variant_count,
      priceRange,
      primaryImage,
      imageStatus, // ✅ NOW CORRECT
      hasPlaceholder: primaryImage?.includes("PLACEHOLDER") || false,
      previewVariants: med.variants.map((v) => ({
        id: v.variant_id,
        skuId: v.sku_id,
        name: v.name,
        brand: v.brand,
        strength: v.strength_value
          ? `${v.strength_value}${v.strength_unit || ""}`
          : null,
        mrp: v.mrp ? parseFloat(v.mrp) : null,
        sellingPrice: v.selling_price ? parseFloat(v.selling_price) : null,
        discountPercent: v.discount_percent,
        manufacturer: v.manufacturer,
        marketer: v.marketer,
        packSize: v.pack_size,
        primaryImage: v.images?.[0] || null,
      })),
      createdAt: med.created_at,
      updatedAt: med.updated_at,
    };
  });

  return {
    medicines: transformedMedicines,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNext: pageNum < Math.ceil(total / limitNum),
      hasPrev: pageNum > 1,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// GET SINGLE MASTER MEDICINE WITH ALL VARIANTS
// ══════════════════════════════════════════════════════════════

export async function getMasterMedicineById(id) {
  // Try finding by UUID first, then by master_key
  let medicine = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: id },
    include: {
      variants: {
        orderBy: [{ brand: "asc" }, { mrp: "asc" }],
      },
      images: {
        orderBy: [{ type: "asc" }, { sequence: "asc" }],
      },
    },
  });

  // If not found by UUID, try master_key
  if (!medicine) {
    medicine = await prisma.masterMedicine.findUnique({
      where: { master_key: id },
      include: {
        variants: {
          orderBy: [{ brand: "asc" }, { mrp: "asc" }],
        },
        images: {
          orderBy: [{ type: "asc" }, { sequence: "asc" }],
        },
      },
    });
  }

  if (!medicine) {
    return null;
  }

  // Calculate price range
  const prices = medicine.variants
    .map((v) => v.mrp)
    .filter((p) => p !== null)
    .map((p) => parseFloat(p));

  const priceRange =
    prices.length > 0
      ? {
          min: Math.min(...prices),
          max: Math.max(...prices),
        }
      : null;

  // Get unique brands
  const brands = [
    ...new Set(medicine.variants.map((v) => v.brand).filter(Boolean)),
  ].sort();

  // Get unique manufacturers
  const manufacturers = [
    ...new Set(medicine.variants.map((v) => v.manufacturer).filter(Boolean)),
  ].sort();

  // Get unique marketers
  const marketers = [
    ...new Set(medicine.variants.map((v) => v.marketer).filter(Boolean)),
  ].sort();

  // Get unique strengths
  const strengths = [
    ...new Set(
      medicine.variants
        .filter((v) => v.strength_value)
        .map((v) => `${v.strength_value}${v.strength_unit || ""}`)
    ),
  ].sort();

  // ✅ Compute image status
  const imageStatus = computeImageStatus(medicine.images);

  return {
    id: medicine.master_medicine_id,
    masterKey: medicine.master_key,
    genericName: medicine.generic_name,
    type: medicine.type,
    form: medicine.form,
    composition: medicine.composition,
    prescriptionRequired: medicine.prescription_required,
    primaryCategory: medicine.primary_category,
    variantCount: medicine.variant_count,
    isActive: medicine.is_active,
    imageStatus, // ✅ ADD THIS

    // Aggregated data
    priceRange,
    brands,
    manufacturers,
    marketers,
    strengths,

    // All variants
    variants: medicine.variants.map((v) => ({
      id: v.variant_id,
      skuId: v.sku_id,
      name: v.name,
      brand: v.brand,
      composition: v.composition,
      strength: v.strength_value
        ? {
            value: v.strength_value,
            unit: v.strength_unit,
            display: `${v.strength_value}${v.strength_unit || ""}`,
          }
        : null,
      manufacturer: v.manufacturer,
      marketer: v.marketer,
      packSize: v.pack_size,
      pricing: {
        mrp: v.mrp ? parseFloat(v.mrp) : null,
        sellingPrice: v.selling_price ? parseFloat(v.selling_price) : null,
        discountPercent: v.discount_percent,
      },
      description: v.description,
      images: v.images || [],
      createdAt: v.created_at,
      updatedAt: v.updated_at,
    })),

    // Images (grouped by variant)
    images: medicine.images.map((img) => ({
      id: img.image_id,
      skuId: img.sku_id,
      url: img.url,
      type: img.type,
      source: img.source, // ✅ ADD THIS
      sequence: img.sequence,
      uploadedBy: img.uploaded_by,
      isPlaceholder: img.url?.includes("PLACEHOLDER") || false,
    })),

    createdAt: medicine.created_at,
    updatedAt: medicine.updated_at,
  };
}

// ══════════════════════════════════════════════════════════════
// GET MASTER MEDICINE BY MASTER KEY
// ══════════════════════════════════════════════════════════════

export async function getMasterMedicineByKey(masterKey) {
  return getMasterMedicineById(masterKey);
}

// ══════════════════════════════════════════════════════════════
// GET VARIANT BY SKU ID
// ══════════════════════════════════════════════════════════════

export async function getVariantBySkuId(skuId) {
  const variant = await prisma.masterMedicineVariant.findUnique({
    where: { sku_id: skuId },
    include: {
      master: {
        select: {
          master_medicine_id: true,
          master_key: true,
          generic_name: true,
          type: true,
          form: true,
          prescription_required: true,
          primary_category: true,
        },
      },
    },
  });

  if (!variant) {
    return null;
  }

  // Get images for this variant
  const images = await prisma.masterMedicineImage.findMany({
    where: { sku_id: skuId },
    orderBy: [{ type: "asc" }, { sequence: "asc" }],
  });

  return {
    id: variant.variant_id,
    skuId: variant.sku_id,
    name: variant.name,
    brand: variant.brand,
    composition: variant.composition,
    strength: variant.strength_value
      ? {
          value: variant.strength_value,
          unit: variant.strength_unit,
          display: `${variant.strength_value}${variant.strength_unit || ""}`,
        }
      : null,
    manufacturer: variant.manufacturer,
    marketer: variant.marketer,
    packSize: variant.pack_size,
    pricing: {
      mrp: variant.mrp ? parseFloat(variant.mrp) : null,
      sellingPrice: variant.selling_price
        ? parseFloat(variant.selling_price)
        : null,
      discountPercent: variant.discount_percent,
    },
    description: variant.description,
    images: images.map((img) => ({
      id: img.image_id,
      url: img.url,
      type: img.type,
      source: img.source,
      sequence: img.sequence,
      uploadedBy: img.uploaded_by,
    })),
    master: {
      id: variant.master.master_medicine_id,
      masterKey: variant.master.master_key,
      genericName: variant.master.generic_name,
      type: variant.master.type,
      form: variant.master.form,
      prescriptionRequired: variant.master.prescription_required,
      primaryCategory: variant.master.primary_category,
    },
    createdAt: variant.created_at,
    updatedAt: variant.updated_at,
  };
}

// ══════════════════════════════════════════════════════════════
// GET STATISTICS (✅ FIXED: Add image status counts)
// ══════════════════════════════════════════════════════════════

export async function getMasterMedicineStats() {
  const [
    totalMasters,
    totalVariants,
    totalImages,
    drugCount,
    otcCount,
    categoryCounts,
    formCounts,
    multiVariantCount,
    prescriptionRequiredCount,
    recentlyAdded,
    // ✅ NEW: Get all masters with images to compute status
    allMasters,
  ] = await Promise.all([
    // Total counts
    prisma.masterMedicine.count({ where: { is_active: true } }),
    prisma.masterMedicineVariant.count(),
    prisma.masterMedicineImage.count(),

    // By type
    prisma.masterMedicine.count({ where: { is_active: true, type: "DRUG" } }),
    prisma.masterMedicine.count({ where: { is_active: true, type: "OTC" } }),

    // By category
    prisma.masterMedicine.groupBy({
      by: ["primary_category"],
      where: { is_active: true, primary_category: { not: null } },
      _count: { primary_category: true },
      orderBy: { _count: { primary_category: "desc" } },
      take: 10,
    }),

    // By form
    prisma.masterMedicine.groupBy({
      by: ["form"],
      where: { is_active: true, form: { not: null } },
      _count: { form: true },
      orderBy: { _count: { form: "desc" } },
      take: 10,
    }),

    // Multi-variant masters
    prisma.masterMedicine.count({
      where: { is_active: true, variant_count: { gt: 1 } },
    }),

    // Prescription required
    prisma.masterMedicine.count({
      where: { is_active: true, prescription_required: true },
    }),

    // Recently added (last 7 days)
    prisma.masterMedicine.count({
      where: {
        is_active: true,
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // ✅ NEW: Get all masters with images
    prisma.masterMedicine.findMany({
      where: { is_active: true },
      select: {
        master_medicine_id: true,
        images: {
          select: {
            source: true,
          },
        },
      },
    }),
  ]);

  // ✅ NEW: Compute image status counts
  let verifiedCount = 0;
  let rawCount = 0;
  let noneCount = 0;

  allMasters.forEach((master) => {
    const status = computeImageStatus(master.images);
    if (status === "VERIFIED") verifiedCount++;
    else if (status === "RAW") rawCount++;
    else noneCount++;
  });

  // Calculate averages
  const avgVariantsPerMaster =
    totalMasters > 0 ? (totalVariants / totalMasters).toFixed(2) : 0;
  const avgImagesPerVariant =
    totalVariants > 0 ? (totalImages / totalVariants).toFixed(2) : 0;

  return {
    overview: {
      totalMasters,
      totalVariants,
      totalImages,
      avgVariantsPerMaster: parseFloat(avgVariantsPerMaster),
      avgImagesPerVariant: parseFloat(avgImagesPerVariant),
    },
    byType: {
      drug: drugCount,
      otc: otcCount,
    },
    // ✅ NEW: Image status breakdown
    byImageStatus: {
      verified: verifiedCount,
      raw: rawCount,
      none: noneCount,
    },
    categories: categoryCounts.map((c) => ({
      category: c.primary_category,
      count: c._count.primary_category,
    })),
    forms: formCounts.map((f) => ({
      form: f.form,
      count: f._count.form,
    })),
    insights: {
      multiVariantMasters: multiVariantCount,
      singleVariantMasters: totalMasters - multiVariantCount,
      prescriptionRequired: prescriptionRequiredCount,
      otcMedicines: totalMasters - prescriptionRequiredCount,
      recentlyAdded,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// GET FILTER OPTIONS (for dropdowns)
// ══════════════════════════════════════════════════════════════

export async function getFilterOptions() {
  const [forms, categories, brands, manufacturers] = await Promise.all([
    // Unique forms
    prisma.masterMedicine.findMany({
      where: { is_active: true, form: { not: null } },
      select: { form: true },
      distinct: ["form"],
      orderBy: { form: "asc" },
    }),

    // Unique categories
    prisma.masterMedicine.findMany({
      where: { is_active: true, primary_category: { not: null } },
      select: { primary_category: true },
      distinct: ["primary_category"],
      orderBy: { primary_category: "asc" },
    }),

    // Top brands (from variants)
    prisma.masterMedicineVariant.groupBy({
      by: ["brand"],
      where: { brand: { not: null } },
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 50,
    }),

    // Top manufacturers (from variants)
    prisma.masterMedicineVariant.groupBy({
      by: ["manufacturer"],
      where: { manufacturer: { not: null } },
      _count: { manufacturer: true },
      orderBy: { _count: { manufacturer: "desc" } },
      take: 50,
    }),
  ]);

  return {
    types: ["DRUG", "OTC"],
    forms: forms.map((f) => f.form).filter(Boolean),
    categories: categories.map((c) => c.primary_category).filter(Boolean),
    brands: brands.map((b) => ({
      name: b.brand,
      count: b._count.brand,
    })),
    manufacturers: manufacturers.map((m) => ({
      name: m.manufacturer,
      count: m._count.manufacturer,
    })),
  };
}

// ══════════════════════════════════════════════════════════════
// AUTOCOMPLETE SEARCH
// ══════════════════════════════════════════════════════════════

export async function autocompleteSearch(query, limit = 10) {
  if (!query || query.length < 2) {
    return { suggestions: [] };
  }

  const searchTerm = query.trim();

  // Search in both masters and variants
  const [masterMatches, variantMatches] = await Promise.all([
    // Search masters by generic name
    prisma.masterMedicine.findMany({
      where: {
        is_active: true,
        OR: [
          { generic_name: { contains: searchTerm, mode: "insensitive" } },
          { master_key: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        master_medicine_id: true,
        master_key: true,
        generic_name: true,
        type: true,
        form: true,
        variant_count: true,
      },
      take: limit,
      orderBy: { generic_name: "asc" },
    }),

    // Search variants by name/brand
    prisma.masterMedicineVariant.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { brand: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        variant_id: true,
        sku_id: true,
        name: true,
        brand: true,
        mrp: true,
        master: {
          select: {
            master_key: true,
            generic_name: true,
            type: true,
          },
        },
      },
      take: limit,
      orderBy: { name: "asc" },
    }),
  ]);

  // Combine and deduplicate
  const suggestions = [];

  // Add master suggestions
  for (const m of masterMatches) {
    suggestions.push({
      type: "master",
      id: m.master_medicine_id,
      masterKey: m.master_key,
      label: m.generic_name,
      subLabel: `${m.type} • ${m.form || "N/A"} • ${m.variant_count} variants`,
    });
  }

  // Add variant suggestions
  for (const v of variantMatches) {
    suggestions.push({
      type: "variant",
      id: v.variant_id,
      skuId: v.sku_id,
      masterKey: v.master.master_key,
      label: v.name,
      subLabel: `${v.brand || "N/A"} • ${v.master.generic_name} • ₹${v.mrp || "N/A"}`,
    });
  }

  return {
    suggestions: suggestions.slice(0, limit),
    query: searchTerm,
  };
}

// ══════════════════════════════════════════════════════════════
// COMPUTE IMAGE STATUS FOR A MASTER MEDICINE
// ══════════════════════════════════════════════════════════════

export { computeImageStatus };

// ══════════════════════════════════════════════════════════════
// GET UNMAPPED MEDICINES (Aggregated across shops)
// ══════════════════════════════════════════════════════════════

export async function getUnmappedMedicinesAggregated({
  search = "",
  type = "",
  page = 1,
  limit = 20,
  sort = "occurrence_count",
  order = "desc",
}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

  // Get all unlinked medicines grouped by normalized_name
  const rawMedicines = await prisma.medicine.findMany({
    where: {
      master_medicine_id: null,
      link_status: { in: ["PENDING", "UNLINKED"] },
      link_rejected: false,
      is_active: true,
    },
    select: {
      medicine_id: true,
      name: true,
      normalized_name: true,
      generic_name: true,
      manufacturer: true,
      category: true,
      shop_id: true,
      branch_id: true,
      created_at: true,
      updated_at: true,
      shop: {
        select: {
          shop_id: true,
          business_name: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // Aggregate by normalized_name
  const aggregationMap = new Map();

  for (const med of rawMedicines) {
    const normalizedKey =
      med.normalized_name ||
      med.name
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!aggregationMap.has(normalizedKey)) {
      aggregationMap.set(normalizedKey, {
        normalizedName: normalizedKey,
        sampleNames: [],
        sampleNameSet: new Set(),
        medicineIds: [],
        occurrenceCount: 0,
        shopMap: new Map(),
        type: med.category === "OTC" ? "OTC" : "DRUG",
        firstSeenAt: med.created_at,
        lastSeenAt: med.updated_at,
      });
    }

    const group = aggregationMap.get(normalizedKey);

    // Add unique sample names
    if (!group.sampleNameSet.has(med.name)) {
      group.sampleNameSet.add(med.name);
      group.sampleNames.push(med.name);
    }

    group.medicineIds.push(med.medicine_id);
    group.occurrenceCount++;

    // Track shops
    if (med.shop) {
      const shopKey = med.shop.shop_id;
      if (!group.shopMap.has(shopKey)) {
        group.shopMap.set(shopKey, {
          id: med.shop.shop_id,
          name: med.shop.business_name,
          count: 0,
        });
      }
      group.shopMap.get(shopKey).count++;
    }

    // Update timestamps
    if (med.created_at < group.firstSeenAt) group.firstSeenAt = med.created_at;
    if (med.updated_at > group.lastSeenAt) group.lastSeenAt = med.updated_at;
  }

  // Convert to array
  let results = Array.from(aggregationMap.values()).map((group) => ({
    id: `unmapped_${group.normalizedName.replace(/\s+/g, "_")}`,
    normalizedName: group.normalizedName,
    sampleNames: group.sampleNames.slice(0, 10),
    medicineIds: group.medicineIds,
    occurrenceCount: group.occurrenceCount,
    shopCount: group.shopMap.size,
    type: group.type,
    hasImageSuggestion: false,
    firstSeenAt: group.firstSeenAt,
    lastSeenAt: group.lastSeenAt,
    shops: Array.from(group.shopMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  }));

  // Apply search filter
  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    results = results.filter(
      (item) =>
        item.normalizedName.includes(searchLower) ||
        item.sampleNames.some((name) => name.toLowerCase().includes(searchLower))
    );
  }

  // Apply type filter
  if (type && (type === "DRUG" || type === "OTC")) {
    results = results.filter((item) => item.type === type);
  }

  // Sort
  const sortField = sort === "occurrence_count" ? "occurrenceCount" : sort === "shop_count" ? "shopCount" : "occurrenceCount";
  results.sort((a, b) => {
    if (order === "asc") return a[sortField] - b[sortField];
    return b[sortField] - a[sortField];
  });

  // Paginate
  const total = results.length;
  const skip = (pageNum - 1) * limitNum;
  const paginatedResults = results.slice(skip, skip + limitNum);

  return {
    unmapped: paginatedResults,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}