import prisma from '../../../../config/prisma.js';
import { notify, NOTIFICATION_EVENTS } from '../../../notifications/index.js';
import { resolveAudience } from '../../../notifications/notification.rules.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function validatePriority(priority) {
  const allowed = ['low', 'normal', 'high', 'critical'];
  return allowed.includes(priority) ? priority : 'normal';
}

function validateAttachments(attachments) {
  if (!attachments || !Array.isArray(attachments)) return [];
  
  const validTypes = ['link', 'image', 'video'];
  const maxAttachments = 5;
  
  return attachments
    .filter(att => validTypes.includes(att.type) && att.url)
    .slice(0, maxAttachments)
    .map(att => ({
      type: att.type,
      url: att.url.trim(),
      label: att.label?.trim() || null,
    }));
}

function validateFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    throw createError('target_filters must be an object');
  }

  const { 
    shop_ids, 
    plan_ids, 
    roles,
    registration_date_from, 
    registration_date_to,
    include_cadmins,
    cadmin_roles,
    exclude_shop_ids,
    exclude_user_ids,
  } = filters;

  // Validate arrays
  if (shop_ids !== undefined && (!Array.isArray(shop_ids) || shop_ids.length === 0)) {
    throw createError('shop_ids must be a non-empty array');
  }
  if (plan_ids !== undefined && (!Array.isArray(plan_ids) || plan_ids.length === 0)) {
    throw createError('plan_ids must be a non-empty array');
  }
  if (roles !== undefined && (!Array.isArray(roles) || roles.length === 0)) {
    throw createError('roles must be a non-empty array');
  }

  // Validate date range
  if (registration_date_from && isNaN(Date.parse(registration_date_from))) {
    throw createError('registration_date_from must be a valid date');
  }
  if (registration_date_to && isNaN(Date.parse(registration_date_to))) {
    throw createError('registration_date_to must be a valid date');
  }

  return filters;
}

// ============================================
// ENHANCED PREVIEW WITH SHOP NAMES
// ============================================

export async function previewRecipientCount(filters, includeDetails = false) {
  try {
    validateFilters(filters);

    const recipients = await resolveAudience(
      NOTIFICATION_EVENTS.BROADCAST_INAPP,
      {},
      filters
    );

    // Group by shop with names
    const shopIds = [...new Set(recipients.filter(r => r.shop_id).map(r => r.shop_id))];
    
    let shopDetails = {};
    if (shopIds.length > 0 && includeDetails) {
      const shops = await prisma.shop.findMany({
        where: { shop_id: { in: shopIds } },
        select: { shop_id: true, business_name: true },
      });
      
      shops.forEach(shop => {
        shopDetails[shop.shop_id] = {
          name: shop.business_name,
          count: recipients.filter(r => r.shop_id === shop.shop_id).length,
        };
      });
    } else {
      recipients.forEach(r => {
        if (r.shop_id) {
          if (!shopDetails[r.shop_id]) {
            shopDetails[r.shop_id] = { name: null, count: 0 };
          }
          shopDetails[r.shop_id].count++;
        }
      });
    }

    // Count by type
    const userCount = recipients.filter(r => r.type === 'user').length;
    const cadminCount = recipients.filter(r => r.type === 'cadmin').length;

    // Count by role
    const byRole = {};
    recipients.forEach(r => {
      const role = r.role || 'unknown';
      byRole[role] = (byRole[role] || 0) + 1;
    });

    return {
      total: recipients.length,
      by_type: {
        users: userCount,
        cadmins: cadminCount,
      },
      by_shop: shopDetails,
      by_role: byRole,
      filters_applied: filters,
    };
  } catch (error) {
    console.error('[Broadcast Service] Preview failed:', error);
    throw error;
  }
}

// ============================================
// ENHANCED SEND IMMEDIATE WITH ATTACHMENTS
// ============================================

