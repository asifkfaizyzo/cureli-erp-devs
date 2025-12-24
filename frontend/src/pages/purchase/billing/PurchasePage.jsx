// src/pages/PurchasePage.jsx
import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import PurchaseHeader from "./components/PurchaseHeader";
import PurchaseTable from "./components/PurchaseTable";
import SupplierDetailsCard from "./components/SupplierDetailsCard";
import PurchaseSummaryCard from "./components/PurchaseSummaryCard";
import { toast } from "react-toastify";

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
  const [targetRowCount, setTargetRowCount] = useState(8);
  const [rows, setRows] = useState([]);
  const [productMaster, setProductMaster] = useState([]);

  const [supplier, setSupplier] = useState({
    purchaseId: "123456",
    invoiceNo: "",
    supplierGST: "",
    receivedOn: "",
    address: "",
    amountPaid: "",
    balance: "",
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
     SUMMARY (MATCHES INVOICE)
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

  const handleSave = () => toast.success("Purchase Saved");
  const handleSavePrint = () => {
    handleSave();
    setTimeout(() => window.print(), 500);
  };

  /* --------------------------------
     CSV / EXCEL HEADER MAP
  -------------------------------- */
  const mapHeaderToKey = (h) => {
  const key = h.toLowerCase().trim();

  const map = {
    // MFAC / RACK
    mfac: "mfac",
    rack: "rack",

    // PRODUCT
    description: "name",
    "description of goods": "name",
    product: "name",

    // HSN
    hsn: "hsn",
    "hsn/sac": "hsn",

    // PACK
    pack: "pack",

    // ✅ BATCH (FIX)
    batch: "batch",
    "batch no": "batch",
    "batch no.": "batch",

    // EXPIRY
    exp: "exp",
    expiry: "exp",

    // QTY
    qty: "qty",

    // ✅ SCH (OPTIONAL)
    sch: "sch",

    // PRICE
    mrp: "mrp",
    price: "price",

    // SCHEME
    "sch %": "schemePercent",
    "scheme %": "schemePercent",

    // DISCOUNT
    "disc %": "discountPercent",
    "discount %": "discountPercent",

    // GST
    "cgst %": "cgstPercent",
    "sgst %": "sgstPercent",
  };

  return map[key] || null;
};


  const parseRowData = (headers, values) => {
  const row = makeEmptyPurchaseRow();

  headers.forEach((h, i) => {
    const key = mapHeaderToKey(h);
    if (key) row[key] = String(values[i] ?? "").trim();
  });

  // ✅ DEFAULT SCH
  if (!row.sch) row.sch = "0";

  return calculateRow(row);
};


  /* --------------------------------
     CSV IMPORT
  -------------------------------- */
  const handleImportCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const headers = lines[0].split(",");
      const parsed = [];
      const master = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseRowData(headers, lines[i].split(","));
        parsed.push(row);

        if (row.name) {
          master.push({
            id: i,
            name: row.name,
            hsn: row.hsn,
            pack: row.pack,
            rack: row.rack,
            cgstPercent: row.cgstPercent,
            sgstPercent: row.sgstPercent,
          });
        }
      }

      while (parsed.length < targetRowCount)
        parsed.push(makeEmptyPurchaseRow());

      setRows(parsed);
      setProductMaster((p) => [...p, ...master]);
      toast.success("CSV imported");
    };
    reader.readAsText(file);
  };

  /* --------------------------------
     EXCEL IMPORT
  -------------------------------- */
  const handleImportExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(new Uint8Array(e.target.result), {
        type: "array",
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      const headers = data[0];
      const parsed = [];
      const master = [];

      for (let i = 1; i < data.length; i++) {
        const row = parseRowData(headers, data[i]);
        parsed.push(row);

        if (row.name) {
          master.push({
            id: i,
            name: row.name,
            hsn: row.hsn,
            pack: row.pack,
            rack: row.rack,
            cgstPercent: row.cgstPercent,
            sgstPercent: row.sgstPercent,
          });
        }
      }

      while (parsed.length < targetRowCount)
        parsed.push(makeEmptyPurchaseRow());

      setRows(parsed);
      setProductMaster((p) => [...p, ...master]);
      toast.success("Excel imported");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportFile = (file) => {
    if (file.name.endsWith(".csv")) handleImportCSV(file);
    else handleImportExcel(file);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50 p-1 gap-1">
      <PurchaseHeader
        onSave={handleSave}
        onSavePrint={handleSavePrint}
        onImportFile={handleImportFile}
      />

      <div className="flex-1 overflow-hidden bg-white rounded-lg  shadow-sm">
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
    </div>
  );
};

export default PurchasePage;
