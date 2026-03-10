// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js

import prisma from "../../../../config/prisma.js";
import { sendMail, mailer } from "../../../../utils/email.js";
import { convertPlainTextToHtml } from "./emailBroadcast.converter.js";
import * as fileStorage from "../../../../services/fileStorage.service.js";
import {
  buildEmailHtml,
  formatAttachmentsForNodemailer,
} from "./emailBroadcast.template.js";
import {
  getRemainingCapacity,
  canSendEmails,
  incrementSentCount,
  shouldPauseSending,
  getNextAvailableTime,
} from "./emailBroadcast.quota.js";
import {
  resolveRecipients,
  previewRecipients,
  getShopsForFilter,
  getActivePlans,
  getCAdminRoles,
} from "./emailBroadcast.recipients.js";
import {
  buildUnsubscribeUrl,
  filterUnsubscribedRecipients,
} from "./emailBroadcast.unsubscribe.js";

// ============================================
// CONSTANTS
// ============================================

const FOLDER = "email_attachments";
const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1000;

// ✅ NEW: Default email sender info
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || "Cureli Health";
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || "info@curelihealth.com";
const DEFAULT_REPLY_TO = process.env.EMAIL_REPLY_TO || "support@curelihealth.com";

const CAMPAIGN_STATUS = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  SENDING: "SENDING",
  PAUSED: "PAUSED",
  SENT: "SENT",
  PARTIAL_FAILURE: "PARTIAL_FAILURE",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

// ============================================
// FILE HELPER FUNCTIONS — S3 VERSION
// ============================================

async function deleteEmailAttachment(filename) {
  if (!filename) return false;

  try {
    return await fileStorage.deleteFile({ folder: FOLDER, filename });
  } catch (error) {
    console.warn(
      `[Email Broadcast] Failed to delete attachment: ${filename}`,
      error.message
    );
    return false;
  }
}

async function deleteEmailAttachments(filenames) {
  if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
    return { deleted: 0, failed: 0 };
  }

  const files = filenames
    .filter((f) => f)
    .map((filename) => ({ folder: FOLDER, filename }));

  return await fileStorage.deleteFiles(files);
}

async function getEmailAttachmentUrl(filename) {
  if (!filename) return null;

  try {
    return await fileStorage.getSignedUrl({
      folder: FOLDER,
      filename,
      expiresIn: 3600,
    });
  } catch (error) {
    console.warn(
      `[Email Broadcast] Failed to get URL for: ${filename}`,
      error.message
    );
    return null;
  }
}

async function deleteEmailCampaignFiles(campaignId) {
  const campaign = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
    select: {
      inline_image: true,
      attachments: true,
    },
  });

  if (!campaign) return { deleted: 0, failed: 0 };

  const filesToDelete = [];

  if (campaign.inline_image?.filename) {
    filesToDelete.push({
      folder: FOLDER,
      filename: campaign.inline_image.filename,
    });
  }

  if (campaign.attachments && Array.isArray(campaign.attachments)) {
    campaign.attachments.forEach((att) => {
      if (att?.filename) {
        filesToDelete.push({
          folder: FOLDER,
          filename: att.filename,
        });
      }
    });
  }

  if (filesToDelete.length === 0) {
    return { deleted: 0, failed: 0 };
  }

  return await fileStorage.deleteFiles(filesToDelete);
}

// ============================================
// PREVIEW RECIPIENTS
// ============================================

export async function previewRecipientCount(data) {
  try {
    const { target_filters, target_users, target_cadmins } = data;

    const preview = await previewRecipients(
      target_filters,
      target_users,
      target_cadmins
    );

    const quota = await getRemainingCapacity();

    return {
      ...preview,
      quota: {
        remaining: quota.remaining,
        used: quota.used,
        limit: quota.limit,
        can_send_all: quota.remaining >= preview.total_after_unsubscribe,
      },
    };
  } catch (error) {
    console.error("[Email Broadcast] Preview failed:", error);
    throw error;
  }
}

// ============================================
// CREATE DRAFT
// ============================================

