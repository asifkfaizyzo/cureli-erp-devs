// backend/src/modules/suppliers/supplier.service.js
import prisma from "../../config/prisma.js";

/* =====================================================
   API ERROR
===================================================== */
class ApiError extends Error {
  constructor(message, statusCode = 400, code = "SUPPLIER_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/* =====================================================
   SUPPLIER SERVICE
===================================================== */
class SupplierService {
  /* ============================================
     CREATE SUPPLIER
  ============================================ */
  async createSupplier(data, shopId, userId) {
    const existing = await prisma.supplier.findFirst({
      where: {
        shop_id: shopId,
        name: data.name,
      },
    });

    if (existing) {
      throw new ApiError(
        `Supplier "${data.name}" already exists`,
        409,
        "DUPLICATE_SUPPLIER"
      );
    }

    if (data.gst_number) {
      const gstExists = await prisma.supplier.findFirst({
        where: {
          shop_id: shopId,
          gst_number: data.gst_number,
        },
      });

      if (gstExists) {
        throw new ApiError(
          `Supplier with GST ${data.gst_number} already exists`,
          409,
          "DUPLICATE_GST"
        );
      }
    }

    return prisma.supplier.create({
      data: {
        ...data,
        shop_id: shopId,
        created_by: userId,
      },
    });
  }

  /* ============================================
     GET SUPPLIERS
  ============================================ */
  // backend/src/modules/suppliers/supplier.service.js
async getSuppliers(shopId, filters = {}) {
  const { search, isActive, limit = 100, offset = 0 } = filters;

  const where = {
    shop_id: shopId,
    // ✅ FIX: Only filter by is_active if explicitly set
    ...(isActive !== undefined && { is_active: isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { gst_number: { contains: search, mode: "insensitive" } },
        { contact_person: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  console.log("Prisma where clause:", where); // DEBUG

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      take: limit,
      skip: offset,
    }),
    prisma.supplier.count({ where }),
  ]);

  console.log("Found suppliers:", suppliers.length); // DEBUG

  return { suppliers, total };
}
  /* ============================================
     GET SUPPLIER BY ID
  ============================================ */
  async getSupplierById(supplierId, shopId) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
      include: {
        _count: {
          select: {
            purchaseInvoices: true,
            payments: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    return supplier;
  }

  /* ============================================
     UPDATE SUPPLIER
  ============================================ */
  async updateSupplier(supplierId, shopId, data) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        supplier_id: supplierId,
        shop_id: shopId,
      },
    });

    if (!supplier) {
      throw new ApiError("Supplier not found", 404, "NOT_FOUND");
    }

    return prisma.supplier.update({
      where: { supplier_id: supplierId },
      data,
    });
  }
}

export default new SupplierService();
