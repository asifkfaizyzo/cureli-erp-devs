// src/components/purchase/PurchaseRowFixed.jsx
import { memo, useState, useRef, useEffect } from "react";

const PurchaseRowFixed = memo(({
  index,
  item,
  onChange,
  onProductSelect,
  productMaster = [],
  registerFieldRef,
  focusNextField,
  focusPrevField,
  isEven = false,
  isLast = false,
  rowNumber = 1,
}) => {
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);

  // Filter products based on search
  const filteredProducts = productMaster.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.hsn?.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper for consistent number formatting
  const formatNumber = (value, decimals = 2) => {
    const num = Number(value || 0);
    return num.toFixed(decimals);
  };

  // Handle field change
  const handleChange = (key, value) => {
    onChange(index, key, value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, fieldIndex) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      focusNextField(index, fieldIndex);
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      focusPrevField(index, fieldIndex);
    } else if (e.key === "Enter") {
      e.preventDefault();
      focusNextField(index, fieldIndex);
    }
  };

  // Handle product dropdown keyboard navigation
  const handleProductKeyDown = (e, fieldIndex) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && showProductDropdown && filteredProducts.length > 0) {
      e.preventDefault();
      selectProduct(filteredProducts[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowProductDropdown(false);
    } else if (e.key === "Tab") {
      setShowProductDropdown(false);
      handleKeyDown(e, fieldIndex);
    }
  };

  // Select product from dropdown
  const selectProduct = (product) => {
    onProductSelect(index, product);
    setProductSearch("");
    setShowProductDropdown(false);
    setHighlightedIndex(0);
  };

  // Common input styles
  const inputBase = `
    w-full h-full bg-transparent border-0 outline-none
    text-slate-800 text-[11px] 2xl:text-xs
    focus:bg-indigo-50 focus:ring-1 focus:ring-indigo-400 focus:ring-inset
    transition-colors duration-150
    disabled:text-slate-500 disabled:bg-slate-50
  `;

  const cellBase = "border-b border-r border-slate-200 last:border-r-0";
  const textMuted = "text-slate-500";
  const textPrimary = "text-slate-800";

  return (
    <tr 
      className={`
        group
        transition-colors duration-150
        ${isEven ? 'bg-white' : 'bg-slate-50/50'}
        hover:bg-indigo-50/50
        focus-within:bg-indigo-50/70
        ${isLast ? 'border-b-2 border-slate-300' : ''}
      `}
    >
      {/* ROW NUMBER (#) - Readonly */}
      <td className={`
        ${cellBase} 
        w-[40px] 
        text-center 
        font-bold 
        text-[10px]
        bg-gradient-to-r from-slate-100 to-slate-50
        text-slate-500
        select-none
        sticky left-0 z-10
      `}>
        <div className="flex items-center justify-center h-full py-2">
          <span className={`
            inline-flex items-center justify-center
            w-6 h-6 rounded-full
            ${item.name ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}
            font-semibold text-[10px]
            transition-colors duration-200
          `}>
            {rowNumber}
          </span>
        </div>
      </td>

      {/* MFAC / RACK - Fields 0 & 1 */}
      <td className={`${cellBase} p-0 min-w-[80px]`}>
        <div className="flex flex-col">
          <input
            ref={(el) => registerFieldRef(0, el)}
            type="text"
            value={item.mfac || ""}
            onChange={(e) => handleChange("mfac", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 0)}
            className={`${inputBase} px-2 py-1 font-medium text-center border-b border-slate-100`}
            placeholder="Mfac"
          />
          <input
            ref={(el) => registerFieldRef(1, el)}
            type="text"
            value={item.rack || ""}
            onChange={(e) => handleChange("rack", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 1)}
            className={`${inputBase} px-2 py-1 text-[9px] text-center text-slate-600`}
            placeholder="Rack"
          />
        </div>
      </td>

      {/* DESCRIPTION / HSN - Fields 2 & 3 */}
      <td className={`${cellBase} p-0 min-w-[200px] relative`} ref={dropdownRef}>
        <div className="flex flex-col">
          {/* Product Name Input with Autocomplete */}
          <div className="relative">
            <input
              ref={(el) => registerFieldRef(2, el)}
              type="text"
              value={showProductDropdown ? productSearch : (item.name || "")}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductDropdown(true);
                setHighlightedIndex(0);
                if (!showProductDropdown) {
                  handleChange("name", e.target.value);
                }
              }}
              onFocus={() => {
                setProductSearch(item.name || "");
                setShowProductDropdown(true);
              }}
              onKeyDown={(e) => handleProductKeyDown(e, 2)}
              className={`${inputBase} px-2 py-1 font-semibold border-b border-slate-100`}
              placeholder="Search product..."
            />
            
            {/* Product Dropdown */}
            {showProductDropdown && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 center-0 z-50 bg-white border border-slate-200 rounded-b-lg shadow-lg max-h-48 overflow-auto">
                {filteredProducts.map((product, idx) => (
                  <div
                    key={product.id || idx}
                    onClick={() => selectProduct(product)}
                    className={`
                      px-3 py-2 cursor-pointer text-xs border-b border-slate-100 last:border-b-0
                      ${idx === highlightedIndex ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'}
                    `}
                  >
                    <div className="font-medium text-slate-800">{product.name}</div>
                    <div className="text-[10px] text-slate-500 flex gap-3 mt-0.5">
                      <span>HSN: {product.hsn || '-'}</span>
                      <span>Pack: {product.pack || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* HSN Input */}
          <input
            ref={(el) => registerFieldRef(3, el)}
            type="text"
            value={item.hsn || ""}
            onChange={(e) => handleChange("hsn", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 3)}
            className={`${inputBase} px-2 py-1 text-[9px] text-slate-600 font-mono`}
            placeholder="HSN"
          />
        </div>
      </td>

      {/* PACK - Field 4 */}
      <td className={`${cellBase} p-0`}>
        <input
          ref={(el) => registerFieldRef(4, el)}
          type="text"
          value={item.pack || ""}
          onChange={(e) => handleChange("pack", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 4)}
          className={`${inputBase} px-2 py-2 text-center font-medium`}
          placeholder="-"
        />
      </td>

      {/* BATCH / EXP - Fields 5 & 6 */}
      <td className={`${cellBase} p-0`}>
        <div className="flex flex-col">
          <input
            ref={(el) => registerFieldRef(5, el)}
            type="text"
            value={item.batch || ""}
            onChange={(e) => handleChange("batch", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 5)}
            className={`${inputBase} px-2 py-1 text-center font-medium border-b border-slate-100`}
            placeholder="Batch"
          />
          <input
            ref={(el) => registerFieldRef(6, el)}
            type="text"
            value={item.exp || ""}
            onChange={(e) => handleChange("exp", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 6)}
            className={`${inputBase} px-2 py-1 text-[9px] text-center text-amber-600`}
            placeholder="MM/YY"
          />
        </div>
      </td>

      {/* QTY - Field 7 */}
      <td className={`${cellBase} p-0`}>
        <input
          ref={(el) => registerFieldRef(7, el)}
          type="number"
          min="0"
          value={item.qty || ""}
          onChange={(e) => handleChange("qty", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 7)}
          className={`${inputBase} px-2 py-2 text-center font-semibold text-emerald-700`}
          placeholder="0"
        />
      </td>

      {/* SCH - Field 8 */}
      <td className={`${cellBase} p-0`}>
        <input
          ref={(el) => registerFieldRef(8, el)}
          type="number"
          min="0"
          value={item.sch || ""}
          onChange={(e) => handleChange("sch", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 8)}
          className={`${inputBase} px-2 py-2 text-center`}
          placeholder="0"
        />
      </td>

      {/* MRP - Field 9 */}
      <td className={`${cellBase} p-0`}>
        <input
          ref={(el) => registerFieldRef(9, el)}
          type="number"
          min="0"
          step="0.01"
          value={item.mrp || ""}
          onChange={(e) => handleChange("mrp", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 9)}
          className={`${inputBase} px-2 py-2 text-center font-mono`}
          placeholder="0.00"
        />
      </td>

      {/* PRICE - Field 10 */}
      <td className={`${cellBase} p-0`}>
        <input
          ref={(el) => registerFieldRef(10, el)}
          type="number"
          min="0"
          step="0.01"
          value={item.price || ""}
          onChange={(e) => handleChange("price", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 10)}
          className={`${inputBase} px-2 py-2 text-center font-mono`}
          placeholder="0.00"
        />
      </td>

      {/* SCHEME - Field 11 (schemePercent editable, schemeAmount readonly) */}
      <td className={`${cellBase} p-0`}>
        <div className="flex flex-col">
          <input
            ref={(el) => registerFieldRef(11, el)}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={item.schemePercent || ""}
            onChange={(e) => handleChange("schemePercent", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 11)}
            className={`${inputBase} px-2 py-1 text-center text-[10px] border-b border-slate-100`}
            placeholder="0.00"
          />
          <div className="px-2 py-1 text-center font-mono text-slate-700 bg-slate-50/50 text-[10px]">
            {formatNumber(item.schemeAmount)}
          </div>
        </div>
      </td>

      {/* DISCOUNT - Field 12 (discountPercent editable, discountAmount readonly) */}
      <td className={`${cellBase} p-0`}>
        <div className="flex flex-col">
          <input
            ref={(el) => registerFieldRef(12, el)}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={item.discountPercent || ""}
            onChange={(e) => handleChange("discountPercent", e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 12)}
            className={`${inputBase} px-2 py-1 text-center text-[10px] border-b border-slate-100`}
            placeholder="0.00"
          />
          <div className={`px-2 py-1 text-center font-mono bg-slate-50/50 text-[10px] ${
            Number(item.discountAmount) > 0 ? 'text-rose-600' : 'text-slate-700'
          }`}>
            {formatNumber(item.discountAmount)}
          </div>
        </div>
      </td>

      {/* TAXABLE VALUE - Readonly */}
      <td className={`${cellBase} px-2 py-2 text-center font-mono font-medium ${textPrimary} bg-slate-50/30`}>
        {formatNumber(item.taxableValue)}
      </td>

      {/* CGST % - Readonly */}
      <td className={`${cellBase} px-2 py-2 text-center bg-blue-50/40`}>
        <span className="text-[10px] text-blue-700 font-medium">
          {formatNumber(item.cgstPercent)}%
        </span>
      </td>

      {/* CGST AMT - Readonly */}
      <td className={`${cellBase} px-2 py-2 text-center font-mono ${textPrimary} bg-blue-50/40`}>
        {formatNumber(item.cgstAmount)}
      </td>

      {/* SGST % - Readonly */}
      <td className={`${cellBase} px-2 py-2 text-center bg-emerald-50/40`}>
        <span className="text-[10px] text-emerald-700 font-medium">
          {formatNumber(item.sgstPercent)}%
        </span>
      </td>

      {/* SGST AMT - Readonly */}
      <td className={`${cellBase} px-2 py-2 text-center font-mono ${textPrimary} bg-emerald-50/40`}>
        {formatNumber(item.sgstAmount)}
      </td>

      {/* AMOUNT - Readonly */}
      <td className={`${cellBase} px-2 py-2 text-center border-r-0 bg-gradient-to-r from-indigo-50/50 to-indigo-100/50`}>
        <span className="font-bold text-[#05015A] font-mono text-[12px]">
          ₹{formatNumber(item.amount)}
        </span>
      </td>
    </tr>
  );
});

PurchaseRowFixed.displayName = 'PurchaseRowFixed';

export default PurchaseRowFixed;