export async function sendImmediate(data, auditContext) {
  const { 
    title, 
    message, 
    priority, 
    target_filters,
    attachments,
    action_url,
    action_label,
    expires_in_hours,
  } = data;

  try {
    // Validate
    if (!title || title.trim().length < 3) {
      throw createError('Title must be at least 3 characters');
    }
    if (!message || message.trim().length < 10) {
      throw createError('Message must be at least 10 characters');
    }
    if (message.length > 500) {
      throw createError('Message must not exceed 500 characters');
    }

    validateFilters(target_filters);
    const validPriority = validatePriority(priority);
    const validAttachments = validateAttachments(attachments);

    // Calculate expiry
    const expiresAt = expires_in_hours 
      ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000)
      : null;

    // Resolve recipients
    const recipients = await resolveAudience(
      NOTIFICATION_EVENTS.BROADCAST_INAPP,
      {},
      target_filters
    );

    if (recipients.length === 0) {
      throw createError('No recipients match the selected filters', 400);
    }

    console.log(`[Broadcast Service] Sending to ${recipients.length} recipients`);

    // Send via notification service
    const result = await notify({
      type: NOTIFICATION_EVENTS.BROADCAST_INAPP,
      context: {
        title: title.trim(),
        message: message.trim(),
        attachments: validAttachments,
        action_url,
        action_label,
        expires_at: expiresAt,
      },
      channels: ['inapp'],
      audience: recipients,
      audienceFilters: target_filters,
    });

    return {
      success: result.success,
      sent_to: recipients.length,
      delivered: result.channels.inapp?.sent || 0,
      failed: result.channels.inapp?.failed || 0,
      by_type: {
        users: recipients.filter(r => r.type === 'user').length,
        cadmins: recipients.filter(r => r.type === 'cadmin').length,
      },
      errors: result.errors,
    };
  } catch (error) {
    console.error('[Broadcast Service] Immediate send failed:', error);
    throw error;
  }
}

// ============================================
// ENHANCED CREATE DRAFT WITH ATTACHMENTS
// ============================================

export async function createDraft(data, auditContext) {
  const { 
    title, 
    message, 
    priority, 
    target_filters,
    attachments,
    action_url,
    action_label,
    expires_in_hours,
    target_users = true,
    target_cadmins = false,
  } = data;

  try {
    // Validate
    if (!title || title.trim().length < 3) {
      throw createError('Title must be at least 3 characters');
    }
    if (!message || message.trim().length < 10) {
      throw createError('Message must be at least 10 characters');
    }
    if (message.length > 500) {
      throw createError('Message must not exceed 500 characters');
    }

    validateFilters(target_filters);
    const validPriority = validatePriority(priority);
    const validAttachments = validateAttachments(attachments);

    // Preview recipient count
    const preview = await previewRecipientCount(target_filters);

    // Calculate expiry
    const expiresAt = expires_in_hours 
      ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000)
      : null;

    // Create campaign
    const campaign = await prisma.broadcastCampaign.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        priority: validPriority,
        target_filters: target_filters,
        attachments: validAttachments.length > 0 ? validAttachments : null,
        action_url: action_url?.trim() || null,
        action_label: action_label?.trim() || null,
        recipient_count: preview.total,
        target_users,
        target_cadmins,
        expires_at: expiresAt,
        status: 'draft',
        created_by_cadmin: auditContext.actor_id,
        cadmin_name: auditContext.actor_name || 'CAdmin',
      },
    });

    return {
      campaign_id: campaign.campaign_id,
      title: campaign.title,
      message: campaign.message,
      priority: campaign.priority,
      target_filters: campaign.target_filters,
      attachments: campaign.attachments,
      recipient_count: campaign.recipient_count,
      status: campaign.status,
      created_at: campaign.created_at,
    };
  } catch (error) {
    console.error('[Broadcast Service] Create draft failed:', error);
    throw error;
  }
}

// ============================================
// GET SHOPS WITH NAMES FOR FILTER DROPDOWN
// ============================================

