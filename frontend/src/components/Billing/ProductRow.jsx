// // src/components/billing/ProductRow.jsx
// import { useEffect, useRef, useState } from "react";
// import { createPortal } from "react-dom";

// const ProductRow = ({
//   index,
//   item,
//   masterList = [],
//   batchRef,
//   qtyRef,
//   onChange,
//   onRequestNextRowBatch,
// }) => {
//   const [localBatch, setLocalBatch] = useState(item.batch || "");
//   const [suggestions, setSuggestions] = useState([]);
//   const [activeSuggestion, setActiveSuggestion] = useState(0);
//   const [showSuggestions, setShowSuggestions] = useState(false);

//   const inputBatchRef = useRef(null);
//   const inputQtyRef = useRef(null);
//   const dropdownRef = useRef(null);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

//   // Dropdown Positioning
//   useEffect(() => {
//     if (inputBatchRef.current && showSuggestions) {
//       const rect = inputBatchRef.current.getBoundingClientRect();
//       setDropdownPos({
//         top: rect.bottom + 4,
//         left: rect.left, // Align left to the input
//         width: 220,      // Fixed reasonable width
//       });
//     }
//   }, [localBatch, showSuggestions]);

//   useEffect(() => { if (batchRef) batchRef(inputBatchRef.current); }, [batchRef]);
//   useEffect(() => { if (qtyRef) qtyRef(inputQtyRef.current); }, [qtyRef]);
//   useEffect(() => { setLocalBatch(item.batch || ""); }, [item.batch]);

//   // Search Logic
//   useEffect(() => {
//     const q = String(localBatch || "").trim().toLowerCase();
//     if (!q) {
//       setSuggestions([]);
//       setShowSuggestions(false);
//       return;
//     }

//     const matches = masterList.filter((m) => {
//       return (
//         (m.batch && m.batch.toLowerCase().includes(q)) ||
//         (m.name && m.name.toLowerCase().includes(q)) ||
//         (m.barcode && m.barcode.startsWith(q))
//       );
//     });

//     setSuggestions(matches.slice(0, 6));
//     setActiveSuggestion(0);
//     setShowSuggestions(matches.length > 0);
//   }, [localBatch, masterList]);

//   const applySuggestion = (s) => {
//     const val = s.batch || s.barcode || "";
//     setLocalBatch(val);
//     setShowSuggestions(false);
//     onChange(index, "batch", val, { triggerAutoFill: true });
//     queueMicrotask(() => inputQtyRef.current?.focus?.());
//   };

//   const handleBatchKeyDown = (e) => {
//     if (e.key === "ArrowDown") {
//       e.preventDefault();
//       if (!showSuggestions) return;
//       setActiveSuggestion((s) => Math.min(s + 1, suggestions.length - 1));
//       return;
//     }
//     if (e.key === "ArrowUp") {
//       e.preventDefault();
//       if (!showSuggestions) return;
//       setActiveSuggestion((s) => Math.max(s - 1, 0));
//       return;
//     }
//     if (e.key === "Enter") {
//       e.preventDefault();
//       if (showSuggestions && suggestions.length > 0) {
//         applySuggestion(suggestions[activeSuggestion]);
//         return;
//       }
//       const typed = localBatch.trim();
//       if (typed !== "") {
//         setShowSuggestions(false);
//         onChange(index, "batch", typed, { triggerAutoFill: true });
//         queueMicrotask(() => inputQtyRef.current?.focus?.());
//       }
//       return;
//     }
//     if (e.key === "Escape") {
//       setShowSuggestions(false);
//       return;
//     }
//     if (e.key === "Backspace" && localBatch === "") {
//       e.preventDefault();
//       onChange(index, "__deleteRow");
//       return;
//     }
//   };

//   const handleBatchChange = (value) => {
//     setLocalBatch(value);
//     onChange(index, "batch", value);
//   };

//   const handleQtyKeyDown = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       setShowSuggestions(false);
//       onRequestNextRowBatch?.();
//     }
//   };

