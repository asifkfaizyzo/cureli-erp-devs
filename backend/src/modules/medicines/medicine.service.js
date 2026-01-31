// backend/src/modules/medicines/medicine.service.js

import prisma from "../../config/prisma.js";

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "MEDICINE_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class MedicineService {
  
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
     CREATE MEDICINE - ✅ UPDATED
  ============================================ */
  async createMedicine(data, shopId, branchId, userId) {
    if (!branchId) {
      throw new ApiError(
        "Branch selection is required to create medicines. Please select a specific branch.",
        400,
        "BRANCH_REQUIRED"
      );
    }

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
        `Medicine "${data.name}" by ${data.manufacturer} already exists in this branch`,
        409,
        "DUPLICATE_MEDICINE"
      );
    }

    // ✅ Validate stock level logic
    if (data.min_stock_level && data.max_stock_level) {
      if (Number(data.min_stock_level) >= Number(data.max_stock_level)) {
        throw new ApiError(
          "Minimum stock level must be less than maximum stock level",
          400,
          "INVALID_STOCK_LEVELS"
        );
      }
    }

    if (data.reorder_point && data.max_stock_level) {
      if (Number(data.reorder_point) >= Number(data.max_stock_level)) {
        throw new ApiError(
          "Reorder point must be less than maximum stock level",
          400,
          "INVALID_REORDER_POINT"
        );
      }
    }

    const medicine = await prisma.medicine.create({
      data: {
        name: data.name,
        generic_name: data.generic_name,
        manufacturer: data.manufacturer,
        category: data.category,
        sub_category: data.sub_category,
        schedule: data.schedule,
        hsn_code: data.hsn_code,
        pack_size: data.pack_size,
        unit_of_measure: data.unit_of_measure || "UNIT",
        gst_percentage: data.gst_percentage ?? 12,
        cgst_percentage: data.cgst_percentage ?? 6,
        sgst_percentage: data.sgst_percentage ?? 6,
        rack_no: data.rack_no,
        
        // ✅ NEW: Stock level thresholds
        min_stock_level: data.min_stock_level ?? null,
        max_stock_level: data.max_stock_level ?? null,
        reorder_point: data.reorder_point ?? null,
        
        shop_id: shopId,
        branch_id: branchId,
        created_by: userId,
      },
      // ✅ Explicit select to return all fields
      select: {
        medicine_id: true,
        name: true,
        generic_name: true,
        manufacturer: true,
        category: true,
        sub_category: true,
        schedule: true,
        hsn_code: true,
        pack_size: true,
        unit_of_measure: true,
        gst_percentage: true,
        cgst_percentage: true,
        sgst_percentage: true,
        rack_no: true,
        min_stock_level: true,
        max_stock_level: true,
        reorder_point: true,
        is_active: true,
        is_discontinued: true,
        shop_id: true,
        branch_id: true,
        created_by: true,
        created_at: true,
        updated_at: true,
      },
    });

    return medicine;
  }

  /* ============================================
     GET MEDICINES - ✅ UPDATED (Include new fields)
  ============================================ */
  async getMedicines(shopId, branchId, role, branchMode, filters = {}) {
    const {
      search,
      isActive,
      manufacturer,
      category,
      limit = 100,
      offset = 0,
    } = filters;

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
          { hsn_code: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        include: {
          branch: {
            select: {
              branch_id: true,
              branch_name: true,
            },
          },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.medicine.count({ where }),
    ]);

    return { medicines, total };
  }

  /* ============================================
     GET MEDICINE BY ID - ✅ UPDATED
  ============================================ */
  async getMedicineById(medicineId, shopId, branchId, role, branchMode) {
    const baseFilter = this._buildBranchFilter(shopId, branchId, role, branchMode);

    const medicine = await prisma.medicine.findFirst({
      where: { 
        medicine_id: medicineId, 
        ...baseFilter,
      },
      include: {
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
        inventory: {
          where: { is_active: true },
          select: {
            batch_number: true,
            expiry_date: true,
            current_stock: true,
            available_stock: true,
            mrp: true,
            selling_rate: true,
            minimum_stock: true,
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
     UPDATE MEDICINE - ✅ UPDATED
  ============================================ */
  async updateMedicine(medicineId, shopId, branchId, role, branchMode, data) {
    const baseFilter = this._buildBranchFilter(shopId, branchId, role, branchMode);

    const medicine = await prisma.medicine.findFirst({
      where: { 
        medicine_id: medicineId, 
        ...baseFilter,
      },
    });

    if (!medicine) {
      throw new ApiError("Medicine not found", 404, "NOT_FOUND");
    }

    if (data.branch_id && data.branch_id !== medicine.branch_id) {
      throw new ApiError("Cannot change medicine branch", 400, "BRANCH_CHANGE_NOT_ALLOWED");
    }

    // ✅ Validate stock level logic
    const minStock = data.min_stock_level ?? medicine.min_stock_level;
    const maxStock = data.max_stock_level ?? medicine.max_stock_level;
    const reorderPt = data.reorder_point ?? medicine.reorder_point;

    if (minStock && maxStock) {
      if (Number(minStock) >= Number(maxStock)) {
        throw new ApiError(
          "Minimum stock level must be less than maximum stock level",
          400,
          "INVALID_STOCK_LEVELS"
        );
      }
    }

    if (reorderPt && maxStock) {
      if (Number(reorderPt) >= Number(maxStock)) {
        throw new ApiError(
          "Reorder point must be less than maximum stock level",
          400,
          "INVALID_REORDER_POINT"
        );
      }
    }

    return prisma.medicine.update({
      where: { medicine_id: medicineId },
      data,
    });
  }

  /* ============================================
     BULK CREATE - ✅ UPDATED
  ============================================ */
  async bulkCreateMedicines(medicinesData, shopId, branchId, userId) {
    if (!branchId) {
      throw new ApiError(
        "Branch selection is required for bulk import. Please select a specific branch.",
        400,
        "BRANCH_REQUIRED"
      );
    }

    const results = {
      created: [],
      skipped: [],
      errors: [],
    };

    for (const data of medicinesData) {
      try {
        const medicine = await this.createMedicine(data, shopId, branchId, userId);
        results.created.push(medicine);
      } catch (error) {
        if (error.statusCode === 409) {
          results.skipped.push({
            name: data.name,
            manufacturer: data.manufacturer,
            reason: "Already exists in this branch",
          });
        } else {
          results.errors.push({
            name: data.name,
            manufacturer: data.manufacturer,
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /* ============================================
     SEARCH FOR AUTOCOMPLETE - ✅ UPDATED
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
        // ✅ NEW: Include stock thresholds for inventory defaults
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