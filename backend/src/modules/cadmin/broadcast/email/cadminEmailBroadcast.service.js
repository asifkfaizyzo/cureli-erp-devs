// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js

import prisma from '../../../../config/prisma.js';
import { sendMail, mailer } from '../../../../utils/email.js';
import { convertPlainTextToHtml } from './emailBroadcast.converter.js';
import { buildEmailHtml, formatAttachmentsForNodemailer } from './emailBroadcast.template.js';
import { 
  getRemainingCapacity, 
  canSendEmails, 
  incrementSentCount,
  shouldPauseSending,
  getNextAvailableTime,
} from './emailBroadcast.quota.js';
import { 
  resolveRecipients, 
  previewRecipients,
  getShopsForFilter,
  getActivePlans,
  getCAdminRoles,
} from './emailBroadcast.recipients.js';
import { 
  buildUnsubscribeUrl,
  filterUnsubscribedRecipients,
} from './emailBroadcast.unsubscribe.js';
import {
  deleteEmailAttachment,
  deleteEmailAttachments,
  getEmailAttachmentPath,
} from '../../../../config/multerEmailBroadcast.js';
import path from 'path';
import fs from 'fs';

// ============================================
// CONSTANTS
// ============================================

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1000; // 1 second between batches

const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  PAUSED: 'paused',
  SENT: 'sent',
  PARTIAL_FAILURE: 'partial_failure',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// ============================================
// PREVIEW RECIPIENTS
// ============================================

/**
 * Preview recipient count and breakdown
 */
export async function previewRecipientCount(data) {
  try {
    const { target_filters, target_users, target_cadmins } = data;

    const preview = await previewRecipients(
      target_filters,
      target_users,
      target_cadmins
    );

    // Get quota info
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
    console.error('[Email Broadcast] Preview failed:', error);
    throw error;
  }
}

// ============================================
// CREATE DRAFT
// ============================================

/**
 * Create a new email broadcast draft
 */
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
    const message_html = convertPlainTextToHtml(message_text);

    // Calculate recipient count
    const preview = await previewRecipients(
      target_filters,
      target_users,
      target_cadmins
    );

    // Create campaign
    const campaign = await prisma.emailBroadcastCampaign.create({
      data: {
        subject,
        message_text,
        message_html,
        target_filters: target_filters || {},
        target_users: target_users ?? true,
        target_cadmins: target_cadmins ?? false,
        inline_image: inline_image || null,
        attachments: attachments || [],
        action_url: action_url || null,
        action_label: action_label || null,
        recipient_count: preview.total_after_unsubscribe,
        status: CAMPAIGN_STATUS.DRAFT,
        created_by: context.actor_id,
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
    console.error('[Email Broadcast] Create draft failed:', error);
    throw error;
  }
}

// ============================================
// UPDATE DRAFT
// ============================================

/**
 * Update an existing draft or scheduled campaign
 */
export async function updateDraft(campaignId, data, context) {
  try {
    // Get existing campaign
    const existing = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      const error = new Error('Campaign not found');
      error.status = 404;
      throw error;
    }

    // Can only edit draft or scheduled campaigns
    if (![CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED].includes(existing.status)) {
      const error = new Error(`Cannot edit campaign with status: ${existing.status}`);
      error.status = 400;
      throw error;
    }

    // Build update data
    const updateData = {};

    if (data.subject !== undefined) {
      updateData.subject = data.subject;
    }

    if (data.message_text !== undefined) {
      updateData.message_text = data.message_text;
      updateData.message_html = convertPlainTextToHtml(data.message_text);
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
      // If changing inline image, delete old one
      if (existing.inline_image?.filename && 
          existing.inline_image.filename !== data.inline_image?.filename) {
        deleteEmailAttachment(existing.inline_image.filename);
      }
      updateData.inline_image = data.inline_image;
    }

    if (data.attachments !== undefined) {
      // Clean up removed attachments
      const oldFilenames = (existing.attachments || []).map(a => a.filename);
      const newFilenames = (data.attachments || []).map(a => a.filename);
      const removedFilenames = oldFilenames.filter(f => f && !newFilenames.includes(f));
      deleteEmailAttachments(removedFilenames);
      
      updateData.attachments = data.attachments;
    }

    if (data.action_url !== undefined) {
      updateData.action_url = data.action_url;
    }

    if (data.action_label !== undefined) {
      updateData.action_label = data.action_label;
    }

    // Recalculate recipient count if filters changed
    const filtersChanged = data.target_filters !== undefined || 
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

    // Update campaign
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
    console.error('[Email Broadcast] Update draft failed:', error);
    throw error;
  }
}