export async function createDraft(data, context) {
  try {
    const {
      subject,
      message_text,
      target_filters,
      target_users,
      target_cadmins,
      inline_image,
      attachments,
      action_url,
      action_label,
    } = data;

    // Convert plain text to HTML
    const body_html = convertPlainTextToHtml(message_text);

    // Calculate recipient count
    const preview = await previewRecipients(
      target_filters,
      target_users,
      target_cadmins
    );

    // ✅ FIXED: Use correct field names matching Prisma schema
    const campaign = await prisma.emailBroadcastCampaign.create({
      data: {
        subject,
        body_html,                          // ✅ Changed from message_html
        body_text: message_text,            // ✅ Changed from message_text
        from_name: DEFAULT_FROM_NAME,       // ✅ Added required field
        from_email: DEFAULT_FROM_EMAIL,     // ✅ Added required field
        reply_to: DEFAULT_REPLY_TO,         // ✅ Added optional field
        target_filters: target_filters || {},
        target_users: target_users ?? true,
        target_cadmins: target_cadmins ?? false,
        inline_image: inline_image || null,
        attachments: attachments || [],
        action_url: action_url || null,
        action_label: action_label || null,
        recipient_count: preview.total_after_unsubscribe,
        status: CAMPAIGN_STATUS.DRAFT,
        created_by_cadmin: context.actor_id,
        cadmin_name: context.actor_name,
      },
    });

    console.log(`[Email Broadcast] Draft created: ${campaign.campaign_id}`);

    return {
      campaign_id: campaign.campaign_id,
      subject: campaign.subject,
      status: campaign.status,
      recipient_count: campaign.recipient_count,
      created_at: campaign.created_at,
    };
  } catch (error) {
    console.error("[Email Broadcast] Create draft failed:", error);
    throw error;
  }
}

// ============================================
// UPDATE DRAFT
// ============================================

export async function updateDraft(campaignId, data, context) {
  try {
    const existing = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      const error = new Error("Campaign not found");
      error.status = 404;
      throw error;
    }

    if (
      ![CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED].includes(
        existing.status
      )
    ) {
      const error = new Error(
        `Cannot edit campaign with status: ${existing.status}`
      );
      error.status = 400;
      throw error;
    }

    const updateData = {};

    if (data.subject !== undefined) {
      updateData.subject = data.subject;
    }

    // ✅ FIXED: Use correct field names
    if (data.message_text !== undefined) {
      updateData.body_text = data.message_text;
      updateData.body_html = convertPlainTextToHtml(data.message_text);
    }

    if (data.target_filters !== undefined) {
      updateData.target_filters = data.target_filters;
    }

    if (data.target_users !== undefined) {
      updateData.target_users = data.target_users;
    }

    if (data.target_cadmins !== undefined) {
      updateData.target_cadmins = data.target_cadmins;
    }

    if (data.inline_image !== undefined) {
      if (
        existing.inline_image?.filename &&
        existing.inline_image.filename !== data.inline_image?.filename
      ) {
        await deleteEmailAttachment(existing.inline_image.filename);
      }
      updateData.inline_image = data.inline_image;
    }

    if (data.attachments !== undefined) {
      const oldFilenames = (existing.attachments || []).map((a) => a.filename);
      const newFilenames = (data.attachments || []).map((a) => a.filename);
      const removedFilenames = oldFilenames.filter(
        (f) => f && !newFilenames.includes(f)
      );
      await deleteEmailAttachments(removedFilenames);

      updateData.attachments = data.attachments;
    }

    if (data.action_url !== undefined) {
      updateData.action_url = data.action_url;
    }

    if (data.action_label !== undefined) {
      updateData.action_label = data.action_label;
    }

    const filtersChanged =
      data.target_filters !== undefined ||
      data.target_users !== undefined ||
      data.target_cadmins !== undefined;

    if (filtersChanged) {
      const preview = await previewRecipients(
        updateData.target_filters || existing.target_filters,
        updateData.target_users ?? existing.target_users,
        updateData.target_cadmins ?? existing.target_cadmins
      );
      updateData.recipient_count = preview.total_after_unsubscribe;
    }

    const updated = await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: updateData,
    });

    console.log(`[Email Broadcast] Draft updated: ${campaignId}`);

    return {
      campaign_id: updated.campaign_id,
      subject: updated.subject,
      status: updated.status,
      recipient_count: updated.recipient_count,
      updated_at: updated.updated_at,
    };
  } catch (error) {
    console.error("[Email Broadcast] Update draft failed:", error);
    throw error;
  }
}

// ============================================
// SCHEDULE CAMPAIGN
// ============================================

