// backend/src/modules/cadmin/cadminDocs/cadminDocs.service.js

import prisma from "../../../config/prisma.js";
import { sendMail } from "../../../utils/email.js";

// ═══════════════════════════════════════════════════════════════
// LIST SHOPS FOR VERIFICATION (unchanged)
// ═══════════════════════════════════════════════════════════════
export async function listShopsForVerification(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 200);
  const skip = (page - 1) * limit;

  const where = {};

  if (query.search) {
    const q = query.search.trim();
    where.OR = [
      { business_name: { contains: q, mode: "insensitive" } },
      { gst_number: { contains: q, mode: "insensitive" } },
      { owner: { full_name: { contains: q, mode: "insensitive" } } },
      { owner: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (query.status && query.status !== "") {
    where.verification_status = query.status;
  }

  if (query.dateStart) {
    const startDate = query.dateStart instanceof Date 
      ? query.dateStart 
      : new Date(query.dateStart);
    if (!isNaN(startDate.getTime())) {
      where.created_at = { gte: startDate };
    }
  }
  if (query.dateEnd) {
    const endDate = query.dateEnd instanceof Date 
      ? query.dateEnd 
      : new Date(query.dateEnd);
    if (!isNaN(endDate.getTime())) {
      endDate.setHours(23, 59, 59, 999);
      where.created_at = { ...where.created_at, lte: endDate };
    }
  }

  // Fetch ALL matching shops first (we'll sort & paginate in memory)
  const allShops = await prisma.shop.findMany({
    where,
    include: {
      owner: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          phone_number: true,
        },
      },
      shopFiles: {
        select: {
          file_id: true,
          status: true,
          resubmission_count: true,
        },
      },
    },
  });

  // Transform data
  let data = allShops.map((shop) => {
    const files = shop.shopFiles || [];
    const filesApproved = files.filter((f) => f.status === "verified").length;
    const filesRejected = files.filter((f) => f.status === "rejected").length;
    const filesTotal = files.length || 0;
    const maxResubmissionCount = files.length
      ? Math.max(...files.map((f) => f.resubmission_count || 0))
      : 0;

    return {
      shop_id: shop.shop_id,
      business_name: shop.business_name,
      gst_number: shop.gst_number || "N/A",
      owner_id: shop.owner_user_id,
      owner_name: shop.owner?.full_name || "N/A",
      owner_email: shop.owner?.email || "N/A",
      owner_phone: shop.owner?.phone_number || "N/A",
      verification_status: shop.verification_status,
      files_approved: filesApproved,
      files_rejected: filesRejected,
      files_total: filesTotal,
      resubmission_count: maxResubmissionCount,
      created_at: shop.created_at,
      updated_at: shop.updated_at,
    };
  });

  // Apply resubmission filter
  const resubMinFilter = Number(query.resubmissionCountMin);
  if (!isNaN(resubMinFilter) && resubMinFilter > 0) {
    data = data.filter((shop) => shop.resubmission_count >= resubMinFilter);
  }

  // Status priority: pending_review=0, partially_rejected=1, rejected=2, verified=3
  const STATUS_PRIORITY = {
    pending_review: 0,
    partially_rejected: 1,
    rejected: 2,
    verified: 3,
  };

  // Check if user wants custom sort or default sort
  const useDefaultSort = !query.sort_by || query.sort_by === "default" || query.sort_by === "created_at";

  if (useDefaultSort) {
    // DEFAULT: pending_review (latest, then most resub) → partially_rejected → rejected → verified
    data.sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.verification_status] ?? 99;
      const priorityB = STATUS_PRIORITY[b.verification_status] ?? 99;

      // 1. Sort by status priority (ascending - pending first)
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // 2. Within same status: sort by created_at DESC (latest first)
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // DESC
      }

      // 3. If same date: sort by resubmission_count DESC (most resub first)
      return b.resubmission_count - a.resubmission_count;
    });
  } else if (query.sort_by === "resubmission_count") {
    data.sort((a, b) => {
      const diff = a.resubmission_count - b.resubmission_count;
      return query.sort_order === "asc" ? diff : -diff;
    });
  } else if (query.sort_by === "business_name") {
    data.sort((a, b) => {
      const cmp = a.business_name.localeCompare(b.business_name);
      return query.sort_order === "asc" ? cmp : -cmp;
    });
  } else if (query.sort_by === "owner_name") {
    data.sort((a, b) => {
      const cmp = a.owner_name.localeCompare(b.owner_name);
      return query.sort_order === "asc" ? cmp : -cmp;
    });
  } else if (query.sort_by === "verification_status") {
    data.sort((a, b) => {
      const cmp = a.verification_status.localeCompare(b.verification_status);
      return query.sort_order === "asc" ? cmp : -cmp;
    });
  }

  const filteredTotal = data.length;

  // Paginate in memory
  const paginatedData = data.slice(skip, skip + limit);

  return {
    data: paginatedData,
    meta: {
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.max(Math.ceil(filteredTotal / limit), 1),
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// FIND FILE BY ID
// ═══════════════════════════════════════════════════════════════
export async function findFileById(file_id) {
  return prisma.shopFile.findUnique({
    where: { file_id },
  });
}

// ═══════════════════════════════════════════════════════════════
// GET SHOP VERIFICATION DETAIL
// ═══════════════════════════════════════════════════════════════
export async function getShopVerificationDetail(shop_id) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      owner: {
        select: {
          user_id: true,
          full_name: true,
          username: true,
          email: true,
          phone_number: true,
        },
      },
      shopFiles: {
        orderBy: { uploaded_at: "desc" },
      },
    },
  });

  if (!shop) {
    const e = new Error("Shop not found");
    e.status = 404;
    throw e;
  }

  const logs = await prisma.fileVerificationLog.findMany({
    where: { shop_id },
    orderBy: { created_at: "desc" },
  });

  const files = (shop.shopFiles || []).map((f) => ({
    file_id: f.file_id,
    file_type: f.file_type,
    original_name: f.original_name,
    mime_type: f.mime_type,
    file_size: f.file_size,
    storage_key: f.storage_key,
    status: f.status,
    verification_notes: f.verification_notes,
    resubmission_count: f.resubmission_count,
    uploaded_by: f.uploaded_by,
    uploaded_at: f.uploaded_at,
    verified_at: f.verified_at,
    rejected_at: f.rejected_at,
    last_resubmitted_at: f.last_resubmitted_at,
  }));

  const filesApproved = files.filter((f) => f.status === "verified").length;
  const filesRejected = files.filter((f) => f.status === "rejected").length;
  const filesPending = files.filter((f) => f.status === "uploaded").length;
  const filesTotal = files.length || 6;
  const maxResubmissionCount = files.length
    ? Math.max(...files.map((f) => f.resubmission_count || 0))
    : 0;

  return {
    shop: {
      shop_id: shop.shop_id,
      business_name: shop.business_name,
      legal_name: shop.legal_name,
      gst_number: shop.gst_number,
      business_type: shop.business_type,
      address_line_1: shop.address_line_1,
      address_line_2: shop.address_line_2,
      city: shop.city,
      state: shop.state,
      pincode: shop.pincode,
      verification_status: shop.verification_status,
      verification_notes: shop.verification_notes,
      created_at: shop.created_at,
      updated_at: shop.updated_at,
      owner: shop.owner
        ? {
            user_id: shop.owner.user_id,
            full_name: shop.owner.full_name,
            username: shop.owner.username,
            email: shop.owner.email,
            phone_number: shop.owner.phone_number,
          }
        : null,
    },
    files,
    verification_logs: logs.map((log) => ({
      id: log.id,
      file_id: log.file_id,
      action: log.action,
      reason: log.reason,
      actor_type: log.actor_type,
      cadmin_id: log.cadmin_id,
      created_at: log.created_at,
    })),
    summary: {
      files_total: filesTotal,
      files_approved: filesApproved,
      files_rejected: filesRejected,
      files_pending: filesPending,
      max_resubmission_count: maxResubmissionCount,
      shop_verification_status: shop.verification_status,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// VERIFY FILE (Single - lightweight, no shop status update)
// ═══════════════════════════════════════════════════════════════
export async function verifyFile({ file_id, cadmin_id, skipShopUpdate = false }) {
  const file = await prisma.shopFile.findUnique({
    where: { file_id },
  });

  if (!file) {
    const e = new Error("File not found");
    e.status = 404;
    throw e;
  }

  const updated = await prisma.shopFile.update({
    where: { file_id },
    data: {
      status: "verified",
      verification_notes: null,
      verified_at: new Date(),
    },
  });

  await createVerificationLog({
    file_id,
    shop_id: file.shop_id,
    cadmin_id,
    actor_type: "admin",
    action: "verified",
  });

  // Only update shop status if not in batch mode
  if (!skipShopUpdate) {
    const newShopStatus = await updateShopVerificationStatus(file.shop_id);

    if (newShopStatus === "verified") {
      await updateOwnerStatusToVerified(file.shop_id);
      // Fire-and-forget email
      sendVerificationEmail(file.shop_id).catch(console.error);
    }

    return {
      file_id: updated.file_id,
      status: updated.status,
      verified_at: updated.verified_at,
      shop_verification_status: newShopStatus,
    };
  }

  return {
    file_id: updated.file_id,
    status: updated.status,
    verified_at: updated.verified_at,
    shop_id: file.shop_id,
  };
}

// ═══════════════════════════════════════════════════════════════
// REJECT FILE (Single - lightweight, no shop status update)
// ═══════════════════════════════════════════════════════════════
export async function rejectFile({ file_id, cadmin_id, reason, skipShopUpdate = false }) {
  const file = await prisma.shopFile.findUnique({
    where: { file_id },
  });

  if (!file) {
    const e = new Error("File not found");
    e.status = 404;
    throw e;
  }

  const updated = await prisma.shopFile.update({
    where: { file_id },
    data: {
      status: "rejected",
      verification_notes: reason.trim(),
      rejected_at: new Date(),
    },
  });

  await createVerificationLog({
    file_id,
    shop_id: file.shop_id,
    cadmin_id,
    actor_type: "admin",
    action: "rejected",
    reason: reason.trim(),
  });

  // Only update shop status if not in batch mode
  if (!skipShopUpdate) {
    const newShopStatus = await updateShopVerificationStatus(file.shop_id);

    if (newShopStatus === "rejected" || newShopStatus === "partially_rejected") {
      await updateOwnerStatusAfterRejection(file.shop_id, newShopStatus);
    }

    // Fire-and-forget email
    sendRejectionEmail(file.shop_id, reason).catch(console.error);

    return {
      file_id: updated.file_id,
      status: updated.status,
      verification_notes: updated.verification_notes,
      rejected_at: updated.rejected_at,
      shop_verification_status: newShopStatus,
    };
  }

  return {
    file_id: updated.file_id,
    status: updated.status,
    verification_notes: updated.verification_notes,
    rejected_at: updated.rejected_at,
    shop_id: file.shop_id,
  };
}

// ═══════════════════════════════════════════════════════════════
// ✅ NEW: BATCH VERIFY/REJECT FILES (Optimized for bulk operations)
// ═══════════════════════════════════════════════════════════════
export async function batchUpdateFiles({ cadmin_id, verifyIds = [], rejectItems = [] }) {
  if (verifyIds.length === 0 && rejectItems.length === 0) {
    return { updated: 0 };
  }

  let shop_id = null;
  const results = { verified: [], rejected: [] };

  // Use a transaction for atomicity
  await prisma.$transaction(async (tx) => {
    // 1. Batch verify files
    if (verifyIds.length > 0) {
      // Get shop_id from first file
      const firstFile = await tx.shopFile.findUnique({
        where: { file_id: verifyIds[0] },
        select: { shop_id: true },
      });
      shop_id = firstFile?.shop_id;

      // Update all files in one query
      await tx.shopFile.updateMany({
        where: { file_id: { in: verifyIds } },
        data: {
          status: "verified",
          verification_notes: null,
          verified_at: new Date(),
        },
      });

      results.verified = verifyIds;
    }

    // 2. Reject files (need individual updates for different reasons)
    for (const item of rejectItems) {
      const file = await tx.shopFile.findUnique({
        where: { file_id: item.file_id },
        select: { shop_id: true },
      });
      
      if (!shop_id) shop_id = file?.shop_id;

      await tx.shopFile.update({
        where: { file_id: item.file_id },
        data: {
          status: "rejected",
          verification_notes: item.reason.trim(),
          rejected_at: new Date(),
        },
      });

      results.rejected.push(item.file_id);
    }

    // 3. Create verification logs in batch
    const logs = [
      ...verifyIds.map((file_id) => ({
        file_id,
        shop_id,
        cadmin_id,
        actor_type: "admin",
        action: "verified",
        reason: null,
      })),
      ...rejectItems.map((item) => ({
        file_id: item.file_id,
        shop_id,
        cadmin_id,
        actor_type: "admin",
        action: "rejected",
        reason: item.reason.trim(),
      })),
    ];

    if (logs.length > 0) {
      await tx.fileVerificationLog.createMany({ data: logs });
    }
  });

  // 4. Update shop status ONCE (outside transaction for speed)
  if (shop_id) {
    const newShopStatus = await updateShopVerificationStatus(shop_id);

    // Handle user status update
    if (newShopStatus === "verified") {
      await updateOwnerStatusToVerified(shop_id);
      // Fire-and-forget email
      sendVerificationEmail(shop_id).catch(console.error);
    } else if (newShopStatus === "rejected" || newShopStatus === "partially_rejected") {
      await updateOwnerStatusAfterRejection(shop_id, newShopStatus);
      // Send ONE rejection summary email
      const rejectionReasons = rejectItems.map(r => r.reason).join("; ");
      sendRejectionEmail(shop_id, rejectionReasons).catch(console.error);
    }

    return {
      updated: results.verified.length + results.rejected.length,
      verified: results.verified.length,
      rejected: results.rejected.length,
      shop_verification_status: newShopStatus,
    };
  }

  return {
    updated: results.verified.length + results.rejected.length,
    verified: results.verified.length,
    rejected: results.rejected.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function updateShopVerificationStatus(shop_id) {
  const allFiles = await prisma.shopFile.findMany({
    where: { shop_id },
  });

  const filesVerified = allFiles.filter((f) => f.status === "verified").length;
  const filesRejected = allFiles.filter((f) => f.status === "rejected").length;
  const filesTotal = allFiles.length;

  let newStatus = "pending_review";

  if (filesTotal === 0) {
    newStatus = "pending_review";
  } else if (filesVerified === filesTotal) {
    newStatus = "verified";
  } else if (filesRejected === filesTotal) {
    newStatus = "rejected";
  } else if (filesRejected > 0) {
    newStatus = "partially_rejected";
  } else {
    newStatus = "pending_review";
  }

  await prisma.shop.update({
    where: { shop_id },
    data: { verification_status: newStatus },
  });

  return newStatus;
}

async function sendVerificationEmail(shop_id) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      include: { owner: true },
    });

    if (!shop?.owner?.email) return;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background:#f6f7fb;">
        <div style="max-width:600px;margin:0 auto;background:white;padding:24px;border-radius:12px;">
          <h2 style="color:#000060">Congratulations! Your shop is verified</h2>
          <p>Hello ${shop.owner.full_name || shop.owner.email},</p>
          <p>Your shop <strong>${shop.business_name}</strong> has been verified by Cureli. All documents have been approved.</p>
          <p>You can now log in and access the full ERP dashboard.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.USER_FRONTEND_ORIGIN || "http://localhost:5173"}/dashboard" style="background:#000060;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;">Go to Dashboard</a>
          </div>
          <p style="font-size:12px;color:#666">Thank you for using Cureli!</p>
        </div>
      </div>
    `;

    await sendMail(shop.owner.email, "Cureli - Your shop is verified!", html);
  } catch (err) {
    console.error("Failed to send verification email", err);
  }
}

async function sendRejectionEmail(shop_id, reason) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      include: {
        owner: true,
        shopFiles: true,
      },
    });

    if (!shop?.owner?.email) return;

    const summary = shop.shopFiles.reduce(
      (acc, f) => {
        if (f.status === "verified") acc.approved++;
        if (f.status === "rejected") acc.rejected++;
        if (f.status === "uploaded") acc.pending++;
        return acc;
      },
      { approved: 0, rejected: 0, pending: 0 }
    );

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background:#f6f7fb;">
        <div style="max-width:600px;margin:0 auto;background:white;padding:24px;border-radius:12px;">
          <h2 style="color:#cc0000">Document Review Result</h2>
          <p>Hello ${shop.owner.full_name || shop.owner.email},</p>
          <p>The admin has reviewed your documents for <strong>${shop.business_name}</strong>.</p>
          
          <div style="background:#f0f0f0;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:8px 0;"><strong>✓ Approved:</strong> ${summary.approved}</p>
            <p style="margin:8px 0;"><strong>✗ Rejected:</strong> ${summary.rejected}</p>
            <p style="margin:8px 0;"><strong>⏳ Pending:</strong> ${summary.pending}</p>
          </div>

          <p><strong>Reason for rejection:</strong></p>
          <p style="color:#cc0000;font-style:italic;">"${reason}"</p>

          <p>Please log in and review the rejected documents. You can resubmit them for another review.</p>
          
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.USER_FRONTEND_ORIGIN || "http://localhost:5173"}/onboarding?resume_step=documents" style="background:#000060;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;">Review Documents</a>
          </div>
          <p style="font-size:12px;color:#666">If you have any questions, please contact support.</p>
        </div>
      </div>
    `;

    await sendMail(shop.owner.email, "Action Required: Document review feedback", html);
  } catch (err) {
    console.error("Failed to send rejection email", err);
  }
}

