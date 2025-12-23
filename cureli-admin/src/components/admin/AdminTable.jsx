//Q:\YourZeroesAndOnes\cureli\curely_erp\cureli-admin\src\components\admin\AdminTable.jsx
import { useState } from "react";
import {
  Eye,
  Pencil,
  Ban,
  CheckCircle,
  Users,
} from "lucide-react";
import AdminDetailsModal from "./AdminDetailsModal";
import ConfirmDialog from "../common/ConfirmDialog";

const AdminTable = ({
  admins = [],
  rowsPerPage = 6,
  startIndex = 0,
  sortConfig,
  onSortChange,
  onAdminUpdate,
  children,
}) => {
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [adminToToggle, setAdminToToggle] = useState(null);

  const getStatusBadge = (status) =>
    status === "Active" ? (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Inactive
      </span>
    );

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* TABLE AREA */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full min-w-[900px] border-collapse text-xs md:text-sm">
          {/* HEADER */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white">
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Phone
              </th>
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Email
              </th>
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-3 py-2 text-center font-semibold text-[10px] uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-100">
            {admins.length ? (
              admins.map((a, i) => (
                <tr
                  key={a.id}
                  className="hover:bg-indigo-50/50 transition-colors group"
                >
                  <td className="px-3 py-1.5 text-gray-400 font-medium text-[11px]">
                    {startIndex + i + 1}
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="font-semibold text-gray-900 group-hover:text-[#05015A] transition-colors">
                      {a.name}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className="font-mono text-gray-600 text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                      @{a.username}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-gray-700">{a.phone}</td>
                  <td className="px-3 py-1.5 text-gray-700">{a.email}</td>
                  <td className="px-3 py-1.5">{getStatusBadge(a.status)}</td>
                  <td className="px-3 py-1.5 text-gray-600">
                    {a.lastLogin || "N/A"}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedAdmin(a);
                          setModalMode("view");
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAdmin(a);
                          setModalMode("edit");
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setAdminToToggle(a);
                          setShowStatusConfirm(true);
                        }}
                        className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title={a.status === "Active" ? "Suspend" : "Activate"}
                      >
                        {a.status === "Active" ? (
                          <Ban size={14} />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Users size={32} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-semibold text-gray-600 mb-1">
                      No admins found
                    </p>
                    <p className="text-gray-400 text-sm max-w-sm">
                      There are no admins matching your current filters. Try
                      adjusting your search criteria.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER / PAGINATION SLOT */}
      <div className="shrink-0 border-t border-gray-200 bg-gray-50/50 px-4 py-2.5 flex items-center justify-between">
        <div className="text-[11px] text-gray-500" />
        {children}
      </div>

      {/* MODALS */}
      <AdminDetailsModal
        isOpen={isModalOpen}
        admin={selectedAdmin}
        mode={modalMode}
        onClose={() => setIsModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={() => {
          onAdminUpdate?.(adminToToggle.id, {
            status:
              adminToToggle.status === "Active" ? "Inactive" : "Active",
          });
          setShowStatusConfirm(false);
        }}
        title="Change Status?"
        message={`Update status for ${adminToToggle?.name}?`}
      />
    </div>
  );
};

export default AdminTable;
