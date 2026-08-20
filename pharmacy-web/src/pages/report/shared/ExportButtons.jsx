// pharmacy-web/src/pages/report/shared/ExportButtons.jsx

import { useState } from "react";
import { Download, FileText, Sheet, Printer } from "lucide-react";

const ExportButtons = ({ data = [], filename = "report", columns = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCSV = () => {
    if (!data.length) return;

    const headers = columns.map((c) => c.label).join(",");
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key] ?? "";
          // Escape commas and quotes
          const str = String(val).replace(/"/g, '""');
          return str.includes(",") || str.includes('"') ? `"${str}"` : str;
        })
        .join(","),
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
      >
        <Download size={14} />
        Export
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[140px]">
            <button
              onClick={handleCSV}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Sheet size={14} className="text-green-600" />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer size={14} className="text-gray-600" />
              Print
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButtons;