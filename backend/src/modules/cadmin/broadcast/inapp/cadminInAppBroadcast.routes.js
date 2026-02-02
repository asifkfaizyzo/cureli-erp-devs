// backend/src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.routes.js

import { Router } from 'express';
import * as controller from './cadminInAppBroadcast.controller.js';
import { validateBody, validateQuery } from '../../../../middleware/validate.js';
import { requireCAdmin } from '../../../../middleware/requireCAdmin.js';
import * as schema from './cadminInAppBroadcast.schema.js';
import { broadcastUpload } from '../../../../config/multerBroadcast.js';

const router = Router();

// All routes require CAdmin auth
router.use(requireCAdmin);

// ============================================
// FILE UPLOAD ROUTES (must be before other routes)
// ============================================
router.post(
  '/broadcast/inapp/upload',
  (req, res, next) => {
    broadcastUpload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 50MB.',
          });
        }
        if (err.message.includes('Invalid file type')) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
      }
      next();
    });
  },
  controller.uploadBroadcastAttachmentController
);
router.delete(
  '/broadcast/inapp/upload/:filename',
  controller.deleteBroadcastAttachmentController
);

// ============================================
// STATIC ROUTES (before :id params)
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
router.delete('/broadcast/inapp/segments/:segmentId', controller.deleteSegmentController);

// ============================================
// TEMPLATES (static paths - must be before :id)
// ============================================
router.post('/broadcast/inapp/templates', validateBody(schema.templateSchema), controller.createTemplateController);
router.get('/broadcast/inapp/templates', controller.getTemplatesController);
router.post('/broadcast/inapp/templates/:templateId/use', controller.useTemplateController);

// ============================================
// PARAMETERIZED ROUTES LAST (these catch :id)
// ============================================
router.get('/broadcast/inapp/:id', controller.getCampaignByIdController);
router.put('/broadcast/inapp/:id', validateBody(schema.updateDraftSchema), controller.updateDraftController);
router.delete('/broadcast/inapp/:id', controller.cancelOrDeleteController);
router.post('/broadcast/inapp/:id/schedule', validateBody(schema.scheduleSchema), controller.scheduleBroadcastController);

export default router;