// ============================================
// SCHEDULE CAMPAIGN
// ============================================

/**
 * Schedule a campaign for future sending
 */
export async function scheduleCampaign(campaignId, scheduledFor, context) {
  try {
    const existing = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      const error = new Error('Campaign not found');
      error.status = 404;
      throw error;
    }

    if (![CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED].includes(existing.status)) {
      const error = new Error(`Cannot schedule campaign with status: ${existing.status}`);
      error.status = 400;
      throw error;
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      const error = new Error('Scheduled time must be in the future');
      error.status = 400;
      throw error;
    }

    // Update campaign
    const updated = await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: CAMPAIGN_STATUS.SCHEDULED,
        scheduled_for: scheduledDate,
      },
    });

    console.log(`[Email Broadcast] Campaign ${campaignId} scheduled for ${scheduledFor}`);

    return {
      campaign_id: updated.campaign_id,
      subject: updated.subject,
      status: updated.status,
      scheduled_for: updated.scheduled_for,
      recipient_count: updated.recipient_count,
    };
  } catch (error) {
    console.error('[Email Broadcast] Schedule failed:', error);
    throw error;
  }
}

// ============================================
// SEND IMMEDIATELY
// ============================================

/**
 * Send campaign immediately (async processing)
 */
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
    const message_html = convertPlainTextToHtml(message_text);

    // Resolve recipients
    const recipients = await resolveRecipients(
      target_filters,
      target_users,
      target_cadmins,
      true // exclude unsubscribed
    );

    if (recipients.length === 0) {
      const error = new Error('No recipients found for the selected filters');
      error.status = 400;
      throw error;
    }

    // Check quota
    const quotaCheck = await canSendEmails(recipients.length);
    if (!quotaCheck.canSend) {
      console.log(`[Email Broadcast] Quota check: need ${recipients.length}, have ${quotaCheck.available}`);
      // Will send what we can, pause for the rest
    }

    // Create campaign record
    const campaign = await prisma.emailBroadcastCampaign.create({
      data: {
        subject,
        message_text,
        message_html,
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
        created_by: context.actor_id,
        cadmin_name: context.actor_name,
      },
    });

    // Start async sending (don't await)
    processCampaignSending(campaign.campaign_id).catch((err) => {
      console.error(`[Email Broadcast] Async sending failed for ${campaign.campaign_id}:`, err);
    });

    return {
      campaign_id: campaign.campaign_id,
      status: CAMPAIGN_STATUS.SENDING,
      recipient_count: recipients.length,
      message: 'Emails are being sent in the background',
    };
  } catch (error) {
    console.error('[Email Broadcast] Send immediate failed:', error);
    throw error;
  }
}

// ============================================
// SEND TEST EMAIL
// ============================================

/**
 * Send test email to CAdmin's own email
 */
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
      const error = new Error('CAdmin email not found');
      error.status = 400;
      throw error;
    }

    // Convert plain text to HTML
    const message_html = convertPlainTextToHtml(message_text);

    // Build email HTML
    const html = buildEmailHtml({
      subject,
      messageHtml: message_html,
      recipientName: cadmin.name,
      inlineImage: inline_image,
      attachments: attachments,
      actionUrl: action_url,
      actionLabel: action_label,
      unsubscribeUrl: null, // No unsubscribe for test emails
      isTest: true, // Shows test banner
    });

    // Format attachments for Nodemailer
    const nodemailerAttachments = formatAttachmentsForNodemailer(inline_image, attachments);

    // Send email
    await mailer.sendMail({
      from: `"Cureli ERP" <${process.env.SMTP_USER}>`,
      to: cadmin.email,
      subject: `[TEST] ${subject}`,
      html: html,
      attachments: nodemailerAttachments,
    });

    console.log(`[Email Broadcast] Test email sent to ${cadmin.email}`);

    return {
      success: true,
      sent_to: cadmin.email,
      message: 'Test email sent successfully',
    };
  } catch (error) {
    console.error('[Email Broadcast] Test email failed:', error);
    throw error;
  }
}

// ============================================
// CANCEL CAMPAIGN
// ============================================

/**
 * Cancel a scheduled or paused campaign
 */
