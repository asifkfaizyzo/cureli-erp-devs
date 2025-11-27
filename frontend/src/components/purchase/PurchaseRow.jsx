// src/components/purchase/PurchaseRow.jsx
import { useState, useEffect } from "react";

const PurchaseRow = ({
  index,
  item,
  onChange,
  productMaster = [],
  registerFieldRef,
  focusNextField,
}) => {
  const [nameQuery, setNameQuery] = useState(item.name || "");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q) return setSuggestions([]);

    const filtered = productMaster
      .filter((p) => p.name?.toLowerCase().includes(q))
      .slice(0, 8);

    setSuggestions(filtered);
  }, [nameQuery, productMaster]);

  /** ---------- WIDTHS FOR EACH COLUMN ---------- **/
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

  const fields = [
    { key: "name", type: "text", class: "text-left" },
    { key: "batch", type: "text", class: "text-center" },
    { key: "rate", type: "number", class: "text-right" },
    { key: "qty", type: "number", class: "text-center" },
    { key: "pack", type: "text", class: "text-center" },
    { key: "exp", type: "text", class: "text-center" },
    { key: "type", type: "text", class: "text-center" },
    { key: "category", type: "text-left", class: "text-center" },
    { key: "rack", type: "text", class: "text-center" },
    { key: "tax", type: "number", class: "text-center" },
    { key: "packRate", type: "number", class: "text-right" },
    { key: "disc", type: "number", class: "text-center" },
    { key: "mrp", type: "number", class: "text-right" },
    { key: "free", type: "number", class: "text-center" },
  ];

  /** ---------- ENTER KEY NAVIGATION ---------- **/
  const handleEnter = (e, fieldIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();
      focusNextField(index, fieldIndex);
    }
  };

  return (
    <tr className="text-[11px] bg-[#F5F6FA] border-b-4 border-white hover:bg-gray-100">

      {/* SL NO */}
      <td className="px-2 py-2 border-4 border-white text-center font-semibold w-[40px]">
        {index + 1}
      </td>

      {/* ALL INPUT COLUMNS */}
      {fields.map((f, idx) => (
        <td
          key={f.key}
          className={`px-2 py-2 border-4 border-white text-center ${cols[f.key]}`}
        >
          <input
            ref={(el) => registerFieldRef(idx, el)}
            type={f.type}
            value={idx === 0 ? nameQuery : item[f.key] ?? ""}
            onChange={(e) => {
              let val = e.target.value;

              // Remove leading zeros + block negative numbers
              if (f.type === "number") {
                if (val === "") {
                  val = "";
                } else {
                  // strip leading zeros (keep 0 and decimals)
                  val = val.replace(/^0+(?=\d)/, "");
                  if (Number(val) < 0) return;
                }
              }

              if (idx === 0) setNameQuery(val);
              onChange(index, f.key, val);
            }}
            onKeyDown={(e) => handleEnter(e, idx)}
            className={`
              w-full bg-transparent outline-none ${f.class}
              [appearance:textfield] 
              [&::-webkit-inner-spin-button]:appearance-none 
              [&::-webkit-outer-spin-button]:appearance-none
            `}
          />
        </td>
      ))}

    </tr>
  );
};

export default PurchaseRow;
