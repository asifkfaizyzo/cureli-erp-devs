// src/hooks/purchase/usePurchaseAPI.js
import { useState, useCallback } from "react";
import purchaseAPI from "../../api/purchase";
import medicinesAPI from "../../api/medicines";
import suppliersAPI from "../../api/suppliers";
import inventoryAPI from "../../api/inventory";
import { useToast } from "../../components/common/Toast";



const safeParseFloat = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};
/**
 * Convert date string to ISO datetime string
 * Handles: "2026-01-31" -> "2026-01-31T00:00:00.000Z"
 */
const toISODateTime = (dateStr) => {
  if (!dateStr) return null;
  
  // Already ISO datetime format
  if (dateStr.includes('T')) {
    return dateStr;
  }
  
  // Date only format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return `${dateStr}T00:00:00.000Z`;
  }
  
  // Try to parse and convert
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    console.warn('Failed to parse date:', dateStr);
  }
  
  return null;
};

export const usePurchaseAPI = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  // ============================================
  // LOAD INITIAL DATA
  // ============================================

  const loadMedicines = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      const response = await medicinesAPI.getAll({
        isActive: true,
        limit: 1000,
        ...filters,
      });

      const formattedMedicines = response.data.medicines.map((med) => ({
        id: med.medicine_id,
        medicine_id: med.medicine_id,
        name: med.name,
        genericName: med.generic_name,
        manufacturer: med.manufacturer,
        mfac: med.manufacturer,
        category: med.category,
        subCategory: med.sub_category,
        schedule: med.schedule,
        hsnCode: med.hsn_code,
        hsn: med.hsn_code,
        packSize: med.pack_size,
        pack: med.pack_size,
        unitOfMeasure: med.unit_of_measure,
        gst: med.gst_percentage?.toString(),
        cgstPercent: med.cgst_percentage?.toString(),
        sgstPercent: med.sgst_percentage?.toString(),
        rackNo: med.rack_no,
        rack: med.rack_no,
        isActive: med.is_active,
        isDiscontinued: med.is_discontinued,
      }));

      setMedicines(formattedMedicines);
      return formattedMedicines;
    } catch (error) {
      console.error("Load medicines error:", error);
      toast.error("Failed to load medicines", error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await suppliersAPI.getAll({
        isActive: true,
        limit: 500,
      });

      const formattedSuppliers = response.data.suppliers.map((sup) => ({
        id: sup.supplier_id,
        supplier_id: sup.supplier_id,
        supplierId: sup.supplier_code || sup.supplier_id,
        name: sup.name,
        contactPerson: sup.contact_person,
        contact: sup.contact_person,
        officePhone: sup.office_phone,
        personalPhone: sup.personal_phone,
        email: sup.email,
        addressLine1: sup.address_line_1,
        addressLine2: sup.address_line_2,
        address: [sup.address_line_1, sup.address_line_2, sup.city, sup.state, sup.pincode]
          .filter(Boolean)
          .join(", "),
        city: sup.city,
        state: sup.state,
        pincode: sup.pincode,
        gstNumber: sup.gst_number,
        gst: sup.gst_number,
        panNumber: sup.pan_number,
        drugLicenseNo: sup.drug_license_no,
        creditDays: sup.credit_days,
        creditLimit: sup.credit_limit,
        isActive: sup.is_active,
      }));

      setSuppliers(formattedSuppliers);
      return formattedSuppliers;
    } catch (error) {
      console.error("Load suppliers error:", error);
      toast.error("Failed to load suppliers", error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ============================================
  // SEARCH WITH DEBOUNCE
  // ============================================

  const searchMedicines = useCallback(
    async (searchTerm) => {
      if (!searchTerm || searchTerm.length < 2) {
        return medicines;
      }

      try {
        const response = await medicinesAPI.search(searchTerm);
        return response.data.medicines.map((med) => ({
          id: med.medicine_id,
          medicine_id: med.medicine_id,
          name: med.name,
          manufacturer: med.manufacturer,
          mfac: med.manufacturer,
          hsnCode: med.hsn_code,
          hsn: med.hsn_code,
          rackNo: med.rack_no,
          rack: med.rack_no,
          gst: med.gst_percentage?.toString(),
          cgstPercent: med.cgst_percentage?.toString(),
          sgstPercent: med.sgst_percentage?.toString(),
          packSize: med.pack_size,
          pack: med.pack_size,
        }));
      } catch (error) {
        console.error("Search medicines error:", error);
        return [];
      }
    },
    [medicines]
  );

  // ============================================
  // GET EXISTING BATCHES FOR MEDICINE
  // ============================================

  const getExistingBatches = useCallback(async (medicineId, branchId = null) => {
    try {
      const response = await inventoryAPI.getByMedicine(medicineId, {
        branchId,
        includeExpired: false,
      });

      return response.data.map((inv) => ({
        batch_number: inv.batch_number,
        expiry_date: inv.expiry_date,
        mrp: inv.mrp,
        rack_no: inv.rack_no,
        current_stock: inv.current_stock,
        selling_rate: inv.selling_rate,
      }));
    } catch (error) {
      console.error("Get existing batches error:", error);
      return [];
    }
  }, []);

  // ✅ FIXED: Helper to parse Prisma Decimal values from response
const parseDecimalValue = (value) => {
  if (value === null || value === undefined) return null;
  // Prisma Decimal comes as string in JSON response
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'number') return value;
  // Handle Prisma Decimal object
  if (typeof value === 'object' && value.toString) {
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

  // ============================================
  // CREATE NEW MEDICINE - ✅ FIXED: Include pack in response
  // ============================================

const createMedicine = useCallback(
  async (medicineData) => {
    try {
      setIsLoading(true);

      // ✅ Helper: safely convert to number or null
      const toNumberOrNull = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const payload = {
        name: medicineData.name,
        generic_name: medicineData.genericName || medicineData.generic_name || null,
        manufacturer: medicineData.manufacturer,
        category: medicineData.category || null,
        sub_category: medicineData.subCategory || medicineData.sub_category || null,
        schedule: medicineData.schedule || null,
        hsn_code: medicineData.hsnCode || medicineData.hsn_code || null,
        pack_size: medicineData.packSize || medicineData.pack_size || null,
        unit_of_measure: medicineData.unitOfMeasure || medicineData.unit_of_measure || "UNIT",
        gst_percentage: toNumberOrNull(medicineData.gst) ?? 12,
        cgst_percentage: toNumberOrNull(medicineData.cgstPercent) ?? 6,
        sgst_percentage: toNumberOrNull(medicineData.sgstPercent) ?? 6,
        rack_no: medicineData.rackNo || medicineData.rack_no || null,
        
        // ✅ FIXED: Accept both field name formats
        min_stock_level: toNumberOrNull(medicineData.min_stock_level || medicineData.minLevel),
        max_stock_level: toNumberOrNull(medicineData.max_stock_level || medicineData.maxLevel),
        reorder_point: toNumberOrNull(medicineData.reorder_point || medicineData.reorderPoint),
      };

      console.log('📤 usePurchaseAPI createMedicine payload:', {
        name: payload.name,
        min_stock_level: payload.min_stock_level,
        max_stock_level: payload.max_stock_level,
        reorder_point: payload.reorder_point,
      });

      const response = await medicinesAPI.create(payload);

      console.log('📥 Backend response:', {
        id: response.data.medicine_id,
        min_stock_level: response.data.min_stock_level,
        max_stock_level: response.data.max_stock_level,
        reorder_point: response.data.reorder_point,
      });

      // Parse response
      const parseDecimal = (val) => {
        if (val === null || val === undefined) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const newMedicine = {
        id: response.data.medicine_id,
        medicine_id: response.data.medicine_id,
        name: response.data.name,
        manufacturer: response.data.manufacturer,
        mfac: response.data.manufacturer,
        genericName: response.data.generic_name,
        category: response.data.category,
        subCategory: response.data.sub_category,
        schedule: response.data.schedule,
        hsnCode: response.data.hsn_code,
        hsn: response.data.hsn_code,
        packSize: response.data.pack_size,
        pack: response.data.pack_size,
        rackNo: response.data.rack_no,
        rack: response.data.rack_no,
        gst: parseDecimal(response.data.gst_percentage)?.toString() || '12',
        cgstPercent: parseDecimal(response.data.cgst_percentage)?.toString() || '6',
        sgstPercent: parseDecimal(response.data.sgst_percentage)?.toString() || '6',
        
        // ✅ FIXED: Include stock levels in the returned object
        min_stock_level: parseDecimal(response.data.min_stock_level),
        max_stock_level: parseDecimal(response.data.max_stock_level),
        reorder_point: parseDecimal(response.data.reorder_point),
      };

      setMedicines((prev) => [newMedicine, ...prev]);
      toast.success("Medicine Added", `${medicineData.name} has been added successfully.`);

      return newMedicine;
    } catch (error) {
      console.error("Create medicine error:", error);
      console.error("Error response:", error.response?.data);
      toast.error("Failed to create medicine", error.response?.data?.message || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  [toast]
);

// ✅ Also fix bulkCreateMedicines to use same parsing
const bulkCreateMedicines = useCallback(
  async (medicinesData) => {
    try {
      setIsLoading(true);

      const payload = medicinesData.map((med) => ({
        name: med.name,
        generic_name: med.genericName || null,
        manufacturer: med.manufacturer,
        category: med.category || null,
        sub_category: med.subCategory || null,
        schedule: med.schedule || null,
        hsn_code: med.hsnCode || null,
        pack_size: med.packSize || null,
        unit_of_measure: med.unitOfMeasure || "UNIT",
        gst_percentage: safeParseFloat(med.gst) ?? 12,
        cgst_percentage: safeParseFloat(med.cgstPercent) ?? 
                        (safeParseFloat(med.gst) ? safeParseFloat(med.gst) / 2 : 6),
        sgst_percentage: safeParseFloat(med.sgstPercent) ?? 
                        (safeParseFloat(med.gst) ? safeParseFloat(med.gst) / 2 : 6),
        rack_no: med.rackNo || null,
        // ✅ FIXED: Include stock levels in bulk create
        min_stock_level: safeParseFloat(med.minLevel),
        max_stock_level: safeParseFloat(med.maxLevel),
        reorder_point: safeParseFloat(med.reorderPoint),
      }));

      const response = await medicinesAPI.bulkCreate(payload);

      // ✅ FIXED: Map all fields including stock levels with proper parsing
      const createdMedicines = response.data.created.map((med) => ({
        id: med.medicine_id,
        medicine_id: med.medicine_id,
        name: med.name,
        manufacturer: med.manufacturer,
        mfac: med.manufacturer,
        genericName: med.generic_name,
        category: med.category,
        subCategory: med.sub_category,
        schedule: med.schedule,
        hsnCode: med.hsn_code,
        hsn: med.hsn_code,
        rackNo: med.rack_no,
        rack: med.rack_no,
        packSize: med.pack_size,
        pack: med.pack_size,
        gst: parseDecimalValue(med.gst_percentage)?.toString() || '12',
        cgstPercent: parseDecimalValue(med.cgst_percentage)?.toString() || '6',
        sgstPercent: parseDecimalValue(med.sgst_percentage)?.toString() || '6',
        // ✅ NEW: Stock levels
        minLevel: parseDecimalValue(med.min_stock_level),
        maxLevel: parseDecimalValue(med.max_stock_level),
        reorderPoint: parseDecimalValue(med.reorder_point),
      }));

      setMedicines((prev) => [...createdMedicines, ...prev]);

      toast.success(
        "Bulk Import Complete",
        `${response.data.created.length} medicines added. ${response.data.skipped.length} skipped. ${response.data.errors.length} errors.`
      );

      return response.data;
    } catch (error) {
      console.error("Bulk create medicines error:", error);
      toast.error("Bulk import failed", error.response?.data?.message || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  [toast]
);


  // ============================================
  // CREATE NEW SUPPLIER
  // ============================================

  const createSupplier = useCallback(
    async (supplierData) => {
      try {
        setIsLoading(true);

        const payload = {
          name: supplierData.name,
          supplier_code: supplierData.supplierCode || null,
          contact_person: supplierData.contactPerson || null,
          office_phone: supplierData.officePhone || null,
          personal_phone: supplierData.personalPhone || null,
          email: supplierData.email || null,
          address_line_1: supplierData.addressLine1 || null,
          address_line_2: supplierData.addressLine2 || null,
          city: supplierData.city || null,
          state: supplierData.state || null,
          pincode: supplierData.pincode || null,
          gst_number: supplierData.gstNumber || null,
          pan_number: supplierData.panNumber || null,
          drug_license_no: supplierData.drugLicenseNo || null,
          credit_days: supplierData.creditDays || 0,
          credit_limit: supplierData.creditLimit || null,
          bank_name: supplierData.bankName || null,
          account_number: supplierData.accountNumber || null,
          ifsc_code: supplierData.ifscCode || null,
        };

        const response = await suppliersAPI.create(payload);

        const newSupplier = {
          id: response.data.supplier_id,
          supplier_id: response.data.supplier_id,
          supplierId: response.data.supplier_code || response.data.supplier_id,
          name: response.data.name,
          contactPerson: response.data.contact_person,
          contact: response.data.contact_person,
          officePhone: response.data.office_phone,
          personalPhone: response.data.personal_phone,
          email: response.data.email,
          gstNumber: response.data.gst_number,
          gst: response.data.gst_number,
          address: [
            response.data.address_line_1,
            response.data.address_line_2,
            response.data.city,
            response.data.state,
            response.data.pincode,
          ]
            .filter(Boolean)
            .join(", "),
        };

        setSuppliers((prev) => [newSupplier, ...prev]);
        toast.success("Supplier Added", `${supplierData.name} has been added successfully.`);

        return newSupplier;
      } catch (error) {
        console.error("Create supplier error:", error);
        toast.error("Failed to create supplier", error.response?.data?.message || error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // ============================================
  // SAVE PURCHASE INVOICE (DRAFT) - ✅ FIXED: Date format
  // ============================================

  // src/hooks/purchase/usePurchaseAPI.js - UPDATE savePurchaseInvoice function

const savePurchaseInvoice = useCallback(
  async (invoiceData, rows, supplier) => {
    try {
      setIsLoading(true);

      const filledRows = rows.filter((r) => r.name && r.qty && parseFloat(r.qty) > 0);

      if (filledRows.length === 0) {
        toast.warning("No Items", "Please add at least one item to save.");
        return null;
      }

      // Validate supplier_id
      if (!supplier.supplier_id) {
        toast.error("Missing Supplier", "Please select a valid supplier");
        return null;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(supplier.supplier_id)) {
        toast.error("Invalid Supplier", `Supplier ID must be a UUID.`);
        return null;
      }

      // ✅ NEW: Validate all rows have medicine_id BEFORE building payload
      const rowsWithoutMedicineId = filledRows
        .map((row, idx) => ({ row, idx: idx + 1 }))
        .filter(({ row }) => !row.medicine_id);

      if (rowsWithoutMedicineId.length > 0) {
        const missingProducts = rowsWithoutMedicineId
          .slice(0, 5) // Show max 5 examples
          .map(({ row, idx }) => `Row ${idx}: "${row.name}" (Batch: ${row.batch || 'N/A'})`)
          .join('\n');
        
        const moreCount = rowsWithoutMedicineId.length > 5 
          ? `\n...and ${rowsWithoutMedicineId.length - 5} more` 
          : '';

        toast.error(
          "Products Not in Master", 
          `${rowsWithoutMedicineId.length} item(s) need to be added to product master first:\n${missingProducts}${moreCount}`
        );
        
        console.error("❌ Rows missing medicine_id:", rowsWithoutMedicineId);
        return null;
      }

      // ✅ NEW: Validate all medicine_ids are valid UUIDs
      const invalidMedicineIds = filledRows
        .map((row, idx) => ({ row, idx: idx + 1 }))
        .filter(({ row }) => !uuidRegex.test(row.medicine_id));

      if (invalidMedicineIds.length > 0) {
        console.error("❌ Invalid medicine_id formats:", invalidMedicineIds);
        toast.error(
          "Invalid Product IDs", 
          `${invalidMedicineIds.length} item(s) have invalid product IDs. Please re-select these products.`
        );
        return null;
      }

      // Parse expiry date helper
      const parseExpiryDate = (expString) => {
        if (!expString || !/^\d{2}\/\d{2}$/.test(expString)) {
          const defaultDate = new Date();
          defaultDate.setFullYear(defaultDate.getFullYear() + 1);
          return defaultDate.toISOString();
        }

        const [month, year] = expString.split("/");
        const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        const date = new Date(`${fullYear}-${month}-01`);
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return date.toISOString();
      };

      // Build line items
      const lineItems = filledRows.map((row, idx) => ({
        medicine_id: row.medicine_id,
        batch_number: row.batch || `BATCH-${Date.now()}-${idx}`,
        expiry_date: parseExpiryDate(row.exp),
        manufacturing_date: null,
        quantity: parseFloat(row.qty) || 0,
        free_quantity: parseFloat(row.sch || row.pQty) || 0,
        pack_size: row.pack || null,
        unit_of_measure: "UNIT",
        purchase_rate: parseFloat(row.price) || 0,
        mrp: parseFloat(row.mrp) || 0,
        scheme_discount: parseFloat(row.schemePercent) || 0,
        trade_discount: parseFloat(row.discountPercent) || 0,
        cgst_percent: parseFloat(row.cgstPercent || row.sgstPercent) || 0,
        sgst_percent: parseFloat(row.sgstPercent) || 0,
        igst_percent: 0,
        selling_rate: parseFloat(row.sRate) || null,
        margin_percent: null,
        rack_no: row.rack || null,
      }));

      // ✅ NEW: Log medicine_ids for debugging
      console.group("=== 📦 Purchase Invoice Payload ===");
      console.log("Supplier ID:", supplier.supplier_id);
      console.log("Branch ID:", invoiceData.branch_id);
      console.log("Line Items:", lineItems.length);
      console.log("Medicine IDs:", lineItems.map(li => li.medicine_id));
      
      // ✅ NEW: Check for duplicates (same medicine, different batches is OK)
      const medicineIdCounts = {};
      lineItems.forEach(li => {
        medicineIdCounts[li.medicine_id] = (medicineIdCounts[li.medicine_id] || 0) + 1;
      });
      const duplicateMedicines = Object.entries(medicineIdCounts)
        .filter(([_, count]) => count > 1)
        .map(([id, count]) => ({ id, count }));
      
      if (duplicateMedicines.length > 0) {
        console.log("📋 Multiple batches for same medicine (this is OK):", duplicateMedicines);
      }
      console.groupEnd();

      const paidAmount = parseFloat(supplier.amountPaid) || 0;
      
      const payload = {
        supplier_id: supplier.supplier_id,
        branch_id: invoiceData.branch_id || null,
        supplier_invoice_no: supplier.invoiceNo || null,
        invoice_date: toISODateTime(invoiceData.invoice_date) || new Date().toISOString(),
        due_date: toISODateTime(invoiceData.due_date),
        received_date: toISODateTime(invoiceData.received_date),
        payment_mode: paidAmount > 0 ? (supplier.paymentMode || "CASH") : null,
        paid_amount: paidAmount,
        transport_charges: parseFloat(invoiceData.transport_charges) || null,
        other_charges: parseFloat(invoiceData.other_charges) || null,
        remarks: invoiceData.remarks || null,
        lineItems,
      };

      // Make API call
      let response;
      if (currentInvoice?.invoice_id) {
        response = await purchaseAPI.update(currentInvoice.invoice_id, payload);
        toast.success("Invoice Updated", "Purchase invoice updated successfully.");
      } else {
        response = await purchaseAPI.create(payload);
        toast.success("Invoice Saved", `Invoice #${response.data.invoice_number} saved as draft.`);
      }

      setCurrentInvoice(response.data);
      return response.data;
    } catch (error) {
      console.error("Save purchase invoice error:", error);
      
      let errorMessage = "Failed to save invoice";
      
      if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => `${e.field}: ${e.message}`).join(", ");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error("Save Failed", errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  [toast, currentInvoice]
);;

  // ============================================
  // CONFIRM PURCHASE INVOICE (STOCK UPDATE)
  // ============================================

  const confirmPurchaseInvoice = useCallback(
    async (invoiceId) => {
      try {
        setIsLoading(true);

        const response = await purchaseAPI.confirm(invoiceId);

        toast.success(
          "Invoice Confirmed",
          `Invoice #${response.data.invoice_number} confirmed and stock updated.`
        );

        setCurrentInvoice(response.data);
        return response.data;
      } catch (error) {
        console.error("Confirm purchase invoice error:", error);
        toast.error(
          "Failed to confirm invoice",
          error.response?.data?.message || error.message
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // ============================================
  // LOAD INVOICE FOR EDITING
  // ============================================

  const loadInvoiceForEdit = useCallback(
    async (invoiceId) => {
      try {
        setIsLoading(true);
        const response = await purchaseAPI.getById(invoiceId);

        setCurrentInvoice(response.data);
        return response.data;
      } catch (error) {
        console.error("Load invoice error:", error);
        toast.error("Failed to load invoice", error.response?.data?.message || error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // ============================================
  // RESET CURRENT INVOICE
  // ============================================

  const resetInvoice = useCallback(() => {
    setCurrentInvoice(null);
  }, []);

  return {
    isLoading,
    medicines,
    suppliers,
    currentInvoice,
    loadMedicines,
    loadSuppliers,
    searchMedicines,
    getExistingBatches,
    createMedicine,
    bulkCreateMedicines,
    createSupplier,
    savePurchaseInvoice,
    confirmPurchaseInvoice,
    loadInvoiceForEdit,
    resetInvoice,
  };
};