export async function cancelCampaign(campaignId, context) {
  try {
    const existing = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      const error = new Error('Campaign not found');
      error.status = 404;
      throw error;
    }

    // Can only cancel scheduled or paused campaigns
    if (![CAMPAIGN_STATUS.SCHEDULED, CAMPAIGN_STATUS.PAUSED].includes(existing.status)) {
      const error = new Error(`Cannot cancel campaign with status: ${existing.status}`);
      error.status = 400;
      throw error;
    }

    // Update status
    const updated = await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: CAMPAIGN_STATUS.CANCELLED,
        processing: false,
      },
    });

    // Delete attachments
    await cleanupCampaignFiles(existing);

    console.log(`[Email Broadcast] Campaign ${campaignId} cancelled`);

    return {
      campaign_id: updated.campaign_id,
      status: updated.status,
      action: 'cancelled',
    };
  } catch (error) {
    console.error('[Email Broadcast] Cancel failed:', error);
    throw error;
  }
}

// ============================================
// DELETE DRAFT
// ============================================

/**
 * Delete a draft campaign
 */
export async function deleteDraft(campaignId, context) {
  try {
    const existing = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      const error = new Error('Campaign not found');
      error.status = 404;
      throw error;
    }

    if (existing.status !== CAMPAIGN_STATUS.DRAFT) {
      const error = new Error('Can only delete draft campaigns');
      error.status = 400;
      throw error;
    }

    // Delete campaign
    await prisma.emailBroadcastCampaign.delete({
      where: { campaign_id: campaignId },
    });

    // Delete attachments
    await cleanupCampaignFiles(existing);

    console.log(`[Email Broadcast] Draft ${campaignId} deleted`);

    return {
      campaign_id: campaignId,
      action: 'deleted',
    };
  } catch (error) {
    console.error('[Email Broadcast] Delete draft failed:', error);
    throw error;
  }
}

// ============================================
// LIST ENDPOINTS
// ============================================

/**
 * Get all drafts (all CAdmins see all)
 */