export async function getShopsForFilter(search = '', page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const where = {
    verification_status: 'verified',
    is_active: true,
  };

  if (search) {
    where.OR = [
      { business_name: { contains: search, mode: 'insensitive' } },
      { legal_name: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      select: {
        shop_id: true,
        business_name: true,
        city: true,
        _count: { select: { users: true } },
      },
      orderBy: { business_name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.shop.count({ where }),
  ]);

  return {
    shops: shops.map(s => ({
      shop_id: s.shop_id,
      business_name: s.business_name,
      city: s.city,
      user_count: s._count.users,
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
}

// ============================================
// GET USER ROLES FOR FILTER
// ============================================

export async function getUserRoles() {
  const roles = await prisma.user.groupBy({
    by: ['role'],
    where: { is_active: true },
    _count: { role: true },
  });

  return roles.map(r => ({
    value: r.role,
    label: formatRoleName(r.role),
    count: r._count.role,
  }));
}

function formatRoleName(role) {
  const map = {
    super_admin: 'Super Admin',
    branch_admin: 'Branch Admin',
    staff: 'Staff',
    owner: 'Owner',
  };
  return map[role] || role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================
// GET CADMIN ROLES FOR FILTER
// ============================================

export async function getCAdminRoles() {
  return [
    { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full system access' },
    { value: 'ANALYST', label: 'Analyst', description: 'Analytics & reports' },
    { value: 'ACCOUNTING', label: 'Accounting', description: 'Financial operations' },
  ];
}

// ============================================
// SAVED SEGMENTS CRUD
// ============================================

export async function createSegment(data, cadminId) {
  return prisma.broadcastSegment.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim(),
      filters: data.filters,
      created_by_cadmin: cadminId,
    },
  });
}

export async function getSegments(cadminId) {
  return prisma.broadcastSegment.findMany({
    where: { created_by_cadmin: cadminId },
    orderBy: { created_at: 'desc' },
  });
}

export async function deleteSegment(segmentId, cadminId) {
  const segment = await prisma.broadcastSegment.findFirst({
    where: { segment_id: segmentId, created_by_cadmin: cadminId },
  });
  
  if (!segment) throw createError('Segment not found', 404);
  
  return prisma.broadcastSegment.delete({
    where: { segment_id: segmentId },
  });
}

// ============================================
// MESSAGE TEMPLATES CRUD
// ============================================

export async function createTemplate(data, cadminId) {
  return prisma.broadcastTemplate.create({
    data: {
      name: data.name.trim(),
      title: data.title.trim(),
      message: data.message.trim(),
      priority: validatePriority(data.priority),
      attachments: validateAttachments(data.attachments),
      created_by_cadmin: cadminId,
    },
  });
}

export async function getTemplates(cadminId) {
  return prisma.broadcastTemplate.findMany({
    orderBy: { usage_count: 'desc' },
    take: 20,
  });
}

export async function useTemplate(templateId) {
  const template = await prisma.broadcastTemplate.findUnique({
    where: { template_id: templateId },
  });
  
  if (!template) throw createError('Template not found', 404);
  
  // Increment usage count
  await prisma.broadcastTemplate.update({
    where: { template_id: templateId },
    data: { usage_count: { increment: 1 } },
  });
  
  return template;
}


/**
 * Update a draft campaign
 */
export async function updateDraft(campaignId, data, auditContext) {
  try {
    // Check if campaign exists and is editable
    const existing = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      throw createError('Campaign not found', 404);
    }

    if (existing.status === 'sent') {
      throw createError('Cannot edit a sent campaign', 400);
    }

    if (existing.status === 'cancelled') {
      throw createError('Cannot edit a cancelled campaign', 400);
    }

    // Build update data
    const updateData = {};

    if (data.title !== undefined) {
      if (data.title.trim().length < 3) {
        throw createError('Title must be at least 3 characters');
      }
      updateData.title = data.title.trim();
    }

    if (data.message !== undefined) {
      if (data.message.trim().length < 10) {
        throw createError('Message must be at least 10 characters');
      }
      if (data.message.length > 500) {
        throw createError('Message must not exceed 500 characters');
      }
      updateData.message = data.message.trim();
    }

    if (data.priority !== undefined) {
      updateData.priority = validatePriority(data.priority);
    }

    if (data.target_filters !== undefined) {
      validateFilters(data.target_filters);
      updateData.target_filters = data.target_filters;

      // Recalculate recipient count
      const preview = await previewRecipientCount(data.target_filters);
      updateData.recipient_count = preview.total;
    }

    if (Object.keys(updateData).length === 0) {
      throw createError('No fields to update');
    }

    // Update campaign
    const updated = await prisma.broadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: updateData,
    });

    return {
      campaign_id: updated.campaign_id,
      title: updated.title,
      message: updated.message,
      priority: updated.priority,
      target_filters: updated.target_filters,
      recipient_count: updated.recipient_count,
      status: updated.status,
      scheduled_for: updated.scheduled_for,
      updated_at: updated.updated_at,
    };
  } catch (error) {
    console.error('[Broadcast Service] Update draft failed:', error);
    throw error;
  }
}

/**
 * Schedule a draft campaign
 */
export async function scheduleBroadcast(campaignId, scheduledFor, auditContext) {
  try {
    // Check if campaign exists
    const existing = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!existing) {
      throw createError('Campaign not found', 404);
    }

    if (existing.status !== 'draft') {
      throw createError('Only draft campaigns can be scheduled', 400);
    }

    // Validate scheduled time is in the future
    const scheduleTime = new Date(scheduledFor);
    if (isNaN(scheduleTime.getTime())) {
      throw createError('Invalid scheduled_for date');
    }

    if (scheduleTime <= new Date()) {
      throw createError('Scheduled time must be in the future');
    }

    // Update campaign
    const updated = await prisma.broadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: 'scheduled',
        scheduled_for: scheduleTime,
      },
    });

    return {
      campaign_id: updated.campaign_id,
      title: updated.title,
      status: updated.status,
      scheduled_for: updated.scheduled_for,
      recipient_count: updated.recipient_count,
    };
  } catch (error) {
    console.error('[Broadcast Service] Schedule failed:', error);
    throw error;
  }
}