export async function scheduleCampaign(campaignId, scheduledFor, context) {
  try {
    const existing = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      const error = new Error("Campaign not found");
      error.status = 404;
      throw error;
    }

    if (
      ![CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED].includes(
        existing.status
      )
    ) {
      const error = new Error(
        `Cannot schedule campaign with status: ${existing.status}`
      );
      error.status = 400;
      throw error;
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      const error = new Error("Scheduled time must be in the future");
      error.status = 400;
      throw error;
    }

    const updated = await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: CAMPAIGN_STATUS.SCHEDULED,
        scheduled_for: scheduledDate,
      },
    });

    console.log(
      `[Email Broadcast] Campaign ${campaignId} scheduled for ${scheduledFor}`
    );

    return {
      campaign_id: updated.campaign_id,
      subject: updated.subject,
      status: updated.status,
      scheduled_for: updated.scheduled_for,
      recipient_count: updated.recipient_count,
    };
  } catch (error) {
    console.error("[Email Broadcast] Schedule failed:", error);
    throw error;
  }
}

// ============================================
// SEND IMMEDIATELY
// ============================================

export async function sendImmediate(data, context) {
  try {
    const {
      subject,
      message_text,
      target_filters,
      target_users,
      target_cadmins,
      inline_image,
      attachments,
      action_url,
      action_label,
    } = data;

    // Convert plain text to HTML
    const body_html = convertPlainTextToHtml(message_text);

    // Resolve recipients
    const recipients = await resolveRecipients(
      target_filters,
      target_users,
      target_cadmins,
      true
    );

    if (recipients.length === 0) {
      const error = new Error("No recipients found for the selected filters");
      error.status = 400;
      throw error;
    }

    // Check quota
    const quotaCheck = await canSendEmails(recipients.length);
    if (!quotaCheck.canSend) {
      console.log(
        `[Email Broadcast] Quota check: need ${recipients.length}, have ${quotaCheck.available}`
      );
    }

    // ✅ FIXED: Use correct field names matching Prisma schema
    const campaign = await prisma.emailBroadcastCampaign.create({
      data: {
        subject,
        body_html,                          // ✅ Changed from message_html
        body_text: message_text,            // ✅ Changed from message_text
        from_name: DEFAULT_FROM_NAME,       // ✅ Added required field
        from_email: DEFAULT_FROM_EMAIL,     // ✅ Added required field
        reply_to: DEFAULT_REPLY_TO,         // ✅ Added optional field
        target_filters: target_filters || {},
        target_users: target_users ?? true,
        target_cadmins: target_cadmins ?? false,
        inline_image: inline_image || null,
        attachments: attachments || [],
        action_url: action_url || null,
        action_label: action_label || null,
        recipient_count: recipients.length,
        status: CAMPAIGN_STATUS.SENDING,
        processing: true,
        processing_started_at: new Date(),
        created_by_cadmin: context.actor_id,
        cadmin_name: context.actor_name,
      },
    });

    // Start async sending (don't await)
    processCampaignSending(campaign.campaign_id).catch((err) => {
      console.error(
        `[Email Broadcast] Async sending failed for ${campaign.campaign_id}:`,
        err
      );
    });

    return {
      campaign_id: campaign.campaign_id,
      status: CAMPAIGN_STATUS.SENDING,
      recipient_count: recipients.length,
      message: "Emails are being sent in the background",
    };
  } catch (error) {
    console.error("[Email Broadcast] Send immediate failed:", error);
    throw error;
  }
}

// ============================================
// SEND TEST EMAIL
// ============================================

