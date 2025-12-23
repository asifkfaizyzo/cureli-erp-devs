// src/pages/PurchasePage.jsx
import { useState, useMemo, useEffect } from "react";
import PurchaseHeader from "./components/PurchaseHeader";
import PurchaseTable from "./components/PurchaseTable";
import SupplierDetailsCard from "./components/SupplierDetailsCard";
import PurchaseSummaryCard from "./components/PurchaseSummaryCard";
import { toast } from 'react-toastify';

const makeEmptyPurchaseRow = () => ({
  name: "", batch: "", rate: 0, qty: "", pack: "", exp: "", type: "", category: "", rack: "", tax: 0, disc: 0, mrp: 0, free: "",
});

// Dummy Master Data
const PRODUCT_MASTER_DATA = [
  { id: 1, name: "Paracetamol 500mg", type: "Tablet", category: "Pain Relief" },
  { id: 2, name: "Amoxicillin 250mg", type: "Capsule", category: "Antibiotic" },
  { id: 3, name: "Omeprazole 20mg", type: "Capsule", category: "Gastric" },
  { id: 4, name: "Metformin 500mg", type: "Tablet", category: "Diabetes" },
  { id: 5, name: "Atorvastatin 10mg", type: "Tablet", category: "Cholesterol" },
];

const PurchasePage = () => {
  const [targetRowCount, setTargetRowCount] = useState(8);
  const [rows, setRows] = useState([]);

  const [supplier, setSupplier] = useState({
    purchaseId: "123456", invoiceNo: "", supplierGST: "", receivedOn: "", address: "", amountPaid: "", balance: "",
  });

  const productMaster = useMemo(() => PRODUCT_MASTER_DATA, []);

  // 1. RESPONSIVE LOGIC
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      let count = 6;

      if (width >= 2560) count = 18;
      else if (width >= 1920) count = 16;
      else if (width >= 1440) count = 10;
      else if (width >= 1366) count = 6;
      else count = 6;

      setTargetRowCount(count);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  // 2. Sync Rows with Target Count
  useEffect(() => {
    setRows((prev) => {
      if (prev.length < targetRowCount) {
        const needed = targetRowCount - prev.length;
        return [...prev, ...Array.from({ length: needed }).map(makeEmptyPurchaseRow)];
      }
      return prev.length > 0 ? prev : Array.from({ length: targetRowCount }).map(makeEmptyPurchaseRow);
    });
  }, [targetRowCount]);

  const summary = useMemo(() => {
    const subTotal = rows.reduce((sum, r) => sum + (Number(r.mrp) || 0), 0);
    const sgst = +(subTotal * 0.05).toFixed(2);
    const cgst = +(subTotal * 0.05).toFixed(2);
    return { subTotal: +subTotal.toFixed(2), sgst, cgst, total: +(subTotal + sgst + cgst).toFixed(2) };
  }, [rows]);

  const handleSave = () => {
    toast.success("Purchase Saved Successfully!", {
      position: "top-right",
      autoClose: 3000,
    });
  };

  const handleSavePrint = () => {
    handleSave();
    setTimeout(() => window.print(), 500);
  };

  // CSV Import Handler
  const handleImportCSV = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error("CSV file is empty or invalid!");
          return;
        }

        // Parse header
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        
        // Parse data rows
        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim());
          const row = makeEmptyPurchaseRow();
          
          headers.forEach((header, index) => {
            const value = values[index] || "";
            
            // Map CSV headers to row keys
            switch(header) {
              case "name":
              case "product name":
                row.name = value;
                break;
              case "batch":
                row.batch = value;
                break;
              case "rate":
                row.rate = value;
                break;
              case "qty":
              case "quantity":
                row.qty = value;
                break;
              case "pack":
                row.pack = value;
                break;
              case "exp":
              case "expiry":
                row.exp = value;
                break;
              case "type":
                row.type = value;
                break;
              case "category":
                row.category = value;
                break;
              case "rack":
                row.rack = value;
                break;
              case "tax":
              case "tax%":
                row.tax = value;
                break;
              case "packrate":
              case "pack rate":
                row.packRate = value;
                break;
              case "disc":
              case "disc%":
              case "discount":
                row.disc = value;
                break;
              case "mrp":
                row.mrp = value;
                break;
              case "free":
                row.free = value;
                break;
            }
          });
          
          parsedRows.push(row);
        }

        // Fill remaining rows
        while (parsedRows.length < targetRowCount) {
          parsedRows.push(makeEmptyPurchaseRow());
        }

        setRows(parsedRows);
        toast.success(`Successfully imported ${lines.length - 1} items from CSV!`, {
          autoClose: 4000,
        });
        
      } catch (err) {
        console.error("CSV parsing error:", err);
        toast.error("Error parsing CSV file. Please check the format.");
      }
    };

    reader.onerror = () => {
      toast.error("Error reading file!");
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1 gap-1 font-sans">

      {/* HEADER */}
      <div className="shrink-0">
        <PurchaseHeader 
          onSave={handleSave} 
          onSavePrint={handleSavePrint}
          onImportCSV={handleImportCSV}
        />
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm min-h-0 relative">
        <div className="flex-1 overflow-y-auto">
          <PurchaseTable 
            rows={rows} 
            setRows={setRows} 
            productMaster={productMaster} 
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="shrink-0 flex gap-2 h-[170px] 2xl:h-[200px]">
        <SupplierDetailsCard supplier={supplier} setSupplier={setSupplier} />
        <PurchaseSummaryCard summary={summary} />
      </div>

    </div>
  );
};

export default PurchasePage;
