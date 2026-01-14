// src/pages/purchase/billing/components/PurchaseRowFixed.jsx
import { memo, useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { X, Plus, AlertCircle } from "lucide-react";

const FIELD_ORDER = [
  "name", "mfac", "batch", "hsn", "exp", "pack", "pQty", "qty", 
  "price", "discountPercent", "netRate", "sgstPercent", "mrp", "rack", "sRate", "sch"
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
  rowHeight = 36,
  onAddNewProduct, // ✅ NEW: Handler for adding new products
}, ref) => {
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const rowRef = useRef(null);
  const fieldRefs = useRef({});

  const filteredProducts = productMaster.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.hsn?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.manufacturer?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.mfac?.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 8);

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

  // ✅ NEW: Check if product exists in master
  const checkProductExists = useCallback((productName) => {
    if (!productName || productName.trim().length < 2) return true;
    
    const exists = productMaster.some(product => 
      product.name.toLowerCase() === productName.toLowerCase() ||
      product.name.toLowerCase().includes(productName.toLowerCase()) ||
      productName.toLowerCase().includes(product.name.toLowerCase())
    );
    
    return exists;
  }, [productMaster]);

  // ✅ NEW: Handle new product detection
  const handleProductNameBlur = useCallback((productName) => {
    if (!productName || productName.trim().length < 2) return;
    
    const exists = checkProductExists(productName);
    
    if (!exists && onAddNewProduct) {
      // Open modal for new product
      onAddNewProduct({
        rowIndex: index,
        productName: productName.trim(),
        manufacturer: item.mfac || '',
        hsn: item.hsn || '',
        rack: item.rack || '',
      });
    }
  }, [checkProductExists, onAddNewProduct, index, item.mfac, item.hsn, item.rack]);

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
            const nextField = fieldRefs.current["mfac"];
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
      
      // ✅ NEW: Check for new product if on name field
      if (fieldKey === "name" && item.name && !showProductDropdown) {
        handleProductNameBlur(item.name);
      }
      
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
    onCreateNewRow, onRemoveRow, onProductSelect, handleProductNameBlur, item.name
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

  const inputBase = `
    w-full h-full bg-transparent border-0 outline-none
    text-slate-800 text-[9px] 2xl:text-[10px]
    focus:bg-indigo-50 focus:ring-1 focus:ring-inset focus:ring-indigo-400
    transition-all duration-100
    placeholder:text-slate-300
    truncate
  `;
  
  const cellBase = "border-b border-r border-slate-200 last:border-r-0 p-0 overflow-hidden";
  const hasData = item.name || item.qty || item.price;
  const isNewProduct = item.name && !checkProductExists(item.name);

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
        ${isNewProduct ? 'bg-yellow-50/30' : ''}
      `}
    >
      {/* 1. ROW NUMBER */}
      <td className={`${cellBase} text-center bg-slate-50`}>
        <div className="flex items-center justify-center h-full relative">
          <span className={`
            inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold
            ${hasData ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}
          `}>
            {rowNumber}
          </span>
          {/* ✅ NEW: New product indicator */}
          {isNewProduct && (
            <div className="absolute -top-0.5 -right-0.5">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="New product"></div>
            </div>
          )}
        </div>
      </td>

      {/* 2. ITEM DESCRIPTION - ✅ ENHANCED */}
      <td className={`${cellBase} relative ${isNewProduct ? 'bg-yellow-50/50' : 'bg-blue-50/30'}`} ref={dropdownRef}>
        <div className="relative h-full">
          <input
            ref={el => registerFieldRef("name", el)}
            type="text"
            value={showProductDropdown ? productSearch : (item.name || "")}
            onChange={(e) => {
              const value = e.target.value;
              setProductSearch(value);
              setShowProductDropdown(value.length > 0);
              handleChange("name", value);
            }}
            onFocus={() => {
              setProductSearch(item.name || "");
              if (productMaster.length > 0 && (item.name || "").length > 0) {
                setShowProductDropdown(true);
              }
            }}
            onBlur={(e) => {
              setTimeout(() => {
                setShowProductDropdown(false);
                // ✅ NEW: Check for new product on blur
                if (e.target.value && e.target.value.trim().length >= 2) {
                  handleProductNameBlur(e.target.value);
                }
              }, 150);
            }}
            onKeyDown={(e) => handleKeyDown(e, "name")}
            className={`${inputBase} px-1.5 py-1 font-medium text-left ${
              isNewProduct ? 'bg-yellow-50 text-yellow-900 font-semibold' : ''
            }`}
            placeholder="Search item..."
          />
          
          {/* ✅ NEW: Enhanced indicators */}
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {isNewProduct && (
              <div className="flex items-center">
                <AlertCircle size={10} className="text-yellow-600" title="New product - click Enter to add to master" />
              </div>
            )}
            {item.name && checkProductExists(item.name) && (
              <button
                onClick={() => {
                  handleChange("name", "");
                  setProductSearch("");
                }}
                className="p-0.5 hover:bg-slate-200 rounded-full"
              >
                <X size={8} className="text-slate-400" />
              </button>
            )}
          </div>

          {/* ✅ ENHANCED: Product dropdown with add option */}
          {showProductDropdown && (
            <div className="absolute top-full left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-auto w-72 mt-0.5">
              {filteredProducts.length > 0 ? (
                <>
                  {filteredProducts.map((product, idx) => (
                    <div
                      key={product.id || idx}
                      onClick={() => {
                        onProductSelect(index, product);
                        setShowProductDropdown(false);
                      }}
                      className={`
                        px-3 py-2 cursor-pointer text-[9px] border-b border-slate-100 last:border-b-0 
                        ${idx === highlightedIndex ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}
                      `}
                    >
                      <div className="font-medium text-slate-800 truncate">{product.name}</div>
                      <div className="text-[8px] text-slate-400 flex gap-2 mt-0.5">
                        <span>HSN: {product.hsnCode || product.hsn || '-'}</span>
                        <span>•</span>
                        <span>{product.manufacturer || product.mfac || '-'}</span>
                        {product.rackNo && (
                          <>
                            <span>•</span>
                            <span>Rack: {product.rackNo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {productSearch.trim().length >= 2 && !checkProductExists(productSearch) && (
                    <div
                      onClick={() => {
                        setShowProductDropdown(false);
                        handleProductNameBlur(productSearch);
                      }}
                      className="px-3 py-2 cursor-pointer text-[9px] hover:bg-yellow-50 border-l-2 border-l-yellow-500 bg-yellow-25 border-t border-yellow-200"
                    >
                      <div className="font-medium text-yellow-700 flex items-center gap-1">
                        <Plus size={10} />
                        Add "{productSearch}" as new product
                      </div>
                      <div className="text-[8px] text-yellow-600 mt-0.5">Click to add to product master</div>
                    </div>
                  )}
                </>
              ) : productSearch.trim().length >= 2 ? (
                <div
                  onClick={() => {
                    setShowProductDropdown(false);
                    handleProductNameBlur(productSearch);
                  }}
                  className="px-3 py-3 cursor-pointer text-[9px] hover:bg-blue-50 border-l-2 border-l-blue-500 bg-blue-25"
                >
                  <div className="font-medium text-blue-600 flex items-center gap-1.5">
                    <Plus size={12} />
                    Add "{productSearch}" as new product
                  </div>
                  <div className="text-[8px] text-blue-400 mt-1">This product will be added to the master list</div>
                </div>
              ) : (
                <div className="px-3 py-3 text-[8px] text-slate-400 text-center">
                  Type at least 2 characters to search products...
                </div>
              )}
            </div>
          )}
        </div>
      </td>

      {/* 3. MFAC */}
      <td className={`${cellBase} bg-violet-50/20`}>
        <input 
          ref={el => registerFieldRef("mfac", el)} 
          type="text" 
          value={item.mfac || ""} 
          onChange={(e) => handleChange("mfac", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "mfac")}
          className={`${inputBase} px-1 py-1 text-left`} 
          placeholder="Mfac"
        />
      </td>

      {/* 4. BATCH */}
      <td className={`${cellBase} bg-violet-50/20`}>
        <input 
          ref={el => registerFieldRef("batch", el)} 
          type="text" 
          value={item.batch || ""} 
          onChange={(e) => handleChange("batch", e.target.value.toUpperCase())}
          onKeyDown={(e) => handleKeyDown(e, "batch")}
          className={`${inputBase} px-1 py-1 text-center font-mono text-[8px]`} 
          placeholder="Batch"
        />
      </td>

      {/* 5. HSN */}
      <td className={`${cellBase} bg-cyan-50/30`}>
        <input 
          ref={el => registerFieldRef("hsn", el)} 
          type="text" 
          value={item.hsn || ""} 
          onChange={(e) => handleChange("hsn", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "hsn")}
          className={`${inputBase} px-1 py-1 text-center font-mono text-[8px]`} 
          placeholder="HSN"
        />
      </td>

      {/* 6. EXPIRY */}
      <td className={`${cellBase} bg-cyan-50/30`}>
        <input 
          ref={el => registerFieldRef("exp", el)} 
          type="text" 
          value={item.exp || ""} 
          onChange={(e) => handleChange("exp", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "exp")}
          className={`${inputBase} px-1 py-1 text-center font-mono text-[8px]`} 
          placeholder="MM/YY"
        />
      </td>

      {/* 7. PACK */}
      <td className={`${cellBase}`}>
        <input 
          ref={el => registerFieldRef("pack", el)} 
          type="text" 
          value={item.pack || ""} 
          onChange={(e) => handleChange("pack", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "pack")}
          className={`${inputBase} px-1 py-1 text-center`} 
          placeholder="Pk"
        />
      </td>

      {/* 8. P.QTY */}
      <td className={`${cellBase} bg-slate-100/50`}>
        <input 
          ref={el => registerFieldRef("pQty", el)} 
          type="number" 
          value={item.pQty || ""} 
          onChange={(e) => handleChange("pQty", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "pQty")}
          className={`${inputBase} px-1 py-1 text-center text-slate-500`} 
          placeholder="0" 
          min="0"
        />
      </td>

      {/* 9. QTY */}
      <td className={`${cellBase} bg-amber-50/60`}>
        <input 
          ref={el => registerFieldRef("qty", el)} 
          type="number" 
          value={item.qty || ""} 
          onChange={(e) => handleChange("qty", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "qty")}
          className={`${inputBase} px-1 py-1 text-center font-bold text-amber-700`} 
          placeholder="0" 
          min="0"
        />
      </td>

      {/* 10. RATE */}
      <td className={`${cellBase} bg-blue-50/50`}>
        <input 
          ref={el => registerFieldRef("price", el)} 
          type="number" 
          value={item.price || ""} 
          onChange={(e) => handleChange("price", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "price")}
          className={`${inputBase} px-1 py-1 text-right font-semibold text-blue-700`} 
          placeholder="0.00" 
          min="0" 
          step="0.01"
        />
      </td>

      {/* 11. DIS% */}
      <td className={`${cellBase} bg-rose-50/40`}>
        <input 
          ref={el => registerFieldRef("discountPercent", el)} 
          type="number" 
          value={item.discountPercent || ""} 
          onChange={(e) => handleChange("discountPercent", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "discountPercent")}
          className={`${inputBase} px-1 py-1 text-center text-rose-600 font-semibold`} 
          placeholder="0" 
          min="0" 
          max="100"
        />
      </td>

      {/* 12. NET RATE */}
      <td className={`${cellBase} bg-teal-50/50`}>
        <input 
          ref={el => registerFieldRef("netRate", el)} 
          type="number" 
          value={item.netRate || ""} 
          onChange={(e) => handleChange("netRate", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "netRate")}
          className={`${inputBase} px-1 py-1 text-right font-semibold text-teal-700`} 
          placeholder="0.00" 
          min="0" 
          step="0.01"
        />
      </td>

      {/* 13. AMOUNT */}
      <td className={`${cellBase} bg-emerald-50/60`}>
        <div className="px-1 py-1 text-right h-full flex items-center justify-end">
          <span className={`font-bold text-[10px] ${Number(item.amount) > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
            {Number(item.amount) > 0 ? formatNumber(item.amount) : '0.00'}
          </span>
        </div>
      </td>

      {/* 14. SGST% */}
      <td className={`${cellBase} bg-orange-50/40`}>
        <input 
          ref={el => registerFieldRef("sgstPercent", el)} 
          type="number" 
          value={item.sgstPercent || ""} 
          onChange={(e) => handleChange("sgstPercent", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "sgstPercent")}
          className={`${inputBase} px-1 py-1 text-center text-orange-600 font-medium`} 
          placeholder="0" 
          min="0" 
          max="100"
        />
      </td>

      {/* 15. MRP */}
      <td className={`${cellBase}`}>
        <input 
          ref={el => registerFieldRef("mrp", el)} 
          type="number" 
          value={item.mrp || ""} 
          onChange={(e) => handleChange("mrp", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "mrp")}
          className={`${inputBase} px-1 py-1 text-right text-slate-600`} 
          placeholder="0" 
          min="0"
        />
      </td>

      {/* 16. RACK */}
      <td className={`${cellBase} bg-slate-50`}>
        <input 
          ref={el => registerFieldRef("rack", el)} 
          type="text" 
          value={item.rack || ""} 
          onChange={(e) => handleChange("rack", e.target.value.toUpperCase())}
          onKeyDown={(e) => handleKeyDown(e, "rack")}
          className={`${inputBase} px-1 py-1 text-center font-mono`} 
          placeholder="Rk"
        />
      </td>

      {/* 17. S-RATE */}
      <td className={`${cellBase} bg-purple-50/50`}>
        <input 
          ref={el => registerFieldRef("sRate", el)} 
          type="number" 
          value={item.sRate || ""} 
          onChange={(e) => handleChange("sRate", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "sRate")}
          className={`${inputBase} px-1 py-1 text-right font-bold text-purple-700`} 
          placeholder="0.00" 
          min="0" 
          step="0.01"
        />
      </td>

      {/* 18. FREE */}
      <td className={`${cellBase} bg-green-50/50`}>
        <input 
          ref={el => registerFieldRef("sch", el)} 
          type="text" 
          value={item.sch || ""} 
          onChange={(e) => handleChange("sch", e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, "sch")}
          className={`${inputBase} px-1 py-1 text-center font-bold text-green-600`} 
          placeholder="0"
        />
      </td>
    </tr>
  );
}));

PurchaseRowFixed.displayName = 'PurchaseRowFixed';
export default PurchaseRowFixed;