export async function sendTestEmail(data, context) {
  try {
    const {
      subject,
      message_text,
      inline_image,
      attachments,
      action_url,
      action_label,
    } = data;

    // Get CAdmin's email
    const cadmin = await prisma.cAdmin.findUnique({
      where: { cadmin_id: context.actor_id },
      select: { email: true, name: true },
    });

    if (!cadmin || !cadmin.email) {
      const error = new Error("CAdmin email not found");
      error.status = 400;
      throw error;
    }

    // Convert plain text to HTML
    const body_html = convertPlainTextToHtml(message_text);

    // Resolve attachment URLs for nodemailer
    let resolvedInlineImage = inline_image;
    let resolvedAttachments = attachments || [];

    if (inline_image?.filename) {
      const signedUrl = await getEmailAttachmentUrl(inline_image.filename);
      resolvedInlineImage = { ...inline_image, url: signedUrl || inline_image.url };
    }

    if (attachments && attachments.length > 0) {
      resolvedAttachments = await Promise.all(
        attachments.map(async (att) => {
          if (att?.filename) {
            const signedUrl = await getEmailAttachmentUrl(att.filename);
            return { ...att, url: signedUrl || att.url };
          }
          return att;
        })
      );
    }

    // Build email HTML
    const html = buildEmailHtml({
      subject,
      messageHtml: body_html,
      recipientName: cadmin.name,
      inlineImage: resolvedInlineImage,
      attachments: resolvedAttachments,
      actionUrl: action_url,
      actionLabel: action_label,
      unsubscribeUrl: null,
      isTest: true,
    });

    // Format attachments for Nodemailer
    const nodemailerAttachments = formatAttachmentsForNodemailer(
      resolvedInlineImage,
      resolvedAttachments
    );

    // Send email
    await mailer.sendMail({
      from: `"${DEFAULT_FROM_NAME}" <${DEFAULT_FROM_EMAIL}>`,
      to: cadmin.email,
      subject: `[TEST] ${subject}`,
      html: html,
      attachments: nodemailerAttachments,
    });

    console.log(`[Email Broadcast] Test email sent to ${cadmin.email}`);

    return {
      success: true,
      sent_to: cadmin.email,
      message: "Test email sent successfully",
    };
  } catch (error) {
    console.error("[Email Broadcast] Test email failed:", error);
    throw error;
  }
}

// ============================================
// CANCEL CAMPAIGN
// ============================================

export async function cancelCampaign(campaignId, context) {
  try {
    const existing = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      const error = new Error("Campaign not found");
      error.status = 404;
      throw error;
    }

    if (
      ![CAMPAIGN_STATUS.SCHEDULED, CAMPAIGN_STATUS.PAUSED].includes(
        existing.status
      )
    ) {
      const error = new Error(
        `Cannot cancel campaign with status: ${existing.status}`
      );
      error.status = 400;
      throw error;
    }

    const deleteResult = await deleteEmailCampaignFiles(campaignId);
    console.log(
      `[Email Broadcast] Deleted ${deleteResult.deleted} files for cancelled campaign ${campaignId}`
    );

    const updated = await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: CAMPAIGN_STATUS.CANCELLED,
        processing: false,
      },
    });

    console.log(`[Email Broadcast] Campaign ${campaignId} cancelled`);

    return {
      campaign_id: updated.campaign_id,
      status: updated.status,
      action: "cancelled",
      files_deleted: deleteResult.deleted,
    };
  } catch (error) {
    console.error("[Email Broadcast] Cancel failed:", error);
    throw error;
  }
}

// ============================================
// DELETE DRAFT
// ============================================

export async function deleteDraft(campaignId, context) {
  try {
    const existing = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      const error = new Error("Campaign not found");
      error.status = 404;
      throw error;
    }

    if (existing.status !== CAMPAIGN_STATUS.DRAFT) {
      const error = new Error("Can only delete draft campaigns");
      error.status = 400;
      throw error;
    }

    const deleteResult = await deleteEmailCampaignFiles(campaignId);
    console.log(
      `[Email Broadcast] Deleted ${deleteResult.deleted} files for campaign ${campaignId}`
    );

    await prisma.emailBroadcastCampaign.delete({
      where: { campaign_id: campaignId },
    });

    console.log(`[Email Broadcast] Draft ${campaignId} deleted`);

    return {
      campaign_id: campaignId,
      action: "deleted",
      files_deleted: deleteResult.deleted,
    };
  } catch (error) {
    console.error("[Email Broadcast] Delete draft failed:", error);
    throw error;
  }
}

// ============================================
// LIST ENDPOINTS
// ============================================

