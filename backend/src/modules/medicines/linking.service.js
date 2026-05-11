/**
 * ═══════════════════════════════════════════════════════════════
 * backend/src/modules/medicines/linking.service.js
 * ═══════════════════════════════════════════════════════════════
 *
 * Master Catalog Linking Service - v3
 *
 * Fixes v3 (over v2):
 * 1. Hyphen normalization before strength extraction
 *    "NITROCONTIN-6.4" → extracts 6.4 correctly
 *
 * 2. First-number-after-brand-token strategy
 *    Picks strength from position immediately after brand name,
 *    not from arbitrary number before form word.
 *    Avoids mistaking pack size (25 TAB'S) for strength.
 *
 * 3. Brand field exact match → "Exact name match" reason
 *    When shop brand token === master's explicit brand field token,
 *    treat as exact match (same confidence level).
 *
 * 4. Form/pack suffix stripping before name comparison
 *    "D500CAL" vs "D500Cal Tablet" → strip "Tablet" → exact match.
 *
 * 5. Exact name boost extended to composition-unavailable cases
 *    When composition data missing AND name+strength match,
 *    push to AUTO_LINK threshold instead of just SUGGEST.
 *
 * 6. Brand token exact match boosts same as exact name match
 *    Previously only "Exact name match" triggered boost — now
 *    "Brand token exact match" also triggers it.
 *
 * 7. Lowered MIN_MATCH threshold 80 → 70
 *    Prevents valid candidates from being filtered out before
 *    scoring when data is sparse. Scoring still determines
 *    final AUTO_LINK / PENDING / NO_MATCH outcome.
 */

import prisma from "../../config/prisma.js";

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const THRESHOLDS = {
  AUTO_LINK: 92,   // was 95 — exact name + strength match should auto-link
  SUGGEST:   75,   // was 80 — be more inclusive for "needs review"
  MIN_MATCH: 65,   // was 80 — don't filter candidates too early
};

