// backend/src/modules/cadmin/marketplace-orders/cadminMarketplaceOrders.controller.js

import { listAllOrders, getOrderDetail } from "./cadminMarketplaceOrders.service.js";
import { success, fail } from "../../../utils/response.js";

/**
 * GET /cadmin/marketplace-orders
 * List all marketplace orders across all shops.
 * Query: page, limit, search, status
 */
export async function listOrders(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || "").trim();
    const status = (req.query.status || "").trim();

    const result = await listAllOrders({ page, limit, search, status });
    return success(res, result, "Orders fetched");
  } catch (err) {
    console.error("[CAdmin Orders] listOrders error:", err.message);
    return fail(res, "Failed to fetch orders", 500);
  }
}

/**
 * GET /cadmin/marketplace-orders/:orderId
 * Get full detail of a single order.
 */
export async function getOrder(req, res) {
  try {
    const order = await getOrderDetail(req.params.orderId);
    return success(res, order, "Order fetched");
  } catch (err) {
    console.error("[CAdmin Orders] getOrder error:", err.message);
    if (err.message === "Order not found") {
      return fail(res, "Order not found", 404);
    }
    return fail(res, "Failed to fetch order", 500);
  }
}