// src/hooks/usePurchaseSupplier.js
import { useState, useEffect, useCallback } from "react";

const generatePurchaseId = () => "PUR-" + Date.now().toString().slice(-6);

const getInitialSupplier = () => ({
  purchaseId: generatePurchaseId(),
  supplierName: "",
  supplierId: "",
  invoiceNo: "",
  invoiceDate: new Date().toISOString().split('T')[0],
  receivedOn: new Date().toISOString().split('T')[0],
  creditDays: "",
  dueDate: "",
  supplierGST: "",
  supplierPhone: "",
  supplierEmail: "",
  address: "",
  amountPaid: "",
  balance: "",
  paymentMode: "",
  notes: "",
});

// Mock suppliers - replace with API
const SUPPLIERS_LIST = [
  { id: 1, name: "ABC Pharma Ltd", gst: "27AABCA1234C1Z5", phone: "+91 98765 43210", email: "abc@pharma.com", address: "Mumbai, Maharashtra", creditDays: 30 },
  { id: 2, name: "XYZ Medicals", gst: "07AAFCX5678D1Z2", phone: "+91 98765 43211", email: "xyz@medicals.com", address: "Delhi, NCR", creditDays: 15 },
  { id: 3, name: "PQR Distributors", gst: "29AAPCP5678R1Z3", phone: "+91 98765 43212", email: "pqr@dist.com", address: "Bangalore, Karnataka", creditDays: 45 },
  { id: 4, name: "LMN Healthcare", gst: "03AABCL1234M1Z4", phone: "+91 98765 43213", email: "lmn@health.com", address: "Chandigarh, Punjab", creditDays: 30 },
  { id: 5, name: "Global Pharma Inc", gst: "24AABCG5678P1Z5", phone: "+91 98765 43214", email: "global@pharma.com", address: "Ahmedabad, Gujarat", creditDays: 60 },
];

export const usePurchaseSupplier = (totalAmount = 0) => {
  const [supplier, setSupplier] = useState(getInitialSupplier);
  const [suppliersList] = useState(SUPPLIERS_LIST);

  // Auto-calculate balance
  useEffect(() => {
    const paid = Number(supplier.amountPaid) || 0;
    const balance = (totalAmount - paid).toFixed(2);
    setSupplier(prev => prev.balance !== balance ? { ...prev, balance } : prev);
  }, [totalAmount, supplier.amountPaid]);

  // Auto-calculate due date when credit days change
  useEffect(() => {
    if (supplier.invoiceDate && supplier.creditDays) {
      const invoiceDate = new Date(supplier.invoiceDate);
      invoiceDate.setDate(invoiceDate.getDate() + Number(supplier.creditDays));
      const dueDate = invoiceDate.toISOString().split('T')[0];
      setSupplier(prev => prev.dueDate !== dueDate ? { ...prev, dueDate } : prev);
    }
  }, [supplier.invoiceDate, supplier.creditDays]);

  const updateSupplier = useCallback((field, value) => {
    setSupplier(prev => ({ ...prev, [field]: value }));
  }, []);

  const selectSupplier = useCallback((selectedSupplier) => {
    if (!selectedSupplier) {
      setSupplier(prev => ({
        ...prev,
        supplierName: "",
        supplierId: "",
        supplierGST: "",
        supplierPhone: "",
        supplierEmail: "",
        address: "",
        creditDays: "",
      }));
      return;
    }
    
    setSupplier(prev => ({
      ...prev,
      supplierName: selectedSupplier.name || "",
      supplierId: selectedSupplier.id || "",
      supplierGST: selectedSupplier.gst || "",
      supplierPhone: selectedSupplier.phone || "",
      supplierEmail: selectedSupplier.email || "",
      address: selectedSupplier.address || "",
      creditDays: selectedSupplier.creditDays?.toString() || "",
    }));
  }, []);

  const resetSupplier = useCallback(() => {
    setSupplier(getInitialSupplier());
  }, []);

  const validateSupplier = useCallback(() => {
    const errors = [];
    if (!supplier.supplierName) errors.push("Supplier name is required");
    if (!supplier.invoiceNo) errors.push("Invoice number is required");
    return { isValid: errors.length === 0, errors };
  }, [supplier]);

  return {
    supplier,
    setSupplier,
    suppliersList,
    updateSupplier,
    selectSupplier,
    resetSupplier,
    validateSupplier,
  };
};

export default usePurchaseSupplier;