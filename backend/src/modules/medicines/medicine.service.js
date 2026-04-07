// backend/src/modules/medicines/medicine.service.js

import prisma from "../../config/prisma.js";
import { autoLinkToMasterCatalog } from "./linking.service.js";
class ApiError extends Error {
  constructor(message, statusCode = 400, code = "MEDICINE_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class MedicineService {
  
  // ✅ Helper to parse any value to number or null
  _toNumber(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return isNaN(value) ? null : value;
    if (typeof value === 'string') {
      if (value.trim() === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    if (typeof value === 'object' && value.toString) {
      const num = Number(value.toString());
      return isNaN(num) ? null : num;
    }
    return null;
  }

  _buildBranchFilter(shopId, branchId, role, branchMode) {
    const filter = { shop_id: shopId };
    if (role === "super_admin" && branchMode === "GLOBAL") {
      return filter;
    }
    if (branchId) {
      filter.branch_id = branchId;
    }
    return filter;
  }

  /* ============================================
     CREATE MEDICINE
  ============================================ */
  
async createMedicine(data, shopId, branchId, userId) {
  console.log('=== MEDICINE SERVICE: CREATE ===');
  console.log('📥 Raw data received:', JSON.stringify(data, null, 2));
  
  if (!branchId) {
    throw new ApiError(
      "Branch selection is required to create medicines.",
      400,
      "BRANCH_REQUIRED"
    );
  }

  // Check for duplicate
  const existing = await prisma.medicine.findFirst({
    where: {
      shop_id: shopId,
      branch_id: branchId,
      name: data.name,
      manufacturer: data.manufacturer,
    },
  });

  if (existing) {
    throw new ApiError(
      `Medicine "${data.name}" by ${data.manufacturer} already exists`,
      409,
      "DUPLICATE_MEDICINE"
    );
  }

  // ✅ Parse stock levels with detailed logging
  const minStock = this._toNumber(data.min_stock_level);
  const maxStock = this._toNumber(data.max_stock_level);
  const reorderPt = this._toNumber(data.reorder_point);

  console.log('📊 Stock levels before save:', { 
    input: {
      min_stock_level: data.min_stock_level,
      max_stock_level: data.max_stock_level,
      reorder_point: data.reorder_point,
    },
    parsed: {
      minStock, 
      maxStock, 
      reorderPt 
    }
  });

  // Validate
  if (minStock !== null && maxStock !== null && minStock >= maxStock) {
    throw new ApiError("Min stock must be less than max stock", 400, "INVALID_STOCK_LEVELS");
  }

// Create
const medicine = await prisma.medicine.create({
  data: {
    name: data.name,
    generic_name: data.generic_name || null,
    manufacturer: data.manufacturer,
    category: data.category || null,
    sub_category: data.sub_category || null,
    schedule: data.schedule || null,
    hsn_code: data.hsn_code || null,
    pack_size: data.pack_size || null,
    unit_of_measure: data.unit_of_measure || "UNIT",
    gst_percentage: this._toNumber(data.gst_percentage) ?? 12,
    cgst_percentage: this._toNumber(data.cgst_percentage) ?? 6,
    sgst_percentage: this._toNumber(data.sgst_percentage) ?? 6,
    rack_no: data.rack_no || null,
    
    min_stock_level: minStock,
    max_stock_level: maxStock,
    reorder_point: reorderPt,
    
    shop_id: shopId,
    branch_id: branchId,
    created_by: userId,
    
    // ✅ NEW: Default link status
    link_status: "PENDING",
  },
  include: {
    branch: {
      select: { branch_id: true, branch_name: true }
    }
  }
});

console.log('✅ Medicine created:', {
  id: medicine.medicine_id,
  name: medicine.name,
  min_stock_level: medicine.min_stock_level,
  max_stock_level: medicine.max_stock_level,
  reorder_point: medicine.reorder_point,
});

// ✅ NEW: Try to auto-link to master catalog
try {
  const linkResult = await autoLinkToMasterCatalog({
    name: medicine.name,
    manufacturer: medicine.manufacturer,
    generic_name: medicine.generic_name,
  });
  
  if (linkResult.type === "EXACT" || linkResult.type === "AUTO_LINKED") {
    // Auto-link with high confidence
    await prisma.medicine.update({
      where: { medicine_id: medicine.medicine_id },
      data: {
        master_medicine_id: linkResult.master_id,
        link_status: "AUTO_LINKED",
        link_confidence_score: linkResult.confidence,
        linked_at: new Date(),
      },
    });
    
    console.log(`✅ Auto-linked to master: ${linkResult.master_key} (${linkResult.confidence}%)`);
  } else if (linkResult.type === "SUGGESTED") {
    // Mark as having suggestions
    await prisma.medicine.update({
      where: { medicine_id: medicine.medicine_id },
      data: {
        link_status: "SUGGESTED",
        link_confidence_score: linkResult.suggestions[0]?.confidence || null,
      },
    });
    
    console.log(`📋 Link suggestions available (${linkResult.suggestions.length})`);
  }
} catch (linkError) {
  // Don't fail medicine creation if linking fails
  console.warn("⚠️ Auto-link failed:", linkError.message);
}

return medicine;
}

  /* ============================================
     GET MEDICINES
  ============================================ */
  async getMedicines(shopId, branchId, role, branchMode, filters = {}) {
    const { search, isActive, manufacturer, category, limit = 100, offset = 0 } = filters;
    const baseFilter = this._buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      ...baseFilter,
      ...(isActive !== undefined && { is_active: isActive }),
      ...(manufacturer && { manufacturer }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { generic_name: { contains: search, mode: "insensitive" } },
          { manufacturer: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        include: { branch: { select: { branch_id: true, branch_name: true } } },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.medicine.count({ where }),
    ]);

    return { medicines, total };
  }

  /* ============================================
     GET MEDICINE BY ID
  ============================================ */
  async getMedicineById(medicineId, shopId, branchId, role, branchMode) {
    const baseFilter = this._buildBranchFilter(shopId, branchId, role, branchMode);

    const medicine = await prisma.medicine.findFirst({
      where: { medicine_id: medicineId, ...baseFilter },
      include: {
        branch: { select: { branch_id: true, branch_name: true } },
        inventory: {
          where: { is_active: true },
          select: {
            batch_number: true,
            expiry_date: true,
            current_stock: true,
            available_stock: true,
            mrp: true,
            selling_rate: true,
          },
        },
      },
    });

    if (!medicine) {
      throw new ApiError("Medicine not found", 404, "NOT_FOUND");
    }

    return medicine;
  }

  /* ============================================
     UPDATE MEDICINE
  ============================================ */
  async updateMedicine(medicineId, shopId, branchId, role, branchMode, data) {
    const baseFilter = this._buildBranchFilter(shopId, branchId, role, branchMode);

    const medicine = await prisma.medicine.findFirst({
      where: { medicine_id: medicineId, ...baseFilter },
    });

    if (!medicine) {
      throw new ApiError("Medicine not found", 404, "NOT_FOUND");
    }

    // Build update data
    const updateData = {};
    
    const fields = [
      'name', 'generic_name', 'manufacturer', 'category', 'sub_category',
      'schedule', 'hsn_code', 'pack_size', 'rack_no', 'is_active', 'is_discontinued'
    ];
    
    fields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // Handle numeric fields
    if (data.min_stock_level !== undefined) {
      updateData.min_stock_level = this._toNumber(data.min_stock_level);
    }
    if (data.max_stock_level !== undefined) {
      updateData.max_stock_level = this._toNumber(data.max_stock_level);
    }
    if (data.reorder_point !== undefined) {
      updateData.reorder_point = this._toNumber(data.reorder_point);
    }

    return prisma.medicine.update({
      where: { medicine_id: medicineId },
      data: updateData,
    });
  }

  /* ============================================
     BULK CREATE
  ============================================ */
  async bulkCreateMedicines(medicinesData, shopId, branchId, userId) {
    if (!branchId) {
      throw new ApiError("Branch required for bulk import", 400, "BRANCH_REQUIRED");
    }

    const results = { created: [], skipped: [], errors: [] };

    for (const data of medicinesData) {
      try {
        const medicine = await this.createMedicine(data, shopId, branchId, userId);
        results.created.push(medicine);
      } catch (error) {
        if (error.statusCode === 409) {
          results.skipped.push({ name: data.name, manufacturer: data.manufacturer, reason: "Duplicate" });
        } else {
          results.errors.push({ name: data.name, manufacturer: data.manufacturer, error: error.message });
        }
      }
    }

    return results;
  }

  /* ============================================
     SEARCH
  ============================================ */
  async searchMedicines(shopId, branchId, role, branchMode, searchTerm, limit = 20) {
    const baseFilter = this._buildBranchFilter(shopId, branchId, role, branchMode);

    return prisma.medicine.findMany({
      where: {
        ...baseFilter,
        is_active: true,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { generic_name: { contains: searchTerm, mode: "insensitive" } },
          { manufacturer: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        medicine_id: true,
        name: true,
        generic_name: true,
        manufacturer: true,
        hsn_code: true,
        pack_size: true,
        rack_no: true,
        gst_percentage: true,
        cgst_percentage: true,
        sgst_percentage: true,
        min_stock_level: true,
        max_stock_level: true,
        reorder_point: true,
      },
      orderBy: { name: "asc" },
      take: limit,
    });
  }
}

export default new MedicineService();