// src/pages/purchase/billing/PurchasePage.jsx
import { useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";

// Components
import PurchaseHeader from "./components/PurchaseHeader";
import PurchaseTable from "./components/PurchaseTable";
import SupplierDetailsCard from "./components/SupplierDetailsCard";
import PurchaseSummaryCard from "./components/PurchaseSummaryCard";
import PurchaseInvoicePrint from "./components/PurchaseInvoicePrint";
import LoadingOverlay from "../../../components/common/LoadingOverlay";

// Hooks
import { usePurchaseCalculation, calculateRow } from "../../../hooks/purchase/usePurchaseCalculation";
import { useResponsiveRowCount } from "../../../hooks/purchase/useResponsiveRowCount";
import { usePurchaseRows } from "../../../hooks/purchase/usePurchaseRows";
import { usePurchaseImportExport } from "../../../hooks/purchase/usePurchaseImportExport";
import { usePurchaseSupplier } from "../../../hooks/purchase/usePurchaseSupplier";
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
  const printRef = useRef(null);

  // ✅ Get responsive config (visibleRows, rowHeight)
  const { visibleRows, rowHeight, viewportHeight, breakpointName } = useResponsiveRowCount();
  
  // Custom Hooks
  const { rows, setRows, importRows, getFilledRows, importVersion } = usePurchaseRows(visibleRows);
  const { summary } = usePurchaseCalculation(rows);
  const { supplier, setSupplier, suppliersList, selectSupplier, validateSupplier } = usePurchaseSupplier(summary.total);
  const { isLoading, handleImportFile, handleExportExcel } = usePurchaseImportExport(importRows, supplier, toast);

  // Print Handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Purchase_Invoice_${supplier.invoiceNo || supplier.purchaseId}`,
    onAfterPrint: () => toast.success("Print Complete", "Invoice printed successfully."),
    onPrintError: () => toast.error("Print Failed", "Failed to print invoice."),
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  // Save Handler
  const handleSave = useCallback(() => {
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
    
    toast.success("Purchase Saved", "Purchase saved successfully.");
    return true;
  }, [getFilledRows, validateSupplier, toast]);

  // Save & Print Handler
  const handleSavePrint = useCallback(() => {
    const dataRows = getFilledRows();
    if (dataRows.length === 0) {
      toast.warning("Please add at least one item to print");
      return;
    }
    const saved = handleSave();
    if (saved) setTimeout(handlePrint, 100);
  }, [getFilledRows, handleSave, handlePrint, toast]);

  // Export Handler
  const onExportExcel = useCallback(() => {
    handleExportExcel(rows);
  }, [handleExportExcel, rows]);

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
        />
      </div>

      {/* ✅ Table with Fixed Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
        <PurchaseTable
          rows={rows}
          setRows={setRows}
          productMaster={[]}
          calculateRow={calculateRow}
          importVersion={importVersion}
          visibleRows={visibleRows}
          rowHeight={rowHeight}
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
          />
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;