//   const updateField = (field, v) => onChange(index, field, v);

//   return (
//     <tr
//       className={`
//         border-b border-gray-100 text-sm transition-colors
//         ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
//         hover:bg-indigo-50
//       `}
//     >
//       {/* Sl.No */}
//       <td className="px-3 py-2 text-gray-500 text-left font-medium">{index + 1}</td>

//       {/* Product Name */}
//       <td className="px-3 py-2">
//         <input
//           type="text"
//           className="w-full bg-transparent outline-none text-gray-900 font-medium truncate"
//           value={item.name || ""}
//           readOnly
//         />
//       </td>

//       {/* Batch (Editable with Dropdown) */}
//       <td className="px-3 py-2 relative">
//         <input
//           ref={inputBatchRef}
//           className="w-full bg-transparent outline-none text-gray-800 focus:text-indigo-700 focus:font-semibold placeholder:text-gray-400"
//           value={localBatch}
//           placeholder="Scan/Type"
//           onChange={(e) => handleBatchChange(e.target.value)}
//           onKeyDown={handleBatchKeyDown}
//           autoComplete="off"
//           onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
//         />

//         {/* Dropdown Portal */}
//         {showSuggestions && suggestions.length > 0 &&
//           createPortal(
//             <ul
//               ref={dropdownRef}
//               className="
//                 fixed bg-white rounded-lg shadow-xl border border-gray-200 
//                 z-[9999] text-xs overflow-hidden
//               "
//               style={{
//                 top: dropdownPos.top,
//                 left: dropdownPos.left,
//                 width: dropdownPos.width
//               }}
//             >
//               {suggestions.map((s, i) => (
//                 <li
//                   key={`${s.batch}-${i}`}
//                   onMouseDown={(ev) => {
//                     ev.preventDefault();
//                     applySuggestion(s);
//                   }}
//                   className={`
//                     px-3 py-2 cursor-pointer flex justify-between items-center
//                     ${i === activeSuggestion ? "bg-[#05015A] text-white" : "text-gray-700 hover:bg-gray-100"}
//                   `}
//                 >
//                   <span className="font-medium truncate mr-2">{s.name}</span>
//                   <span className={`opacity-70 ${i === activeSuggestion ? "text-indigo-200" : "text-gray-500"}`}>
//                     {s.batch}
//                   </span>
//                 </li>
//               ))}
//             </ul>,
//             document.body // Render at body level to avoid clipping
//           )
//         }
//       </td>

//       {/* Qty (Editable) */}
//       <td className="px-3 py-2 text-center">
//         <input
//           ref={inputQtyRef}
//           className="w-full bg-transparent text-center outline-none font-semibold text-gray-900 focus:text-indigo-600"
//           type="number"
//           placeholder="0"
//           value={item.qty ?? ""}
//           onChange={(e) => {
//             const val = e.target.value;
//             if (val === "" || Number(val) >= 0) {
//               updateField("qty", val === "" ? "" : Number(val));
//             } else {
//               updateField("qty", 0);
//             }
//           }}
//           onKeyDown={(e) => {
//             if (e.key === "-" || e.key === "Subtract") e.preventDefault();
//             handleQtyKeyDown(e);
//           }}
//         />
//       </td>

//       {/* MRP */}
//       <td className="px-3 py-2 text-right text-gray-600 font-medium">
//         <input className="w-full bg-transparent text-right outline-none" value={item.mrp ?? 0} readOnly />
//       </td>

//       {/* Exp */}
//       <td className="px-3 py-2 text-center text-gray-500">
//         <input className="w-full bg-transparent text-center outline-none" value={item.exp || ""} readOnly />
//       </td>

//       {/* Type */}
//       <td className="px-3 py-2 text-left text-gray-500">
//         <input className="w-full bg-transparent text-left outline-none truncate" value={item.type || ""} readOnly />
//       </td>

