// src/pages/PurchasePage.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import ExcelJS from "exceljs";
import { useReactToPrint } from "react-to-print";
import PurchaseHeader from "./components/PurchaseHeader";
import PurchaseTable from "./components/PurchaseTable";
import SupplierDetailsCard from "./components/SupplierDetailsCard";
import PurchaseSummaryCard from "./components/PurchaseSummaryCard";
import PurchaseInvoicePrint from "./components/PurchaseInvoicePrint";
import { useToast } from "../../../components/common/Toast";

// Import print styles

import "../../../styles/print.css";

/* --------------------------------
   ROW CALCULATION (INVOICE LOGIC)
-------------------------------- */
const calculateRow = (row) => {
  const qty = Number(row.qty) || 0;
  const price = Number(row.price) || 0;

  const gross = qty * price;

  const schPct = Number(row.schemePercent) || 0;
  const schemeAmount = +(gross * schPct / 100).toFixed(2);
  const afterScheme = gross - schemeAmount;

  const discPct = Number(row.discountPercent) || 0;
  const discountAmount = +(afterScheme * discPct / 100).toFixed(2);

  const taxableValue = +(afterScheme - discountAmount).toFixed(2);

  const cgstPct = Number(row.cgstPercent) || 0;
  const sgstPct = Number(row.sgstPercent) || 0;

  const cgstAmount = +(taxableValue * cgstPct / 100).toFixed(2);
  const sgstAmount = +(taxableValue * sgstPct / 100).toFixed(2);

  const amount = +(taxableValue + cgstAmount + sgstAmount).toFixed(2);

  return {
    ...row,
    schemeAmount,
    discountAmount,
    taxableValue,
    cgstAmount,
    sgstAmount,
    amount,
  };
};

/* --------------------------------
   EMPTY ROW MODEL
-------------------------------- */
const makeEmptyPurchaseRow = () => ({
  mfac: "",
  rack: "",
  name: "",
  hsn: "",
  pack: "",
  batch: "",
  exp: "",
  qty: "",
  sch: "",
  mrp: "",
  price: "",
  schemePercent: "",
  schemeAmount: "",
  discountPercent: "",
  discountAmount: "",
  taxableValue: "",
  cgstPercent: "",
  cgstAmount: "",
  sgstPercent: "",
  sgstAmount: "",
  amount: "",
});

