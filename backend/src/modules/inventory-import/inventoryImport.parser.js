// src/modules/inventory-import/inventoryImport.parser.js

import * as XLSX from "xlsx";
import crypto from "crypto";
import path from "path";

// ══════════════════════════════════════════════════════════════════════════════
// COLUMN HEADER MAPPING
// ══════════════════════════════════════════════════════════════════════════════

const HEADER_MAP = {
  // ── Product name ──────────────────────────────────────────────────────────
  description:        "productName",
  product:            "productName",
  name:               "productName",
  itemname:           "productName",
  itemdescription:    "productName",
  particulars:        "productName",
  productname:        "productName",
  item:               "productName",
  productdesc:        "productName",
  desc:               "productName",
  medicinename:       "productName",
  drugname:           "productName",

  // ── Company / manufacturer ────────────────────────────────────────────────
  mfac:               "company",
  manufacturer:       "company",
  mfr:                "company",
  company:            "company",
  mfgcomp:            "company",
  mktgcomp:           "company",
  manfacturer:        "company",
  brand:              "company",
  mfgby:              "company",
  manufacturedby:     "company",
  marketedby:         "company",

  // ── Batch number ──────────────────────────────────────────────────────────
  batch:              "batchNumber",
  batchno:            "batchNumber",
  lot:                "batchNumber",
  lotno:              "batchNumber",
  batchnumber:        "batchNumber",
  batchcode:          "batchNumber",

  // ── Expiry ────────────────────────────────────────────────────────────────
  exp:                "expiryDate",
  expiry:             "expiryDate",
  expirydate:         "expiryDate",
  expdate:            "expiryDate",
  expirydt:           "expiryDate",
  expdt:              "expiryDate",
  expirymonth:        "expiryDate",

  // ── Quantity ──────────────────────────────────────────────────────────────
  qty:                "quantity",
  quantity:           "quantity",
  units:              "quantity",
  invqty:             "quantity",
  stockqty:           "quantity",
  currentstock:       "quantity",
  stock:              "quantity",
  closing:            "quantity",
  closingstock:       "quantity",
  balance:            "quantity",
  balanceqty:         "quantity",

  // ── Pack size ─────────────────────────────────────────────────────────────
  pack:               "packSize",
  packing:            "packSize",
  unit:               "packSize",
  packname:           "packSize",
  packsize:           "packSize",
  uom:                "packSize",
  unitofmeasure:      "packSize",

  // ── Expiry month/year (separate columns in some software) ─────────────────
  expmonth:           "_expMonth",
  expirymonth2:       "_expMonth",
  expyear:            "_expYear",
  expiryyear:         "_expYear",

  // ── Purchase rate ─────────────────────────────────────────────────────────
  price:              "purchaseRate",
  rate:               "purchaseRate",
  purchaserate:       "purchaseRate",
  ptr:                "purchaseRate",
  purrate:            "purchaseRate",
  prate:              "purchaseRate",
  costprice:          "purchaseRate",
  cp:                 "purchaseRate",
  buyprice:           "purchaseRate",

  // ── MRP ───────────────────────────────────────────────────────────────────
  mrp:                "mrp",
  itemmrp:            "mrp",
  maximumretailprice: "mrp",
  vatmrp:             "mrp",
  retailprice:        "mrp",

  // ── Selling rate ──────────────────────────────────────────────────────────
  srate:              "sellingRate",
  sellingrate:        "sellingRate",
  selrate:            "sellingRate",
  salerate:           "sellingRate",
  sp:                 "sellingRate",
  sellprice:          "sellingRate",
  sellingprice:       "sellingRate",

  // ── HSN code ──────────────────────────────────────────────────────────────
  hsn:                "hsnCode",
  hsnsac:             "hsnCode",
  hsncode:            "hsnCode",
  hsnsaccode:         "hsnCode",
  saccode:            "hsnCode",
  hsnno:              "hsnCode",

  // ── GST ───────────────────────────────────────────────────────────────────
  "gst%":             "gst",
  gst:                "gst",
  gstrate:            "gst",
  gstper:             "gst",
  "tax%":             "gst",
  taxrate:            "gst",
  taxper:             "gst",
  vatper:             "gst",

  // ── Rack ──────────────────────────────────────────────────────────────────
  rack:               "rack",
  location:           "rack",
  shelf:              "rack",
  rackno:             "rack",
  racklocation:       "rack",
  bin:                "rack",

  // ── Calculated / ignored fields ───────────────────────────────────────────
  amount:             "_amount",
  total:              "_amount",
  value:              "_amount",
  invamt:             "_amount",
  purchaseamount:     "_amount",
  margin:             "_margin",
  "margin%":          "_margin",
  marginpercent:      "_margin",
};

