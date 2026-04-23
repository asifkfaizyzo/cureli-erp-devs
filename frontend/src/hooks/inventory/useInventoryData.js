// src/hooks/inventory/useInventoryData.js

import { useState, useCallback, useRef } from "react";
import medicinesAPI from "../../api/medicines";
import inventoryAPI from "../../api/inventory";

export const useInventoryData = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogLinkStatus, setCatalogLinkStatus] = useState({});
  const [catalogStatusLoading, setCatalogStatusLoading] = useState(false);

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchInventory = useCallback(async (filters = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const thisRequestId = ++requestIdRef.current;

    setLoading(true);

    try {
      const response = await inventoryAPI.getInventory(filters, {
        signal: controller.signal,
      });

      if (thisRequestId !== requestIdRef.current) return;

      console.log("📦 Raw inventory response:", response);

      let items = [];
      if (response?.success && response?.data) {
        items = response.data.inventories || response.data || [];
        console.log("📦 Extracted inventories:", items);
      } else if (Array.isArray(response?.data)) {
        items = response.data;
      } else if (Array.isArray(response)) {
        items = response;
      } else {
        console.warn("⚠️ Unexpected inventory response format:", response);
      }

      const normalized = Array.isArray(items) ? items : [];
      setMedicines(normalized);

      if (normalized.length > 0) {
        fetchCatalogStatusForItems(normalized);
      } else {
        setCatalogLinkStatus({});
        setCatalogStatusLoading(false);
      }
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        return;
      }

      if (thisRequestId === requestIdRef.current) {
        console.error(" Error fetching inventory:", error);
        setMedicines([]);
      }
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const fetchCatalogStatusForItems = async (items) => {
    if (!items || items.length === 0) return;

    setCatalogStatusLoading(true);
    try {
      const medicineIds = items
        .map((m) => m.medicine_id || m.id)
        .filter(Boolean);

      if (medicineIds.length === 0) return;

      const response = await medicinesAPI.getCatalogLinkStatus(medicineIds);

      if (response?.success && Array.isArray(response.data)) {
        const statusMap = {};
        response.data.forEach((item) => {
          if (item.medicine_id) {
            statusMap[item.medicine_id] = {
              status: item.status || "NOT_LINKED",
              master_medicine_id: item.master_medicine_id,
              confidence: item.confidence || 0,
              pending_link_id: item.pending_link_id,
            };
          }
        });
        setCatalogLinkStatus(statusMap);
      }
    } catch (error) {
      console.warn("⚠️ Catalog link status not available:", error.message);
      setCatalogLinkStatus({});
    } finally {
      setCatalogStatusLoading(false);
    }
  };

  const refreshCatalogStatus = useCallback(async () => {
    setMedicines((current) => {
      fetchCatalogStatusForItems(current);
      return current;
    });
  }, []);

  const deleteMedicine = useCallback(async (inventoryId) => {
    try {
      await inventoryAPI.delete(inventoryId);
      setMedicines((prev) =>
        prev.filter(
          (m) => m.inventory_id !== inventoryId && m.id !== inventoryId,
        ),
      );
    } catch (error) {
      console.error(" Error deleting medicine:", error);
      throw error;
    }
  }, []);

  return {
    medicines,
    loading,
    fetchInventory,
    deleteMedicine,
    catalogLinkStatus,
    catalogStatusLoading,
    refreshCatalogStatus,
  };
};
