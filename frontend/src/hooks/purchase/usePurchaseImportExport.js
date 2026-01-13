// src/hooks/usePurchaseImportExport.js
import { useState, useCallback } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { makeEmptyPurchaseRow, calculateRow } from "./usePurchaseCalculation";

const mapHeaderToKey = (h) => {
  if (!h) return null;
  const key = String(h).replace(/[\n\r\t]/g, ' ').replace(/\s+/g, '').toLowerCase().replace(/[^a-z0-9%]/g, '');
  const map = {
    // Manufacturer/Company
    mfac: "mfac", manufacturer: "mfac", mfr: "mfac", company: "mfac",
    // Rack/Location
    rack: "rack", location: "rack", shelf: "rack",
    // Product Name
    description: "name", product: "name", name: "name", item: "name", itemdescription: "name",
    // HSN
    hsn: "hsn", hsnsac: "hsn", hsncode: "hsn",
    // Pack
    pack: "pack", packing: "pack", unit: "pack",
    // Batch
    batch: "batch", batchno: "batch", lot: "batch",
    // Expiry
    exp: "exp", expiry: "exp", expirydate: "exp", expdate: "exp",
    // Quantities
    qty: "qty", quantity: "qty", units: "qty",
    pqty: "pQty", prevqty: "pQty", previousqty: "pQty", purchaseqty: "pQty",
    // Scheme/Free
    sch: "sch", scheme: "sch", free: "sch", bonus: "sch",
    // Pricing
    mrp: "mrp", 
    price: "price", rate: "price", purchaserate: "price",
    srate: "sRate", salerate: "sRate", sellingrate: "sRate",
    netrate: "netRate", net: "netRate",
    // Percentages
    "sch%": "schemePercent", schemepercent: "schemePercent",
    "disc%": "discountPercent", discountpercent: "discountPercent", "dis%": "discountPercent",
    // Tax
    "cgst%": "cgstPercent", cgstpercent: "cgstPercent", cgst: "cgstPercent",
    "sgst%": "sgstPercent", sgstpercent: "sgstPercent", sgst: "sgstPercent",
    // Amount
    amount: "amount", total: "amount",
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
  if (!row.pQty) row.pQty = "0";
  return calculateRow(row);
};

export const usePurchaseImportExport = (onImport, supplier, toast) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleImportCSV = useCallback((file) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const lines = e.target.result.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          toast.error("CSV file is empty");
          setIsLoading(false);
          return;
        }
        const headers = lines[0].split(",").map(h => h.trim());
        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/^\"|\"$/g, ''));
          parsed.push(parseRowData(headers, values));
        }
        onImport(parsed);
        toast.success("CSV Imported", `${parsed.filter(r => r.name).length} items imported.`);
      } catch (error) {
        toast.error("Failed to import CSV");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  }, [onImport, toast]);

  const handleImportExcel = useCallback(async (file) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      
      if (data.length < 1) {
        toast.error("Excel file is empty");
        setIsLoading(false);
        return;
      }

      const headers = data[0].map(h => String(h || '').trim());
      const parsed = [];
      for (let i = 1; i < data.length; i++) {
        const rowData = data[i];
        if (!rowData || rowData.every(cell => !cell || String(cell).trim() === '')) continue;
        parsed.push(parseRowData(headers, rowData.map(cell => String(cell || '').trim())));
      }

      onImport(parsed);
      toast.success("Excel Imported", `${parsed.filter(r => r.name).length} items imported.`);
    } catch (error) {
      toast.error("Failed to import Excel");
    } finally {
      setIsLoading(false);
    }
  }, [onImport, toast]);

  const handleExportExcel = useCallback(async (rows) => {
    setIsLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Purchase Items');
      
      worksheet.columns = [
        { header: '#', key: 'serial', width: 5 },
        { header: 'Description', key: 'name', width: 30 },
        { header: 'Mfac', key: 'mfac', width: 15 },
        { header: 'Batch', key: 'batch', width: 12 },
        { header: 'HSN', key: 'hsn', width: 12 },
        { header: 'Exp', key: 'exp', width: 10 },
        { header: 'Pack', key: 'pack', width: 8 },
        { header: 'P.Qty', key: 'pQty', width: 8 },
        { header: 'Qty', key: 'qty', width: 8 },
        { header: 'Rate', key: 'price', width: 10 },
        { header: 'Dis%', key: 'discountPercent', width: 8 },
        { header: 'NetRate', key: 'netRate', width: 10 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'SGST%', key: 'sgstPercent', width: 8 },
        { header: 'MRP', key: 'mrp', width: 10 },
        { header: 'Rack', key: 'rack', width: 8 },
        { header: 'SRate', key: 'sRate', width: 10 },
        { header: 'Free', key: 'sch', width: 6 },
      ];

      const dataRows = rows.filter(row => row.name);
      dataRows.forEach((row, index) => {
        worksheet.addRow({
          serial: index + 1,
          name: row.name || '',
          mfac: row.mfac || '',
          batch: row.batch || '',
          hsn: row.hsn || '',
          exp: row.exp || '',
          pack: row.pack || '',
          pQty: Number(row.pQty) || 0,
          qty: Number(row.qty) || 0,
          price: Number(row.price) || 0,
          discountPercent: Number(row.discountPercent) || 0,
          netRate: Number(row.netRate) || 0,
          amount: Number(row.amount) || 0,
          sgstPercent: Number(row.sgstPercent) || 0,
          mrp: Number(row.mrp) || 0,
          rack: row.rack || '',
          sRate: Number(row.sRate) || 0,
          sch: Number(row.sch) || 0,
        });
      });

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF05015A' }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Purchase_${supplier?.invoiceNo || supplier?.purchaseId || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exported successfully');
    } catch (error) {
      toast.error("Failed to export Excel");
    } finally {
      setIsLoading(false);
    }
  }, [supplier, toast]);

  const handleImportFile = useCallback((file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'csv') handleImportCSV(file);
    else if (['xlsx', 'xls'].includes(extension)) handleImportExcel(file);
    else toast.error('Unsupported Format', 'Please use CSV, XLS, or XLSX files.');
  }, [handleImportCSV, handleImportExcel, toast]);

  return { isLoading, handleImportFile, handleExportExcel };
};

