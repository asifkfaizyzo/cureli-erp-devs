/**
 * ═══════════════════════════════════════════════════════════════
 * backend/src/modules/medicines/linking.service.js
 * ═══════════════════════════════════════════════════════════════
 *
 * Master Catalog Linking Service - FIXED VERSION v2
 *
 * Fixes v1:
 * 1. DB query now uses multiple separate queries + merges (reliability)
 * 2. extractStrength handles unitless brand numbers ("FLUvator 100")
 * 3. Scoring redistributes weight when composition data unavailable
 * 4. Strength scoring handles inferred units
 * 5. Better brand name matching
 *
 * Fixes v2:
 * 6. extractStrength skips brand codes (LA, HP, DS, etc.)
 * 7. calculateStrengthScore never blocks when one side is inferred
 * 8. calculateMatchScore boosts exact name matches to minimum SUGGEST threshold
 */

import prisma from "../../config/prisma.js";

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const THRESHOLDS = {
  AUTO_LINK: 95,
  SUGGEST: 80,
  MIN_MATCH: 80,
};

const SCORE_WEIGHTS = {
  NAME: 40,
  STRENGTH: 25,
  COMPOSITION: 20,
  MANUFACTURER: 15,
};

// ══════════════════════════════════════════════════════════════
// STRING UTILITIES
// ══════════════════════════════════════════════════════════════

function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract brand name (the non-numeric, non-form part)
 * "FLUvator 100 Tablet" → "fluvator"
 * "Pantop 40MG Tab" → "pantop"
 */
function extractBrandToken(name) {
  if (!name) return null;
  const normalized = normalizeString(name);
  const forms = [
    "tablet",
    "tablets",
    "tab",
    "capsule",
    "capsules",
    "cap",
    "syrup",
    "suspension",
    "solution",
    "injection",
    "inj",
    "cream",
    "ointment",
    "gel",
    "lotion",
    "drops",
    "drop",
    "powder",
    "granules",
    "spray",
    "inhaler",
    "patch",
    "patches",
    "suppository",
    "suppositories",
    "liquid",
    "liqu",
    "syrp",
  ];

  const tokens = normalized.split(" ").filter((t) => {
    if (t.length < 2) return false;
    if (/^\d+(\.\d+)?$/.test(t)) return false; // pure number
    if (/^\d+\s*(mg|mcg|g|ml|%|iu)$/i.test(t)) return false; // number+unit
    if (forms.includes(t)) return false;
    return true;
  });

  return tokens.length > 0 ? tokens[0] : null;
}

function normalizeUnit(unit) {
  if (!unit) return "";
  const normalized = unit.toLowerCase().trim();

  const unitMap = {
    milligram: "mg",
    milligrams: "mg",
    microgram: "mcg",
    micrograms: "mcg",
    gram: "g",
    grams: "g",
    milliliter: "ml",
    milliliters: "ml",
    liter: "l",
    liters: "l",
    unit: "iu",
    units: "iu",
  };

  return unitMap[normalized] || normalized;
}

/**
 * Extract strength from medicine name
 *
 *  FIX v2: Skips brand codes like "LA 12", "HP 500", "DS", etc.
 * Only infers strength for plausible dosage values.
 *
 * "Paracetamol 500mg" → { value: 500, unit: "mg", inferred: false }
 * "FLUvator 100 Tablet" → { value: 100, unit: "mg", inferred: true }
 * "Penidure LA 12 Injection" → null (12 after "LA" = brand code)
 * "Betadine 10%" → { value: 10, unit: "%", inferred: false }
 */
