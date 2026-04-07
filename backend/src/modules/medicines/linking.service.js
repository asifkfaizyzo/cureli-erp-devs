/**
 * ═══════════════════════════════════════════════════════════════
 * MEDICINE LINKING SERVICE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Handles auto-linking shop medicines to master catalog
 * - Exact match
 * - Fuzzy match with suggestions
 * - Manual link/unlink
 */

import prisma from "../../config/prisma.js";

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const EXACT_MATCH_THRESHOLD = 0.95;    // 95% similarity = auto-link
const SUGGESTION_THRESHOLD = 0.6;       // 60% similarity = suggest
const MAX_SUGGESTIONS = 5;

// ══════════════════════════════════════════════════════════════
// STRING SIMILARITY (Levenshtein-based)
// ══════════════════════════════════════════════════════════════

function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

function calculateSimilarity(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  
  return 1 - distance / maxLen;
}

// ══════════════════════════════════════════════════════════════
// AUTO-LINK TO MASTER CATALOG
// ══════════════════════════════════════════════════════════════

/**
 * Try to auto-link a shop medicine to master catalog
 * 
 * @param {Object} shopMedicine - The shop medicine record
 * @returns {Object} - { type: 'EXACT'|'SUGGESTED'|'NONE', master_id?, suggestions? }
 */
export async function autoLinkToMasterCatalog(shopMedicine) {
  const { name, manufacturer, generic_name } = shopMedicine;
  
  // Step 1: Try exact match on variant name
  const exactVariantMatch = await prisma.masterMedicineVariant.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: "insensitive" } },
        { brand: { equals: name, mode: "insensitive" } },
      ],
    },
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
  
  if (exactVariantMatch) {
    return {
      type: "EXACT",
      confidence: 100,
      master_id: exactVariantMatch.master.master_medicine_id,
      master_key: exactVariantMatch.master.master_key,
      matched_variant: {
        sku_id: exactVariantMatch.sku_id,
        name: exactVariantMatch.name,
      },
    };
  }
  
  // Step 2: Try fuzzy match
  const allVariants = await prisma.masterMedicineVariant.findMany({
    take: 500, // Limit for performance
    select: {
      variant_id: true,
      sku_id: true,
      name: true,
      brand: true,
      manufacturer: true,
      master: {
        select: {
          master_medicine_id: true,
          master_key: true,
          generic_name: true,
        },
      },
    },
  });
  
  const scored = allVariants
    .map((variant) => {
      // Calculate name similarity
      const nameSim = Math.max(
        calculateSimilarity(name, variant.name),
        calculateSimilarity(name, variant.brand || "")
      );
      
      // Calculate manufacturer similarity (if provided)
      const mfgSim = manufacturer
        ? calculateSimilarity(manufacturer, variant.manufacturer || "")
        : 0;
      
      // Calculate generic name similarity (if provided)
      const genericSim = generic_name
        ? calculateSimilarity(generic_name, variant.master.generic_name)
        : 0;
      
      // Weighted score
      const score = nameSim * 0.6 + mfgSim * 0.25 + genericSim * 0.15;
      
      return {
        variant,
        score,
        breakdown: { nameSim, mfgSim, genericSim },
      };
    })
    .filter((item) => item.score >= SUGGESTION_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS);
  
  // Check if top match is good enough for auto-link
  if (scored.length > 0 && scored[0].score >= EXACT_MATCH_THRESHOLD) {
    return {
      type: "AUTO_LINKED",
      confidence: Math.round(scored[0].score * 100),
      master_id: scored[0].variant.master.master_medicine_id,
      master_key: scored[0].variant.master.master_key,
      matched_variant: {
        sku_id: scored[0].variant.sku_id,
        name: scored[0].variant.name,
      },
    };
  }
  
  // Return suggestions if any
  if (scored.length > 0) {
    return {
      type: "SUGGESTED",
      suggestions: scored.map((item) => ({
        master_id: item.variant.master.master_medicine_id,
        master_key: item.variant.master.master_key,
        generic_name: item.variant.master.generic_name,
        variant: {
          sku_id: item.variant.sku_id,
          name: item.variant.name,
          brand: item.variant.brand,
          manufacturer: item.variant.manufacturer,
        },
        confidence: Math.round(item.score * 100),
      })),
    };
  }
  
  return { type: "NONE" };
}

// ══════════════════════════════════════════════════════════════
// GET SUGGESTIONS FOR MEDICINE
// ══════════════════════════════════════════════════════════════

/**
 * Get link suggestions for a shop medicine
 */
export async function getSuggestionsForMedicine(medicineId) {
  const medicine = await prisma.medicine.findUnique({
    where: { medicine_id: medicineId },
    select: {
      medicine_id: true,
      name: true,
      generic_name: true,
      manufacturer: true,
      link_status: true,
      master_medicine_id: true,
    },
  });
  
  if (!medicine) {
    throw new Error("Medicine not found");
  }
  
  // If already linked, return current link
  if (medicine.master_medicine_id) {
    const master = await prisma.masterMedicine.findUnique({
      where: { master_medicine_id: medicine.master_medicine_id },
      include: {
        variants: {
          take: 5,
          select: {
            sku_id: true,
            name: true,
            brand: true,
            mrp: true,
          },
        },
      },
    });
    
    return {
      isLinked: true,
      linkStatus: medicine.link_status,
      currentLink: master
        ? {
            master_id: master.master_medicine_id,
            master_key: master.master_key,
            generic_name: master.generic_name,
            type: master.type,
            variants: master.variants,
          }
        : null,
      suggestions: [],
    };
  }
  
  // Get fresh suggestions
  const result = await autoLinkToMasterCatalog(medicine);
  
  return {
    isLinked: false,
    linkStatus: medicine.link_status,
    currentLink: null,
    suggestions: result.suggestions || [],
  };
}