//       {/* Category */}
//       <td className="px-3 py-2 text-left text-gray-500">
//         <input className="w-full bg-transparent text-left outline-none truncate" value={item.category || ""} readOnly />
//       </td>

//       {/* Stock */}
//       <td className="px-3 py-2 text-center text-gray-500">
//         <input className="w-full bg-transparent text-center outline-none" value={item.stock || ""} readOnly />
//       </td>

//       {/* Rack */}
//       <td className="px-3 py-2 text-center text-gray-500">
//         <input className="w-full bg-transparent text-center outline-none" value={item.rack || ""} readOnly />
//       </td>

//       {/* Disc% (Editable) */}
//       <td className="px-3 py-2 text-center">
//         <input
//           className="w-full bg-transparent text-center outline-none text-gray-900 focus:text-indigo-600"
//           type="number"
//           value={item.disc ?? ""}
//           placeholder="0"
//           onChange={(e) => {
//             const v = e.target.value;
//             onChange(index, "disc", v === "" ? "" : Number(v));
//           }}
//         />
//       </td>

//       {/* Tax% (Editable) */}
//       <td className="px-3 py-2 text-center">
//         <input
//           className="w-full bg-transparent text-center outline-none text-gray-900 focus:text-indigo-600"
//           type="number"
//           value={item.tax ?? ""}
//           placeholder="0"
//           onChange={(e) => {
//             const v = e.target.value;
//             onChange(index, "tax", v === "" ? "" : Number(v));
//           }}
//         />
//       </td>

//       {/* Tax Amt */}
//       <td className="px-3 py-2 text-center text-gray-600">
//         <input
//           className="w-full bg-transparent text-center outline-none"
//           value={item.taxAmt ?? 0}
//           readOnly
//         />
//       </td>

//       {/* AMOUNT (Result) */}
//       <td className="px-3 py-2 text-right font-bold text-gray-900">
//         <input className="w-full bg-transparent text-right outline-none" value={item.amount ?? 0} readOnly />
//       </td>
      
//     </tr>
//   );
// };