function extractStrength(name) {
  if (!name) return null;

  // Pattern 1: Explicit unit (500mg, 10%, 1200000IU, etc.) — HIGH CONFIDENCE
  const explicitPatterns = [
    /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|l|iu|%|units?)/i,
    /(\d+(?:\.\d+)?)\s*(milligrams?|micrograms?|grams?|milliliters?|liters?)/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = name.match(pattern);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: normalizeUnit(match[2]),
        raw: match[0],
        inferred: false,
      };
    }
  }

  // Pattern 2: Brand-style unitless strength — LOW CONFIDENCE
  // "FLUvator 100 Tablet" → 100 (implied mg)
  // But SKIP small numbers that are likely product codes, not dosages
  // "Penidure LA 12" → 12 is a brand code, NOT a strength
  const formWords =
    "tablet|tablets|tab|capsule|capsules|cap|syrup|suspension|" +
    "solution|injection|inj|cream|ointment|gel|lotion|drops?|powder|" +
    "granules|spray|inhaler|patches?|suppository|suppositories|" +
    "\\d+\\s*s|\\d+\\s*'s|\\d+\\s*tab";

  const brandPattern = new RegExp(
    `([a-z])\\s+(\\d+(?:\\.\\d+)?)\\s+(?:${formWords})`,
    "i",
  );
  const brandMatch = name.match(brandPattern);
  if (brandMatch) {
    const val = parseFloat(brandMatch[2]);

    // ═══════════════════════════════════════════════════════════
    // FIX v2: Only infer strength for values that are plausible dosages
    // Common oral dosages: 0.25, 0.5, 1, 2, 2.5, 4, 5, 10, 15, 20, 25,
    //   40, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 750, 1000
    // Skip values like 12, 6.4 — these are often brand codes
    // ═══════════════════════════════════════════════════════════
    const plausibleDosages = [
      0.25, 0.5, 1, 2, 2.5, 4, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150,
      200, 250, 300, 400, 500, 600, 650, 750, 800, 1000,
    ];

    // Check if the value is a common dosage
    const isPlausibleDosage = plausibleDosages.includes(val) || val >= 50;

    // Also check if there are brand-code letters directly before the number
    // "LA 12" → likely brand code, "FLUvator 100" → likely dosage
    const beforeNumber = name.substring(0, name.indexOf(brandMatch[2])).trim();
    const lastWordBefore = beforeNumber.split(/\s+/).pop()?.toLowerCase() || "";
    const brandCodePrefixes = [
      "la",
      "hp",
      "ds",
      "sr",
      "cr",
      "xl",
      "xr",
      "er",
      "mr",
      "od",
      "ls",
      "hs",
      "fc",
      "dt",
      "md",
      "rd",
      "hd",
      "ld",
      "pd",
    ];
    const isBrandCode = brandCodePrefixes.includes(lastWordBefore);

    if (isPlausibleDosage && !isBrandCode) {
      return {
        value: val,
        unit: "mg",
        raw: brandMatch[2],
        inferred: true,
      };
    }

    // If it's a brand code or not a plausible dosage, skip entirely
    if (isBrandCode) {
      console.log(
        `⚠️ extractStrength: Skipping "${val}" after brand code "${lastWordBefore}" in "${name}"`,
      );
    }
  }

  return null;
}

function extractForm(name) {
  if (!name) return null;

  const forms = [
    "tablet",
    "tablets",
    "tab",
    "capsule",
    "capsules",
    "cap",
    "syrup",
    "suspension",
    "solution",
    "injection",
    "inj",
    "cream",
    "ointment",
    "gel",
    "lotion",
    "drops",
    "drop",
    "powder",
    "granules",
    "spray",
    "inhaler",
    "patch",
    "patches",
    "suppository",
    "suppositories",
  ];

  const normalized = name.toLowerCase();

  for (const form of forms) {
    if (normalized.includes(form)) {
      if (["tablets", "tab"].includes(form)) return "tablet";
      if (["capsules", "cap"].includes(form)) return "capsule";
      if (form === "inj") return "injection";
      if (form === "drops") return "drop";
      if (form === "patches") return "patch";
      if (form === "suppositories") return "suppository";
      return form;
    }
  }

  return null;
}