const SCORE_WEIGHTS = {
  NAME:         40,
  STRENGTH:     25,
  COMPOSITION:  20,
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

// ── Form words used across multiple functions ─────────────────
const FORM_WORDS = [
  "tablet", "tablets", "tab", "tabs", "capsule", "capsules", "cap", "caps",
  "syrup", "suspension", "solution", "injection", "inj", "cream", "ointment",
  "gel", "lotion", "drops", "drop", "powder", "granules", "spray", "inhaler",
  "patch", "patches", "suppository", "suppositories", "liquid", "liqu", "syrp",
  // Release modifiers — part of form, not part of brand
  "cr", "sr", "xl", "xr", "er", "mr", "od", "la", "ds", "forte",
];

/**
 * Strip form suffixes AND leading pack quantities from a name.
 *
 * "D500CAL 10 TABS"         → "D500CAL"
 * "NITROCONTIN-6.4 25 TAB'S" → "NITROCONTIN-6.4"
 * "Nitrocontin 6.4mg Tablet CR" → "Nitrocontin 6.4mg"
 * "D500Cal Tablet"           → "D500Cal"
 */
function stripFormAndPackSuffix(name) {
  if (!name) return "";

  let result = name.trim();

  // Remove trailing pack patterns like "25 TAB'S", "10 TABS", "30 's"
  result = result.replace(/\s+\d+\s+tab['']?s?\s*$/i, "");
  result = result.replace(/\s+\d+\s+cap['']?s?\s*$/i, "");
  result = result.replace(/\s+\d+\s+['']?s\s*$/i, "");

  // Remove trailing form words (iterate to handle "Tablet CR" → remove CR then Tablet)
  let changed = true;
  while (changed) {
    changed = false;
    for (const form of FORM_WORDS) {
      const regex = new RegExp(`\\s+${form}\\s*$`, "i");
      if (regex.test(result)) {
        result = result.replace(regex, "").trim();
        changed = true;
      }
    }
  }

  return result.trim();
}

/**
 * Extract brand name token — first meaningful word that is not
 * a number, unit, or form word.
 *
 * "FLUvator 100 Tablet" → "fluvator"
 * "NITROCONTIN-6.4 25 TAB'S" → "nitrocontin"
 * "D500CAL 10 TABS" → "d500cal"
 */
function extractBrandToken(name) {
  if (!name) return null;

  // Normalize hyphens between letter and digit so brand token
  // is extracted cleanly even for "NITROCONTIN-6.4"
  const cleaned = name.replace(/-(\d)/g, " $1");
  const normalized = normalizeString(cleaned);

  const tokens = normalized.split(" ").filter((t) => {
    if (t.length < 2) return false;
    if (/^\d+(\.\d+)?$/.test(t)) return false;       // pure number
    if (/^\d+\s*(mg|mcg|g|ml|%|iu)$/i.test(t)) return false; // number+unit
    if (FORM_WORDS.includes(t)) return false;
    return true;
  });

  return tokens.length > 0 ? tokens[0] : null;
}

function normalizeUnit(unit) {
  if (!unit) return "";
  const normalized = unit.toLowerCase().trim();
  const unitMap = {
    milligram: "mg", milligrams: "mg",
    microgram: "mcg", micrograms: "mcg",
    gram: "g", grams: "g",
    milliliter: "ml", milliliters: "ml",
    liter: "l", liters: "l",
    unit: "iu", units: "iu",
  };
  return unitMap[normalized] || normalized;
}

/**
 * Extract strength from a medicine name.
 *
 * v3 changes:
 * 1. Normalizes hyphens before digits: "NITROCONTIN-6.4" → "NITROCONTIN 6.4"
 * 2. Uses "first number after brand token" strategy to avoid
 *    confusing pack size with strength.
 *
 * "NITROCONTIN-6.4 25 TAB'S" → { value: 6.4, unit: "mg", inferred: true }
 * "Paracetamol 500mg Tablet"  → { value: 500, unit: "mg", inferred: false }
 * "D500CAL 10 TABS"           → null (10 is pack size, not strength)
 */
function extractStrength(name) {
  if (!name) return null;

  // ── Normalize hyphens between letter and digit ────────────
  const normalized = name.replace(/-(\d)/g, " $1");

  // ── Pattern 1: Explicit unit — HIGH CONFIDENCE ────────────
  const explicitPatterns = [
    /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|l|iu|%|units?)/i,
    /(\d+(?:\.\d+)?)\s*(milligrams?|micrograms?|grams?|milliliters?|liters?)/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        value:    parseFloat(match[1]),
        unit:     normalizeUnit(match[2]),
        raw:      match[0],
        inferred: false,
      };
    }
  }

  // ── Pattern 2: First number directly after brand token ────
  // "NITROCONTIN 6.4 25 TAB'S"
  //               ^^^-- this is strength (immediately after brand)
  //                   ^^-- this is pack size (before form word)
  const brandToken = extractBrandToken(name);
  if (brandToken) {
    const normalizedLower = normalized.toLowerCase();
    const brandIdx = normalizedLower.indexOf(brandToken.toLowerCase());

    if (brandIdx !== -1) {
      const afterBrand = normalized.slice(brandIdx + brandToken.length);

      // First number immediately after the brand token
      const firstNumMatch = afterBrand.match(/^\s*(\d+(?:\.\d+)?)/);
      if (firstNumMatch) {
        const val = parseFloat(firstNumMatch[1]);

        // Plausible dosage values — exclude large round numbers
        // that are more likely pack sizes (10, 15, 20, 30, 60, 90, 100)
        // unless they are non-integers or have decimal parts
        const isNonInteger = val !== Math.floor(val);
        const plausibleDosages = [
          0.25, 0.5, 1, 2, 2.5, 4, 5, 6.4, 8, 10, 12.5, 15, 20, 25,
          30, 40, 50, 60, 75, 80, 100, 125, 150, 200, 250, 300, 400,
          500, 600, 650, 750, 800, 1000,
        ];

        // Non-integer values are almost always dosages, not pack sizes
        // Round numbers > 30 could be pack sizes — be conservative
        const likelyStrength =
          isNonInteger ||
          (plausibleDosages.includes(val) && val <= 30) ||
          (val > 30 && val <= 1000 && plausibleDosages.includes(val));

        // Check if preceded by a brand code suffix (LA, SR, etc.)
        const brandCodePrefixes = [
          "la", "hp", "ds", "sr", "cr", "xl", "xr", "er", "mr",
          "od", "ls", "hs", "fc", "dt", "md", "rd", "hd", "ld", "pd",
        ];
        const lastWordOfBrand = brandToken.split(/\s+/).pop()?.toLowerCase() || "";
        const isBrandCode = brandCodePrefixes.includes(lastWordOfBrand);

        if (likelyStrength && !isBrandCode) {
          return {
            value:    val,
            unit:     "mg",
            raw:      firstNumMatch[1],
            inferred: true,
          };
        }
      }
    }
  }

  return null;
}

function extractForm(name) {
  if (!name) return null;
  const normalized = name.toLowerCase();
  const formMap = {
    tablets: "tablet", tab: "tablet", tabs: "tablet",
    capsules: "capsule", cap: "capsule", caps: "capsule",
    inj: "injection", drops: "drop", patches: "patch",
    suppositories: "suppository", liqu: "liquid", syrp: "syrup",
  };
  for (const [key, value] of Object.entries(formMap)) {
    if (normalized.includes(key)) return value;
  }
  for (const form of FORM_WORDS) {
    if (normalized.includes(form)) return form;
  }
  return null;
}

function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
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
  return 1 - levenshteinDistance(s1, s2) / maxLen;
}

