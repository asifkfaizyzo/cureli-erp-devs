// src/hooks/purchase/usePurchaseImportExport.js
import { useState, useCallback } from "react";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { makeEmptyPurchaseRow, calculateRow } from "./usePurchaseCalculation";

/**
 * Enhanced header mapping for pharmacy invoice formats
 * Supports multiple common naming conventions
 */
const mapHeaderToKey = (h) => {
  if (!h) return null;
  
  // Clean the header: remove special chars, normalize
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
    
    // === Product Name - CRITICAL ===
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
    invscdis: "schemePercent", schper: "schemePercent",
    
    // === Pricing ===
    mrp: "mrp", itemmrp: "mrp", maximumretailprice: "mrp", vatmrp: "mrp",
    price: "price", rate: "price", purchaserate: "price", 
    ptr: "price", purrate: "price",
    
    // ✅ FIXED: sRate mapping - REMOVED loclsale (it's a flag, not a rate)
    srate: "sRate", 
    sellingrate: "sRate", 
    selrate: "sRate", 
    salerate: "sRate",
    
    // === Net Rate ===
    netrate: "netRate", net: "netRate", nrate: "netRate",
    
    // === Discount Percentages ===
    "sch%": "schemePercent", schemepercent: "schemePercent", schpercent: "schemePercent",
    "disc%": "discountPercent", "dis%": "discountPercent", 
    discountpercent: "discountPercent", discount: "discountPercent",
    invdisc: "discountPercent", tradedisc: "discountPercent",
    
    // === Tax - CGST ===
    "cgst%": "cgstPercent", cgstpercent: "cgstPercent", cgst: "cgstPercent",
    cgstper: "cgstPercent", cgstrate: "cgstPercent",
    
    // === Tax - SGST ===
    "sgst%": "sgstPercent", sgstpercent: "sgstPercent", sgst: "sgstPercent",
    sgstper: "sgstPercent", sgstrate: "sgstPercent",
    
    // === Tax - IGST ===
    "igst%": "igstPercent", igstpercent: "igstPercent", igst: "igstPercent",
    igstper: "igstPercent",
    
    // === Tax - VAT (legacy) ===
    vatper: "cgstPercent", vat: "cgstPercent",
    
    // === Amount/Total ===
    amount: "amount", total: "amount", invamt: "amount", 
    lineamt: "amount", value: "amount", netamt: "amount",
    
    // === Credit Days ===
    crdays: "creditDays", creditdays: "creditDays",
    
    // === Conversion Factor ===
    convfact: "conversionFactor", cf: "conversionFactor",
    
    // === Local Sale Flag (NOT a rate!) ===
    loclsale: "localSaleFlag",  // ✅ Map to separate field, it's a 0/1 flag
  };
  
  return map[key] || null;
};

/**
 * Parse expiry date from various formats
 */
const parseExpiryFromData = (row, headers, values) => {
  // Check for separate day/month/year columns
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
  
  // Check for combined expiry field
  if (row.exp) {
    const exp = String(row.exp).trim();
    // DD/MM/YY format
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(exp)) {
      const parts = exp.split('/');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 4) year = year.slice(-2);
      return `${month}/${year}`;
    }
    // MM/YY format
    if (/^\d{2}\/\d{2}$/.test(exp)) {
      return exp;
    }
  }
  
  return row.exp || '';
};

/**
 * Parse a single row of data
 */
const parseRowData = (headers, values, debugMode = false) => {
  const row = makeEmptyPurchaseRow();
  const mappedFields = {};
  
  headers.forEach((h, i) => {
    const key = mapHeaderToKey(h);
    if (key && values[i] !== undefined && values[i] !== null) {
      let value = String(values[i]).trim();
      
      // Clean numeric values
      if (['qty', 'pQty', 'sch', 'mrp', 'price', 'sRate', 'netRate', 'amount',
           'schemePercent', 'discountPercent', 'cgstPercent', 'sgstPercent', 'igstPercent'].includes(key)) {
        value = value.replace(/[^\d.-]/g, '');
      }
      
      // Only set if value is not empty
      if (value) {
        row[key] = value;
        mappedFields[h] = { key, value };
      }
    }
  });
  
  // Handle itemname2 as fallback for name
  if (!row.name && row.name2) {
    row.name = row.name2;
  }
  delete row.name2;
  
  // Parse expiry date
  row.exp = parseExpiryFromData(row, headers, values);
  
  // Default tax values if not provided
  if (!row.sch) row.sch = "0";
  if (!row.pQty) row.pQty = "0";
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
    console.log('Parsed row:', { name: row.name, mfac: row.mfac, hsn: row.hsn, qty: row.qty });
  }
  
  return calculateRow(row);
};