/**
 * Send a scheduled campaign (called by cron)
 */
export async function sendScheduled(campaignId) {
  try {
    // Get campaign
    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) {
      throw createError('Campaign not found', 404);
    }

    if (campaign.status !== 'scheduled') {
      throw createError('Campaign is not scheduled', 400);
    }

    // Resolve recipients
    const recipients = await resolveAudience(
      NOTIFICATION_EVENTS.BROADCAST_INAPP,
      {},
      campaign.target_filters
    );

    if (recipients.length === 0) {
      console.warn(`[Broadcast Service] No recipients for campaign ${campaignId}, marking as sent anyway`);
      
      await prisma.broadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: {
          status: 'sent',
          sent_at: new Date(),
          delivered_count: 0,
        },
      });

      return { sent: 0, recipients: 0 };
    }

    console.log(`[Broadcast Service] Sending scheduled campaign ${campaignId} to ${recipients.length} recipients`);

    // Send via notification service
    const result = await notify({
      type: NOTIFICATION_EVENTS.BROADCAST_INAPP,
      context: {
        title: campaign.title,
        message: campaign.message,
      },
      channels: ['inapp'],
      audience: recipients,
      audienceFilters: campaign.target_filters,
    });

    // Update campaign status
    await prisma.broadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: 'sent',
        sent_at: new Date(),
        delivered_count: result.channels.inapp?.sent || 0,
      },
    });

    console.log(`[Broadcast Service] Campaign ${campaignId} sent successfully`);

    return {
      sent: result.channels.inapp?.sent || 0,
      failed: result.channels.inapp?.failed || 0,
      recipients: recipients.length,
    };
  } catch (error) {
    console.error(`[Broadcast Service] Send scheduled campaign ${campaignId} failed:`, error);
    
    // Mark as failed (you could add a 'failed' status if needed)
    await prisma.broadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: 'cancelled',  // or create a 'failed' status
        updated_at: new Date(),
      },
    }).catch(err => console.error('Failed to update campaign status:', err));

    throw error;
  }
}

/**
 * Cancel a scheduled campaign or delete a draft
 */
