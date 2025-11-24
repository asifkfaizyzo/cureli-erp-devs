import { useEffect, useRef, useState } from "react";

const ProductRow = ({
  index,
  item,
  masterList = [],
  batchRef,
  qtyRef,
  onChange,
  onRequestNextRowBatch,
}) => {
  const [localBatch, setLocalBatch] = useState(item.batch || "");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputBatchRef = useRef(null);
  const inputQtyRef = useRef(null);

  useEffect(() => {
    if (batchRef) batchRef(inputBatchRef.current);
  }, [batchRef]);

  useEffect(() => {
    if (qtyRef) qtyRef(inputQtyRef.current);
  }, [qtyRef]);

  useEffect(() => {
    setLocalBatch(item.batch || "");
  }, [item.batch]);

  useEffect(() => {
    const q = String(localBatch || "").trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const matches = masterList.filter((m) => {
      return (
        (m.batch && m.batch.toLowerCase().includes(q)) ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.barcode && m.barcode.startsWith(q))
      );
    });

    setSuggestions(matches.slice(0, 6));
    setActiveSuggestion(0);
    setShowSuggestions(matches.length > 0);
  }, [localBatch, masterList]);

  const applySuggestion = (s) => {
    const val = s.batch || s.barcode || "";
    setLocalBatch(val);
    setShowSuggestions(false);
    onChange(index, "batch", val, { triggerAutoFill: true });
    queueMicrotask(() => inputQtyRef.current?.focus?.());
  };

  const handleBatchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showSuggestions) return;
      setActiveSuggestion((s) => Math.min(s + 1, suggestions.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!showSuggestions) return;
      setActiveSuggestion((s) => Math.max(s - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        applySuggestion(suggestions[activeSuggestion]);
        return;
      }
      const typed = localBatch.trim();
      if (typed !== "") {
        setShowSuggestions(false);
        onChange(index, "batch", typed, { triggerAutoFill: true });
        queueMicrotask(() => inputQtyRef.current?.focus?.());
      }
      return;
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      return;
    }

    if (e.key === "Backspace" && localBatch === "") {
      e.preventDefault();
      onChange(index, "__deleteRow");
      return;
    }
  };

  const handleBatchChange = (value) => {
    setLocalBatch(value);
    onChange(index, "batch", value);
  };

  const handleQtyKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowSuggestions(false);
      onRequestNextRowBatch?.();
    }
  };

  const updateField = (field, v) => onChange(index, field, v);

  return (
    <tr
      className={`
        text-[11px] text-gray-700
        ${index % 2 === 0 ? "bg-[#F5F6FA]" : "bg-[#F5F6FA]"}
        hover:bg-gray-100 border-b-4 border-white transition
      `}
    >
      <td className="px-2 py-2 border-4 border-white rounded-xl text-center w-8">{index + 1}</td>

      <td className="px-2 py-2 border-4 border-white rounded-xl">
        <input
          type="text"
          className="w-full bg-transparent outline-none"
          value={item.name || ""}
          readOnly
        />
      </td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-center relative">
        <input
          ref={inputBatchRef}
          className="w-full bg-transparent text-center outline-none"
          value={localBatch}
          onChange={(e) => handleBatchChange(e.target.value)}
          onKeyDown={handleBatchKeyDown}
          autoComplete="off"
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />

        {showSuggestions && suggestions.length > 0 && (
          <ul
            className="
              absolute left-1/2 -translate-x-1/2 top-full mt-1
              w-[240px] max-h-60 overflow-auto
              bg-white rounded-xl shadow-2xl border border-gray-200
              z-[9999] text-[12px]
            "
          >
            {suggestions.map((s, i) => (
              <li
                key={`${s.batch}-${i}`}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  applySuggestion(s);
                }}
                className={`
                  px-3 py-2 cursor-pointer select-none transition
                  ${i === activeSuggestion ? "bg-[#000060] text-white" : "hover:bg-gray-100"}
                `}
              >
                <div className="font-semibold leading-tight">{s.name}</div>
                <div className="text-xs opacity-80">{s.batch}</div>
              </li>
            ))}
          </ul>
        )}
      </td>

      {/* QTY */}
      {/* QTY */}
<td className="px-2 py-2 border-4 border-white rounded-xl text-center">
  <input
    ref={inputQtyRef}
    className="w-full bg-transparent text-center outline-none"
    type="number"
    value={item.qty ?? ""}
    onChange={(e) => {
      const val = e.target.value;

      // prevent negative numbers
      if (val === "" || Number(val) >= 0) {
        updateField("qty", val === "" ? "" : Number(val));
      } else {
        updateField("qty", 0);   // auto-correct negatives to 0
      }
    }}
    onKeyDown={(e) => {
      if (e.key === "-" || e.key === "Subtract") {
        e.preventDefault(); // block minus sign
      }
      handleQtyKeyDown(e);
    }}
  />
</td>
    

      {/* MRP */}
      <td className="px-2 py-2 border-4 border-white rounded-xl text-right font-semibold text-gray-800">
        <input className="w-full bg-transparent text-right outline-none" value={item.mrp ?? 0} readOnly />
      </td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">
        <input className="w-full bg-transparent text-center outline-none" value={item.exp || ""} readOnly />
      </td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">
        <input className="w-full bg-transparent text-center outline-none" value={item.type || ""} readOnly />
      </td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">
        <input className="w-full bg-transparent text-center outline-none" value={item.category || ""} readOnly />
      </td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">
        <input className="w-full bg-transparent text-center outline-none" value={item.stock || ""} readOnly />
      </td>

      <td className="px-2 py-2 border-4 border-white rounded-xl text-center">
        <input className="w-full bg-transparent text-center outline-none" value={item.rack || ""} readOnly />
      </td>

         {/* AMOUNT = qty × mrp */}
      <td className="px-2 py-2 border-4 border-white rounded-xl text-right font-bold text-gray-900">
        <input className="w-full bg-transparent text-right outline-none" value={item.amount ?? 0} readOnly />
      </td>
      
    </tr>
  );
};

export default ProductRow;
