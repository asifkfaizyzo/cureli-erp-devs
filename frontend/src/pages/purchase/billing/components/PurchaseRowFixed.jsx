
// src/pages/purchase/billing/components/PurchaseRowFixed.jsx
import { memo, useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Search, X } from "lucide-react";

const FIELD_ORDER = [
  "name", "hsn", "batch", "mfac", "rack", "exp", "pack", 
  "qty", "price", "discountPercent", "schemePercent", "sRate", 
  "mrp", "sch"
];

const PurchaseRowFixed = memo(forwardRef(({
  index,
  item,
  onChange,
  onProductSelect,
  productMaster = [],
  rowNumber = 1,
  isEven = false,
  isLast = false,
  onRemoveRow,
  rowsLength,
  onNavigateToNextRow,
  onNavigateToPrevRow,
  onCreateNewRow,
  rowHeight = 40,
}, ref) => {
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const rowRef = useRef(null);
  const fieldRefs = useRef({});

  const filteredProducts = productMaster.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.hsn?.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 8);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    focusFirstField: () => {
      const firstField = fieldRefs.current[FIELD_ORDER[0]];
      if (firstField) {
        firstField.focus();
        firstField.select?.();
      }
    },
    focusLastField: () => {
      const lastField = fieldRefs.current[FIELD_ORDER[FIELD_ORDER.length - 1]];
      if (lastField) {
        lastField.focus();
        lastField.select?.();
      }
    },
    focusField: (fieldKey) => {
      const field = fieldRefs.current[fieldKey];
      if (field) {
        field.focus();
        field.select?.();
      }
    },
    scrollIntoView: () => {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }), []);

  const registerFieldRef = useCallback((fieldKey, inputRef) => {
    if (inputRef) {
      fieldRefs.current[fieldKey] = inputRef;
    }
  }, []);

  const getCurrentFieldIndex = useCallback(() => {
    const activeElement = document.activeElement;
    for (let i = 0; i < FIELD_ORDER.length; i++) {
      if (fieldRefs.current[FIELD_ORDER[i]] === activeElement) {
        return i;
      }
    }
    return -1;
  }, []);

  const focusNextFieldInRow = useCallback(() => {
    const currentIndex = getCurrentFieldIndex();
    if (currentIndex === -1) return false;
    
    const nextIndex = currentIndex + 1;
    if (nextIndex >= FIELD_ORDER.length) {
      return false;
    }
    
    const nextField = fieldRefs.current[FIELD_ORDER[nextIndex]];
    if (nextField) {
      nextField.focus();
      nextField.select?.();
      return true;
    }
    return false;
  }, [getCurrentFieldIndex]);

  const focusPrevFieldInRow = useCallback(() => {
    const currentIndex = getCurrentFieldIndex();
    if (currentIndex === -1) return false;
    
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      return false;
    }
    
    const prevField = fieldRefs.current[FIELD_ORDER[prevIndex]];
    if (prevField) {
      prevField.focus();
      prevField.select?.();
      return true;
    }
    return false;
  }, [getCurrentFieldIndex]);

  const handleKeyDown = useCallback((e, fieldKey) => {
    if (e.key === "Escape") {
      setShowProductDropdown(false);
      return;
    }

    if (showProductDropdown && filteredProducts.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
        return;
      }
      if (e.key === "Enter" && fieldKey === "name") {
        e.preventDefault();
        if (filteredProducts[highlightedIndex]) {
          onProductSelect(index, filteredProducts[highlightedIndex]);
          setShowProductDropdown(false);
          setTimeout(() => {
            const nextField = fieldRefs.current["hsn"];
            if (nextField) {
              nextField.focus();
              nextField.select?.();
            }
          }, 50);
        }
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const movedWithinRow = focusNextFieldInRow();
      if (!movedWithinRow) {
        if (isLast) {
          onCreateNewRow?.();
        } else {
          onNavigateToNextRow?.(index);
        }
      }
      return;
    }

    if (e.key === "Tab") {
      if (e.shiftKey) {
        e.preventDefault();
        const movedWithinRow = focusPrevFieldInRow();
        if (!movedWithinRow && index > 0) {
          onNavigateToPrevRow?.(index);
        }
      } else {
        e.preventDefault();
        const movedWithinRow = focusNextFieldInRow();
        if (!movedWithinRow) {
          if (isLast) {
            onCreateNewRow?.();
          } else {
            onNavigateToNextRow?.(index);
          }
        }
      }
      return;
    }

    if (e.ctrlKey && e.key === "Backspace" && onRemoveRow) {
      e.preventDefault();
      onRemoveRow(index);
      return;
    }

    if (e.key === "ArrowUp" && e.altKey) {
      e.preventDefault();
      if (index > 0) {
        onNavigateToPrevRow?.(index, fieldKey);
      }
      return;
    }

    if (e.key === "ArrowDown" && e.altKey) {
      e.preventDefault();
      if (!isLast) {
        onNavigateToNextRow?.(index, fieldKey);
      }
      return;
    }
  }, [
    showProductDropdown, filteredProducts, highlightedIndex, index, isLast, 
    focusNextFieldInRow, focusPrevFieldInRow, onNavigateToNextRow, onNavigateToPrevRow, 
    onCreateNewRow, onRemoveRow, onProductSelect
  ]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [productSearch]);

  const formatNumber = (value, decimals = 2) => {
    return Number(value || 0).toFixed(decimals);
  };

  const handleChange = useCallback((key, value) => {
    onChange(index, key, value);
  }, [index, onChange]);

  // ✅ Compact input styles - NO OVERFLOW
  const inputBase = `
    w-full h-full bg-transparent border-0 outline-none
    text-slate-800 text-[10px] 2xl:text-[11px]
    focus:bg-indigo-50 focus:ring-1 focus:ring-inset focus:ring-indigo-400
    transition-all duration-100
    placeholder:text-slate-300
    truncate
  `;
  
  const cellBase = "border-b border-r border-slate-200 last:border-r-0 p-0 overflow-hidden";
  const hasData = item.name || item.qty || item.price;

  return (
    <tr 
      ref={rowRef}
      style={{ height: `${rowHeight}px` }}
      className={`
        group transition-all duration-100
        ${isEven ? 'bg-white' : 'bg-slate-50/50'}
        hover:bg-indigo-50/40 
        focus-within:bg-indigo-50/60
        ${hasData ? 'border-l-2 border-l-indigo-400' : 'border-l-2 border-l-transparent'}
      `}
    >
      {/* 1. ROW NUMBER - 3% */}
      <td className={`${cellBase} w-[3%] text-center`}>
        <div className="flex items-center justify-center h-full">
          <span className={`
            inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold
            ${hasData ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}
          `}>
            {rowNumber}
          </span>
        </div>
      </td>

      {/* 2. ITEM DESCRIPTION - 18% */}
      <td className={`${cellBase} w-[18%] relative`} ref={dropdownRef}>
        <div className="relative h-full">
          <input
            ref={el => registerFieldRef("name", el)}
            type="text"
            value={showProductDropdown ? productSearch : (item.name || "")}
            onChange={(e) => {
              const value = e.target.value;
              setProductSearch(value);
              setShowProductDropdown(true);
              handleChange("name", value);
            }}
            onFocus={() => {
              setProductSearch(item.name || "");
              if (productMaster.length > 0) setShowProductDropdown(true);
            }}
            onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
            onKeyDown={(e) => handleKeyDown(e, "name")}
            className={`${inputBase} px-2 py-1.5 font-medium text-left`}
            placeholder="Search..."
          />
          
          {item.name && (
            <button
              onClick={() => {
                handleChange("name", "");
                setProductSearch("");
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full"
            >
              <X size={10} className="text-slate-400" />
            </button>
          )}

          {showProductDropdown && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl max-h-44 overflow-auto w-64 mt-0.5">
              {filteredProducts.map((product, idx) => (
                <div
                  key={product.id || idx}
                  onClick={() => {
                    onProductSelect(index, product);
                    setShowProductDropdown(false);
                  }}
                  className={`
                    px-2 py-1.5 cursor-pointer text-[10px] border-b border-slate-100 last:border-b-0 
                    ${idx === highlightedIndex ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}
                  `}
                >
                  <div className="font-medium text-slate-800 truncate">{product.name}</div>
                  <div className="text-[9px] text-slate-400">HSN: {product.hsn || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </td>

      {/* 3. HSN - 6% */}
      <td className={`${cellBase} w-[6%]`}>
        <input ref={el => registerFieldRef("hsn", el)} type="text" value={item.hsn || ""} 
          onChange={(e) => handleChange("hsn", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "hsn")}
          className={`${inputBase} px-1 py-1.5 text-center font-mono text-[9px]`} 
          placeholder="HSN"/>
      </td>

      {/* 4. Batch - 6% */}
      <td className={`${cellBase} w-[6%]`}>
        <input ref={el => registerFieldRef("batch", el)} type="text" value={item.batch || ""} 
          onChange={(e) => handleChange("batch", e.target.value.toUpperCase())}
          onKeyDown={(e) => handleKeyDown(e, "batch")}
          className={`${inputBase} px-1 py-1.5 text-center font-mono text-[9px]`} 
          placeholder="Batch"/>
      </td>

      {/* 5. Company - 8% */}
      <td className={`${cellBase} w-[8%]`}>
        <input ref={el => registerFieldRef("mfac", el)} type="text" value={item.mfac || ""} 
          onChange={(e) => handleChange("mfac", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "mfac")}
          className={`${inputBase} px-1 py-1.5 text-left`} 
          placeholder="Company"/>
      </td>

      {/* 6. Rack - 4% */}
      <td className={`${cellBase} w-[4%]`}>
        <input ref={el => registerFieldRef("rack", el)} type="text" value={item.rack || ""} 
          onChange={(e) => handleChange("rack", e.target.value.toUpperCase())}
          onKeyDown={(e) => handleKeyDown(e, "rack")}
          className={`${inputBase} px-1 py-1.5 text-center`} 
          placeholder="Rack"/>
      </td>

      {/* 7. Expiry - 5% */}
      <td className={`${cellBase} w-[5%]`}>
        <input ref={el => registerFieldRef("exp", el)} type="text" value={item.exp || ""} 
          onChange={(e) => handleChange("exp", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "exp")}
          className={`${inputBase} px-1 py-1.5 text-center font-mono text-[9px]`} 
          placeholder="MM/YY"/>
      </td>

      {/* 8. Pack - 4% */}
      <td className={`${cellBase} w-[4%]`}>
        <input ref={el => registerFieldRef("pack", el)} type="text" value={item.pack || ""} 
          onChange={(e) => handleChange("pack", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "pack")}
          className={`${inputBase} px-1 py-1.5 text-center`} 
          placeholder="Pack"/>
      </td>

      {/* 9. Quantity - 5% */}
      <td className={`${cellBase} w-[5%] bg-amber-50/50`}>
        <input ref={el => registerFieldRef("qty", el)} type="number" value={item.qty || ""} 
          onChange={(e) => handleChange("qty", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "qty")}
          className={`${inputBase} px-1 py-1.5 text-center font-bold text-amber-700`} 
          placeholder="0" min="0"/>
      </td>

      {/* 10. Rate - 6% */}
      <td className={`${cellBase} w-[6%] bg-blue-50/50`}>
        <input ref={el => registerFieldRef("price", el)} type="number" value={item.price || ""} 
          onChange={(e) => handleChange("price", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "price")}
          className={`${inputBase} px-1 py-1.5 text-right font-bold text-blue-700`} 
          placeholder="0.00" min="0" step="0.01"/>
      </td>

      {/* 11. Discount % - 5% */}
      <td className={`${cellBase} w-[5%]`}>
        <input ref={el => registerFieldRef("discountPercent", el)} type="number" value={item.discountPercent || ""} 
          onChange={(e) => handleChange("discountPercent", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "discountPercent")}
          className={`${inputBase} px-1 py-1.5 text-center text-indigo-600 font-semibold`} 
          placeholder="0" min="0" max="100"/>
      </td>

      {/* 12. Scheme % - 5% */}
      <td className={`${cellBase} w-[5%]`}>
        <input ref={el => registerFieldRef("schemePercent", el)} type="number" value={item.schemePercent || ""} 
          onChange={(e) => handleChange("schemePercent", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "schemePercent")}
          className={`${inputBase} px-1 py-1.5 text-center text-teal-600 font-semibold`} 
          placeholder="0" min="0" max="100"/>
      </td>

      {/* 13. S-Rate - 6% */}
      <td className={`${cellBase} w-[6%] bg-purple-50/50`}>
        <input ref={el => registerFieldRef("sRate", el)} type="number" value={item.sRate || ""} 
          onChange={(e) => handleChange("sRate", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "sRate")}
          className={`${inputBase} px-1 py-1.5 text-right font-bold text-purple-700`} 
          placeholder="0.00" min="0" step="0.01"/>
      </td>

      {/* 14. Amount - 8% */}
      <td className={`${cellBase} w-[8%] bg-emerald-50/50`}>
        <div className="px-1 py-1.5 text-right">
          <span className={`font-bold text-[11px] ${Number(item.amount) > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
            {Number(item.amount) > 0 ? formatNumber(item.amount) : '0.00'}
          </span>
        </div>
      </td>

      {/* 15. MRP - 5% */}
      <td className={`${cellBase} w-[5%]`}>
        <input ref={el => registerFieldRef("mrp", el)} type="number" value={item.mrp || ""} 
          onChange={(e) => handleChange("mrp", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "mrp")}
          className={`${inputBase} px-1 py-1.5 text-right text-slate-600`} 
          placeholder="0" min="0"/>
      </td>

      {/* 16. Free - 4% */}
      <td className={`${cellBase} w-[4%]`}>
        <input ref={el => registerFieldRef("sch", el)} type="text" value={item.sch || ""} 
          onChange={(e) => handleChange("sch", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "sch")}
          className={`${inputBase} px-1 py-1.5 text-center font-semibold text-emerald-600`} 
          placeholder="0"/>
      </td>
    </tr>
  );
}));

PurchaseRowFixed.displayName = 'PurchaseRowFixed';
export default PurchaseRowFixed;