function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

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
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function calculateStringSimilarity(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

// ══════════════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ══════════════════════════════════════════════════════════════

function calculateNameScore(shopName, masterName, masterBrand) {
  const shopNorm = normalizeString(shopName);
  const masterNorm = normalizeString(masterName);
  const brandNorm = normalizeString(masterBrand);

  // Exact match
  if (shopNorm === masterNorm) {
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  }

  if (brandNorm && shopNorm === brandNorm) {
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact brand match" };
  }

  // Contains match
  if (shopNorm.includes(masterNorm) || masterNorm.includes(shopNorm)) {
    return {
      score: SCORE_WEIGHTS.NAME * 0.9,
      reason: "Name contains match",
    };
  }

  if (
    brandNorm &&
    (shopNorm.includes(brandNorm) || brandNorm.includes(shopNorm))
  ) {
    return {
      score: SCORE_WEIGHTS.NAME * 0.85,
      reason: "Brand contains match",
    };
  }

  // Compare brand tokens directly
  const shopBrand = extractBrandToken(shopName);
  const masterBrandToken = extractBrandToken(masterName);

  if (shopBrand && masterBrandToken && shopBrand === masterBrandToken) {
    return {
      score: SCORE_WEIGHTS.NAME * 0.92,
      reason: "Brand token exact match",
    };
  }

  // String similarity
  const nameSim = calculateStringSimilarity(shopNorm, masterNorm);
  const brandSim = brandNorm
    ? calculateStringSimilarity(shopNorm, brandNorm)
    : 0;
  const bestSim = Math.max(nameSim, brandSim);

  if (bestSim >= 0.85) {
    return {
      score: SCORE_WEIGHTS.NAME * bestSim,
      reason: `Name similarity ${Math.round(bestSim * 100)}%`,
    };
  }

  if (bestSim >= 0.7) {
    return {
      score: SCORE_WEIGHTS.NAME * bestSim * 0.8,
      reason: `Partial name match ${Math.round(bestSim * 100)}%`,
    };
  }

  return { score: 0, reason: "Name mismatch" };
}

/**
 * Calculate strength match score
 *
 *  FIX v2: Never blocks when one side is inferred.
 * Only blocks when BOTH sides have explicit (non-inferred) strength
 * AND they disagree. This prevents "Penidure LA 12" (inferred 12mg)
 * from blocking against "1200000IU" (explicit).
 */
function calculateStrengthScore(shopName, masterVariant) {
  const shopStrength = extractStrength(shopName);

  // Use DB fields first, fallback to name parsing
  let masterStrength = null;
  if (masterVariant.strength_value != null && masterVariant.strength_unit) {
    masterStrength = {
      value: parseFloat(masterVariant.strength_value),
      unit: normalizeUnit(masterVariant.strength_unit),
      inferred: false,
    };
  } else {
    masterStrength = extractStrength(masterVariant.name);
  }

  // Neither has strength
  if (!shopStrength && !masterStrength) {
    return {
      score: SCORE_WEIGHTS.STRENGTH * 0.5,
      reason: "No strength specified",
      isBlocking: false,
    };
  }

  // Only one side has strength — partial score, NOT blocking
  if (!shopStrength && masterStrength) {
    return {
      score: SCORE_WEIGHTS.STRENGTH * 0.4,
      reason: "Shop strength unknown",
      isBlocking: false,
    };
  }

  if (shopStrength && !masterStrength) {
    return {
      score: SCORE_WEIGHTS.STRENGTH * 0.3,
      reason: "Master strength unknown",
      isBlocking: false,
    };
  }

  // Both have strength — compare
  const valuesMatch =
    Math.abs(shopStrength.value - masterStrength.value) < 0.01;
  const unitsMatch = shopStrength.unit === masterStrength.unit;
  const oneInferred = !!(shopStrength.inferred || masterStrength.inferred);

  if (valuesMatch && (unitsMatch || oneInferred)) {
    // Perfect or near-perfect strength match
    const multiplier = oneInferred ? 0.92 : 1.0;
    return {
      score: SCORE_WEIGHTS.STRENGTH * multiplier,
      reason: `Strength match: ${shopStrength.value}${shopStrength.unit}${oneInferred ? " (inferred)" : ""}`,
      isBlocking: false,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // FIX v2: ONLY BLOCK when BOTH sides have EXPLICIT (non-inferred)
  // strength AND they disagree.
  // If either side is inferred, DON'T block — just give low score.
  // ═══════════════════════════════════════════════════════════

  if (oneInferred) {
    // One side guessed — don't trust it enough to block
    if (unitsMatch) {
      // Same unit, different value, but one was guessed
      return {
        score: SCORE_WEIGHTS.STRENGTH * 0.2,
        reason: `Strength uncertain: ${shopStrength.value}${shopStrength.unit} vs ${masterStrength.value}${masterStrength.unit} (inferred)`,
        isBlocking: false,
      };
    }
    // Different units AND one was inferred — very unreliable, just skip
    return {
      score: SCORE_WEIGHTS.STRENGTH * 0.3,
      reason: `Strength inconclusive: ${shopStrength.value}${shopStrength.unit}(inferred) vs ${masterStrength.value}${masterStrength.unit}`,
      isBlocking: false,
    };
  }

  // BOTH are explicit (non-inferred) and they DON'T match → BLOCK
  if (!unitsMatch) {
    return {
      score: 0,
      reason: `Strength unit mismatch: ${shopStrength.unit} vs ${masterStrength.unit}`,
      isBlocking: true,
    };
  }

  // Same unit, different value, both explicit → BLOCK
  return {
    score: 0,
    reason: `Strength mismatch: ${shopStrength.value}${shopStrength.unit} vs ${masterStrength.value}${masterStrength.unit}`,
    isBlocking: true,
  };
}

function calculateCompositionScore(shopGenericName, masterComposition) {
  if (!shopGenericName || !masterComposition) {
    return { score: 0, reason: "No composition to compare", unavailable: true };
  }

  const shopNorm = normalizeString(shopGenericName);

  let compositionNames = [];

  if (Array.isArray(masterComposition)) {
    compositionNames = masterComposition.map((c) =>
      normalizeString(c.name || c),
    );
  } else if (typeof masterComposition === "string") {
    compositionNames = [normalizeString(masterComposition)];
  }

  if (compositionNames.length === 0) {
    return { score: 0, reason: "No master composition", unavailable: true };
  }

  for (const compName of compositionNames) {
    if (shopNorm === compName) {
      return {
        score: SCORE_WEIGHTS.COMPOSITION,
        reason: "Exact composition match",
      };
    }
    if (shopNorm.includes(compName) || compName.includes(shopNorm)) {
      return {
        score: SCORE_WEIGHTS.COMPOSITION * 0.9,
        reason: "Composition contains match",
      };
    }

    const sim = calculateStringSimilarity(shopNorm, compName);
    if (sim >= 0.8) {
      return {
        score: SCORE_WEIGHTS.COMPOSITION * sim,
        reason: `Composition similarity ${Math.round(sim * 100)}%`,
      };
    }
  }

  return { score: 0, reason: "Composition mismatch" };
}

function calculateManufacturerScore(
  shopManufacturer,
  masterManufacturer,
  masterMarketer,
) {
  if (!shopManufacturer) {
    return { score: 0, reason: "No shop manufacturer" };
  }

  const shopNorm = normalizeString(shopManufacturer);
  const mfrNorm = normalizeString(masterManufacturer);
  const mktNorm = normalizeString(masterMarketer);

  // Exact match
  if (mfrNorm && shopNorm === mfrNorm) {
    return {
      score: SCORE_WEIGHTS.MANUFACTURER,
      reason: "Exact manufacturer match",
    };
  }
  if (mktNorm && shopNorm === mktNorm) {
    return {
      score: SCORE_WEIGHTS.MANUFACTURER,
      reason: "Exact marketer match",
    };
  }

  // Contains match
  if (mfrNorm && (shopNorm.includes(mfrNorm) || mfrNorm.includes(shopNorm))) {
    return {
      score: SCORE_WEIGHTS.MANUFACTURER * 0.9,
      reason: "Manufacturer contains match",
    };
  }
  if (mktNorm && (shopNorm.includes(mktNorm) || mktNorm.includes(shopNorm))) {
    return {
      score: SCORE_WEIGHTS.MANUFACTURER * 0.85,
      reason: "Marketer contains match",
    };
  }

  // Similarity
  const mfrSim = mfrNorm ? calculateStringSimilarity(shopNorm, mfrNorm) : 0;
  const mktSim = mktNorm ? calculateStringSimilarity(shopNorm, mktNorm) : 0;
  const bestSim = Math.max(mfrSim, mktSim);

  if (bestSim >= 0.7) {
    return {
      score: SCORE_WEIGHTS.MANUFACTURER * bestSim,
      reason: `Manufacturer similarity ${Math.round(bestSim * 100)}%`,
    };
  }

  return { score: 0, reason: "Manufacturer mismatch" };
}

/**
 * Calculate total match score
 *
 *  FIX v2: Adds exact-name boost.
 * When the product name matches EXACTLY, this is an extremely strong signal.
 * Even if manufacturer or strength data is missing/mismatched, an exact name
 * is almost certainly correct. Boosts to minimum SUGGEST threshold.
 */
function calculateMatchScore(shopMedicine, masterMedicine, masterVariant) {
  const scores = {
    name: calculateNameScore(
      shopMedicine.name,
      masterVariant.name,
      masterVariant.brand,
    ),
    strength: calculateStrengthScore(shopMedicine.name, masterVariant),
    composition: calculateCompositionScore(
      shopMedicine.generic_name,
      masterMedicine.composition,
    ),
    manufacturer: calculateManufacturerScore(
      shopMedicine.manufacturer,
      masterVariant.manufacturer,
      masterVariant.marketer,
    ),
  };

  console.log("⚖️ Scoring:", {
    input: shopMedicine.name,
    variant: masterVariant.name,
    brand: masterVariant.brand,
    scores: {
      name: Math.round(scores.name.score * 100) / 100,
      nameReason: scores.name.reason,
      strength: Math.round(scores.strength.score * 100) / 100,
      strengthReason: scores.strength.reason,
      strengthBlocking: scores.strength.isBlocking,
      composition: Math.round(scores.composition.score * 100) / 100,
      compositionReason: scores.composition.reason,
      manufacturer: Math.round(scores.manufacturer.score * 100) / 100,
      manufacturerReason: scores.manufacturer.reason,
    },
  });

  // Check for blocking conditions
  if (scores.strength.isBlocking) {
    return {
      totalScore: 0,
      scores,
      reasons: [scores.strength.reason],
      isBlocked: true,
      blockReason: scores.strength.reason,
    };
  }

  const compositionUnavailable = scores.composition.unavailable === true;

  let totalScore;
  if (compositionUnavailable) {
    // Max possible without composition = 80 (name:40 + strength:25 + manufacturer:15)
    const rawScore =
      scores.name.score + scores.strength.score + scores.manufacturer.score;
    const maxPossible =
      SCORE_WEIGHTS.NAME + SCORE_WEIGHTS.STRENGTH + SCORE_WEIGHTS.MANUFACTURER; // 80
    totalScore = Math.round((rawScore / maxPossible) * 100);
  } else {
    totalScore = Math.round(
      scores.name.score +
        scores.strength.score +
        scores.composition.score +
        scores.manufacturer.score,
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FIX v2: EXACT NAME MATCH BOOST
  // When the product name matches EXACTLY, this is an extremely
  // strong signal. Even if manufacturer or strength data is
  // missing/mismatched, an exact name is almost certainly correct.
  //
  // Real-world scenario: Supplier uses abbreviation "ZYDS" but
  // master has "Pfizer Ltd" — the NAME is still exact.
  //
  // Boost: If exact name match and score is 60-94, push to
  // SUGGEST threshold (minimum 85). If score already ≥80, push
  // closer to AUTO_LINK.
  // ═══════════════════════════════════════════════════════════
  const isExactNameMatch = scores.name.reason === "Exact name match";

  if (isExactNameMatch && !scores.strength.isBlocking) {
    if (totalScore < THRESHOLDS.SUGGEST) {
      // Exact name but low score due to missing data — at minimum suggest
      totalScore = Math.max(totalScore, 85);
    } else if (
      totalScore >= THRESHOLDS.SUGGEST &&
      totalScore < THRESHOLDS.AUTO_LINK
    ) {
      // Exact name + decent score — boost toward auto-link
      totalScore = Math.max(totalScore, 92);
    }
  }

  const reasons = [
    scores.name.reason,
    scores.strength.reason,
    scores.composition.reason,
    scores.manufacturer.reason,
  ].filter((r) => !r.includes("mismatch") && !r.includes("No "));

  console.log("📊 Total:", {
    totalScore,
    compositionUnavailable,
    isExactNameMatch,
    boosted: isExactNameMatch && !scores.strength.isBlocking,
    reasons,
  });

  return {
    totalScore,
    scores,
    reasons,
    isBlocked: false,
  };
}

// ══════════════════════════════════════════════════════════════
// MAIN MATCHING FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Find potential matches for a shop medicine in master catalog
 * Uses multiple targeted queries + deduplication
 */
async function findPotentialMatches(shopMedicine, limit = 20) {
  const { name, manufacturer, generic_name } = shopMedicine;

  const normalizedName = normalizeString(name);
  const shopForm = extractForm(name);
  const shopStrength = extractStrength(name);
  const brandToken = extractBrandToken(name);

  // Build search terms
  const searchTerms = normalizedName.split(" ").filter((t) => t.length > 2);

  console.log("🔍 Searching for:", name);
  console.log("🧠 Search terms:", searchTerms);
  console.log("🏷️ Brand token:", brandToken);
  console.log("🏭 Manufacturer:", manufacturer || "(none)");
  console.log("💊 Generic:", generic_name || "(none)");
  console.log("📐 Extracted form:", shopForm, "| strength:", shopStrength);

  if (searchTerms.length === 0 && !brandToken) {
    console.log("⚠️ No search terms — returning empty");
    return [];
  }

  const variantMap = new Map(); // Deduplicate by variant_id

  const includeClause = {
    master: {
      select: {
        master_medicine_id: true,
        master_key: true,
        generic_name: true,
        type: true,
        form: true,
        composition: true,
        primary_category: true,
      },
    },
  };

  // Query 1: EXACT name match (highest priority)
  try {
    const exactMatches = await prisma.masterMedicineVariant.findMany({
      where: {
        name: { equals: name, mode: "insensitive" },
      },
      include: includeClause,
      take: 5,
    });
    exactMatches.forEach((v) => variantMap.set(v.variant_id, v));
    console.log(`📦 Query 1 (exact name): ${exactMatches.length} results`);
  } catch (e) {
    console.error("Query 1 failed:", e.message);
  }

  // Query 2: Brand token match (most reliable for branded medicines)
  if (brandToken && brandToken.length >= 3) {
    try {
      const brandMatches = await prisma.masterMedicineVariant.findMany({
        where: {
          OR: [
            { name: { contains: brandToken, mode: "insensitive" } },
            { brand: { contains: brandToken, mode: "insensitive" } },
          ],
        },
        include: includeClause,
        take: 30,
      });
      brandMatches.forEach((v) => variantMap.set(v.variant_id, v));
      console.log(
        `📦 Query 2 (brand "${brandToken}"): ${brandMatches.length} results`,
      );
    } catch (e) {
      console.error("Query 2 failed:", e.message);
    }
  }

  // Query 3: Full name contains (for partial matches)
  if (variantMap.size < 5) {
    try {
      const nameContains = await prisma.masterMedicineVariant.findMany({
        where: {
          OR: searchTerms.slice(0, 3).map((term) => ({
            name: { contains: term, mode: "insensitive" },
          })),
        },
        include: includeClause,
        take: 20,
      });
      nameContains.forEach((v) => variantMap.set(v.variant_id, v));
      console.log(`📦 Query 3 (name contains): ${nameContains.length} results`);
    } catch (e) {
      console.error("Query 3 failed:", e.message);
    }
  }

  // Query 4: Manufacturer/marketer match (if provided)
  if (manufacturer && variantMap.size < 10) {
    const mfrFirstWord = normalizeString(manufacturer).split(" ")[0];
    if (mfrFirstWord && mfrFirstWord.length >= 3) {
      try {
        const mfrMatches = await prisma.masterMedicineVariant.findMany({
          where: {
            OR: [
              {
                manufacturer: {
                  contains: mfrFirstWord,
                  mode: "insensitive",
                },
              },
              {
                marketer: {
                  contains: mfrFirstWord,
                  mode: "insensitive",
                },
              },
            ],
            name: {
              contains: searchTerms[0] || brandToken || "",
              mode: "insensitive",
            },
          },
          include: includeClause,
          take: 10,
        });
        mfrMatches.forEach((v) => variantMap.set(v.variant_id, v));
        console.log(
          `📦 Query 4 (manufacturer "${mfrFirstWord}"): ${mfrMatches.length} results`,
        );
      } catch (e) {
        console.error("Query 4 failed:", e.message);
      }
    }
  }

  const variants = Array.from(variantMap.values());

  console.log(`📦 Total unique variants: ${variants.length}`);
  if (variants.length > 0) {
    console.log(
      "📦 Candidates:",
      variants.slice(0, 10).map((v) => ({
        name: v.name,
        brand: v.brand,
        manufacturer: v.manufacturer,
        marketer: v.marketer,
        master_key: v.master?.master_key,
      })),
    );
  }

  // Score each variant
  const scoredMatches = variants
    .map((variant) => {
      const matchResult = calculateMatchScore(
        shopMedicine,
        variant.master,
        variant,
      );

      return {
        variant,
        master: variant.master,
        ...matchResult,
      };
    })
    .filter((m) => !m.isBlocked && m.totalScore >= THRESHOLDS.MIN_MATCH)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  console.log(
    ` Final matches after filter (threshold=${THRESHOLDS.MIN_MATCH}):`,
    scoredMatches.length > 0
      ? scoredMatches.map((m) => ({
          variant: m.variant.name,
          totalScore: m.totalScore,
          reasons: m.reasons,
        }))
      : " NONE passed threshold",
  );

  return scoredMatches;
}

/**
 * Check a single medicine against master catalog
 */
export async function checkSingleMedicine(shopMedicine) {
  const matches = await findPotentialMatches(shopMedicine, 5);

  if (matches.length === 0) {
    console.log("🏁 Final decision:", {
      name: shopMedicine.name,
      topMatch: null,
      confidence: 0,
      status: "NO_MATCH",
    });

    return {
      status: "NO_MATCH",
      confidence: 0,
      reason: "No matching medicine found in master catalog",
      master_medicine_id: null,
      suggestions: [],
    };
  }

  const topMatch = matches[0];
  const confidence = topMatch.totalScore;

  const highConfidenceMatches = matches.filter(
    (m) => m.totalScore >= THRESHOLDS.AUTO_LINK,
  );

  let result;

  if (highConfidenceMatches.length > 1) {
    result = {
      status: "PENDING",
      confidence,
      reason: `Multiple matches found (${highConfidenceMatches.length} candidates)`,
      master_medicine_id: null,
      suggested_master_id: topMatch.master.master_medicine_id,
      suggestions: highConfidenceMatches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key: m.master.master_key,
        generic_name: m.master.generic_name,
        variant_name: m.variant.name,
        confidence: m.totalScore,
        reasons: m.reasons,
      })),
    };
  } else if (confidence >= THRESHOLDS.AUTO_LINK) {
    result = {
      status: "AUTO_LINKED",
      confidence,
      reason: topMatch.reasons.join(", "),
      master_medicine_id: topMatch.master.master_medicine_id,
      master_key: topMatch.master.master_key,
      matched_variant: {
        sku_id: topMatch.variant.sku_id,
        name: topMatch.variant.name,
        brand: topMatch.variant.brand,
      },
      suggestions: [],
    };
  } else if (confidence >= THRESHOLDS.SUGGEST) {
    result = {
      status: "PENDING",
      confidence,
      reason: `Needs review: ${topMatch.reasons.join(", ")}`,
      master_medicine_id: null,
      suggested_master_id: topMatch.master.master_medicine_id,
      suggestions: matches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key: m.master.master_key,
        generic_name: m.master.generic_name,
        variant_name: m.variant.name,
        confidence: m.totalScore,
        reasons: m.reasons,
      })),
    };
  } else {
    result = {
      status: "NO_MATCH",
      confidence,
      reason: "Match confidence too low",
      master_medicine_id: null,
      suggestions: matches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key: m.master.master_key,
        generic_name: m.master.generic_name,
        variant_name: m.variant.name,
        confidence: m.totalScore,
        reasons: m.reasons,
      })),
    };
  }

  console.log("🏁 Final decision:", {
    name: shopMedicine.name,
    topMatch: topMatch?.variant?.name,
    confidence,
    status: result.status,
  });

  return result;
}

