// backend/src/modules/cadmin/master-medicines/cadminMasterMedicines.controller.js

import {
  getMasterMedicines,
  getMasterMedicineById,
  getMasterMedicineStats,
} from "./cadminMasterMedicines.service.js";

/**
 * GET /cadmin/master-medicines
 * List all master medicines with pagination, search, filters
 */
export async function listMasterMedicines(req, res) {
  try {
    const { search, type, page, limit, sort, order } = req.query;

    const result = await getMasterMedicines({
      search,
      type,
      page,
      limit,
      sort,
      order,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error listing master medicines:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch master medicines",
    });
  }
}

/**
 * GET /cadmin/master-medicines/stats
 * Get statistics for master medicines
 */
export async function getMasterMedicinesStats(req, res) {
  try {
    const stats = await getMasterMedicineStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting master medicine stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
}

/**
 * GET /cadmin/master-medicines/:id
 * Get single master medicine by ID
 */
export async function getMasterMedicine(req, res) {
  try {
    const { id } = req.params;

    const medicine = await getMasterMedicineById(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Master medicine not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Error getting master medicine:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch master medicine",
    });
  }
}