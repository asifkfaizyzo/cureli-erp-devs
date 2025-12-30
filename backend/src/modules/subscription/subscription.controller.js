//Q:\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\subscription\subscription.controller.js
import { success, fail } from "../../utils/response.js";
import {
  getVisiblePlans,
  getActivePlan,
  getUserDetails,
  createFreeSubscription,
  createPaidSubscription,
  verifyAndActivateSubscription,
  getSubscriptionStatus,
  getSubscriptionHistory,
  analyzePlanChangeService,
  changePlanService,
  getComplianceDataService,
  cancelPendingSubscriptionService,
} from "./subscription.service.js";
import prisma from "../../config/prisma.js";

/**
 * GET /plans - Get all available plans
 */
export async function getPlansController(req, res) {
  try {
    const plans = await getVisiblePlans();
    return success(res, { plans });
  } catch (err) {
    console.error("getPlansController error:", err);
    return fail(res, "Failed to fetch plans", 500);
  }
}

/**
 * GET /user-details - Get current user details for Razorpay prefill
 */
export async function getUserDetailsController(req, res) {
  try {
    const user_id = req.user.user_id;
    const user = await getUserDetails(user_id);

    return success(res, { user });
  } catch (err) {
    console.error("getUserDetailsController error:", err);

    if (err.code === "USER_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, "Failed to fetch user details", 500);
  }
}

/**
 * POST /select - Select a plan
 * For FREE plans: Activates immediately
 * For PAID plans: Creates Razorpay order
 */
export async function selectPlanController(req, res) {
  try {
    const { plan_id } = req.validated;
    const shop_id = req.user.shop_id;
    const user_id = req.user.user_id;

    if (!shop_id) {
      return fail(
        res,
        "Shop not found. Please complete shop setup first.",
        400
      );
    }

    // Check if shop already has active subscription
    const existingSubscription = await prisma.shopSubscription.findFirst({
      where: {
        shop_id,
        status: "active",
        is_active: true,
        end_date: { gte: new Date() },
      },
    });

    if (existingSubscription) {
      return fail(res, "You already have an active subscription", 400);
    }

    // Get the plan
    const plan = await getActivePlan(plan_id);

    // Get user details for Razorpay prefill
    const user = await getUserDetails(user_id);

    // Check if FREE plan
    const isFree = Number(plan.price) === 0;

    if (isFree) {
      // FREE PLAN - Activate immediately
      const subscription = await createFreeSubscription({ shop_id, plan });

      return success(
        res,
        {
          is_free: true,
          subscription: {
            subscription_id: subscription.subscription_id,
            status: subscription.status,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
          },
          plan: {
            plan_id: plan.plan_id,
            name: plan.name,
          },
          redirect: "dashboard",
        },
        "Free plan activated successfully!"
      );
    }

    // PAID PLAN - Create Razorpay order
    const orderData = await createPaidSubscription({ shop_id, plan, user });

    return success(
      res,
      {
        is_free: false,
        subscription_id: orderData.subscription.subscription_id,
        razorpay: {
          key: orderData.razorpay_key,
          order_id: orderData.razorpay_order_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Cureli ERP",
          description: `${plan.name} - Annual Subscription`,
          prefill: {
            name: orderData.user_name || "",
            email: orderData.user_email || "",
            contact: orderData.user_phone || "",
          },
        },
        plan: {
          plan_id: plan.plan_id,
          name: plan.name,
          price: Number(plan.price),
        },
      },
      "Payment order created"
    );
  } catch (err) {
    console.error("selectPlanController error:", err);

    if (err.code === "PLAN_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "USER_NOT_FOUND") {
      return fail(res, "User not found", 404);
    }

    return fail(res, "Plan selection failed. Please try again.", 500);
  }
}

/**
 * POST /confirm - Confirm payment after Razorpay checkout
 */
export async function confirmPaymentController(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscription_id,
    } = req.validated;

    const subscription = await verifyAndActivateSubscription({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscription_id,
    });

    return success(
      res,
      {
        subscription: {
          subscription_id: subscription.subscription_id,
          status: subscription.status,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
        },
        plan: {
          plan_id: subscription.plan.plan_id,
          name: subscription.plan.name,
        },
        redirect: "dashboard",
      },
      "Payment successful! Subscription activated."
    );
  } catch (err) {
    console.error("confirmPaymentController error:", err);

    if (err.code === "INVALID_SIGNATURE") {
      return fail(
        res,
        "Payment verification failed. Please contact support.",
        400
      );
    }
    if (err.code === "TRANSACTION_NOT_FOUND") {
      return fail(res, "Transaction not found", 404);
    }
    if (err.code === "SUBSCRIPTION_MISMATCH") {
      return fail(res, "Invalid subscription", 400);
    }

    return fail(
      res,
      "Payment confirmation failed. Please contact support.",
      500
    );
  }
}

/**
 * GET /status - Get current subscription status
 */
export async function subscriptionStatusController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    const status = await getSubscriptionStatus(shop_id);

    return success(res, { subscription: status });
  } catch (err) {
    console.error("subscriptionStatusController error:", err);
    return fail(res, "Failed to fetch subscription status", 500);
  }
}