// export default ProductRow;

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ProductRow = ({ index, item, masterList = [], batchRef, qtyRef, onChange, onRequestNextRowBatch }) => {
  /** -------------------- STATES -------------------- **/
  const [localBatch, setLocalBatch] = useState(item.batch || "");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputBatchRef = useRef(null);
  const inputQtyRef = useRef(null);
  const dropdownRef = useRef(null);

  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 200 });

  /** -------------------- DROPDOWN POSITION -------------------- **/
  useEffect(() => {
    if (inputBatchRef.current && showSuggestions) {
      const rect = inputBatchRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width || 200,
      });
    }
  }, [localBatch, showSuggestions]);

  /** Expose refs upward */
  useEffect(() => { if (batchRef) batchRef(inputBatchRef.current); }, [batchRef]);
  useEffect(() => { if (qtyRef) qtyRef(inputQtyRef.current); }, [qtyRef]);

  /** Sync when item updates */
  useEffect(() => { setLocalBatch(item.batch || ""); }, [item.batch]);

  /** -------------------- SUGGESTION SEARCH -------------------- **/
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

  /** -------------------- APPLY SUGGESTION -------------------- **/
  const applySuggestion = (s) => {
    const val = s.batch || s.barcode || "";
    setLocalBatch(val);
    setShowSuggestions(false);

    onChange(index, "batch", val, { triggerAutoFill: true });

    queueMicrotask(() => inputQtyRef.current?.focus?.());
  };

  /** -------------------- KEYBOARD HANDLING -------------------- **/
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

      // Use highlighted suggestion
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

  const handleQtyKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowSuggestions(false);
      onRequestNextRowBatch?.();
    }
  };

  /** -------------------- ON CHANGE HANDLERS -------------------- **/
  const handleBatchChange = (v) => {
    setLocalBatch(v);
    onChange(index, "batch", v);
  };

  /** ==============================================================
   *  UI (YOUR EXACT UI — NO STYLE CHANGES)
   * ============================================================== */
  return (
    <tr
      className={`
      border-b border-gray-100 text-[10px] 2xl:text-xs transition-colors h-8
      ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} 
      hover:bg-indigo-50
    `}
    >
      <td className="px-2 py-0 text-gray-500 text-left font-medium">{index + 1}</td>

      <td className="px-2 py-0">
        <input className="w-full bg-transparent outline-none font-medium truncate h-full" value={item.name || ""} readOnly />
      </td>

      {/* Batch (with full suggestion system) */}
      <td className="px-2 py-0 relative">
        <input
          ref={inputBatchRef}
          className="w-full bg-transparent outline-none h-full"
          value={localBatch}
          placeholder="Scan"
          onChange={(e) => handleBatchChange(e.target.value)}
          onKeyDown={handleBatchKeyDown}
          autoComplete="off"
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />

        {showSuggestions && suggestions.length > 0 &&
          createPortal(
            <ul
              ref={dropdownRef}
              className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] text-[10px] overflow-hidden"
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
              }}
            >
              {suggestions.map((s, i) => (
                <li
                  key={`${s.batch}-${i}`}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    applySuggestion(s);
                  }}
                  className={`
                    px-3 py-2 cursor-pointer flex justify-between items-center
                    ${i === activeSuggestion ? "bg-[#05015A] text-white" : "text-gray-700 hover:bg-gray-100"}
                  `}
                >
                  <span className="font-medium truncate mr-2">{s.name}</span>
                  <span className={`opacity-70 ${i === activeSuggestion ? "text-indigo-200" : "text-gray-500"}`}>
                    {s.batch}
                  </span>
                </li>
              ))}
            </ul>,
            document.body
          )}
      </td>

      {/* Qty */}
      <td className="px-2 py-0 text-center">
        <input
          ref={inputQtyRef}
          className="w-full bg-transparent text-center outline-none font-semibold text-gray-900 h-full"
          type="number"
          placeholder="0"
          value={item.qty ?? ""}
          onChange={(e) => onChange(index, "qty", e.target.value)}
          onKeyDown={handleQtyKeyDown}
        />
      </td>

      {/* Other columns EXACT as your UI */}
      <td className="px-2 py-0 text-right text-gray-600 font-medium">
        <input className="w-full bg-transparent text-right outline-none h-full" value={item.mrp ?? 0} readOnly />
      </td>

      <td className="px-2 py-0 text-center"><input className="w-full bg-transparent text-center outline-none h-full" value={item.exp || ""} readOnly /></td>
      <td className="px-2 py-0 text-left"><input className="w-full bg-transparent text-left outline-none h-full" value={item.type || ""} readOnly /></td>
      <td className="px-2 py-0 text-left"><input className="w-full bg-transparent text-left outline-none h-full" value={item.category || ""} readOnly /></td>
      <td className="px-2 py-0 text-center"><input className="w-full bg-transparent text-center outline-none h-full" value={item.stock || ""} readOnly /></td>
      <td className="px-2 py-0 text-center"><input className="w-full bg-transparent text-center outline-none h-full" value={item.rack || ""} readOnly /></td>

      <td className="px-2 py-0 text-center">
        <input className="w-full bg-transparent text-center outline-none h-full" type="number" value={item.disc ?? ""} onChange={(e) => onChange(index, "disc", e.target.value)} />
      </td>

      <td className="px-2 py-0 text-center">
        <input className="w-full bg-transparent text-center outline-none h-full" type="number" value={item.tax ?? ""} onChange={(e) => onChange(index, "tax", e.target.value)} />
      </td>

      <td className="px-2 py-0 text-center">
        <input className="w-full bg-transparent text-center outline-none h-full" value={item.taxAmt ?? 0} readOnly />
      </td>

      <td className="px-2 py-0 text-right font-bold text-gray-900">
        <input className="w-full bg-transparent text-right outline-none h-full" value={item.amount ?? 0} readOnly />
      </td>
    </tr>
  );
};

export default ProductRow;
