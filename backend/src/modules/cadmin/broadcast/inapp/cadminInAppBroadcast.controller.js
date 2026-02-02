// ============================================
// backend\src\modules\cadmin\broadcast\inapp\cadminInAppBroadcast.controller.js
// ============================================

import { success, fail } from '../../../../utils/response.js';
import * as audit from '../../../audit/index.js';
import * as service from './cadminInAppBroadcast.service.js';

/**
 * Preview recipient count
 * POST /cadmin/broadcast/inapp/preview
 */
export async function previewRecipientCountController(req, res) {
  try {
    const { target_filters } = req.validated;
    const result = await service.previewRecipientCount(target_filters);
    return success(res, result);
  } catch (err) {
    console.error('[Broadcast Controller] Preview failed:', err);
    return fail(res, err.message || 'Failed to preview recipients', err.status || 500);
  }
}

/**
 * Send broadcast immediately
 * POST /cadmin/broadcast/inapp/send-now
 */
export async function sendImmediateController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    
    const result = await service.sendImmediate(req.validated, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || 'CAdmin',
    });

    // ✅ FIXED: Use existing action
    await audit.log({
      action: audit.AuditAction.SYSTEM_BROADCAST_SENT,
      actor_type: audit.ActorType.CADMIN,
      actor_id: req.cadmin?.cadmin_id,
      actor_role: req.cadmin?.role,
      entity_type: audit.EntityType.SYSTEM,
      ip_address: auditContext.ip_address,
      user_agent: auditContext.user_agent,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        broadcast_type: 'immediate',
        title: req.validated.title,
        recipients_count: result.sent_to,
        delivered_count: result.delivered,
        channels: ['inapp'],
      },
    });

    return success(res, result, 'Broadcast sent successfully');
  } catch (err) {
    console.error('[Broadcast Controller] Send immediate failed:', err);
    return fail(res, err.message || 'Failed to send broadcast', err.status || 500);
  }
}

/**
 * Create draft
 * POST /cadmin/broadcast/inapp/draft
 */
export async function createDraftController(req, res) {
  try {
    const auditContext = audit.extractRequestContext(req);
    
    const result = await service.createDraft(req.validated, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || 'CAdmin',
    });

    // ✅ FIXED: Use existing action
    await audit.log({
      action: audit.AuditAction.SYSTEM_BROADCAST_CREATED,
      actor_type: audit.ActorType.CADMIN,
      actor_id: req.cadmin?.cadmin_id,
      actor_role: req.cadmin?.role,
      entity_type: audit.EntityType.SYSTEM,
      entity_id: result.campaign_id,
      ip_address: auditContext.ip_address,
      user_agent: auditContext.user_agent,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        broadcast_type: 'draft',
        title: req.validated.title,
        recipient_count: result.recipient_count,
        channels: ['inapp'],
      },
    });

    return success(res, result, 'Draft created successfully', 201);
  } catch (err) {
    console.error('[Broadcast Controller] Create draft failed:', err);
    return fail(res, err.message || 'Failed to create draft', err.status || 500);
  }
}

/**
 * Update draft
 * PUT /cadmin/broadcast/inapp/:id
 */
export async function updateDraftController(req, res) {
  try {
    const { id } = req.params;
    const auditContext = audit.extractRequestContext(req);
    
    const result = await service.updateDraft(id, req.validated, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || 'CAdmin',
    });

    return success(res, result, 'Draft updated successfully');
  } catch (err) {
    console.error('[Broadcast Controller] Update draft failed:', err);
    return fail(res, err.message || 'Failed to update draft', err.status || 500);
  }
}

/**
 * Schedule broadcast
 * POST /cadmin/broadcast/inapp/:id/schedule
 */
export async function scheduleBroadcastController(req, res) {
  try {
    const { id } = req.params;
    const { scheduled_for } = req.validated;
    const auditContext = audit.extractRequestContext(req);
    
    const result = await service.scheduleBroadcast(id, scheduled_for, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
      actor_name: req.cadmin?.name || 'CAdmin',
    });

    // ✅ FIXED: Use existing action
    await audit.log({
      action: audit.AuditAction.SYSTEM_BROADCAST_CREATED,
      actor_type: audit.ActorType.CADMIN,
      actor_id: req.cadmin?.cadmin_id,
      actor_role: req.cadmin?.role,
      entity_type: audit.EntityType.SYSTEM,
      entity_id: id,
      ip_address: auditContext.ip_address,
      user_agent: auditContext.user_agent,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        broadcast_type: 'scheduled',
        campaign_id: id,
        scheduled_for,
        title: result.title,
        channels: ['inapp'],
      },
    });

    return success(res, result, 'Broadcast scheduled successfully');
  } catch (err) {
    console.error('[Broadcast Controller] Schedule failed:', err);
    return fail(res, err.message || 'Failed to schedule broadcast', err.status || 500);
  }
}

/**
 * Cancel scheduled or delete draft
 * DELETE /cadmin/broadcast/inapp/:id
 */
export async function cancelOrDeleteController(req, res) {
  try {
    const { id } = req.params;
    const auditContext = audit.extractRequestContext(req);
    
    const result = await service.cancelOrDeleteCampaign(id, {
      ...auditContext,
      actor_id: req.cadmin?.cadmin_id,
    });

    // Optional: Skip audit for deletes, or add a new action if you want to track
    // For now, we'll skip audit logging for cancel/delete operations

    return success(res, result);
  } catch (err) {
    console.error('[Broadcast Controller] Cancel/delete failed:', err);
    return fail(res, err.message || 'Failed to cancel/delete campaign', err.status || 500);
  }
}

