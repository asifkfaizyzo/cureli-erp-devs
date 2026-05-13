import { Download, Printer } from "lucide-react";

const SalesReportHeader = ({ onExport, onPrint }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-[#000060]">
        Sales Report
      </h2>

      <div className="flex gap-3">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#000060] text-white hover:opacity-90 transition"
        >
          <Download size={16} />
          Export
        </button>

        <button
          onClick={onPrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#000060] text-white hover:opacity-90 transition"
        >
          <Printer size={16} />
          Print
        </button>
      </div>
    </div>
  );
};

export default SalesReportHeader;