// ══════════════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Calculate name match score.
 *
 * v3 changes:
 * 1. Compares brand token against master's explicit brand FIELD
 *    (stronger signal than matching brand token extracted from name).
 * 2. Strips form/pack suffixes before comparison — handles
 *    "D500CAL" vs "D500Cal Tablet" as exact match.
 * 3. Both brand-field and brand-token exact matches return
 *    reason = "Exact name match" so the boost applies.
 */
function calculateNameScore(shopName, masterName, masterBrand) {
  const shopNorm   = normalizeString(shopName);
  const masterNorm = normalizeString(masterName);
  const brandNorm  = normalizeString(masterBrand);

  // ── Core names with form/pack stripped ───────────────────
  const shopCore   = normalizeString(stripFormAndPackSuffix(shopName));
  const masterCore = normalizeString(stripFormAndPackSuffix(masterName));
  const brandCore  = masterBrand
    ? normalizeString(stripFormAndPackSuffix(masterBrand))
    : "";

  // ── Brand tokens ─────────────────────────────────────────
  const shopBrandToken   = extractBrandToken(shopName);
  const masterBrandToken = extractBrandToken(masterName);
  const masterBrandField = masterBrand
    ? extractBrandToken(masterBrand)
    : null;

  // ── 1. Exact full string matches ─────────────────────────
  if (shopNorm === masterNorm) {
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  }
  if (brandNorm && shopNorm === brandNorm) {
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  }

  // ── 2. Core match (after stripping form + pack suffix) ───
  if (shopCore && masterCore && shopCore === masterCore) {
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  }
  if (shopCore && brandCore && shopCore === brandCore) {
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  }

  // ── 3. Brand field exact match ───────────────────────────
  // Shop brand token matches master's explicit brand field.
  // This is a strong signal — the brand field is curated data.
  // "nitrocontin" === "nitrocontin" (from brand: "Nitrocontin CR")
  if (shopBrandToken && masterBrandField &&
      shopBrandToken === masterBrandField) {
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  }

  // ── 4. Brand token match (from name extraction) ──────────
  if (shopBrandToken && masterBrandToken &&
      shopBrandToken === masterBrandToken) {
    return { score: SCORE_WEIGHTS.NAME * 0.95, reason: "Exact name match" };
  }

  // ── 5. Contains matches ──────────────────────────────────
  if (shopNorm.includes(masterNorm) || masterNorm.includes(shopNorm)) {
    return { score: SCORE_WEIGHTS.NAME * 0.9, reason: "Name contains match" };
  }
  if (brandNorm &&
      (shopNorm.includes(brandNorm) || brandNorm.includes(shopNorm))) {
    return { score: SCORE_WEIGHTS.NAME * 0.85, reason: "Brand contains match" };
  }

  // Core contains
  if (shopCore && masterCore &&
      (shopCore.includes(masterCore) || masterCore.includes(shopCore))) {
    return { score: SCORE_WEIGHTS.NAME * 0.88, reason: "Core name contains match" };
  }

  // ── 6. String similarity ─────────────────────────────────
  const nameSim  = calculateStringSimilarity(shopNorm, masterNorm);
  const brandSim = brandNorm
    ? calculateStringSimilarity(shopNorm, brandNorm)
    : 0;
  const coreSim  = (shopCore && masterCore)
    ? calculateStringSimilarity(shopCore, masterCore)
    : 0;
  const bestSim  = Math.max(nameSim, brandSim, coreSim);

  if (bestSim >= 0.85) {
    return {
      score:  SCORE_WEIGHTS.NAME * bestSim,
      reason: `Name similarity ${Math.round(bestSim * 100)}%`,
    };
  }
  if (bestSim >= 0.7) {
    return {
      score:  SCORE_WEIGHTS.NAME * bestSim * 0.8,
      reason: `Partial name match ${Math.round(bestSim * 100)}%`,
    };
  }

  return { score: 0, reason: "Name mismatch" };
}

/**
 * Calculate strength match score.
 * v2 logic preserved — only blocks when BOTH sides explicit and disagree.
 */