/**
 * GET /history - Get subscription history
 */
export async function subscriptionHistoryController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    const history = await getSubscriptionHistory(shop_id);

    return success(res, { history });
  } catch (err) {
    console.error("subscriptionHistoryController error:", err);
    return fail(res, "Failed to fetch subscription history", 500);
  }
}

/**
 * GET /my - Get current user's active subscription
 */
export async function getMySubscription(req, res) {
  try {
    const shop_id = req.user.shop_id;

    if (!shop_id) {
      return success(res, {
        has_active_subscription: false,
        current_plan: null,
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      include: {
        currentSubscription: {
          include: {
            plan: {
              select: {
                plan_id: true,
                name: true,
                price: true,
                max_users: true,
                max_branches: true,
              },
            },
          },
        },
      },
    });

    if (!shop) {
      return success(res, {
        has_active_subscription: false,
        current_plan: null,
      });
    }

    const sub = shop.currentSubscription;

    const isValid =
      sub &&
      sub.is_active &&
      sub.status === "active" &&
      new Date(sub.end_date) > new Date();

    return success(res, {
      has_active_subscription: isValid,
      current_plan: isValid
        ? {
            plan_id: sub.plan.plan_id,
            name: sub.plan.name,
            price: Number(sub.plan.price),
            expires_at: sub.end_date,
            max_branches: sub.plan.max_branches,
            max_users: sub.plan.max_users,
          }
        : null,
      subscription: isValid
        ? {
            subscription_id: sub.subscription_id,
            status: sub.status,
            start_date: sub.start_date,
            end_date: sub.end_date,
            renewal_date: sub.renewal_date,
            branch_limit: sub.branch_limit_snapshot,
            user_limit: sub.user_limit_snapshot,
          }
        : null,
    });
  } catch (err) {
    console.error("getMySubscription error:", err);
    return fail(res, "Failed to fetch subscription status", 500);
  }
}

export async function changePlanController(req, res) {
  try {
    const { plan_id, users_to_disable, branches_to_deactivate } = req.validated;
    const { shop_id, user_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const result = await changePlanService({
      shop_id,
      user_id,
      target_plan_id: plan_id,
      users_to_disable,
      branches_to_deactivate,
    });

    // UPGRADE: Return Razorpay order
    if (result.requires_payment) {
      return success(res, {
        requires_payment: true,
        subscription_id: result.subscription_id,
        razorpay: result.razorpay,
        plan: result.plan,
      }, "Payment required for upgrade");
    }

    // DOWNGRADE: Applied immediately
    return success(res, {
      requires_payment: false,
      subscription: result.subscription,
      plan: result.plan,
      disabled_users: result.disabled_users || 0,
      deactivated_branches: result.deactivated_branches || 0,
    }, "Plan changed successfully");

  } catch (err) {
    console.error("changePlanController error:", err);

    const errorMap = {
      PLAN_NOT_FOUND: 404,
      NO_ACTIVE_SUBSCRIPTION: 400,
      SAME_PLAN: 400,
      NOT_COMPLIANT: 400,
      CANNOT_DISABLE_OWNER: 400,
      MUST_KEEP_ONE_BRANCH: 400,
      INVALID_USER: 400,
      INVALID_BRANCH: 400,
    };

    const status = errorMap[err.code] || 500;
    return fail(res, err.message, status, { code: err.code, details: err.details });
  }
}

/**
 * GET /api/subscriptions/change/preview/:plan_id
 * Preview plan change impact
 */
export async function previewPlanChangeController(req, res) {
  try {
    const { plan_id } = req.params;
    const { shop_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const preview = await analyzePlanChangeService(shop_id, plan_id);

    return success(res, preview);
  } catch (err) {
    console.error("previewPlanChangeController error:", err);

    if (err.code === "PLAN_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "NO_ACTIVE_SUBSCRIPTION") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to preview plan change", 500);
  }
}

/**
 * GET /api/subscriptions/downgrade/compliance/:plan_id
 * Get data needed for compliance modal
 */
export async function getDowngradeComplianceController(req, res) {
  try {
    const { plan_id } = req.params;
    const { shop_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const complianceData = await getComplianceDataService(shop_id, plan_id);

    return success(res, complianceData);
  } catch (err) {
    console.error("getDowngradeComplianceController error:", err);

    if (err.code === "PLAN_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, "Failed to fetch compliance data", 500);
  }
}

/**
 * POST /api/subscriptions/:subscription_id/cancel
 * Cancel pending subscription
 */
export async function cancelPendingSubscriptionController(req, res) {
  try {
    const { subscription_id } = req.params;
    const { shop_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    await cancelPendingSubscriptionService(subscription_id, shop_id);

    return success(res, null, "Pending subscription cancelled");
  } catch (err) {
    console.error("cancelPendingSubscriptionController error:", err);

    if (err.code === "SUBSCRIPTION_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "NOT_PENDING") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to cancel subscription", 500);
  }
}
