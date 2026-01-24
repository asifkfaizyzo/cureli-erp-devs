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
   MEDICINE SERVICE
===================================================== */
class MedicineService {
  /* ============================================
     CREATE MEDICINE
  ============================================ */
  async createMedicine(data, shopId, userId) {
    const existing = await prisma.medicine.findFirst({
      where: {
        shop_id: shopId,
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

    return prisma.medicine.create({
      data: {
        ...data,
        shop_id: shopId,
        created_by: userId,
      },
    });
  }

  /* ============================================
     GET MEDICINES
  ============================================ */
  async getMedicines(shopId, filters = {}) {
    const {
      search,
      isActive,
      manufacturer,
      category,
      limit = 100,
      offset = 0,
    } = filters;

    const where = {
      shop_id: shopId,
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
  async getMedicineById(medicineId, shopId) {
    const medicine = await prisma.medicine.findFirst({
      where: { medicine_id: medicineId, shop_id: shopId },
      include: {
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
  async updateMedicine(medicineId, shopId, data) {
    const medicine = await prisma.medicine.findFirst({
      where: { medicine_id: medicineId, shop_id: shopId },
    });

    if (!medicine) {
      throw new ApiError("Medicine not found", 404, "NOT_FOUND");
    }

    return prisma.medicine.update({
      where: { medicine_id: medicineId },
      data,
    });
  }

  /* ============================================
     BULK CREATE (IMPORT SAFE)
  ============================================ */
  async bulkCreateMedicines(medicinesData, shopId, userId) {
    const results = {
      created: [],
      skipped: [],
      errors: [],
    };

    for (const data of medicinesData) {
      try {
        const medicine = await this.createMedicine(data, shopId, userId);
        results.created.push(medicine);
      } catch (error) {
        if (error.statusCode === 409) {
          results.skipped.push({
            name: data.name,
            manufacturer: data.manufacturer,
            reason: "Already exists",
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
}

export default new MedicineService();
