// src/components/purchase/PurchaseRowFixed.jsx
import { useState, useMemo, useCallback, memo } from "react";

const EMPTY_ARRAY = [];

const PurchaseRowFixed = memo(({
  index,
  item,
  onChange,
  productMaster,
  registerFieldRef,
  focusNextField,
}) => {
  const stableProductMaster = productMaster || EMPTY_ARRAY;
  const [nameQuery, setNameQuery] = useState(() => item.name || "");

  const suggestions = useMemo(() => {
    const q = (nameQuery ?? "").toLowerCase().trim();
    if (!q) return EMPTY_ARRAY;
    return stableProductMaster.filter((p) => String(p.name ?? "").toLowerCase().includes(q)).slice(0, 8);
  }, [nameQuery, stableProductMaster]);

  const fields = useMemo(() => [
    { key: "name", inputType: "text", align: "text-left" },
    { key: "batch", inputType: "text", align: "text-center" },
    { key: "rate", inputType: "number", align: "text-right" },
    { key: "qty", inputType: "number", align: "text-center" },
    { key: "pack", inputType: "text", align: "text-center" },
    { key: "exp", inputType: "text", align: "text-center" },
    { key: "type", inputType: "text", align: "text-left" },
    { key: "category", inputType: "text", align: "text-left" },
    { key: "rack", inputType: "text", align: "text-center" },
    { key: "tax", inputType: "number", align: "text-center" },
    { key: "packRate", inputType: "number", align: "text-right" },
    { key: "disc", inputType: "number", align: "text-center" },
    { key: "mrp", inputType: "number", align: "text-right" },
    { key: "free", inputType: "number", align: "text-center" },
  ], []);

  const handleEnter = useCallback((e, idx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      focusNextField(index, idx);
    }
  }, [focusNextField, index]);

  const handleInputChange = useCallback((idx, fieldKey, inputType, rawValue) => {
    let val = rawValue;
    if (inputType === "number" && val !== "") {
      val = String(val).replace(/^0+(?=\d)/, "");
      if (Number(val) < 0) return;
    }
    if (idx === 0) setNameQuery(val);
    onChange(index, fieldKey, val);
  }, [onChange, index]);

  return (
    <tr className={`
      border-b border-gray-100 text-[10px] 2xl:text-xs transition-colors h-8
      ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} 
      hover:bg-indigo-50
    `}>
      {/* Sl.No */}
      <td className="px-2 py-0 text-gray-500 text-left font-medium w-[40px]">
        {index + 1}
      </td>

      {fields.map((f, idx) => (
        <td key={f.key} className="px-2 py-0 relative">
          <input
            ref={(el) => registerFieldRef(idx, el)}
            type={f.inputType}
            value={idx === 0 ? nameQuery : (item[f.key] ?? "")}
            onChange={(e) => handleInputChange(idx, f.key, f.inputType, e.target.value)}
            onKeyDown={(e) => handleEnter(e, idx)}
            className={`
              w-full h-full bg-transparent outline-none 
              ${f.align} 
              ${f.key === 'name' ? 'font-medium text-gray-900 truncate' : 'text-gray-700'}
              focus:text-indigo-700 focus:font-semibold transition-all
            `}
            placeholder={f.key === 'name' && !item.name ? "Search" : ""}
          />
          {/* (Optional) Suggestion Dropdown logic would go here for 'name' field */}
        </td>
      ))}
    </tr>
  );
});

PurchaseRowFixed.displayName = 'PurchaseRowFixed';

export default PurchaseRowFixed;