export async function cancelOrDeleteCampaign(campaignId, auditContext) {
  try {
    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) {
      throw createError('Campaign not found', 404);
    }

    if (campaign.status === 'sent') {
      throw createError('Cannot delete a sent campaign', 400);
    }

    if (campaign.status === 'scheduled') {
      // Cancel scheduled campaign
      const updated = await prisma.broadcastCampaign.update({
        where: { campaign_id: campaignId },
        data: {
          status: 'cancelled',
        },
      });

      return {
        campaign_id: updated.campaign_id,
        status: updated.status,
        message: 'Scheduled campaign cancelled successfully',
      };
    }

    // Delete draft or cancelled campaigns
    await prisma.broadcastCampaign.delete({
      where: { campaign_id: campaignId },
    });

    return {
      campaign_id: campaignId,
      message: 'Campaign deleted successfully',
    };
  } catch (error) {
    console.error('[Broadcast Service] Cancel/delete failed:', error);
    throw error;
  }
}

/**
 * Get drafts for current CAdmin
 */
export async function getDrafts(cadminId, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  try {
    const [drafts, total] = await Promise.all([
      prisma.broadcastCampaign.findMany({
        where: {
          created_by_cadmin: cadminId,
          status: 'draft',
        },
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit,
        select: {
          campaign_id: true,
          title: true,
          message: true,
          priority: true,
          recipient_count: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.broadcastCampaign.count({
        where: {
          created_by_cadmin: cadminId,
          status: 'draft',
        },
      }),
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
  } catch (error) {
    console.error('[Broadcast Service] Get drafts failed:', error);
    throw error;
  }
}

/**
 * Get all scheduled campaigns
 */
export async function getScheduled(pagination = {}) {
  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  try {
    const [scheduled, total] = await Promise.all([
      prisma.broadcastCampaign.findMany({
        where: {
          status: 'scheduled',
        },
        orderBy: { scheduled_for: 'asc' },
        skip,
        take: limit,
        select: {
          campaign_id: true,
          title: true,
          message: true,
          priority: true,
          recipient_count: true,
          scheduled_for: true,
          cadmin_name: true,
          created_at: true,
        },
      }),
      prisma.broadcastCampaign.count({
        where: {
          status: 'scheduled',
        },
      }),
    ]);

    return {
      scheduled,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[Broadcast Service] Get scheduled failed:', error);
    throw error;
  }
}

/**
 * Get sent campaign history with read stats
 */
export async function getHistory(pagination = {}) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  try {
    const [campaigns, total] = await Promise.all([
      prisma.broadcastCampaign.findMany({
        where: {
          status: 'sent',
        },
        orderBy: { sent_at: 'desc' },
        skip,
        take: limit,
        select: {
          campaign_id: true,
          title: true,
          message: true,
          priority: true,
          recipient_count: true,
          delivered_count: true,
          sent_at: true,
          cadmin_name: true,
        },
      }),
      prisma.broadcastCampaign.count({
        where: {
          status: 'sent',
        },
      }),
    ]);

    // Calculate read counts for each campaign
    // We'll query notifications created around the sent time
    const enriched = await Promise.all(
      campaigns.map(async (campaign) => {
        // Find notifications matching this broadcast
        // (approximate: title match within 1 hour of sent_at)
        const sentTime = new Date(campaign.sent_at);
        const oneHourBefore = new Date(sentTime.getTime() - 60 * 60 * 1000);
        const oneHourAfter = new Date(sentTime.getTime() + 60 * 60 * 1000);

        const readCount = await prisma.notification.count({
          where: {
            event_type: NOTIFICATION_EVENTS.BROADCAST_INAPP,
            title: campaign.title,
            created_at: {
              gte: oneHourBefore,
              lte: oneHourAfter,
            },
            is_read: true,
          },
        });

        return {
          ...campaign,
          read_count: readCount,
          read_rate: campaign.delivered_count > 0
            ? ((readCount / campaign.delivered_count) * 100).toFixed(1)
            : '0.0',
        };
      })
    );

    return {
      history: enriched,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[Broadcast Service] Get history failed:', error);
    throw error;
  }
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(campaignId) {
  try {
    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) {
      throw createError('Campaign not found', 404);
    }

    return campaign;
  } catch (error) {
    console.error('[Broadcast Service] Get campaign by ID failed:', error);
    throw error;
  }
}