// ══════════════════════════════════════════════════════════════
// MANUAL LINK
// ══════════════════════════════════════════════════════════════

/**
 * Manually link a shop medicine to master catalog
 */
export async function manuallyLinkMedicine(medicineId, masterMedicineId, userId) {
  // Verify master exists
  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
  });
  
  if (!master) {
    throw new Error("Master medicine not found");
  }
  
  // Update medicine
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: masterMedicineId,
      link_status: "MANUAL_LINKED",
      link_confidence_score: 100,
      link_rejected: false,
      linked_at: new Date(),
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
// UNLINK / REJECT
// ══════════════════════════════════════════════════════════════

/**
 * Unlink a shop medicine from master catalog
 */
export async function unlinkMedicine(medicineId, reject = false) {
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: null,
      link_status: reject ? "UNLINKED" : "PENDING",
      link_confidence_score: null,
      link_rejected: reject,
      linked_at: null,
    },
  });
  
  return {
    success: true,
    medicine: updated,
    action: reject ? "rejected" : "unlinked",
  };
}

// ══════════════════════════════════════════════════════════════
// BULK AUTO-LINK
// ══════════════════════════════════════════════════════════════

/**
 * Auto-link all pending medicines for a shop
 */
export async function bulkAutoLinkMedicines(shopId, branchId = null) {
  const where = {
    shop_id: shopId,
    link_status: "PENDING",
    link_rejected: false,
  };
  
  if (branchId) {
    where.branch_id = branchId;
  }
  
  const pendingMedicines = await prisma.medicine.findMany({
    where,
    select: {
      medicine_id: true,
      name: true,
      generic_name: true,
      manufacturer: true,
    },
  });
  
  const results = {
    total: pendingMedicines.length,
    autoLinked: 0,
    suggested: 0,
    noMatch: 0,
    errors: [],
  };
  
  for (const medicine of pendingMedicines) {
    try {
      const linkResult = await autoLinkToMasterCatalog(medicine);
      
      if (linkResult.type === "EXACT" || linkResult.type === "AUTO_LINKED") {
        await prisma.medicine.update({
          where: { medicine_id: medicine.medicine_id },
          data: {
            master_medicine_id: linkResult.master_id,
            link_status: "AUTO_LINKED",
            link_confidence_score: linkResult.confidence,
            linked_at: new Date(),
          },
        });
        results.autoLinked++;
      } else if (linkResult.type === "SUGGESTED") {
        await prisma.medicine.update({
          where: { medicine_id: medicine.medicine_id },
          data: {
            link_status: "SUGGESTED",
            link_confidence_score: linkResult.suggestions[0]?.confidence || null,
          },
        });
        results.suggested++;
      } else {
        results.noMatch++;
      }
    } catch (error) {
      results.errors.push({
        medicine_id: medicine.medicine_id,
        name: medicine.name,
        error: error.message,
      });
    }
  }
  
  return results;
}

// ══════════════════════════════════════════════════════════════
// GET UNLINKED MEDICINES
// ══════════════════════════════════════════════════════════════

/**
 * Get all unlinked medicines for a shop
 */
export async function getUnlinkedMedicines(shopId, branchId = null, options = {}) {
  const { status = "PENDING", page = 1, limit = 20 } = options;
  
  const where = {
    shop_id: shopId,
    master_medicine_id: null,
    link_rejected: false,
  };
  
  if (branchId) {
    where.branch_id = branchId;
  }
  
  if (status && status !== "ALL") {
    where.link_status = status;
  }
  
  const skip = (page - 1) * limit;
  
  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      select: {
        medicine_id: true,
        name: true,
        generic_name: true,
        manufacturer: true,
        link_status: true,
        link_confidence_score: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.medicine.count({ where }),
  ]);
  
  return {
    medicines,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ══════════════════════════════════════════════════════════════
// SEARCH MASTER CATALOG (for manual linking UI)
// ══════════════════════════════════════════════════════════════

/**
 * Search master catalog for manual linking
 */
export async function searchMasterCatalog(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }
  
  const searchTerm = query.trim();
  
  const masters = await prisma.masterMedicine.findMany({
    where: {
      is_active: true,
      OR: [
        { generic_name: { contains: searchTerm, mode: "insensitive" } },
        { master_key: { contains: searchTerm, mode: "insensitive" } },
        {
          variants: {
            some: {
              OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { brand: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    },
    include: {
      variants: {
        take: 3,
        select: {
          sku_id: true,
          name: true,
          brand: true,
          mrp: true,
        },
      },
    },
    take: limit,
    orderBy: { generic_name: "asc" },
  });
  
  return masters.map((m) => ({
    master_id: m.master_medicine_id,
    master_key: m.master_key,
    generic_name: m.generic_name,
    type: m.type,
    form: m.form,
    variant_count: m.variant_count,
    preview_variants: m.variants,
  }));
}