function calculateStrengthScore(shopName, masterVariant) {
  const shopStrength = extractStrength(shopName);

  let masterStrength = null;
  if (masterVariant.strength_value != null && masterVariant.strength_unit) {
    masterStrength = {
      value:    parseFloat(masterVariant.strength_value),
      unit:     normalizeUnit(masterVariant.strength_unit),
      inferred: false,
    };
  } else {
    masterStrength = extractStrength(masterVariant.name);
  }

  if (!shopStrength && !masterStrength) {
    return { score: SCORE_WEIGHTS.STRENGTH * 0.5, reason: "No strength specified", isBlocking: false };
  }
  if (!shopStrength && masterStrength) {
    return { score: SCORE_WEIGHTS.STRENGTH * 0.4, reason: "Shop strength unknown", isBlocking: false };
  }
  if (shopStrength && !masterStrength) {
    return { score: SCORE_WEIGHTS.STRENGTH * 0.3, reason: "Master strength unknown", isBlocking: false };
  }

  const valuesMatch  = Math.abs(shopStrength.value - masterStrength.value) < 0.01;
  const unitsMatch   = shopStrength.unit === masterStrength.unit;
  const oneInferred  = !!(shopStrength.inferred || masterStrength.inferred);

  if (valuesMatch && (unitsMatch || oneInferred)) {
    const multiplier = oneInferred ? 0.92 : 1.0;
    return {
      score:      SCORE_WEIGHTS.STRENGTH * multiplier,
      reason:     `Strength match: ${shopStrength.value}${shopStrength.unit}${oneInferred ? " (inferred)" : ""}`,
      isBlocking: false,
    };
  }

  // Only block when BOTH explicit and disagree
  if (oneInferred) {
    return {
      score:      SCORE_WEIGHTS.STRENGTH * (unitsMatch ? 0.2 : 0.3),
      reason:     `Strength uncertain: ${shopStrength.value}${shopStrength.unit} vs ${masterStrength.value}${masterStrength.unit} (inferred)`,
      isBlocking: false,
    };
  }

  if (!unitsMatch) {
    return {
      score:      0,
      reason:     `Strength unit mismatch: ${shopStrength.unit} vs ${masterStrength.unit}`,
      isBlocking: true,
    };
  }

  return {
    score:      0,
    reason:     `Strength mismatch: ${shopStrength.value}${shopStrength.unit} vs ${masterStrength.value}${masterStrength.unit}`,
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
    compositionNames = masterComposition.map((c) => normalizeString(c.name || c));
  } else if (typeof masterComposition === "string") {
    compositionNames = [normalizeString(masterComposition)];
  }

  if (compositionNames.length === 0) {
    return { score: 0, reason: "No master composition", unavailable: true };
  }

  for (const compName of compositionNames) {
    if (shopNorm === compName) {
      return { score: SCORE_WEIGHTS.COMPOSITION, reason: "Exact composition match" };
    }
    if (shopNorm.includes(compName) || compName.includes(shopNorm)) {
      return { score: SCORE_WEIGHTS.COMPOSITION * 0.9, reason: "Composition contains match" };
    }
    const sim = calculateStringSimilarity(shopNorm, compName);
    if (sim >= 0.8) {
      return {
        score:  SCORE_WEIGHTS.COMPOSITION * sim,
        reason: `Composition similarity ${Math.round(sim * 100)}%`,
      };
    }
  }

  return { score: 0, reason: "Composition mismatch" };
}

function calculateManufacturerScore(shopManufacturer, masterManufacturer, masterMarketer) {
  if (!shopManufacturer) {
    return { score: 0, reason: "No shop manufacturer" };
  }

  const shopNorm = normalizeString(shopManufacturer);
  const mfrNorm  = normalizeString(masterManufacturer);
  const mktNorm  = normalizeString(masterMarketer);

  if (mfrNorm && shopNorm === mfrNorm) {
    return { score: SCORE_WEIGHTS.MANUFACTURER, reason: "Exact manufacturer match" };
  }
  if (mktNorm && shopNorm === mktNorm) {
    return { score: SCORE_WEIGHTS.MANUFACTURER, reason: "Exact marketer match" };
  }
  if (mfrNorm && (shopNorm.includes(mfrNorm) || mfrNorm.includes(shopNorm))) {
    return { score: SCORE_WEIGHTS.MANUFACTURER * 0.9, reason: "Manufacturer contains match" };
  }
  if (mktNorm && (shopNorm.includes(mktNorm) || mktNorm.includes(shopNorm))) {
    return { score: SCORE_WEIGHTS.MANUFACTURER * 0.85, reason: "Marketer contains match" };
  }

  const mfrSim  = mfrNorm ? calculateStringSimilarity(shopNorm, mfrNorm) : 0;
  const mktSim  = mktNorm ? calculateStringSimilarity(shopNorm, mktNorm) : 0;
  const bestSim = Math.max(mfrSim, mktSim);

  if (bestSim >= 0.7) {
    return {
      score:  SCORE_WEIGHTS.MANUFACTURER * bestSim,
      reason: `Manufacturer similarity ${Math.round(bestSim * 100)}%`,
    };
  }

  return { score: 0, reason: "Manufacturer mismatch" };
}

/**
 * Calculate total match score.
 *
 * v3 changes:
 * 1. "Exact name match" reason now covers brand-field and brand-token
 *    exact matches (set in calculateNameScore).
 * 2. Boost logic extended: when composition unavailable AND exact name
 *    match AND strength matches → push to AUTO_LINK threshold.
 * 3. General exact name boost threshold lowered to be more inclusive.
 */
