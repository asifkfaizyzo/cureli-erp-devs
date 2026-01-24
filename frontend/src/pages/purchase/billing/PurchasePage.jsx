// src/pages/purchase/billing/PurchasePage.jsx
import { useRef, useCallback, useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useParams } from "react-router-dom";

// Components
import PurchaseHeader from "./components/PurchaseHeader";
import PurchaseTable from "./components/PurchaseTable";
import SupplierDetailsCard from "./components/SupplierDetailsCard";
import PurchaseSummaryCard from "./components/PurchaseSummaryCard";
import PurchaseInvoicePrint from "./components/PurchaseInvoicePrint";
import LoadingOverlay from "../../../components/common/LoadingOverlay";
import SupplierModal from "../../suppliers/components/SupplierModal";
import ProductMasterModal from "../../../components/common/ProductMasterModal";
import BatchProductModal from "../../../components/common/BatchProductModal";

// Hooks
import { usePurchaseCalculation, calculateRow } from "../../../hooks/purchase/usePurchaseCalculation";
import { useResponsiveRowCount } from "../../../hooks/purchase/useResponsiveRowCount";
import { usePurchaseRows } from "../../../hooks/purchase/usePurchaseRows";
import { usePurchaseImportExport } from "../../../hooks/purchase/usePurchaseImportExport";
import { usePurchaseSupplier } from "../../../hooks/purchase/usePurchaseSupplier";
import { usePurchaseAPI } from "../../../hooks/purchase/usePurchaseAPI";
import { useToast } from "../../../components/common/Toast";

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

