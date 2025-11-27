// src/components/purchase/PurchaseRowFixed.jsx
import { useState, useMemo, useCallback, memo } from "react";

// Define outside component to avoid new reference each render
const EMPTY_ARRAY = [];

const PurchaseRowFixed = memo(({
  index,
  item,
  onChange,
  productMaster,
  registerFieldRef,
  focusNextField,
}) => {
  // Use stable reference for productMaster
  const stableProductMaster = productMaster || EMPTY_ARRAY;
  
  // Local state only for user typing
  const [nameQuery, setNameQuery] = useState(() => item.name || "");

  // ✅ Use useMemo instead of useEffect + useState
  const suggestions = useMemo(() => {
    const q = (nameQuery ?? "").toLowerCase().trim();
    if (!q) return EMPTY_ARRAY;

    return stableProductMaster
      .filter((p) => String(p.name ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [nameQuery, stableProductMaster]);

  const cols = {
    name: "w-[180px]",
    batch: "w-[100px]",
    rate: "w-[70px]",
    qty: "w-[55px]",
    pack: "w-[70px]",
    exp: "w-[70px]",
    type: "w-[110px]",
    category: "w-[110px]",
    rack: "w-[60px]",
    tax: "w-[55px]",
    packRate: "w-[70px]",
    disc: "w-[55px]",
    mrp: "w-[70px]",
    free: "w-[55px]",
  };

  // ✅ Memoize fields array - it never changes
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

    if (inputType === "number") {
      if (val !== "") {
        val = String(val).replace(/^0+(?=\d)/, "");
        if (Number(val) < 0) return;
      }
    }

    if (idx === 0) {
      setNameQuery(val);
    }

    onChange(index, fieldKey, val);
  }, [onChange, index]);

  return (
    <tr className="text-[11px] bg-[#F5F6FA] border-b-4 border-white hover:bg-gray-100">
      <td className="px-2 py-2 border-4 border-white text-center font-semibold w-[40px]">
        {index + 1}
      </td>

      {fields.map((f, idx) => (
        <td
          key={f.key}
          className={`px-2 py-2 border-4 border-white ${cols[f.key]}`}
        >
          <input
            ref={(el) => registerFieldRef(idx, el)}
            type={f.inputType}
            value={idx === 0 ? nameQuery : (item[f.key] ?? "")}
            onChange={(e) => handleInputChange(idx, f.key, f.inputType, e.target.value)}
            onKeyDown={(e) => handleEnter(e, idx)}
            className={`w-full bg-transparent outline-none ${f.align}`}
          />
        </td>
      ))}
    </tr>
  );
});

PurchaseRowFixed.displayName = 'PurchaseRowFixed';

export default PurchaseRowFixed;