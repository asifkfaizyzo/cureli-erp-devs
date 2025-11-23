import { Eye, Pencil, Trash2 } from "lucide-react";

const InvoiceTable = ({ invoices }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
      <table className="w-full text-sm font-medium border-collapse">
        <thead>
          <tr className="bg-[#05015A] text-white text-[13px]">
            <th className="py-2 px-2 border-4 border-white rounded-xl text-left">SL.No</th>
            <th className="py-2 px-2 border-4 border-white rounded-xl text-left">Customer Name</th>
            <th className="py-2 px-2 border-4 border-white rounded-xl text-center">Bill No</th>
            <th className="py-2 px-2 border-4 border-white rounded-xl text-center">Contact</th>
            <th className="py-2 px-2 border-4 border-white rounded-xl text-center">Date</th>
            <th className="py-2 px-2 border-4 border-white rounded-xl text-center">E-way bill</th>
            <th className="py-2 px-2 border-4 border-white rounded-xl text-center">Price</th>
            <th className="py-2 px-2 border-4 border-white rounded-xl text-center w-28">Actions</th>
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
                className={`${
                  i % 2 === 0 ? "bg-[#F5F6FA]" : "bg-[#F5F6FA]"
                } hover:bg-gray-100 border-4 border-white rounded-xl transition`}
              >
                <td className="py-2 px-2 border-4 border-white rounded-xl">{i + 1}</td>
                <td className="py-2 px-2 border-4 border-white rounded-xl">{row.name}</td>
                <td className="py-2 px-2 text-centerborder-4 border-white rounded-xl">{row.billNo}</td>
                <td className="py-2 px-2 text-center border-4 border-white rounded-xl">{row.phone}</td>
                <td className="py-2 px-2 text-center border-4 border-white rounded-xl">{formatted}</td>
                <td className="py-2 px-2 text-center border-4 border-white rounded-xl">{row.eway}</td>
                <td className="py-2 px-2 text-center border-4 border-white rounded-xl font-semibold">
                  ₹ {row.price}
                </td>

                <td className="py-2 px-2 border-4 border-white rounded-xl">
                  <div className="flex items-center justify-center gap-4">
                    <Eye
                      size={18}
                      className="cursor-pointer text-[#05015A] hover:scale-110 transition"
                    />
                    <Pencil
                      size={18}
                      className="cursor-pointer text-gray-600 hover:text-black hover:scale-110 transition"
                    />
                    <Trash2
                      size={18}
                      className="cursor-pointer text-red-500 hover:scale-110 transition"
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
