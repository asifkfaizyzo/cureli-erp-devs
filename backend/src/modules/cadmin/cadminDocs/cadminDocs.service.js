// backend/src/modules/cadmin/cadminDocs/cadminDocs.service.js

import prisma from "../../../config/prisma.js";
import { sendMail } from "../../../utils/email.js";

/**
 * LIST SHOPS FOR VERIFICATION
 * Returns paginated list of shops with verification status + file counts
 */
export async function listShopsForVerification(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 200);
  const skip = (page - 1) * limit;

  // Build where clause for shops
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

  // Date range filter - Handle both Date objects and strings
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
      where.created_at = {
        ...where.created_at,
        lte: endDate,
      };
    }
  }

  // Sorting
  const orderBy = {};
  if (query.sort_by === "business_name") {
    orderBy.business_name = query.sort_order || "desc";
  } else if (query.sort_by === "owner_name") {
    orderBy.owner = { full_name: query.sort_order || "desc" };
  } else if (query.sort_by === "verification_status") {
    orderBy.verification_status = query.sort_order || "desc";
  } else {
    orderBy.created_at = query.sort_order || "desc";
  }

  // Fetch shops with owner info
  const shops = await prisma.shop.findMany({
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
    orderBy,
    skip,
    take: limit,
  });

  // Count total (for pagination) - before filtering
  const totalBeforeFilter = await prisma.shop.count({ where });

  // Transform shops to include verification summary
  let data = shops.map((shop) => {
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

  // ✅ FIX: Use resubmissionCountMin (camelCase - matching schema)
  const resubMinFilter = Number(query.resubmissionCountMin);
  
  
  if (!isNaN(resubMinFilter) && resubMinFilter > 0) {
    const beforeCount = data.length;
    data = data.filter((shop) => shop.resubmission_count >= resubMinFilter);
    console.log(`🔍 Filtered: ${beforeCount} -> ${data.length} shops (resub >= ${resubMinFilter})`);
  }

  // Sort by resubmission_count if requested
  if (query.sort_by === "resubmission_count") {
    data.sort((a, b) => {
      const diff = a.resubmission_count - b.resubmission_count;
      return query.sort_order === "asc" ? diff : -diff;
    });
  }

  // Calculate totals
  const filteredTotal = (!isNaN(resubMinFilter) && resubMinFilter > 0)
    ? data.length
    : totalBeforeFilter;

  return {
    data,
    meta: {
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.max(Math.ceil(filteredTotal / limit), 1),
    },
  };
}

/**
 * FIND FILE BY ID
 * Simple helper to get file
 */
export async function findFileById(file_id) {
  return prisma.shopFile.findUnique({
    where: { file_id },
  });
}

/**
 * GET SHOP VERIFICATION DETAIL
 * Returns full shop info + all files + verification logs
 * Used for modal display when admin clicks on a shop
 */
export async function getShopVerificationDetail(shop_id) {
  // Fetch shop with owner and all files
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

  // Fetch verification logs
  const logs = await prisma.fileVerificationLog.findMany({
    where: { shop_id },
    orderBy: { created_at: "desc" },
  });

  // Transform shop files
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

  // Calculate summary
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

/**
 * VERIFY FILE
 * Approve a single file
 * Auto-updates shop verification status if all files verified
 */
export async function verifyFile({ file_id, cadmin_id }) {
  const file = await prisma.shopFile.findUnique({
    where: { file_id },
  });

  if (!file) {
    const e = new Error("File not found");
    e.status = 404;
    throw e;
  }

  // Update file to verified
  const updated = await prisma.shopFile.update({
    where: { file_id },
    data: {
      status: "verified",
      verification_notes: null,
      verified_at: new Date(),
    },
  });

  // Create verification log
  await createVerificationLog({
    file_id,
    shop_id: file.shop_id,
    cadmin_id,
    actor_type: "admin",
    action: "verified",
  });

  // Update shop status based on all files
  const newShopStatus = await updateShopVerificationStatus(file.shop_id);

  if (newShopStatus === "verified") {
    await updateOwnerStatusToVerified(file.shop_id);
    await sendVerificationEmail(file.shop_id);
  }
  // If shop fully verified, send email
  if (newShopStatus === "verified") {
    await sendVerificationEmail(file.shop_id);
  }

  return {
    file_id: updated.file_id,
    status: updated.status,
    verified_at: updated.verified_at,
    shop_verification_status: newShopStatus,
  };
}

/**
 * REJECT FILE
 * Reject a single file with a required reason
 * Auto-updates shop verification status
 */
export async function rejectFile({ file_id, cadmin_id, reason }) {
  const file = await prisma.shopFile.findUnique({
    where: { file_id },
  });

  if (!file) {
    const e = new Error("File not found");
    e.status = 404;
    throw e;
  }

  // Update file to rejected
  const updated = await prisma.shopFile.update({
    where: { file_id },
    data: {
      status: "rejected",
      verification_notes: reason.trim(),
      rejected_at: new Date(),
    },
  });

  // Create verification log
  await createVerificationLog({
    file_id,
    shop_id: file.shop_id,
    cadmin_id,
    actor_type: "admin",
    action: "rejected",
    reason: reason.trim(),
  });

  // Update shop status
  const newShopStatus = await updateShopVerificationStatus(file.shop_id);


  if (newShopStatus === "rejected" || newShopStatus === "partially_rejected") {
    await updateOwnerStatusAfterRejection(file.shop_id, newShopStatus);
  }

  // Send rejection email
  await sendRejectionEmail(file.shop_id, reason);

  return {
    file_id: updated.file_id,
    status: updated.status,
    verification_notes: updated.verification_notes,
    rejected_at: updated.rejected_at,
    shop_verification_status: newShopStatus,
  };
}

/**
 * UPDATE SHOP VERIFICATION STATUS
 * Helper to recalculate and update shop status based on file statuses
 */
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

/**
 * SEND VERIFICATION EMAIL
 * Send email when shop is fully verified
 */
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

/**
 * SEND REJECTION EMAIL
 * Send email when a file is rejected
 */
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

/**
 * CREATE VERIFICATION LOG
 * Helper to log all file verification actions
 */
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


/**
 * UPDATE OWNER STATUS TO VERIFIED
 * When shop becomes fully verified, update the owner's user status
 * This allows them to see the success screen on next login
 */
// Add these two new helper functions at the bottom of the file

/**
 * UPDATE OWNER STATUS TO VERIFIED
 * When shop becomes fully verified, update the owner's user status
 */
async function updateOwnerStatusToVerified(shop_id) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      select: { owner_user_id: true },
    });

    if (!shop?.owner_user_id) {
      console.error("❌ No owner found for shop:", shop_id);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: shop.owner_user_id },
      select: { status: true },
    });

    if (!user) {
      console.error("❌ User not found:", shop.owner_user_id);
      return;
    }

    // Only update if not already verified
    if (user.status !== "verified") {
      await prisma.user.update({
        where: { user_id: shop.owner_user_id },
        data: {
          status: "verified",
          onboarding_step: 12,
          first_login_after_verification: false, // Show success screen
        },
      });

      console.log("✅ User status updated to verified:", shop.owner_user_id);
    }
  } catch (err) {
    console.error("❌ Failed to update owner status:", err);
  }
}

/**
 * UPDATE OWNER STATUS AFTER REJECTION
 * Set user back to pending_verification so they can resubmit
 */
async function updateOwnerStatusAfterRejection(shop_id) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      select: { owner_user_id: true },
    });

    if (!shop?.owner_user_id) return;

    // Set user to pending_verification (can resubmit docs)
    await prisma.user.update({
      where: { user_id: shop.owner_user_id },
      data: {
        status: "pending_verification", // ✅ Changed from "pending_setup"
        onboarding_step: 12, // Stay on verification step
      },
    });

    console.log("✅ [Service] Updated user status to pending_verification:", shop.owner_user_id);
  } catch (err) {
    console.error("❌ [Service] Failed to update owner status after rejection:", err);
  }
}

