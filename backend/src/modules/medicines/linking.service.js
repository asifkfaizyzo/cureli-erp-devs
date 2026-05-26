/**
 * ═══════════════════════════════════════════════════════════════
 * backend/src/modules/medicines/linking.service.js
 * ═══════════════════════════════════════════════════════════════
 *
 * Master Catalog Linking Service - v5
 *
 * v5 changes over v4:
 * 1. extractPackCount: parse numeric count from supplier/master pack size strings
 * 2. calculatePackScore: pack size match score used as tie-breaker
 * 3. calculateStrengthScore: explicit value mismatch (same unit) → score=0,
 *    isBlocking=false (was isBlocking=true). Unit mismatch still hard-blocks.
 * 4. checkSingleMedicine: three-stage variant tie-breaking
 *    Stage 1 — Strength proximity
 *    Stage 2 — Pack size match (new)
 *    Stage 3 — Name similarity (new)
 * 5. bulkCheckImportRows: passes pack_size through to checkSingleMedicine
 *
 * To enable logging locally:
 *   LINKING_DEBUG=true   in backend/.env
 */

import prisma from "../../config/prisma.js";
import { createListingForMedicine, handleMedicineUnlinked } from "../marketplace-listings/listings.service.js";

// ══════════════════════════════════════════════════════════════
// DEBUG LOGGER
// ══════════════════════════════════════════════════════════════

const DEBUG = process.env.LINKING_DEBUG === "true";

const log = {
  section(title) {
    if (!DEBUG) return;
    const now = new Date();
    const ts =
      now.toLocaleTimeString("en-IN", { hour12: false }) +
      "." +
      String(now.getMilliseconds()).padStart(3, "0");
    console.log(`\n${"═".repeat(60)}`);
    console.log(`  [${ts}] ${title}`);
    console.log("═".repeat(60));
  },

  step(label, value) {
    if (!DEBUG) return;
    if (value === undefined) {
      console.log(`  ▸ ${label}`);
    } else {
      console.log(
        `  ▸ ${label}:`,
        typeof value === "object" ? JSON.stringify(value, null, 2) : value,
      );
    }
  },

  ok(label, value) {
    if (!DEBUG) return;
    const val =
      value === undefined
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : value;
    console.log(`  ✓ ${label}${val ? ": " + val : ""}`);
  },

  warn(label, value) {
    if (!DEBUG) return;
    const val =
      value === undefined
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : value;
    console.log(`  ⚠ ${label}${val ? ": " + val : ""}`);
  },

  block(label, value) {
    if (!DEBUG) return;
    const val =
      value === undefined
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : value;
    console.log(`  ✗ ${label}${val ? ": " + val : ""}`);
  },

  candidate(index, variantName, brand, score, blocked, blockReason) {
    if (!DEBUG) return;
    const status = blocked ? `BLOCKED (${blockReason})` : `score=${score}`;
    console.log(
      `  [${index + 1}] ${variantName} | brand=${brand ?? "—"} | ${status}`,
    );
  },

  scoreRow(label, score, max, reason) {
    if (!DEBUG) return;
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    console.log(
      `      ${label.padEnd(16)} ${String(score.toFixed(1)).padStart(5)} / ${max}  (${pct}%)  → ${reason}`,
    );
  },

  result(status, confidence, reason, elapsedMs) {
    if (!DEBUG) return;
    const icon =
      status === "AUTO_LINKED"
        ? "🟢"
        : status === "PENDING"
          ? "🟡"
          : status === "NO_MATCH"
            ? "🔴"
            : "⚪";
    const timeStr = elapsedMs !== undefined ? `  ⏱ ${elapsedMs}ms` : "";
    console.log(
      `\n  ${icon} RESULT: ${status}  confidence=${confidence}  reason="${reason}"${timeStr}\n`,
    );
  },

  divider() {
    if (!DEBUG) return;
    console.log(`  ${"─".repeat(56)}`);
  },

  timing(label, ms) {
    if (!DEBUG) return;
    console.log(`  ⏱ ${label}: ${ms}ms`);
  },
};

// ══════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════