/**
 * MAIN FUNCTION: Bulk check import rows against master catalog
 */
export async function bulkCheckImportRows(rows) {
  if (!rows || rows.length === 0) {
    return {
      results: [],
      stats: { total: 0, autoLinked: 0, pending: 0, noMatch: 0 },
    };
  }

  console.log(
    `🔍 Bulk checking ${rows.length} import rows against master catalog...`,
  );

  const results = [];
  const stats = {
    total: rows.length,
    autoLinked: 0,
    pending: 0,
    noMatch: 0,
  };

  const BATCH_SIZE = 20;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (row, batchIndex) => {
        const rowIndex = i + batchIndex;

        if (!row.name || !row.name.trim()) {
          return {
            rowIndex,
            status: "SKIP",
            reason: "No product name",
            master_medicine_id: null,
          };
        }

        console.log(
          "🧪 Checking row:",
          rowIndex,
          row.name,
          row.manufacturer || "(no mfr)",
        );

        try {
          const matchResult = await checkSingleMedicine({
            name: row.name,
            manufacturer: row.manufacturer || row.mfac,
            generic_name: row.generic_name || row.genericName,
          });

          if (matchResult.status === "AUTO_LINKED") stats.autoLinked++;
          else if (matchResult.status === "PENDING") stats.pending++;
          else if (matchResult.status === "NO_MATCH") stats.noMatch++;

          return {
            rowIndex,
            originalName: row.name,
            originalManufacturer: row.manufacturer || row.mfac,
            ...matchResult,
          };
        } catch (error) {
          console.error(`Error checking row ${rowIndex}:`, error.message);
          return {
            rowIndex,
            status: "ERROR",
            reason: error.message,
            master_medicine_id: null,
          };
        }
      }),
    );

    results.push(...batchResults);
  }

  console.log(` Bulk check complete:`, stats);

  return { results, stats };
}

