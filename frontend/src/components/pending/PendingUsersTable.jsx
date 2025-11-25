// src/components/pending/PendingUsersTable.jsx
import { Eye, Mail, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const PendingUsersTable = ({ users, onViewDocuments, currentPage, totalPages, setCurrentPage }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-[#05015A] text-white">
          <tr>
            <th className="px-3 py-3 text-left text-sm">#</th>
            <th className="px-3 py-3 text-left text-sm">Name</th>
            <th className="px-3 py-3 text-center text-sm">Phone</th>
            <th className="px-3 py-3 text-center text-sm">Submitted</th>
            <th className="px-3 py-3 text-center text-sm">Status</th>
            <th className="px-3 py-3 text-center text-sm w-36">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u, idx) => (
            <tr key={u.id} className="odd:bg-[#F8F8FB] hover:bg-gray-100">
              <td className="px-3 py-3 text-sm">{u.id}</td>
              <td className="px-3 py-3 text-sm">{u.name}</td>
              <td className="px-3 py-3 text-sm text-center">{u.phone}</td>
              <td className="px-3 py-3 text-sm text-center">{u.submittedOn}</td>
              <td className="px-3 py-3 text-sm text-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    u.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : u.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {u.status}
                </span>
              </td>

              <td className="px-3 py-3 text-sm text-center">
                <div className="flex items-center justify-center gap-3">
                  <button
                    className="p-2 rounded-md hover:bg-gray-100"
                    onClick={() => onViewDocuments(u)}
                    title="View documents"
                  >
                    <Eye size={18} />
                  </button>

                  <button
                    className="p-2 rounded-md hover:bg-gray-100"
                    title="Send reminder (placeholder)"
                    onClick={() => alert(`Send reminder to ${u.name}`)}
                  >
                    <Mail size={16} />
                  </button>

                  <button
                    className="p-2 rounded-md hover:bg-gray-100"
                    title="Delete (placeholder)"
                    onClick={() => {
                      if (confirm(`Delete user ${u.name}?`)) {
                        // deletion should be handled in parent
                        alert("Deleted (placeholder)");
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* simple pagination (3-window + dots style can be added later) */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-gray-600">
          Showing {users.length} of {totalPages * users.length} entries
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-40"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Prev
          </button>
          <div className="px-3 py-1 bg-gray-50 rounded">{currentPage}</div>
          <button
            className="px-3 py-1 border rounded disabled:opacity-40"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingUsersTable;