const THRESHOLDS = {
  AUTO_LINK: 92,
  SUGGEST: 75,
  MIN_MATCH: 65,
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

const FORM_WORDS = [
  "tablet",
  "tablets",
  "tab",
  "tabs",
  "capsule",
  "capsules",
  "cap",
  "caps",
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
  // Release modifiers
  "cr",
  "sr",
  "xl",
  "xr",
  "er",
  "mr",
  "od",
  "la",
  "ds",
  "forte",
];

function stripFormAndPackSuffix(name) {
  if (!name) return "";
  let result = name.trim();

  result = result.replace(/\s+\d+\s+tab['']?s?\s*$/i, "");
  result = result.replace(/\s+\d+\s+cap['']?s?\s*$/i, "");
  result = result.replace(/\s+\d+\s+['']?s\s*$/i, "");

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

function extractBrandToken(name) {
  if (!name) return null;
  const cleaned = name.replace(/-(\d)/g, " $1");
  const normalized = normalizeString(cleaned);
  const tokens = normalized.split(" ").filter((t) => {
    if (t.length < 2) return false;
    if (/^\d+(\.\d+)?$/.test(t)) return false;
    if (/^\d+\s*(mg|mcg|g|ml|%|iu)$/i.test(t)) return false;
    if (FORM_WORDS.includes(t)) return false;
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

function extractStrength(name) {
  if (!name) return null;
  const normalized = name.replace(/-(\d)/g, " $1");

  const explicitPatterns = [
    /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|l|iu|%|units?)/i,
    /(\d+(?:\.\d+)?)\s*(milligrams?|micrograms?|grams?|milliliters?|liters?)/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: normalizeUnit(match[2]),
        raw: match[0],
        inferred: false,
      };
    }
  }

  const brandToken = extractBrandToken(name);
  if (brandToken) {
    const normalizedLower = normalized.toLowerCase();
    const brandIdx = normalizedLower.indexOf(brandToken.toLowerCase());
    if (brandIdx !== -1) {
      const afterBrand = normalized.slice(brandIdx + brandToken.length);
      const firstNumMatch = afterBrand.match(/^\s*(\d+(?:\.\d+)?)/);
      if (firstNumMatch) {
        const val = parseFloat(firstNumMatch[1]);
        const isNonInteger = val !== Math.floor(val);
        const plausibleDosages = [
          0.25, 0.5, 1, 2, 2.5, 4, 5, 6.4, 8, 10, 12.5, 15, 20, 25, 30, 40, 50,
          60, 75, 80, 100, 125, 150, 200, 250, 300, 400, 500, 600, 650, 750,
          800, 1000,
        ];
        const likelyStrength =
          isNonInteger ||
          (plausibleDosages.includes(val) && val <= 30) ||
          (val > 30 && val <= 1000 && plausibleDosages.includes(val));
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
        const lastWordOfBrand =
          brandToken.split(/\s+/).pop()?.toLowerCase() || "";
        const isBrandCode = brandCodePrefixes.includes(lastWordOfBrand);
        if (likelyStrength && !isBrandCode) {
          return {
            value: val,
            unit: "mg",
            raw: firstNumMatch[1],
            inferred: true,
          };
        }
      }
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
      dp[i][j] =
        str1[i - 1] === str2[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
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
// PACK COUNT EXTRACTION
// ══════════════════════════════════════════════════════════════

/**
 * Extract the numeric tablet/capsule/unit count from a pack size string.
 *
 * Handles supplier formats:  "15'S"  "10'S"  "30 ' S"  "5X3ML"  "100 ML"
 * Handles master formats:    "15.0 tablets in 1 strip"  "10.0 tablets in 1 strip"
 *
 * Returns the leading number as an integer, or null if not parseable.
 *
 * "15'S"                       → 15
 * "10'S"                       → 10
 * "30 ' S"                     → 30
 * "15.0 tablets in 1 strip"    → 15
 * "100 ML"                     → 100  (volume — still useful for ML products)
 * "5X3ML"                      → 5    (first number = unit count)
 * ""                           → null
 */
function extractPackCount(packStr) {
  if (!packStr || !packStr.trim()) return null;

  // Normalize: remove apostrophes, extra spaces
  const cleaned = packStr.trim().replace(/[''']/g, "").replace(/\s+/g, " ");

  // Match leading number (integer or decimal)
  const match = cleaned.match(/^(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const val = parseFloat(match[1]);
  return isNaN(val) ? null : Math.round(val); // round 15.0 → 15
}

// ══════════════════════════════════════════════════════════════
// PACK SIZE SCORE
// ══════════════════════════════════════════════════════════════

/**
 * Calculate pack size match score.
 *
 * Used as a tie-breaker when multiple variants of the same master
 * score equally on name + strength. Does NOT affect the main
 * scoring pipeline — only used in checkSingleMedicine for
 * variant selection after candidates are already scored.
 *
 * Returns a value between 0 and 1:
 *   1.0 — exact numeric match
 *   0.5 — one side missing
 *   0.0 — numeric mismatch
 */
function calculatePackScore(shopPackSize, masterPackSize) {
  const shopCount = extractPackCount(shopPackSize);
  const masterCount = extractPackCount(masterPackSize);

  if (DEBUG) {
    console.log(
      `      pack: shop="${shopPackSize}" → ${shopCount}  master="${masterPackSize}" → ${masterCount}`,
    );
  }

  if (shopCount === null && masterCount === null) return 0.5;
  if (shopCount === null || masterCount === null) return 0.5;
  if (shopCount === masterCount) return 1.0;
  return 0.0;
}

// ══════════════════════════════════════════════════════════════
// NAME SIMPLICITY SCORE
// ══════════════════════════════════════════════════════════════

/**
 * Score how well a master variant name matches a supplier name
 * by full string similarity after normalization.
 *
 * Used as a secondary tie-breaker after pack score.
 * Prefers variants whose names are closest to the supplier name —
 * penalizes variants with extra qualifiers (Semi, XT, Plus, etc.)
 * that do not appear in the supplier name.
 *
 * Returns similarity score 0–1.
 */
function calculateNameSimilarityScore(shopName, masterVariantName) {
  const shopCore = normalizeString(stripFormAndPackSuffix(shopName));
  const masterCore = normalizeString(stripFormAndPackSuffix(masterVariantName));

  if (!shopCore || !masterCore) return 0;
  return calculateStringSimilarity(shopCore, masterCore);
}

// ══════════════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ══════════════════════════════════════════════════════════════

function calculateNameScore(shopName, masterName, masterBrand) {
  const shopNorm = normalizeString(shopName);
  const masterNorm = normalizeString(masterName);
  const brandNorm = normalizeString(masterBrand);
  const shopCore = normalizeString(stripFormAndPackSuffix(shopName));
  const masterCore = normalizeString(stripFormAndPackSuffix(masterName));
  const brandCore = masterBrand
    ? normalizeString(stripFormAndPackSuffix(masterBrand))
    : "";

  const shopBrandToken = extractBrandToken(shopName);
  const masterBrandToken = extractBrandToken(masterName);
  const masterBrandField = masterBrand ? extractBrandToken(masterBrand) : null;

  if (DEBUG) {
    console.log(
      `      name: shopNorm="${shopNorm}"  masterNorm="${masterNorm}"  brand="${brandNorm}"`,
    );
    console.log(
      `      core: shopCore="${shopCore}"  masterCore="${masterCore}"  brandCore="${brandCore}"`,
    );
    console.log(
      `      tokens: shop="${shopBrandToken}"  masterName="${masterBrandToken}"  masterBrandField="${masterBrandField}"`,
    );
  }

  if (shopNorm === masterNorm)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (brandNorm && shopNorm === brandNorm)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (shopCore && masterCore && shopCore === masterCore)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (shopCore && brandCore && shopCore === brandCore)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (shopBrandToken && masterBrandField && shopBrandToken === masterBrandField)
    return { score: SCORE_WEIGHTS.NAME, reason: "Exact name match" };
  if (shopBrandToken && masterBrandToken && shopBrandToken === masterBrandToken)
    return { score: SCORE_WEIGHTS.NAME * 0.95, reason: "Exact name match" };
  if (shopNorm.includes(masterNorm) || masterNorm.includes(shopNorm))
    return { score: SCORE_WEIGHTS.NAME * 0.9, reason: "Name contains match" };
  if (
    brandNorm &&
    (shopNorm.includes(brandNorm) || brandNorm.includes(shopNorm))
  )
    return { score: SCORE_WEIGHTS.NAME * 0.85, reason: "Brand contains match" };
  if (
    shopCore &&
    masterCore &&
    (shopCore.includes(masterCore) || masterCore.includes(shopCore))
  )
    return {
      score: SCORE_WEIGHTS.NAME * 0.88,
      reason: "Core name contains match",
    };

  const nameSim = calculateStringSimilarity(shopNorm, masterNorm);
  const brandSim = brandNorm
    ? calculateStringSimilarity(shopNorm, brandNorm)
    : 0;
  const coreSim =
    shopCore && masterCore
      ? calculateStringSimilarity(shopCore, masterCore)
      : 0;
  const bestSim = Math.max(nameSim, brandSim, coreSim);

  if (DEBUG) {
    console.log(
      `      similarity: name=${nameSim.toFixed(3)}  brand=${brandSim.toFixed(3)}  core=${coreSim.toFixed(3)}  best=${bestSim.toFixed(3)}`,
    );
  }

  if (bestSim >= 0.85)
    return {
      score: SCORE_WEIGHTS.NAME * bestSim,
      reason: `Name similarity ${Math.round(bestSim * 100)}%`,
    };
  if (bestSim >= 0.7)
    return {
      score: SCORE_WEIGHTS.NAME * bestSim * 0.8,
      reason: `Partial name match ${Math.round(bestSim * 100)}%`,
    };

  return { score: 0, reason: "Name mismatch" };
}

// ══════════════════════════════════════════════════════════════
// STRENGTH SCORE — v5
// ══════════════════════════════════════════════════════════════

/**
 * v5 change: removed hard-blocking when both strengths are explicit
 * and values disagree (same unit).
 *
 * Rationale: "DAFLON 500MG" has 500mg in the brand name (combined
 * total of Diosmin 450mg + Hesperidin 50mg). The master catalog
 * stores 450mg as the primary component strength. These refer to
 * the same product. Hard-blocking caused NO_MATCH — the worst
 * possible outcome.
 *
 * Fix: explicit value mismatch (same unit) → score=0, isBlocking=false.
 * Strong name match will still push the candidate to PENDING via
 * the exact-name boost in calculateMatchScore.
 * Weak name match will still score below MIN_MATCH and be filtered.
 *
 * Unit mismatch (mg vs mcg) remains HARD BLOCKING.
 * 1000x dosage difference is a genuine patient safety risk.
 */
function calculateStrengthScore(shopName, masterVariant) {
  const shopStrength = extractStrength(shopName);

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

  if (DEBUG) {
    console.log(
      `      strength: shop=${JSON.stringify(shopStrength)}  master=${JSON.stringify(masterStrength)}`,
    );
  }

  // ── Both sides missing ────────────────────────────────────
  if (!shopStrength && !masterStrength) {
    return {
      score: SCORE_WEIGHTS.STRENGTH * 0.5,
      reason: "No strength specified",
      isBlocking: false,
    };
  }

  // ── One side missing ──────────────────────────────────────
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

  // ── Both present ──────────────────────────────────────────
  const valuesMatch =
    Math.abs(shopStrength.value - masterStrength.value) < 0.01;
  const unitsMatch = shopStrength.unit === masterStrength.unit;
  const oneInferred = !!(shopStrength.inferred || masterStrength.inferred);

  // Values match
  if (valuesMatch && (unitsMatch || oneInferred)) {
    const multiplier = oneInferred ? 0.92 : 1.0;
    return {
      score: SCORE_WEIGHTS.STRENGTH * multiplier,
      reason: `Strength match: ${shopStrength.value}${shopStrength.unit}${
        oneInferred ? " (inferred)" : ""
      }`,
      isBlocking: false,
    };
  }

  // ── Values disagree ───────────────────────────────────────

  // CASE 1: Unit mismatch — HARD BLOCK preserved
  // mg vs mcg = 1000x dosage difference — patient safety risk.
  if (!unitsMatch) {
    return {
      score: 0,
      reason: `Strength unit mismatch: ${shopStrength.unit} vs ${masterStrength.unit}`,
      isBlocking: true,
    };
  }

  // CASE 2: One inferred, same unit, values differ
  if (oneInferred) {
    return {
      score: SCORE_WEIGHTS.STRENGTH * 0.3,
      reason: `Strength uncertain: ${shopStrength.value}${shopStrength.unit} vs ${
        masterStrength.value
      }${masterStrength.unit} (inferred)`,
      isBlocking: false,
    };
  }

  // CASE 3: Both explicit, same unit, values differ — v5: no longer blocking
  // Score=0 but isBlocking=false. Strong name match + exact-name boost
  // will push to PENDING. Weak name match stays below MIN_MATCH.
  return {
    score: 0,
    reason: `Strength mismatch: ${shopStrength.value}${shopStrength.unit} vs ${
      masterStrength.value
    }${masterStrength.unit}`,
    isBlocking: false,
  };
}

function calculateCompositionScore(shopGenericName, masterComposition) {
  if (!shopGenericName || !masterComposition)
    return { score: 0, reason: "No composition to compare", unavailable: true };

  const shopNorm = normalizeString(shopGenericName);
  let compositionNames = [];

  if (Array.isArray(masterComposition)) {
    compositionNames = masterComposition.map((c) =>
      normalizeString(c.name || c),
    );
  } else if (typeof masterComposition === "string") {
    compositionNames = [normalizeString(masterComposition)];
  }

  if (compositionNames.length === 0)
    return { score: 0, reason: "No master composition", unavailable: true };

  for (const compName of compositionNames) {
    if (shopNorm === compName)
      return {
        score: SCORE_WEIGHTS.COMPOSITION,
        reason: "Exact composition match",
      };
    if (shopNorm.includes(compName) || compName.includes(shopNorm))
      return {
        score: SCORE_WEIGHTS.COMPOSITION * 0.9,
        reason: "Composition contains match",
      };
    const sim = calculateStringSimilarity(shopNorm, compName);
    if (sim >= 0.8)
      return {
        score: SCORE_WEIGHTS.COMPOSITION * sim,
        reason: `Composition similarity ${Math.round(sim * 100)}%`,
      };
  }

  return { score: 0, reason: "Composition mismatch" };
}

function calculateManufacturerScore(
  shopManufacturer,
  masterManufacturer,
  masterMarketer,
) {
  if (!shopManufacturer) return { score: 0, reason: "No shop manufacturer" };

  const shopNorm = normalizeString(shopManufacturer);
  const mfrNorm = normalizeString(masterManufacturer);
  const mktNorm = normalizeString(masterMarketer);

  if (mfrNorm && shopNorm === mfrNorm)
    return {
      score: SCORE_WEIGHTS.MANUFACTURER,
      reason: "Exact manufacturer match",
    };
  if (mktNorm && shopNorm === mktNorm)
    return {
      score: SCORE_WEIGHTS.MANUFACTURER,
      reason: "Exact marketer match",
    };
  if (mfrNorm && (shopNorm.includes(mfrNorm) || mfrNorm.includes(shopNorm)))
    return {
      score: SCORE_WEIGHTS.MANUFACTURER * 0.9,
      reason: "Manufacturer contains match",
    };
  if (mktNorm && (shopNorm.includes(mktNorm) || mktNorm.includes(shopNorm)))
    return {
      score: SCORE_WEIGHTS.MANUFACTURER * 0.85,
      reason: "Marketer contains match",
    };

  const mfrSim = mfrNorm ? calculateStringSimilarity(shopNorm, mfrNorm) : 0;
  const mktSim = mktNorm ? calculateStringSimilarity(shopNorm, mktNorm) : 0;
  const bestSim = Math.max(mfrSim, mktSim);

  if (bestSim >= 0.7)
    return {
      score: SCORE_WEIGHTS.MANUFACTURER * bestSim,
      reason: `Manufacturer similarity ${Math.round(bestSim * 100)}%`,
    };

  return { score: 0, reason: "Manufacturer mismatch" };
}

function calculateMatchScore(shopMedicine, masterMedicine, masterVariant) {
  if (DEBUG) {
    log.divider();
    console.log(
      `    Variant: "${masterVariant.name}"  brand="${masterVariant.brand}"  strength=${masterVariant.strength_value}${masterVariant.strength_unit ?? ""}`,
    );
  }

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

  if (DEBUG) {
    log.scoreRow(
      "NAME",
      scores.name.score,
      SCORE_WEIGHTS.NAME,
      scores.name.reason,
    );
    log.scoreRow(
      "STRENGTH",
      scores.strength.score,
      SCORE_WEIGHTS.STRENGTH,
      scores.strength.reason,
    );
    log.scoreRow(
      "COMPOSITION",
      scores.composition.score,
      SCORE_WEIGHTS.COMPOSITION,
      scores.composition.reason,
    );
    log.scoreRow(
      "MANUFACTURER",
      scores.manufacturer.score,
      SCORE_WEIGHTS.MANUFACTURER,
      scores.manufacturer.reason,
    );
  }

  if (scores.strength.isBlocking) {
    if (DEBUG) log.block("BLOCKED", scores.strength.reason);
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
    const rawScore =
      scores.name.score + scores.strength.score + scores.manufacturer.score;
    const maxPossible =
      SCORE_WEIGHTS.NAME + SCORE_WEIGHTS.STRENGTH + SCORE_WEIGHTS.MANUFACTURER;
    totalScore = Math.round((rawScore / maxPossible) * 100);
    if (DEBUG)
      console.log(
        `      composition unavailable — scaled ${rawScore.toFixed(1)} / ${maxPossible} → ${totalScore}`,
      );
  } else {
    totalScore = Math.round(
      scores.name.score +
        scores.strength.score +
        scores.composition.score +
        scores.manufacturer.score,
    );
  }

  const isExactNameMatch = scores.name.reason === "Exact name match";
  const strengthMatches =
    !scores.strength.isBlocking &&
    scores.strength.score >= SCORE_WEIGHTS.STRENGTH * 0.4;

  if (isExactNameMatch && !scores.strength.isBlocking) {
    const before = totalScore;
    if (compositionUnavailable && strengthMatches) {
      totalScore = Math.max(totalScore, THRESHOLDS.AUTO_LINK);
    } else if (compositionUnavailable) {
      totalScore = Math.max(totalScore, THRESHOLDS.SUGGEST + 5);
    } else if (totalScore < THRESHOLDS.SUGGEST) {
      totalScore = Math.max(totalScore, THRESHOLDS.SUGGEST);
    } else if (
      totalScore >= THRESHOLDS.SUGGEST &&
      totalScore < THRESHOLDS.AUTO_LINK
    ) {
      totalScore = Math.max(totalScore, 88);
    }
    if (DEBUG && totalScore !== before) {
      console.log(`      exact-name boost: ${before} → ${totalScore}`);
    }
  }

  if (DEBUG)
    console.log(
      `      TOTAL SCORE: ${totalScore}  (MIN_MATCH=${THRESHOLDS.MIN_MATCH})`,
    );

  const reasons = [
    scores.name.reason,
    scores.strength.reason,
    scores.composition.reason,
    scores.manufacturer.reason,
  ].filter((r) => r && !r.includes("mismatch") && !r.includes("No "));

  return { totalScore, scores, reasons, isBlocked: false };
}

// ══════════════════════════════════════════════════════════════
// findPotentialMatches — v4
// ══════════════════════════════════════════════════════════════

async function findPotentialMatches(shopMedicine, limit = 20) {
  const { name, manufacturer, generic_name } = shopMedicine;

  if (!name || !name.trim()) return [];

  const brandToken = extractBrandToken(name);

  if (DEBUG) {
    log.section(`findPotentialMatches: "${name}"`);
    log.step("manufacturer", manufacturer ?? "—");
    log.step("generic_name", generic_name ?? "—");
    log.step("brandToken", brandToken ?? "— (none extracted)");
  }

  if (!brandToken && name.trim().length < 3) {
    if (DEBUG) log.warn("No brand token and name < 3 chars — returning empty");
    return [];
  }

  const variantMap = new Map();

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

  // ── Query 1: Brand token on variant name + brand ──────────
  if (brandToken && brandToken.length >= 4) {
    try {
      const brandMatches = await prisma.masterMedicineVariant.findMany({
        where: {
          OR: [
            { name: { contains: brandToken, mode: "insensitive" } },
            { brand: { contains: brandToken, mode: "insensitive" } },
          ],
        },
        include: includeClause,
        take: 40,
      });
      brandMatches.forEach((v) => variantMap.set(v.variant_id, v));
      if (DEBUG)
        log.ok(
          `Q1 brand token "${brandToken}"`,
          `${brandMatches.length} candidates`,
        );
    } catch (e) {
      console.error("findPotentialMatches Q1 failed:", e.message);
    }
  } else if (DEBUG) {
    log.warn(`Q1 skipped — brandToken "${brandToken}" length < 4`);
  }

  // ── Query 1b: Short brand token exact match ───────────────
  if (brandToken && brandToken.length >= 2 && brandToken.length < 4) {
    try {
      const shortMatches = await prisma.masterMedicineVariant.findMany({
        where: { brand: { equals: brandToken, mode: "insensitive" } },
        include: includeClause,
        take: 10,
      });
      shortMatches.forEach((v) => variantMap.set(v.variant_id, v));
      if (DEBUG)
        log.ok(
          `Q1b short brand exact "${brandToken}"`,
          `${shortMatches.length} candidates`,
        );
    } catch (e) {
      console.error("findPotentialMatches Q1b failed:", e.message);
    }
  }

  // ── Query 2: Exact name match ─────────────────────────────
  if (variantMap.size < 3) {
    try {
      const exactMatches = await prisma.masterMedicineVariant.findMany({
        where: { name: { equals: name.trim(), mode: "insensitive" } },
        include: includeClause,
        take: 5,
      });
      exactMatches.forEach((v) => variantMap.set(v.variant_id, v));
      if (DEBUG)
        log.ok(
          `Q2 exact name "${name.trim()}"`,
          `${exactMatches.length} candidates (map now ${variantMap.size})`,
        );
    } catch (e) {
      console.error("findPotentialMatches Q2 failed:", e.message);
    }
  } else if (DEBUG) {
    log.step(`Q2 skipped — already have ${variantMap.size} candidates`);
  }

  // ── Query 3: Generic name fallback ────────────────────────
  if (variantMap.size < 3 && generic_name && generic_name.trim().length > 3) {
    const genericTokens = normalizeString(generic_name)
      .split(" ")
      .filter((t) => t.length > 3)
      .slice(0, 2);

    if (genericTokens.length > 0) {
      try {
        const genericMatches = await prisma.masterMedicineVariant.findMany({
          where: {
            master: {
              OR: genericTokens.map((token) => ({
                generic_name: { contains: token, mode: "insensitive" },
              })),
            },
          },
          include: includeClause,
          take: 20,
        });
        genericMatches.forEach((v) => variantMap.set(v.variant_id, v));
        if (DEBUG)
          log.ok(
            `Q3 generic "${genericTokens.join(", ")}"`,
            `${genericMatches.length} candidates (map now ${variantMap.size})`,
          );
      } catch (e) {
        console.error("findPotentialMatches Q3 failed:", e.message);
      }
    }
  } else if (DEBUG && variantMap.size >= 3) {
    log.step(`Q3 skipped — already have ${variantMap.size} candidates`);
  }

  // ── Query 4: Brand token on master generic name ───────────
  if (variantMap.size < 2 && brandToken && brandToken.length >= 4) {
    try {
      const masterFallback = await prisma.masterMedicineVariant.findMany({
        where: {
          master: {
            generic_name: { contains: brandToken, mode: "insensitive" },
          },
        },
        include: includeClause,
        take: 15,
      });
      masterFallback.forEach((v) => variantMap.set(v.variant_id, v));
      if (DEBUG)
        log.ok(
          `Q4 master generic "${brandToken}"`,
          `${masterFallback.length} candidates (map now ${variantMap.size})`,
        );
    } catch (e) {
      console.error("findPotentialMatches Q4 failed:", e.message);
    }
  } else if (DEBUG) {
    log.step(`Q4 skipped — map size ${variantMap.size}`);
  }

  if (variantMap.size === 0) {
    if (DEBUG) log.warn("No candidates found from any query");
    return [];
  }

  if (DEBUG) {
    log.step(`Total candidates to score`, variantMap.size);
    console.log("\n  Scoring candidates:");
  }

  const variants = Array.from(variantMap.values());

  const scored = variants
    .map((variant) => {
      const matchResult = calculateMatchScore(
        shopMedicine,
        variant.master,
        variant,
      );
      return { variant, master: variant.master, ...matchResult };
    })
    .filter((m) => {
      if (m.isBlocked) {
        if (DEBUG)
          log.block(`  Filtered (blocked): "${m.variant.name}"`, m.blockReason);
        return false;
      }
      if (m.totalScore < THRESHOLDS.MIN_MATCH) {
        if (DEBUG)
          log.warn(
            `  Filtered (score ${m.totalScore} < ${THRESHOLDS.MIN_MATCH}): "${m.variant.name}"`,
          );
        return false;
      }
      return true;
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  if (DEBUG) {
    log.step(
      `After filtering and sorting`,
      `${scored.length} candidates passed`,
    );
    scored.forEach((m, i) => {
      log.candidate(
        i,
        m.variant.name,
        m.variant.brand,
        m.totalScore,
        false,
        null,
      );
    });
  }

  return scored;
}

// ══════════════════════════════════════════════════════════════
// checkSingleMedicine — v5
// ══════════════════════════════════════════════════════════════

/**
 * v5 changes over v4:
 *
 * 1. Accepts pack_size from the shop/supplier row.
 *    Used as a tie-breaker when multiple variants of the same
 *    master score equally.
 *
 * 2. Three-stage variant selection when same master has multiple
 *    high-confidence candidates:
 *    Stage 1 — Strength proximity (existing v4 logic)
 *    Stage 2 — Pack size match (new)
 *    Stage 3 — Name similarity to supplier name (new)
 *
 *    Each stage only runs if the previous stage produces a tie.
 *    The first stage that produces a unique winner stops.
 */
export async function checkSingleMedicine(shopMedicine) {
  const t0 = Date.now();

  if (DEBUG) {
    log.section(`checkSingleMedicine: "${shopMedicine.name}"`);
  }

  const tDb0 = Date.now();
  const matches = await findPotentialMatches(shopMedicine, 5);
  const tDb1 = Date.now();

  if (DEBUG) {
    log.timing("findPotentialMatches (DB + scoring)", tDb1 - tDb0);
  }

  if (matches.length === 0) {
    if (DEBUG)
      log.result(
        "NO_MATCH",
        0,
        "No candidates survived scoring",
        Date.now() - t0,
      );
    return {
      status: "NO_MATCH",
      confidence: 0,
      reason: "No matching medicine found in master catalog",
      master_medicine_id: null,
      matched_variant: null,
      suggestions: [],
    };
  }

  const topMatch = matches[0];
  const confidence = topMatch.totalScore;

  const highConfidenceMatches = matches.filter(
    (m) => m.totalScore >= THRESHOLDS.AUTO_LINK,
  );

  const uniqueMasterIds = new Set(
    highConfidenceMatches.map((m) => m.master.master_medicine_id),
  );
  const multipleDistinctMasters = uniqueMasterIds.size > 1;

  if (DEBUG) {
    log.step(
      "Top match",
      `"${topMatch.variant.name}"  confidence=${confidence}`,
    );
    log.step("High-confidence matches", highConfidenceMatches.length);
    log.step("Distinct masters in high-confidence", uniqueMasterIds.size);
  }

  let result;

  if (highConfidenceMatches.length > 1 && multipleDistinctMasters) {
    // Genuinely ambiguous — different drugs, all high confidence
    if (DEBUG)
      log.warn("Multiple DISTINCT masters ≥ AUTO_LINK threshold → PENDING");
    result = {
      status: "PENDING",
      confidence,
      reason: `Multiple distinct medicines match (${uniqueMasterIds.size} candidates)`,
      master_medicine_id: null,
      matched_variant: null,
      suggested_master_id: topMatch.master.master_medicine_id,
      suggestions: highConfidenceMatches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key: m.master.master_key,
        generic_name: m.master.generic_name,
        variant_id: m.variant.variant_id,
        variant_name: m.variant.name,
        confidence: m.totalScore,
        reasons: m.reasons,
      })),
    };
  } else if (confidence >= THRESHOLDS.AUTO_LINK) {
    // Same master — pick best variant using three-stage tie-breaking
    let bestMatch = topMatch;

    if (highConfidenceMatches.length > 1) {
      const shopPackSize = shopMedicine.pack_size || "";
      const shopName = shopMedicine.name;

      if (DEBUG) {
        log.step(
          "Tie-breaking among variants",
          `${highConfidenceMatches.length} candidates, shopPack="${shopPackSize}"`,
        );
      }

      // ── Stage 1: Strength proximity ───────────────────────
      const shopStrength = extractStrength(shopName);

      if (shopStrength) {
        const withDelta = highConfidenceMatches.map((m) => ({
          ...m,
          strengthDelta:
            m.variant.strength_value != null
              ? Math.abs(m.variant.strength_value - shopStrength.value)
              : Infinity,
        }));

        const minDelta = Math.min(...withDelta.map((m) => m.strengthDelta));
        const afterStrength = withDelta.filter(
          (m) => m.strengthDelta === minDelta,
        );

        if (afterStrength.length === 1) {
          bestMatch = afterStrength[0];
          if (DEBUG)
            log.ok(
              "Stage 1 (strength) resolved",
              `"${bestMatch.variant.name}"`,
            );
        } else {
          // Stage 1 tied — proceed to Stage 2
          if (DEBUG)
            log.step(
              "Stage 1 (strength) tied",
              `${afterStrength.length} still tied`,
            );

          // ── Stage 2: Pack size match ─────────────────────
          if (shopPackSize) {
            const withPackScore = afterStrength.map((m) => ({
              ...m,
              packScore: calculatePackScore(shopPackSize, m.variant.pack_size),
            }));

            const maxPackScore = Math.max(
              ...withPackScore.map((m) => m.packScore),
            );
            const afterPack = withPackScore.filter(
              (m) => m.packScore === maxPackScore,
            );

            if (afterPack.length === 1) {
              bestMatch = afterPack[0];
              if (DEBUG)
                log.ok(
                  "Stage 2 (pack) resolved",
                  `"${bestMatch.variant.name}"  packScore=${maxPackScore}`,
                );
            } else {
              // Stage 2 tied — proceed to Stage 3
              if (DEBUG)
                log.step(
                  "Stage 2 (pack) tied",
                  `${afterPack.length} still tied`,
                );

              // ── Stage 3: Name similarity ─────────────────
              const withNameSim = afterPack.map((m) => ({
                ...m,
                nameSim: calculateNameSimilarityScore(shopName, m.variant.name),
              }));

              withNameSim.sort((a, b) => b.nameSim - a.nameSim);
              bestMatch = withNameSim[0];

              if (DEBUG) {
                log.ok(
                  "Stage 3 (name similarity) resolved",
                  `"${bestMatch.variant.name}"  sim=${bestMatch.nameSim.toFixed(3)}`,
                );
              }
            }
          } else {
            // No pack size — go straight to Stage 3
            const withNameSim = afterStrength.map((m) => ({
              ...m,
              nameSim: calculateNameSimilarityScore(shopName, m.variant.name),
            }));
            withNameSim.sort((a, b) => b.nameSim - a.nameSim);
            bestMatch = withNameSim[0];

            if (DEBUG) {
              log.ok(
                "Stage 3 (name similarity, no pack) resolved",
                `"${bestMatch.variant.name}"  sim=${bestMatch.nameSim.toFixed(3)}`,
              );
            }
          }
        }
      } else {
        // No shop strength — go to Stage 2 directly
        if (shopPackSize) {
          const withPackScore = highConfidenceMatches.map((m) => ({
            ...m,
            packScore: calculatePackScore(shopPackSize, m.variant.pack_size),
          }));

          const maxPackScore = Math.max(
            ...withPackScore.map((m) => m.packScore),
          );
          const afterPack = withPackScore.filter(
            (m) => m.packScore === maxPackScore,
          );

          if (afterPack.length === 1) {
            bestMatch = afterPack[0];
            if (DEBUG)
              log.ok(
                "Stage 2 (pack, no strength) resolved",
                `"${bestMatch.variant.name}"`,
              );
          } else {
            // Stage 2 tied — Stage 3
            const withNameSim = afterPack.map((m) => ({
              ...m,
              nameSim: calculateNameSimilarityScore(shopName, m.variant.name),
            }));
            withNameSim.sort((a, b) => b.nameSim - a.nameSim);
            bestMatch = withNameSim[0];
            if (DEBUG)
              log.ok(
                "Stage 3 (name sim after pack) resolved",
                `"${bestMatch.variant.name}"`,
              );
          }
        } else {
          // No strength, no pack — Stage 3 only
          const withNameSim = highConfidenceMatches.map((m) => ({
            ...m,
            nameSim: calculateNameSimilarityScore(shopName, m.variant.name),
          }));
          withNameSim.sort((a, b) => b.nameSim - a.nameSim);
          bestMatch = withNameSim[0];
          if (DEBUG)
            log.ok(
              "Stage 3 (name sim only) resolved",
              `"${bestMatch.variant.name}"`,
            );
        }
      }
    }

    if (DEBUG)
      log.ok(
        "AUTO_LINKED",
        `"${bestMatch.variant.name}"  confidence=${bestMatch.totalScore}`,
      );

    result = {
      status: "AUTO_LINKED",
      confidence: bestMatch.totalScore,
      reason: bestMatch.reasons.join(", "),
      master_medicine_id: bestMatch.master.master_medicine_id,
      master_key: bestMatch.master.master_key,
      matched_variant: {
        variant_id: bestMatch.variant.variant_id,
        sku_id: bestMatch.variant.sku_id,
        name: bestMatch.variant.name,
        brand: bestMatch.variant.brand,
      },
      suggestions: [],
    };
  } else if (confidence >= THRESHOLDS.SUGGEST) {
    if (DEBUG)
      log.warn(
        `PENDING — confidence ${confidence} between SUGGEST(${THRESHOLDS.SUGGEST}) and AUTO_LINK(${THRESHOLDS.AUTO_LINK})`,
      );
    result = {
      status: "PENDING",
      confidence,
      reason: `Needs review: ${topMatch.reasons.join(", ")}`,
      master_medicine_id: null,
      matched_variant: null,
      suggested_master_id: topMatch.master.master_medicine_id,
      suggestions: matches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key: m.master.master_key,
        generic_name: m.master.generic_name,
        variant_id: m.variant.variant_id,
        variant_name: m.variant.name,
        confidence: m.totalScore,
        reasons: m.reasons,
      })),
    };
  } else {
    if (DEBUG)
      log.block(
        `NO_MATCH — top confidence ${confidence} < SUGGEST(${THRESHOLDS.SUGGEST})`,
      );
    result = {
      status: "NO_MATCH",
      confidence,
      reason: "Match confidence too low",
      master_medicine_id: null,
      matched_variant: null,
      suggestions: matches.slice(0, 3).map((m) => ({
        master_medicine_id: m.master.master_medicine_id,
        master_key: m.master.master_key,
        generic_name: m.master.generic_name,
        variant_id: m.variant.variant_id,
        variant_name: m.variant.name,
        confidence: m.totalScore,
        reasons: m.reasons,
      })),
    };
  }

  if (DEBUG)
    log.result(
      result.status,
      result.confidence,
      result.reason,
      Date.now() - t0,
    );
  return result;
}

// ══════════════════════════════════════════════════════════════
// bulkCheckImportRows — v5
// ══════════════════════════════════════════════════════════════

export async function bulkCheckImportRows(rows) {
  if (!rows || rows.length === 0) {
    return {
      results: [],
      stats: { total: 0, autoLinked: 0, pending: 0, noMatch: 0 },
    };
  }

  const results = [];
  const stats = { total: rows.length, autoLinked: 0, pending: 0, noMatch: 0 };

  const batchStart = Date.now();

  if (DEBUG) {
    console.log(`\n${"█".repeat(60)}`);
    console.log(`  BULK CHECK — ${rows.length} rows`);
    console.log(`${"█".repeat(60)}`);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowStart = Date.now();

    if (!row.name || !row.name.trim()) {
      results.push({
        rowIndex: i,
        status: "SKIP",
        reason: "No product name",
        master_medicine_id: null,
      });
      continue;
    }

    try {
      const matchResult = await checkSingleMedicine({
        name: row.name,
        manufacturer: row.manufacturer || row.mfac,
        generic_name: row.generic_name || row.genericName,
        pack_size: row.pack_size || row.packSize || "",
      });

      const rowMs = Date.now() - rowStart;

      if (matchResult.status === "AUTO_LINKED") stats.autoLinked++;
      else if (matchResult.status === "PENDING") stats.pending++;
      else if (matchResult.status === "NO_MATCH") stats.noMatch++;

      // Always log row summary regardless of DEBUG flag
      const icon =
        matchResult.status === "AUTO_LINKED"
          ? "🟢"
          : matchResult.status === "PENDING"
            ? "🟡"
            : matchResult.status === "NO_MATCH"
              ? "🔴"
              : "⚪";
      console.log(
        `  [${String(i + 1).padStart(3)}] ${icon} ${matchResult.status.padEnd(12)} ` +
          `${String(rowMs).padStart(5)}ms  "${row.name}"`,
      );

      results.push({
        rowIndex: i,
        originalName: row.name,
        originalManufacturer: row.manufacturer || row.mfac,
        ...matchResult,
      });
    } catch (error) {
      const rowMs = Date.now() - rowStart;
      console.error(
        `  [${String(i + 1).padStart(3)}] ⛔ ERROR  ${rowMs}ms  "${row.name}": ${error.message}`,
      );
      results.push({
        rowIndex: i,
        status: "ERROR",
        reason: error.message,
        master_medicine_id: null,
      });
    }
  }

  const totalMs = Date.now() - batchStart;
  const avgMs = rows.length > 0 ? Math.round(totalMs / rows.length) : 0;

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  BULK DONE — ${totalMs}ms total  avg ${avgMs}ms/row`);
  console.log(
    `  🟢 AUTO_LINKED: ${stats.autoLinked}  🟡 PENDING: ${stats.pending}  🔴 NO_MATCH: ${stats.noMatch}`,
  );
  console.log(`${"─".repeat(60)}\n`);

  return { results, stats };
}

// ══════════════════════════════════════════════════════════════
// REMAINING EXPORTS — unchanged from v3
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
    return { type: "SUGGESTED", suggestions: result.suggestions };
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
  if (!medicine) throw new Error("Medicine not found");

  if (medicine.master_medicine_id) {
    const master = await prisma.masterMedicine.findUnique({
      where: { master_medicine_id: medicine.master_medicine_id },
      include: {
        variants: {
          take: 5,
          select: { sku_id: true, name: true, brand: true, mrp: true },
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
  variantId = null,
) {
  const master = await prisma.masterMedicine.findUnique({
    where: { master_medicine_id: masterMedicineId },
  });
  if (!master) throw new Error("Master medicine not found");

  let targetVariant = null;
  if (variantId) {
    targetVariant = await prisma.masterMedicineVariant.findUnique({
      where: { variant_id: variantId },
      select: { variant_id: true, sku_id: true },
    });
  }
  if (!targetVariant) {
    targetVariant = await prisma.masterMedicineVariant.findFirst({
      where: { master_medicine_id: masterMedicineId },
      orderBy: { mrp: "asc" },
      select: { variant_id: true, sku_id: true },
    });
  }

  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: masterMedicineId,
      linked_variant_id: targetVariant?.variant_id ?? null,
      linked_variant_sku: targetVariant?.sku_id ?? null,
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

  // ── NEW: create marketplace listing ──────────────────────────
  if (targetVariant?.variant_id) {
    const med = await prisma.medicine.findUnique({
      where: { medicine_id: medicineId },
      select: { branch_id: true, shop_id: true },
    });
    if (med?.branch_id) {
      try {
        await createListingForMedicine(
          medicineId,
          med.branch_id,
          med.shop_id,
          targetVariant.variant_id
        );
      } catch (err) {
        console.warn(
          `[listings] Failed to create listing for medicine ${medicineId}:`,
          err.message
        );
      }
    }
  }
  // ─────────────────────────────────────────────────────────────

  return {
    success: true,
    medicine: updated,
    linkedTo: {
      master_id: master.master_medicine_id,
      master_key: master.master_key,
      generic_name: master.generic_name,
      variant_id: targetVariant?.variant_id ?? null,
      variant_sku: targetVariant?.sku_id ?? null,
    },
  };
}

export async function unlinkMedicine(medicineId, reject = false) {
  const updated = await prisma.medicine.update({
    where: { medicine_id: medicineId },
    data: {
      master_medicine_id: null,
      linked_variant_id: null,
      linked_variant_sku: null,
      link_status: reject ? "UNLINKED" : "PENDING",
      link_confidence_score: null,
      link_rejected: reject,
      linked_at: null,
      linked_by_id: null,
      linked_by_type: null,
    },
  });

  // ── NEW: hide marketplace listing ────────────────────────────
  const med = await prisma.medicine.findUnique({
    where: { medicine_id: medicineId },
    select: { branch_id: true },
  });
  if (med?.branch_id) {
    try {
      await handleMedicineUnlinked(medicineId, med.branch_id);
    } catch (err) {
      console.warn(
        `[listings] Failed to hide listing for unlinked medicine ${medicineId}:`,
        err.message
      );
    }
  }
  // ─────────────────────────────────────────────────────────────

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
  if (branchId) where.branch_id = branchId;

  const pendingMedicines = await prisma.medicine.findMany({
    where,
    select: {
      medicine_id: true,
      name: true,
      generic_name: true,
      manufacturer: true,
      branch_id: true, // ← ADD branch_id to select
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
            linked_variant_id: linkResult.matched_variant?.variant_id ?? null,
            linked_variant_sku: linkResult.matched_variant?.sku_id ?? null,
            link_status: "AUTO_LINKED",
            link_confidence_score: linkResult.confidence,
            linked_at: new Date(),
            linked_by_type: "SYSTEM",
            suggestion_reason: linkResult.reason,
          },
        });

        // ── NEW: create marketplace listing ──────────────────────
        if (linkResult.matched_variant?.variant_id && medicine.branch_id) {
          try {
            await createListingForMedicine(
              medicine.medicine_id,
              medicine.branch_id,
              shopId,
              linkResult.matched_variant.variant_id
            );
          } catch (err) {
            console.warn(
              `[listings] Failed to create listing for medicine ${medicine.medicine_id}:`,
              err.message
            );
          }
        }
        // ─────────────────────────────────────────────────────────

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
  if (branchId) where.branch_id = branchId;
  if (status && status !== "ALL") where.link_status = status;
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
        select: { sku_id: true, name: true, brand: true, mrp: true },
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
