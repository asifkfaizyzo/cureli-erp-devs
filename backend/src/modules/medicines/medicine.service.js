// backend/src/modules/medicines/medicine.service.js

import prisma from "../../config/prisma.js";

/* =====================================================
   API ERROR
===================================================== */
class ApiError extends Error {
  constructor(message, statusCode = 400, code = "MEDICINE_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/* =====================================================
   MEDICINE SERVICE - Branch Aware
===================================================== */
class MedicineService {
  
  /**
   * Build branch filter based on user context
   * 
   * @param {string} shopId - Shop UUID
   * @param {string|null} branchId - Branch UUID (null = all branches for SA)
   * @param {string} role - User role
   * @param {string} branchMode - "GLOBAL" | "BRANCH" (from header)
   * @returns {Object} Prisma where clause for branch filtering
   */
  _buildBranchFilter(shopId, branchId, role, branchMode) {
    const filter = { shop_id: shopId };

    // Super Admin in GLOBAL mode: show all medicines for shop
    if (role === "super_admin" && branchMode === "GLOBAL") {
      // No branch filter - show all
      return filter;
    }

    // Super Admin in BRANCH mode OR branch_admin/staff: filter by branch
    if (branchId) {
      filter.branch_id = branchId;
    }

    return filter;
  }

  /* ============================================
     CREATE MEDICINE
  ============================================ */
  async createMedicine(data, shopId, branchId, userId) {
    // Validate branch_id is provided (required for creation)
    if (!branchId) {
      throw new ApiError(
        "Branch selection is required to create medicines. Please select a specific branch.",
        400,
        "BRANCH_REQUIRED"
      );
    }

    // Check for existing medicine in the same branch
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

    return prisma.medicine.create({
      data: {
        ...data,
        shop_id: shopId,
        branch_id: branchId,  // ✅ NEW: Assign to branch
        created_by: userId,
      },
    });
  }

  /* ============================================
     GET MEDICINES (Branch Filtered)
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

    // Build base filter with branch awareness
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
     GET MEDICINE BY ID (WITH INVENTORY)
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
      where: { 
        medicine_id: medicineId, 
        ...baseFilter,
      },
    });

    if (!medicine) {
      throw new ApiError("Medicine not found", 404, "NOT_FOUND");
    }

    // Prevent branch change via update (security)
    if (data.branch_id && data.branch_id !== medicine.branch_id) {
      throw new ApiError("Cannot change medicine branch", 400, "BRANCH_CHANGE_NOT_ALLOWED");
    }

    return prisma.medicine.update({
      where: { medicine_id: medicineId },
      data,
    });
  }

  /* ============================================
     BULK CREATE (IMPORT SAFE) - Branch Aware
  ============================================ */
  async bulkCreateMedicines(medicinesData, shopId, branchId, userId) {
    // Validate branch_id is provided
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
     SEARCH FOR AUTOCOMPLETE (Branch Aware)
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
      },
      orderBy: { name: "asc" },
      take: limit,
    });
  }
}

export default new MedicineService();