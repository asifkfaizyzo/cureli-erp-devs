import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

const InvoiceTable = ({ invoices, onEdit, onDelete, onView }) => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);

  const shrinkClasses = sidebarExpanded
    ? "text-[11px] py-1 px-1"
    : "text-[13px] py-2 px-2";

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden
        transition-all duration-300
        ${sidebarExpanded ? "p-2" : "p-3"}
      `}
    >
      <table
        className={`
          w-full font-medium border-collapse transition-all duration-300
          ${sidebarExpanded ? "text-[11px]" : "text-sm"}
        `}
      >
        <thead>
          <tr
            className={`
              bg-[#05015A] text-white transition-all duration-300
              ${sidebarExpanded ? "text-[11px]" : "text-[13px]"}
            `}
          >
            <th className={`${shrinkClasses} text-left`}>SL.No</th>
            <th className={`${shrinkClasses} text-left`}>Customer Name</th>
            <th className={`${shrinkClasses} text-center`}>Bill No</th>
            <th className={`${shrinkClasses} text-center`}>Contact</th>
            <th className={`${shrinkClasses} text-center`}>Date</th>
            <th className={`${shrinkClasses} text-center`}>E-way bill</th>
            <th className={`${shrinkClasses} text-center`}>Price</th>
            <th className={`${shrinkClasses} text-center w-20`}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((row, i) => {
            const formatted = new Date(row.date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            return (
              <tr
                key={row.id}
                className={`
                  ${i % 2 === 0 ? "bg-[#F5F6FA]" : "bg-[#F5F6FA]"}
                  hover:bg-gray-100 border-4 border-white rounded-xl transition-all duration-300
                  ${sidebarExpanded ? "text-[11px]" : "text-[13px]"}
                `}
              >
                <td className={`${shrinkClasses} border-4 border-white rounded-xl`}>
                  {i + 1}
                </td>

                <td className={`${shrinkClasses} border-4 border-white rounded-xl`}>
                  {row.name}
                </td>

                <td className={`${shrinkClasses} text-center border-4 border-white rounded-xl`}>
                  {row.billNo}
                </td>

                <td className={`${shrinkClasses} text-center border-4 border-white rounded-xl`}>
                  {row.phone}
                </td>

                <td className={`${shrinkClasses} text-center border-4 border-white rounded-xl`}>
                  {formatted}
                </td>

                <td className={`${shrinkClasses} text-center border-4 border-white rounded-xl`}>
                  {row.eway}
                </td>

                <td className={`${shrinkClasses} text-center border-4 border-white rounded-xl font-semibold`}>
                  ₹ {row.price}
                </td>

                <td className={`${shrinkClasses} border-4 bg-white border-white rounded-xl`}>
                  <div
                    className={`flex items-center justify-center ${
                      sidebarExpanded ? "gap-2" : "gap-4"
                    }`}
                  >
                    {/* VIEW */}
                    <Eye
                      size={sidebarExpanded ? 14 : 18}
                      className="cursor-pointer text-gray-600 hover:text-[#05015A]"
                      onClick={() => onView?.(row)}
                    />

                    {/* EDIT */}
                    <Pencil
                      size={sidebarExpanded ? 14 : 18}
                      className="cursor-pointer text-gray-600 hover:text-[#05015A]"
                      onClick={() => onEdit?.(row)}
                    />

                    {/* DELETE */}
                    <Trash2
                      size={sidebarExpanded ? 14 : 18}
                      className="cursor-pointer text-gray-600 hover:text-[#05015A]"
                      onClick={() => onDelete?.(row)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;
