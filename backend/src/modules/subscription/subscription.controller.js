import { success, fail } from "../../utils/response.js";
import {
  getVisiblePlans,
  createSubscription,
  getSubscriptionStatus,
  getSubscriptionHistory,
} from "./subscription.service.js";
import prisma from "../../config/prisma.js";
export async function getPlansController(req, res) {
  try {
    const plans = await getVisiblePlans();
    return success(res, plans);
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to fetch plans", 500);
  }
}

export async function selectPlanController(req, res) {
  try {
    const { plan_id, billing_cycle } = req.validated;
    const shop_id = req.user.shop_id;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    const { subscription, isFree } = await createSubscription({
      shop_id,
      plan_id,
      billing_cycle,
    });

    if (isFree) {
      return success(res, {
        subscription,
        redirect: "dashboard",
      }, "Plan activated");
    }

    return success(res, {
      subscription,
      redirect: "payment_pending",
    }, "Payment required");

  } catch (err) {
    console.error(err);

    if (err.code === "PLAN_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, "Plan selection failed", 500);
  }
}

export async function subscriptionStatusController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    const status = await getSubscriptionStatus(shop_id);

    return success(res, status);
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to fetch subscription status", 500);
  }
}

export async function subscriptionHistoryController(req, res) {
  try {
    const shop_id = req.user.shop_id;
    const history = await getSubscriptionHistory(shop_id);

    return success(res, history);
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to fetch subscription history", 500);
  }
}




export async function getMySubscription(req, res) {
  try {
    const shop_id = req.user.shop_id;

    // No shop yet = no subscription
    if (!shop_id) {
      return success(res, { 
        has_active_subscription: false,
        current_plan: null 
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
              }
            } 
          }
        }
      }
    });

    if (!shop) {
      return success(res, { 
        has_active_subscription: false,
        current_plan: null 
      });
    }

    const sub = shop.currentSubscription;

    // Check if subscription exists, is active, and not expired
    const isValid = sub && 
                    sub.is_active && 
                    sub.status === "active" &&
                    new Date(sub.end_date) > new Date();

    return success(res, {
      has_active_subscription: isValid,
      current_plan: isValid ? {
        plan_id: sub.plan.plan_id,
        name: sub.plan.name,
        price: Number(sub.plan.price),
        expires_at: sub.end_date,
      } : null,
      subscription: isValid ? {
        subscription_id: sub.subscription_id,
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        renewal_date: sub.renewal_date,
      } : null,
    });
  } catch (err) {
    console.error("getMySubscription error:", err);
    return fail(res, "Failed to fetch subscription status", 500);
  }
}