const PurchasePage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { invoiceId } = useParams(); // For edit mode
  const printRef = useRef(null);

  // ============================================
  // API INTEGRATION
  // ============================================
  const {
    isLoading: apiLoading,
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
  } = usePurchaseAPI();

  // ============================================
  // MODAL STATES
  // ============================================
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [batchProductModalOpen, setBatchProductModalOpen] = useState(false);
  const [pendingProductData, setPendingProductData] = useState(null);
  const [newProductsFromImport, setNewProductsFromImport] = useState([]);

  // ============================================
  // LOCAL STATE
  // ============================================
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    invoice_date: new Date().toISOString(),
    branch_id: null,
    due_date: null,
    received_date: null,
    transport_charges: null,
    other_charges: null,
    remarks: null,
  });

  const isLoading = apiLoading || isLocalLoading;

  // Get responsive config
  const { visibleRows, rowHeight } = useResponsiveRowCount();

  // Custom Hooks
  const { rows, setRows, importRows, getFilledRows, importVersion } = usePurchaseRows(visibleRows);
  const { summary } = usePurchaseCalculation(rows);
  const {
    supplier,
    setSupplier,
    suppliersList,
    setSuppliersList,
    selectSupplier,
    validateSupplier,
  } = usePurchaseSupplier(summary.total);

  const { handleImportFile, handleExportExcel } = usePurchaseImportExport(
    (importedRows, newProducts = []) => {
      if (newProducts.length > 0) {
        setNewProductsFromImport(newProducts);
        setBatchProductModalOpen(true);
      }
      importRows(importedRows);
    },
    supplier,
    toast,
    medicines
  );

  // ============================================
  // LOAD INITIAL DATA
  // ============================================
  useEffect(() => {
    const initData = async () => {
      setIsLocalLoading(true);
      try {
        await Promise.all([loadMedicines(), loadSuppliers()]);

        // If editing existing invoice
        if (invoiceId) {
          const invoice = await loadInvoiceForEdit(invoiceId);
          populateInvoiceData(invoice);
        }
      } catch (error) {
        console.error("Init error:", error);
      } finally {
        setIsLocalLoading(false);
      }
    };

    initData();
  }, [invoiceId]); // eslint-disable-line

  // ============================================
  // UPDATE SUPPLIERS LIST WHEN API LOADS
  // ============================================
  useEffect(() => {
    if (suppliers.length > 0) {
      setSuppliersList(suppliers);
    }
  }, [suppliers, setSuppliersList]);

  // ============================================
  // POPULATE INVOICE DATA (EDIT MODE)
  // ============================================
  const populateInvoiceData = useCallback((invoice) => {
    // Populate supplier details
    setSupplier({
      supplier_id: invoice.supplier.supplier_id,
      supplierName: invoice.supplier.name,
      supplierGST: invoice.supplier.gst_number || "",
      supplierPhone: invoice.supplier.office_phone || invoice.supplier.personal_phone || "",
      address: [
        invoice.supplier.address_line_1,
        invoice.supplier.address_line_2,
        invoice.supplier.city,
        invoice.supplier.state,
        invoice.supplier.pincode,
      ]
        .filter(Boolean)
        .join(", "),
      invoiceNo: invoice.supplier_invoice_no || "",
      purchaseId: invoice.invoice_number,
    });

    // Populate invoice metadata
    setInvoiceData({
      invoice_date: invoice.invoice_date,
      branch_id: invoice.branch_id,
      due_date: invoice.due_date,
      received_date: invoice.received_date,
      transport_charges: invoice.transport_charges,
      other_charges: invoice.other_charges,
      remarks: invoice.remarks,
    });

    // Populate rows from line items
    const populatedRows = invoice.lineItems.map((item) => {
      // Format expiry date to MM/YY
      let expiry = "";
      if (item.expiry_date) {
        const expDate = new Date(item.expiry_date);
        const month = String(expDate.getMonth() + 1).padStart(2, "0");
        const year = String(expDate.getFullYear()).slice(-2);
        expiry = `${month}/${year}`;
      }

      return {
        medicine_id: item.medicine_id,
        name: item.medicine.name,
        mfac: item.medicine.manufacturer,
        batch: item.batch_number,
        hsn: item.medicine.hsn_code,
        exp: expiry,
        pack: item.pack_size,
        pQty: item.free_quantity?.toString() || "",
        qty: item.quantity?.toString() || "",
        price: item.purchase_rate?.toString() || "",
        schemePercent: item.scheme_discount?.toString() || "",
        discountPercent: item.trade_discount?.toString() || "",
        cgstPercent: item.cgst_percent?.toString() || "",
        sgstPercent: item.sgst_percent?.toString() || "",
        mrp: item.mrp?.toString() || "",
        rack: item.rack_no || "",
        sRate: item.selling_rate?.toString() || "",
        sch: item.free_quantity?.toString() || "",
        // Calculated fields
        netRate: item.taxable_amount && item.quantity 
          ? (parseFloat(item.taxable_amount) / parseFloat(item.quantity)).toFixed(2) 
          : "",
        amount: item.line_total?.toString() || "",
      };
    });

    setRows(populatedRows);
  }, [setSupplier, setRows]);

  // ============================================
  // PRINT HANDLER
  // ============================================
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Purchase_Invoice_${currentInvoice?.invoice_number || supplier.invoiceNo || supplier.purchaseId}`,
    onAfterPrint: () => toast.success("Print Complete", "Invoice printed successfully."),
    onPrintError: () => toast.error("Print Failed", "Failed to print invoice."),
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  // ============================================
  // SAVE HANDLER (DRAFT)
  // ============================================
  const handleSave = useCallback(async () => {
    const dataRows = getFilledRows();
    if (dataRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return false;
    }

    const { isValid, errors } = validateSupplier();
    if (!isValid) {
      toast.warning("Validation Error", errors[0]);
      return false;
    }

    try {
      const savedInvoice = await savePurchaseInvoice(invoiceData, dataRows, supplier);
      if (savedInvoice) {
        // Update supplier with invoice number
        setSupplier(prev => ({
          ...prev,
          purchaseId: savedInvoice.invoice_number,
        }));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [getFilledRows, validateSupplier, savePurchaseInvoice, invoiceData, supplier, toast, setSupplier]);

  // ============================================
  // SAVE & PRINT HANDLER (CONFIRM + STOCK UPDATE)
  // ============================================
  const handleSavePrint = useCallback(async () => {
    const dataRows = getFilledRows();
    if (dataRows.length === 0) {
      toast.warning("Please add at least one item to print");
      return;
    }

    try {
      // First save as draft (if not already saved)
      let invoiceToConfirm = currentInvoice;
      
      if (!currentInvoice) {
        const savedInvoice = await savePurchaseInvoice(invoiceData, dataRows, supplier);
        if (!savedInvoice) return;
        invoiceToConfirm = savedInvoice;
      }

      // Then confirm (this updates stock)
      const confirmedInvoice = await confirmPurchaseInvoice(invoiceToConfirm.invoice_id);
      
      if (confirmedInvoice) {
        // Update supplier with confirmed invoice number
        setSupplier(prev => ({
          ...prev,
          purchaseId: confirmedInvoice.invoice_number,
        }));

        // Print after confirmation
        setTimeout(() => {
          handlePrint();
        }, 100);
      }
    } catch (error) {
      console.error("Save & Print error:", error);
    }
  }, [getFilledRows, currentInvoice, savePurchaseInvoice, confirmPurchaseInvoice, invoiceData, supplier, toast, handlePrint, setSupplier]);

  // ============================================
  // EXPORT HANDLER
  // ============================================
  const onExportExcel = useCallback(() => {
    handleExportExcel(rows);
  }, [handleExportExcel, rows]);

  // ============================================
  // SUPPLIER MODAL HANDLERS
  // ============================================
  const handleAddNewSupplier = useCallback((supplierName) => {
    setNewSupplierName(supplierName);
    setSupplierModalOpen(true);
  }, []);

  const handleSupplierSave = useCallback(
    async (newSupplierData) => {
      try {
        const createdSupplier = await createSupplier({
          name: newSupplierData.name,
          contactPerson: newSupplierData.contact,
          officePhone: newSupplierData.officePhone,
          personalPhone: newSupplierData.personalPhone,
          email: newSupplierData.email,
          addressLine1: newSupplierData.address,
          gstNumber: newSupplierData.gst,
        });

        if (createdSupplier) {
          // Auto-select the new supplier
          setSupplier((prev) => ({
            ...prev,
            supplier_id: createdSupplier.supplier_id,
            supplierName: createdSupplier.name,
            supplierGST: createdSupplier.gstNumber || "",
            supplierPhone: createdSupplier.officePhone || createdSupplier.personalPhone || "",
            address: createdSupplier.address || "",
          }));

          setSupplierModalOpen(false);
          setNewSupplierName("");
        }
      } catch (error) {
        console.error("Supplier save error:", error);
      }
    },
    [createSupplier, setSupplier]
  );

  // ============================================
  // PRODUCT MODAL HANDLERS
  // ============================================
  const handleAddNewProduct = useCallback((productData) => {
    setPendingProductData(productData);
    setProductModalOpen(true);
  }, []);

  const handleProductSave = useCallback(
    async (newProductData) => {
      try {
        const createdMedicine = await createMedicine({
          name: newProductData.name,
          manufacturer: newProductData.manufacturer,
          genericName: newProductData.genericName,
          category: newProductData.category,
          hsnCode: newProductData.hsnCode,
          packSize: newProductData.packSize,
          rackNo: newProductData.rackNo,
          gst: newProductData.gst,
        });

        if (createdMedicine && pendingProductData) {
          const { rowIndex } = pendingProductData;
          setRows((prev) => {
            const newRows = [...prev];
            newRows[rowIndex] = {
              ...newRows[rowIndex],
              medicine_id: createdMedicine.medicine_id,
              name: createdMedicine.name,
              mfac: createdMedicine.manufacturer,
              hsn: createdMedicine.hsnCode,
              rack: createdMedicine.rackNo,
              cgstPercent: createdMedicine.cgstPercent,
              sgstPercent: createdMedicine.sgstPercent,
            };
            newRows[rowIndex] = calculateRow(newRows[rowIndex]);
            return newRows;
          });
        }

        setProductModalOpen(false);
        setPendingProductData(null);
      } catch (error) {
        console.error("Product save error:", error);
      }
    },
    [pendingProductData, setRows, createMedicine]
  );

  // ============================================
  // BATCH PRODUCT IMPORT HANDLERS
  // ============================================
  const handleBatchProductSave = useCallback(
    async (productsToSave) => {
      try {
        if (productsToSave.length > 0) {
          await bulkCreateMedicines(productsToSave);
        }
        setBatchProductModalOpen(false);
        setNewProductsFromImport([]);
      } catch (error) {
        console.error("Batch product save error:", error);
      }
    },
    [bulkCreateMedicines]
  );

  const handleBatchProductSkip = useCallback(() => {
    setBatchProductModalOpen(false);
    setNewProductsFromImport([]);
    toast.info("Import Completed", "Import completed. New products were skipped.");
  }, [toast]);

  // ============================================
  // AUTO-FILL FROM EXISTING INVENTORY
  // ============================================
  const handleProductSelect = useCallback(
    async (rowIndex, product) => {
      // Get existing batches for this medicine
      const existingBatches = await getExistingBatches(product.medicine_id);

      setRows((prev) => {
        const newRows = [...prev];
        newRows[rowIndex] = {
          ...newRows[rowIndex],
          medicine_id: product.medicine_id,
          name: product.name,
          mfac: product.manufacturer || product.mfac,
          hsn: product.hsnCode || product.hsn,
          rack: product.rackNo || product.rack,
          cgstPercent: product.cgstPercent || (product.gst ? (parseFloat(product.gst) / 2).toString() : "6"),
          sgstPercent: product.sgstPercent || (product.gst ? (parseFloat(product.gst) / 2).toString() : "6"),
          pack: product.packSize || product.pack,
        };

        // Auto-fill from most recent batch if exists
        if (existingBatches.length > 0) {
          const recentBatch = existingBatches[0];
          
          // Only auto-fill if fields are empty
          if (!newRows[rowIndex].batch) newRows[rowIndex].batch = recentBatch.batch_number;
          if (!newRows[rowIndex].mrp) newRows[rowIndex].mrp = recentBatch.mrp?.toString() || "";
          if (!newRows[rowIndex].rack) newRows[rowIndex].rack = recentBatch.rack_no || "";
          
          // Format expiry date
          if (!newRows[rowIndex].exp && recentBatch.expiry_date) {
            const expDate = new Date(recentBatch.expiry_date);
            const month = String(expDate.getMonth() + 1).padStart(2, "0");
            const year = String(expDate.getFullYear()).slice(-2);
            newRows[rowIndex].exp = `${month}/${year}`;
          }
        }

        newRows[rowIndex] = calculateRow(newRows[rowIndex]);
        return newRows;
      });
    },
    [getExistingBatches, setRows]
  );

  // Supplier data for modal
  const newSupplierData = {
    supplierId: "NEW",
    name: newSupplierName,
    contact: "",
    email: "",
    gst: "",
    address: "",
    officePhone: "",
    personalPhone: "",
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1.5 gap-1.5 font-sans">
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay message="Processing..." />}

      {/* Header */}
      <div className="shrink-0">
        <PurchaseHeader
          onSave={handleSave}
          onSavePrint={handleSavePrint}
          onImportFile={handleImportFile}
          onExportExcel={onExportExcel}
          invoiceNumber={currentInvoice?.invoice_number}
          invoiceStatus={currentInvoice?.status}
        />
      </div>

      {/* Table with Fixed Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
        <PurchaseTable
          rows={rows}
          setRows={setRows}
          productMaster={medicines}
          calculateRow={calculateRow}
          importVersion={importVersion}
          visibleRows={visibleRows}
          rowHeight={rowHeight}
          onAddNewProduct={handleAddNewProduct}
          onProductSelect={handleProductSelect}
        />
      </div>

      {/* Footer: Supplier Details + Summary */}
      <div className="shrink-0 flex gap-2 h-[200px] 2xl:h-[220px]">
        <div className="flex-1">
          <SupplierDetailsCard
            supplier={supplier}
            setSupplier={setSupplier}
            suppliersList={suppliersList}
            onSupplierSelect={selectSupplier}
            onAddNewSupplier={handleAddNewSupplier}
          />
        </div>
        <div className="w-80 2xl:w-72">
          <PurchaseSummaryCard summary={summary} />
        </div>
      </div>

      {/* Print Component (Hidden) */}
      <div className="hidden">
        <div ref={printRef}>
          <PurchaseInvoicePrint
            rows={rows}
            supplier={supplier}
            summary={summary}
            companyDetails={COMPANY_DETAILS}
            invoiceNumber={currentInvoice?.invoice_number}
            invoiceDate={currentInvoice?.invoice_date}
          />
        </div>
      </div>

      {/* Modals */}
      <SupplierModal
        open={supplierModalOpen}
        mode="edit"
        supplier={newSupplierData}
        onClose={() => {
          setSupplierModalOpen(false);
          setNewSupplierName("");
        }}
        onSave={handleSupplierSave}
      />

      <ProductMasterModal
        open={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setPendingProductData(null);
        }}
        onSave={handleProductSave}
        initialData={
          pendingProductData
            ? {
                name: pendingProductData.productName,
                manufacturer: pendingProductData.manufacturer || "",
                hsnCode: pendingProductData.hsn || "",
              }
            : {}
        }
        mode="create"
      />

      <BatchProductModal
        open={batchProductModalOpen}
        onClose={() => setBatchProductModalOpen(false)}
        newProducts={newProductsFromImport}
        onSaveAll={handleBatchProductSave}
        onSkipAll={handleBatchProductSkip}
      />
    </div>
  );
};

export default PurchasePage;