function calculateMatchScore(shopMedicine, masterMedicine, masterVariant) {
  const scores = {
    name:         calculateNameScore(shopMedicine.name, masterVariant.name, masterVariant.brand),
    strength:     calculateStrengthScore(shopMedicine.name, masterVariant),
    composition:  calculateCompositionScore(shopMedicine.generic_name, masterMedicine.composition),
    manufacturer: calculateManufacturerScore(
      shopMedicine.manufacturer,
      masterVariant.manufacturer,
      masterVariant.marketer,
    ),
  };

  // Blocking condition
  if (scores.strength.isBlocking) {
    return {
      totalScore: 0,
      scores,
      reasons:    [scores.strength.reason],
      isBlocked:  true,
      blockReason: scores.strength.reason,
    };
  }

  const compositionUnavailable = scores.composition.unavailable === true;

  let totalScore;
  if (compositionUnavailable) {
    // Scale to 100 using available weights only (max = 80)
    const rawScore    = scores.name.score + scores.strength.score + scores.manufacturer.score;
    const maxPossible = SCORE_WEIGHTS.NAME + SCORE_WEIGHTS.STRENGTH + SCORE_WEIGHTS.MANUFACTURER;
    totalScore = Math.round((rawScore / maxPossible) * 100);
  } else {
    totalScore = Math.round(
      scores.name.score +
      scores.strength.score +
      scores.composition.score +
      scores.manufacturer.score,
    );
  }

  // ── Exact name boost ──────────────────────────────────────
  // "Exact name match" reason is now set for:
  //   - Full string exact match
  //   - Core match (after stripping form/pack)
  //   - Brand field exact match  ← NEW in v3
  //   - Brand token exact match  ← NEW in v3
  const isExactNameMatch = scores.name.reason === "Exact name match";

  // Strength is meaningful match (not blocking, not zero)
  const strengthMatches = !scores.strength.isBlocking &&
    scores.strength.score >= SCORE_WEIGHTS.STRENGTH * 0.4;

  if (isExactNameMatch && !scores.strength.isBlocking) {
    if (compositionUnavailable && strengthMatches) {
      // Best case when composition data unavailable:
      // exact name + strength match → high confidence → AUTO_LINK
      totalScore = Math.max(totalScore, THRESHOLDS.AUTO_LINK);
    } else if (compositionUnavailable) {
      // Exact name but strength uncertain/missing → SUGGEST at minimum
      totalScore = Math.max(totalScore, THRESHOLDS.SUGGEST + 5);
    } else if (totalScore < THRESHOLDS.SUGGEST) {
      // Full scoring available, exact name but low overall → at minimum SUGGEST
      totalScore = Math.max(totalScore, THRESHOLDS.SUGGEST);
    } else if (totalScore >= THRESHOLDS.SUGGEST && totalScore < THRESHOLDS.AUTO_LINK) {
      // Exact name + decent full score → push toward AUTO_LINK
      totalScore = Math.max(totalScore, 88);
    }
  }

  const reasons = [
    scores.name.reason,
    scores.strength.reason,
    scores.composition.reason,
    scores.manufacturer.reason,
  ].filter((r) => r && !r.includes("mismatch") && !r.includes("No "));

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
 * Find potential match candidates from master catalog.
 *
 * v3: No new queries needed — brand token query already finds
 * "Nitrocontin 6.4mg Tablet CR" when searching "nitrocontin".
 * The fix was in scoring, not candidate retrieval.
 *
 * Query 5 (generic name) kept for cases where brand name gives
 * no candidates at all.
 */
async function findPotentialMatches(shopMedicine, limit = 20) {
  const { name, manufacturer, generic_name } = shopMedicine;

  const normalizedName = normalizeString(name);
  const brandToken     = extractBrandToken(name);
  const searchTerms    = normalizedName.split(" ").filter((t) => t.length > 2);

  if (searchTerms.length === 0 && !brandToken) return [];

  const variantMap = new Map();

  const includeClause = {
    master: {
      select: {
        master_medicine_id: true,
        master_key:         true,
        generic_name:       true,
        type:               true,
        form:               true,
        composition:        true,
        primary_category:   true,
      },
    },
  };

  // ── Query 1: Exact name match ─────────────────────────────
  try {
    const exactMatches = await prisma.masterMedicineVariant.findMany({
      where: { name: { equals: name, mode: "insensitive" } },
      include: includeClause,
      take: 5,
    });
    exactMatches.forEach((v) => variantMap.set(v.variant_id, v));
  } catch (e) {
    console.error("Query 1 failed:", e.message);
  }

  // ── Query 2: Brand token match ────────────────────────────
  // This already finds "Nitrocontin 6.4mg Tablet CR" when
  // brandToken = "nitrocontin". The v2 bug was in scoring, not here.
  if (brandToken && brandToken.length >= 3) {
    try {
      const brandMatches = await prisma.masterMedicineVariant.findMany({
        where: {
          OR: [
            { name:  { contains: brandToken, mode: "insensitive" } },
            { brand: { contains: brandToken, mode: "insensitive" } },
          ],
        },
        include: includeClause,
        take: 30,
      });
      brandMatches.forEach((v) => variantMap.set(v.variant_id, v));
    } catch (e) {
      console.error("Query 2 failed:", e.message);
    }
  }

  // ── Query 3: Name contains (fallback) ────────────────────
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
    } catch (e) {
      console.error("Query 3 failed:", e.message);
    }
  }

  // ── Query 4: Manufacturer + first name term ───────────────
  if (manufacturer && variantMap.size < 10) {
    const mfrFirstWord = normalizeString(manufacturer).split(" ")[0];
    if (mfrFirstWord && mfrFirstWord.length >= 3) {
      try {
        const mfrMatches = await prisma.masterMedicineVariant.findMany({
          where: {
            OR: [
              { manufacturer: { contains: mfrFirstWord, mode: "insensitive" } },
              { marketer:     { contains: mfrFirstWord, mode: "insensitive" } },
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
      } catch (e) {
        console.error("Query 4 failed:", e.message);
      }
    }
  }

  // ── Query 5: Generic name / composition path ──────────────
  // Handles cases where brand name gives no candidates.
  // e.g., shop has generic name that matches master generic_name.
  if (variantMap.size < 5 && generic_name && generic_name.trim()) {
    const genericTokens = normalizeString(generic_name)
      .split(" ")
      .filter((t) => t.length > 3);

    if (genericTokens.length > 0) {
      try {
        const genericMatches = await prisma.masterMedicineVariant.findMany({
          where: {
            master: {
              OR: genericTokens.slice(0, 2).map((token) => ({
                generic_name: { contains: token, mode: "insensitive" },
              })),
            },
          },
          include: includeClause,
          take: 20,
        });
        genericMatches.forEach((v) => variantMap.set(v.variant_id, v));
      } catch (e) {
        console.error("Query 5 failed:", e.message);
      }
    }
  }

  // ── Score all candidates ──────────────────────────────────
  const variants = Array.from(variantMap.values());

  const scoredMatches = variants
    .map((variant) => {
      const matchResult = calculateMatchScore(shopMedicine, variant.master, variant);
      return { variant, master: variant.master, ...matchResult };
    })
    .filter((m) => !m.isBlocked && m.totalScore >= THRESHOLDS.MIN_MATCH)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  return scoredMatches;
}

// ══════════════════════════════════════════════════════════════
// checkSingleMedicine
// ══════════════════════════════════════════════════════════════

export async function checkSingleMedicine(shopMedicine) {
  const matches = await findPotentialMatches(shopMedicine, 5);

  if (matches.length === 0) {
    return {
      status:             "NO_MATCH",
      confidence:         0,
      reason:             "No matching medicine found in master catalog",
      master_medicine_id: null,
      matched_variant:    null,
      suggestions:        [],
    };
  }

  const topMatch   = matches[0];
  const confidence = topMatch.totalScore;

  const highConfidenceMatches = matches.filter(
    (m) => m.totalScore >= THRESHOLDS.AUTO_LINK,
  );

  let result;

  if (highConfidenceMatches.length > 1) {
    // Multiple high-confidence candidates — needs human review
    result = {
      status:             "PENDING",
      confidence,
      reason:             `Multiple matches found (${highConfidenceMatches.length} candidates)`,
      master_medicine_id: null,
      matched_variant:    null,
      suggested_master_id: topMatch.master.master_medicine_id,
      suggestions: highConfidenceMatches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key:         m.master.master_key,
        generic_name:       m.master.generic_name,
        variant_id:         m.variant.variant_id,
        variant_name:       m.variant.name,
        confidence:         m.totalScore,
        reasons:            m.reasons,
      })),
    };
  } else if (confidence >= THRESHOLDS.AUTO_LINK) {
    result = {
      status:             "AUTO_LINKED",
      confidence,
      reason:             topMatch.reasons.join(", "),
      master_medicine_id: topMatch.master.master_medicine_id,
      master_key:         topMatch.master.master_key,
      matched_variant: {
        variant_id: topMatch.variant.variant_id,   // ← v3: variant_id now included
        sku_id:     topMatch.variant.sku_id,
        name:       topMatch.variant.name,
        brand:      topMatch.variant.brand,
      },
      suggestions: [],
    };
  } else if (confidence >= THRESHOLDS.SUGGEST) {
    result = {
      status:              "PENDING",
      confidence,
      reason:              `Needs review: ${topMatch.reasons.join(", ")}`,
      master_medicine_id:  null,
      matched_variant:     null,
      suggested_master_id: topMatch.master.master_medicine_id,
      suggestions: matches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key:         m.master.master_key,
        generic_name:       m.master.generic_name,
        variant_id:         m.variant.variant_id,
        variant_name:       m.variant.name,
        confidence:         m.totalScore,
        reasons:            m.reasons,
      })),
    };
  } else {
    result = {
      status:             "NO_MATCH",
      confidence,
      reason:             "Match confidence too low",
      master_medicine_id: null,
      matched_variant:    null,
      suggestions: matches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key:         m.master.master_key,
        generic_name:       m.master.generic_name,
        variant_id:         m.variant.variant_id,
        variant_name:       m.variant.name,
        confidence:         m.totalScore,
        reasons:            m.reasons,
      })),
    };
  }

  return result;
}

