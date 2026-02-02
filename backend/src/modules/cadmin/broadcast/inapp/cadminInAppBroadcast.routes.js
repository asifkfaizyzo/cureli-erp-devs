// backend/src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.routes.js

import { Router } from 'express';
import * as controller from './cadminInAppBroadcast.controller.js';
import { validateBody, validateQuery } from '../../../../middleware/validate.js';
import { requireCAdmin } from '../../../../middleware/requireCAdmin.js';
import * as schema from './cadminInAppBroadcast.schema.js';

const router = Router();

// All routes require CAdmin auth
router.use(requireCAdmin);

// ============================================
// STATIC ROUTES FIRST (before :id params)
// ============================================

// Preview & Send (static paths)
router.post('/broadcast/inapp/preview', validateBody(schema.previewSchema), controller.previewRecipientCountController);
router.post('/broadcast/inapp/send-now', validateBody(schema.sendNowSchema), controller.sendImmediateController);

// Draft (static path)
router.post('/broadcast/inapp/draft', validateBody(schema.draftSchema), controller.createDraftController);

// List views (static paths)
router.get('/broadcast/inapp/drafts', validateQuery(schema.paginationSchema), controller.getDraftsController);
router.get('/broadcast/inapp/scheduled', validateQuery(schema.paginationSchema), controller.getScheduledController);
router.get('/broadcast/inapp/history', validateQuery(schema.paginationSchema), controller.getHistoryController);

// ============================================
// FILTER OPTIONS (static paths - must be before :id)
// ============================================
router.get('/broadcast/inapp/filters/shops', controller.getShopsForFilterController);
router.get('/broadcast/inapp/filters/roles', controller.getUserRolesController);
router.get('/broadcast/inapp/filters/cadmin-roles', controller.getCAdminRolesController);

// ============================================
// SEGMENTS (static paths - must be before :id)
// ============================================
router.post('/broadcast/inapp/segments', validateBody(schema.segmentSchema), controller.createSegmentController);
router.get('/broadcast/inapp/segments', controller.getSegmentsController);
router.delete('/broadcast/inapp/segments/:segmentId', controller.deleteSegmentController);  // Use different param name

// ============================================
// TEMPLATES (static paths - must be before :id)
// ============================================
router.post('/broadcast/inapp/templates', validateBody(schema.templateSchema), controller.createTemplateController);
router.get('/broadcast/inapp/templates', controller.getTemplatesController);
router.post('/broadcast/inapp/templates/:templateId/use', controller.useTemplateController);  // Use different param name

// ============================================
// PARAMETERIZED ROUTES LAST (these catch :id)
// ============================================
router.get('/broadcast/inapp/:id', controller.getCampaignByIdController);
router.put('/broadcast/inapp/:id', validateBody(schema.updateDraftSchema), controller.updateDraftController);
router.delete('/broadcast/inapp/:id', controller.cancelOrDeleteController);
router.post('/broadcast/inapp/:id/schedule', validateBody(schema.scheduleSchema), controller.scheduleBroadcastController);

export default router;