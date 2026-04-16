/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 * backend\src\modules\cadmin\master-medicines\cadminMasterMedicines.service.js
 * ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
 */

import prisma from "../../../config/prisma.js";
import { fileURLToPath } from "url";
import path from "path";
import { notifyAsync } from "../../notifications/notification.service.js";
import { NOTIFICATION_EVENTS } from "../../notifications/notification.events.js";

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
  imageStatus = "",
  prescriptionRequired = null,
  minVariants = null,
  maxVariants = null,
  page = 1,
  limit = 20,
  sort = "generic_name",
  order = "asc",
}) {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = { is_active: true };

  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { generic_name: { contains: searchTerm, mode: "insensitive" } },
      { master_key: { contains: searchTerm, mode: "insensitive" } },
      { primary_category: { contains: searchTerm, mode: "insensitive" } },
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

  if (type && (type === "DRUG" || type === "OTC")) {
    where.type = type;
  }

  if (form && form.trim()) {
    where.form = { equals: form.trim(), mode: "insensitive" };
  }

  if (category && category.trim()) {
    where.primary_category = {
      equals: category.trim(),
      mode: "insensitive",
    };
  }

  if (prescriptionRequired !== null) {
    where.prescription_required =
      prescriptionRequired === "true" || prescriptionRequired === true;
  }

  if (minVariants !== null) {
    where.variant_count = {
      ...where.variant_count,
      gte: parseInt(minVariants),
    };
  }
  if (maxVariants !== null) {
    where.variant_count = {
      ...where.variant_count,
      lte: parseInt(maxVariants),
    };
  }

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

  // When filtering by imageStatus (a computed field), fetch all matching records
  // then post-filter + paginate. Otherwise use normal DB pagination.
  const effectiveSkip = imageStatus ? 0 : skip;
  const effectiveTake = imageStatus ? 10000 : limitNum;

  const [medicines, total] = await Promise.all([
    prisma.masterMedicine.findMany({
      where,
      include: {
        variants: {
          take: 5,
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
        images: true,
      },
      orderBy: { [sortField]: sortOrder },
      skip: effectiveSkip,
      take: effectiveTake,
    }),
    prisma.masterMedicine.count({ where }),
  ]);

  const transformedMedicines = medicines.map((med) => {
    const prices = med.variants
      .map((v) => v.mrp)
      .filter((p) => p !== null)
      .map((p) => parseFloat(p));

    const priceRange =
      prices.length > 0
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : null;

    const imgStatus = computeImageStatus(med.images);
    const primaryImageObj = med.images.find((img) => img.type === "PRIMARY");
    const primaryImage =
      primaryImageObj?.url || med.variants[0]?.images?.[0] || null;

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
      imageStatus: imgStatus,
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

  // Post-filter by computed imageStatus
  let finalMedicines = transformedMedicines;
  let finalTotal = total;

  if (imageStatus) {
    finalMedicines = transformedMedicines.filter(
      (med) => med.imageStatus === imageStatus,
    );
    finalTotal = finalMedicines.length;
    // Apply pagination on the filtered results
    finalMedicines = finalMedicines.slice(skip, skip + limitNum);
  }

  return {
    medicines: finalMedicines,
    meta: {
      total: finalTotal,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(finalTotal / limitNum),
      hasNext: pageNum < Math.ceil(finalTotal / limitNum),
      hasPrev: pageNum > 1,
    },
  };
}

// ══════════════════════════════════════════════════════════════
// GET SINGLE MASTER MEDICINE WITH ALL VARIANTS
// ══════════════════════════════════════════════════════════════

export async function getMasterMedicineById(id) {
  let medicine = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: id },
    include: {
      variants: { orderBy: [{ brand: "asc" }, { mrp: "asc" }] },
      images: { orderBy: [{ type: "asc" }, { sequence: "asc" }] },
    },
  });

  if (!medicine) {
    medicine = await prisma.masterMedicine.findUnique({
      where: { master_key: id },
      include: {
        variants: { orderBy: [{ brand: "asc" }, { mrp: "asc" }] },
        images: { orderBy: [{ type: "asc" }, { sequence: "asc" }] },
      },
    });
  }

  if (!medicine) return null;

  const prices = medicine.variants
    .map((v) => v.mrp)
    .filter((p) => p !== null)
    .map((p) => parseFloat(p));

  const priceRange =
    prices.length > 0
      ? { min: Math.min(...prices), max: Math.max(...prices) }
      : null;

  const brands = [
    ...new Set(medicine.variants.map((v) => v.brand).filter(Boolean)),
  ].sort();
  const manufacturers = [
    ...new Set(medicine.variants.map((v) => v.manufacturer).filter(Boolean)),
  ].sort();
  const marketers = [
    ...new Set(medicine.variants.map((v) => v.marketer).filter(Boolean)),
  ].sort();
  const strengths = [
    ...new Set(
      medicine.variants
        .filter((v) => v.strength_value)
        .map((v) => `${v.strength_value}${v.strength_unit || ""}`),
    ),
  ].sort();

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
    imageStatus,
    priceRange,
    brands,
    manufacturers,
    marketers,
    strengths,
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
    images: medicine.images.map((img) => ({
      id: img.image_id,
      skuId: img.sku_id,
      url: img.url,
      type: img.type,
      source: img.source,
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

  if (!variant) return null;

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
// ✅ UPDATED: GET STATISTICS — now counts variant-linked correctly
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
    allMasters,
    unmappedCount,
    needsReviewCount,
    // ✅ FIXED: count by linked_variant_id now
    totalLinkedCount,
  ] = await Promise.all([
    prisma.masterMedicine.count({ where: { is_active: true } }),
    prisma.masterMedicineVariant.count(),
    prisma.masterMedicineImage.count(),
    prisma.masterMedicine.count({ where: { is_active: true, type: "DRUG" } }),
    prisma.masterMedicine.count({ where: { is_active: true, type: "OTC" } }),
    prisma.masterMedicine.groupBy({
      by: ["primary_category"],
      where: { is_active: true, primary_category: { not: null } },
      _count: { primary_category: true },
      orderBy: { _count: { primary_category: "desc" } },
      take: 10,
    }),
    prisma.masterMedicine.groupBy({
      by: ["form"],
      where: { is_active: true, form: { not: null } },
      _count: { form: true },
      orderBy: { _count: { form: "desc" } },
      take: 10,
    }),
    prisma.masterMedicine.count({
      where: { is_active: true, variant_count: { gt: 1 } },
    }),
    prisma.masterMedicine.count({
      where: { is_active: true, prescription_required: true },
    }),
    prisma.masterMedicine.count({
      where: {
        is_active: true,
        created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.masterMedicine.findMany({
      where: { is_active: true },
      select: {
        master_medicine_id: true,
        images: { select: { source: true } },
      },
    }),
    prisma.medicine.count({
      where: {
        master_medicine_id: null,
        linked_variant_id: null, // ✅ truly unmapped
        link_status: { in: ["PENDING", "UNLINKED"] },
        link_rejected: false,
        is_active: true,
      },
    }),
    prisma.medicine.count({
      where: {
        link_status: "SUGGESTED",
        suggested_master_id: { not: null },
        link_rejected: false,
        is_active: true,
      },
    }),
    // ✅ FIXED: count by variant link
    prisma.medicine.count({
      where: {
        linked_variant_id: { not: null },
        link_status: { in: ["AUTO_LINKED", "MANUAL_LINKED"] },
        is_active: true,
      },
    }),
  ]);

  let verifiedCount = 0,
    rawCount = 0,
    noneCount = 0;
  allMasters.forEach((master) => {
    const status = computeImageStatus(master.images);
    if (status === "VERIFIED") verifiedCount++;
    else if (status === "RAW") rawCount++;
    else noneCount++;
  });

  return {
    overview: {
      totalMasters,
      totalVariants,
      totalImages,
      avgVariantsPerMaster:
        totalMasters > 0
          ? parseFloat((totalVariants / totalMasters).toFixed(2))
          : 0,
      avgImagesPerVariant:
        totalVariants > 0
          ? parseFloat((totalImages / totalVariants).toFixed(2))
          : 0,
    },
    byType: { drug: drugCount, otc: otcCount },
    byImageStatus: { verified: verifiedCount, raw: rawCount, none: noneCount },
    mapping: {
      unmapped: unmappedCount,
      needsReview: needsReviewCount,
      totalLinked: totalLinkedCount, // ✅ now reflects variant-linked count
    },
    categories: categoryCounts.map((c) => ({
      category: c.primary_category,
      count: c._count.primary_category,
    })),
    forms: formCounts.map((f) => ({ form: f.form, count: f._count.form })),
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
// GET FILTER OPTIONS
// ══════════════════════════════════════════════════════════════

export async function getFilterOptions() {
  const [forms, categories, brands, manufacturers] = await Promise.all([
    prisma.masterMedicine.findMany({
      where: { is_active: true, form: { not: null } },
      select: { form: true },
      distinct: ["form"],
      orderBy: { form: "asc" },
    }),
    prisma.masterMedicine.findMany({
      where: { is_active: true, primary_category: { not: null } },
      select: { primary_category: true },
      distinct: ["primary_category"],
      orderBy: { primary_category: "asc" },
    }),
    prisma.masterMedicineVariant.groupBy({
      by: ["brand"],
      where: { brand: { not: null } },
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 50,
    }),
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
    brands: brands.map((b) => ({ name: b.brand, count: b._count.brand })),
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

  const [masterMatches, variantMatches] = await Promise.all([
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

  const suggestions = [];

  for (const m of masterMatches) {
    suggestions.push({
      type: "master",
      id: m.master_medicine_id,
      masterKey: m.master_key,
      label: m.generic_name,
      subLabel: `${m.type} • ${m.form || "N/A"} • ${m.variant_count} variants`,
    });
  }

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
// ✅ UPDATED: UNMAPPED — now excludes variant-linked too
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

  const rawMedicines = await prisma.medicine.findMany({
    where: {
      master_medicine_id: null,
      linked_variant_id: null, // ✅ also exclude variant-linked
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
      sub_category: true,
      schedule: true,
      hsn_code: true,
      pack_size: true,
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
        manufacturers: new Set(),
        genericNames: new Set(),
        categories: new Set(),
        subCategories: new Set(),
        schedules: new Set(),
        hsnCodes: new Set(),
        packSizes: new Set(),
      });
    }

    const group = aggregationMap.get(normalizedKey);

    if (!group.sampleNameSet.has(med.name)) {
      group.sampleNameSet.add(med.name);
      group.sampleNames.push(med.name);
    }

    group.medicineIds.push(med.medicine_id);
    group.occurrenceCount++;

    if (med.manufacturer) group.manufacturers.add(med.manufacturer);
    if (med.generic_name) group.genericNames.add(med.generic_name);
    if (med.category) group.categories.add(med.category);
    if (med.sub_category) group.subCategories.add(med.sub_category);
    if (med.schedule) group.schedules.add(med.schedule);
    if (med.hsn_code) group.hsnCodes.add(med.hsn_code);
    if (med.pack_size) group.packSizes.add(med.pack_size);

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

    if (med.created_at < group.firstSeenAt) group.firstSeenAt = med.created_at;
    if (med.updated_at > group.lastSeenAt) group.lastSeenAt = med.updated_at;
  }

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
    manufacturers: [...group.manufacturers].sort(),
    genericNames: [...group.genericNames].sort(),
    categories: [...group.categories].sort(),
    subCategories: [...group.subCategories].sort(),
    schedules: [...group.schedules].sort(),
    hsnCodes: [...group.hsnCodes].sort(),
    packSizes: [...group.packSizes].sort(),
  }));

  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    results = results.filter(
      (item) =>
        item.normalizedName.includes(searchLower) ||
        item.sampleNames.some((name) =>
          name.toLowerCase().includes(searchLower),
        ) ||
        item.manufacturers.some((m) => m.toLowerCase().includes(searchLower)),
    );
  }

  if (type && (type === "DRUG" || type === "OTC")) {
    results = results.filter((item) => item.type === type);
  }

  const sortField =
    sort === "occurrence_count"
      ? "occurrenceCount"
      : sort === "shop_count"
        ? "shopCount"
        : "occurrenceCount";
  results.sort((a, b) => {
    if (order === "asc") return a[sortField] - b[sortField];
    return b[sortField] - a[sortField];
  });

  const total = results.length;
  const skip = (pageNum - 1) * limitNum;

  return {
    unmapped: results.slice(skip, skip + limitNum),
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

// ══════════════════════════════════════════════════════════════
// GET NEEDS REVIEW MEDICINES — Updated to include shopMedicine details
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
      { manufacturer: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

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
        generic_name: true,
        manufacturer: true,
        category: true,
        sub_category: true,
        schedule: true,
        hsn_code: true,
        pack_size: true,
        link_confidence_score: true,
        suggestion_reason: true,
        suggested_master_id: true,
        // ✅ NEW: also store suggested_variant_id for review acceptance
        suggested_variant_id: true,
        shop_id: true,
        branch_id: true,
        created_at: true,
        shop: {
          select: { shop_id: true, business_name: true },
        },
        branch: {
          select: { branch_id: true, branch_name: true },
        },
      },
      orderBy: { link_confidence_score: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.medicine.count({ where }),
  ]);

  const suggestedMasterIds = [
    ...new Set(medicines.map((m) => m.suggested_master_id).filter(Boolean)),
  ];

  const suggestedMasters = await prisma.masterMedicine.findMany({
    where: { master_medicine_id: { in: suggestedMasterIds } },
    include: {
      images: { where: { type: "PRIMARY" }, take: 1 },
      variants: {
        take: 1,
        orderBy: { mrp: "asc" },
        select: { manufacturer: true, marketer: true },
      },
    },
  });

  const masterMap = new Map(
    suggestedMasters.map((m) => [m.master_medicine_id, m]),
  );

  const reviewItems = medicines.map((med) => {
    const suggestedMaster = masterMap.get(med.suggested_master_id);
    return {
      id: med.medicine_id,
      rawName: med.name,
      normalizedRaw: med.normalized_name || med.name.toLowerCase(),
      shopMedicine: {
        genericName: med.generic_name,
        manufacturer: med.manufacturer,
        category: med.category,
        subCategory: med.sub_category,
        schedule: med.schedule,
        hsnCode: med.hsn_code,
        packSize: med.pack_size,
      },
      suggestedMaster: suggestedMaster
        ? {
            id: suggestedMaster.master_medicine_id,
            masterKey: suggestedMaster.master_key,
            name: suggestedMaster.generic_name,
            type: suggestedMaster.type,
            form: suggestedMaster.form,
            primaryCategory: suggestedMaster.primary_category,
            prescriptionRequired: suggestedMaster.prescription_required,
            manufacturer: suggestedMaster.variants[0]?.manufacturer || null,
            marketer: suggestedMaster.variants[0]?.marketer || null,
            hasImage: suggestedMaster.images.length > 0,
            imageStatus: computeImageStatus(suggestedMaster.images),
          }
        : null,
      // ✅ NEW: include suggested variant id if system already narrowed it down
      suggestedVariantId: med.suggested_variant_id || null,
      confidenceScore: Math.round(med.link_confidence_score || 0),
      confidenceReason: med.suggestion_reason || "Auto-detected match",
      shopId: med.shop?.shop_id,
      shopName: med.shop?.business_name || "Unknown Shop",
      branchName: med.branch?.branch_name || null,
      occurrenceCount: 1,
      firstSeenAt: med.created_at,
    };
  });

  const validItems = reviewItems.filter(
    (item) => item.suggestedMaster !== null,
  );

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
// ✅ REWRITTEN: GET LINKED SHOP MEDICINES FOR A MASTER
// Now returns all shop medicines linked to ANY variant under this master
// ══════════════════════════════════════════════════════════════

export async function getLinkedMedicines(masterMedicineId) {
  // Get all variant IDs under this master
  const variants = await prisma.masterMedicineVariant.findMany({
    where: { master_medicine_id: masterMedicineId },
    select: { variant_id: true, name: true, sku_id: true },
  });

  const variantIds = variants.map((v) => v.variant_id);
  const variantMap = new Map(variants.map((v) => [v.variant_id, v]));

  // ✅ Find shop medicines linked to ANY variant under this master
  const linkedMedicines = await prisma.medicine.findMany({
    where: {
      linked_variant_id: { in: variantIds },
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
      linked_variant_id: true,
      linked_variant_sku: true,
      shop: {
        select: { shop_id: true, business_name: true },
      },
    },
    orderBy: { linked_at: "desc" },
  });

  return linkedMedicines.map((med) => {
    const variant = variantMap.get(med.linked_variant_id);
    return {
      id: med.medicine_id,
      originalName: med.name,
      normalizedName: med.normalized_name || med.name.toLowerCase(),
      shopId: med.shop?.shop_id,
      shopName: med.shop?.business_name || "Unknown Shop",
      manufacturer: med.manufacturer,
      // ✅ NEW: variant info
      linkedVariantId: med.linked_variant_id,
      linkedVariantSku: med.linked_variant_sku,
      linkedVariantName: variant?.name || null,
      occurrenceCount: 1,
      linkedAt: med.linked_at,
      linkedBy:
        med.linked_by_type === "SYSTEM"
          ? "System"
          : med.linked_by_type === "CADMIN"
            ? "CAdmin"
            : "Shop User",
      linkStatus: med.link_status,
      confidence: med.link_confidence_score,
    };
  });
}

// ✅ NEW: Get linked medicines for a specific variant
export async function getLinkedMedicinesByVariant(variantId) {
  const variant = await prisma.masterMedicineVariant.findUnique({
    where: { variant_id: variantId },
    select: {
      variant_id: true,
      name: true,
      sku_id: true,
      master_medicine_id: true,
    },
  });

  if (!variant) return [];

  const linkedMedicines = await prisma.medicine.findMany({
    where: {
      linked_variant_id: variantId,
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
        select: { shop_id: true, business_name: true },
      },
    },
    orderBy: { linked_at: "desc" },
  });

  return {
    variant: {
      id: variant.variant_id,
      name: variant.name,
      skuId: variant.sku_id,
      masterId: variant.master_medicine_id,
    },
    linkedMedicines: linkedMedicines.map((med) => ({
      id: med.medicine_id,
      originalName: med.name,
      normalizedName: med.normalized_name || med.name.toLowerCase(),
      shopId: med.shop?.shop_id,
      shopName: med.shop?.business_name || "Unknown Shop",
      manufacturer: med.manufacturer,
      linkedAt: med.linked_at,
      linkedBy:
        med.linked_by_type === "SYSTEM"
          ? "System"
          : med.linked_by_type === "CADMIN"
            ? "CAdmin"
            : "Shop User",
      linkStatus: med.link_status,
      confidence: med.link_confidence_score,
    })),
  };
}

// ══════════════════════════════════════════════════════════════
// ✅ REWRITTEN: ACCEPT REVIEW MATCH
// Now links to the specific variant, not just master
// ══════════════════════════════════════════════════════════════

export async function acceptReviewMatch(medicineId, cadminId) {
  const medicine = await prisma.medicine.findUnique({
    where: { medicine_id: medicineId },
  });

  if (!medicine) throw new Error("Medicine not found");
  if (!medicine.suggested_master_id) throw new Error("No suggestion to accept");

  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: medicine.suggested_master_id },
  });
  if (!master) throw new Error("Suggested master no longer exists");

  // ✅ Determine which variant to link to
  // Priority: suggested_variant_id > name match > first variant
  let targetVariant = null;

  if (medicine.suggested_variant_id) {
    // System already identified the specific variant
    targetVariant = await prisma.masterMedicineVariant.findUnique({
      where: { variant_id: medicine.suggested_variant_id },
    });
  }

  if (!targetVariant) {
    // Try to find by exact name match
    targetVariant = await prisma.masterMedicineVariant.findFirst({
      where: {
        master_medicine_id: medicine.suggested_master_id,
        name: { equals: medicine.name, mode: "insensitive" },
      },
    });
  }

  if (!targetVariant) {
    // Fallback: first variant under this master
    targetVariant = await prisma.masterMedicineVariant.findFirst({
      where: { master_medicine_id: medicine.suggested_master_id },
      orderBy: { mrp: "asc" },
    });
  }

  if (!targetVariant) {
    throw new Error(
      "No variants found under this master medicine. Cannot link to a variant.",
    );
  }

  // ✅ Update medicine with BOTH master_id (for grouping) AND variant_id (for precision)
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: medicine.suggested_master_id, // keep for grouping/display
      linked_variant_id: targetVariant.variant_id, // ✅ the actual link
      linked_variant_sku: targetVariant.sku_id, // ✅ denormalized
      link_status: "MANUAL_LINKED",
      link_confidence_score: medicine.link_confidence_score,
      linked_at: new Date(),
      linked_by_id: cadminId,
      linked_by_type: "CADMIN",
      suggested_master_id: null,
      suggested_variant_id: null,
      suggestion_reason: null,
    },
  });
  const shopMedicine = await prisma.medicine.findUnique({
    where: { medicine_id: medicineId },
    select: { name: true, shop_id: true },
  });

  if (shopMedicine?.shop_id) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.MEDICINE_LINKED,
      context: {
        shop_id: shopMedicine.shop_id,
        medicine_id: medicineId,
        medicine_name: shopMedicine.name,
        variant_name: targetVariant.name,
        master_name: master.generic_name,
      },
    });
  }

  return {
    success: true,
    medicine: updated,
    linkedTo: {
      master_id: master.master_medicine_id,
      master_key: master.master_key,
      generic_name: master.generic_name,
      variant_id: targetVariant.variant_id,
      variant_name: targetVariant.name,
      variant_sku: targetVariant.sku_id,
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
// ✅ REWRITTEN: MATCH UNMAPPED TO VARIANT (was matchUnmappedToMaster)
// Takes variantId now instead of masterMedicineId
// ══════════════════════════════════════════════════════════════

export async function matchUnmappedToVariant(medicineIds, variantId, cadminId) {
  // Validate variant exists and get master info
  const variant = await prisma.masterMedicineVariant.findUnique({
    where: { variant_id: variantId },
    include: {
      master: {
        select: {
          master_medicine_id: true,
          master_key: true,
          generic_name: true,
        },
      },
    },
  });

  if (!variant) throw new Error("Variant not found");

  // ✅ Update ALL matching medicines to link to this specific variant
  // Also store master_medicine_id for grouping/display purposes
  const result = await prisma.medicine.updateMany({
    where: { medicine_id: { in: medicineIds } },
    data: {
      master_medicine_id: variant.master_medicine_id, // for display/grouping
      linked_variant_id: variant.variant_id, // ✅ the real link
      linked_variant_sku: variant.sku_id, // denormalized
      link_status: "MANUAL_LINKED",
      link_confidence_score: 100,
      linked_at: new Date(),
      linked_by_id: cadminId,
      linked_by_type: "CADMIN",
      suggested_master_id: null,
      suggested_variant_id: null,
      suggestion_reason: null,
    },
  });
  const affectedMedicines = await prisma.medicine.findMany({
    where: { medicine_id: { in: medicineIds } },
    select: { medicine_id: true, name: true, shop_id: true },
  });

  // Group by shop to send one notification per shop
  const shopGroups = new Map();
  for (const med of affectedMedicines) {
    if (!med.shop_id) continue;
    if (!shopGroups.has(med.shop_id)) {
      shopGroups.set(med.shop_id, { names: [], count: 0 });
    }
    const group = shopGroups.get(med.shop_id);
    group.names.push(med.name);
    group.count++;
  }

  for (const [shopId, group] of shopGroups) {
    notifyAsync({
      type: NOTIFICATION_EVENTS.MEDICINE_LINKED,
      context: {
        shop_id: shopId,
        medicine_name: group.names[0],
        variant_name: variant.name,
        master_name: variant.master.generic_name,
        linked_count: group.count,
      },
    });
  }

  return {
    success: true,
    linkedCount: result.count,
    linkedTo: {
      variant_id: variant.variant_id,
      variant_name: variant.name,
      variant_sku: variant.sku_id,
      master_id: variant.master.master_medicine_id,
      master_key: variant.master.master_key,
      generic_name: variant.master.generic_name,
    },
  };
}

// Keep old function name as alias for any existing callers during transition
export async function matchUnmappedToMaster(
  medicineIds,
  masterMedicineId,
  cadminId,
) {
  // During transition: find first variant of master and link to it
  const firstVariant = await prisma.masterMedicineVariant.findFirst({
    where: { master_medicine_id: masterMedicineId },
    orderBy: { mrp: "asc" },
  });

  if (!firstVariant) {
    throw new Error(
      "No variants found under this master. Create a variant first, then link.",
    );
  }

  // Delegate to new function
  return matchUnmappedToVariant(medicineIds, firstVariant.variant_id, cadminId);
}

// ══════════════════════════════════════════════════════════════
// CADMIN: IGNORE UNMAPPED MEDICINES
// ══════════════════════════════════════════════════════════════

export async function ignoreUnmappedMedicines(medicineIds) {
  const result = await prisma.medicine.updateMany({
    where: { medicine_id: { in: medicineIds } },
    data: {
      link_status: "UNLINKED",
      link_rejected: true,
    },
  });

  return { success: true, ignoredCount: result.count };
}

// ══════════════════════════════════════════════════════════════
// ✅ REWRITTEN: UNLINK SHOP MEDICINE
// Now clears BOTH master_id and variant_id
// ══════════════════════════════════════════════════════════════

export async function unlinkShopMedicine(medicineId) {
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: null,
      linked_variant_id: null, // ✅ NEW
      linked_variant_sku: null, // ✅ NEW
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

export async function uploadMasterImage(
  masterMedicineId,
  imageData,
  cadminName,
) {
  const { filename, type = "PRIMARY", skuId } = imageData;

  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
    include: {
      variants: { take: 1, select: { sku_id: true } },
    },
  });

  if (!master) throw new Error("Master medicine not found");

  const effectiveSkuId = skuId || master.variants[0]?.sku_id || "master";

  // ✅ Move file from temp "uploads" dir to correct SKU directory
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const baseDir = path.join(__dirname, "../../../../static/medicine_images");
  const sourceFile = path.join(baseDir, "uploads", filename);
  const targetDir = path.join(baseDir, effectiveSkuId);
  const targetFile = path.join(targetDir, filename);

  // Create target directory
  const fs = await import("fs");
  fs.default.mkdirSync(targetDir, { recursive: true });

  // Move file (if source exists and is different from target)
  if (fs.default.existsSync(sourceFile) && sourceFile !== targetFile) {
    fs.default.renameSync(sourceFile, targetFile);
  }

  const url = `/static/medicine_images/${effectiveSkuId}/${filename}`;

  if (type === "PRIMARY") {
    await prisma.masterMedicineImage.updateMany({
      where: {
        master_medicine_id: masterMedicineId,
        type: "PRIMARY",
      },
      data: { type: "GALLERY" },
    });
  }

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

export { computeImageStatus };

// ══════════════════════════════════════════════════════════════
// CADMIN: CREATE NEW MASTER MEDICINE + FIRST VARIANT
// ══════════════════════════════════════════════════════════════

export async function createMasterMedicine(data, cadminId) {
  const {
    name,
    genericName,
    masterKey,
    type,
    form,
    composition = [],
    manufacturer,
    marketer,
    packSize,
    prescriptionRequired = false,
    hsn_code,
    schedule,
    category,
    subCategory,
  } = data;

  // Validate required fields
  if (!name || !genericName || !type || !form || !manufacturer) {
    throw new Error(
      "name, genericName, type, form, and manufacturer are required",
    );
  }

  // Generate master_key if not provided
  const finalKey =
    masterKey ||
    genericName
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, "_")
      .trim() + (form ? `_${form.toLowerCase()}` : "");

  // Check for duplicate master_key
  const existing = await prisma.masterMedicine.findUnique({
    where: { master_key: finalKey },
  });
  if (existing) {
    throw new Error(`A master medicine with key "${finalKey}" already exists`);
  }

  // Build composition JSON
  const compositionJson =
    Array.isArray(composition) && composition.length > 0
      ? composition
          .filter((c) => c.name && c.name.trim())
          .map((c) => ({
            name: c.name.trim(),
            strength: c.strength?.trim() || null,
          }))
      : [];

  // Create master + first variant in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the master medicine
    const master = await tx.masterMedicine.create({
      data: {
        master_key: finalKey,
        generic_name: genericName.trim(),
        type,
        form: form || null,
        composition: compositionJson,
        prescription_required: prescriptionRequired,
        primary_category: category || null,
        variant_count: 1,
        is_active: true,
      },
    });

    // 2. Generate a SKU ID for the first variant
    const skuId = `MM${Date.now().toString(36).toUpperCase()}`;

    // 3. Parse strength from composition if available
    let strengthValue = null;
    let strengthUnit = null;
    if (compositionJson.length > 0 && compositionJson[0].strength) {
      const match = compositionJson[0].strength.match(/^([\d.]+)\s*(.*)$/);
      if (match) {
        strengthValue = parseFloat(match[1]);
        strengthUnit = match[2] || null;
      }
    }

    // 4. Create the first variant
    const variant = await tx.masterMedicineVariant.create({
      data: {
        master_medicine_id: master.master_medicine_id,
        sku_id: skuId,
        name: name.trim(),
        brand: null,
        composition: compositionJson,
        strength_value: strengthValue,
        strength_unit: strengthUnit,
        manufacturer: manufacturer.trim(),
        marketer: marketer?.trim() || manufacturer.trim(),
        pack_size: packSize || null,
        mrp: null,
        selling_price: null,
        discount_percent: null,
        description: null,
        images: [],
      },
    });

    return { master, variant, skuId };
  });

  return {
    success: true,
    master: {
      id: result.master.master_medicine_id,
      masterKey: result.master.master_key,
      genericName: result.master.generic_name,
      type: result.master.type,
      form: result.master.form,
    },
    variant: {
      id: result.variant.variant_id,
      skuId: result.skuId,
      name: result.variant.name,
      manufacturer: result.variant.manufacturer,
    },
  };
}