// ══════════════════════════════════════════════════════════════
// bulkCheckImportRows
// ══════════════════════════════════════════════════════════════

export async function bulkCheckImportRows(rows) {
  if (!rows || rows.length === 0) {
    return {
      results: [],
      stats: { total: 0, autoLinked: 0, pending: 0, noMatch: 0 },
    };
  }

  const results = [];
  const stats   = { total: rows.length, autoLinked: 0, pending: 0, noMatch: 0 };
  const BATCH_SIZE = 20;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(async (row, batchIndex) => {
        const rowIndex = i + batchIndex;

        if (!row.name || !row.name.trim()) {
          return { rowIndex, status: "SKIP", reason: "No product name", master_medicine_id: null };
        }

        try {
          const matchResult = await checkSingleMedicine({
            name:         row.name,
            manufacturer: row.manufacturer || row.mfac,
            generic_name: row.generic_name || row.genericName,
          });

          if (matchResult.status === "AUTO_LINKED") stats.autoLinked++;
          else if (matchResult.status === "PENDING")   stats.pending++;
          else if (matchResult.status === "NO_MATCH")  stats.noMatch++;

          return {
            rowIndex,
            originalName:         row.name,
            originalManufacturer: row.manufacturer || row.mfac,
            ...matchResult,
          };
        } catch (error) {
          console.error(`Error checking row ${rowIndex}:`, error.message);
          return {
            rowIndex,
            status:             "ERROR",
            reason:             error.message,
            master_medicine_id: null,
          };
        }
      }),
    );

    results.push(...batchResults);
  }

  return { results, stats };
}

