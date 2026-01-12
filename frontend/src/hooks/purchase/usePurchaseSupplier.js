// src/hooks/purchase/usePurchaseSupplier.js
import { useState, useCallback, useEffect } from "react";

const DEFAULT_SUPPLIERS = [
  { id: 1, name: "ABC Pharma Ltd", gst: "27AABCA1234C1Z5", phone: "+91 98765 43210", address: "Mumbai, MH" },
  { id: 2, name: "XYZ Medicals", gst: "07AAFCX5678D1Z2", phone: "+91 98765 43211", address: "Delhi, NCR" },
  { id: 3, name: "PQR Distributors", gst: "29AAPCP5678R1Z3", phone: "+91 98765 43212", address: "Bangalore, KA" },
  { id: 4, name: "LMN Healthcare", gst: "03AABCL1234M1Z4", phone: "+91 98765 43213", address: "Chandigarh, PB" },
  { id: 5, name: "Global Pharma Inc", gst: "24AABCG5678P1Z5", phone: "+91 98765 43214", address: "Ahmedabad, GJ" },
  { id: 6, name: "Sunrise Medicines", gst: "19AABCS5678S1Z6", phone: "+91 98765 43215", address: "Kolkata, WB" },
  { id: 7, name: "Metro Drug House", gst: "33AABCM5678M1Z7", phone: "+91 98765 43216", address: "Chennai, TN" },
  { id: 8, name: "Unity Healthcare", gst: "32AABCU5678U1Z8", phone: "+91 98765 43217", address: "Kochi, KL" },
];

export const usePurchaseSupplier = (total = 0) => {
  const [supplier, setSupplier] = useState({
    purchaseId: `PUR-${Date.now().toString().slice(-6)}`,
    supplierName: "",
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    receivedOn: new Date().toISOString().split("T")[0],
    supplierGST: "",
    supplierPhone: "",
    creditDays: "30",
    amountPaid: "",
    balance: "0.00",
    address: "",
  });

  // ✅ NEW: Suppliers list state
  const [suppliersList, setSuppliersList] = useState(DEFAULT_SUPPLIERS);

  // Auto-calculate balance
  useEffect(() => {
    const paid = parseFloat(supplier.amountPaid) || 0;
    const balance = Math.max(0, total - paid).toFixed(2);
    setSupplier(prev => ({ ...prev, balance }));
  }, [total, supplier.amountPaid]);

  // Select supplier from list
  const selectSupplier = useCallback((selected) => {
    if (selected) {
      setSupplier(prev => ({
        ...prev,
        supplierName: selected.name,
        supplierGST: selected.gst || "",
        supplierPhone: selected.phone || selected.officePhone || "",
        address: selected.address || "",
      }));
    }
  }, []);

  // Validate supplier details
  const validateSupplier = useCallback(() => {
    const errors = [];
    
    if (!supplier.supplierName?.trim()) {
      errors.push("Supplier name is required");
    }
    if (!supplier.invoiceNo?.trim()) {
      errors.push("Invoice number is required");
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [supplier]);

  // Reset supplier
  const resetSupplier = useCallback(() => {
    setSupplier({
      purchaseId: `PUR-${Date.now().toString().slice(-6)}`,
      supplierName: "",
      invoiceNo: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      receivedOn: new Date().toISOString().split("T")[0],
      supplierGST: "",
      supplierPhone: "",
      creditDays: "30",
      amountPaid: "",
      balance: "0.00",
      address: "",
    });
  }, []);

  return {
    supplier,
    setSupplier,
    suppliersList,
    setSuppliersList, // ✅ NEW: Expose setSuppliersList
    selectSupplier,
    validateSupplier,
    resetSupplier,
  };
};