// ══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBLE FUNCTIONS
// ══════════════════════════════════════════════════════════════

export async function autoLinkToMasterCatalog(shopMedicine) {
  const result = await checkSingleMedicine(shopMedicine);

  if (result.status === "AUTO_LINKED") {
    return {
      type: "AUTO_LINKED",
      confidence: result.confidence,
      master_id: result.master_medicine_id,
      master_key: result.master_key,
      matched_variant: result.matched_variant,
    };
  }

  if (result.status === "PENDING" && result.suggestions.length > 0) {
    return {
      type: "SUGGESTED",
      suggestions: result.suggestions,
    };
  }

  return { type: "NONE" };
}

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

  const result = await checkSingleMedicine(medicine);

  return {
    isLinked: false,
    linkStatus: medicine.link_status,
    currentLink: null,
    suggestions: result.suggestions || [],
  };
}

export async function manuallyLinkMedicine(
  medicineId,
  masterMedicineId,
  userId,
  userType = "CADMIN",
) {
  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
  });

  if (!master) {
    throw new Error("Master medicine not found");
  }

  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: masterMedicineId,
      link_status: "MANUAL_LINKED",
      link_confidence_score: 100,
      link_rejected: false,
      linked_at: new Date(),
      linked_by_id: userId,
      linked_by_type: userType,
      suggested_master_id: null,
      suggestion_reason: null,
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