export async function getDrafts(pagination = {}) {
  const { page = 1, limit = 10, search = "" } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    status: CAMPAIGN_STATUS.DRAFT,
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" } },
        { cadmin_name: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [drafts, total] = await Promise.all([
    prisma.emailBroadcastCampaign.findMany({
      where,
      orderBy: { updated_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.emailBroadcastCampaign.count({ where }),
  ]);

  // ✅ Map to expected format for frontend
  const mappedDrafts = drafts.map((draft) => ({
    ...draft,
    message_text: draft.body_text,
    message_html: draft.body_html,
  }));

  return {
    drafts: mappedDrafts,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function getScheduled(pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    status: { in: [CAMPAIGN_STATUS.SCHEDULED, CAMPAIGN_STATUS.PAUSED] },
  };

  const [scheduled, total] = await Promise.all([
    prisma.emailBroadcastCampaign.findMany({
      where,
      orderBy: { scheduled_for: "asc" },
      skip,
      take: limit,
    }),
    prisma.emailBroadcastCampaign.count({ where }),
  ]);

  const scheduledWithMeta = scheduled.map((item) => ({
    ...item,
    message_text: item.body_text,
    message_html: item.body_html,
    time_until: item.scheduled_for ? getTimeUntil(item.scheduled_for) : null,
  }));

  return {
    scheduled: scheduledWithMeta,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function getHistory(pagination = {}) {
  const { page = 1, limit = 10, search = "" } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    status: {
      in: [
        CAMPAIGN_STATUS.SENT,
        CAMPAIGN_STATUS.PARTIAL_FAILURE,
        CAMPAIGN_STATUS.FAILED,
        CAMPAIGN_STATUS.CANCELLED,
      ],
    },
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" } },
        { cadmin_name: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [history, total] = await Promise.all([
    prisma.emailBroadcastCampaign.findMany({
      where,
      orderBy: { sent_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.emailBroadcastCampaign.count({ where }),
  ]);

  const historyWithStats = history.map((item) => ({
    ...item,
    message_text: item.body_text,
    message_html: item.body_html,
    delivery_rate:
      item.recipient_count > 0
        ? Math.round((item.delivered_count / item.recipient_count) * 100)
        : 0,
  }));

  return {
    history: historyWithStats,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function getCampaignById(campaignId) {
  const campaign = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
  });

  if (!campaign) {
    const error = new Error("Campaign not found");
    error.status = 404;
    throw error;
  }

  // ✅ Map to expected format
  return {
    ...campaign,
    message_text: campaign.body_text,
    message_html: campaign.body_html,
  };
}

// ============================================
// QUOTA INFO
// ============================================

export async function getQuotaStatus() {
  const capacity = await getRemainingCapacity();

  return {
    date: capacity.date,
    used: capacity.used,
    remaining: capacity.remaining,
    limit: capacity.limit,
    can_send: capacity.canSend,
    usage_percent: Math.round((capacity.used / capacity.limit) * 100),
  };
}

// ============================================
// FILTER OPTIONS
// ============================================

export { getShopsForFilter, getActivePlans, getCAdminRoles };

// ============================================
// INTERNAL: Campaign Sending Processor
// ============================================

export async function processCampaignSending(campaignId) {
  console.log(`[Email Broadcast] Starting to process campaign ${campaignId}`);

  try {
    const campaign = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const allRecipients = await resolveRecipients(
      campaign.target_filters,
      campaign.target_users,
      campaign.target_cadmins,
      true
    );

    if (allRecipients.length === 0) {
      await prisma.emailBroadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: {
          status: CAMPAIGN_STATUS.FAILED,
          processing: false,
          last_error: "No recipients found",
        },
      });
      return;
    }

    const startIndex = campaign.last_processed_index || 0;
    const recipients = allRecipients.slice(startIndex);

    let delivered = campaign.delivered_count || 0;
    let failed = campaign.failed_count || 0;
    let processedIndex = startIndex;

    // Process in batches
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const shouldPause = await shouldPauseSending();
      if (shouldPause) {
        console.log(
          `[Email Broadcast] Pausing campaign ${campaignId} - daily quota exhausted`
        );

        await prisma.emailBroadcastCampaign.update({
          where: { campaign_id: campaignId },
          data: {
            status: CAMPAIGN_STATUS.PAUSED,
            processing: false,
            last_processed_index: processedIndex,
            delivered_count: delivered,
            failed_count: failed,
          },
        });

        return { paused: true, delivered, failed };
      }

      const batch = recipients.slice(i, i + BATCH_SIZE);

      const capacity = await getRemainingCapacity();
      const canSend = Math.min(batch.length, capacity.remaining);

      if (canSend === 0) {
        await prisma.emailBroadcastCampaign.update({
          where: { campaign_id: campaignId },
          data: {
            status: CAMPAIGN_STATUS.PAUSED,
            processing: false,
            last_processed_index: processedIndex,
          },
        });
        return { paused: true, delivered, failed };
      }

      const batchToSend = batch.slice(0, canSend);

      const batchResults = await sendBatch(campaign, batchToSend);

      delivered += batchResults.delivered;
      failed += batchResults.failed;
      processedIndex += batchToSend.length;

      await incrementSentCount(batchToSend.length);

      await prisma.emailBroadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: {
          delivered_count: delivered,
          failed_count: failed,
          last_processed_index: processedIndex,
        },
      });

      if (i + BATCH_SIZE < recipients.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    let finalStatus = CAMPAIGN_STATUS.SENT;
    if (delivered === 0) {
      finalStatus = CAMPAIGN_STATUS.FAILED;
    } else if (failed > 0) {
      finalStatus = CAMPAIGN_STATUS.PARTIAL_FAILURE;
    }

    await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: finalStatus,
        processing: false,
        sent_at: new Date(),
        completed_at: new Date(),
        delivered_count: delivered,
        failed_count: failed,
        last_processed_index: processedIndex,
      },
    });

    console.log(
      `[Email Broadcast] Campaign ${campaignId} completed: ${delivered} delivered, ${failed} failed`
    );

    return { delivered, failed, status: finalStatus };
  } catch (error) {
    console.error(
      `[Email Broadcast] Processing failed for ${campaignId}:`,
      error
    );

    await prisma.emailBroadcastCampaign
      .update({
        where: { campaign_id: campaignId },
        data: {
          status: CAMPAIGN_STATUS.FAILED,
          processing: false,
          last_error: error.message,
        },
      })
      .catch(() => {});

    throw error;
  }
}

/**
 * Send a batch of emails
 */
async function sendBatch(campaign, recipients) {
  let delivered = 0;
  let failed = 0;

  // Resolve attachment URLs once for the batch
  let resolvedInlineImage = campaign.inline_image;
  let resolvedAttachments = campaign.attachments || [];

  if (campaign.inline_image?.filename) {
    const signedUrl = await getEmailAttachmentUrl(campaign.inline_image.filename);
    resolvedInlineImage = { ...campaign.inline_image, url: signedUrl || campaign.inline_image.url };
  }

  if (campaign.attachments && campaign.attachments.length > 0) {
    resolvedAttachments = await Promise.all(
      campaign.attachments.map(async (att) => {
        if (att?.filename) {
          const signedUrl = await getEmailAttachmentUrl(att.filename);
          return { ...att, url: signedUrl || att.url };
        }
        return att;
      })
    );
  }

  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      try {
        const unsubscribeUrl = buildUnsubscribeUrl(recipient.email);

        // ✅ Use body_html from campaign
        const html = buildEmailHtml({
          subject: campaign.subject,
          messageHtml: campaign.body_html,
          recipientName: recipient.name,
          inlineImage: resolvedInlineImage,
          attachments: resolvedAttachments,
          actionUrl: campaign.action_url,
          actionLabel: campaign.action_label,
          unsubscribeUrl: unsubscribeUrl,
          isTest: false,
        });

        const nodemailerAttachments = formatAttachmentsForNodemailer(
          resolvedInlineImage,
          resolvedAttachments
        );

        await mailer.sendMail({
          from: `"${campaign.from_name || DEFAULT_FROM_NAME}" <${campaign.from_email || DEFAULT_FROM_EMAIL}>`,
          to: recipient.email,
          subject: campaign.subject,
          html: html,
          attachments: nodemailerAttachments,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        return { success: true, email: recipient.email };
      } catch (err) {
        console.error(
          `[Email Broadcast] Failed to send to ${recipient.email}:`,
          err.message
        );
        return { success: false, email: recipient.email, error: err.message };
      }
    })
  );

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.success) {
      delivered++;
    } else {
      failed++;
    }
  });

  return { delivered, failed };
}

// ============================================
// HELPERS
// ============================================

function getTimeUntil(dateString) {
  const scheduled = new Date(dateString);
  const now = new Date();
  const diffMs = scheduled - now;

  if (diffMs < 0) return "Sending soon...";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 1) return `in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  if (hours < 24)
    return `in ${hours} hour${hours !== 1 ? "s" : ""}, ${minutes} min`;

  const days = Math.floor(hours / 24);
  return `in ${days} day${days !== 1 ? "s" : ""}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  previewRecipientCount,
  createDraft,
  updateDraft,
  scheduleCampaign,
  sendImmediate,
  sendTestEmail,
  cancelCampaign,
  deleteDraft,
  getDrafts,
  getScheduled,
  getHistory,
  getCampaignById,
  getQuotaStatus,
  getShopsForFilter,
  getActivePlans,
  getCAdminRoles,
  processCampaignSending,
};