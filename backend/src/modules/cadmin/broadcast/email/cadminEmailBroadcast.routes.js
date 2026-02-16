// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.routes.js

import { Router } from 'express';
import * as controller from './cadminEmailBroadcast.controller.js';
import { validateBody, validateQuery } from '../../../../middleware/validate.js';
import { requireCAdmin } from '../../../../middleware/requireCAdmin.js';
import * as schema from './cadminEmailBroadcast.schema.js';
import { emailBroadcastUpload } from '../../../../config/multerEmailBroadcast.js';
import * as unsubscribeController from './unsubscribeManagement.controller.js';

const router = Router();

// All routes require CAdmin auth
router.use(requireCAdmin);

// ============================================
// FILE UPLOAD ROUTES (must be before parameterized routes)
// ============================================

// Upload inline image
router.post(
  '/broadcast/email/upload/inline-image',
  (req, res, next) => {
    emailBroadcastUpload.single('file')(req, res, (err) => {
      controller.handleMulterError(err, req, res, next);
    });
  },
  controller.uploadInlineImageController
);

// Upload file attachment
router.post(
  '/broadcast/email/upload/attachment',
  (req, res, next) => {
    emailBroadcastUpload.single('file')(req, res, (err) => {
      controller.handleMulterError(err, req, res, next);
    });
  },
  controller.uploadAttachmentController
);

// Delete uploaded file
router.delete(
  '/broadcast/email/upload/:filename',
  controller.deleteAttachmentController
);

// ============================================
// PREVIEW & QUOTA
// ============================================

router.post(
  '/broadcast/email/preview',
  validateBody(schema.previewSchema),
  controller.previewRecipientCountController
);

router.get(
  '/broadcast/email/quota',
  controller.getQuotaStatusController
);

// ============================================
// SEND OPERATIONS
// ============================================

router.post(
  '/broadcast/email/send-now',
  validateBody(schema.sendNowSchema),
  controller.sendImmediateController
);

router.post(
  '/broadcast/email/test',
  validateBody(schema.testEmailSchema),
  controller.sendTestEmailController
);

// ============================================
// DRAFT MANAGEMENT
// ============================================

router.post(
  '/broadcast/email/draft',
  validateBody(schema.createDraftSchema),
  controller.createDraftController
);

router.get(
  '/broadcast/email/drafts',
  validateQuery(schema.paginationSchema),
  controller.getDraftsController
);

router.put(
  '/broadcast/email/draft/:id',
  validateBody(schema.updateDraftSchema),
  controller.updateDraftController
);

router.delete(
  '/broadcast/email/draft/:id',
  controller.deleteDraftController
);

// ============================================
// SCHEDULING
// ============================================

router.post(
  '/broadcast/email/schedule/:id',
  validateBody(schema.scheduleSchema),
  controller.scheduleCampaignController
);

router.get(
  '/broadcast/email/scheduled',
  validateQuery(schema.paginationSchema),
  controller.getScheduledController
);

router.post(
  '/broadcast/email/cancel/:id',
  controller.cancelCampaignController
);

// ============================================
// HISTORY
// ============================================

router.get(
  '/broadcast/email/history',
  validateQuery(schema.paginationSchema),
  controller.getHistoryController
);

// ============================================
// FILTER OPTIONS
// ============================================

router.get(
  '/broadcast/email/filters/shops',
  controller.getShopsForFilterController
);

router.get(
  '/broadcast/email/filters/plans',
  controller.getActivePlansController
);

router.get(
  '/broadcast/email/filters/cadmin-roles',
  controller.getCAdminRolesController
);

// ============================================
// SINGLE CAMPAIGN (must be last - catches :id)
// ============================================

router.get(
  '/broadcast/email/:id',
  controller.getCampaignByIdController
);

// ============================================
// UNSUBSCRIBE MANAGEMENT ROUTES
// ============================================

// Get unsubscribe list
router.get(
  '/broadcast/email/unsubscribes',
  unsubscribeController.getUnsubscribeListController
);

// Get unsubscribe count
router.get(
  '/broadcast/email/unsubscribes/count',
  unsubscribeController.getUnsubscribeCountController
);

// Export unsubscribe list (CSV)
router.get(
  '/broadcast/email/unsubscribes/export',
  unsubscribeController.exportUnsubscribeListController
);

// Add to suppression list
router.post(
  '/broadcast/email/unsubscribes',
  unsubscribeController.addToSuppressionListController
);

// Bulk add to suppression list
router.post(
  '/broadcast/email/unsubscribes/bulk',
  unsubscribeController.bulkAddToSuppressionListController
);

// Remove from suppression list (resubscribe)
router.delete(
  '/broadcast/email/unsubscribes/:email',
  unsubscribeController.removeFromSuppressionListController
);

export default router;