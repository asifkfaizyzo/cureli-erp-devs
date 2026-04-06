// cadmin/src/pages/MasterMedicines/mockMasterMedicineDataV3.js

/**
 * ══════════════════════════════════════════════════════════════
 * MOCK DATA V3 FOR MASTER MEDICINES
 * Extended with image status, linked medicines, and galleries
 * ══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// IMAGE STATUS TYPES
// ═══════════════════════════════════════════════════════════════
export const IMAGE_STATUS = {
  VERIFIED: "VERIFIED",   // Uploaded by Cureli team
  RAW: "RAW",             // From scraping (temporary)
  NONE: "NONE",           // No image (placeholder)
};

// ═══════════════════════════════════════════════════════════════
// MASTER MEDICINES - Complete catalog with linked medicines
// ═══════════════════════════════════════════════════════════════
export const MOCK_MASTER_MEDICINES = [
  // ─────────────────────────────────────────────────────────
  // VERIFIED IMAGE MEDICINES (8)
  // ─────────────────────────────────────────────────────────
  {
    id: "mm-001",
    name: "Paracetamol 500mg Tablet",
    normalizedName: "paracetamol 500mg tablet",
    composition: "Paracetamol (500mg)",
    type: "DRUG",
    manufacturer: "Cipla Ltd",
    marketer: "Cipla Ltd",
    packSize: "10 tablets in 1 strip",
    prescriptionRequired: false,
    isActive: true,
    imageStatus: IMAGE_STATUS.VERIFIED,
    images: [
      { id: "img-001-1", url: "/mock/paracetamol_1.jpg", isPrimary: true, status: "VERIFIED", uploadedAt: "2024-03-10", uploadedBy: "Admin User" },
      { id: "img-001-2", url: "/mock/paracetamol_2.jpg", isPrimary: false, status: "VERIFIED", uploadedAt: "2024-03-10", uploadedBy: "Admin User" },
      { id: "img-001-3", url: "/mock/paracetamol_3.jpg", isPrimary: false, status: "DEPRECATED", uploadedAt: "2024-03-01", uploadedBy: "Scraper" },
    ],
    linkedMedicines: [
      { id: "lm-001", originalName: "PCM 500 TAB", normalizedName: "pcm 500 tab", shopId: "shop-001", shopName: "City Pharmacy", occurrenceCount: 47, linkedAt: "2024-03-15T10:30:00Z", linkedBy: "Admin User" },
      { id: "lm-002", originalName: "Paracetamol 500", normalizedName: "paracetamol 500", shopId: "shop-002", shopName: "MedPlus", occurrenceCount: 23, linkedAt: "2024-03-14T09:00:00Z", linkedBy: "Admin User" },
      { id: "lm-003", originalName: "PCM500", normalizedName: "pcm500", shopId: "shop-003", shopName: "Apollo Pharmacy", occurrenceCount: 15, linkedAt: "2024-03-13T14:20:00Z", linkedBy: "System" },
      { id: "lm-004", originalName: "P.C.M. 500mg", normalizedName: "pcm 500mg", shopId: "shop-004", shopName: "Wellness Pharma", occurrenceCount: 8, linkedAt: "2024-03-12T11:45:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-15T10:30:00Z",
  },
  {
    id: "mm-002",
    name: "Amoxicillin 500mg Capsule",
    normalizedName: "amoxicillin 500mg capsule",
    composition: "Amoxicillin (500mg)",
    type: "DRUG",
    manufacturer: "Sun Pharma",
    marketer: "Sun Pharmaceutical Industries",
    packSize: "15 capsules in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.VERIFIED,
    images: [
      { id: "img-002-1", url: "/mock/amoxicillin_1.jpg", isPrimary: true, status: "VERIFIED", uploadedAt: "2024-03-08", uploadedBy: "Admin User" },
    ],
    linkedMedicines: [
      { id: "lm-005", originalName: "AMOX 500 CAP", normalizedName: "amox 500 cap", shopId: "shop-001", shopName: "City Pharmacy", occurrenceCount: 32, linkedAt: "2024-03-14T09:00:00Z", linkedBy: "Admin User" },
      { id: "lm-006", originalName: "Amox-500", normalizedName: "amox 500", shopId: "shop-005", shopName: "LifeCare Medical", occurrenceCount: 18, linkedAt: "2024-03-13T15:30:00Z", linkedBy: "System" },
    ],
    createdAt: "2024-03-02T09:00:00Z",
    updatedAt: "2024-03-14T09:00:00Z",
  },
  {
    id: "mm-003",
    name: "Dolo 650 Tablet",
    normalizedName: "dolo 650 tablet",
    composition: "Paracetamol (650mg)",
    type: "OTC",
    manufacturer: "Micro Labs",
    marketer: "Micro Labs Limited",
    packSize: "15 tablets in 1 strip",
    prescriptionRequired: false,
    isActive: true,
    imageStatus: IMAGE_STATUS.VERIFIED,
    images: [
      { id: "img-003-1", url: "/mock/dolo_1.jpg", isPrimary: true, status: "VERIFIED", uploadedAt: "2024-03-05", uploadedBy: "Admin User" },
      { id: "img-003-2", url: "/mock/dolo_2.jpg", isPrimary: false, status: "VERIFIED", uploadedAt: "2024-03-05", uploadedBy: "Admin User" },
    ],
    linkedMedicines: [
      { id: "lm-007", originalName: "Dolo 650", normalizedName: "dolo 650", shopId: "shop-002", shopName: "MedPlus", occurrenceCount: 89, linkedAt: "2024-03-10T08:00:00Z", linkedBy: "Admin User" },
      { id: "lm-008", originalName: "DOLO-650 TAB", normalizedName: "dolo 650 tab", shopId: "shop-003", shopName: "Apollo Pharmacy", occurrenceCount: 56, linkedAt: "2024-03-09T11:20:00Z", linkedBy: "System" },
      { id: "lm-009", originalName: "Dolo650", normalizedName: "dolo650", shopId: "shop-006", shopName: "Health First", occurrenceCount: 34, linkedAt: "2024-03-08T14:45:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-03-03T11:30:00Z",
    updatedAt: "2024-03-10T08:00:00Z",
  },
  {
    id: "mm-004",
    name: "Vitamin D3 60000 IU Capsule",
    normalizedName: "vitamin d3 60000 iu capsule",
    composition: "Cholecalciferol (60000 IU)",
    type: "OTC",
    manufacturer: "Abbott Healthcare",
    marketer: "Abbott India Ltd",
    packSize: "4 capsules in 1 strip",
    prescriptionRequired: false,
    isActive: true,
    imageStatus: IMAGE_STATUS.VERIFIED,
    images: [
      { id: "img-004-1", url: "/mock/vitamind3_1.jpg", isPrimary: true, status: "VERIFIED", uploadedAt: "2024-03-04", uploadedBy: "Admin User" },
    ],
    linkedMedicines: [
      { id: "lm-010", originalName: "Vit D3 60K", normalizedName: "vit d3 60k", shopId: "shop-004", shopName: "Wellness Pharma", occurrenceCount: 41, linkedAt: "2024-03-11T16:30:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-03-04T10:00:00Z",
    updatedAt: "2024-03-11T16:30:00Z",
  },
  {
    id: "mm-005",
    name: "Azithromycin 500mg Tablet",
    normalizedName: "azithromycin 500mg tablet",
    composition: "Azithromycin (500mg)",
    type: "DRUG",
    manufacturer: "Alkem Laboratories",
    marketer: "Alkem Laboratories Ltd",
    packSize: "3 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.VERIFIED,
    images: [
      { id: "img-005-1", url: "/mock/azithromycin_1.jpg", isPrimary: true, status: "VERIFIED", uploadedAt: "2024-03-06", uploadedBy: "Admin User" },
      { id: "img-005-2", url: "/mock/azithromycin_2.jpg", isPrimary: false, status: "VERIFIED", uploadedAt: "2024-03-06", uploadedBy: "Admin User" },
      { id: "img-005-3", url: "/mock/azithromycin_3.jpg", isPrimary: false, status: "VERIFIED", uploadedAt: "2024-03-06", uploadedBy: "Admin User" },
    ],
    linkedMedicines: [
      { id: "lm-011", originalName: "AZEE 500", normalizedName: "azee 500", shopId: "shop-001", shopName: "City Pharmacy", occurrenceCount: 28, linkedAt: "2024-03-09T13:00:00Z", linkedBy: "Admin User" },
      { id: "lm-012", originalName: "Azithral 500", normalizedName: "azithral 500", shopId: "shop-007", shopName: "Care Chemist", occurrenceCount: 19, linkedAt: "2024-03-08T10:15:00Z", linkedBy: "System" },
    ],
    createdAt: "2024-03-05T14:00:00Z",
    updatedAt: "2024-03-09T13:00:00Z",
  },
  {
    id: "mm-006",
    name: "Crocin Advance 500mg Tablet",
    normalizedName: "crocin advance 500mg tablet",
    composition: "Paracetamol (500mg)",
    type: "OTC",
    manufacturer: "GlaxoSmithKline",
    marketer: "GSK Consumer Healthcare",
    packSize: "15 tablets in 1 strip",
    prescriptionRequired: false,
    isActive: true,
    imageStatus: IMAGE_STATUS.VERIFIED,
    images: [
      { id: "img-006-1", url: "/mock/crocin_1.jpg", isPrimary: true, status: "VERIFIED", uploadedAt: "2024-03-07", uploadedBy: "Admin User" },
    ],
    linkedMedicines: [
      { id: "lm-013", originalName: "Crocin 500", normalizedName: "crocin 500", shopId: "shop-002", shopName: "MedPlus", occurrenceCount: 67, linkedAt: "2024-03-08T08:00:00Z", linkedBy: "Admin User" },
      { id: "lm-014", originalName: "CROCIN ADV", normalizedName: "crocin adv", shopId: "shop-008", shopName: "Netmeds Store", occurrenceCount: 45, linkedAt: "2024-03-07T12:30:00Z", linkedBy: "System" },
    ],
    createdAt: "2024-03-06T09:00:00Z",
    updatedAt: "2024-03-08T08:00:00Z",
  },
  {
    id: "mm-007",
    name: "Ibuprofen 400mg Tablet",
    normalizedName: "ibuprofen 400mg tablet",
    composition: "Ibuprofen (400mg)",
    type: "OTC",
    manufacturer: "GlaxoSmithKline",
    marketer: "GSK Consumer Healthcare",
    packSize: "10 tablets in 1 strip",
    prescriptionRequired: false,
    isActive: true,
    imageStatus: IMAGE_STATUS.VERIFIED,
    images: [
      { id: "img-007-1", url: "/mock/ibuprofen_1.jpg", isPrimary: true, status: "VERIFIED", uploadedAt: "2024-03-08", uploadedBy: "Admin User" },
      { id: "img-007-2", url: "/mock/ibuprofen_2.jpg", isPrimary: false, status: "VERIFIED", uploadedAt: "2024-03-08", uploadedBy: "Admin User" },
    ],
    linkedMedicines: [
      { id: "lm-015", originalName: "Brufen 400", normalizedName: "brufen 400", shopId: "shop-003", shopName: "Apollo Pharmacy", occurrenceCount: 38, linkedAt: "2024-03-06T09:45:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-03-07T10:00:00Z",
    updatedAt: "2024-03-08T09:45:00Z",
  },
  {
    id: "mm-008",
    name: "Calcium + Vitamin D3 Tablet",
    normalizedName: "calcium vitamin d3 tablet",
    composition: "Calcium Carbonate (500mg) + Vitamin D3 (250 IU)",
    type: "OTC",
    manufacturer: "Pfizer Ltd",
    marketer: "Pfizer Limited",
    packSize: "15 tablets in 1 strip",
    prescriptionRequired: false,
    isActive: true,
    imageStatus: IMAGE_STATUS.VERIFIED,
    images: [
      { id: "img-008-1", url: "/mock/calcium_1.jpg", isPrimary: true, status: "VERIFIED", uploadedAt: "2024-03-09", uploadedBy: "Admin User" },
    ],
    linkedMedicines: [
      { id: "lm-016", originalName: "Shelcal 500", normalizedName: "shelcal 500", shopId: "shop-005", shopName: "LifeCare Medical", occurrenceCount: 52, linkedAt: "2024-03-08T10:00:00Z", linkedBy: "Admin User" },
      { id: "lm-017", originalName: "Calcimax D3", normalizedName: "calcimax d3", shopId: "shop-009", shopName: "PharmEasy Store", occurrenceCount: 31, linkedAt: "2024-03-07T14:20:00Z", linkedBy: "System" },
    ],
    createdAt: "2024-03-08T11:00:00Z",
    updatedAt: "2024-03-08T10:00:00Z",
  },

  // ─────────────────────────────────────────────────────────
  // RAW IMAGE MEDICINES (7)
  // ─────────────────────────────────────────────────────────
  {
    id: "mm-009",
    name: "Cetirizine 10mg Tablet",
    normalizedName: "cetirizine 10mg tablet",
    composition: "Cetirizine (10mg)",
    type: "OTC",
    manufacturer: "Dr. Reddy's",
    marketer: "Dr. Reddy's Laboratories",
    packSize: "10 tablets in 1 strip",
    prescriptionRequired: false,
    isActive: true,
    imageStatus: IMAGE_STATUS.RAW,
    images: [
      { id: "img-009-1", url: "/scraped/cetirizine_raw_1.jpg", isPrimary: true, status: "RAW", uploadedAt: "2024-03-01", uploadedBy: "Scraper" },
      { id: "img-009-2", url: "/scraped/cetirizine_raw_2.jpg", isPrimary: false, status: "RAW", uploadedAt: "2024-03-01", uploadedBy: "Scraper" },
    ],
    linkedMedicines: [
      { id: "lm-018", originalName: "Cetzine 10mg", normalizedName: "cetzine 10mg", shopId: "shop-002", shopName: "MedPlus", occurrenceCount: 43, linkedAt: "2024-03-13T14:20:00Z", linkedBy: "System" },
      { id: "lm-019", originalName: "CTZ 10", normalizedName: "ctz 10", shopId: "shop-004", shopName: "Wellness Pharma", occurrenceCount: 27, linkedAt: "2024-03-12T09:30:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: "2024-03-13T14:20:00Z",
  },
  {
    id: "mm-010",
    name: "Omeprazole 20mg Capsule",
    normalizedName: "omeprazole 20mg capsule",
    composition: "Omeprazole (20mg)",
    type: "DRUG",
    manufacturer: "Mankind Pharma",
    marketer: "Mankind Pharma Ltd",
    packSize: "15 capsules in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.RAW,
    images: [
      { id: "img-010-1", url: "/scraped/omeprazole_raw_1.jpg", isPrimary: true, status: "RAW", uploadedAt: "2024-02-28", uploadedBy: "Scraper" },
    ],
    linkedMedicines: [
      { id: "lm-020", originalName: "Omez 20", normalizedName: "omez 20", shopId: "shop-001", shopName: "City Pharmacy", occurrenceCount: 58, linkedAt: "2024-03-12T11:45:00Z", linkedBy: "Admin User" },
      { id: "lm-021", originalName: "OMEPRAZOLE 20 CAP", normalizedName: "omeprazole 20 cap", shopId: "shop-006", shopName: "Health First", occurrenceCount: 36, linkedAt: "2024-03-11T10:00:00Z", linkedBy: "System" },
      { id: "lm-022", originalName: "Omee 20mg", normalizedName: "omee 20mg", shopId: "shop-010", shopName: "Medkart", occurrenceCount: 22, linkedAt: "2024-03-10T15:30:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-02-28T09:00:00Z",
    updatedAt: "2024-03-12T11:45:00Z",
  },
  {
    id: "mm-011",
    name: "Pantoprazole 40mg Tablet",
    normalizedName: "pantoprazole 40mg tablet",
    composition: "Pantoprazole (40mg)",
    type: "DRUG",
    manufacturer: "Torrent Pharmaceuticals",
    marketer: "Torrent Pharma",
    packSize: "15 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.RAW,
    images: [
      { id: "img-011-1", url: "/scraped/pantoprazole_raw_1.jpg", isPrimary: true, status: "RAW", uploadedAt: "2024-02-25", uploadedBy: "Scraper" },
      { id: "img-011-2", url: "/scraped/pantoprazole_raw_2.jpg", isPrimary: false, status: "RAW", uploadedAt: "2024-02-25", uploadedBy: "Scraper" },
      { id: "img-011-3", url: "/scraped/pantoprazole_raw_3.jpg", isPrimary: false, status: "RAW", uploadedAt: "2024-02-25", uploadedBy: "Scraper" },
    ],
    linkedMedicines: [
      { id: "lm-023", originalName: "PAN 40", normalizedName: "pan 40", shopId: "shop-003", shopName: "Apollo Pharmacy", occurrenceCount: 72, linkedAt: "2024-03-07T15:30:00Z", linkedBy: "Admin User" },
      { id: "lm-024", originalName: "Pantocid 40mg", normalizedName: "pantocid 40mg", shopId: "shop-007", shopName: "Care Chemist", occurrenceCount: 48, linkedAt: "2024-03-06T12:00:00Z", linkedBy: "System" },
    ],
    createdAt: "2024-02-25T10:00:00Z",
    updatedAt: "2024-03-07T15:30:00Z",
  },
  {
    id: "mm-012",
    name: "Metformin 500mg Tablet",
    normalizedName: "metformin 500mg tablet",
    composition: "Metformin Hydrochloride (500mg)",
    type: "DRUG",
    manufacturer: "USV Pvt Ltd",
    marketer: "USV Private Limited",
    packSize: "20 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.RAW,
    images: [
      { id: "img-012-1", url: "/scraped/metformin_raw_1.jpg", isPrimary: true, status: "RAW", uploadedAt: "2024-02-20", uploadedBy: "Scraper" },
    ],
    linkedMedicines: [
      { id: "lm-025", originalName: "Glycomet 500", normalizedName: "glycomet 500", shopId: "shop-005", shopName: "LifeCare Medical", occurrenceCount: 95, linkedAt: "2024-03-10T08:15:00Z", linkedBy: "Admin User" },
      { id: "lm-026", originalName: "MET 500", normalizedName: "met 500", shopId: "shop-011", shopName: "Diabetes Care Center", occurrenceCount: 67, linkedAt: "2024-03-09T10:30:00Z", linkedBy: "System" },
    ],
    createdAt: "2024-02-20T08:00:00Z",
    updatedAt: "2024-03-10T08:15:00Z",
  },
  {
    id: "mm-013",
    name: "Atorvastatin 10mg Tablet",
    normalizedName: "atorvastatin 10mg tablet",
    composition: "Atorvastatin Calcium (10mg)",
    type: "DRUG",
    manufacturer: "Zydus Cadila",
    marketer: "Zydus Healthcare Ltd",
    packSize: "10 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.RAW,
    images: [
      { id: "img-013-1", url: "/scraped/atorvastatin_raw_1.jpg", isPrimary: true, status: "RAW", uploadedAt: "2024-02-22", uploadedBy: "Scraper" },
    ],
    linkedMedicines: [
      { id: "lm-027", originalName: "Atorva 10", normalizedName: "atorva 10", shopId: "shop-001", shopName: "City Pharmacy", occurrenceCount: 54, linkedAt: "2024-03-11T14:00:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-02-22T09:30:00Z",
    updatedAt: "2024-03-11T14:00:00Z",
  },
  {
    id: "mm-014",
    name: "Amlodipine 5mg Tablet",
    normalizedName: "amlodipine 5mg tablet",
    composition: "Amlodipine Besylate (5mg)",
    type: "DRUG",
    manufacturer: "Lupin Ltd",
    marketer: "Lupin Limited",
    packSize: "14 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.RAW,
    images: [
      { id: "img-014-1", url: "/scraped/amlodipine_raw_1.jpg", isPrimary: true, status: "RAW", uploadedAt: "2024-02-18", uploadedBy: "Scraper" },
      { id: "img-014-2", url: "/scraped/amlodipine_raw_2.jpg", isPrimary: false, status: "RAW", uploadedAt: "2024-02-18", uploadedBy: "Scraper" },
    ],
    linkedMedicines: [
      { id: "lm-028", originalName: "AMLO 5", normalizedName: "amlo 5", shopId: "shop-008", shopName: "Netmeds Store", occurrenceCount: 41, linkedAt: "2024-03-12T09:00:00Z", linkedBy: "System" },
      { id: "lm-029", originalName: "Amlodipine 5mg Tab", normalizedName: "amlodipine 5mg tab", shopId: "shop-004", shopName: "Wellness Pharma", occurrenceCount: 29, linkedAt: "2024-03-11T11:30:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-02-18T10:00:00Z",
    updatedAt: "2024-03-12T09:00:00Z",
  },
  {
    id: "mm-015",
    name: "Losartan 50mg Tablet",
    normalizedName: "losartan 50mg tablet",
    composition: "Losartan Potassium (50mg)",
    type: "DRUG",
    manufacturer: "Cadila Healthcare",
    marketer: "Zydus Cadila",
    packSize: "10 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.RAW,
    images: [
      { id: "img-015-1", url: "/scraped/losartan_raw_1.jpg", isPrimary: true, status: "RAW", uploadedAt: "2024-02-15", uploadedBy: "Scraper" },
    ],
    linkedMedicines: [
      { id: "lm-030", originalName: "Losar 50", normalizedName: "losar 50", shopId: "shop-002", shopName: "MedPlus", occurrenceCount: 38, linkedAt: "2024-03-10T16:00:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-02-15T08:30:00Z",
    updatedAt: "2024-03-10T16:00:00Z",
  },

  // ─────────────────────────────────────────────────────────
  // NO IMAGE MEDICINES (5)
  // ─────────────────────────────────────────────────────────
  {
    id: "mm-016",
    name: "Ranitidine 150mg Tablet",
    normalizedName: "ranitidine 150mg tablet",
    composition: "Ranitidine Hydrochloride (150mg)",
    type: "DRUG",
    manufacturer: "GSK Pharma",
    marketer: "GlaxoSmithKline Pharmaceuticals",
    packSize: "10 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.NONE,
    images: [],
    linkedMedicines: [
      { id: "lm-031", originalName: "Rantac 150", normalizedName: "rantac 150", shopId: "shop-003", shopName: "Apollo Pharmacy", occurrenceCount: 45, linkedAt: "2024-03-09T10:00:00Z", linkedBy: "System" },
      { id: "lm-032", originalName: "RANITIDINE 150", normalizedName: "ranitidine 150", shopId: "shop-006", shopName: "Health First", occurrenceCount: 31, linkedAt: "2024-03-08T14:30:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-02-10T09:00:00Z",
    updatedAt: "2024-03-09T10:00:00Z",
  },
  {
    id: "mm-017",
    name: "Domperidone 10mg Tablet",
    normalizedName: "domperidone 10mg tablet",
    composition: "Domperidone (10mg)",
    type: "DRUG",
    manufacturer: "Intas Pharmaceuticals",
    marketer: "Intas Pharma",
    packSize: "10 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.NONE,
    images: [],
    linkedMedicines: [
      { id: "lm-033", originalName: "Domstal 10", normalizedName: "domstal 10", shopId: "shop-001", shopName: "City Pharmacy", occurrenceCount: 52, linkedAt: "2024-03-11T12:00:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-02-08T10:30:00Z",
    updatedAt: "2024-03-11T12:00:00Z",
  },
  {
    id: "mm-018",
    name: "Montelukast 10mg Tablet",
    normalizedName: "montelukast 10mg tablet",
    composition: "Montelukast Sodium (10mg)",
    type: "DRUG",
    manufacturer: "Sun Pharma",
    marketer: "Sun Pharmaceutical Industries",
    packSize: "10 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.NONE,
    images: [],
    linkedMedicines: [
      { id: "lm-034", originalName: "Montair 10", normalizedName: "montair 10", shopId: "shop-005", shopName: "LifeCare Medical", occurrenceCount: 37, linkedAt: "2024-03-08T09:15:00Z", linkedBy: "System" },
      { id: "lm-035", originalName: "MONTEK 10", normalizedName: "montek 10", shopId: "shop-009", shopName: "PharmEasy Store", occurrenceCount: 28, linkedAt: "2024-03-07T16:45:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-02-05T08:00:00Z",
    updatedAt: "2024-03-08T09:15:00Z",
  },
  {
    id: "mm-019",
    name: "Levofloxacin 500mg Tablet",
    normalizedName: "levofloxacin 500mg tablet",
    composition: "Levofloxacin (500mg)",
    type: "DRUG",
    manufacturer: "Cipla Ltd",
    marketer: "Cipla Limited",
    packSize: "5 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.NONE,
    images: [],
    linkedMedicines: [
      { id: "lm-036", originalName: "Levomac 500", normalizedName: "levomac 500", shopId: "shop-007", shopName: "Care Chemist", occurrenceCount: 24, linkedAt: "2024-03-10T11:30:00Z", linkedBy: "Admin User" },
    ],
    createdAt: "2024-02-03T09:45:00Z",
    updatedAt: "2024-03-10T11:30:00Z",
  },
  {
    id: "mm-020",
    name: "Ciprofloxacin 500mg Tablet",
    normalizedName: "ciprofloxacin 500mg tablet",
    composition: "Ciprofloxacin (500mg)",
    type: "DRUG",
    manufacturer: "Ranbaxy Laboratories",
    marketer: "Sun Pharma (Ranbaxy)",
    packSize: "10 tablets in 1 strip",
    prescriptionRequired: true,
    isActive: true,
    imageStatus: IMAGE_STATUS.NONE,
    images: [],
    linkedMedicines: [
      { id: "lm-037", originalName: "Ciplox 500", normalizedName: "ciplox 500", shopId: "shop-002", shopName: "MedPlus", occurrenceCount: 61, linkedAt: "2024-03-09T08:00:00Z", linkedBy: "System" },
      { id: "lm-038", originalName: "CIPRO 500 TAB", normalizedName: "cipro 500 tab", shopId: "shop-010", shopName: "Medkart", occurrenceCount: 43, linkedAt: "2024-03-08T13:20:00Z", linkedBy: "Admin User" },
      { id: "lm-039", originalName: "Ciproflox 500mg", normalizedName: "ciproflox 500mg", shopId: "shop-004", shopName: "Wellness Pharma", occurrenceCount: 35, linkedAt: "2024-03-07T10:00:00Z", linkedBy: "System" },
    ],
    createdAt: "2024-02-01T10:00:00Z",
    updatedAt: "2024-03-09T08:00:00Z",
  },
];

// ═══════════════════════════════════════════════════════════════
// UNMAPPED MEDICINES (Grouped by normalized name) - Keep existing
// ═══════════════════════════════════════════════════════════════
export const MOCK_UNMAPPED_MEDICINES = [
  {
    id: "um-001",
    normalizedName: "allegra 120",
    sampleNames: ["Allegra 120", "ALLEGRA-120", "Allegra 120mg Tab"],
    occurrenceCount: 34,
    shopCount: 8,
    type: "OTC",
    hasImageSuggestion: true,
    firstSeenAt: "2024-03-01T10:00:00Z",
    lastSeenAt: "2024-03-18T14:30:00Z",
    shops: [
      { id: "shop-1", name: "City Pharmacy", count: 10 },
      { id: "shop-2", name: "MedPlus", count: 8 },
      { id: "shop-3", name: "Apollo Pharmacy", count: 6 },
      { id: "shop-4", name: "Wellness Pharma", count: 5 },
      { id: "shop-5", name: "LifeCare Medical", count: 5 },
    ],
  },
  {
    id: "um-002",
    normalizedName: "combiflam",
    sampleNames: ["Combiflam Tab", "COMBIFLAM", "Combiflam Tablet", "Combiflam Plus"],
    occurrenceCount: 56,
    shopCount: 12,
    type: "OTC",
    hasImageSuggestion: true,
    firstSeenAt: "2024-02-28T08:00:00Z",
    lastSeenAt: "2024-03-18T16:00:00Z",
    shops: [
      { id: "shop-2", name: "MedPlus", count: 18 },
      { id: "shop-3", name: "Apollo Pharmacy", count: 15 },
      { id: "shop-8", name: "Netmeds Store", count: 10 },
      { id: "shop-1", name: "City Pharmacy", count: 8 },
      { id: "shop-6", name: "Health First", count: 5 },
    ],
  },
  {
    id: "um-003",
    normalizedName: "ecosprin 75",
    sampleNames: ["Ecosprin 75", "ECOSPRIN-75", "Ecosprin AV 75"],
    occurrenceCount: 41,
    shopCount: 9,
    type: "DRUG",
    hasImageSuggestion: false,
    firstSeenAt: "2024-03-02T14:00:00Z",
    lastSeenAt: "2024-03-17T11:20:00Z",
    shops: [
      { id: "shop-5", name: "LifeCare Medical", count: 15 },
      { id: "shop-11", name: "Diabetes Care Center", count: 12 },
      { id: "shop-1", name: "City Pharmacy", count: 8 },
      { id: "shop-4", name: "Wellness Pharma", count: 6 },
    ],
  },
  {
    id: "um-004",
    normalizedName: "zincovit",
    sampleNames: ["Zincovit Tab", "ZINCOVIT", "Zincovit Tablet"],
    occurrenceCount: 29,
    shopCount: 6,
    type: "OTC",
    hasImageSuggestion: true,
    firstSeenAt: "2024-03-05T09:00:00Z",
    lastSeenAt: "2024-03-16T10:30:00Z",
    shops: [
      { id: "shop-2", name: "MedPlus", count: 10 },
      { id: "shop-9", name: "PharmEasy Store", count: 8 },
      { id: "shop-3", name: "Apollo Pharmacy", count: 6 },
      { id: "shop-6", name: "Health First", count: 5 },
    ],
  },
  {
    id: "um-005",
    normalizedName: "supradyn",
    sampleNames: ["Supradyn Tab", "SUPRADYN", "Supradyn Tablet", "Supradyn Daily"],
    occurrenceCount: 38,
    shopCount: 7,
    type: "OTC",
    hasImageSuggestion: false,
    firstSeenAt: "2024-03-04T10:00:00Z",
    lastSeenAt: "2024-03-18T09:00:00Z",
    shops: [
      { id: "shop-8", name: "Netmeds Store", count: 12 },
      { id: "shop-2", name: "MedPlus", count: 10 },
      { id: "shop-4", name: "Wellness Pharma", count: 8 },
      { id: "shop-1", name: "City Pharmacy", count: 8 },
    ],
  },
  {
    id: "um-006",
    normalizedName: "digene gel",
    sampleNames: ["Digene Gel", "DIGENE", "Digene Antacid Gel"],
    occurrenceCount: 22,
    shopCount: 5,
    type: "OTC",
    hasImageSuggestion: true,
    firstSeenAt: "2024-03-08T11:00:00Z",
    lastSeenAt: "2024-03-15T14:45:00Z",
    shops: [
      { id: "shop-3", name: "Apollo Pharmacy", count: 8 },
      { id: "shop-7", name: "Care Chemist", count: 6 },
      { id: "shop-2", name: "MedPlus", count: 5 },
      { id: "shop-5", name: "LifeCare Medical", count: 3 },
    ],
  },
  {
    id: "um-007",
    normalizedName: "telma 40",
    sampleNames: ["Telma 40", "TELMA-40", "Telma 40mg Tab", "Telmisartan 40"],
    occurrenceCount: 47,
    shopCount: 10,
    type: "DRUG",
    hasImageSuggestion: false,
    firstSeenAt: "2024-02-25T07:00:00Z",
    lastSeenAt: "2024-03-18T12:00:00Z",
    shops: [
      { id: "shop-1", name: "City Pharmacy", count: 12 },
      { id: "shop-5", name: "LifeCare Medical", count: 10 },
      { id: "shop-11", name: "Diabetes Care Center", count: 10 },
      { id: "shop-6", name: "Health First", count: 8 },
      { id: "shop-4", name: "Wellness Pharma", count: 7 },
    ],
  },
  {
    id: "um-008",
    normalizedName: "evion 400",
    sampleNames: ["Evion 400", "EVION-400", "Evion 400mg Cap", "Vitamin E 400"],
    occurrenceCount: 31,
    shopCount: 6,
    type: "OTC",
    hasImageSuggestion: true,
    firstSeenAt: "2024-03-06T08:30:00Z",
    lastSeenAt: "2024-03-17T15:00:00Z",
    shops: [
      { id: "shop-9", name: "PharmEasy Store", count: 10 },
      { id: "shop-2", name: "MedPlus", count: 8 },
      { id: "shop-8", name: "Netmeds Store", count: 7 },
      { id: "shop-3", name: "Apollo Pharmacy", count: 6 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// NEEDS REVIEW - Keep existing
// ═══════════════════════════════════════════════════════════════
export const MOCK_NEEDS_REVIEW = [
  {
    id: "nr-001",
    rawName: "Calpol 500",
    normalizedRaw: "calpol 500",
    suggestedMaster: {
      id: "mm-001",
      name: "Paracetamol 500mg Tablet",
      manufacturer: "Cipla Ltd",
      type: "DRUG",
      hasImage: true,
    },
    confidenceScore: 78,
    confidenceReason: "Similar composition detected",
    shopId: "shop-1",
    shopName: "City Pharmacy",
    occurrenceCount: 5,
    firstSeenAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "nr-002",
    rawName: "Mox 500 Cap",
    normalizedRaw: "mox 500 cap",
    suggestedMaster: {
      id: "mm-002",
      name: "Amoxicillin 500mg Capsule",
      manufacturer: "Sun Pharma",
      type: "DRUG",
      hasImage: true,
    },
    confidenceScore: 85,
    confidenceReason: "Name pattern match + same strength",
    shopId: "shop-2",
    shopName: "MedPlus",
    occurrenceCount: 8,
    firstSeenAt: "2024-03-14T09:30:00Z",
  },
  {
    id: "nr-003",
    rawName: "Rantidine 150",
    normalizedRaw: "rantidine 150",
    suggestedMaster: {
      id: "mm-016",
      name: "Ranitidine 150mg Tablet",
      manufacturer: "GSK Pharma",
      type: "DRUG",
      hasImage: false,
    },
    confidenceScore: 92,
    confidenceReason: "Exact composition match (typo detected)",
    shopId: "shop-3",
    shopName: "Apollo Pharmacy",
    occurrenceCount: 3,
    firstSeenAt: "2024-03-16T11:00:00Z",
  },
  {
    id: "nr-004",
    rawName: "Cetrizine Tab",
    normalizedRaw: "cetrizine tab",
    suggestedMaster: {
      id: "mm-009",
      name: "Cetirizine 10mg Tablet",
      manufacturer: "Dr. Reddy's",
      type: "OTC",
      hasImage: true,
    },
    confidenceScore: 88,
    confidenceReason: "Name match with minor spelling variation",
    shopId: "shop-4",
    shopName: "Wellness Pharma",
    occurrenceCount: 12,
    firstSeenAt: "2024-03-13T14:30:00Z",
  },
  {
    id: "nr-005",
    rawName: "D3 Must Sachet",
    normalizedRaw: "d3 must sachet",
    suggestedMaster: {
      id: "mm-004",
      name: "Vitamin D3 60000 IU Capsule",
      manufacturer: "Abbott Healthcare",
      type: "OTC",
      hasImage: true,
    },
    confidenceScore: 62,
    confidenceReason: "Same vitamin type, different form",
    shopId: "shop-5",
    shopName: "LifeCare Medical",
    occurrenceCount: 6,
    firstSeenAt: "2024-03-12T16:00:00Z",
  },
  {
    id: "nr-006",
    rawName: "Glycomet GP 500",
    normalizedRaw: "glycomet gp 500",
    suggestedMaster: {
      id: "mm-012",
      name: "Metformin 500mg Tablet",
      manufacturer: "USV Pvt Ltd",
      type: "DRUG",
      hasImage: true,
    },
    confidenceScore: 71,
    confidenceReason: "Brand name variant of same salt",
    shopId: "shop-6",
    shopName: "Health First",
    occurrenceCount: 15,
    firstSeenAt: "2024-03-10T08:45:00Z",
  },
  {
    id: "nr-007",
    rawName: "Azithral 250",
    normalizedRaw: "azithral 250",
    suggestedMaster: {
      id: "mm-005",
      name: "Azithromycin 500mg Tablet",
      manufacturer: "Alkem Laboratories",
      type: "DRUG",
      hasImage: true,
    },
    confidenceScore: 55,
    confidenceReason: "Same salt, different strength",
    shopId: "shop-7",
    shopName: "Care Chemist",
    occurrenceCount: 4,
    firstSeenAt: "2024-03-09T13:20:00Z",
  },
  {
    id: "nr-008",
    rawName: "Shelcal HD",
    normalizedRaw: "shelcal hd",
    suggestedMaster: {
      id: "mm-008",
      name: "Calcium + Vitamin D3 Tablet",
      manufacturer: "Pfizer Ltd",
      type: "OTC",
      hasImage: true,
    },
    confidenceScore: 81,
    confidenceReason: "Same category and brand variant",
    shopId: "shop-8",
    shopName: "Netmeds Store",
    occurrenceCount: 9,
    firstSeenAt: "2024-03-08T10:30:00Z",
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get image status display info
 */
