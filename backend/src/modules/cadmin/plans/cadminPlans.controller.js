// src/modules/cadmin/plans/cadminPlans.controller.js

import {
  listPlans,
  getPlanById,
  createCustomPlan,
  updatePlan,
  togglePlanVisibility,
} from "./cadminPlans.service.js";
import { success, fail } from "../../../utils/response.js";

/**
 * List all plans
 */
export async function listPlansController(req, res) {
  try {
    const { include_hidden } = req.query;
    
    const plans = await listPlans({
      includeHidden: include_hidden === "true",
    });

    return success(res, plans, "Plans fetched successfully");
  } catch (err) {
    console.error("listPlansController error:", err);
    return fail(res, err.message || "Failed to fetch plans", 500);
  }
}

/**
 * Get single plan by ID
 */
export async function getPlanByIdController(req, res) {
  try {
    const { plan_id } = req.params;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    const plan = await getPlanById(plan_id);

    if (!plan) {
      return fail(res, "Plan not found", 404);
    }

    return success(res, plan, "Plan fetched successfully");
  } catch (err) {
    console.error("getPlanByIdController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to fetch plan", 500);
  }
}

/**
 * Create a custom plan
 */
export async function createCustomPlanController(req, res) {
  try {
    const { max_users, max_branches, plan_name } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    // Validation
    if (!max_users || max_users < 1 || max_users > 1000) {
      return fail(res, "max_users must be between 1 and 1000", 400);
    }

    if (!max_branches || max_branches < 1 || max_branches > 100) {
      return fail(res, "max_branches must be between 1 and 100", 400);
    }

    const plan = await createCustomPlan({
      max_users: Number(max_users),
      max_branches: Number(max_branches),
      plan_name, // Optional, will auto-generate if not provided
      created_by: cadmin_id,
    });

    return success(res, plan, "Custom plan created successfully", 201);
  } catch (err) {
    console.error("createCustomPlanController error:", err);

    if (err.code === "DUPLICATE_NAME") {
      return fail(res, err.message, 409);
    }

    return fail(res, err.message || "Failed to create custom plan", 500);
  }
}

/**
 * Update a plan
 */
export async function updatePlanController(req, res) {
  try {
    const { plan_id } = req.params;
    const updates = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    // Allowed update fields
    const allowedFields = [
      "plan_name",
      "max_branches",
      "max_users",
      "price_monthly",
      "price_yearly",
      "features_json",
    ];

    const filteredUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return fail(res, "No valid fields to update", 400);
    }

    const plan = await updatePlan(plan_id, filteredUpdates, cadmin_id);

    return success(res, plan, "Plan updated successfully");
  } catch (err) {
    console.error("updatePlanController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "DUPLICATE_NAME") {
      return fail(res, err.message, 409);
    }

    return fail(res, err.message || "Failed to update plan", 500);
  }
}

/**
 * Toggle plan visibility
 */
export async function togglePlanVisibilityController(req, res) {
  try {
    const { plan_id } = req.params;
    const { is_visible } = req.body;
    const cadmin_id = req.cadmin?.cadmin_id;

    if (!plan_id) {
      return fail(res, "Plan ID is required", 400);
    }

    if (typeof is_visible !== "boolean") {
      return fail(res, "is_visible must be a boolean", 400);
    }

    const plan = await togglePlanVisibility(plan_id, is_visible, cadmin_id);

    const action = is_visible ? "visible" : "hidden";
    return success(res, plan, `Plan is now ${action}`);
  } catch (err) {
    console.error("togglePlanVisibilityController error:", err);

    if (err.code === "NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, err.message || "Failed to toggle plan visibility", 500);
  }
}