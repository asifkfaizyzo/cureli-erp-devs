// src/pages/sales/billing/SalesBillingPage.jsx

import { useRef, useCallback, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Shield, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

// Components
import SalesHeader from "./components/SalesHeader";
import SalesTable from "./components/SalesTable";
import CustomerDetailsCard from "./components/CustomerDetailsCard";
import SalesSummaryCard from "./components/SalesSummaryCard";
import SalesInvoicePrint from "./components/SalesInvoicePrint";
import CustomerSearchModal from "./components/CustomerSearchModal";

// Hooks & API
import {
  useSalesCalculation,
  calculateSalesRow,
} from "../../../hooks/sales/useSalesCalculation";
import { useResponsiveRowCount } from "../../../hooks/purchase/useResponsiveRowCount";
import {
  useSalesRows,
  useSalesCustomer,
} from "../../../hooks/sales/useSalesRows";
import { useSalesAPI } from "../../../hooks/sales/useSalesAPI";
import { useToast } from "../../../components/common/Toast";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useAuthStore, selectBranchContext } from "../../../store/useAuthStore";

// Styles
import "../../../styles/print.css";

const COMPANY_DETAILS = {
  name: "PHARMA DISTRIBUTORS PVT. LTD.",
  address: "45, Industrial Area, Phase-II, New Delhi - 110020",
  phone: "+91 11-4567 8900",
  email: "accounts@pharmadist.com",
  gstin: "07AABCP1234M1Z5",
  drugLicense: "DL-DEL-20B-123456",
};

const SalesBillingPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const [searchParams] = useSearchParams();

  const editMode = searchParams.get("mode");
  const isEditingConfirmed = editMode === "edit-confirmed";
  const isEditMode = !!invoiceId;

  const printRef = useRef(null);

  // ============================================
  // DIALOG STATE
  // ============================================
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "danger",
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // ============================================
  // AUTH & BRANCH CONTEXT
  // ============================================
  const branchContext = useAuthStore(selectBranchContext);
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === "super_admin";

  //  FIX: Check `name` property first (that's what auth store uses)
  // Also added debugging to help trace the issue

  // 🔍 DEBUG: Log the entire user object to see its structure
  useEffect(() => {
    
  }, [user]);

  //  FIXED: Correct property order - `name` is the correct property
  const billedByName =
    user?.name ||
    user?.full_name ||
    user?.first_name ||
    user?.username ||
    "Staff";

  // 🔍 DEBUG: Log the resolved billedByName
  useEffect(() => {
    console.log("🔍 DEBUG - Resolved billedByName:", billedByName);
  }, [billedByName]);

  // ============================================
  // API INTEGRATION
  // ============================================
  const {
    isLoading: apiLoading,
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
  } = useSalesAPI();

  // ============================================
  // LOADING STATES
  // ============================================
  const [loadingStates, setLoadingStates] = useState({
    header: true,
    table: true,
    customer: true,
    summary: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  //  NEW: Preview invoice number state
  const [previewInvoiceNumber, setPreviewInvoiceNumber] = useState(null);

  // ============================================
  // INVOICE METADATA
  // ============================================
  const [invoiceData, setInvoiceData] = useState({
    invoice_date: new Date().toISOString().split("T")[0],
    branch_id: branchContext.branch_id || null,
    prescription_number: "",
    remarks: "",
  });

  // ============================================
  // GET RESPONSIVE CONFIG
  // ============================================
  const { visibleRows, rowHeight } = useResponsiveRowCount();

  // ============================================
  // ROWS MANAGEMENT (WITH PERSISTENCE)
  // ============================================
  const {
    rows,
    setRows,
    getFilledRows,
    clearAllRows,
    hasUnsavedData,
    isInitialized: rowsInitialized,
    forceSave,
  } = useSalesRows(visibleRows);

  // ============================================
  // CUSTOMER STATE (WITH PERSISTENCE)
  // ============================================
  const { customer, setCustomer, clearCustomer } = useSalesCustomer();

  // ============================================
  // CALCULATE SUMMARY
  // ============================================
  const { summary } = useSalesCalculation(rows, customer.discountPercent);

  // ============================================
  // SECURITY CHECK
  // ============================================
  useEffect(() => {
    if (isEditingConfirmed && !isSuperAdmin) {
      toast.error(
        "Access Denied",
        "Only Super Admin can edit confirmed invoices.",
      );
      navigate("/sales/invoice");
    }
  }, [isEditingConfirmed, isSuperAdmin, navigate, toast]);

  // ============================================
  //  FIX 1: GENERATE PREVIEW INVOICE NUMBER
  // ============================================
  useEffect(() => {
    if (
      !currentInvoice &&
      branchContext.branch_id &&
      branchContext.branch_name
    ) {
      const branchCode =
        branchContext.branch_name
          .substring(0, 3)
          .toUpperCase()
          .replace(/\s/g, "") || "BR1";

      const timestamp = Date.now().toString().slice(-6);
      setPreviewInvoiceNumber(`SALE-${branchCode}-DRAFT-${timestamp}`);
    }
  }, [currentInvoice, branchContext]);

  // ============================================
  // UPDATE BRANCH_ID WHEN CONTEXT CHANGES
  // ============================================
  useEffect(() => {
    if (branchContext.branch_id) {
      setInvoiceData((prev) => ({
        ...prev,
        branch_id: branchContext.branch_id,
      }));
    }
  }, [branchContext.branch_id]);

  // ============================================
  // SAVE DATA BEFORE PAGE UNLOAD
  // ============================================
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedData()) {
        forceSave();
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedData, forceSave]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F5") {
        e.preventDefault();
        if (!isSaving && currentInvoice?.status !== "CONFIRMED") {
          handleConfirmAndPrint();
        }
      }

      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleNewBill();
      }

      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (!isSaving && currentInvoice?.status !== "CONFIRMED") {
          handleSave();
        }
      }

      if (e.ctrlKey && e.key === "p") {
        if (currentInvoice?.status === "CONFIRMED") {
          e.preventDefault();
          handlePrint();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, currentInvoice]); // eslint-disable-line

  // ============================================
  // LOAD INITIAL DATA
  // ============================================
  useEffect(() => {
    const initData = async () => {
      setLoadingStates({
        header: true,
        table: true,
        customer: true,
        summary: true,
      });

      try {
        setTimeout(() => {
          setLoadingStates((prev) => ({ ...prev, header: false }));
        }, 200);

        await loadMedicines();
        setLoadingStates((prev) => ({ ...prev, table: false, summary: false }));

        await loadCustomers();
        setLoadingStates((prev) => ({ ...prev, customer: false }));

        if (invoiceId) {
          setLoadingStates((prev) => ({
            ...prev,
            table: true,
            customer: true,
            summary: true,
          }));
          const invoice = await loadInvoiceForEdit(invoiceId);
          if (invoice) {
            populateInvoiceData(invoice);
          }
          setLoadingStates((prev) => ({
            ...prev,
            table: false,
            customer: false,
            summary: false,
          }));
        }
      } catch (error) {
        console.error("Init error:", error);
        setLoadingStates({
          header: false,
          table: false,
          customer: false,
          summary: false,
        });

        if (isEditingConfirmed) {
          toast.error(
            "Load Failed",
            "Failed to load confirmed invoice for editing.",
          );
          navigate("/sales/invoice");
        }
      }
    };

    initData();
  }, [invoiceId, isEditingConfirmed]); // eslint-disable-line

  // ============================================
  // POPULATE INVOICE DATA (EDIT MODE)
  // ============================================
  const populateInvoiceData = useCallback(
    (invoice) => {
      if (!invoice) return;

      if (invoice.customer) {
        setCustomer({
          customer_id: invoice.customer.customer_id,
          name: invoice.customer.name,
          phone: invoice.customer.phone || "",
          address: [
            invoice.customer.address_line_1,
            invoice.customer.city,
            invoice.customer.state,
          ]
            .filter(Boolean)
            .join(", "),
          doctorName: invoice.doctor_name || "",
          patientName: invoice.walkin_name || invoice.customer.name || "",
          paymentType: invoice.is_credit_sale ? "CREDIT" : "CASH",
          cashReceived: invoice.paid_amount?.toString() || "",
          gstNumber: invoice.customer.gst_number || "",
          discountPercent: invoice.customer_discount_percent || 0,
          eWayBillNo: "",
          sameAsCustomer: invoice.walkin_name === invoice.customer.name,
        });
      } else {
        setCustomer((prev) => ({
          ...prev,
          customer_id: null,
          name: "",
          patientName: invoice.walkin_name || "",
          phone: invoice.walkin_phone || "",
          doctorName: invoice.doctor_name || "",
          paymentType: "CASH",
          cashReceived: invoice.paid_amount?.toString() || "",
          eWayBillNo: "",
          sameAsCustomer: false,
        }));
      }

      setInvoiceData({
        invoice_date: invoice.invoice_date,
        branch_id: invoice.branch_id,
        prescription_number: invoice.prescription_number || "",
        remarks: invoice.remarks || "",
      });

      const populatedRows = invoice.lineItems.map((item) => {
        let expiry = "";
        if (item.expiry_date) {
          const expDate = new Date(item.expiry_date);
          const month = String(expDate.getMonth() + 1).padStart(2, "0");
          const year = String(expDate.getFullYear()).slice(-2);
          expiry = `${month}/${year}`;
        }

        return {
          medicine_id: item.medicine_id,
          inventory_id: item.inventory_id,
          name: item.medicine?.name || "",
          manufacturer: item.medicine?.manufacturer || "",
          batch: item.batch_number,
          exp: expiry,
          qty: item.quantity?.toString() || "",
          mrp: item.mrp?.toString() || "",
          rate: item.selling_rate?.toString() || item.mrp?.toString() || "",
          rack: item.inventory?.rack_no || "",
          discountPercent: item.discount_percent?.toString() || "0",
          cgstPercent: item.cgst_percent?.toString() || "6",
          sgstPercent: item.sgst_percent?.toString() || "6",
          stock: item.inventory?.available_stock?.toString() || "",
          amount: item.line_total?.toString() || "",
          availableBatches: [],
        };
      });

      setRows(populatedRows);
    },
    [setRows, setCustomer],
  );

  // ============================================
  // CUSTOMER SELECTION FROM MODAL
  // ============================================
  const handleCustomerSelect = useCallback(
    (selectedCustomer) => {
      if (selectedCustomer) {
        setCustomer((prev) => ({
          ...prev,
          customer_id: selectedCustomer.customer_id,
          name: selectedCustomer.name,
          phone: selectedCustomer.phone || "",
          address: selectedCustomer.address_line_1 || "",
          gstNumber: selectedCustomer.gst_number || "",
          discountPercent: selectedCustomer.discount_percent || 0,
          patientName: prev.sameAsCustomer
            ? selectedCustomer.name
            : prev.patientName,
        }));
        toast.success("Customer Selected", `${selectedCustomer.name} selected`);
      }
      setCustomerSearchOpen(false);
    },
    [toast, setCustomer],
  );

  // ============================================
  // PRODUCT SELECTION (WITH BATCH AUTO-SELECT)
  // ============================================
  const handleProductSelect = useCallback(
    async (rowIndex, product, batch = null) => {
      try {
        const batches = await getAvailableBatches(product.medicine_id);
        const selectedBatch = batch || (batches.length > 0 ? batches[0] : null);

        setRows((prev) => {
          const newRows = [...prev];

          let expiry = "";
          if (selectedBatch?.expiry_date) {
            const expDate = new Date(selectedBatch.expiry_date);
            const month = String(expDate.getMonth() + 1).padStart(2, "0");
            const year = String(expDate.getFullYear()).slice(-2);
            expiry = `${month}/${year}`;
          }

          newRows[rowIndex] = {
            ...newRows[rowIndex],
            medicine_id: product.medicine_id,
            inventory_id: selectedBatch?.inventory_id || null,
            name: product.name,
            manufacturer: product.manufacturer || "",
            batch: selectedBatch?.batch_number || "",
            exp: expiry,
            mrp: selectedBatch?.mrp?.toString() || "",
            rate:
              selectedBatch?.selling_rate?.toString() ||
              selectedBatch?.mrp?.toString() ||
              "",
            rack: selectedBatch?.rack_no || product.rack_no || "",
            stock: selectedBatch?.available_stock?.toString() || "",
            cgstPercent: product.cgst_percentage?.toString() || "6",
            sgstPercent: product.sgst_percentage?.toString() || "6",
            availableBatches: batches,
          };

          newRows[rowIndex] = calculateSalesRow(newRows[rowIndex]);
          return newRows;
        });
      } catch (error) {
        console.error("Error selecting product:", error);
        toast.error("Error", "Failed to load product batches");
      }
    },
    [getAvailableBatches, setRows, toast],
  );

  // ============================================
  // BATCH SELECTION FROM DROPDOWN
  // ============================================
  const handleBatchSelect = useCallback(
    (rowIndex, batch) => {
      setRows((prev) => {
        const newRows = [...prev];

        let expiry = "";
        if (batch.expiry_date) {
          const expDate = new Date(batch.expiry_date);
          const month = String(expDate.getMonth() + 1).padStart(2, "0");
          const year = String(expDate.getFullYear()).slice(-2);
          expiry = `${month}/${year}`;
        }

        newRows[rowIndex] = {
          ...newRows[rowIndex],
          inventory_id: batch.inventory_id,
          batch: batch.batch_number,
          exp: expiry,
          mrp: batch.mrp?.toString() || "",
          rate: batch.selling_rate?.toString() || batch.mrp?.toString() || "",
          rack: batch.rack_no || "",
          stock: batch.available_stock?.toString() || "",
        };

        newRows[rowIndex] = calculateSalesRow(newRows[rowIndex]);
        return newRows;
      });
    },
    [setRows],
  );

  // ============================================
  // PRINT HANDLER
  // ============================================
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Sales_Invoice_${currentInvoice?.invoice_number || previewInvoiceNumber || "NEW"}`,
    onAfterPrint: () =>
      toast.success("Print Complete", "Invoice printed successfully."),
    onPrintError: () => toast.error("Print Failed", "Failed to print invoice."),
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print { 
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
      }
    `,
  });

  // ============================================
  // CLEAR TABLE HANDLER
  // ============================================
  const handleClearTable = useCallback(() => {
    const hasData = hasUnsavedData();

    if (hasData) {
      setConfirmDialog({
        isOpen: true,
        type: "danger",
        title: "Clear All Items?",
        message: (
          <div className="space-y-2">
            <p>Are you sure you want to clear all items from the bill?</p>
            <p className="text-sm text-red-600 font-medium">
              This action cannot be undone.
            </p>
          </div>
        ),
        confirmText: "Clear All",
        onConfirm: () => {
          clearAllRows();
          closeConfirmDialog();
          toast.info("Table Cleared", "All items have been removed.");
        },
      });
    } else {
      clearAllRows();
      toast.info("Table Cleared", "All items have been removed.");
    }
  }, [clearAllRows, toast, hasUnsavedData, closeConfirmDialog]);

  // ============================================
  // NEW BILL HANDLER
  // ============================================
  const handleNewBill = useCallback(() => {
    const hasData = hasUnsavedData();

    if (hasData || currentInvoice?.invoice_number) {
      setConfirmDialog({
        isOpen: true,
        type: "warning",
        title: "Start New Bill?",
        message: (
          <div className="space-y-2">
            <p>Are you sure you want to start a new bill?</p>
            {hasData && (
              <p className="text-sm text-amber-600 font-medium">
                You have unsaved changes that will be lost.
              </p>
            )}
            {currentInvoice?.invoice_number && (
              <p className="text-sm text-gray-500">
                Current Bill:{" "}
                <span className="font-mono font-semibold">
                  {currentInvoice.invoice_number}
                </span>
              </p>
            )}
          </div>
        ),
        confirmText: "Start New",
        onConfirm: () => {
          clearAllRows();
          clearCustomer();
          resetInvoice();
          setPreviewInvoiceNumber(null);

          setInvoiceData({
            invoice_date: new Date().toISOString().split("T")[0],
            branch_id: branchContext.branch_id || null,
            prescription_number: "",
            remarks: "",
          });

          closeConfirmDialog();

          if (invoiceId) {
            navigate("/sales/billing");
          }

          toast.success("New Bill", "Ready to create a new sales bill.");
        },
      });
    } else {
      clearAllRows();
      clearCustomer();
      resetInvoice();
      setPreviewInvoiceNumber(null);

      setInvoiceData({
        invoice_date: new Date().toISOString().split("T")[0],
        branch_id: branchContext.branch_id || null,
        prescription_number: "",
        remarks: "",
      });

      if (invoiceId) {
        navigate("/sales/billing");
      }

      toast.success("New Bill", "Ready to create a new sales bill.");
    }
  }, [
    hasUnsavedData,
    currentInvoice,
    clearAllRows,
    clearCustomer,
    resetInvoice,
    branchContext.branch_id,
    invoiceId,
    navigate,
    toast,
    closeConfirmDialog,
  ]);

  // ============================================
  // CUSTOMER VALIDATION HELPER
  // ============================================
  const validateCustomerData = useCallback(() => {
    const errors = [];

    if (!customer.customer_id && customer.phone) {
      const phoneDigits = customer.phone.replace(/\D/g, "");
      if (phoneDigits && !/^\d{10}$/.test(phoneDigits)) {
        errors.push("Invalid phone number (must be 10 digits)");
      }
    }

    if (customer.gstNumber) {
      if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          customer.gstNumber,
        )
      ) {
        errors.push("Invalid GSTIN format");
      }
    }

    if (customer.paymentType === "CREDIT" && !customer.customer_id) {
      errors.push("Credit sales require a registered customer");
    }

    return errors;
  }, [customer]);

  // ============================================
  // DUPLICATE BATCH VALIDATION
  // ============================================
  const validateNoDuplicateBatches = useCallback(() => {
    const inventoryUsage = new Map();
    const dataRows = getFilledRows();

    for (const row of dataRows) {
      const key = `${row.medicine_id}_${row.inventory_id}`;
      const current = inventoryUsage.get(key) || {
        qty: 0,
        name: row.name,
        batch: row.batch,
        stock: row.stock,
      };
      current.qty += parseFloat(row.qty) || 0;
      inventoryUsage.set(key, current);
    }

    for (const [key, data] of inventoryUsage) {
      const totalUsed = data.qty;
      const stock = parseFloat(data.stock) || 0;

      if (totalUsed > stock) {
        return {
          isValid: false,
          error: `${data.name} (Batch: ${data.batch}): Total ${totalUsed} units used across rows, only ${stock} available`,
        };
      }
    }

    return { isValid: true };
  }, [getFilledRows]);

  // ============================================
  // SAVE HANDLER (DRAFT)
  // ============================================
  const handleSave = useCallback(async () => {
    const dataRows = getFilledRows();

    if (dataRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return false;
    }

    if (!invoiceData.branch_id) {
      toast.warning(
        "Branch Required",
        "Please select a branch to create sales invoice",
      );
      return false;
    }

    const customerErrors = validateCustomerData();
    if (customerErrors.length > 0) {
      toast.error("Customer Validation Failed", customerErrors.join(", "));
      return false;
    }

    const duplicateCheck = validateNoDuplicateBatches();
    if (!duplicateCheck.isValid) {
      toast.error("Duplicate Batch Detected", duplicateCheck.error);
      return false;
    }

    for (const row of dataRows) {
      const qty = parseFloat(row.qty) || 0;
      const stock = parseFloat(row.stock) || 0;
      if (qty > stock) {
        toast.error(
          "Insufficient Stock",
          `${row.name} (Batch: ${row.batch}) - Available: ${stock}, Requested: ${qty}`,
        );
        return false;
      }
    }

    setIsSaving(true);
    try {
      const savedInvoice = await saveSalesInvoice(
        invoiceData,
        dataRows,
        customer,
      );
      if (savedInvoice) {
        toast.success(
          "Saved",
          `Bill ${savedInvoice.invoice_number} saved as draft`,
        );
        return true;
      }
      return false;
    } catch (error) {
      toast.error("Save Failed", error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    getFilledRows,
    invoiceData,
    customer,
    saveSalesInvoice,
    toast,
    validateCustomerData,
    validateNoDuplicateBatches,
  ]);

  // ============================================
  // CONFIRM & PRINT HANDLER
  // ============================================
  const handleConfirmAndPrint = useCallback(async () => {
    const dataRows = getFilledRows();

    console.log(
      "🔍 Rows being saved:",
      dataRows.map((r) => ({
        name: r.name,
        qty: r.qty,
        mrp: r.mrp,
        rate: r.rate,
        amount: r.amount,
      })),
    );

    if (dataRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return;
    }

    if (!invoiceData.branch_id) {
      toast.warning("Branch Required", "Please select a branch");
      return;
    }

    const customerErrors = validateCustomerData();
    if (customerErrors.length > 0) {
      toast.error("Customer Validation Failed", customerErrors.join(", "));
      return;
    }

    const duplicateCheck = validateNoDuplicateBatches();
    if (!duplicateCheck.isValid) {
      toast.error("Duplicate Batch Detected", duplicateCheck.error);
      return;
    }

    for (const row of dataRows) {
      const qty = parseFloat(row.qty) || 0;
      const stock = parseFloat(row.stock) || 0;
      if (qty > stock) {
        toast.error(
          "Insufficient Stock",
          `${row.name} (Batch: ${row.batch}) - Available: ${stock}, Requested: ${qty}`,
        );
        return;
      }
    }

    if (customer.paymentType !== "CREDIT") {
      const cashReceived = parseFloat(customer.cashReceived) || 0;
      if (cashReceived < summary.netAmount) {
        toast.warning(
          "Insufficient Payment",
          `Net Amount: ₹${summary.netAmount.toFixed(2)}, Received: ₹${cashReceived.toFixed(2)}`,
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      let invoiceToConfirm = currentInvoice;

      if (!currentInvoice) {
        const savedInvoice = await saveSalesInvoice(
          invoiceData,
          dataRows,
          customer,
        );
        if (!savedInvoice) {
          setIsSaving(false);
          return;
        }
        invoiceToConfirm = savedInvoice;
      }

      const payments = [];

      if (customer.paymentType !== "CREDIT") {
        const paymentAmount =
          customer.paymentType === "CASH"
            ? Math.min(
                parseFloat(customer.cashReceived) || 0,
                summary.netAmount,
              )
            : summary.netAmount;

        if (paymentAmount > 0) {
          payments.push({
            amount: paymentAmount,
            payment_mode: customer.paymentType,
            reference_number: null,
          });
        }
      }

      if (customer.paymentType === "CREDIT" && customer.customer_id) {
        payments.push({
          amount: summary.netAmount,
          payment_mode: "CREDIT",
        });
      }

      const confirmedInvoice = await confirmSalesInvoice(
        invoiceToConfirm.invoice_id,
        { payments },
      );

      if (confirmedInvoice) {
        toast.success(
          "Confirmed",
          `Bill ${confirmedInvoice.invoice_number} confirmed. Stock deducted.`,
        );

        setTimeout(() => {
          handlePrint();

          setTimeout(() => {
            clearAllRows();
            clearCustomer();
            resetInvoice();
            setPreviewInvoiceNumber(null);
          }, 500);
        }, 100);
      }
    } catch (error) {
      toast.error("Confirmation Failed", error.message);
    } finally {
      setIsSaving(false);
    }
  }, [
    getFilledRows,
    invoiceData,
    customer,
    summary,
    currentInvoice,
    saveSalesInvoice,
    confirmSalesInvoice,
    handlePrint,
    toast,
    clearAllRows,
    clearCustomer,
    resetInvoice,
    validateCustomerData,
    validateNoDuplicateBatches,
  ]);

  // ============================================
  // PRINT ONLY (FOR CONFIRMED INVOICES)
  // ============================================
  const handlePrintOnly = useCallback(() => {
    if (currentInvoice?.status === "CONFIRMED") {
      handlePrint();
    } else {
      toast.warning("Not Confirmed", "Please confirm the bill before printing");
    }
  }, [currentInvoice, handlePrint, toast]);

  // ============================================
  // DERIVED STATE
  // ============================================
  const hasData = hasUnsavedData();
  const isConfirmed = currentInvoice?.status === "CONFIRMED";

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1.5 gap-1.5 font-sans">
      {/* WARNING BANNER FOR EDITING CONFIRMED INVOICE */}
      {isEditingConfirmed && (
        <div className="shrink-0 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
              <Shield size={20} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-900">
                  Super Admin: Editing Confirmed Bill
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase">
                  Confirmed
                </span>
              </div>
              <p className="text-sm text-amber-800 mt-1">
                Bill{" "}
                <span className="font-mono font-semibold">
                  {currentInvoice?.invoice_number}
                </span>{" "}
                • Changes will affect inventory and customer balance.
              </p>

              <div className="flex flex-wrap gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  <RefreshCw size={12} />
                  Stock will be adjusted
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  <AlertTriangle size={12} />
                  Audit logged
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/sales/invoice")}
              className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              Cancel Edit
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div
        className={`
        shrink-0 transition-all duration-300 ease-out
        ${!loadingStates.header ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
      >
        <SalesHeader
          onSave={handleSave}
          onConfirmPrint={handleConfirmAndPrint}
          onPrint={handlePrintOnly}
          onClearTable={handleClearTable}
          onNewBill={handleNewBill}
          invoiceNumber={currentInvoice?.invoice_number || previewInvoiceNumber}
          invoiceStatus={currentInvoice?.status || null}
          isLoading={loadingStates.header}
          isSaving={isSaving}
          hasUnsavedData={hasData}
          billedBy={billedByName}
        />
      </div>

      {/* TABLE */}
      <div
        className={`
        flex-1 flex flex-col overflow-hidden bg-white rounded-lg border shadow-sm
        transition-all duration-300 ease-out delay-75
        ${isEditingConfirmed ? "border-amber-300" : "border-gray-200"}
      `}
      >
        <SalesTable
          rows={rows}
          setRows={setRows}
          productMaster={medicines}
          calculateRow={calculateSalesRow}
          visibleRows={visibleRows}
          rowHeight={rowHeight}
          onProductSelect={handleProductSelect}
          onBatchSelect={handleBatchSelect}
          isLoading={loadingStates.table}
          getAvailableBatches={getAvailableBatches}
        />
      </div>

      {/* FOOTER: CUSTOMER DETAILS + SUMMARY */}
      <div className="shrink-0 flex gap-2 h-[220px] 2xl:h-[240px]">
        <div
          className={`
          flex-1 transition-all duration-300 ease-out delay-100
          ${!loadingStates.customer ? "opacity-100 translate-y-0" : "opacity-100"}
        `}
        >
          <CustomerDetailsCard
            customer={customer}
            setCustomer={setCustomer}
            onSearchCustomer={() => setCustomerSearchOpen(true)}
            netAmount={summary.netAmount}
            isLoading={loadingStates.customer}
            billNo={
              currentInvoice?.invoice_number || previewInvoiceNumber || "DRAFT"
            }
          />
        </div>

        <div
          className={`
          w-72 2xl:w-80 transition-all duration-300 ease-out delay-150
          ${!loadingStates.summary ? "opacity-100 translate-y-0" : "opacity-100"}
        `}
        >
          <SalesSummaryCard
            summary={summary}
            customer={customer}
            isLoading={loadingStates.summary}
          />
        </div>
      </div>

      {/* PRINT COMPONENT (HIDDEN) */}
      <div className="hidden">
        <div ref={printRef}>
          <SalesInvoicePrint
            rows={rows}
            customer={customer}
            summary={summary}
            companyDetails={COMPANY_DETAILS}
            invoiceNumber={
              currentInvoice?.invoice_number || previewInvoiceNumber
            }
            invoiceDate={
              currentInvoice?.invoice_date || invoiceData.invoice_date
            }
            billedBy={billedByName}
          />
        </div>
      </div>

      {/* CUSTOMER SEARCH MODAL */}
      <CustomerSearchModal
        isOpen={customerSearchOpen}
        onClose={() => setCustomerSearchOpen(false)}
        onSelect={handleCustomerSelect}
        searchCustomers={searchCustomers}
        createCustomer={createCustomer}
      />

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        type={confirmDialog.type}
      />
    </div>
  );
};

export default SalesBillingPage;

// // src/pages/sales/billing/SalesBillingPage.jsx

// import { useRef, useCallback, useState, useEffect } from "react";
// import { useReactToPrint } from "react-to-print";
// import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { Shield, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

// // Components
// import SalesHeader from "./components/SalesHeader";
// import SalesTable from "./components/SalesTable";
// import CustomerDetailsCard from "./components/CustomerDetailsCard";
// import SalesSummaryCard from "./components/SalesSummaryCard";
// import SalesInvoicePrint from "./components/SalesInvoicePrint";
// import CustomerSearchModal from "./components/CustomerSearchModal";

// // Hooks & API
// import { useSalesCalculation, calculateSalesRow } from "../../../hooks/sales/useSalesCalculation";
// import { useResponsiveRowCount } from "../../../hooks/purchase/useResponsiveRowCount";
// import { useSalesRows, useSalesCustomer } from "../../../hooks/sales/useSalesRows";
// import { useSalesAPI } from "../../../hooks/sales/useSalesAPI";
// import { useToast } from "../../../components/common/Toast";
// import ConfirmDialog from "../../../components/common/ConfirmDialog";
// import { useAuthStore, selectBranchContext } from "../../../store/useAuthStore";

// // Styles
// import "../../../styles/print.css";

// const COMPANY_DETAILS = {
//   name: "PHARMA DISTRIBUTORS PVT. LTD.",
//   address: "45, Industrial Area, Phase-II, New Delhi - 110020",
//   phone: "+91 11-4567 8900",
//   email: "accounts@pharmadist.com",
//   gstin: "07AABCP1234M1Z5",
//   drugLicense: "DL-DEL-20B-123456",
// };

// const SalesBillingPage = () => {
//   const toast = useToast();
//   const navigate = useNavigate();
//   const { invoiceId } = useParams();
//   const [searchParams] = useSearchParams();

//   const editMode = searchParams.get('mode');
//   const isEditingConfirmed = editMode === 'edit-confirmed';
//   const isEditMode = !!invoiceId;

//   const printRef = useRef(null);

//   // ============================================
//   // DIALOG STATE
//   // ============================================
//   const [confirmDialog, setConfirmDialog] = useState({
//     isOpen: false,
//     type: 'danger',
//     title: '',
//     message: '',
//     confirmText: '',
//     onConfirm: () => {},
//   });

//   const [customerSearchOpen, setCustomerSearchOpen] = useState(false);

//   const closeConfirmDialog = useCallback(() => {
//     setConfirmDialog(prev => ({ ...prev, isOpen: false }));
//   }, []);

//   // ============================================
//   // AUTH & BRANCH CONTEXT
//   // ============================================
//   const branchContext = useAuthStore(selectBranchContext);
//   const user = useAuthStore(state => state.user);
//   const isSuperAdmin = user?.role === "super_admin";

//   const billedByName = user?.full_name || user?.first_name || user?.username || "Staff";

//   // ============================================
//   // API INTEGRATION
//   // ============================================
//   const {
//     isLoading: apiLoading,
//     medicines,
//     customers,
//     currentInvoice,
//     loadMedicines,
//     loadCustomers,
//     searchMedicines,
//     getAvailableBatches,
//     searchCustomers,
//     createCustomer,
//     saveSalesInvoice,
//     confirmSalesInvoice,
//     loadInvoiceForEdit,
//     resetInvoice,
//     recordPayment,
//   } = useSalesAPI();

//   // ============================================
//   // LOADING STATES
//   // ============================================
//   const [loadingStates, setLoadingStates] = useState({
//     header: true,
//     table: true,
//     customer: true,
//     summary: true,
//   });
//   const [isSaving, setIsSaving] = useState(false);

//   //  NEW: Preview invoice number state
//   const [previewInvoiceNumber, setPreviewInvoiceNumber] = useState(null);

//   // ============================================
//   // INVOICE METADATA
//   // ============================================
//   const [invoiceData, setInvoiceData] = useState({
//     invoice_date: new Date().toISOString().split('T')[0],
//     branch_id: branchContext.branch_id || null,
//     prescription_number: "",
//     remarks: "",
//   });

//   // ============================================
//   // GET RESPONSIVE CONFIG
//   // ============================================
//   const { visibleRows, rowHeight } = useResponsiveRowCount();

//   // ============================================
//   // ROWS MANAGEMENT (WITH PERSISTENCE)
//   // ============================================
//   const {
//     rows,
//     setRows,
//     getFilledRows,
//     clearAllRows,
//     hasUnsavedData,
//     isInitialized: rowsInitialized,
//     forceSave,
//   } = useSalesRows(visibleRows);

//   // ============================================
//   // CUSTOMER STATE (WITH PERSISTENCE)
//   // ============================================
//   const {
//     customer,
//     setCustomer,
//     clearCustomer,
//   } = useSalesCustomer();

//   // ============================================
//   // CALCULATE SUMMARY
//   // ============================================
//   const { summary } = useSalesCalculation(rows, customer.discountPercent);

//   // ============================================
//   // SECURITY CHECK
//   // ============================================
//   useEffect(() => {
//     if (isEditingConfirmed && !isSuperAdmin) {
//       toast.error("Access Denied", "Only Super Admin can edit confirmed invoices.");
//       navigate('/sales/invoice');
//     }
//   }, [isEditingConfirmed, isSuperAdmin, navigate, toast]);

//   // ============================================
//   //  FIX 1: GENERATE PREVIEW INVOICE NUMBER
//   // ============================================
//   useEffect(() => {
//     if (!currentInvoice && branchContext.branch_id && branchContext.branch_name) {
//       const branchCode = branchContext.branch_name
//         .substring(0, 3)
//         .toUpperCase()
//         .replace(/\s/g, '') || 'BR1';

//       const timestamp = Date.now().toString().slice(-6);
//       setPreviewInvoiceNumber(`SALE-${branchCode}-DRAFT-${timestamp}`);
//     }
//   }, [currentInvoice, branchContext]);

//   // ============================================
//   // UPDATE BRANCH_ID WHEN CONTEXT CHANGES
//   // ============================================
//   useEffect(() => {
//     if (branchContext.branch_id) {
//       setInvoiceData(prev => ({
//         ...prev,
//         branch_id: branchContext.branch_id
//       }));
//     }
//   }, [branchContext.branch_id]);

//   // ============================================
//   // SAVE DATA BEFORE PAGE UNLOAD
//   // ============================================
//   useEffect(() => {
//     const handleBeforeUnload = (e) => {
//       if (hasUnsavedData()) {
//         forceSave();
//         e.preventDefault();
//         e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
//         return e.returnValue;
//       }
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);
//     return () => window.removeEventListener('beforeunload', handleBeforeUnload);
//   }, [hasUnsavedData, forceSave]);

//   // ============================================
//   // KEYBOARD SHORTCUTS
//   // ============================================
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === 'F5') {
//         e.preventDefault();
//         if (!isSaving && currentInvoice?.status !== 'CONFIRMED') {
//           handleConfirmAndPrint();
//         }
//       }

//       if (e.ctrlKey && e.key === 'n') {
//         e.preventDefault();
//         handleNewBill();
//       }

//       if (e.ctrlKey && e.key === 's') {
//         e.preventDefault();
//         if (!isSaving && currentInvoice?.status !== 'CONFIRMED') {
//           handleSave();
//         }
//       }

//       if (e.ctrlKey && e.key === 'p') {
//         if (currentInvoice?.status === 'CONFIRMED') {
//           e.preventDefault();
//           handlePrint();
//         }
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [isSaving, currentInvoice]); // eslint-disable-line

//   // ============================================
//   // LOAD INITIAL DATA
//   // ============================================
//   useEffect(() => {
//     const initData = async () => {
//       setLoadingStates({
//         header: true,
//         table: true,
//         customer: true,
//         summary: true,
//       });

//       try {
//         setTimeout(() => {
//           setLoadingStates(prev => ({ ...prev, header: false }));
//         }, 200);

//         await loadMedicines();
//         setLoadingStates(prev => ({ ...prev, table: false, summary: false }));

//         await loadCustomers();
//         setLoadingStates(prev => ({ ...prev, customer: false }));

//         if (invoiceId) {
//           setLoadingStates(prev => ({ ...prev, table: true, customer: true, summary: true }));
//           const invoice = await loadInvoiceForEdit(invoiceId);
//           if (invoice) {
//             populateInvoiceData(invoice);
//           }
//           setLoadingStates(prev => ({ ...prev, table: false, customer: false, summary: false }));
//         }

//       } catch (error) {
//         console.error("Init error:", error);
//         setLoadingStates({
//           header: false,
//           table: false,
//           customer: false,
//           summary: false,
//         });

//         if (isEditingConfirmed) {
//           toast.error("Load Failed", "Failed to load confirmed invoice for editing.");
//           navigate('/sales/invoice');
//         }
//       }
//     };

//     initData();
//   }, [invoiceId, isEditingConfirmed]); // eslint-disable-line

//   // ============================================
//   // POPULATE INVOICE DATA (EDIT MODE)
//   //  UPDATED: Use selling_rate for rate field
//   // ============================================
//   const populateInvoiceData = useCallback((invoice) => {
//     if (!invoice) return;

//     if (invoice.customer) {
//       setCustomer({
//         customer_id: invoice.customer.customer_id,
//         name: invoice.customer.name,
//         phone: invoice.customer.phone || "",
//         address: [
//           invoice.customer.address_line_1,
//           invoice.customer.city,
//           invoice.customer.state,
//         ].filter(Boolean).join(", "),
//         doctorName: invoice.doctor_name || "",
//         patientName: invoice.walkin_name || invoice.customer.name || "",
//         paymentType: invoice.is_credit_sale ? "CREDIT" : "CASH",
//         cashReceived: invoice.paid_amount?.toString() || "",
//         gstNumber: invoice.customer.gst_number || "",
//         discountPercent: invoice.customer_discount_percent || 0,
//         eWayBillNo: "",
//         sameAsCustomer: invoice.walkin_name === invoice.customer.name,
//       });
//     } else {
//       setCustomer(prev => ({
//         ...prev,
//         customer_id: null,
//         name: "",
//         patientName: invoice.walkin_name || "",
//         phone: invoice.walkin_phone || "",
//         doctorName: invoice.doctor_name || "",
//         paymentType: "CASH",
//         cashReceived: invoice.paid_amount?.toString() || "",
//         eWayBillNo: "",
//         sameAsCustomer: false,
//       }));
//     }

//     setInvoiceData({
//       invoice_date: invoice.invoice_date,
//       branch_id: invoice.branch_id,
//       prescription_number: invoice.prescription_number || "",
//       remarks: invoice.remarks || "",
//     });

//     const populatedRows = invoice.lineItems.map((item) => {
//       let expiry = "";
//       if (item.expiry_date) {
//         const expDate = new Date(item.expiry_date);
//         const month = String(expDate.getMonth() + 1).padStart(2, "0");
//         const year = String(expDate.getFullYear()).slice(-2);
//         expiry = `${month}/${year}`;
//       }

//       return {
//         medicine_id: item.medicine_id,
//         inventory_id: item.inventory_id,
//         name: item.medicine?.name || "",
//         manufacturer: item.medicine?.manufacturer || "",
//         batch: item.batch_number,
//         exp: expiry,
//         qty: item.quantity?.toString() || "",
//         mrp: item.mrp?.toString() || "",

//         //  FIXED: Use selling_rate from item, fallback to mrp
//         rate: item.selling_rate?.toString() || item.mrp?.toString() || "",

//         rack: item.inventory?.rack_no || "",
//         discountPercent: item.discount_percent?.toString() || "0",
//         cgstPercent: item.cgst_percent?.toString() || "6",
//         sgstPercent: item.sgst_percent?.toString() || "6",
//         stock: item.inventory?.available_stock?.toString() || "",
//         amount: item.line_total?.toString() || "",
//         availableBatches: [],
//       };
//     });

//     setRows(populatedRows);
//   }, [setRows, setCustomer]);

//   // ============================================
//   // CUSTOMER SELECTION FROM MODAL
//   // ============================================
//   const handleCustomerSelect = useCallback((selectedCustomer) => {
//     if (selectedCustomer) {
//       setCustomer(prev => ({
//         ...prev,
//         customer_id: selectedCustomer.customer_id,
//         name: selectedCustomer.name,
//         phone: selectedCustomer.phone || "",
//         address: selectedCustomer.address_line_1 || "",
//         gstNumber: selectedCustomer.gst_number || "",
//         discountPercent: selectedCustomer.discount_percent || 0,
//         patientName: prev.sameAsCustomer ? selectedCustomer.name : prev.patientName,
//       }));
//       toast.success("Customer Selected", `${selectedCustomer.name} selected`);
//     }
//     setCustomerSearchOpen(false);
//   }, [toast, setCustomer]);

//   // ============================================
//   // PRODUCT SELECTION (WITH BATCH AUTO-SELECT)
//   // ============================================
//   const handleProductSelect = useCallback(async (rowIndex, product, batch = null) => {
//     try {
//       const batches = await getAvailableBatches(product.medicine_id);
//       const selectedBatch = batch || (batches.length > 0 ? batches[0] : null);

//       setRows((prev) => {
//         const newRows = [...prev];

//         let expiry = "";
//         if (selectedBatch?.expiry_date) {
//           const expDate = new Date(selectedBatch.expiry_date);
//           const month = String(expDate.getMonth() + 1).padStart(2, "0");
//           const year = String(expDate.getFullYear()).slice(-2);
//           expiry = `${month}/${year}`;
//         }

//         newRows[rowIndex] = {
//           ...newRows[rowIndex],
//           medicine_id: product.medicine_id,
//           inventory_id: selectedBatch?.inventory_id || null,
//           name: product.name,
//           manufacturer: product.manufacturer || "",
//           batch: selectedBatch?.batch_number || "",
//           exp: expiry,
//           mrp: selectedBatch?.mrp?.toString() || "",

//           //  Default to selling_rate, fallback to MRP
//           rate: selectedBatch?.selling_rate?.toString() || selectedBatch?.mrp?.toString() || "",

//           rack: selectedBatch?.rack_no || product.rack_no || "",
//           stock: selectedBatch?.available_stock?.toString() || "",
//           cgstPercent: product.cgst_percentage?.toString() || "6",
//           sgstPercent: product.sgst_percentage?.toString() || "6",
//           availableBatches: batches,
//         };

//         newRows[rowIndex] = calculateSalesRow(newRows[rowIndex]);
//         return newRows;
//       });
//     } catch (error) {
//       console.error("Error selecting product:", error);
//       toast.error("Error", "Failed to load product batches");
//     }
//   }, [getAvailableBatches, setRows, toast]);

//   // ============================================
//   // BATCH SELECTION FROM DROPDOWN
//   // ============================================
//   const handleBatchSelect = useCallback((rowIndex, batch) => {
//     setRows((prev) => {
//       const newRows = [...prev];

//       let expiry = "";
//       if (batch.expiry_date) {
//         const expDate = new Date(batch.expiry_date);
//         const month = String(expDate.getMonth() + 1).padStart(2, "0");
//         const year = String(expDate.getFullYear()).slice(-2);
//         expiry = `${month}/${year}`;
//       }

//       newRows[rowIndex] = {
//         ...newRows[rowIndex],
//         inventory_id: batch.inventory_id,
//         batch: batch.batch_number,
//         exp: expiry,
//         mrp: batch.mrp?.toString() || "",

//         //  Default to selling_rate, fallback to MRP
//         rate: batch.selling_rate?.toString() || batch.mrp?.toString() || "",

//         rack: batch.rack_no || "",
//         stock: batch.available_stock?.toString() || "",
//       };

//       newRows[rowIndex] = calculateSalesRow(newRows[rowIndex]);
//       return newRows;
//     });
//   }, [setRows]);

//   // ============================================
//   // PRINT HANDLER
//   // ============================================
//   const handlePrint = useReactToPrint({
//     contentRef: printRef,
//     documentTitle: `Sales_Invoice_${currentInvoice?.invoice_number || previewInvoiceNumber || 'NEW'}`,
//     onAfterPrint: () => toast.success("Print Complete", "Invoice printed successfully."),
//     onPrintError: () => toast.error("Print Failed", "Failed to print invoice."),
//     pageStyle: `
//       @page { size: A4; margin: 10mm; }
//       @media print {
//         body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
//       }
//     `,
//   });

//   // ============================================
//   // CLEAR TABLE HANDLER
//   // ============================================
//   const handleClearTable = useCallback(() => {
//     const hasData = hasUnsavedData();

//     if (hasData) {
//       setConfirmDialog({
//         isOpen: true,
//         type: 'danger',
//         title: 'Clear All Items?',
//         message: (
//           <div className="space-y-2">
//             <p>Are you sure you want to clear all items from the bill?</p>
//             <p className="text-sm text-red-600 font-medium">
//               This action cannot be undone.
//             </p>
//           </div>
//         ),
//         confirmText: 'Clear All',
//         onConfirm: () => {
//           clearAllRows();
//           closeConfirmDialog();
//           toast.info("Table Cleared", "All items have been removed.");
//         },
//       });
//     } else {
//       clearAllRows();
//       toast.info("Table Cleared", "All items have been removed.");
//     }
//   }, [clearAllRows, toast, hasUnsavedData, closeConfirmDialog]);

//   // ============================================
//   // NEW BILL HANDLER
//   // ============================================
//   const handleNewBill = useCallback(() => {
//     const hasData = hasUnsavedData();

//     if (hasData || currentInvoice?.invoice_number) {
//       setConfirmDialog({
//         isOpen: true,
//         type: 'warning',
//         title: 'Start New Bill?',
//         message: (
//           <div className="space-y-2">
//             <p>Are you sure you want to start a new bill?</p>
//             {hasData && (
//               <p className="text-sm text-amber-600 font-medium">
//                 You have unsaved changes that will be lost.
//               </p>
//             )}
//             {currentInvoice?.invoice_number && (
//               <p className="text-sm text-gray-500">
//                 Current Bill: <span className="font-mono font-semibold">{currentInvoice.invoice_number}</span>
//               </p>
//             )}
//           </div>
//         ),
//         confirmText: 'Start New',
//         onConfirm: () => {
//           clearAllRows();
//           clearCustomer();
//           resetInvoice();
//           setPreviewInvoiceNumber(null);

//           setInvoiceData({
//             invoice_date: new Date().toISOString().split('T')[0],
//             branch_id: branchContext.branch_id || null,
//             prescription_number: "",
//             remarks: "",
//           });

//           closeConfirmDialog();

//           if (invoiceId) {
//             navigate('/sales/billing');
//           }

//           toast.success("New Bill", "Ready to create a new sales bill.");
//         },
//       });
//     } else {
//       clearAllRows();
//       clearCustomer();
//       resetInvoice();
//       setPreviewInvoiceNumber(null);

//       setInvoiceData({
//         invoice_date: new Date().toISOString().split('T')[0],
//         branch_id: branchContext.branch_id || null,
//         prescription_number: "",
//         remarks: "",
//       });

//       if (invoiceId) {
//         navigate('/sales/billing');
//       }

//       toast.success("New Bill", "Ready to create a new sales bill.");
//     }
//   }, [
//     hasUnsavedData,
//     currentInvoice,
//     clearAllRows,
//     clearCustomer,
//     resetInvoice,
//     branchContext.branch_id,
//     invoiceId,
//     navigate,
//     toast,
//     closeConfirmDialog
//   ]);

//   // ============================================
//   // CUSTOMER VALIDATION HELPER
//   // ============================================
//   const validateCustomerData = useCallback(() => {
//     const errors = [];

//     if (!customer.customer_id && customer.phone) {
//       const phoneDigits = customer.phone.replace(/\D/g, '');
//       if (phoneDigits && !/^\d{10}$/.test(phoneDigits)) {
//         errors.push("Invalid phone number (must be 10 digits)");
//       }
//     }

//     if (customer.gstNumber) {
//       if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(customer.gstNumber)) {
//         errors.push("Invalid GSTIN format");
//       }
//     }

//     if (customer.paymentType === "CREDIT" && !customer.customer_id) {
//       errors.push("Credit sales require a registered customer");
//     }

//     return errors;
//   }, [customer]);

//   // ============================================
//   // DUPLICATE BATCH VALIDATION
//   // ============================================
//   const validateNoDuplicateBatches = useCallback(() => {
//     const inventoryUsage = new Map();
//     const dataRows = getFilledRows();

//     for (const row of dataRows) {
//       const key = `${row.medicine_id}_${row.inventory_id}`;
//       const current = inventoryUsage.get(key) || { qty: 0, name: row.name, batch: row.batch, stock: row.stock };
//       current.qty += parseFloat(row.qty) || 0;
//       inventoryUsage.set(key, current);
//     }

//     for (const [key, data] of inventoryUsage) {
//       const totalUsed = data.qty;
//       const stock = parseFloat(data.stock) || 0;

//       if (totalUsed > stock) {
//         return {
//           isValid: false,
//           error: `${data.name} (Batch: ${data.batch}): Total ${totalUsed} units used across rows, only ${stock} available`
//         };
//       }
//     }

//     return { isValid: true };
//   }, [getFilledRows]);

//   // ============================================
//   // SAVE HANDLER (DRAFT)
//   // ============================================
//   const handleSave = useCallback(async () => {
//     const dataRows = getFilledRows();

//     if (dataRows.length === 0) {
//       toast.warning("Missing Items", "Please add at least one item.");
//       return false;
//     }

//     if (!invoiceData.branch_id) {
//       toast.warning("Branch Required", "Please select a branch to create sales invoice");
//       return false;
//     }

//     const customerErrors = validateCustomerData();
//     if (customerErrors.length > 0) {
//       toast.error("Customer Validation Failed", customerErrors.join(", "));
//       return false;
//     }

//     const duplicateCheck = validateNoDuplicateBatches();
//     if (!duplicateCheck.isValid) {
//       toast.error("Duplicate Batch Detected", duplicateCheck.error);
//       return false;
//     }

//     for (const row of dataRows) {
//       const qty = parseFloat(row.qty) || 0;
//       const stock = parseFloat(row.stock) || 0;
//       if (qty > stock) {
//         toast.error(
//           "Insufficient Stock",
//           `${row.name} (Batch: ${row.batch}) - Available: ${stock}, Requested: ${qty}`
//         );
//         return false;
//       }
//     }

//     setIsSaving(true);
//     try {
//       const savedInvoice = await saveSalesInvoice(invoiceData, dataRows, customer);
//       if (savedInvoice) {
//         toast.success("Saved", `Bill ${savedInvoice.invoice_number} saved as draft`);
//         return true;
//       }
//       return false;
//     } catch (error) {
//       toast.error("Save Failed", error.message);
//       return false;
//     } finally {
//       setIsSaving(false);
//     }
//   }, [getFilledRows, invoiceData, customer, saveSalesInvoice, toast, validateCustomerData, validateNoDuplicateBatches]);

//   // ============================================
//   // CONFIRM & PRINT HANDLER
//   // ============================================
//   const handleConfirmAndPrint = useCallback(async () => {
//     const dataRows = getFilledRows();

//     console.log("🔍 Rows being saved:", dataRows.map(r => ({
//       name: r.name,
//       qty: r.qty,
//       mrp: r.mrp,
//       rate: r.rate,
//       amount: r.amount,
//     })));

//     if (dataRows.length === 0) {
//       toast.warning("Missing Items", "Please add at least one item.");
//       return;
//     }

//     if (!invoiceData.branch_id) {
//       toast.warning("Branch Required", "Please select a branch");
//       return;
//     }

//     const customerErrors = validateCustomerData();
//     if (customerErrors.length > 0) {
//       toast.error("Customer Validation Failed", customerErrors.join(", "));
//       return;
//     }

//     const duplicateCheck = validateNoDuplicateBatches();
//     if (!duplicateCheck.isValid) {
//       toast.error("Duplicate Batch Detected", duplicateCheck.error);
//       return;
//     }

//     for (const row of dataRows) {
//       const qty = parseFloat(row.qty) || 0;
//       const stock = parseFloat(row.stock) || 0;
//       if (qty > stock) {
//         toast.error(
//           "Insufficient Stock",
//           `${row.name} (Batch: ${row.batch}) - Available: ${stock}, Requested: ${qty}`
//         );
//         return;
//       }
//     }

//     if (customer.paymentType !== "CREDIT") {
//       const cashReceived = parseFloat(customer.cashReceived) || 0;
//       if (cashReceived < summary.netAmount) {
//         toast.warning(
//           "Insufficient Payment",
//           `Net Amount: ₹${summary.netAmount.toFixed(2)}, Received: ₹${cashReceived.toFixed(2)}`
//         );
//         return;
//       }
//     }

//     setIsSaving(true);
//     try {
//       let invoiceToConfirm = currentInvoice;

//       if (!currentInvoice) {
//         const savedInvoice = await saveSalesInvoice(invoiceData, dataRows, customer);
//         if (!savedInvoice) {
//           setIsSaving(false);
//           return;
//         }
//         invoiceToConfirm = savedInvoice;
//       }

//       const payments = [];

//       if (customer.paymentType !== "CREDIT") {
//         const paymentAmount = customer.paymentType === "CASH"
//           ? Math.min(parseFloat(customer.cashReceived) || 0, summary.netAmount)
//           : summary.netAmount;

//         if (paymentAmount > 0) {
//           payments.push({
//             amount: paymentAmount,
//             payment_mode: customer.paymentType,
//             reference_number: null,
//           });
//         }
//       }

//       if (customer.paymentType === "CREDIT" && customer.customer_id) {
//         payments.push({
//           amount: summary.netAmount,
//           payment_mode: "CREDIT",
//         });
//       }

//       const confirmedInvoice = await confirmSalesInvoice(invoiceToConfirm.invoice_id, { payments });

//       if (confirmedInvoice) {
//         toast.success("Confirmed", `Bill ${confirmedInvoice.invoice_number} confirmed. Stock deducted.`);

//         setTimeout(() => {
//           handlePrint();

//           setTimeout(() => {
//             clearAllRows();
//             clearCustomer();
//             resetInvoice();
//             setPreviewInvoiceNumber(null);
//           }, 500);
//         }, 100);
//       }
//     } catch (error) {
//       toast.error("Confirmation Failed", error.message);
//     } finally {
//       setIsSaving(false);
//     }
//   }, [
//     getFilledRows,
//     invoiceData,
//     customer,
//     summary,
//     currentInvoice,
//     saveSalesInvoice,
//     confirmSalesInvoice,
//     handlePrint,
//     toast,
//     clearAllRows,
//     clearCustomer,
//     resetInvoice,
//     validateCustomerData,
//     validateNoDuplicateBatches
//   ]);

//   // ============================================
//   // PRINT ONLY (FOR CONFIRMED INVOICES)
//   // ============================================
//   const handlePrintOnly = useCallback(() => {
//     if (currentInvoice?.status === "CONFIRMED") {
//       handlePrint();
//     } else {
//       toast.warning("Not Confirmed", "Please confirm the bill before printing");
//     }
//   }, [currentInvoice, handlePrint, toast]);

//   // ============================================
//   // DERIVED STATE
//   // ============================================
//   const hasData = hasUnsavedData();
//   const isConfirmed = currentInvoice?.status === 'CONFIRMED';

//   // ============================================
//   // RENDER
//   // ============================================
//   return (
//     <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1.5 gap-1.5 font-sans">

//       {/* WARNING BANNER FOR EDITING CONFIRMED INVOICE */}
//       {isEditingConfirmed && (
//         <div className="shrink-0 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg overflow-hidden shadow-sm">
//           <div className="px-4 py-3 flex items-start gap-4">
//             <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
//               <Shield size={20} className="text-white" />
//             </div>

//             <div className="flex-1 min-w-0">
//               <div className="flex items-center gap-2">
//                 <h3 className="font-bold text-amber-900">
//                   Super Admin: Editing Confirmed Bill
//                 </h3>
//                 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase">
//                   Confirmed
//                 </span>
//               </div>
//               <p className="text-sm text-amber-800 mt-1">
//                 Bill <span className="font-mono font-semibold">{currentInvoice?.invoice_number}</span> •
//                 Changes will affect inventory and customer balance.
//               </p>

//               <div className="flex flex-wrap gap-3 mt-2">
//                 <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
//                   <RefreshCw size={12} />
//                   Stock will be adjusted
//                 </span>
//                 <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
//                   <AlertTriangle size={12} />
//                   Audit logged
//                 </span>
//               </div>
//             </div>

//             <button
//               onClick={() => navigate('/sales/invoice')}
//               className="shrink-0 flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
//             >
//               <ArrowLeft size={16} />
//               Cancel Edit
//             </button>
//           </div>
//         </div>
//       )}

//       {/* HEADER */}
//       <div className={`
//         shrink-0 transition-all duration-300 ease-out
//         ${!loadingStates.header ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
//       `}>
//         <SalesHeader
//           onSave={handleSave}
//           onConfirmPrint={handleConfirmAndPrint}
//           onPrint={handlePrintOnly}
//           onClearTable={handleClearTable}
//           onNewBill={handleNewBill}
//           invoiceNumber={currentInvoice?.invoice_number || previewInvoiceNumber}
//           invoiceStatus={currentInvoice?.status || null}
//           isLoading={loadingStates.header}
//           isSaving={isSaving}
//           hasUnsavedData={hasData}
//           billedBy={billedByName}
//         />
//       </div>

//       {/* TABLE */}
//       <div className={`
//         flex-1 flex flex-col overflow-hidden bg-white rounded-lg border shadow-sm
//         transition-all duration-300 ease-out delay-75
//         ${isEditingConfirmed ? 'border-amber-300' : 'border-gray-200'}
//       `}>
//         <SalesTable
//           rows={rows}
//           setRows={setRows}
//           productMaster={medicines}
//           calculateRow={calculateSalesRow}
//           visibleRows={visibleRows}
//           rowHeight={rowHeight}
//           onProductSelect={handleProductSelect}
//           onBatchSelect={handleBatchSelect}
//           isLoading={loadingStates.table}
//           getAvailableBatches={getAvailableBatches}
//         />
//       </div>

//       {/* FOOTER: CUSTOMER DETAILS + SUMMARY */}
//       <div className="shrink-0 flex gap-2 h-[220px] 2xl:h-[240px]">
//         <div className={`
//           flex-1 transition-all duration-300 ease-out delay-100
//           ${!loadingStates.customer ? 'opacity-100 translate-y-0' : 'opacity-100'}
//         `}>
//           <CustomerDetailsCard
//             customer={customer}
//             setCustomer={setCustomer}
//             onSearchCustomer={() => setCustomerSearchOpen(true)}
//             netAmount={summary.netAmount}
//             isLoading={loadingStates.customer}
//             billNo={currentInvoice?.invoice_number || previewInvoiceNumber || 'DRAFT'}
//           />
//         </div>

//         <div className={`
//           w-72 2xl:w-80 transition-all duration-300 ease-out delay-150
//           ${!loadingStates.summary ? 'opacity-100 translate-y-0' : 'opacity-100'}
//         `}>
//           <SalesSummaryCard
//             summary={summary}
//             customer={customer}
//             isLoading={loadingStates.summary}
//           />
//         </div>
//       </div>

//       {/* PRINT COMPONENT (HIDDEN) */}
//       <div className="hidden">
//         <div ref={printRef}>
//           <SalesInvoicePrint
//             rows={rows}
//             customer={customer}
//             summary={summary}
//             companyDetails={COMPANY_DETAILS}
//             invoiceNumber={currentInvoice?.invoice_number || previewInvoiceNumber}
//             invoiceDate={currentInvoice?.invoice_date || invoiceData.invoice_date}
//             billedBy={billedByName}
//           />
//         </div>
//       </div>

//       {/* CUSTOMER SEARCH MODAL */}
//       <CustomerSearchModal
//         isOpen={customerSearchOpen}
//         onClose={() => setCustomerSearchOpen(false)}
//         onSelect={handleCustomerSelect}
//         searchCustomers={searchCustomers}
//         createCustomer={createCustomer}
//       />

//       {/* CONFIRM DIALOG */}
//       <ConfirmDialog
//         isOpen={confirmDialog.isOpen}
//         onClose={closeConfirmDialog}
//         onConfirm={confirmDialog.onConfirm}
//         title={confirmDialog.title}
//         message={confirmDialog.message}
//         confirmText={confirmDialog.confirmText}
//         cancelText="Cancel"
//         type={confirmDialog.type}
//       />
//     </div>
//   );
// }

// export default SalesBillingPage;
