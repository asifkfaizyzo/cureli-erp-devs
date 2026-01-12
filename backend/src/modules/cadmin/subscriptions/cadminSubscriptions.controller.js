// src/modules/cadmin/subscriptions/cadminSubscriptions.controller.js

import {
  getAtRiskSubscriptions,
  getSubscriptionById,
  sendPaymentReminder,
  extendGracePeriod,
  forceSuspendSubscription,
  reactivateSubscription,
} from "./cadminSubscriptions.service.js";
import { success, fail } from "../../../utils/response.js";

// ============================================
// GET AT-RISK SUBSCRIPTIONS
// ============================================

export async function getAtRiskController(req, res) {
  try {
    const { range = 30 } = req.query;

    // Validate range
    const validRanges = [7, 14, 30];
    const rangeDays = validRanges.includes(Number(range)) ? Number(range) : 30;

    const result = await getAtRiskSubscriptions(rangeDays);

    return success(res, result, "At-risk subscriptions fetched successfully");
  } catch (err) {
    console.error("getAtRiskController error:", err);
    return fail(res, err.message || "Failed to fetch at-risk subscriptions", 500);
  }
}

// ============================================
// GET SUBSCRIPTION BY ID
// ============================================

export async function getSubscriptionByIdController(req, res) {
  try {
    const { subscription_id } = req.params;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    const result = await getSubscriptionById(subscription_id);

    return success(res, result, "Subscription fetched successfully");
  } catch (err) {
    console.error("getSubscriptionByIdController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to fetch subscription", 500);
  }
}

// ============================================
// SEND PAYMENT REMINDER
// ============================================

export async function sendReminderController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { method = "email" } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    // Validate method
    const validMethods = ["email", "sms", "both"];
    if (!validMethods.includes(method)) {
      return fail(res, `Method must be one of: ${validMethods.join(", ")}`, 400);
    }

    const result = await sendPaymentReminder(subscription_id, method, cadmin_id);

    return success(res, result, "Payment reminder sent successfully");
  } catch (err) {
    console.error("sendReminderController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "ALREADY_SUSPENDED") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to send reminder", 500);
  }
}

// ============================================
// EXTEND GRACE PERIOD
// ============================================

export async function extendGraceController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { days, reason } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    if (!days || typeof days !== "number") {
      return fail(res, "Days (number) is required", 400);
    }

    if (!reason || typeof reason !== "string") {
      return fail(res, "Reason (string) is required", 400);
    }

    const result = await extendGracePeriod(subscription_id, days, reason, cadmin_id);

    return success(res, result, "Grace period extended successfully");
  } catch (err) {
    console.error("extendGraceController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "VALIDATION_ERROR" || err.code === "ALREADY_SUSPENDED") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to extend grace period", 500);
  }
}

// ============================================
// FORCE SUSPEND SUBSCRIPTION
// ============================================

export async function forceSuspendController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { reason } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    if (!reason || typeof reason !== "string") {
      return fail(res, "Reason (string) is required", 400);
    }

    const result = await forceSuspendSubscription(subscription_id, reason, cadmin_id);

    return success(res, result, "Subscription suspended successfully");
  } catch (err) {
    console.error("forceSuspendController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "VALIDATION_ERROR" || err.code === "ALREADY_SUSPENDED") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to suspend subscription", 500);
  }
}

// ============================================
// REACTIVATE SUBSCRIPTION
// ============================================

export async function reactivateController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { reason, extend_days = 30 } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!subscription_id) {
      return fail(res, "Subscription ID is required", 400);
    }

    if (!reason || typeof reason !== "string") {
      return fail(res, "Reason (string) is required", 400);
    }

    const result = await reactivateSubscription(
      subscription_id,
      reason,
      extend_days,
      cadmin_id
    );

    return success(res, result, "Subscription reactivated successfully");
  } catch (err) {
    console.error("reactivateController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "VALIDATION_ERROR" || err.code === "ALREADY_ACTIVE") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to reactivate subscription", 500);
  }
}