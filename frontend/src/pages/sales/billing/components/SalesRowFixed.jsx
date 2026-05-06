// src/pages/sales/billing/components/SalesRowFixed.jsx
// Changes:
// 1. Show batchError text visibly 
// 2. Show stockError text visibly in stock cell
// 3. Fix excessive getAvailableBatches calls with useRef cache
// 4. Fix memo comparison

import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import { Package, AlertTriangle, Info } from "lucide-react";

const FIELD_ORDER = ["name", "batch", "qty", "rate", "discountPercent"];

const SalesRowFixed = memo(
  forwardRef(
    (
      {
        index,
        item,
        onChange,
        onProductSelect,
        onBatchSelect,
        productMaster = [],
        rowNumber = 1,
        isEven = false,
        isLast = false,
        onRemoveRow,
        onNavigateToNextRow,
        onNavigateToPrevRow,
        onCreateNewRow,
        rowHeight = 36,
        getAvailableBatches,
        allRows = [],
      },
      ref,
    ) => {
      const outOfStockCache = useRef(new Set()); // medicine_ids with no stock
      const inStockCache = useRef(new Set());    // medicine_ids with confirmed stock
      const [showProductDropdown, setShowProductDropdown] = useState(false);
      const [showBatchDropdown, setShowBatchDropdown] = useState(false);
      const [productSearch, setProductSearch] = useState("");
      const [highlightedIndex, setHighlightedIndex] = useState(0);
      const [batches, setBatches] = useState(item.availableBatches || []);
      const [batchError, setBatchError] = useState(null);
      const [stockError, setStockError] = useState(null);
      const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
      });

      const dropdownRef = useRef(null);
      const batchDropdownRef = useRef(null);
      const rowRef = useRef(null);
      const fieldRefs = useRef({});
      // ✅ FIX: Cache loaded medicine_id to prevent duplicate API calls
      const loadedMedicineIdRef = useRef(null);

      const filteredProducts = productMaster
        .filter((p) => {
          const searchLower = productSearch.toLowerCase();
          return (
            p.name?.toLowerCase().includes(searchLower) ||
            p.generic_name?.toLowerCase().includes(searchLower) ||
            p.manufacturer?.toLowerCase().includes(searchLower)
          );
        })
        .slice(0, 10);

      useImperativeHandle(
        ref,
        () => ({
          focusFirstField: () => {
            const firstField = fieldRefs.current[FIELD_ORDER[0]];
            if (firstField) {
              firstField.focus();
              firstField.select?.();
            }
          },
          focusLastField: () => {
            const lastField =
              fieldRefs.current[FIELD_ORDER[FIELD_ORDER.length - 1]];
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
        }),
        [],
      );

      const registerFieldRef = useCallback((fieldKey, inputRef) => {
        if (inputRef) {
          fieldRefs.current[fieldKey] = inputRef;
        }
      }, []);

      const calculateUsedStock = useCallback(
        (inventoryId, excludeIndex = null) => {
          return allRows.reduce((total, row, idx) => {
            if (idx !== excludeIndex && row.inventory_id === inventoryId) {
              return total + (parseFloat(row.qty) || 0);
            }
            return total;
          }, 0);
        },
        [allRows],
      );

      const checkDuplicate = useCallback(
        (medicineId, inventoryId) => {
          return allRows.findIndex(
            (row, idx) =>
              idx !== index &&
              row.medicine_id === medicineId &&
              row.inventory_id === inventoryId,
          );
        },
        [allRows, index],
      );

      // ✅ FIX: Only load batches when medicine_id actually changes
      // and hasn't been loaded before - prevents 4x API calls
      useEffect(() => {
        if (
          item.medicine_id &&
          getAvailableBatches &&
          item.medicine_id !== loadedMedicineIdRef.current
        ) {
          loadedMedicineIdRef.current = item.medicine_id;

          getAvailableBatches(item.medicine_id).then((availableBatches) => {
            setBatches(availableBatches);
            // Only auto-open batch dropdown if no batch selected yet
            if (availableBatches.length > 1 && !item.inventory_id) {
              setShowBatchDropdown(true);
              setHighlightedIndex(0);
              setTimeout(() => fieldRefs.current["batch"]?.focus(), 50);
            }
          });
        }

        // Reset cache when medicine cleared
        if (!item.medicine_id) {
          loadedMedicineIdRef.current = null;
          setBatches([]);
        }
      }, [item.medicine_id]); // ✅ removed getAvailableBatches and item.inventory_id from deps

      // Real-time stock validation
      useEffect(() => {
        if (item.inventory_id && item.qty) {
          const usedInOtherRows = calculateUsedStock(item.inventory_id, index);
          const totalStock = parseFloat(item.stock) || 0;
          const requestedQty = parseFloat(item.qty) || 0;
          const remainingStock = totalStock - usedInOtherRows;

          if (requestedQty > remainingStock) {
            setStockError({
              message: `Only ${remainingStock} left`,
              details:
                usedInOtherRows > 0
                  ? `${usedInOtherRows} used in other rows`
                  : null,
            });
          } else {
            setStockError(null);
          }
        } else {
          setStockError(null);
        }
      }, [item.qty, item.stock, item.inventory_id, calculateUsedStock, index, allRows]);

      // Update dropdown position
      useEffect(() => {
        if (!showBatchDropdown && !showProductDropdown) return;

        const updatePosition = () => {
          const targetField = showBatchDropdown ? "batch" : "name";
          const rect = fieldRefs.current[targetField]?.getBoundingClientRect();
          if (rect) {
            setDropdownPosition({
              top: rect.bottom + 4,
              left: rect.left,
              width: targetField === "batch" ? 320 : 400,
            });
          }
        };

        updatePosition();

        const scrollContainer = document.querySelector(".overflow-y-auto");
        if (scrollContainer) {
          scrollContainer.addEventListener("scroll", updatePosition);
          return () =>
            scrollContainer.removeEventListener("scroll", updatePosition);
        }
      }, [showBatchDropdown, showProductDropdown]);

      const handleProductSelection = useCallback(
        async (product) => {
          try {
            const availableBatches = await getAvailableBatches(
              product.medicine_id,
            );

            if (availableBatches.length === 0) {
              setBatchError("No stock available for this product");
              return;
            }

            setBatches(availableBatches);
            // ✅ Update cache ref so useEffect doesn't re-fetch
            loadedMedicineIdRef.current = product.medicine_id;
            setBatchError(null);

            if (availableBatches.length === 1) {
              const batch = availableBatches[0];
              const duplicateIndex = checkDuplicate(
                product.medicine_id,
                batch.inventory_id,
              );

              if (duplicateIndex !== -1) {
                setBatchError(
                  `Already in Row ${duplicateIndex + 1}. Same batch cannot be added twice.`,
                );
                onChange(index, "medicine_id", null);
                onChange(index, "name", "");
                return;
              }

              onProductSelect(index, product, batch);
              setShowBatchDropdown(false);
              setTimeout(() => fieldRefs.current["qty"]?.focus(), 50);
            } else {
              onProductSelect(index, product, null);
              setShowBatchDropdown(true);
              setHighlightedIndex(0);
              setTimeout(() => fieldRefs.current["batch"]?.focus(), 50);
            }

            setShowProductDropdown(false);
            setProductSearch("");
          } catch (error) {
            console.error("Error selecting product:", error);
            setBatchError("Failed to load product batches");
          }
        },
        [getAvailableBatches, checkDuplicate, index, onChange, onProductSelect],
      );

      const handleBatchSelection = useCallback(
        (batch) => {
          const duplicateIndex = checkDuplicate(
            item.medicine_id,
            batch.inventory_id,
          );
          if (duplicateIndex !== -1) {
            setBatchError(`Batch already in Row ${duplicateIndex + 1}`);
            return;
          }

          setBatchError(null);
          onBatchSelect(index, batch);
          setShowBatchDropdown(false);
          setTimeout(() => fieldRefs.current["qty"]?.focus(), 50);
        },
        [checkDuplicate, item.medicine_id, index, onBatchSelect],
      );

      const getCurrentFieldIndex = useCallback(() => {
        const activeElement = document.activeElement;
        for (let i = 0; i < FIELD_ORDER.length; i++) {
          if (fieldRefs.current[FIELD_ORDER[i]] === activeElement) return i;
        }
        return -1;
      }, []);

      const focusNextFieldInRow = useCallback(() => {
        const currentIndex = getCurrentFieldIndex();
        if (currentIndex === -1) return false;
        const nextIndex = currentIndex + 1;
        if (nextIndex >= FIELD_ORDER.length) return false;
        const nextField = fieldRefs.current[FIELD_ORDER[nextIndex]];
        if (nextField) {
          nextField.focus();
          nextField.select?.();
          return true;
        }
        return false;
      }, [getCurrentFieldIndex]);

      const handleKeyDown = useCallback(
        (e, fieldKey) => {
          if (e.key === "Escape") {
            setShowProductDropdown(false);
            setShowBatchDropdown(false);
            return;
          }

          if (showProductDropdown && filteredProducts.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev < filteredProducts.length - 1 ? prev + 1 : 0,
              );
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredProducts.length - 1,
              );
              return;
            }
            if (e.key === "Enter" && fieldKey === "name") {
              e.preventDefault();
              if (filteredProducts[highlightedIndex]) {
                handleProductSelection(filteredProducts[highlightedIndex]);
              }
              return;
            }
          }

          if (showBatchDropdown && batches.length > 0 && fieldKey === "batch") {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev < batches.length - 1 ? prev + 1 : 0,
              );
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : batches.length - 1,
              );
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (batches[highlightedIndex]) {
                handleBatchSelection(batches[highlightedIndex]);
              }
              return;
            }
          }

          if (e.key === "Enter") {
            e.preventDefault();
            const movedWithinRow = focusNextFieldInRow();
            if (!movedWithinRow) {
              if (isLast) onCreateNewRow?.();
              else onNavigateToNextRow?.(index);
            }
            return;
          }

          if (e.key === "Tab") {
            if (e.shiftKey) {
              e.preventDefault();
              if (index > 0) onNavigateToPrevRow?.(index);
            }
            return;
          }

          if (e.ctrlKey && e.key === "Backspace" && onRemoveRow) {
            e.preventDefault();
            onRemoveRow(index);
            return;
          }
        },
        [
          showProductDropdown,
          showBatchDropdown,
          filteredProducts,
          batches,
          highlightedIndex,
          index,
          isLast,
          focusNextFieldInRow,
          onNavigateToNextRow,
          onNavigateToPrevRow,
          onCreateNewRow,
          onRemoveRow,
          handleProductSelection,
          handleBatchSelection,
        ],
      );

      useEffect(() => {
        const handleClickOutside = (e) => {
          if (dropdownRef.current && !dropdownRef.current.contains(e.target))
            setShowProductDropdown(false);
          if (
            batchDropdownRef.current &&
            !batchDropdownRef.current.contains(e.target)
          )
            setShowBatchDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }, []);

      const handleChange = useCallback(
        (key, value) => {
          onChange(index, key, value);
        },
        [index, onChange],
      );

      const inputBase = `w-full h-full bg-transparent border-0 outline-none text-slate-800 text-[9px] 2xl:text-[10px] focus:bg-indigo-50 focus:ring-1 focus:ring-inset focus:ring-indigo-400 transition-all duration-100 placeholder:text-slate-300 truncate`;
      const cellBase = "border-b border-r border-slate-200 last:border-r-0 p-0 overflow-hidden";
      const hasData = item.name || item.qty;
      const hasError = batchError || stockError;

      return (
        <tr
          ref={rowRef}
          style={{ height: `${rowHeight}px` }}
          className={`
            group transition-all duration-100
            ${isEven ? "bg-white" : "bg-slate-50/50"}
            hover:bg-indigo-50/40 focus-within:bg-indigo-50/60
            ${hasData ? "border-l-2 border-l-indigo-400" : "border-l-2 border-l-transparent"}
            ${stockError ? "bg-red-50/30" : ""}
            ${batchError ? "bg-amber-50/30" : ""}
          `}
        >
          {/* SI NO */}
          <td className={`${cellBase} text-center bg-slate-50`}>
            <div className="flex items-center justify-center h-full">
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-bold
                  ${hasError ? "bg-red-500 text-white" : hasData ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-500"}`}
              >
                {rowNumber}
              </span>
            </div>
          </td>

          {/* ✅ ITEM NAME - now shows batchError text below input */}
          <td
            className={`${cellBase} relative bg-blue-50/30`}
            ref={dropdownRef}
            style={{ overflow: "visible" }}
          >
            <div className="relative w-full h-full flex flex-col">
              <input
                ref={(el) => registerFieldRef("name", el)}
                type="text"
                value={showProductDropdown ? productSearch : item.name || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setProductSearch(value);
                  setShowProductDropdown(value.length > 0);
                  handleChange("name", value);
                  setBatchError(null);
                  setStockError(null);
                  if (!value) {
                    handleChange("medicine_id", null);
                    handleChange("inventory_id", null);
                    handleChange("batch", "");
                    handleChange("exp", "");
                    handleChange("stock", "");
                    setBatches([]);
                    loadedMedicineIdRef.current = null;
                  }
                }}
                onFocus={() => {
                  setProductSearch(item.name || "");
                  if (productMaster.length > 0) setShowProductDropdown(true);
                }}
                onBlur={() =>
                  setTimeout(() => setShowProductDropdown(false), 200)
                }
                onKeyDown={(e) => handleKeyDown(e, "name")}
                className={`${inputBase} px-1.5 py-1 font-medium text-left flex-1
                  ${batchError ? "text-red-600 bg-red-50" : ""}
                `}
                placeholder="Search product..."
              />

              {/* ✅ FIX: Show batchError text VISIBLY below the name input */}
              {batchError && (
                <div
                  className="absolute left-0 right-0 bg-red-600 text-white text-[8px] font-semibold px-1.5 py-0.5 flex items-center gap-1 z-50 shadow-lg rounded-b"
                  style={{ top: "100%", whiteSpace: "nowrap" }}
                >
                  <AlertTriangle size={8} className="shrink-0" />
                  <span className="truncate">{batchError}</span>
                </div>
              )}
            </div>

            {/* Product Dropdown */}
            {showProductDropdown &&
              filteredProducts.length > 0 &&
              createPortal(
                <div
                  className="fixed bg-white border border-slate-300 rounded-lg shadow-2xl max-h-64 overflow-auto z-[9999]"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: "400px",
                  }}
                >
                  <div className="sticky top-0 bg-slate-50 px-3 py-1.5 border-b text-[9px] text-slate-600 font-medium">
                    {filteredProducts.length} products found
                  </div>
                  {filteredProducts.map((product, idx) => (
  <div
    key={product.medicine_id}
    onMouseDown={(e) => {
      e.preventDefault();
      handleProductSelection(product);
    }}
    className={`px-3 py-2.5 cursor-pointer text-[9px] border-b border-slate-100 last:border-b-0 transition-all
      ${idx === highlightedIndex ? "bg-indigo-50 border-l-2 border-l-indigo-500" : "hover:bg-slate-50 border-l-2 border-l-transparent"}`}
  >
    <div className="font-semibold text-slate-800">{product.name}</div>
    <div className="text-[8px] text-slate-400 flex gap-2 mt-0.5 items-center">
      <span>{product.manufacturer || "-"}</span>
      <span>•</span>
      <span>HSN: {product.hsn_code || "-"}</span>
      {/* ADD STOCK INDICATOR */}
      {product.total_available_stock !== undefined && (
        <>
          <span>•</span>
          <span className={`font-medium ${
            product.total_available_stock > 10 
              ? "text-green-600" 
              : product.total_available_stock > 0 
                ? "text-amber-600" 
                : "text-red-600"
          }`}>
            Stock: {product.total_available_stock}
          </span>
        </>
      )}
    </div>
  </div>
))}
                </div>,
                document.body,
              )}
          </td>

          {/* MANUFACTURER */}
          <td className={`${cellBase} bg-violet-50/20`}>
            <input
              className={`${inputBase} px-1 py-1 text-left`}
              value={item.manufacturer || ""}
              readOnly
            />
          </td>

          {/* BATCH */}
          <td
            className={`${cellBase} bg-cyan-50/30 relative`}
            ref={batchDropdownRef}
          >
            <div className="relative w-full h-full">
              <input
                ref={(el) => registerFieldRef("batch", el)}
                type="text"
                value={item.batch || ""}
                onFocus={() => {
                  if (item.medicine_id && batches.length > 0) {
                    setShowBatchDropdown(true);
                    setHighlightedIndex(0);
                  }
                }}
                onBlur={() =>
                  setTimeout(() => setShowBatchDropdown(false), 200)
                }
                onKeyDown={(e) => handleKeyDown(e, "batch")}
                className={`${inputBase} px-1 py-1 text-center font-mono text-[8px] cursor-pointer`}
                placeholder={batches.length > 1 ? "Select..." : ""}
                readOnly={true}
              />
              {batches.length > 1 && !item.inventory_id && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </div>

            {/* Batch Dropdown */}
            {showBatchDropdown &&
              batches.length > 0 &&
              createPortal(
                <div
                  className="fixed bg-white border border-slate-300 rounded-lg shadow-2xl max-h-64 overflow-auto z-[9999]"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: "320px",
                  }}
                >
                  <div className="sticky top-0 bg-slate-50 px-3 py-1.5 border-b text-[9px] text-slate-600 font-medium flex items-center gap-2">
                    <Package size={10} />
                    <span>
                      {batches.length} batch{batches.length > 1 ? "es" : ""} available
                    </span>
                    {batches.length > 1 && (
                      <span className="ml-auto text-amber-600 flex items-center gap-1">
                        <Info size={10} />
                        Select a batch
                      </span>
                    )}
                  </div>

                  {batches.map((batch, idx) => {
                    const usedInOtherRows = calculateUsedStock(batch.inventory_id, index);
                    const totalStock = parseFloat(batch.available_stock) || 0;
                    const remainingStock = totalStock - usedInOtherRows;
                    const isDuplicate = checkDuplicate(item.medicine_id, batch.inventory_id) !== -1;
                    const isExpiringSoon = batch.days_until_expiry && batch.days_until_expiry <= 30;
                    const isLowStock = remainingStock <= 10;
                    const isOutOfStock = remainingStock <= 0;

                    return (
                      <div
                        key={batch.inventory_id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!isDuplicate && !isOutOfStock) {
                            handleBatchSelection(batch);
                          }
                        }}
                        className={`px-3 py-2.5 cursor-pointer text-[9px] border-b border-slate-100 last:border-b-0 transition-all
                          ${idx === highlightedIndex ? "bg-indigo-50 border-l-2 border-l-indigo-500" : "hover:bg-slate-50 border-l-2 border-l-transparent"}
                          ${isExpiringSoon ? "bg-amber-50/50" : ""}
                          ${isDuplicate || isOutOfStock ? "opacity-50 cursor-not-allowed bg-red-50/30" : ""}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{batch.batch_number}</span>
                            {isDuplicate && (
                              <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                DUPLICATE
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`font-bold ${isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-green-600"}`}>
                              Stock: {totalStock}
                            </span>
                            {usedInOtherRows > 0 && (
                              <span className="text-[8px] text-gray-500">
                                Available: {remainingStock}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[8px] text-slate-400 flex gap-2 mt-1">
                          <span className={isExpiringSoon ? "text-amber-600 font-medium" : ""}>
                            Exp:{" "}
                            {new Date(batch.expiry_date).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span>MRP: ₹{batch.mrp}</span>
                          {batch.rack_no && (
                            <>
                              <span>•</span>
                              <span>Rack: {batch.rack_no}</span>
                            </>
                          )}
                        </div>

                        {isDuplicate && (
                          <div className="text-[8px] text-red-600 mt-1 font-medium">
                            Already added in another row
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>,
                document.body,
              )}
          </td>

          {/* EXPIRY */}
          <td className={`${cellBase}`}>
            <input
              className={`${inputBase} px-1 py-1 text-center font-mono text-[8px]`}
              value={item.exp || ""}
              readOnly
            />
          </td>

          {/* QTY */}
          <td className={`${cellBase} bg-amber-50/60`}>
            <input
              ref={(el) => registerFieldRef("qty", el)}
              type="number"
              value={item.qty || ""}
              onChange={(e) => handleChange("qty", e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "qty")}
              className={`${inputBase} px-1 py-1 text-center font-bold ${
                stockError
                  ? "text-red-700 bg-red-100 ring-1 ring-red-400 ring-inset"
                  : "text-amber-700"
              }`}
              placeholder="0"
              min="1"
            />
          </td>

          {/* MRP */}
          <td className={`${cellBase}`}>
            <input
              className={`${inputBase} px-1 py-1 text-right text-slate-600`}
              value={item.mrp || ""}
              readOnly
            />
          </td>

          {/* RATE */}
          <td className={`${cellBase} bg-blue-50/50`}>
            <input
              ref={(el) => registerFieldRef("rate", el)}
              type="number"
              value={item.rate || ""}
              onChange={(e) => handleChange("rate", e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "rate")}
              className={`${inputBase} px-1 py-1 text-right font-semibold text-blue-700`}
              placeholder="0.00"
              step="0.01"
            />
          </td>

          {/* DISCOUNT */}
          <td className={`${cellBase} bg-rose-50/40`}>
            <input
              ref={(el) => registerFieldRef("discountPercent", el)}
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

          {/* CGST */}
          <td className={`${cellBase} bg-orange-50/40`}>
            <input
              className={`${inputBase} px-1 py-1 text-center text-orange-600`}
              value={item.cgstPercent || "6"}
              readOnly
            />
          </td>

          {/* SGST */}
          <td className={`${cellBase} bg-orange-50/40`}>
            <input
              className={`${inputBase} px-1 py-1 text-center text-orange-600`}
              value={item.sgstPercent || "6"}
              readOnly
            />
          </td>

          {/* RACK */}
          <td className={`${cellBase} bg-slate-50`}>
            <input
              className={`${inputBase} px-1 py-1 text-center font-mono`}
              value={item.rack || ""}
              readOnly
            />
          </td>

          {/* ✅ STOCK - inline error visible */}
          <td
            className={`border-b border-r border-slate-200 p-0 ${stockError ? "bg-red-50" : ""}`}
          >
            <div className="px-1 h-full flex flex-col items-center justify-center gap-0">
              {item.inventory_id ? (
                <>
                  <span
                    className={`text-[9px] font-bold leading-none ${
                      stockError
                        ? "text-red-600"
                        : parseFloat(item.stock) <= 10
                          ? "text-amber-600"
                          : "text-green-600"
                    }`}
                  >
                    {item.stock || "0"}
                  </span>

                  {stockError ? (
                    // ✅ Stock error text - visible in cell
                    <span className="text-[7px] text-red-600 font-semibold text-center leading-tight mt-0.5">
                      {stockError.message}
                      {stockError.details && (
                        <span className="block text-red-500 font-normal">
                          {stockError.details}
                        </span>
                      )}
                    </span>
                  ) : (
                    allRows.some(
                      (r, i) =>
                        i !== index && r.inventory_id === item.inventory_id,
                    ) && (
                      <span className="text-[7px] text-gray-500 leading-tight mt-0.5">
                        {(parseFloat(item.stock) || 0) -
                          calculateUsedStock(item.inventory_id, index)}{" "}
                        left
                      </span>
                    )
                  )}
                </>
              ) : (
                <span className="text-[9px] text-slate-400">-</span>
              )}
            </div>
          </td>

          {/* AMOUNT */}
          <td className={`${cellBase} bg-emerald-50/60`}>
            <div className="px-1 py-1 text-right h-full flex items-center justify-end">
              <span
                className={`font-bold text-[10px] ${Number(item.amount) > 0 ? "text-emerald-700" : "text-slate-400"}`}
              >
                {Number(item.amount) > 0
                  ? Number(item.amount).toFixed(2)
                  : "0.00"}
              </span>
            </div>
          </td>
        </tr>
      );
    },
  ),
  // ✅ FIX: Correct memo comparison
  (prevProps, nextProps) => {
    if (prevProps.item !== nextProps.item) return false;
    if (prevProps.index !== nextProps.index) return false;
    if (prevProps.productMaster.length !== nextProps.productMaster.length) return false;

    const inventoryId = prevProps.item.inventory_id;
    if (inventoryId) {
      const prevSiblingQtySum = prevProps.allRows
        .filter((r, i) => i !== prevProps.index && r.inventory_id === inventoryId)
        .reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0);

      const nextSiblingQtySum = nextProps.allRows
        .filter((r, i) => i !== nextProps.index && r.inventory_id === inventoryId)
        .reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0);

      if (prevSiblingQtySum !== nextSiblingQtySum) return false;

      const prevSiblingCount = prevProps.allRows.filter(
        (r, i) => i !== prevProps.index && r.inventory_id === inventoryId,
      ).length;
      const nextSiblingCount = nextProps.allRows.filter(
        (r, i) => i !== nextProps.index && r.inventory_id === inventoryId,
      ).length;

      if (prevSiblingCount !== nextSiblingCount) return false;
    }

    return true;
  },
);

SalesRowFixed.displayName = "SalesRowFixed";
export default SalesRowFixed;