export default usePurchaseImportExport;

// // src/hooks/usePurchaseImportExport.js
// import { useState, useCallback } from "react";
// import ExcelJS from "exceljs";
// import * as XLSX from "xlsx";
// import { makeEmptyPurchaseRow, calculateRow } from "./usePurchaseCalculation";

// const mapHeaderToKey = (h) => {
//   if (!h) return null;
//   const key = String(h).replace(/[\n\r\t]/g, ' ').replace(/\s+/g, '').toLowerCase().replace(/[^a-z0-9%]/g, '');
//   const map = {
//     mfac: "mfac", manufacturer: "mfac", mfr: "mfac", company: "mfac",
//     rack: "rack", location: "rack", shelf: "rack",
//     description: "name", product: "name", name: "name", item: "name",
//     hsn: "hsn", hsnsac: "hsn", hsncode: "hsn",
//     pack: "pack", packing: "pack", unit: "pack",
//     batch: "batch", batchno: "batch", lot: "batch",
//     exp: "exp", expiry: "exp", expirydate: "exp",
//     qty: "qty", quantity: "qty", units: "qty",
//     sch: "sch", scheme: "sch", free: "sch",
//     mrp: "mrp", price: "price", rate: "price",
//     "sch%": "schemePercent", schemepercent: "schemePercent",
//     "disc%": "discountPercent", discountpercent: "discountPercent",
//     "cgst%": "cgstPercent", cgstpercent: "cgstPercent",
//     "sgst%": "sgstPercent", sgstpercent: "sgstPercent",
//     amount: "amount", total: "amount",
//   };
//   return map[key] || null;
// };

// const parseRowData = (headers, values) => {
//   const row = makeEmptyPurchaseRow();
//   headers.forEach((h, i) => {
//     const key = mapHeaderToKey(h);
//     if (key && values[i] !== undefined && values[i] !== null) {
//       row[key] = String(values[i]).trim();
//     }
//   });
//   if (!row.sch) row.sch = "0";
//   return calculateRow(row);
// };

