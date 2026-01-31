// ============================================
// CADMIN IN-APP BROADCAST CONTROLLER
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
    auditContext.actor_name = req.cadmin?.name || 'CAdmin';
    
    const result = await service.sendImmediate(req.validated, auditContext);

    // Audit log
    await audit.log({
      action: audit.AuditAction.SYSTEM_CONFIG_CHANGED,
      entity_type: audit.EntityType.SYSTEM,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        action_type: 'broadcast_sent_immediate',
        title: req.validated.title,
        recipients: result.sent_to,
        delivered: result.delivered,
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
    auditContext.actor_name = req.cadmin?.name || 'CAdmin';
    
    const result = await service.createDraft(req.validated, auditContext);
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
    auditContext.actor_name = req.cadmin?.name || 'CAdmin';
    
    const result = await service.updateDraft(id, req.validated, auditContext);
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
    auditContext.actor_name = req.cadmin?.name || 'CAdmin';
    
    const result = await service.scheduleBroadcast(id, scheduled_for, auditContext);

    // Audit log
    await audit.log({
      action: audit.AuditAction.SYSTEM_CONFIG_CHANGED,
      entity_type: audit.EntityType.SYSTEM,
      entity_id: id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        action_type: 'broadcast_scheduled',
        campaign_id: id,
        scheduled_for,
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
    
    const result = await service.cancelOrDeleteCampaign(id, auditContext);

    // Audit log
    await audit.log({
      action: audit.AuditAction.SYSTEM_CONFIG_CHANGED,
      entity_type: audit.EntityType.SYSTEM,
      entity_id: id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        action_type: 'broadcast_cancelled_or_deleted',
        campaign_id: id,
      },
    });

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