export function getImageStatusInfo(status) {
  switch (status) {
    case IMAGE_STATUS.VERIFIED:
      return {
        label: "Verified",
        color: "green",
        bgClass: "bg-green-100",
        textClass: "text-green-700",
        borderClass: "border-green-200",
        iconBg: "bg-green-500",
      };
    case IMAGE_STATUS.RAW:
      return {
        label: "Raw",
        color: "amber",
        bgClass: "bg-amber-100",
        textClass: "text-amber-700",
        borderClass: "border-amber-200",
        iconBg: "bg-amber-500",
      };
    case IMAGE_STATUS.NONE:
    default:
      return {
        label: "No Image",
        color: "red",
        bgClass: "bg-red-100",
        textClass: "text-red-700",
        borderClass: "border-red-200",
        iconBg: "bg-red-500",
      };
  }
}

/**
 * Get confidence level styling
 */
export function getConfidenceLevel(score) {
  if (score >= 90) return { level: "high", color: "green", label: "High" };
  if (score >= 70) return { level: "medium", color: "yellow", label: "Medium" };
  if (score >= 50) return { level: "low", color: "orange", label: "Low" };
  return { level: "very-low", color: "red", label: "Very Low" };
}

/**
 * Get confidence bar color classes
 */
export function getConfidenceColorClasses(score) {
  if (score >= 90) return { bg: "bg-green-500", text: "text-green-700", badge: "bg-green-100 text-green-800" };
  if (score >= 70) return { bg: "bg-yellow-500", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800" };
  if (score >= 50) return { bg: "bg-orange-500", text: "text-orange-700", badge: "bg-orange-100 text-orange-800" };
  return { bg: "bg-red-500", text: "text-red-700", badge: "bg-red-100 text-red-800" };
}

/**
 * Calculate statistics from data
 */
export function calculateStats(masterMedicines, unmapped, needsReview) {
  const verified = masterMedicines.filter((m) => m.imageStatus === IMAGE_STATUS.VERIFIED).length;
  const raw = masterMedicines.filter((m) => m.imageStatus === IMAGE_STATUS.RAW).length;
  const none = masterMedicines.filter((m) => m.imageStatus === IMAGE_STATUS.NONE).length;
  const totalLinked = masterMedicines.reduce((sum, m) => sum + (m.linkedMedicines?.length || 0), 0);
  const drugs = masterMedicines.filter((m) => m.type === "DRUG").length;
  const otc = masterMedicines.filter((m) => m.type === "OTC").length;

  return {
    totalMasters: masterMedicines.length,
    verified,
    raw,
    none,
    totalLinked,
    unmapped: unmapped.length,
    needsReview: needsReview.length,
    drugs,
    otc,
    needsAttention: raw + none + unmapped.length + needsReview.length,
  };
}