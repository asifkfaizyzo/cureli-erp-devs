// ============================================
// CADMIN AUDIT ROUTES
// ============================================

import { Router } from 'express';
import { requireCAdmin } from '../../../middleware/requireCAdmin.js';
import * as auditController from './cadminAudit.controller.js';

const router = Router();

// All routes require CAdmin authentication
router.use(requireCAdmin);

// ============================================
// ROUTES
// ============================================

/**
 * GET /cadmin/audit-logs
 * List audit logs with filters & pagination
 */
router.get('/audits', auditController.getAuditLogs);

/**
 * GET /cadmin/audit-logs/stats
 * Quick statistics for header
 */
router.get('/audits/stats', auditController.getAuditStats);

/**
 * GET /cadmin/audit-logs/export/csv
 * Export audit logs as CSV
 */
router.get('/audits/export/csv', auditController.exportAuditLogsCSV);

/**
 * GET /cadmin/audit-logs/:audit_id
 * Get single audit log detail
 */
router.get('/audits/:audit_id', auditController.getAuditLogById);

export default router;