export async function createVerificationLog({
  file_id,
  shop_id,
  cadmin_id = null,
  actor_type,
  action,
  reason = null,
  meta = null,
}) {
  return prisma.fileVerificationLog.create({
    data: {
      file_id,
      shop_id,
      cadmin_id,
      actor_type,
      action,
      reason,
      meta,
    },
  });
}


async function updateOwnerStatusToVerified(shop_id) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      select: { owner_user_id: true },
    });

    if (!shop?.owner_user_id) return;

    const user = await prisma.user.findUnique({
      where: { user_id: shop.owner_user_id },
      select: { status: true, first_verified_at: true },
    });

    if (!user || user.status === "verified") return;

    const updateData = {
      status: "verified",
      onboarding_step: 12,
      first_login_after_verification: false,
    };

    // Log for debugging
    if (!user.first_verified_at) {
      console.log("🎉 First-time verification for user:", shop.owner_user_id);
    } else {
      console.log("🔄 Re-verification for user:", shop.owner_user_id);
    }

    await prisma.user.update({
      where: { user_id: shop.owner_user_id },
      data: updateData,
    });

    console.log("✅ User status updated to verified:", shop.owner_user_id);
  } catch (err) {
    console.error("❌ Failed to update owner status:", err);
  }
}
async function updateOwnerStatusAfterRejection(shop_id) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      select: { owner_user_id: true },
    });

    if (!shop?.owner_user_id) return;

    await prisma.user.update({
      where: { user_id: shop.owner_user_id },
      data: {
        status: "pending_verification",
        onboarding_step: 12,
      },
    });

    console.log("✅ Updated user status to pending_verification:", shop.owner_user_id);
  } catch (err) {
    console.error("❌ Failed to update owner status after rejection:", err);
  }
}