const PurchasePage = () => {
  const toast = useToast();
  const [targetRowCount, setTargetRowCount] = useState(8);
  const [rows, setRows] = useState([]);
  const [productMaster, setProductMaster] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Print ref - this is the key change
  const printRef = useRef(null);

  const [supplier, setSupplier] = useState({
    purchaseId: "PUR-" + Date.now().toString().slice(-6),
    invoiceNo: "",
    supplierGST: "",
    receivedOn: new Date().toISOString().split('T')[0],
    address: "",
    amountPaid: "",
    balance: "",
  });

  // Company details
  const companyDetails = {
    name: "PHARMA DISTRIBUTORS PVT. LTD.",
    address: "45, Industrial Area, Phase-II, New Delhi - 110020",
    phone: "+91 11-4567 8900",
    email: "accounts@pharmadist.com",
    gstin: "07AABCP1234M1Z5",
    drugLicense: "DL-DEL-20B-123456",
  };

  /* --------------------------------
     PRINT HANDLER - NEW API (v3.x)
  -------------------------------- */
  const handlePrint = useReactToPrint({
    contentRef: printRef, // Use contentRef instead of content
    documentTitle: `Purchase_Invoice_${supplier.invoiceNo || supplier.purchaseId}`,
    onBeforePrint: () => {
      console.log("Preparing to print...");
      return Promise.resolve();
    },
    onAfterPrint: () => {
      toast.success("Print Complete", "Invoice printed successfully.");
    },
    onPrintError: (errorLocation, error) => {
      console.error("Print error:", errorLocation, error);
      toast.error("Print Failed", "Failed to print invoice.");
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  /* --------------------------------
     RESPONSIVE ROW COUNT
  -------------------------------- */
  useEffect(() => {
    const updateLayout = () => {
      const w = window.innerWidth;
      let count = 6;
      if (w >= 2560) count = 18;
      else if (w >= 1920) count = 16;
      else if (w >= 1440) count = 10;
      setTargetRowCount(count);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  /* --------------------------------
     ENSURE ROW COUNT
  -------------------------------- */
  useEffect(() => {
    setRows((prev) => {
      if (prev.length < targetRowCount) {
        return [
          ...prev,
          ...Array.from({ length: targetRowCount - prev.length }).map(
            makeEmptyPurchaseRow
          ),
        ];
      }
      return prev.length
        ? prev
        : Array.from({ length: targetRowCount }).map(makeEmptyPurchaseRow);
    });
  }, [targetRowCount]);

  /* --------------------------------
     SUMMARY
  -------------------------------- */
  const summary = useMemo(() => {
    const taxable = rows.reduce(
      (s, r) => s + (Number(r.taxableValue) || 0),
      0
    );
    const cgst = rows.reduce(
      (s, r) => s + (Number(r.cgstAmount) || 0),
      0
    );
    const sgst = rows.reduce(
      (s, r) => s + (Number(r.sgstAmount) || 0),
      0
    );

    return {
      subTotal: +taxable.toFixed(2),
      cgst: +cgst.toFixed(2),
      sgst: +sgst.toFixed(2),
      total: +(taxable + cgst + sgst).toFixed(2),
    };
  }, [rows]);

  // Update balance when summary changes
  useEffect(() => {
    setSupplier(prev => ({
      ...prev,
      balance: (summary.total - Number(prev.amountPaid || 0)).toFixed(2)
    }));
  }, [summary.total, supplier.amountPaid]);

  const handleSave = () => {
    const dataRows = rows.filter(r => r.name);
    if (dataRows.length === 0) {
      toast.warning("Missing Items", "Please add at least one item.");
      return false;
    }
    toast.success("Purchase Saved", "Purchase saved successfully.");
    return true;
  };

  const handleSavePrint = () => {
    const dataRows = rows.filter(r => r.name);
    if (dataRows.length === 0) {
      toast.warning("Please add at least one item to print");
      return;
    }
    
    const saved = handleSave();
    if (saved) {
      // Small delay to ensure state updates are reflected
      setTimeout(() => {
        handlePrint();
      }, 100);
    }
  };

  /* --------------------------------
     HEADER MAPPING & IMPORT LOGIC
  -------------------------------- */
  const mapHeaderToKey = (h) => {
    if (!h) return null;
    const key = String(h).toLowerCase().trim();

    const map = {
      mfac: "mfac",
      rack: "rack",
      description: "name",
      "description of goods": "name",
      product: "name",
      name: "name",
      hsn: "hsn",
      "hsn/sac": "hsn",
      pack: "pack",
      batch: "batch",
      "batch no": "batch",
      "batch no.": "batch",
      exp: "exp",
      expiry: "exp",
      qty: "qty",
      quantity: "qty",
      sch: "sch",
      mrp: "mrp",
      price: "price",
      "sch %": "schemePercent",
      "scheme %": "schemePercent",
      "scheme%": "schemePercent",
      schemepercent: "schemePercent",
      "disc %": "discountPercent",
      "discount %": "discountPercent",
      "discount%": "discountPercent",
      discountpercent: "discountPercent",
      "cgst %": "cgstPercent",
      "cgst%": "cgstPercent",
      cgstpercent: "cgstPercent",
      "sgst %": "sgstPercent",
      "sgst%": "sgstPercent",
      sgstpercent: "sgstPercent",
    };

    return map[key] || null;
  };

  const parseRowData = (headers, values) => {
    const row = makeEmptyPurchaseRow();

    headers.forEach((h, i) => {
      const key = mapHeaderToKey(h);
      if (key && values[i] !== undefined && values[i] !== null) {
        row[key] = String(values[i]).trim();
      }
    });

    if (!row.sch) row.sch = "0";
    return calculateRow(row);
  };

  const getCellValue = (cell) => {
    if (cell === null || cell === undefined) return "";
    if (typeof cell === 'object') {
      if (cell.richText) return cell.richText.map(rt => rt.text).join('');
      if (cell.result !== undefined) return cell.result;
      if (cell.text) return cell.text;
      if (cell instanceof Date) return cell.toLocaleDateString();
      return cell.toString();
    }
    return String(cell);
  };

  const handleImportCSV = (file) => {
    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const lines = e.target.result.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          toast.error("CSV file is empty");
          setIsLoading(false);
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim());
        const parsed = [];
        const master = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ''));
          const row = parseRowData(headers, values);
          parsed.push(row);

          if (row.name) {
            master.push({
              id: `csv-${i}`,
              name: row.name,
              hsn: row.hsn,
              pack: row.pack,
              rack: row.rack,
              cgstPercent: row.cgstPercent,
              sgstPercent: row.sgstPercent,
            });
          }
        }

        while (parsed.length < targetRowCount) parsed.push(makeEmptyPurchaseRow());
        setRows(parsed);
        setProductMaster((p) => [...p, ...master]);
        toast.success("CSV Imported", `${count} items imported successfully.`);
      } catch (error) {
        console.error("CSV import error:", error);
        toast.error("Failed to import CSV");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read CSV");
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleImportExcel = async (file) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
      
      if (!worksheet) {
        toast.error("No worksheet found");
        setIsLoading(false);
        return;
      }

      const data = [];
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        const rowValues = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          while (rowValues.length < colNumber - 1) rowValues.push("");
          rowValues.push(getCellValue(cell.value));
        });
        data.push(rowValues);
      });

      if (data.length < 2) {
        toast.error("Excel file is empty");
        setIsLoading(false);
        return;
      }

      const headers = data[0];
      const parsed = [];
      const master = [];

      for (let i = 1; i < data.length; i++) {
        const row = parseRowData(headers, data[i]);
        parsed.push(row);
        if (row.name) {
          master.push({
            id: `excel-${i}`,
            name: row.name,
            hsn: row.hsn,
            pack: row.pack,
            rack: row.rack,
            cgstPercent: row.cgstPercent,
            sgstPercent: row.sgstPercent,
          });
        }
      }

      while (parsed.length < targetRowCount) parsed.push(makeEmptyPurchaseRow());
      setRows(parsed);
      setProductMaster((p) => [...p, ...master]);
      toast.success(`Excel imported: ${parsed.filter(r => r.name).length} items`);
    } catch (error) {
      console.error("Excel import error:", error);
      toast.error("Failed to import Excel");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setIsLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ERP System';
      workbook.created = new Date();
      
      const worksheet = workbook.addWorksheet('Purchase Items', {
        properties: { tabColor: { argb: '05015A' } }
      });

      worksheet.columns = [
        { header: '#', key: 'serial', width: 5 },
        { header: 'Mfac', key: 'mfac', width: 10 },
        { header: 'Rack', key: 'rack', width: 8 },
        { header: 'Description', key: 'name', width: 30 },
        { header: 'HSN', key: 'hsn', width: 12 },
        { header: 'Pack', key: 'pack', width: 8 },
        { header: 'Batch', key: 'batch', width: 12 },
        { header: 'Exp', key: 'exp', width: 10 },
        { header: 'Qty', key: 'qty', width: 8 },
        { header: 'MRP', key: 'mrp', width: 10 },
        { header: 'Price', key: 'price', width: 10 },
        { header: 'Discount %', key: 'discountPercent', width: 10 },
        { header: 'Taxable', key: 'taxableValue', width: 14 },
        { header: 'CGST %', key: 'cgstPercent', width: 8 },
        { header: 'CGST Amt', key: 'cgstAmount', width: 10 },
        { header: 'SGST %', key: 'sgstPercent', width: 8 },
        { header: 'SGST Amt', key: 'sgstAmount', width: 10 },
        { header: 'Amount', key: 'amount', width: 12 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '05015A' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      const dataRows = rows.filter(row => row.name);
      dataRows.forEach((row, index) => {
        worksheet.addRow({
          serial: index + 1,
          mfac: row.mfac || '',
          rack: row.rack || '',
          name: row.name || '',
          hsn: row.hsn || '',
          pack: row.pack || '',
          batch: row.batch || '',
          exp: row.exp || '',
          qty: Number(row.qty) || 0,
          mrp: Number(row.mrp) || 0,
          price: Number(row.price) || 0,
          discountPercent: Number(row.discountPercent) || 0,
          taxableValue: Number(row.taxableValue) || 0,
          cgstPercent: Number(row.cgstPercent) || 0,
          cgstAmount: Number(row.cgstAmount) || 0,
          sgstPercent: Number(row.sgstPercent) || 0,
          sgstAmount: Number(row.sgstAmount) || 0,
          amount: Number(row.amount) || 0,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Purchase_${supplier.invoiceNo || supplier.purchaseId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Excel exported successfully');
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'csv') handleImportCSV(file);
    else if (['xlsx', 'xls'].includes(extension)) handleImportExcel(file);
    else toast.error('Unsupported format. Use CSV or Excel.');
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1 gap-1">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-slate-700 font-medium">Processing...</span>
          </div>
        </div>
      )}

      <PurchaseHeader
        onSave={handleSave}
        onSavePrint={handleSavePrint}
        onImportFile={handleImportFile}
        onExportExcel={handleExportExcel}
      />

      <div className="flex-1 overflow-hidden bg-white rounded-lg shadow-sm">
        <PurchaseTable
          rows={rows}
          setRows={setRows}
          productMaster={productMaster}
          calculateRow={calculateRow}
        />
      </div>

      <div className="shrink-0 flex gap-2 h-[170px] 2xl:h-[200px]">
        <SupplierDetailsCard supplier={supplier} setSupplier={setSupplier} />
        <PurchaseSummaryCard summary={summary} />
      </div>

      {/* Print Component - Must be visible in DOM but can be positioned off-screen */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={printRef}>
          <PurchaseInvoicePrint
            rows={rows}
            supplier={supplier}
            summary={summary}
            companyDetails={companyDetails}
          />
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;