// export const usePurchaseImportExport = (onImport, supplier, toast) => {
//   const [isLoading, setIsLoading] = useState(false);

//   const handleImportCSV = useCallback((file) => {
//     setIsLoading(true);
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const lines = e.target.result.split("\n").map(l => l.trim()).filter(Boolean);
//         if (lines.length < 2) {
//           toast.error("CSV file is empty");
//           setIsLoading(false);
//           return;
//         }
//         const headers = lines[0].split(",").map(h => h.trim());
//         const parsed = [];
//         for (let i = 1; i < lines.length; i++) {
//           const values = lines[i].split(",").map(v => v.trim().replace(/^\"|\"$/g, ''));
//           parsed.push(parseRowData(headers, values));
//         }
//         onImport(parsed);
//         toast.success("CSV Imported", `${parsed.filter(r => r.name).length} items imported.`);
//       } catch (error) {
//         toast.error("Failed to import CSV");
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     reader.readAsText(file);
//   }, [onImport, toast]);

//   const handleImportExcel = useCallback(async (file) => {
//     setIsLoading(true);
//     try {
//       const arrayBuffer = await file.arrayBuffer();
//       const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
//       const sheetName = workbook.SheetNames[0];
//       const worksheet = workbook.Sheets[sheetName];
//       const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      
//       if (data.length < 1) {
//         toast.error("Excel file is empty");
//         setIsLoading(false);
//         return;
//       }

//       const headers = data[0].map(h => String(h || '').trim());
//       const parsed = [];
//       for (let i = 1; i < data.length; i++) {
//         const rowData = data[i];
//         if (!rowData || rowData.every(cell => !cell || String(cell).trim() === '')) continue;
//         parsed.push(parseRowData(headers, rowData.map(cell => String(cell || '').trim())));
//       }

//       onImport(parsed);
//       toast.success("Excel Imported", `${parsed.filter(r => r.name).length} items imported.`);
//     } catch (error) {
//       toast.error("Failed to import Excel");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [onImport, toast]);

//   const handleExportExcel = useCallback(async (rows) => {
//     setIsLoading(true);
//     try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet('Purchase Items');
      
//       worksheet.columns = [
//         { header: '#', key: 'serial', width: 5 },
//         { header: 'Description', key: 'name', width: 30 },
//         { header: 'HSN', key: 'hsn', width: 12 },
//         { header: 'Mfac', key: 'mfac', width: 15 },
//         { header: 'Rack', key: 'rack', width: 8 },
//         { header: 'Pack', key: 'pack', width: 8 },
//         { header: 'Qty', key: 'qty', width: 8 },
//         { header: 'Rate', key: 'price', width: 10 },
//         { header: 'Amount', key: 'amount', width: 12 },
//       ];

//       const dataRows = rows.filter(row => row.name);
//       dataRows.forEach((row, index) => {
//         worksheet.addRow({
//           serial: index + 1,
//           name: row.name || '',
//           hsn: row.hsn || '',
//           mfac: row.mfac || '',
//           rack: row.rack || '',
//           pack: row.pack || '',
//           qty: Number(row.qty) || 0,
//           price: Number(row.price) || 0,
//           amount: Number(row.amount) || 0,
//         });
//       });

//       const buffer = await workbook.xlsx.writeBuffer();
//       const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `Purchase_${supplier?.invoiceNo || supplier?.purchaseId || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
//       link.click();
//       URL.revokeObjectURL(url);
//       toast.success('Excel exported successfully');
//     } catch (error) {
//       toast.error("Failed to export Excel");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [supplier, toast]);

//   const handleImportFile = useCallback((file) => {
//     const extension = file.name.split('.').pop().toLowerCase();
//     if (extension === 'csv') handleImportCSV(file);
//     else if (['xlsx', 'xls'].includes(extension)) handleImportExcel(file);
//     else toast.error('Unsupported Format', 'Please use CSV, XLS, or XLSX files.');
//   }, [handleImportCSV, handleImportExcel, toast]);

//   return { isLoading, handleImportFile, handleExportExcel };
// };

// export default usePurchaseImportExport;