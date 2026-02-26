// src/hooks/purchase/usePurchaseImportExport.js

import { useState, useCallback } from "react";
import ExcelJS from "exceljs";
// ✅ REMOVED: import * as XLSX from "xlsx";
import { makeEmptyPurchaseRow, calculateRow } from "./usePurchaseCalculation";
import { useAuthStore } from "../../store/useAuthStore";  

// ✅ Generate unique row ID
const generateRowId = () => `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Enhanced header mapping for pharmacy invoice formats
 */
const mapHeaderToKey = (h) => {
  if (!h) return null;
  
  const key = String(h)
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%_]/g, '');
  
  const map = {
    // === Manufacturer/Company ===
    mfac: "mfac", manufacturer: "mfac", mfr: "mfac", company: "mfac", 
    mfgcomp: "mfac", mktgcomp: "mfac", manfacturer: "mfac",
    
    // === Rack/Location ===
    rack: "rack", location: "rack", shelf: "rack", rackno: "rack",
    
    // === Product Name ===
    description: "name", product: "name", name: "name", 
    itemname: "name", itemdescription: "name", 
    itemname2: "name2",
    particulars: "name", productname: "name",
    item: "name", productdesc: "name", desc: "name",
    
    // === HSN Code ===
    hsn: "hsn", hsnsac: "hsn", hsncode: "hsn", hsnsaccode: "hsn",
    saccode: "hsn", hsnno: "hsn",
    
    // === Pack/Packing ===
    pack: "pack", packing: "pack", unit: "pack", packname: "pack",
    packsize: "pack", uom: "pack",
    
    // === Batch ===
    batch: "batch", batchno: "batch", lot: "batch", lotno: "batch",
    batchnumber: "batch",
    
    // === Expiry ===
    exp: "exp", expiry: "exp", expirydate: "exp", expdate: "exp",
    expirydt: "exp",
    
    // === Quantities ===
    qty: "qty", quantity: "qty", units: "qty", invqty: "qty",
    pqty: "pQty", prevqty: "pQty", previousqty: "pQty", purchaseqty: "pQty",
    
    // === Scheme/Free ===
    sch: "sch", scheme: "sch", free: "sch", bonus: "sch",
    invscqty: "sch", scqty: "sch", freeqty: "sch", schqty: "sch",
    freescheme: "sch",
    invscdis: "schemePercent", schper: "schemePercent",
    
    // ✅ Free Item Flag
    isfreeitem: "isFreeItem", freeitem: "isFreeItem", isfree: "isFreeItem",
    
    // === Pricing ===
    mrp: "mrp", itemmrp: "mrp", maximumretailprice: "mrp", vatmrp: "mrp",
    price: "price", rate: "price", purchaserate: "price", 
    ptr: "price", purrate: "price",
    
    srate: "sRate", sellingrate: "sRate", selrate: "sRate", salerate: "sRate",
    
    // === Net Rate ===
    netrate: "netRate", net: "netRate", nrate: "netRate",
    
    // === Discount Percentages ===
    "sch%": "schemePercent", schemepercent: "schemePercent", schpercent: "schemePercent",
    "disc%": "discountPercent", "dis%": "discountPercent", 
    discountpercent: "discountPercent", discount: "discountPercent",
    invdisc: "discountPercent", tradedisc: "discountPercent",
    
    // === Tax ===
    "cgst%": "cgstPercent", cgstpercent: "cgstPercent", cgst: "cgstPercent",
    cgstper: "cgstPercent", cgstrate: "cgstPercent",
    "sgst%": "sgstPercent", sgstpercent: "sgstPercent", sgst: "sgstPercent",
    sgstper: "sgstPercent", sgstrate: "sgstPercent",
    "igst%": "igstPercent", igstpercent: "igstPercent", igst: "igstPercent",
    igstper: "igstPercent",
    vatper: "cgstPercent", vat: "cgstPercent",
    
    // === Amount/Total ===
    amount: "amount", total: "amount", invamt: "amount", 
    lineamt: "amount", value: "amount", netamt: "amount",
    
    // === Credit Days ===
    crdays: "creditDays", creditdays: "creditDays",
    
    // === Conversion Factor ===
    convfact: "conversionFactor", cf: "conversionFactor",
    
    // === Local Sale Flag ===
    loclsale: "localSaleFlag",
  };
  
  return map[key] || null;
};

/**
 * Parse expiry date from various formats
 */
const parseExpiryFromData = (row, headers, values) => {
  const getColValue = (colName) => {
    const idx = headers.findIndex(h => {
      const cleaned = String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleaned === colName;
    });
    return idx !== -1 ? String(values[idx] || '').trim() : '';
  };
  
  const expMonth = getColValue('expmonth');
  const expYear = getColValue('expyear');
  
  if (expMonth && expYear) {
    const month = String(expMonth).padStart(2, '0');
    let year = String(expYear);
    if (year.length === 4) year = year.slice(-2);
    return `${month}/${year}`;
  }
  
  if (row.exp) {
    const exp = String(row.exp).trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(exp)) {
      const parts = exp.split('/');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 4) year = year.slice(-2);
      return `${month}/${year}`;
    }
    if (/^\d{2}\/\d{2}$/.test(exp)) {
      return exp;
    }
  }
  
  return row.exp || '';
};

/**
 * ✅ Check if row is marked as free item
 */
const checkIsFreeItem = (row, values) => {
  if (row.isFreeItem === true || row.isFreeItem === 'true' || row.isFreeItem === '1') {
    return true;
  }
  
  const amount = String(row.amount || '').toUpperCase().trim();
  if (amount === 'FREE' || amount === '0' || amount === '0.00') {
    const qty = parseFloat(row.qty) || 0;
    if (qty > 0) {
      return true;
    }
  }
  
  const sch = String(row.sch || '').toUpperCase().trim();
  if (sch === 'FREE' || sch === 'FREEITEM' || sch === 'FREE ITEM') {
    return true;
  }
  
  return false;
};

/**
 * Parse a single row of data
 */
const parseRowData = (headers, values, debugMode = false) => {
  const row = makeEmptyPurchaseRow();
  row.rowId = generateRowId();
  
  const mappedFields = {};
  
  headers.forEach((h, i) => {
    const key = mapHeaderToKey(h);
    if (key && values[i] !== undefined && values[i] !== null) {
      let value = String(values[i]).trim();
      
      if (['qty', 'pQty', 'sch', 'mrp', 'price', 'sRate', 'netRate', 'amount',
           'schemePercent', 'discountPercent', 'cgstPercent', 'sgstPercent', 'igstPercent'].includes(key)) {
        if (value.toUpperCase() !== 'FREE') {
          value = value.replace(/[^\d.-]/g, '');
        }
      }
      
      if (value) {
        row[key] = value;
        mappedFields[h] = { key, value };
      }
    }
  });
  
  if (!row.name && row.name2) {
    row.name = row.name2;
  }
  delete row.name2;
  
  row.exp = parseExpiryFromData(row, headers, values);
  row.isFreeItem = checkIsFreeItem(row, values);
  
  if (row.isFreeItem) {
    row.amount = "0";
    row.netRate = "0";
    row.taxableValue = "0";
    row.sch = "";
  }
  
  if (!row.sch) row.sch = "";
  if (!row.pQty) row.pQty = "";
  if (!row.cgstPercent && !row.sgstPercent) {
    row.cgstPercent = "6";
    row.sgstPercent = "6";
  } else if (row.cgstPercent && !row.sgstPercent) {
    row.sgstPercent = row.cgstPercent;
  } else if (!row.cgstPercent && row.sgstPercent) {
    row.cgstPercent = row.sgstPercent;
  }
  
  if (debugMode) {
    console.log('Mapped fields:', mappedFields);
    console.log('Parsed row:', { 
      name: row.name, 
      mfac: row.mfac, 
      hsn: row.hsn, 
      qty: row.qty,
      isFreeItem: row.isFreeItem 
    });
  }
  
  if (row.isFreeItem) {
    return row;
  }
  
  return calculateRow(row);
};

// ✅ NEW: Helper to extract cell value from ExcelJS cell
const extractCellValue = (cell) => {
  const value = cell.value;

  if (value === null || value === undefined) return "";

  // Formula: { formula: '...', result: ... }
  if (typeof value === 'object' && 'result' in value) {
    const result = value.result;
    if (result instanceof Date) return result.toLocaleDateString();
    return result !== null && result !== undefined ? result : "";
  }

  // Rich text: { richText: [{ text: '...' }, ...] }
  if (typeof value === 'object' && value.richText) {
    return value.richText.map((rt) => rt.text).join('');
  }

  // Hyperlink: { text: '...', hyperlink: '...' }
  if (typeof value === 'object' && value.text) {
    return value.text;
  }

  // Error
  if (typeof value === 'object' && value.error) {
    return "";
  }

  // Date
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  return value;
};

export const usePurchaseImportExport = (onImport, supplier, toast, productMaster = []) => {
  const [isLoading, setIsLoading] = useState(false);

  const detectNewProducts = useCallback((parsedRows) => {
    const newProducts = [];
    const processedRows = [];
    const matchedProductCache = new Map();
    
    console.group("🔍 Product Detection & Matching");
    console.log("Product Master Count:", productMaster.length);
    console.log("Parsed Rows Count:", parsedRows.length);
    
    let skippedNoName = 0;
    let matchedCount = 0;
    let cacheHits = 0;
    let newCount = 0;
    let freeItemCount = 0;
    
    parsedRows.forEach((row, idx) => {
      if (!row.name || !row.name.trim()) {
        skippedNoName++;
        return;
      }

      if (row.isFreeItem) {
        freeItemCount++;
      }

      const rowName = row.name.trim();
      const rowMfac = (row.mfac || '').trim();
      const cacheKey = `${rowName.toLowerCase()}|${rowMfac.toLowerCase()}`;
      
      if (matchedProductCache.has(cacheKey)) {
        const cachedMatch = matchedProductCache.get(cacheKey);
        
        processedRows.push({
          ...row,
          medicine_id: cachedMatch.medicine_id,
          hsn: row.hsn || cachedMatch.hsn || '',
          rack: row.rack || cachedMatch.rack || '',
          pack: row.pack || cachedMatch.pack || '',
          cgstPercent: row.cgstPercent || cachedMatch.cgstPercent || '6',
          sgstPercent: row.sgstPercent || cachedMatch.sgstPercent || '6',
        });
        matchedCount++;
        cacheHits++;
        return;
      }
      
      const matchingProduct = productMaster.find(product => {
        const productName = (product.name || '').toLowerCase();
        const searchName = rowName.toLowerCase();
        
        if (productName === searchName) return true;
        
        if (rowMfac) {
          const productMfac = (product.manufacturer || product.mfac || '').toLowerCase();
          const searchMfac = rowMfac.toLowerCase();
          if (productName === searchName && productMfac === searchMfac) return true;
          if (productName.includes(searchName) && productMfac.includes(searchMfac)) return true;
        }
        
        if (productName.includes(searchName) || searchName.includes(productName)) return true;
        
        return false;
      });

      if (matchingProduct) {
        const matchData = {
          medicine_id: matchingProduct.medicine_id || matchingProduct.id,
          hsn: matchingProduct.hsnCode || matchingProduct.hsn || '',
          rack: matchingProduct.rackNo || matchingProduct.rack || '',
          pack: matchingProduct.packSize || matchingProduct.pack || '',
          cgstPercent: matchingProduct.cgstPercent || '6',
          sgstPercent: matchingProduct.sgstPercent || '6',
        };
        
        matchedProductCache.set(cacheKey, matchData);
        
        processedRows.push({
          ...row,
          medicine_id: matchData.medicine_id,
          hsn: row.hsn || matchData.hsn,
          rack: row.rack || matchData.rack,
          pack: row.pack || matchData.pack,
          cgstPercent: row.cgstPercent || matchData.cgstPercent,
          sgstPercent: row.sgstPercent || matchData.sgstPercent,
        });
        matchedCount++;
      } else {
        const alreadyDetected = newProducts.some(newProd => {
          const newProdName = (newProd.name || '').toLowerCase();
          const newProdMfac = (newProd.manufacturer || '').toLowerCase();
          return newProdName === rowName.toLowerCase() && 
                 (!rowMfac || newProdMfac === rowMfac.toLowerCase());
        });
        
        if (!alreadyDetected) {
          newProducts.push({
            name: rowName,
            manufacturer: rowMfac,
            hsnCode: row.hsn || '',
            packSize: row.pack || '',
            rackNo: row.rack || '',
            category: '',
            gst: row.cgstPercent && row.sgstPercent 
              ? String(parseFloat(row.cgstPercent) + parseFloat(row.sgstPercent))
              : '12',
            cgstPercent: row.cgstPercent || '6',
            sgstPercent: row.sgstPercent || '6',
            genericName: '',
          });
          newCount++;
        }
        
        processedRows.push({
          ...row,
          medicine_id: null,
        });
      }
    });
    
    console.log(`\n📊 Detection Summary:`);
    console.log(`  Total Rows: ${parsedRows.length}`);
    console.log(`  Skipped (no name): ${skippedNoName}`);
    console.log(`  Matched (total): ${matchedCount}`);
    console.log(`  Cache Hits: ${cacheHits}`);
    console.log(`  New Products: ${newCount}`);
    console.log(`  Free Items: ${freeItemCount}`);
    console.groupEnd();
    
    return { existingRows: processedRows, newProducts };
  }, [productMaster]);

  const handleImportCSV = useCallback((file) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const firstLine = content.split('\n')[0];
        const delimiter = firstLine.includes('\t') ? '\t' : ',';
        
        const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          toast.error("CSV file is empty");
          setIsLoading(false);
          return;
        }
        
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^\"|\"$/g, ''));
        
        console.group("📋 CSV Header Analysis");
        console.log("Headers:", headers);
        console.groupEnd();
        
        const parsed = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(delimiter).map(v => v.trim().replace(/^\"|\"$/g, ''));
          if (values.some(v => v)) {
            parsed.push(parseRowData(headers, values, i <= 2));
          }
        }
        
        const { existingRows, newProducts } = detectNewProducts(parsed);
        onImport(existingRows, newProducts);
        
        const matchedCount = existingRows.filter(r => r.medicine_id).length;
        const freeCount = existingRows.filter(r => r.isFreeItem).length;
        toast.success("CSV Imported", `${matchedCount} matched, ${newProducts.length} new, ${freeCount} free items`);
      } catch (error) {
        console.error('❌ CSV import error:', error);
        toast.error("Failed to import CSV", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  }, [onImport, toast, detectNewProducts]);

  // ✅ MIGRATED: Now uses ExcelJS instead of xlsx
  const handleImportExcel = useCallback(async (file) => {
  setIsLoading(true);
  
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    let arrayBuffer;

    // ✅ Handle .xls files via backend conversion
    if (extension === 'xls') {
      console.log('📤 Uploading .xls file for server conversion...');
      
      toast.info('Converting File', 'Converting legacy Excel format, please wait for it to load');

      const formData = new FormData();
      formData.append('file', file);

      // ✅ FIX: Get token correctly
      const token = localStorage.getItem('access_token');
      
      console.log('🔑 Token found:', token ? 'Yes' : 'No');
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      console.log('🌐 API URL:', `${apiUrl}/api/excel/convert`);

      const response = await fetch(`${apiUrl}/api/excel/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Response wasn't JSON
        }
        
        throw new Error(errorMessage);
      }

      arrayBuffer = await response.arrayBuffer();
      
      // Log conversion stats
      const conversionTime = response.headers.get('X-Conversion-Time');
      const originalSize = response.headers.get('X-Original-Size');
      const convertedSize = response.headers.get('X-Converted-Size');
      
      console.log('✅ Server conversion successful');
      if (conversionTime) {
        console.log(`   Conversion time: ${conversionTime}`);
        console.log(`   Size: ${(originalSize / 1024).toFixed(2)}KB → ${(convertedSize / 1024).toFixed(2)}KB`);
      }
      
    } else if (extension === 'xlsx') {
      // Direct processing for .xlsx files
      arrayBuffer = await file.arrayBuffer();
      console.log('📊 Processing .xlsx file directly');
    } else {
      throw new Error('Unsupported file format. Please use .xls or .xlsx files.');
    }

    // ✅ Process with ExcelJS (works for both formats now)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet || worksheet.rowCount < 2) {
      toast.error("Excel file is empty");
      setIsLoading(false);
      return;
    }

    // Extract data to array
    const data = [];
    const colCount = worksheet.columnCount;

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const rowValues = [];
      for (let col = 1; col <= colCount; col++) {
        const cell = row.getCell(col);
        rowValues.push(extractCellValue(cell));
      }
      data.push(rowValues);
    });

    if (data.length < 2) {
      toast.error("No data found in Excel file");
      setIsLoading(false);
      return;
    }

    // Find header row
    let headerRowIndex = 0;
    let maxNonEmptyCells = 0;
    
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (!row) continue;
      
      const nonEmptyCells = row.filter(cell => 
        cell !== null && cell !== undefined && String(cell).trim() !== ''
      ).length;
      
      if (nonEmptyCells > maxNonEmptyCells && nonEmptyCells >= 3) {
        maxNonEmptyCells = nonEmptyCells;
        headerRowIndex = i;
      }
    }

    const headers = data[headerRowIndex].map(h => String(h || '').trim());
    
    console.group("📋 Excel Import Analysis");
    console.log("File Format:", extension.toUpperCase());
    console.log("Processing:", extension === 'xls' ? 'Server Conversion → ExcelJS' : 'Direct ExcelJS');
    console.log("Headers:", headers);
    console.log("Data Rows:", data.length - headerRowIndex - 1);
    console.groupEnd();
    
    // Parse rows
    const parsed = [];
    
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const rowData = data[i];
      
      // Skip completely empty rows
      if (!rowData || rowData.every(cell => 
        cell === null || cell === undefined || String(cell).trim() === ''
      )) continue;
      
      const values = rowData.map(cell => String(cell || '').trim());
      const parsedRow = parseRowData(headers, values, parsed.length < 2);
      
      // Only add rows with meaningful data
      if (parsedRow.name || parsedRow.mfac || parsedRow.hsn || parsedRow.qty || parsedRow.price) {
        parsed.push(parsedRow);
      }
    }

    if (parsed.length === 0) {
      toast.warning("No Valid Data", "No valid product data found in the Excel file.");
      setIsLoading(false);
      return;
    }

    // Detect new products and match existing ones
    const { existingRows, newProducts } = detectNewProducts(parsed);
    onImport(existingRows, newProducts);
    
    // Success message
    const matchedCount = existingRows.filter(r => r.medicine_id).length;
    const freeCount = existingRows.filter(r => r.isFreeItem).length;
    
    const successDetails = extension === 'xls' 
      ? `Converted from .xls • ${matchedCount} matched, ${newProducts.length} new, ${freeCount} free items`
      : `${matchedCount} matched, ${newProducts.length} new, ${freeCount} free items`;
    
    toast.success("Import Successful", successDetails);
    
  } catch (error) {
    console.error('❌ Excel import error:', error);
    
    // User-friendly error messages
    if (error.message?.includes('LibreOffice') || error.message?.includes('Conversion service unavailable')) {
      toast.error(
        "Conversion Service Error", 
        "The server conversion service is not available. Please contact your administrator or try converting the file to .xlsx manually."
      );
    } else if (error.message?.includes('Authentication') || error.message?.includes('401')) {
      toast.error(
        "Session Expired", 
        "Your session has expired. Please log in again."
      );
    } else if (error.message?.includes('timeout') || error.message?.includes('408')) {
      toast.error(
        "Conversion Timeout", 
        "File conversion took too long. The file may be too large or complex. Try saving it as .xlsx in Excel first."
      );
    } else if (error.message?.includes('Server error') || error.message?.includes('500')) {
      toast.error(
        "Server Error", 
        "Failed to convert file on server. Please try again or convert manually to .xlsx format."
      );
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      toast.error(
        "Connection Error", 
        "Cannot connect to server. Please check your internet connection."
      );
    } else if (error.message?.includes('zip')) {
      toast.error(
        "Corrupted File", 
        "This Excel file appears to be corrupted. Try opening and re-saving it."
      );
    } else {
      toast.error("Import Failed", error.message);
    }
  } finally {
    setIsLoading(false);
  }
}, [onImport, toast, detectNewProducts]);

  const handleExportExcel = useCallback(async (rows) => {
    setIsLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Purchase Items');
      
      worksheet.columns = [
        { header: '#', key: 'serial', width: 5 },
        { header: 'Description', key: 'name', width: 35 },
        { header: 'Manufacturer', key: 'mfac', width: 18 },
        { header: 'Batch', key: 'batch', width: 12 },
        { header: 'HSN Code', key: 'hsn', width: 12 },
        { header: 'Expiry', key: 'exp', width: 10 },
        { header: 'Pack', key: 'pack', width: 10 },
        { header: 'Prev Qty', key: 'pQty', width: 8 },
        { header: 'Quantity', key: 'qty', width: 10 },
        { header: 'Rate', key: 'price', width: 12 },
        { header: 'Discount %', key: 'discountPercent', width: 10 },
        { header: 'Net Rate', key: 'netRate', width: 12 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'CGST %', key: 'cgstPercent', width: 8 },
        { header: 'SGST %', key: 'sgstPercent', width: 8 },
        { header: 'MRP', key: 'mrp', width: 12 },
        { header: 'Rack', key: 'rack', width: 8 },
        { header: 'Sale Rate', key: 'sRate', width: 12 },
        { header: 'Free/Scheme', key: 'sch', width: 10 },
        { header: 'Is Free Item', key: 'isFreeItem', width: 10 },
      ];

      const dataRows = rows.filter(row => row.name || row.qty || row.price);
      
      dataRows.forEach((row, index) => {
        const isFree = row.isFreeItem === true;
        
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
          netRate: isFree ? 0 : (row.netRate ? Number(row.netRate) : 0),
          amount: isFree ? 'FREE' : (row.amount ? Number(row.amount) : 0),
          cgstPercent: row.cgstPercent ? Number(row.cgstPercent) : 0,
          sgstPercent: row.sgstPercent ? Number(row.sgstPercent) : 0,
          mrp: row.mrp ? Number(row.mrp) : 0,
          rack: row.rack || '',
          sRate: row.sRate ? Number(row.sRate) : 0,
          sch: isFree ? 'FREE' : (row.sch || ''),
          isFreeItem: isFree ? 'Yes' : 'No',
        };
        
        const excelRow = worksheet.addRow(rowData);
        
        if (isFree) {
          excelRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8F5E9' }
          };
          excelRow.font = { color: { argb: 'FF2E7D32' } };
        } else if (index % 2 === 0) {
          excelRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' }
          };
        }
      });

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF05015A' }
      };
      headerRow.height = 25;
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      worksheet.autoFilter = 'A1:T1';
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
      
      const freeCount = dataRows.filter(r => r.isFreeItem).length;
      const billableCount = dataRows.length - freeCount;
      toast.success('Excel Export Complete', `${billableCount} billable + ${freeCount} free items exported.`);
      
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
    const maxSize = 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      toast.error('File too large', 'Please select a file smaller than 10MB.');
      return;
    }
    
    if (extension === 'csv') {
      handleImportCSV(file);
    } else if (['xlsx', 'xls'].includes(extension)) {
      handleImportExcel(file);
    } else {
      toast.error('Unsupported Format', 'Please use CSV or Excel files.');
    }
  }, [handleImportCSV, handleImportExcel, toast]);

  return { 
    isLoading, 
    handleImportFile, 
    handleExportExcel,
    detectNewProducts
  };
};

export default usePurchaseImportExport;