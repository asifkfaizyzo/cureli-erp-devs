import SalesReportPagination from "./SalesReportPagination";
import { Pencil, Trash2 } from "lucide-react";

const SalesReportTable = ({
  data,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#000060] text-white">
          <tr>
            <th className="px-3 py-3 text-left">SL.No</th>
            <th className="px-3 py-3 text-left">Sale ID</th>
            <th className="px-3 py-3 text-left">Bill No</th>
            <th className="px-3 py-3 text-left">Item Name</th>
            <th className="px-3 py-3 text-left">Patient Name</th>
            <th className="px-3 py-3 text-left">Generic</th>
            <th className="px-3 py-3 text-left">Form</th>
            <th className="px-3 py-3 text-left">Strg</th>
            <th className="px-3 py-3 text-left">Date</th>
            <th className="px-3 py-3 text-left">QTY</th>
            <th className="px-3 py-3 text-left">U.Price</th>
            <th className="px-3 py-3 text-left">Price</th>
            <th className="px-3 py-3 text-left">Pharmacist</th>
            <th className="px-3 py-3 text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className="border-b hover:bg-slate-50 transition"
            >
              <td className="px-3 py-2">{index + 1}</td>
              <td className="px-3 py-2">{row.saleId}</td>
              <td className="px-3 py-2">{row.billNo}</td>
              <td className="px-3 py-2">{row.itemName}</td>
              <td className="px-3 py-2">{row.patientName}</td>
              <td className="px-3 py-2">{row.generic}</td>
              <td className="px-3 py-2">{row.form}</td>
              <td className="px-3 py-2">{row.strength}</td>
              <td className="px-3 py-2">{row.date}</td>
              <td className="px-3 py-2">{row.qty}</td>
              <td className="px-3 py-2">₹ {row.unitPrice}</td>
              <td className="px-3 py-2">₹ {row.price}</td>
              <td className="px-3 py-2">{row.pharmacist}</td>
              <td className="px-3 py-2 text-center flex justify-center gap-2">
                <Pencil size={16} className="cursor-pointer text-gray-500 hover:text-[#000060]" />
                <Trash2 size={16} className="cursor-pointer text-gray-500 hover:text-red-500" />
              </td>
            </tr>
          ))}

          {/* PAGINATION AS LAST ROW */}
          <tr>
            <td colSpan={14} className="px-4 py-3">
              <SalesReportPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SalesReportTable;