export async function getDrafts(pagination = {}) {
  const { page = 1, limit = 10, search = '' } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    status: CAMPAIGN_STATUS.DRAFT,
    ...(search && {
      OR: [
        { subject: { contains: search, mode: 'insensitive' } },
        { cadmin_name: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [drafts, total] = await Promise.all([
    prisma.emailBroadcastCampaign.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.emailBroadcastCampaign.count({ where }),
  ]);

  return {
    drafts,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get scheduled campaigns
 */
export async function getScheduled(pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    status: { in: [CAMPAIGN_STATUS.SCHEDULED, CAMPAIGN_STATUS.PAUSED] },
  };

  const [scheduled, total] = await Promise.all([
    prisma.emailBroadcastCampaign.findMany({
      where,
      orderBy: { scheduled_for: 'asc' },
      skip,
      take: limit,
    }),
    prisma.emailBroadcastCampaign.count({ where }),
  ]);

  // Add time until scheduled
  const scheduledWithMeta = scheduled.map((item) => ({
    ...item,
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

/**
 * Get sent/failed/cancelled campaigns (history)
 */
export async function getHistory(pagination = {}) {
  const { page = 1, limit = 10, search = '' } = pagination;
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
        { subject: { contains: search, mode: 'insensitive' } },
        { cadmin_name: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [history, total] = await Promise.all([
    prisma.emailBroadcastCampaign.findMany({
      where,
      orderBy: { sent_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.emailBroadcastCampaign.count({ where }),
  ]);

  // Add delivery rate
  const historyWithStats = history.map((item) => ({
    ...item,
    delivery_rate: item.recipient_count > 0
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

/**
 * Get single campaign by ID
 */
export async function getCampaignById(campaignId) {
  const campaign = await prisma.emailBroadcastCampaign.findUnique({
    where: { campaign_id: campaignId },
  });

  if (!campaign) {
    const error = new Error('Campaign not found');
    error.status = 404;
    throw error;
  }

  return campaign;
}

// ============================================
// QUOTA INFO
// ============================================

/**
 * Get current quota status
 */
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

/**
 * Process campaign sending in batches
 * Called async from sendImmediate or by cron for scheduled campaigns
 */
export async function processCampaignSending(campaignId) {
  console.log(`[Email Broadcast] Starting to process campaign ${campaignId}`);

  try {
    // Get campaign
    const campaign = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Resolve recipients
    const allRecipients = await resolveRecipients(
      campaign.target_filters,
      campaign.target_users,
      campaign.target_cadmins,
      true // exclude unsubscribed
    );

    if (allRecipients.length === 0) {
      await prisma.emailBroadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: {
          status: CAMPAIGN_STATUS.FAILED,
          processing: false,
          last_error: 'No recipients found',
        },
      });
      return;
    }

    // Start from last processed index (for resume)
    const startIndex = campaign.last_processed_index || 0;
    const recipients = allRecipients.slice(startIndex);

    let delivered = campaign.delivered_count || 0;
    let failed = campaign.failed_count || 0;
    let processedIndex = startIndex;

    // Process in batches
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      // Check if we should pause for quota
      const shouldPause = await shouldPauseSending();
      if (shouldPause) {
        console.log(`[Email Broadcast] Pausing campaign ${campaignId} - daily quota exhausted`);
        
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
      
      // Check quota for this batch
      const capacity = await getRemainingCapacity();
      const canSend = Math.min(batch.length, capacity.remaining);
      
      if (canSend === 0) {
        // Pause campaign
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
      
      // Send batch
      const batchResults = await sendBatch(campaign, batchToSend);
      
      delivered += batchResults.delivered;
      failed += batchResults.failed;
      processedIndex += batchToSend.length;

      // Increment quota
      await incrementSentCount(batchToSend.length);

      // Update progress
      await prisma.emailBroadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: {
          delivered_count: delivered,
          failed_count: failed,
          last_processed_index: processedIndex,
        },
      });

      // Delay between batches
      if (i + BATCH_SIZE < recipients.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    // Determine final status
    let finalStatus = CAMPAIGN_STATUS.SENT;
    if (delivered === 0) {
      finalStatus = CAMPAIGN_STATUS.FAILED;
    } else if (failed > 0) {
      finalStatus = CAMPAIGN_STATUS.PARTIAL_FAILURE;
    }

    // Mark as complete
    await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: finalStatus,
        processing: false,
        sent_at: new Date(),
        delivered_count: delivered,
        failed_count: failed,
        last_processed_index: processedIndex,
      },
    });

    console.log(`[Email Broadcast] Campaign ${campaignId} completed: ${delivered} delivered, ${failed} failed`);

    return { delivered, failed, status: finalStatus };
  } catch (error) {
    console.error(`[Email Broadcast] Processing failed for ${campaignId}:`, error);

    // Mark as failed
    await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: CAMPAIGN_STATUS.FAILED,
        processing: false,
        last_error: error.message,
      },
    }).catch(() => {});

    throw error;
  }
}

/**
 * Send a batch of emails
 */
async function sendBatch(campaign, recipients) {
  let delivered = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      try {
        // Build personalized email
        const unsubscribeUrl = buildUnsubscribeUrl(recipient.email);
        
        const html = buildEmailHtml({
          subject: campaign.subject,
          messageHtml: campaign.message_html,
          recipientName: recipient.name,
          inlineImage: campaign.inline_image,
          attachments: campaign.attachments,
          actionUrl: campaign.action_url,
          actionLabel: campaign.action_label,
          unsubscribeUrl: unsubscribeUrl,
          isTest: false,
        });

        // Format attachments
        const nodemailerAttachments = formatAttachmentsForNodemailer(
          campaign.inline_image,
          campaign.attachments
        );

        // Send email
        await mailer.sendMail({
          from: `"Cureli ERP" <${process.env.SMTP_USER}>`,
          to: recipient.email,
          subject: campaign.subject,
          html: html,
          attachments: nodemailerAttachments,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        return { success: true, email: recipient.email };
      } catch (err) {
        console.error(`[Email Broadcast] Failed to send to ${recipient.email}:`, err.message);
        return { success: false, email: recipient.email, error: err.message };
      }
    })
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success) {
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

/**
 * Clean up campaign files (inline image + attachments)
 */
async function cleanupCampaignFiles(campaign) {
  try {
    const filenames = [];

    // Inline image
    if (campaign.inline_image?.filename) {
      filenames.push(campaign.inline_image.filename);
    }

    // Attachments
    if (campaign.attachments && Array.isArray(campaign.attachments)) {
      campaign.attachments.forEach((att) => {
        if (att.filename) {
          filenames.push(att.filename);
        }
      });
    }

    if (filenames.length > 0) {
      const deleted = deleteEmailAttachments(filenames);
      console.log(`[Email Broadcast] Cleaned up ${deleted} file(s) for campaign ${campaign.campaign_id}`);
    }
  } catch (error) {
    console.error('[Email Broadcast] File cleanup failed:', error);
  }
}

/**
 * Get human-readable time until scheduled
 */
function getTimeUntil(dateString) {
  const scheduled = new Date(dateString);
  const now = new Date();
  const diffMs = scheduled - now;

  if (diffMs < 0) return 'Sending soon...';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 1) return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  if (hours < 24) return `in ${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} min`;

  const days = Math.floor(hours / 24);
  return `in ${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Sleep helper
 */
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