// ══════════════════════════════════════════════════════════════════════════════
// KNOWN SOFTWARE FINGERPRINTS
// ══════════════════════════════════════════════════════════════════════════════

const SOFTWARE_FINGERPRINTS = [
  {
    name:    "MargERP",
    markers: ["p.rate", "s.rate", "exp.dt", "pr. amt"],
  },
  {
    name:    "Busy",
    markers: ["godown", "alt. unit", "altunit", "altqty"],
  },
  {
    name:    "PharmaSoft",
    markers: ["selling rate", "purchase rate", "rack no"],
  },
  {
    name:    "Vyapar",
    markers: ["batch no.", "mfg date", "purchase price"],
  },
  {
    name:    "TallyPrime",
    markers: ["closing balance", "opening balance", "ledger"],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// SOFTWARE COLUMN PRESETS
// ══════════════════════════════════════════════════════════════════════════════

const SOFTWARE_COLUMN_PRESETS = {
  MargERP: {
    "Product Name": "productName",
    "Company":      "company",
    "Batch":        "batchNumber",
    "Exp.Dt":       "expiryDate",
    "Qty":          "quantity",
    "P.Rate":       "purchaseRate",
    "MRP":          "mrp",
    "S.Rate":       "sellingRate",
    "HSN Code":     "hsnCode",
    "Pack":         "packSize",
    "Rack":         "rack",
    "GST":          "gst",
  },
  Busy: {
    "Item Name":     "productName",
    "Company":       "company",
    "Batch No.":     "batchNumber",
    "Expiry Date":   "expiryDate",
    "Quantity":      "quantity",
    "Purchase Rate": "purchaseRate",
    "MRP":           "mrp",
    "Sale Rate":     "sellingRate",
    "HSN/SAC Code":  "hsnCode",
    "Pack Size":     "packSize",
    "Location":      "rack",
  },
  PharmaSoft: {
    "Product Name":  "productName",
    "Manufacturer":  "company",
    "Batch Number":  "batchNumber",
    "Expiry Date":   "expiryDate",
    "Quantity":      "quantity",
    "Purchase Rate": "purchaseRate",
    "MRP":           "mrp",
    "Selling Rate":  "sellingRate",
    "HSN Code":      "hsnCode",
    "Pack Size":     "packSize",
    "Rack No":       "rack",
  },
  Vyapar: {
    "Item":           "productName",
    "Brand":          "company",
    "Batch No.":      "batchNumber",
    "Expiry Date":    "expiryDate",
    "Qty":            "quantity",
    "Purchase Price": "purchaseRate",
    "MRP":            "mrp",
    "Sale Price":     "sellingRate",
    "HSN":            "hsnCode",
    "Unit":           "packSize",
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// STRING NORMALIZATION
// ══════════════════════════════════════════════════════════════════════════════

function normalizeHeader(h) {
  if (!h) return "";
  return String(h)
    .replace(/[\n\r\t]/g, " ")
    .replace(/\s+/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%_.]/g, "");
}

function normalizeString(str) {
  if (str === null || str === undefined) return "";
  return String(str).trim().replace(/\s+/g, " ");
}

export function normalizeMedicineName(name) {
  if (!name) return "";
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

// ══════════════════════════════════════════════════════════════════════════════
// NUMERIC PARSING
// ══════════════════════════════════════════════════════════════════════════════

function parseNumeric(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return isNaN(value) ? null : value;

  const cleaned = String(value)
    .replace(/[₹$,\s]/g, "")
    .replace(/%$/, "")
    .trim();

  if (cleaned === "" || cleaned === "-") return null;

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseQuantity(value) {
  const num = parseNumeric(value);
  if (num === null) return null;
  return Math.round(num);
}

// ══════════════════════════════════════════════════════════════════════════════
// DATE PARSING
// ══════════════════════════════════════════════════════════════════════════════

const MONTH_NAMES = {
  jan: 1,  feb: 2,  mar: 3,  apr: 4,  may: 5,  jun: 6,
  jul: 7,  aug: 8,  sep: 9,  oct: 10, nov: 11, dec: 12,
};

function lastDayOfMonth(year, month) {
  // month is 1-based. new Date(year, month, 0) gives the last day.
  return new Date(year, month, 0);
}

/**
 * Convert a 2-digit year to a full 4-digit year.
 * Always prefixes with 20 — pharmacy expiry dates are always future.
 * "27" → 2027, "34" → 2034, "00" → 2000
 */
function inferYear(twoDigitStr) {
  const n = parseInt(twoDigitStr, 10);
  if (isNaN(n)) return null;
  return 2000 + n;
}

/**
 * Parse an expiry date from any format used by Indian pharmacy software.
 *
 * Supported string formats (in evaluation order):
 *
 *   DD-MMM        "27-Nov"    → infer year from current date
 *   MM-YY         "02-35"     → last day of Feb 2035  ← NEW
 *   MMM-YY        "Feb-29"    → last day of Feb 2029
 *   MMM-YYYY      "Feb-2029"  → last day of Feb 2029
 *   MM/YY         "06/27"     → last day of Jun 2027
 *   MM/YYYY       "06/2027"   → last day of Jun 2027
 *   DD/MM/YYYY    "30/06/2027"→ Jun 30 2027
 *   YYYY-MM-DD    "2027-06-30"→ Jun 30 2027
 *   MMM YYYY      "Jun 2027"  → last day of Jun 2027
 *   YYYY-MM       "2027-06"   → last day of Jun 2027
 *
 * Non-string inputs:
 *   JS Date  → returned as-is (SheetJS cellDates: true path)
 *   number   → Excel serial date → last day of that month
 */
export function parseExpiryDate(value) {
  if (value === null || value === undefined || value === "") return null;

  // ── Already a JS Date (SheetJS cellDates: true) ───────────────────────────
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // ── Excel numeric serial date ─────────────────────────────────────────────
  if (typeof value === "number") {
    try {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) return lastDayOfMonth(parsed.y, parsed.m);
    } catch { /* fall through */ }
    return null;
  }

  const str = String(value).trim();
  if (!str || str === "-") return null;

  // ── DD-MMM  e.g. "27-Nov", "02-Feb", "1-Jan" ─────────────────────────────
  // Second part must be 3 alpha chars — no collision with MM-YY below.
  // No year present: infer from current date.
  // If the month has already passed this year → use next year.
  const ddMmmMatch = str.match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (ddMmmMatch) {
    const day      = parseInt(ddMmmMatch[1], 10);
    const monthNum = MONTH_NAMES[ddMmmMatch[2].toLowerCase()];
    if (!monthNum || day < 1 || day > 31) return null;

    const today        = new Date();
    const currentYear  = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-based

    let year = currentYear;
    if (monthNum < currentMonth) {
      year = currentYear + 1;
    } else if (monthNum === currentMonth && day < today.getDate()) {
      year = currentYear + 1;
    }

    const date = new Date(year, monthNum - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }

  // ── MM-YY  e.g. "02-35", "03-34", "12-33", "09-32", "08-26" ─────────────
  // 2-digit numeric month (01–12) + dash + 2-digit numeric year.
  // This is the format MargERP uses for expiry on cells that Excel stored
  // as text (typically far-future years like 2032–2040 that Excel didn't
  // auto-detect as dates). Near-future dates like "08-26" come through as
  // JS Date objects via SheetJS and never reach this code path.
  // Must be checked BEFORE MMM-YY (which requires alpha month chars).
  const mmYyDashMatch = str.match(/^(\d{1,2})-(\d{2})$/);
  if (mmYyDashMatch) {
    const month = parseInt(mmYyDashMatch[1], 10);
    const year  = inferYear(mmYyDashMatch[2]);
    if (month >= 1 && month <= 12 && year) {
      return lastDayOfMonth(year, month);
    }
    // Month out of range (e.g. "13-25") — fall through to remaining checks
  }

  // ── MMM-YY  e.g. "Feb-29", "Nov-27", "Jan-28" ────────────────────────────
  const mmmYyMatch = str.match(/^([A-Za-z]{3})-(\d{2})$/);
  if (mmmYyMatch) {
    const monthNum = MONTH_NAMES[mmmYyMatch[1].toLowerCase()];
    const year     = inferYear(mmmYyMatch[2]);
    if (!monthNum || !year) return null;
    return lastDayOfMonth(year, monthNum);
  }

  // ── MMM-YYYY  e.g. "Feb-2029", "Nov-2027" ────────────────────────────────
  const mmmYyyyMatch = str.match(/^([A-Za-z]{3})-(\d{4})$/);
  if (mmmYyyyMatch) {
    const monthNum = MONTH_NAMES[mmmYyyyMatch[1].toLowerCase()];
    const year     = parseInt(mmmYyyyMatch[2], 10);
    if (!monthNum || !year) return null;
    return lastDayOfMonth(year, monthNum);
  }

  // ── MM/YY  e.g. "06/27" ──────────────────────────────────────────────────
  if (/^\d{1,2}\/\d{2}$/.test(str)) {
    const [m, y] = str.split("/");
    const month  = parseInt(m, 10);
    const year   = inferYear(y);
    if (!month || month < 1 || month > 12 || !year) return null;
    return lastDayOfMonth(year, month);
  }

  // ── MM/YYYY  e.g. "06/2027" ───────────────────────────────────────────────
  if (/^\d{1,2}\/\d{4}$/.test(str)) {
    const [m, y] = str.split("/");
    const month  = parseInt(m, 10);
    const year   = parseInt(y, 10);
    if (month < 1 || month > 12) return null;
    return lastDayOfMonth(year, month);
  }

  // ── DD/MM/YYYY  e.g. "30/06/2027" ────────────────────────────────────────
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split("/");
    const day   = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year  = parseInt(parts[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return new Date(year, month - 1, day);
  }

  // ── YYYY-MM-DD  ISO format ────────────────────────────────────────────────
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
  }

  // ── MMM YYYY or MMM-YYYY (4-digit year) ───────────────────────────────────
  const monthYearMatch = str.match(/^([A-Za-z]{3})[-\s](\d{4})$/);
  if (monthYearMatch) {
    const monthNum = MONTH_NAMES[monthYearMatch[1].toLowerCase()];
    const year     = parseInt(monthYearMatch[2], 10);
    if (monthNum && year > 2000) return lastDayOfMonth(year, monthNum);
  }

  // ── YYYY-MM  e.g. "2027-06" ───────────────────────────────────────────────
  if (/^\d{4}-\d{2}$/.test(str)) {
    const [y, m] = str.split("-");
    const year   = parseInt(y, 10);
    const month  = parseInt(m, 10);
    if (month < 1 || month > 12) return null;
    return lastDayOfMonth(year, month);
  }

  // ── Last resort: native Date ──────────────────────────────────────────────
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// ══════════════════════════════════════════════════════════════════════════════
// HEADER DETECTION
// ══════════════════════════════════════════════════════════════════════════════

function detectHeaderRow(data) {
  let bestScore = 0;
  let bestIndex = 0;

  const scanLimit = Math.min(data.length, 15);

  for (let i = 0; i < scanLimit; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    let recognizedCount = 0;
    let nonEmptyCount   = 0;

    for (const cell of row) {
      const normalized = normalizeHeader(cell);
      if (!normalized) continue;
      nonEmptyCount++;
      if (HEADER_MAP[normalized]) recognizedCount++;
    }

    const score = recognizedCount * 10 + nonEmptyCount;

    if (score > bestScore && recognizedCount >= 2) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function mapHeaders(rawHeaders) {
  return rawHeaders.map((h) => {
    const normalized = normalizeHeader(h);
    return HEADER_MAP[normalized] || null;
  });
}

function applyPresetMapping(rawHeaders, detectedSoftware) {
  const preset = SOFTWARE_COLUMN_PRESETS[detectedSoftware];
  if (!preset) return null;

  const mapped = rawHeaders.map((h) => {
    const trimmed = String(h || "").trim();
    if (preset[trimmed]) return preset[trimmed];
    return HEADER_MAP[normalizeHeader(trimmed)] || null;
  });

  const mappedFields  = new Set(mapped.filter(Boolean));
  const requiredFound = REQUIRED_FIELDS.filter((f) => mappedFields.has(f)).length;
  if (requiredFound >= 3) return mapped;

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// SOFTWARE DETECTION
// ══════════════════════════════════════════════════════════════════════════════

function detectSoftware(rawHeaders) {
  const normalizedHeaders = rawHeaders.map((h) =>
    String(h || "").toLowerCase().trim()
  );

  for (const fingerprint of SOFTWARE_FINGERPRINTS) {
    const matchCount = fingerprint.markers.filter((marker) =>
      normalizedHeaders.some((h) => h.includes(marker))
    ).length;

    if (matchCount >= Math.ceil(fingerprint.markers.length / 2)) {
      return fingerprint.name;
    }
  }

  return "Unknown";
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTO-MAPPING CONFIDENCE
// ══════════════════════════════════════════════════════════════════════════════

const REQUIRED_FIELDS = [
  "productName",
  "batchNumber",
  "quantity",
  "expiryDate",
  "mrp",
];

const OPTIONAL_FIELDS = [
  "purchaseRate",
  "sellingRate",
  "company",
  "hsnCode",
  "gst",
  "rack",
  "packSize",
];

function assessMappingConfidence(mappedHeaders) {
  const mappedFields  = new Set(mappedHeaders.filter(Boolean));
  const requiredFound = REQUIRED_FIELDS.filter((f) => mappedFields.has(f)).length;

  if (requiredFound === REQUIRED_FIELDS.length) return "HIGH";
  if (requiredFound >= 3)                        return "MEDIUM";
  return "LOW";
}

// ══════════════════════════════════════════════════════════════════════════════
// ROW FILTERING
// ══════════════════════════════════════════════════════════════════════════════

const SUMMARY_ROW_PATTERNS = [
  /^total/i,
  /^grand\s+total/i,
  /^sub.?total/i,
  /^net\s+total/i,
  /^sr\.?\s*no\.?$/i,
  /^s\.?\s*no\.?$/i,
  /^summary/i,
  /^report/i,
];

const FOOTER_CONTENT_PATTERNS = [
  /taxable/i,
  /p\.rate\s+total/i,
  /m\.r\.p\s+total/i,
  /s\.rate\s+total/i,
  /grand\s+total/i,
];

function isDataRow(row, mappedHeaders) {
  const nonEmpty = row.filter(
    (c) => c !== null && c !== undefined && String(c).trim() !== ""
  );
  if (nonEmpty.length < 2) return false;

  const cellsToCheck = row.slice(0, 6);
  for (const cell of cellsToCheck) {
    const cellStr = String(cell || "").trim();
    if (SUMMARY_ROW_PATTERNS.some((p) => p.test(cellStr))) return false;
    if (FOOTER_CONTENT_PATTERNS.some((p) => p.test(cellStr))) return false;
  }

  const nameIdx = mappedHeaders.indexOf("productName");
  if (nameIdx !== -1) {
    const nameCell = String(row[nameIdx] || "").trim();
    if (!nameCell) return false;
    if (/^\d{1,5}$/.test(nameCell)) return false;
  }

  return true;
}

// ══════════════════════════════════════════════════════════════════════════════
// ROW PARSING
// ══════════════════════════════════════════════════════════════════════════════

function parseRow(rawValues, mappedHeaders, rowIndex) {
  const raw = {};
  mappedHeaders.forEach((key, i) => {
    if (key && rawValues[i] !== undefined && rawValues[i] !== null) {
      if (rawValues[i] instanceof Date) {
        raw[key] = rawValues[i];
      } else {
        raw[key] = String(rawValues[i]).trim();
      }
    }
  });

  // ── Expiry date ───────────────────────────────────────────────────────────
  let expiryDate = null;

  if (raw._expMonth && raw._expYear) {
    const month = parseInt(raw._expMonth, 10);
    let   year  = parseInt(raw._expYear,  10);
    if (year < 100) year = 2000 + year;
    if (month >= 1 && month <= 12 && year > 2000) {
      expiryDate = lastDayOfMonth(year, month);
    }
  } else if (raw.expiryDate !== undefined && raw.expiryDate !== null && raw.expiryDate !== "") {
    expiryDate = parseExpiryDate(raw.expiryDate);
  }

  // ── Numeric fields ────────────────────────────────────────────────────────
  const quantity     = parseQuantity(raw.quantity);
  const mrp          = parseNumeric(raw.mrp);
  const purchaseRate = parseNumeric(raw.purchaseRate);
  const sellingRate  = parseNumeric(raw.sellingRate);
  const gst          = parseNumeric(raw.gst);

  // ── String fields ─────────────────────────────────────────────────────────
  const productName = normalizeString(raw.productName || "");
  const batchNumber = normalizeString(raw.batchNumber || "").toUpperCase();
  const company     = normalizeString(raw.company     || "");
  const hsnCode     = normalizeString(raw.hsnCode     || "").replace(/\s/g, "");
  const rack        = normalizeString(raw.rack        || "");
  const packSize    = normalizeString(raw.packSize    || "");

  // Raw expiry string for display
  let rawExpiryStr = "";
  if (raw.expiryDate instanceof Date) {
    rawExpiryStr = raw.expiryDate.toLocaleDateString("en-IN");
  } else if (raw._expMonth && raw._expYear) {
    rawExpiryStr = `${raw._expMonth}/${raw._expYear}`;
  } else {
    rawExpiryStr = raw.expiryDate || "";
  }

  return {
    rowIndex,
    productName,
    batchNumber,
    quantity,
    expiryDate,
    mrp,
    purchaseRate,
    sellingRate,
    company,
    hsnCode,
    gst,
    rack,
    packSize,
    raw: {
      productName:  raw.productName  || "",
      batchNumber:  raw.batchNumber  || "",
      quantity:     raw.quantity     || "",
      expiryDate:   rawExpiryStr,
      mrp:          raw.mrp          || "",
      purchaseRate: raw.purchaseRate || "",
      sellingRate:  raw.sellingRate  || "",
      company:      raw.company      || "",
      hsnCode:      raw.hsnCode      || "",
      gst:          raw.gst          || "",
      rack:         raw.rack         || "",
      packSize:     raw.packSize     || "",
    },
    parseErrors: [],
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// FILE HASH
// ══════════════════════════════════════════════════════════════════════════════

export function computeFileHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PARSE FUNCTION
// ══════════════════════════════════════════════════════════════════════════════

export async function parseInventoryFile(buffer, filename, columnMapping = null) {
  const ext = path.extname(filename).toLowerCase();

  let data;

  if (ext === ".csv") {
    data = parseCSV(buffer);
  } else if (ext === ".xls" || ext === ".xlsx") {
    data = parseExcel(buffer);
  } else {
    throw new Error(
      `Unsupported file type "${ext}". Please upload .xls, .xlsx, or .csv files.`
    );
  }

  if (!data || data.length < 2) {
    throw new Error("File appears to be empty or contains only one row.");
  }

  const headerRowIndex = detectHeaderRow(data);
  const rawHeaders     = data[headerRowIndex].map((h) =>
    String(h || "").trim()
  );

  const detectedSoftware = detectSoftware(rawHeaders);

  let mappedHeaders;

  if (columnMapping) {
    const reverseMap = {};
    Object.entries(columnMapping).forEach(([canonicalKey, rawHeaderName]) => {
      reverseMap[rawHeaderName] = canonicalKey;
    });
    mappedHeaders = rawHeaders.map((h) => reverseMap[h] || null);
  } else {
    const presetMapped = applyPresetMapping(rawHeaders, detectedSoftware);
    mappedHeaders = presetMapped || mapHeaders(rawHeaders);
  }

  const autoMappingConfidence = columnMapping
    ? "HIGH"
    : assessMappingConfidence(mappedHeaders);
  const mappingNeeded = autoMappingConfidence === "LOW";

  const rows     = [];
  let   rowIndex = 0;

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const rawRow = data[i];

    while (rawRow.length < rawHeaders.length) rawRow.push("");

    if (!isDataRow(rawRow, mappedHeaders)) continue;

    const parsed = parseRow(rawRow, mappedHeaders, rowIndex);
    if (!parsed.productName) continue;

    rows.push(parsed);
    rowIndex++;
  }

  if (rows.length === 0) {
    throw new Error(
      "No valid product rows found in the file. " +
      "Please check that the file contains inventory data with product names."
    );
  }

  const unmappedHeaders = rawHeaders.filter((h, i) => h && !mappedHeaders[i]);

  return {
    rows,
    totalRows:             rows.length,
    detectedHeaders:       rawHeaders,
    mappedHeaders,
    detectedSoftware,
    autoMappingConfidence,
    mappingNeeded,
    unmappedHeaders,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// XLS / XLSX READER
// ══════════════════════════════════════════════════════════════════════════════

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, {
    type:        "buffer",
    cellDates:   true,
    cellFormula: false,
    cellNF:      false,
    cellStyles:  false,
    sheetStubs:  true,
    raw:         false,
  });

  const sheetName = workbook.SheetNames[0];
  const sheet     = workbook.Sheets[sheetName];

  if (!sheet || !sheet["!ref"]) {
    throw new Error("Excel file appears to be empty.");
  }

  const data = XLSX.utils.sheet_to_json(sheet, {
    header:    1,
    defval:    "",
    blankrows: false,
    raw:       false,
  });

  return data.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => {
      if (cell === null || cell === undefined) return "";
      if (cell instanceof Date) return cell;
      return String(cell).trim();
    })
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CSV READER
// ══════════════════════════════════════════════════════════════════════════════

function parseCSV(buffer) {
  const content = buffer.toString("utf-8");
  const lines   = content.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length === 0) throw new Error("CSV file is empty.");

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  return lines.map((line) => splitCSVLine(line, delimiter));
}

function splitCSVLine(line, delimiter) {
  const result  = [];
  let   current = "";
  let   inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === delimiter && !inQuote) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// DEDUPLICATION UTILITY
// ══════════════════════════════════════════════════════════════════════════════

export function deduplicateMedicines(rows) {
  const map = new Map();

  for (const row of rows) {
    const key = buildMedicineKey(row.productName, row.company);

    if (map.has(key)) {
      const existing = map.get(key);
      existing.rowIndices.push(row.rowIndex);
      existing.rowCount++;
      if (!existing.hsnCode  && row.hsnCode)  existing.hsnCode  = row.hsnCode;
      if (!existing.packSize && row.packSize)  existing.packSize = row.packSize;
      if (existing.gst === null && row.gst !== null) existing.gst = row.gst;
    } else {
      map.set(key, {
        key,
        name:       row.productName,
        company:    row.company,
        hsnCode:    row.hsnCode  || "",
        packSize:   row.packSize || "",
        gst:        row.gst,
        rowIndices: [row.rowIndex],
        rowCount:   1,
      });
    }
  }

  return map;
}

export function buildMedicineKey(name, company) {
  const n = normalizeMedicineName(name);
  const c = normalizeMedicineName(company || "");
  return `${n}|${c}`;
}