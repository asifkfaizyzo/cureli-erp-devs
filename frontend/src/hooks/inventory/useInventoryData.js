// src/hooks/inventory/useInventoryData.js

import { useState, useCallback, useEffect } from "react";
import medicinesAPI from "../../api/medicines";
import inventoryAPI from "../../api/inventory";

export const useInventoryData = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogLinkStatus, setCatalogLinkStatus] = useState({});
  const [catalogStatusLoading, setCatalogStatusLoading] = useState(false);

  // ============================================
  // FETCH INVENTORY
  // ============================================
  const fetchInventory = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const response = await inventoryAPI.getInventory(filters);
      
      console.log("📦 Raw inventory response:", response);
      
      // ✅ Handle different response formats
      if (response?.success && response?.data) {
        const inventories = response.data.inventories || response.data || [];
        console.log("📦 Extracted inventories:", inventories);
        setMedicines(Array.isArray(inventories) ? inventories : []);
      } else if (Array.isArray(response?.data)) {
        setMedicines(response.data);
      } else if (Array.isArray(response)) {
        setMedicines(response);
      } else {
        console.warn("⚠️ Unexpected inventory response format:", response);
        setMedicines([]);
      }
    } catch (error) {
      console.error("❌ Error fetching inventory:", error);
      setMedicines([]);
      // Don't throw - let the UI handle empty state
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // FETCH CATALOG LINK STATUS
  // ============================================
  const fetchCatalogLinkStatus = useCallback(async () => {
    if (!Array.isArray(medicines) || medicines.length === 0) return;

    setCatalogStatusLoading(true);
    try {
      const medicineIds = medicines
        .map((m) => m.medicine_id || m.id)
        .filter(Boolean);
      
      if (medicineIds.length === 0) {
        setCatalogStatusLoading(false);
        return;
      }

      const response = await medicinesAPI.getCatalogLinkStatus(medicineIds);

      if (response?.success && Array.isArray(response.data)) {
        // Convert array to map for O(1) lookup
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
      // ✅ Don't crash - catalog status is optional
      console.warn("⚠️ Catalog link status not available:", error.message);
      setCatalogLinkStatus({});
    } finally {
      setCatalogStatusLoading(false);
    }
  }, [medicines]);

  // ============================================
  // DELETE MEDICINE
  // ============================================
  const deleteMedicine = useCallback(async (inventoryId) => {
    try {
      await inventoryAPI.delete(inventoryId);
      setMedicines((prev) => 
        prev.filter((m) => 
          m.inventory_id !== inventoryId && m.id !== inventoryId
        )
      );
    } catch (error) {
      console.error("❌ Error deleting medicine:", error);
      throw error;
    }
  }, []);

  // ============================================
  // AUTO-FETCH ON LOAD
  // ============================================
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Fetch catalog link status when medicines change
  useEffect(() => {
    if (Array.isArray(medicines) && medicines.length > 0) {
      fetchCatalogLinkStatus();
    }
  }, [medicines.length]); // Only trigger when length changes

  return {
    medicines,
    loading,
    fetchInventory,
    deleteMedicine,
    catalogLinkStatus,
    catalogStatusLoading,
    refreshCatalogStatus: fetchCatalogLinkStatus,
  };
};