/**
 * Get drafts
 * GET /cadmin/broadcast/inapp/drafts
 */
export async function getDraftsController(req, res) {
  try {
    const cadminId = req.cadmin.cadmin_id;
    const result = await service.getDrafts(cadminId, req.validated);
    return success(res, result);
  } catch (err) {
    console.error('[Broadcast Controller] Get drafts failed:', err);
    return fail(res, err.message || 'Failed to fetch drafts', err.status || 500);
  }
}

/**
 * Get scheduled
 * GET /cadmin/broadcast/inapp/scheduled
 */
export async function getScheduledController(req, res) {
  try {
    const result = await service.getScheduled(req.validated);
    return success(res, result);
  } catch (err) {
    console.error('[Broadcast Controller] Get scheduled failed:', err);
    return fail(res, err.message || 'Failed to fetch scheduled broadcasts', err.status || 500);
  }
}

/**
 * Get history
 * GET /cadmin/broadcast/inapp/history
 */
export async function getHistoryController(req, res) {
  try {
    const result = await service.getHistory(req.validated);
    return success(res, result);
  } catch (err) {
    console.error('[Broadcast Controller] Get history failed:', err);
    return fail(res, err.message || 'Failed to fetch history', err.status || 500);
  }
}

/**
 * Get campaign by ID
 * GET /cadmin/broadcast/inapp/:id
 */
export async function getCampaignByIdController(req, res) {
  try {
    const { id } = req.params;
    const result = await service.getCampaignById(id);
    return success(res, result);
  } catch (err) {
    console.error('[Broadcast Controller] Get campaign failed:', err);
    return fail(res, err.message || 'Failed to fetch campaign', err.status || 404);
  }
}


export async function getShopsForFilterController(req, res) {
  try {
    const { search = '', page = 1, limit = 50 } = req.query;
    const result = await service.getShopsForFilter(search, Number(page), Number(limit));
    return success(res, result);
  } catch (err) {
    console.error('[Broadcast Controller] Get shops failed:', err);
    return fail(res, err.message || 'Failed to fetch shops', err.status || 500);
  }
}

/**
 * Get user roles for filter
 * GET /cadmin/broadcast/inapp/filters/roles
 */
export async function getUserRolesController(req, res) {
  try {
    const result = await service.getUserRoles();
    return success(res, result);
  } catch (err) {
    console.error('[Broadcast Controller] Get roles failed:', err);
    return fail(res, err.message || 'Failed to fetch roles', err.status || 500);
  }
}

/**
 * Get CAdmin roles for filter
 * GET /cadmin/broadcast/inapp/filters/cadmin-roles
 */
export async function getCAdminRolesController(req, res) {
  try {
    const result = await service.getCAdminRoles();
    return success(res, result);
  } catch (err) {
    console.error('[Broadcast Controller] Get CAdmin roles failed:', err);
    return fail(res, err.message || 'Failed to fetch CAdmin roles', err.status || 500);
  }
}

/**
 * Create saved segment
 * POST /cadmin/broadcast/inapp/segments
 */
export async function createSegmentController(req, res) {
  try {
    const result = await service.createSegment(req.validated, req.cadmin.cadmin_id);
    return success(res, result, 'Segment saved successfully', 201);
  } catch (err) {
    return fail(res, err.message || 'Failed to create segment', err.status || 500);
  }
}

/**
 * Get saved segments
 * GET /cadmin/broadcast/inapp/segments
 */
export async function getSegmentsController(req, res) {
  try {
    const result = await service.getSegments(req.cadmin.cadmin_id);
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || 'Failed to fetch segments', err.status || 500);
  }
}

/**
 * Delete segment
 * DELETE /cadmin/broadcast/inapp/segments/:id
 */
export async function deleteSegmentController(req, res) {
  try {
    await service.deleteSegment(req.params.segmentId, req.cadmin.cadmin_id);  // Changed from req.params.id
    return success(res, { deleted: true }, 'Segment deleted');
  } catch (err) {
    return fail(res, err.message || 'Failed to delete segment', err.status || 500);
  }
}

/**
 * Create template
 * POST /cadmin/broadcast/inapp/templates
 */
export async function createTemplateController(req, res) {
  try {
    const result = await service.createTemplate(req.validated, req.cadmin.cadmin_id);
    return success(res, result, 'Template saved successfully', 201);
  } catch (err) {
    return fail(res, err.message || 'Failed to create template', err.status || 500);
  }
}

/**
 * Get templates
 * GET /cadmin/broadcast/inapp/templates
 */
export async function getTemplatesController(req, res) {
  try {
    const result = await service.getTemplates(req.cadmin.cadmin_id);
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || 'Failed to fetch templates', err.status || 500);
  }
}

/**
 * Use template (get and increment usage)
 * POST /cadmin/broadcast/inapp/templates/:id/use
 */
export async function useTemplateController(req, res) {
  try {
    const result = await service.useTemplate(req.params.templateId);  // Changed from req.params.id
    return success(res, result);
  } catch (err) {
    return fail(res, err.message || 'Failed to load template', err.status || 500);
  }
}