export async function unlinkMedicine(medicineId, reject = false) {
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: null,
      link_status: reject ? "UNLINKED" : "PENDING",
      link_confidence_score: null,
      link_rejected: reject,
      linked_at: null,
      linked_by_id: null,
      linked_by_type: null,
    },
  });

  return {
    success: true,
    medicine: updated,
    action: reject ? "rejected" : "unlinked",
  };
}

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
      const linkResult = await checkSingleMedicine(medicine);

      if (linkResult.status === "AUTO_LINKED") {
        await prisma.medicine.update({
          where: { medicine_id: medicine.medicine_id },
          data: {
            master_medicine_id: linkResult.master_medicine_id,
            link_status: "AUTO_LINKED",
            link_confidence_score: linkResult.confidence,
            linked_at: new Date(),
            linked_by_type: "SYSTEM",
            suggestion_reason: linkResult.reason,
          },
        });
        results.autoLinked++;
      } else if (linkResult.status === "PENDING") {
        await prisma.medicine.update({
          where: { medicine_id: medicine.medicine_id },
          data: {
            link_status: "SUGGESTED",
            link_confidence_score: linkResult.confidence,
            suggested_master_id: linkResult.suggested_master_id,
            suggestion_reason: linkResult.reason,
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

export async function getUnlinkedMedicines(
  shopId,
  branchId = null,
  options = {},
) {
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
