// src/pages/PurchasePage.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
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
  
  // Print ref
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
     PRINT HANDLER
  -------------------------------- */
  const handlePrint = useReactToPrint({
    contentRef: printRef,
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
      const width = window.innerWidth;
      let count = 6; // Default / Mobile

      if (width >= 2560) count = 17;       // 4k / 27 inch
      else if (width >= 1920) count = 16;  // 1080p Full HD
      else if (width >= 1440) count = 10;  // 19 inch / high res laptop
      else if (width >= 1366) count = 6;   // 14 inch laptop
      else count = 6;

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
        const needed = targetRowCount - prev.length;
        return [...prev, ...Array.from({ length: needed }).map(makeEmptyPurchaseRow)];
      }
      return prev.length > 0
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
      setTimeout(() => {
        handlePrint();
      }, 100);
    }
  };

  const mapHeaderToKey = (h) => {
    if (!h) return null;
    const key = String(h).toLowerCase().trim().replace(/[^a-z0-9%/]/g, '');

    const map = {
      // Manufacturer
      mfac: "mfac",
      manufacturer: "mfac",
      mfr: "mfac",
      company: "mfac",
      
      // Rack
      rack: "rack",
      location: "rack",
      shelf: "rack",
      
      // Product Name
      description: "name",
      descriptionofgoods: "name",
      product: "name",
      productname: "name",
      name: "name",
      item: "name",
      itemname: "name",
      particulars: "name",
      goods: "name",
      medicine: "name",
      medicinename: "name",
      
      // HSN
      hsn: "hsn",
      hsnsac: "hsn",
      hsncode: "hsn",
      saccode: "hsn",
      
      // Pack
      pack: "pack",
      packing: "pack",
      packsize: "pack",
      unit: "pack",
      uom: "pack",
      
      // Batch
      batch: "batch",
      batchno: "batch",
      batchnumber: "batch",
      lotno: "batch",
      lot: "batch",
      
      // Expiry
      exp: "exp",
      expiry: "exp",
      expirydate: "exp",
      expdate: "exp",
      expirationdate: "exp",
      
      // Quantity
      qty: "qty",
      quantity: "qty",
      qnty: "qty",
      units: "qty",
      nos: "qty",
      
      // Scheme
      sch: "sch",
      scheme: "sch",
      free: "sch",
      freeqty: "sch",
      
      // MRP
      mrp: "mrp",
      maximumretailprice: "mrp",
      retailprice: "mrp",
      
      // Price
      price: "price",
      rate: "price",
      purchaseprice: "price",
      purchaserate: "price",
      unitprice: "price",
      ptr: "price",
      
      // Scheme Percent
      "sch%": "schemePercent",
      "scheme%": "schemePercent",
      schemepercent: "schemePercent",
      schemepercentage: "schemePercent",
      
      // Discount Percent
      "disc%": "discountPercent",
      "discount%": "discountPercent",
      discountpercent: "discountPercent",
      discountpercentage: "discountPercent",
      "dis%": "discountPercent",
      
      // CGST
      "cgst%": "cgstPercent",
      cgstpercent: "cgstPercent",
      cgst: "cgstPercent",
      cgstrate: "cgstPercent",
      
      // SGST
      "sgst%": "sgstPercent",
      sgstpercent: "sgstPercent",
      sgst: "sgstPercent",
      sgstrate: "sgstPercent",
      
      // Amount
      amount: "amount",
      total: "amount",
      totalamount: "amount",
      netamount: "amount",
      value: "amount",
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

  /* --------------------------------
     CSV IMPORT
  -------------------------------- */
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

        const count = parsed.filter(r => r.name).length;
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

  /* --------------------------------
     EXCEL IMPORT (XLSX & XLS)
     Using SheetJS for both formats
  -------------------------------- */
  const handleImportExcel = async (file) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Use SheetJS to read both .xlsx and .xls formats
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false,
        raw: false, // Get formatted strings
      });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        toast.error("No worksheet found");
        setIsLoading(false);
        return;
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: "",
        blankrows: false,
        raw: false, // Get formatted values
      });

      // Debug: Log the raw data
      console.log("📊 Excel Data:", data);
      console.log("📊 First row (headers):", data[0]);
      console.log("📊 Second row (first data):", data[1]);

      if (data.length < 1) {
        toast.error("Excel file is empty");
        setIsLoading(false);
        return;
      }

      // Find the header row (first non-empty row with multiple values)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        if (row && row.filter(cell => cell && String(cell).trim()).length >= 3) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = data[headerRowIndex].map(h => String(h || '').trim());
      console.log("📊 Detected headers:", headers);
      console.log("📊 Header row index:", headerRowIndex);

      // Debug: Show which headers are mapped
      const mappedHeaders = headers.map(h => ({
        original: h,
        mapped: mapHeaderToKey(h)
      }));
      console.log("📊 Header mapping:", mappedHeaders);

      const parsed = [];
      const master = [];

      // Process data rows (skip header row)
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const rowData = data[i];
        
        // Skip completely empty rows
        if (!rowData || rowData.every(cell => !cell || String(cell).trim() === '')) {
          continue;
        }
        
        // Convert each cell to string
        const values = rowData.map(cell => {
          if (cell === null || cell === undefined) return '';
          if (cell instanceof Date) {
            const month = String(cell.getMonth() + 1).padStart(2, '0');
            const year = String(cell.getFullYear()).slice(-2);
            return `${month}/${year}`;
          }
          return String(cell).trim();
        });

        const row = parseRowData(headers, values);
        
        // Debug: Log first few parsed rows
        if (i <= headerRowIndex + 3) {
          console.log(`📊 Row ${i} values:`, values);
          console.log(`📊 Row ${i} parsed:`, row);
        }

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

      const count = parsed.filter(r => r.name).length;
      console.log("📊 Items with name:", count);
      console.log("📊 Total parsed rows:", parsed.length);

      while (parsed.length < targetRowCount) parsed.push(makeEmptyPurchaseRow());
      
      setRows(parsed);
      setProductMaster((p) => [...p, ...master]);
      
      const extension = file.name.split('.').pop().toUpperCase();
      
      if (count === 0) {
        toast.warning(
          "No Items Found", 
          "Check console for header mapping. Your column names may not match."
        );
      } else {
        toast.success(`${extension} Imported`, `${count} items imported successfully.`);
      }
      
    } catch (error) {
      console.error("Excel import error:", error);
      toast.error("Failed to import Excel file", error.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  /* --------------------------------
     EXCEL EXPORT (XLSX only)
     Using ExcelJS for better formatting
  -------------------------------- */
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

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
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

  /* --------------------------------
     FILE IMPORT HANDLER
  -------------------------------- */
  const handleImportFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension === 'csv') {
      handleImportCSV(file);
    } else if (['xlsx', 'xls'].includes(extension)) {
      handleImportExcel(file);
    } else {
      toast.error('Unsupported Format', 'Please use CSV, XLS, or XLSX files.');
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1 gap-1 font-sans">
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

      {/* HEADER */}
      <div className="shrink-0">
        <PurchaseHeader
          onSave={handleSave}
          onSavePrint={handleSavePrint}
          onImportFile={handleImportFile}
          onExportExcel={handleExportExcel}
        />
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm min-h-0 relative">
        <div className="flex-1 overflow-y-auto">
          <PurchaseTable
            rows={rows}
            setRows={setRows}
            productMaster={productMaster}
            calculateRow={calculateRow}
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="shrink-0 flex gap-2 h-[170px] 2xl:h-[200px]">
        <SupplierDetailsCard supplier={supplier} setSupplier={setSupplier} />
        <PurchaseSummaryCard summary={summary} />
      </div>

      {/* Print Component */}
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