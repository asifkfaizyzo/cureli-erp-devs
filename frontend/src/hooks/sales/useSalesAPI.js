// src/hooks/sales/useSalesAPI.js

import { useState, useCallback } from "react";
import salesAPI from "../../api/sales";
import customersAPI from "../../api/customers";
import medicinesAPI from "../../api/medicines";
import { useToast } from "../../components/common/Toast";

export function useSalesAPI() {
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  // Load medicines
  const loadMedicines = useCallback(async () => {
    try {
      const response = await medicinesAPI.getAll({ isActive: true, limit: 1000 });
      setMedicines(response.data?.medicines || []);
    } catch (error) {
      console.error("Load medicines error:", error);
      toast.error("Failed to load medicines");
    }
  }, [toast]);

  // Load customers
  const loadCustomers = useCallback(async () => {
    try {
      const response = await customersAPI.getAll({ isActive: true, limit: 500 });
      setCustomers(response.data?.customers || []);
    } catch (error) {
      console.error("Load customers error:", error);
    }
  }, []);

  // Search medicines
  const searchMedicines = useCallback(async (searchTerm) => {
    try {
      const response = await medicinesAPI.search(searchTerm, 20);
      return response.data?.medicines || [];
    } catch (error) {
      console.error("Search medicines error:", error);
      return [];
    }
  }, []);

  // Get available batches for a medicine
  const getAvailableBatches = useCallback(async (medicineId) => {
    try {
      const response = await salesAPI.getAvailableBatches(medicineId);
      return response.data?.batches || [];
    } catch (error) {
      console.error("Get batches error:", error);
      return [];
    }
  }, []);

  // Search customers
  const searchCustomers = useCallback(async (searchTerm) => {
    try {
      const response = await customersAPI.search(searchTerm, 10);
      return response.data?.customers || [];
    } catch (error) {
      console.error("Search customers error:", error);
      return [];
    }
  }, []);

  // Create customer
  const createCustomer = useCallback(async (customerData) => {
    try {
      const response = await customersAPI.create(customerData);
      if (response.success) {
        toast.success("Customer Created", `${customerData.name} added successfully`);
        await loadCustomers();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      toast.error("Failed to create customer", error.message);
      return null;
    }
  }, [toast, loadCustomers]);

  // Save sales invoice (draft)
  const saveSalesInvoice = useCallback(async (invoiceData, lineItems, customer) => {
  try {
    setIsLoading(true);
    
    const payload = {
      customer_id: customer.customer_id || null,
      walkin_name: !customer.customer_id ? customer.patientName : null,
      walkin_phone: !customer.customer_id ? customer.phone : null,
      invoice_date: new Date(invoiceData.invoice_date).toISOString(),
      prescription_number: invoiceData.prescription_number || null,
      doctor_name: customer.doctorName || null,
      bill_discount_percent: 0,
      lineItems: lineItems.map(item => ({
        medicine_id: item.medicine_id,
        inventory_id: item.inventory_id,
        batch_number: item.batch,
        expiry_date: parseExpiryToDate(item.exp),
        quantity: parseFloat(item.qty),
        unit_of_measure: "UNIT",
        
        // ✅ ADD THIS LINE - Send selling_rate (from rate field)
        selling_rate: parseFloat(item.rate),
        
        // Keep MRP as well
        mrp: parseFloat(item.mrp),
        
        discount_percent: parseFloat(item.discountPercent) || 0,
        cgst_percent: parseFloat(item.cgstPercent) || 6,
        sgst_percent: parseFloat(item.sgstPercent) || 6,
      })),
      remarks: invoiceData.remarks || null,
    };

    // ✅ ADD DEBUG LOG
    console.log("📤 Sending sales invoice payload:", {
      lineItems: payload.lineItems.map(li => ({
        selling_rate: li.selling_rate,
        mrp: li.mrp,
        quantity: li.quantity,
      }))
    });

    let response;
    if (currentInvoice) {
      response = { success: true, data: currentInvoice };
    } else {
      response = await salesAPI.createDraft(payload);
    }

    if (response.success) {
      setCurrentInvoice(response.data);
      return response.data;
    }
    
    throw new Error(response.message || "Failed to save invoice");
  } catch (error) {
    toast.error("Save Failed", error.message);
    return null;
  } finally {
    setIsLoading(false);
  }
}, [currentInvoice, toast]);

  // Confirm sales invoice
  const confirmSalesInvoice = useCallback(async (invoiceId, data = {}) => {
    try {
      setIsLoading(true);
      const response = await salesAPI.confirm(invoiceId, data);
      
      if (response.success) {
        setCurrentInvoice(response.data);
        return response.data;
      }
      
      throw new Error(response.message || "Failed to confirm invoice");
    } catch (error) {
      toast.error("Confirmation Failed", error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load invoice for edit
  const loadInvoiceForEdit = useCallback(async (invoiceId) => {
    try {
      setIsLoading(true);
      const response = await salesAPI.getById(invoiceId);
      
      if (response.success) {
        setCurrentInvoice(response.data);
        return response.data;
      }
      
      throw new Error(response.message || "Failed to load invoice");
    } catch (error) {
      toast.error("Load Failed", error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Reset invoice state
  const resetInvoice = useCallback(() => {
    setCurrentInvoice(null);
  }, []);

  // Record payment
  const recordPayment = useCallback(async (invoiceId, paymentData) => {
    try {
      const response = await salesAPI.recordPayment(invoiceId, paymentData);
      if (response.success) {
        setCurrentInvoice(response.data?.invoice);
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      toast.error("Payment Failed", error.message);
      return null;
    }
  }, [toast]);

  return {
    isLoading,
    medicines,
    customers,
    currentInvoice,
    loadMedicines,
    loadCustomers,
    searchMedicines,
    getAvailableBatches,
    searchCustomers,
    createCustomer,
    saveSalesInvoice,
    confirmSalesInvoice,
    loadInvoiceForEdit,
    resetInvoice,
    recordPayment,
  };
}

// Helper function
function parseExpiryToDate(exp) {
  if (!exp) return new Date().toISOString();
  const parts = exp.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0]) - 1;
    const year = parseInt(parts[1]) + 2000;
    return new Date(year, month + 1, 0).toISOString(); // Last day of month
  }
  return new Date().toISOString();
}