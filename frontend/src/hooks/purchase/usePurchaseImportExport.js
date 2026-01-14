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
    mfac: "mfac", manufacturer: "mfac", mfr: "mfac", company: "mfac", mfgcomp: "mfac",
    // Rack/Location
    rack: "rack", location: "rack", shelf: "rack",
    // Product Name
    description: "name", product: "name", name: "name", itemname: "name", itemdescription: "name",
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
    "disc%": "discountPercent", "dis%": "discountPercent", discountpercent: "discountPercent",
    // Tax
    "cgst%": "cgstPercent", cgstpercent: "cgstPercent", cgst: "cgstPercent",
    "sgst%": "sgstPercent", sgstpercent: "sgstPercent", sgst: "sgstPercent",
    // Amount
    amount: "amount", total: "amount",
    // Serial number (optional, usually ignored)
    "": null, serial: null, "#": null, no: null,
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

export const usePurchaseImportExport = (onImport, supplier, toast, productMaster = []) => {
  const [isLoading, setIsLoading] = useState(false);

  // ✅ NEW: Function to detect new products during import
  const detectNewProducts = useCallback((parsedRows) => {
    const newProducts = [];
    const existingRows = [];
    
    parsedRows.forEach(row => {
      if (row.name && row.name.trim()) {
        // Check if product exists in master
        const exists = productMaster.some(product => {
          const productName = (product.name || '').toLowerCase();
          const rowName = (row.name || '').toLowerCase();
          
          return productName === rowName ||
                 productName.includes(rowName) ||
                 rowName.includes(productName);
        });
        
        if (!exists) {
          // Check if we already have this new product in our detected list
          const alreadyDetected = newProducts.some(newProd => {
            const newProdName = (newProd.name || '').toLowerCase();
            const rowName = (row.name || '').toLowerCase();
            return newProdName === rowName;
          });
          
          if (!alreadyDetected) {
            newProducts.push({
              name: row.name.trim(),
              mfac: row.mfac || '',
              hsn: row.hsn || '',
              rack: row.rack || '',
              // Additional fields that might be useful
              price: row.price || '',
              mrp: row.mrp || '',
              pack: row.pack || '',
            });
          }
        }
        
        // Always add the row to existing rows for processing
        existingRows.push(row);
      } else if (row.mfac || row.hsn || row.qty || row.price) {
        // Include rows that have other meaningful data even without names
        existingRows.push(row);
      }
    });
    
    console.log(`🔍 Detected ${newProducts.length} new products from ${parsedRows.length} total rows`);
    console.log('📦 New products:', newProducts);
    
    return { existingRows, newProducts };
  }, [productMaster]);

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
        
        const headers = lines[0].split(",").map(h => h.trim().replace(/^\"|\"$/g, ''));
        const parsed = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/^\"|\"$/g, ''));
          if (values.some(v => v)) { // Only process lines with some data
            parsed.push(parseRowData(headers, values));
          }
        }
        
        console.log('📊 CSV parsed rows:', parsed.length);
        
        // ✅ NEW: Detect new products
        const { existingRows, newProducts } = detectNewProducts(parsed);
        
        // Call onImport with both existing rows and new products
        onImport(existingRows, newProducts);
        
        const successMessage = `${existingRows.filter(r => r.name).length} items imported`;
        const newProductMessage = newProducts.length > 0 ? `, ${newProducts.length} new products detected` : '';
        
        toast.success("CSV Imported", `${successMessage}${newProductMessage}.`);
      } catch (error) {
        console.error('❌ CSV import error:', error);
        toast.error("Failed to import CSV", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  }, [onImport, toast, detectNewProducts]);

  const handleImportExcel = useCallback(async (file) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", blankrows: false });
      
      console.log('📊 Raw Excel data length:', data.length);
      
      if (data.length < 2) {
        toast.error("Excel file is empty or has no data rows");
        setIsLoading(false);
        return;
      }

      // Find the header row - look for row with most non-empty cells
      let headerRowIndex = 0;
      let maxNonEmptyCells = 0;
      
      for (let i = 0; i < Math.min(data.length, 5); i++) { // Check first 5 rows only
        const row = data[i];
        const nonEmptyCells = row.filter(cell => 
          cell !== null && 
          cell !== undefined && 
          String(cell).trim() !== ''
        ).length;
        
        if (nonEmptyCells > maxNonEmptyCells && nonEmptyCells >= 3) {
          maxNonEmptyCells = nonEmptyCells;
          headerRowIndex = i;
        }
      }

      const headers = data[headerRowIndex].map(h => String(h || '').trim());
      console.log(`📋 Using headers from row ${headerRowIndex + 1}:`, headers);
      console.log('🔑 Mapped keys:', headers.map(h => `${h} -> ${mapHeaderToKey(h)}`));
      
      const parsed = [];
      
      // Start parsing from row AFTER headers
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const rowData = data[i];
        if (!rowData || rowData.every(cell => 
          cell === null || 
          cell === undefined || 
          String(cell).trim() === ''
        )) continue;
        
        const parsedRow = parseRowData(headers, rowData.map(cell => String(cell || '').trim()));
        
        // Only add if has meaningful data
        if (parsedRow.name || parsedRow.mfac || parsedRow.hsn || parsedRow.qty || parsedRow.price) {
          parsed.push(parsedRow);
        }
      }

      console.log('✅ Excel parsed rows:', parsed.length);
      console.log('✅ Items with names:', parsed.filter(r => r.name).length);

      // ✅ NEW: Detect new products
      const { existingRows, newProducts } = detectNewProducts(parsed);

      // Call onImport with both existing rows and new products
      onImport(existingRows, newProducts);
      
      const itemsWithNames = existingRows.filter(r => r.name).length;
      const successMessage = `${existingRows.length} items imported (${itemsWithNames} with names)`;
      const newProductMessage = newProducts.length > 0 ? `, ${newProducts.length} new products detected` : '';
      
      toast.success("Excel Imported", `${successMessage}${newProductMessage}.`);
      
    } catch (error) {
      console.error('❌ Excel import error:', error);
      toast.error("Failed to import Excel", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [onImport, toast, detectNewProducts]);

  const handleExportExcel = useCallback(async (rows) => {
    setIsLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Purchase Items');
      
      // ✅ Enhanced column definitions with better formatting
      worksheet.columns = [
        { header: '#', key: 'serial', width: 5 },
        { header: 'Description', key: 'name', width: 35 },
        { header: 'Manufacturer', key: 'mfac', width: 18 },
        { header: 'Batch', key: 'batch', width: 12 },
        { header: 'HSN Code', key: 'hsn', width: 12 },
        { header: 'Expiry', key: 'exp', width: 10 },
        { header: 'Pack', key: 'pack', width: 8 },
        { header: 'Prev Qty', key: 'pQty', width: 8 },
        { header: 'Quantity', key: 'qty', width: 10 },
        { header: 'Rate', key: 'price', width: 12 },
        { header: 'Discount %', key: 'discountPercent', width: 10 },
        { header: 'Net Rate', key: 'netRate', width: 12 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'SGST %', key: 'sgstPercent', width: 8 },
        { header: 'MRP', key: 'mrp', width: 12 },
        { header: 'Rack', key: 'rack', width: 8 },
        { header: 'Sale Rate', key: 'sRate', width: 12 },
        { header: 'Free/Scheme', key: 'sch', width: 10 },
      ];

      const dataRows = rows.filter(row => row.name || row.qty || row.price);
      
      dataRows.forEach((row, index) => {
        const rowData = {
          serial: index + 1,
          name: row.name || '',
          mfac: row.mfac || '',
          batch: row.batch || '',
          hsn: row.hsn || '',
          exp: row.exp || '',
          pack: row.pack || '',
          pQty: row.pQty ? Number(row.pQty) : 0,
          qty: row.qty ? Number(row.qty) : 0,
          price: row.price ? Number(row.price) : 0,
          discountPercent: row.discountPercent ? Number(row.discountPercent) : 0,
          netRate: row.netRate ? Number(row.netRate) : 0,
          amount: row.amount ? Number(row.amount) : 0,
          sgstPercent: row.sgstPercent ? Number(row.sgstPercent) : 0,
          mrp: row.mrp ? Number(row.mrp) : 0,
          rack: row.rack || '',
          sRate: row.sRate ? Number(row.sRate) : 0,
          sch: row.sch || '',
        };
        
        const excelRow = worksheet.addRow(rowData);
        
        // ✅ Enhanced formatting for better readability
        if (index % 2 === 0) {
          excelRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' }
          };
        }
      });

      // ✅ Enhanced header styling
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF05015A' }
      };
      headerRow.height = 25;
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // ✅ Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Align numeric columns
          if (['pQty', 'qty', 'price', 'discountPercent', 'netRate', 'amount', 'sgstPercent', 'mrp', 'sRate'].includes(cell.model?.value?.toString())) {
            cell.alignment = { horizontal: 'right' };
          }
        });
      });

      // ✅ Auto-filter and freeze panes
      worksheet.autoFilter = 'A1:R1';
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const invoiceRef = supplier?.invoiceNo || supplier?.purchaseId || 'export';
      link.download = `Purchase_${invoiceRef}_${timestamp}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Excel Export Complete', `${dataRows.length} items exported successfully.`);
      
    } catch (error) {
      console.error('❌ Export error:', error);
      toast.error("Failed to export Excel", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [supplier, toast]);

  const handleImportFile = useCallback((file) => {
    if (!file) {
      toast.error('No file selected');
      return;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (file.size > maxSize) {
      toast.error('File too large', 'Please select a file smaller than 10MB.');
      return;
    }
    
    if (extension === 'csv') {
      handleImportCSV(file);
    } else if (['xlsx', 'xls'].includes(extension)) {
      handleImportExcel(file);
    } else {
      toast.error('Unsupported Format', 'Please use CSV (.csv), Excel (.xlsx), or Excel 97-2003 (.xls) files.');
    }
  }, [handleImportCSV, handleImportExcel, toast]);

  return { 
    isLoading, 
    handleImportFile, 
    handleExportExcel,
    detectNewProducts // ✅ Expose for external use if needed
  };
};

export default usePurchaseImportExport;
