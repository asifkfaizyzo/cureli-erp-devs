import prisma from "../../../config/prisma.js";
import { sendMail } from "../../../utils/email.js";

/**
 * Fetch files with optional filters and pagination
 */
export async function findFiles({ status, limit = 20, offset = 0, q } = {}) {
  const where = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { original_name: { contains: q, mode: "insensitive" } },
      { file_type: { contains: q, mode: "insensitive" } },
    ];
  }

  const files = await prisma.shopFile.findMany({
    where,
    include: { shop: true, user: true },
    orderBy: { uploaded_at: "desc" },
    take: Number(limit),
    skip: Number(offset),
  });

  return files;
}

export async function findFileById(file_id) {
  return prisma.shopFile.findUnique({
    where: { file_id },
    include: { shop: true, user: true },
  });
}

export async function createLog({
  file_id,
  shop_id,
  cadmin_id = null,
  actor_type,
  action,
  reason = null,
  meta = null,
}) {
  return prisma.fileVerificationLog.create({
    data: { file_id, shop_id, cadmin_id, actor_type, action, reason, meta },
  });
}

/**
 * Mark file as verified by C-Admin.
 * Also runs shop auto-verify check (if all files for the shop are verified -> shop.verification_status = "verified")
 */
export async function markVerified({ file_id, cadmin_id }) {
  const file = await prisma.shopFile.update({
    where: { file_id },
    data: {
      status: "verified",
      verification_notes: null,
      verified_at: new Date(),
    },
  });

  await createLog({
    file_id,
    shop_id: file.shop_id,
    cadmin_id,
    actor_type: "admin",
    action: "verified",
  });

  // check if all files for shop are verified
  const pending = await prisma.shopFile.count({
    where: { shop_id: file.shop_id, status: { in: ["uploaded", "rejected"] } },
  });

  if (pending === 0) {
    // mark shop verified
    await prisma.shop.update({
      where: { shop_id: file.shop_id },
      data: { verification_status: "verified", verification_notes: null },
    });

    // create system log
    await createLog({
      file_id: file.file_id,
      shop_id: file.shop_id,
      actor_type: "system",
      action: "shop_verified",
      reason: "All files verified",
    });

    // email owner
    try {
      const shop = await prisma.shop.findUnique({
        where: { shop_id: file.shop_id },
        include: { owner: true },
      });
      if (shop?.owner?.email) {
        const html = `<p>Your shop <strong>${shop.business_name}</strong> has been verified by Cureli. You can now access the dashboard.</p>`;
        await sendMail(shop.owner.email, "Cureli - Shop Verified", html);
      }
    } catch (err) {
      console.error("Failed to send shop verified email", err);
    }
  }

  return file;
}

/**
 * Mark file as rejected. Reason required.
 */
export async function markRejected({ file_id, cadmin_id, reason }) {
  const file = await prisma.shopFile.update({
    where: { file_id },
    data: { status: "rejected", verification_notes: reason },
  });

  await createLog({
    file_id,
    shop_id: file.shop_id,
    cadmin_id,
    actor_type: "admin",
    action: "rejected",
    reason,
  });

  // notify owner with summary email (aggregate counts)
  try {
    const shop = await prisma.shop.findUnique({
      where: { shop_id: file.shop_id },
      include: { owner: true },
    });
    if (shop?.owner?.email) {
      // prepare counts
      const counts = await prisma.shopFile.groupBy({
        by: ["status"],
        where: { shop_id: file.shop_id },
        _count: {
          _all: true,
        },
      });

      const statusCounts = counts.reduce((acc, row) => {
        acc[row.status] = row._count._all;
        return acc;
      }, {});
      const rejectedCount = statusCounts["rejected"] || 1;
      const uploadedCount = statusCounts["uploaded"] || 0;
      const verifiedCount = statusCounts["verified"] || 0;

      const html = `
        <p>Hello,</p>
        <p>The admin reviewed your documents for <strong>${shop.business_name}</strong>.</p>
        <ul>
          <li>Verified: ${verifiedCount}</li>
          <li>Pending: ${uploadedCount}</li>
          <li>Rejected: ${rejectedCount}</li>
        </ul>
        <p>One or more documents were rejected. Reason for this document: <em>${reason}</em></p>
        <p>Please log in and resubmit the rejected document(s): <a href="${process.env.USER_FRONTEND_ORIGIN}/onboarding?resume_step=12">Resubmit documents</a></p>
      `;
      await sendMail(
        shop.owner.email,
        "Action required: Document review result",
        html
      );
    }
  } catch (err) {
    console.error("Failed to send rejection summary email", err);
  }

  return file;
}
