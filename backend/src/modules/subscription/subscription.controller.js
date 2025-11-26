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

    const shop = await prisma.shop.findUnique({
      where: { shop_id },
      select: { current_subscription_id: true },
    });

    if (!shop) return fail(res, "Shop not found", 404);

    return success(res, {
      has_active_subscription: shop.current_subscription_id ? true : false,
    });
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to fetch subscription status", 500);
  }
}