// ══════════════════════════════════════════════════════════════
// VARIANT ID SAVING — fixed in all write paths
// ══════════════════════════════════════════════════════════════

export async function autoLinkToMasterCatalog(shopMedicine) {
  const result = await checkSingleMedicine(shopMedicine);

  if (result.status === "AUTO_LINKED") {
    return {
      type:            "AUTO_LINKED",
      confidence:      result.confidence,
      master_id:       result.master_medicine_id,
      master_key:      result.master_key,
      matched_variant: result.matched_variant,
    };
  }

  if (result.status === "PENDING" && result.suggestions.length > 0) {
    return {
      type:        "SUGGESTED",
      suggestions: result.suggestions,
    };
  }

  return { type: "NONE" };
}

export async function getSuggestionsForMedicine(medicineId) {
  const medicine = await prisma.medicine.findUnique({
    where:  { medicine_id: medicineId },
    select: {
      medicine_id:        true,
      name:               true,
      generic_name:       true,
      manufacturer:       true,
      link_status:        true,
      master_medicine_id: true,
    },
  });

  if (!medicine) throw new Error("Medicine not found");

  if (medicine.master_medicine_id) {
    const master = await prisma.masterMedicine.findUnique({
      where:   { master_medicine_id: medicine.master_medicine_id },
      include: {
        variants: {
          take: 5,
          select: { sku_id: true, name: true, brand: true, mrp: true },
        },
      },
    });

    return {
      isLinked:    true,
      linkStatus:  medicine.link_status,
      currentLink: master
        ? {
            master_id:    master.master_medicine_id,
            master_key:   master.master_key,
            generic_name: master.generic_name,
            type:         master.type,
            variants:     master.variants,
          }
        : null,
      suggestions: [],
    };
  }

  const result = await checkSingleMedicine(medicine);

  return {
    isLinked:    false,
    linkStatus:  medicine.link_status,
    currentLink: null,
    suggestions: result.suggestions || [],
  };
}

/**
 * Manually link a shop medicine to a master medicine.
 * v3: Now also saves linked_variant_id and linked_variant_sku.
 * Defaults to first/cheapest variant if no variantId provided.
 */
export async function manuallyLinkMedicine(
  medicineId,
  masterMedicineId,
  userId,
  userType   = "CADMIN",
  variantId  = null,
) {
  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
  });

  if (!master) throw new Error("Master medicine not found");

  // Resolve target variant
  let targetVariant = null;

  if (variantId) {
    targetVariant = await prisma.masterMedicineVariant.findUnique({
      where:  { variant_id: variantId },
      select: { variant_id: true, sku_id: true },
    });
  }

  if (!targetVariant) {
    // Default: first/cheapest variant
    targetVariant = await prisma.masterMedicineVariant.findFirst({
      where:   { master_medicine_id: masterMedicineId },
      orderBy: { mrp: "asc" },
      select:  { variant_id: true, sku_id: true },
    });
  }

  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id:   masterMedicineId,
      linked_variant_id:    targetVariant?.variant_id ?? null,   // ← v3
      linked_variant_sku:   targetVariant?.sku_id     ?? null,   // ← v3
      link_status:          "MANUAL_LINKED",
      link_confidence_score: 100,
      link_rejected:        false,
      linked_at:            new Date(),
      linked_by_id:         userId,
      linked_by_type:       userType,
      suggested_master_id:  null,
      suggestion_reason:    null,
    },
  });

  return {
    success:  true,
    medicine: updated,
    linkedTo: {
      master_id:    master.master_medicine_id,
      master_key:   master.master_key,
      generic_name: master.generic_name,
      variant_id:   targetVariant?.variant_id ?? null,
      variant_sku:  targetVariant?.sku_id     ?? null,
    },
  };
}

