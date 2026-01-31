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

const PurchasePage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const printRef = useRef(null);

  // Get branch context
  const branchContext = useAuthStore(selectBranchContext);

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
  // INDIVIDUAL LOADING STATES
  // ============================================
  const [loadingStates, setLoadingStates] = useState({
    header: true,
    table: true,
    supplier: true,
    summary: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with branch context
  const [invoiceData, setInvoiceData] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    branch_id: branchContext.branch_id || null,
    due_date: null,
    received_date: null,
    transport_charges: null,
    other_charges: null,
    remarks: null,
  });

  // Get responsive config
  const { visibleRows, rowHeight } = useResponsiveRowCount();

  // Custom Hooks - ✅ UPDATED: Now with persistence
  const { 
    rows, 
    setRows, 
    importRows, 
    getFilledRows, 
    importVersion, 
    clearAllRows,
    hasUnsavedData,
    isInitialized: rowsInitialized,
  } = usePurchaseRows(visibleRows);
  
  const { summary } = usePurchaseCalculation(rows);
  
  const {
    supplier,
    setSupplier,
    suppliersList,
    setSuppliersList,
    selectSupplier,
    validateSupplier,
    resetSupplier,
    clearStoredData: clearSupplierStorage,
    isInitialized: supplierInitialized,
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

  // Update branch_id when context changes
  useEffect(() => {
    if (branchContext.branch_id) {
      setInvoiceData(prev => ({
        ...prev,
        branch_id: branchContext.branch_id
      }));
    }
  }, [branchContext.branch_id]);

  // ============================================
  // LOAD INITIAL DATA - PROGRESSIVE LOADING
  // ============================================
  useEffect(() => {
    const initData = async () => {
      setLoadingStates({
        header: true,
        table: true,
        supplier: true,
        summary: true,
      });

      try {
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, header: false }));
        }, 200);

        await loadMedicines();
        setLoadingStates(prev => ({ ...prev, table: false, summary: false }));

        await loadSuppliers();
        setLoadingStates(prev => ({ ...prev, supplier: false }));

        if (invoiceId) {
          setLoadingStates(prev => ({ ...prev, table: true, supplier: true, summary: true }));
          const invoice = await loadInvoiceForEdit(invoiceId);
          populateInvoiceData(invoice);
          setLoadingStates(prev => ({ ...prev, table: false, supplier: false, summary: false }));
        }

      } catch (error) {
        console.error("Init error:", error);
        setLoadingStates({
          header: false,
          table: false,
          supplier: false,
          summary: false,
        });
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
      invoiceDate: invoice.invoice_date,
      receivedOn: invoice.received_date,
      creditDays: invoice.credit_days || "",
    });

    setInvoiceData({
      invoice_date: invoice.invoice_date,
      branch_id: invoice.branch_id,
      due_date: invoice.due_date,
      received_date: invoice.received_date,
      transport_charges: invoice.transport_charges,
      other_charges: invoice.other_charges,
      remarks: invoice.remarks,
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
        netRate: item.taxable_amount && item.quantity 
          ? (parseFloat(item.taxable_amount) / parseFloat(item.quantity)).toFixed(2) 
          : "",
        amount: item.line_total?.toString() || "",
      };
    });

    setRows(populatedRows);
  }, [setSupplier, setRows]);

  // ============================================
  // HANDLE SUPPLIER FIELD CHANGES
  // ============================================
  const handleSupplierFieldChange = useCallback((field, value) => {
    setSupplier(prev => ({ ...prev, [field]: value }));
    
    if (field === 'invoiceDate') {
      setInvoiceData(prev => ({ ...prev, invoice_date: value }));
    }
    if (field === 'receivedOn') {
      setInvoiceData(prev => ({ ...prev, received_date: value }));
    }
    if (field === 'creditDays' && value) {
      const invoiceDate = new Date(invoiceData.invoice_date || new Date());
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + parseInt(value));
      setInvoiceData(prev => ({ ...prev, due_date: dueDate.toISOString().split('T')[0] }));
    }
  }, [setSupplier, invoiceData.invoice_date]);

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
  // ✅ NEW: CLEAR TABLE HANDLER
  // ============================================
  const handleClearTable = useCallback(() => {
    clearAllRows();
    toast.info("Table Cleared", "All items have been removed.");
  }, [clearAllRows, toast]);

  // ============================================
  // ✅ NEW: NEW INVOICE HANDLER
  // ============================================
  const handleNewInvoice = useCallback(() => {
    // Clear all data
    clearAllRows();
    resetSupplier();
    clearSupplierStorage();
    resetInvoice();
    
    // Reset invoice data
    setInvoiceData({
      invoice_date: new Date().toISOString().split('T')[0],
      branch_id: branchContext.branch_id || null,
      due_date: null,
      received_date: null,
      transport_charges: null,
      other_charges: null,
      remarks: null,
    });
    
    // Navigate to clean URL if we were editing
    if (invoiceId) {
      navigate('/purchase/billing');
    }
    
    toast.success("New Invoice", "Ready to create a new purchase invoice.");
  }, [clearAllRows, resetSupplier, clearSupplierStorage, resetInvoice, branchContext.branch_id, invoiceId, navigate, toast]);

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

    if (!invoiceData.branch_id) {
      toast.warning("Branch Required", "Please select a branch to create purchase invoice");
      return false;
    }

    setIsSaving(true);
    try {
      const savedInvoice = await savePurchaseInvoice(invoiceData, dataRows, supplier);
      if (savedInvoice) {
        setSupplier(prev => ({
          ...prev,
          purchaseId: savedInvoice.invoice_number,
        }));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsSaving(false);
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

    if (!invoiceData.branch_id) {
      toast.warning("Branch Required", "Please select a branch to create purchase invoice");
      return;
    }

    setIsSaving(true);
    try {
      let invoiceToConfirm = currentInvoice;
      
      if (!currentInvoice) {
        const savedInvoice = await savePurchaseInvoice(invoiceData, dataRows, supplier);
        if (!savedInvoice) return;
        invoiceToConfirm = savedInvoice;
      }

      const confirmedInvoice = await confirmPurchaseInvoice(invoiceToConfirm.invoice_id);
      
      if (confirmedInvoice) {
        setSupplier(prev => ({
          ...prev,
          purchaseId: confirmedInvoice.invoice_number,
        }));

        setTimeout(() => {
          handlePrint();
        }, 100);
      }
    } catch (error) {
      console.error("Save & Print error:", error);
    } finally {
      setIsSaving(false);
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
  // PRODUCT MODAL HANDLERS - ✅ FIXED HSN FLOW
  // ============================================
  const handleAddNewProduct = useCallback((productData) => {
  console.log('📝 handleAddNewProduct called:', productData);
  setPendingProductData(productData);
  setProductModalOpen(true);
}, []);

const handleProductSave = useCallback(
  async (newProductData) => {
    try {
      console.log('📤 handleProductSave - Input data:', newProductData);
      
      // ✅ FIXED: Pass ALL fields to createMedicine
      const createdMedicine = await createMedicine({
        name: newProductData.name,
        manufacturer: newProductData.manufacturer,
        genericName: newProductData.genericName,      // ✅ Already present
        category: newProductData.category,            // ✅ Already present
        subCategory: newProductData.subCategory,      // ✅ ADD THIS
        schedule: newProductData.schedule,            // ✅ ADD THIS
        hsnCode: newProductData.hsnCode,
        packSize: newProductData.packSize,
        rackNo: newProductData.rackNo,
        gst: newProductData.gst,
        cgstPercent: newProductData.cgstPercent,
        sgstPercent: newProductData.sgstPercent,
      });

      console.log('✅ handleProductSave - Created medicine:', createdMedicine);

      if (createdMedicine && pendingProductData) {
        const { rowIndex } = pendingProductData;
        
        setRows((prev) => {
          const newRows = [...prev];
          
          // ✅ FIXED: Map all fields properly with multiple fallbacks
          const updatedRow = {
            ...newRows[rowIndex],
            medicine_id: createdMedicine.medicine_id || createdMedicine.id,
            name: createdMedicine.name,
            mfac: createdMedicine.manufacturer || createdMedicine.mfac,
            hsn: createdMedicine.hsn || 
                 createdMedicine.hsnCode || 
                 createdMedicine.hsn_code || 
                 newProductData.hsnCode || 
                 '',
            rack: createdMedicine.rack || 
                  createdMedicine.rackNo || 
                  createdMedicine.rack_no || 
                  newProductData.rackNo || 
                  '',
            // ✅ FIXED: Pack - ensure we check response AND fallback to input
            pack: createdMedicine.pack || 
                  createdMedicine.packSize || 
                  createdMedicine.pack_size || 
                  newProductData.packSize || 
                  '',
            cgstPercent: createdMedicine.cgstPercent?.toString() || 
                         createdMedicine.cgst_percentage?.toString() || 
                         newProductData.cgstPercent?.toString() || 
                         "6",
            sgstPercent: createdMedicine.sgstPercent?.toString() || 
                         createdMedicine.sgst_percentage?.toString() || 
                         newProductData.sgstPercent?.toString() || 
                         "6",
          };
          
          console.log('📝 Updated row with pack:', {
            medicine_id: updatedRow.medicine_id,
            name: updatedRow.name,
            hsn: updatedRow.hsn,
            pack: updatedRow.pack,
            rack: updatedRow.rack,
          });
          
          newRows[rowIndex] = calculateRow(updatedRow);
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

  //   async (newProductData) => {
  //     try {
  //       console.log('📤 handleProductSave called with:', newProductData);
        
  //       const createdMedicine = await createMedicine({
  //         name: newProductData.name,
  //         manufacturer: newProductData.manufacturer,
  //         genericName: newProductData.genericName,
  //         category: newProductData.category,
  //         hsnCode: newProductData.hsnCode,  // ✅ FIXED: Pass hsnCode
  //         packSize: newProductData.packSize,
  //         rackNo: newProductData.rackNo,
  //         gst: newProductData.gst,
  //         cgstPercent: newProductData.cgstPercent,
  //         sgstPercent: newProductData.sgstPercent,
  //       });

  //       console.log('✅ Medicine created:', createdMedicine);

  //       if (createdMedicine && pendingProductData) {
  //         const { rowIndex } = pendingProductData;
          
  //         setRows((prev) => {
  //           const newRows = [...prev];
  //           newRows[rowIndex] = {
  //             ...newRows[rowIndex],
  //             medicine_id: createdMedicine.medicine_id,
  //             name: createdMedicine.name,
  //             mfac: createdMedicine.manufacturer || createdMedicine.mfac,
  //             // ✅ FIXED: Map HSN code properly from response
  //             hsn: createdMedicine.hsn_code || createdMedicine.hsnCode || createdMedicine.hsn || newProductData.hsnCode,
  //             rack: createdMedicine.rack_no || createdMedicine.rackNo || createdMedicine.rack,
  //             pack: createdMedicine.pack_size || createdMedicine.packSize || createdMedicine.pack,
  //             // ✅ FIXED: Map tax percentages properly
  //             cgstPercent: createdMedicine.cgst_percentage?.toString() || 
  //                          createdMedicine.cgstPercent?.toString() || 
  //                          newProductData.cgstPercent?.toString() || "6",
  //             sgstPercent: createdMedicine.sgst_percentage?.toString() || 
  //                          createdMedicine.sgstPercent?.toString() || 
  //                          newProductData.sgstPercent?.toString() || "6",
  //           };
            
  //           console.log('📝 Updated row:', newRows[rowIndex]);
  //           newRows[rowIndex] = calculateRow(newRows[rowIndex]);
  //           return newRows;
  //         });
  //       }

  //       setProductModalOpen(false);
  //       setPendingProductData(null);
  //     } catch (error) {
  //       console.error("Product save error:", error);
  //     }
  //   },
  //   [pendingProductData, setRows, createMedicine]
  // );

  // ============================================
  // BATCH PRODUCT IMPORT HANDLERS
  // ============================================
  const handleBatchProductSave = useCallback(
    async (productsToSave) => {
      try {
        if (productsToSave.length > 0) {
          const result = await bulkCreateMedicines(productsToSave);
          
          // ✅ ENHANCED: Update rows with newly created medicine IDs
          if (result?.created?.length > 0) {
            setRows(prev => {
              const newRows = [...prev];
              
              result.created.forEach(createdMed => {
                // Find rows that match this product name but don't have medicine_id
                const matchingRowIndex = newRows.findIndex(row => 
                  row.name && 
                  !row.medicine_id && 
                  row.name.toLowerCase() === createdMed.name.toLowerCase()
                );
                
                if (matchingRowIndex !== -1) {
                  newRows[matchingRowIndex] = {
                    ...newRows[matchingRowIndex],
                    medicine_id: createdMed.medicine_id,
                    // ✅ FIXED: Update all fields from created medicine
                    hsn: createdMed.hsn_code || newRows[matchingRowIndex].hsn,
                    rack: createdMed.rack_no || newRows[matchingRowIndex].rack,
                    pack: createdMed.pack_size || newRows[matchingRowIndex].pack,
                    cgstPercent: createdMed.cgst_percentage?.toString() || newRows[matchingRowIndex].cgstPercent,
                    sgstPercent: createdMed.sgst_percentage?.toString() || newRows[matchingRowIndex].sgstPercent,
                  };
                  newRows[matchingRowIndex] = calculateRow(newRows[matchingRowIndex]);
                }
              });
              
              return newRows;
            });
          }
        }
        setBatchProductModalOpen(false);
        setNewProductsFromImport([]);
      } catch (error) {
        console.error("Batch product save error:", error);
      }
    },
    [bulkCreateMedicines, setRows]
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
      const existingBatches = await getExistingBatches(product.medicine_id);

      setRows((prev) => {
        const newRows = [...prev];
        newRows[rowIndex] = {
          ...newRows[rowIndex],
          medicine_id: product.medicine_id,
          name: product.name,
          mfac: product.manufacturer || product.mfac,
          // ✅ FIXED: Map HSN properly
          hsn: product.hsn_code || product.hsnCode || product.hsn,
          rack: product.rack_no || product.rackNo || product.rack,
          // ✅ FIXED: Map tax percentages properly
          cgstPercent: product.cgst_percentage?.toString() || 
                       product.cgstPercent || 
                       (product.gst_percentage ? (parseFloat(product.gst_percentage) / 2).toString() : "6"),
          sgstPercent: product.sgst_percentage?.toString() || 
                       product.sgstPercent || 
                       (product.gst_percentage ? (parseFloat(product.gst_percentage) / 2).toString() : "6"),
          pack: product.pack_size || product.packSize || product.pack,
        };

        if (existingBatches.length > 0) {
          const recentBatch = existingBatches[0];
          
          if (!newRows[rowIndex].batch) newRows[rowIndex].batch = recentBatch.batch_number;
          if (!newRows[rowIndex].mrp) newRows[rowIndex].mrp = recentBatch.mrp?.toString() || "";
          if (!newRows[rowIndex].rack) newRows[rowIndex].rack = recentBatch.rack_no || "";
          
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

  // Check if we have any unsaved data
  const hasData = hasUnsavedData();

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1.5 gap-1.5 font-sans">
      
      {/* Header - Loads first */}
      <div className={`
        shrink-0 transition-all duration-300 ease-out
        ${!loadingStates.header ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}>
        <PurchaseHeader
          onSave={handleSave}
          onSavePrint={handleSavePrint}
          onImportFile={handleImportFile}
          onExportExcel={onExportExcel}
          onClearTable={handleClearTable}      // ✅ NEW
          onNewInvoice={handleNewInvoice}      // ✅ NEW
          invoiceNumber={currentInvoice?.invoice_number}
          invoiceStatus={currentInvoice?.status}
          isLoading={loadingStates.header}
          isSaving={isSaving}
          hasUnsavedData={hasData}             // ✅ NEW
        />
      </div>

      {/* Table - Loads when medicines ready */}
      <div className={`
        flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm
        transition-all duration-300 ease-out delay-75
        ${!loadingStates.table ? 'opacity-100 translate-y-0' : 'opacity-100'}
      `}>
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
          isLoading={loadingStates.table}
        />
      </div>

      {/* Footer: Supplier Details + Summary */}
      <div className="shrink-0 flex gap-2 h-[200px] 2xl:h-[220px]">
        {/* Supplier Card - Loads when suppliers ready */}
        <div className={`
          flex-1 transition-all duration-300 ease-out delay-150
          ${!loadingStates.supplier ? 'opacity-100 translate-y-0' : 'opacity-100'}
        `}>
          <SupplierDetailsCard
            supplier={supplier}
            setSupplier={setSupplier}
            suppliersList={suppliersList}
            onSupplierSelect={selectSupplier}
            onAddNewSupplier={handleAddNewSupplier}
            onFieldChange={handleSupplierFieldChange}
            isLoading={loadingStates.supplier}
          />
        </div>
        
        {/* Summary Card - Loads with table */}
        <div className={`
          w-80 2xl:w-72 transition-all duration-300 ease-out delay-100
          ${!loadingStates.summary ? 'opacity-100 translate-y-0' : 'opacity-100'}
        `}>
          <PurchaseSummaryCard 
            summary={summary} 
            isLoading={loadingStates.summary}
          />
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
          name: pendingProductData.productName || pendingProductData.name || "",
          manufacturer: pendingProductData.manufacturer || pendingProductData.mfac || "",
          hsnCode: pendingProductData.hsn || pendingProductData.hsnCode || "",
          rackNo: pendingProductData.rack || pendingProductData.rackNo || "",
          packSize: pendingProductData.pack || pendingProductData.packSize || "",
          cgstPercent: pendingProductData.cgstPercent || "6",
          sgstPercent: pendingProductData.sgstPercent || "6",
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