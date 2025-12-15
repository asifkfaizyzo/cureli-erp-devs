import prisma from "../../config/prisma.js";
import { success, fail } from "../../utils/response.js";

/**
 * GET /plans
 * Returns ONLY visible plans.
 */
export async function getPlansController(req, res) {
  try {
    const plans = await prisma.plan.findMany({
      where: { is_visible: true },
      orderBy: { price: "asc" },
    });

    return success(res, { plans });
  } catch (err) {
    console.error("❌ Error fetching plans:", err);
    return fail(res, "Failed to load plans.", 500);
  }
}

/**
 * GET /plans/:id
 * Fetch single plan (used when selecting plan details).
 */
export async function getPlanByIdController(req, res) {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { plan_id: id },
    });

    if (!plan) return fail(res, "Plan not found", 404);

    return success(res, { plan });
  } catch (err) {
    console.error("❌ Error fetching plan:", err);
    return fail(res, "Failed to load plan.", 500);
  }
}