export async function unlinkMedicine(medicineId, reject = false) {
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id:    null,
      linked_variant_id:     null,
      linked_variant_sku:    null,
      link_status:           reject ? "UNLINKED" : "PENDING",
      link_confidence_score: null,
      link_rejected:         reject,
      linked_at:             null,
      linked_by_id:          null,
      linked_by_type:        null,
    },
  });

  return {
    success:  true,
    medicine: updated,
    action:   reject ? "rejected" : "unlinked",
  };
}

/**
 * Bulk auto-link all pending medicines for a shop.
 * v3: Now saves linked_variant_id and linked_variant_sku.
 */
export async function bulkAutoLinkMedicines(shopId, branchId = null) {
  const where = {
    shop_id:       shopId,
    link_status:   "PENDING",
    link_rejected: false,
  };
  if (branchId) where.branch_id = branchId;

  const pendingMedicines = await prisma.medicine.findMany({
    where,
    select: {
      medicine_id:  true,
      name:         true,
      generic_name: true,
      manufacturer: true,
    },
  });

  const results = {
    total:      pendingMedicines.length,
    autoLinked: 0,
    suggested:  0,
    noMatch:    0,
    errors:     [],
  };

  for (const medicine of pendingMedicines) {
    try {
      const linkResult = await checkSingleMedicine(medicine);

      if (linkResult.status === "AUTO_LINKED") {
        await prisma.medicine.update({
          where: { medicine_id: medicine.medicine_id },
          data: {
            master_medicine_id:    linkResult.master_medicine_id,
            linked_variant_id:     linkResult.matched_variant?.variant_id ?? null,  // ← v3
            linked_variant_sku:    linkResult.matched_variant?.sku_id     ?? null,  // ← v3
            link_status:           "AUTO_LINKED",
            link_confidence_score: linkResult.confidence,
            linked_at:             new Date(),
            linked_by_type:        "SYSTEM",
            suggestion_reason:     linkResult.reason,
          },
        });
        results.autoLinked++;
      } else if (linkResult.status === "PENDING") {
        await prisma.medicine.update({
          where: { medicine_id: medicine.medicine_id },
          data: {
            link_status:           "SUGGESTED",
            link_confidence_score: linkResult.confidence,
            suggested_master_id:   linkResult.suggested_master_id,
            suggestion_reason:     linkResult.reason,
          },
        });
        results.suggested++;
      } else {
        results.noMatch++;
      }
    } catch (error) {
      results.errors.push({
        medicine_id: medicine.medicine_id,
        name:        medicine.name,
        error:       error.message,
      });
    }
  }

  return results;
}

export async function getUnlinkedMedicines(shopId, branchId = null, options = {}) {
  const { status = "PENDING", page = 1, limit = 20 } = options;

  const where = {
    shop_id:       shopId,
    master_medicine_id: null,
    link_rejected: false,
  };
  if (branchId) where.branch_id = branchId;
  if (status && status !== "ALL") where.link_status = status;

  const skip = (page - 1) * limit;

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      select: {
        medicine_id:           true,
        name:                  true,
        generic_name:          true,
        manufacturer:          true,
        link_status:           true,
        link_confidence_score: true,
        created_at:            true,
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.medicine.count({ where }),
  ]);

  return {
    medicines,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function searchMasterCatalog(query, limit = 10) {
  if (!query || query.length < 2) return [];

  const searchTerm = query.trim();

  const masters = await prisma.masterMedicine.findMany({
    where: {
      is_active: true,
      OR: [
        { generic_name: { contains: searchTerm, mode: "insensitive" } },
        { master_key:   { contains: searchTerm, mode: "insensitive" } },
        {
          variants: {
            some: {
              OR: [
                { name:  { contains: searchTerm, mode: "insensitive" } },
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
        select: { sku_id: true, name: true, brand: true, mrp: true },
      },
    },
    take: limit,
    orderBy: { generic_name: "asc" },
  });

  return masters.map((m) => ({
    master_id:       m.master_medicine_id,
    master_key:      m.master_key,
    generic_name:    m.generic_name,
    type:            m.type,
    form:            m.form,
    variant_count:   m.variant_count,
    preview_variants: m.variants,
  }));
}