export const usePurchaseImportExport = (onImport, supplier, toast, productMaster = []) => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * ✅ FIXED: Enhanced product matching with medicine_id assignment
   * Uses cache to ensure ALL rows with same product get the same medicine_id
   */
  const detectNewProducts = useCallback((parsedRows) => {
    const newProducts = [];
    const processedRows = [];
    
    // ✅ NEW: Create a cache for matched products to ensure consistency
    const matchedProductCache = new Map();
    
    console.group("🔍 Product Detection & Matching");
    console.log("Product Master Count:", productMaster.length);
    console.log("Parsed Rows Count:", parsedRows.length);
    
    // Debug: Show first 3 rows
    console.log("📋 First 3 parsed rows:");
    parsedRows.slice(0, 3).forEach((row, idx) => {
      console.log(`  Row ${idx + 1}:`, {
        name: row.name || '(EMPTY)',
        batch: row.batch || '(empty)',
        mfac: row.mfac || '(empty)',
        hsn: row.hsn || '(empty)',
        qty: row.qty || '(empty)',
        pack: row.pack || '(empty)',
      });
    });
    
    let skippedNoName = 0;
    let matchedCount = 0;
    let cacheHits = 0;
    let newCount = 0;
    
    parsedRows.forEach((row, idx) => {
      if (!row.name || !row.name.trim()) {
        skippedNoName++;
        return;
      }

      const rowName = row.name.trim();
      const rowMfac = (row.mfac || '').trim();
      
      // ✅ NEW: Create a cache key for this product (name + manufacturer)
      // This ensures same product with different batches gets same medicine_id
      const cacheKey = `${rowName.toLowerCase()}|${rowMfac.toLowerCase()}`;
      
      // ✅ NEW: Check cache first for previously matched products
      if (matchedProductCache.has(cacheKey)) {
        const cachedMatch = matchedProductCache.get(cacheKey);
        console.log(`Row ${idx + 1}: ♻️ Cache HIT for "${rowName}" (Batch: ${row.batch || 'N/A'})`);
        
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
      
      // Try to find matching product in master
      const matchingProduct = productMaster.find(product => {
        const productName = (product.name || '').toLowerCase();
        const searchName = rowName.toLowerCase();
        
        // Exact match
        if (productName === searchName) return true;
        
        // Match with manufacturer
        if (rowMfac) {
          const productMfac = (product.manufacturer || product.mfac || '').toLowerCase();
          const searchMfac = rowMfac.toLowerCase();
          // Exact match with both name and manufacturer
          if (productName === searchName && productMfac === searchMfac) return true;
          // Partial match with both
          if (productName.includes(searchName) && productMfac.includes(searchMfac)) return true;
        }
        
        // Partial match (contains)
        if (productName.includes(searchName) || searchName.includes(productName)) return true;
        
        return false;
      });

      if (matchingProduct) {
        console.log(`Row ${idx + 1}: ✅ Matched "${rowName}" → ID: ${matchingProduct.medicine_id || matchingProduct.id} (Batch: ${row.batch || 'N/A'})`);
        
        const matchData = {
          medicine_id: matchingProduct.medicine_id || matchingProduct.id,
          hsn: matchingProduct.hsnCode || matchingProduct.hsn || '',
          rack: matchingProduct.rackNo || matchingProduct.rack || '',
          pack: matchingProduct.packSize || matchingProduct.pack || '',
          cgstPercent: matchingProduct.cgstPercent || '6',
          sgstPercent: matchingProduct.sgstPercent || '6',
        };
        
        // ✅ NEW: Cache this match for future rows with same product
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
        console.log(`Row ${idx + 1}: ⚠️ NEW - "${rowName}" (${rowMfac || 'no manufacturer'}) (Batch: ${row.batch || 'N/A'})`);
        
        // Check if already in newProducts list
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
          medicine_id: null, // Will be set after product is created
        });
      }
    });
    
    console.log(`\n📊 Detection Summary:`);
    console.log(`  Total Rows: ${parsedRows.length}`);
    console.log(`  Skipped (no name): ${skippedNoName}`);
    console.log(`  Matched (total): ${matchedCount}`);
    console.log(`  Cache Hits: ${cacheHits} (same product, different batch)`);
    console.log(`  New Products: ${newCount}`);
    
    if (skippedNoName > 0) {
      console.warn(`⚠️ ${skippedNoName} rows skipped because 'name' field is empty!`);
      console.warn(`   Check if 'itemname' column is being parsed correctly.`);
    }
    
    if (cacheHits > 0) {
      console.info(`✅ ${cacheHits} rows matched via cache (same medicine, different batches)`);
    }
    
    console.groupEnd();
    
    return { existingRows: processedRows, newProducts };
  }, [productMaster]);

  const handleImportCSV = useCallback((file) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        
        // Detect delimiter (tab or comma)
        const firstLine = content.split('\n')[0];
        const delimiter = firstLine.includes('\t') ? '\t' : ',';
        console.log(`📄 CSV Delimiter detected: "${delimiter === '\t' ? 'TAB' : 'COMMA'}"`);
        
        const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          toast.error("CSV file is empty");
          setIsLoading(false);
          return;
        }
        
        // Parse headers
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^\"|\"$/g, ''));
        
        console.group("📋 CSV Header Analysis");
        console.log("Total columns:", headers.length);
        console.log("Headers:", headers);
        
        // Show which headers map to which keys
        const mappedHeaders = headers.map((h, i) => ({
          index: i,
          original: h,
          mapped: mapHeaderToKey(h)
        })).filter(m => m.mapped);
        
        console.log("Mapped headers:", mappedHeaders);
        
        // Check for name column specifically
        const nameColIndex = headers.findIndex(h => {
          const key = mapHeaderToKey(h);
          return key === 'name';
        });
        console.log(`'name' column index: ${nameColIndex} (header: "${headers[nameColIndex] || 'NOT FOUND'}")`);
        console.groupEnd();
        
        const parsed = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(delimiter).map(v => v.trim().replace(/^\"|\"$/g, ''));
          if (values.some(v => v)) {
            // Debug first row
            if (i === 1) {
              console.log("📝 First data row values:", values);
              if (nameColIndex !== -1) {
                console.log(`   Name value: "${values[nameColIndex]}"`);
              }
            }
            parsed.push(parseRowData(headers, values, i <= 2));
          }
        }
        
        console.log('✅ CSV parsed rows:', parsed.length);
        
        const { existingRows, newProducts } = detectNewProducts(parsed);
        onImport(existingRows, newProducts);
        
        const matchedCount = existingRows.filter(r => r.medicine_id).length;
        toast.success("CSV Imported", `${matchedCount} matched, ${newProducts.length} new products detected`);
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
      
      console.log('📊 Raw Excel data rows:', data.length);
      
      if (data.length < 2) {
        toast.error("Excel file is empty or has no data rows");
        setIsLoading(false);
        return;
      }

      // Find the header row (row with most non-empty cells)
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
      
      console.group("📋 Excel Header Analysis");
      console.log(`Header row index: ${headerRowIndex}`);
      console.log("Total columns:", headers.length);
      console.log("Headers:", headers);
      
      // Show which headers map to which keys
      const mappedHeaders = headers.map((h, i) => ({
        index: i,
        original: h,
        mapped: mapHeaderToKey(h)
      })).filter(m => m.mapped);
      
      console.log("Mapped headers:", mappedHeaders);
      
      // Check for name column specifically
      const nameColIndex = headers.findIndex(h => {
        const key = mapHeaderToKey(h);
        return key === 'name';
      });
      console.log(`'name' column index: ${nameColIndex} (header: "${headers[nameColIndex] || 'NOT FOUND'}")`);
      console.groupEnd();
      
      const parsed = [];
      
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const rowData = data[i];
        if (!rowData || rowData.every(cell => 
          cell === null || cell === undefined || String(cell).trim() === ''
        )) continue;
        
        const values = rowData.map(cell => String(cell || '').trim());
        
        // Debug first row
        if (parsed.length === 0) {
          console.log("📝 First data row values:", values);
          if (nameColIndex !== -1) {
            console.log(`   Name value: "${values[nameColIndex]}"`);
          }
        }
        
        const parsedRow = parseRowData(headers, values, parsed.length < 2);
        
        if (parsedRow.name || parsedRow.mfac || parsedRow.hsn || parsedRow.qty || parsedRow.price) {
          parsed.push(parsedRow);
        }
      }

      console.log('✅ Excel parsed rows:', parsed.length);

      const { existingRows, newProducts } = detectNewProducts(parsed);
      onImport(existingRows, newProducts);
      
      const matchedCount = existingRows.filter(r => r.medicine_id).length;
      toast.success("Excel Imported", `${matchedCount} matched, ${newProducts.length} new products detected`);
      
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
          cgstPercent: row.cgstPercent ? Number(row.cgstPercent) : 0,
          sgstPercent: row.sgstPercent ? Number(row.sgstPercent) : 0,
          mrp: row.mrp ? Number(row.mrp) : 0,
          rack: row.rack || '',
          sRate: row.sRate ? Number(row.sRate) : 0,
          sch: row.sch || '',
        };
        
        const excelRow = worksheet.addRow(rowData);
        
        if (index % 2 === 0) {
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

      worksheet.autoFilter = 'A1:S1';
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
    const maxSize = 10 * 1024 * 1024;
    
    console.log(`📁 Importing file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    if (file.size > maxSize) {
      toast.error('File too large', 'Please select a file smaller than 10MB.');
      return;
    }
    
    if (extension === 'csv') {
      handleImportCSV(file);
    } else if (['xlsx', 'xls'].includes(extension)) {
      handleImportExcel(file);
    } else {
      toast.error('Unsupported Format', 'Please use CSV, Excel (.xlsx), or Excel 97-2003 (.xls) files.');
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