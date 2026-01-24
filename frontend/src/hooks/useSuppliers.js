// src/hooks/useSuppliers.js
import { useState, useEffect, useCallback } from "react";
import suppliersAPI from "../api/suppliers";

export const useSuppliers = (initialFilters = {}) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
  });

  // Fetch all suppliers
  const fetchSuppliers = useCallback(async (filters = {}) => {
    console.log("🔄 fetchSuppliers called with:", filters); // DEBUG
    setLoading(true);
    setError(null);

    try {
      const response = await suppliersAPI.getAll(filters);
      
      console.log("📦 API Response:", response); // DEBUG

      if (response.success) {
        const rawSuppliers = response.data?.suppliers || response.data || [];
        console.log("📋 Raw suppliers:", rawSuppliers); // DEBUG
        
        const mappedSuppliers = mapSupplierData(rawSuppliers);
        console.log("🗺️ Mapped suppliers:", mappedSuppliers); // DEBUG
        
        setSuppliers(mappedSuppliers);
        setPagination({
          total: response.data?.total || mappedSuppliers.length,
          limit: filters.limit || 100,
          offset: filters.offset || 0,
        });
      } else {
        throw new Error(response.message || "Failed to fetch suppliers");
      }
    } catch (err) {
      console.error("❌ Fetch suppliers error:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch suppliers");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new supplier
  const createSupplier = useCallback(async (supplierData) => {
    try {
      const payload = mapToAPIFormat(supplierData);
      console.log("Creating supplier with payload:", payload); // DEBUG
      
      const response = await suppliersAPI.create(payload);

      if (response.success) {
        await fetchSuppliers();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || "Failed to create supplier");
      }
    } catch (err) {
      console.error("Create supplier error:", err);
      return {
        success: false,
        error: err.response?.data?.message || err.message || "Failed to create supplier",
      };
    }
  }, [fetchSuppliers]);

  // Update supplier
  const updateSupplier = useCallback(async (supplierId, supplierData) => {
    try {
      const payload = mapToAPIFormat(supplierData);
      console.log("Updating supplier:", supplierId, payload); // DEBUG
      
      const response = await suppliersAPI.update(supplierId, payload);

      if (response.success) {
        await fetchSuppliers();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || "Failed to update supplier");
      }
    } catch (err) {
      console.error("Update supplier error:", err);
      return {
        success: false,
        error: err.response?.data?.message || err.message || "Failed to update supplier",
      };
    }
  }, [fetchSuppliers]);

  // Refresh data
  const refresh = useCallback((filters = {}) => {
    fetchSuppliers(filters);
  }, [fetchSuppliers]);

  // Initial fetch
  useEffect(() => {
    console.log("🚀 useSuppliers: Initial fetch"); // DEBUG
    fetchSuppliers(initialFilters);
  }, []);

  return {
    suppliers,
    loading,
    error,
    pagination,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    refresh,
    setSuppliers,
  };
};

// Map API data to component format
export const mapSupplierData = (suppliers) => {
  if (!Array.isArray(suppliers)) {
    console.warn("mapSupplierData: suppliers is not an array", suppliers);
    return [];
  }

  return suppliers.map((supplier) => ({
    // IDs
    id: supplier.supplier_id,
    supplier_id: supplier.supplier_id,
    supplierId: supplier.supplier_code || supplier.supplier_id?.slice(-8)?.toUpperCase() || "N/A",

    // Basic Info
    name: supplier.name || "",
    supplierCode: supplier.supplier_code || "",

    // Contact
    contactPerson: supplier.contact_person || "",
    contact: supplier.office_phone || supplier.personal_phone || "",
    officePhone: supplier.office_phone || "",
    personalPhone: supplier.personal_phone || "",
    email: supplier.email || "",

    // Address
    address: formatAddress(supplier),
    addressLine1: supplier.address_line_1 || "",
    addressLine2: supplier.address_line_2 || "",
    city: supplier.city || "",
    state: supplier.state || "",
    pincode: supplier.pincode || "",
    location: supplier.city && supplier.state 
      ? `${supplier.city}, ${supplier.state}` 
      : supplier.city || supplier.state || "",

    // Business Details
    gst: supplier.gst_number || "",
    gstNumber: supplier.gst_number || "",
    panNumber: supplier.pan_number || "",
    drugLicense: supplier.drug_license_no || "",

    // Payment Terms
    creditDays: supplier.credit_days || 0,
    creditLimit: supplier.credit_limit || null,

    // Banking
    bankName: supplier.bank_name || "",
    accountNumber: supplier.account_number || "",
    accountNo: supplier.account_number || "",
    ifsc: supplier.ifsc_code || "",
    ifscCode: supplier.ifsc_code || "",

    // Status
    isActive: supplier.is_active ?? true,

    // Metadata
    createdAt: supplier.created_at,
    updatedAt: supplier.updated_at,

    // Keep original for reference
    _original: supplier,
  }));
};

// Format full address
const formatAddress = (supplier) => {
  const parts = [
    supplier.address_line_1,
    supplier.address_line_2,
    supplier.city,
    supplier.state,
    supplier.pincode,
  ].filter(Boolean);

  return parts.join(", ");
};

// Map component format back to API format
export const mapToAPIFormat = (formData) => {
  return {
    name: formData.name?.trim(),
    supplier_code: formData.supplierCode?.trim() || undefined,
    contact_person: formData.contactPerson?.trim() || undefined,
    office_phone: formData.officePhone?.trim() || formData.contact?.trim() || undefined,
    personal_phone: formData.personalPhone?.trim() || undefined,
    email: formData.email?.trim() || undefined,
    address_line_1: formData.addressLine1?.trim() || formData.address?.split(",")[0]?.trim() || undefined,
    address_line_2: formData.addressLine2?.trim() || undefined,
    city: formData.city?.trim() || undefined,
    state: formData.state?.trim() || undefined,
    pincode: formData.pincode?.trim() || undefined,
    gst_number: formData.gst?.trim() || formData.gstNumber?.trim() || undefined,
    pan_number: formData.panNumber?.trim() || undefined,
    drug_license_no: formData.drugLicense?.trim() || undefined,
    credit_days: formData.creditDays ? parseInt(formData.creditDays) : 0,
    credit_limit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
    bank_name: formData.bankName?.trim() || undefined,
    account_number: formData.accountNumber?.trim() || formData.accountNo?.trim() || undefined,
    ifsc_code: formData.ifsc?.trim() || formData.ifscCode?.trim() || undefined,
  };
};

export default useSuppliers;