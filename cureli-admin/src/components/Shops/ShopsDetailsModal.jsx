// src/components/Shops/ShopsDetailsModal.jsx
import { useEffect, useState } from "react";
import {
  X,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  GitBranch,
  Clock,
  Users,
} from "lucide-react";

import DetailRow from "../User/DetailRow";
import ShopBranchesTable from "./ShopBranchesTable";

const ShopsDetailsModal = ({ shop, isOpen, onClose, onUpdateShop }) => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!isOpen) setActiveTab("overview");
  }, [isOpen]);

  if (!isOpen || !shop) return null;

  const displayName = shop.businessName || "Shop";
  const subscriptionStatus = shop.subscriptionStatus || "N/A";

  const tabList = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "address", label: "Address", icon: MapPin },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "users", label: "Users", icon: Users },
    { id: "branches", label: "Branches", icon: GitBranch },
    { id: "activity", label: "Activity", icon: Clock },
  ];

  // Dummy users if not provided
  const usersList =
    shop.users && shop.users.length
      ? shop.users
      : [
          {
            name: "Demo User",
            email: "demo@example.com",
            role: "Super Admin",
            user_id: "USR-0001",
            shop_id: shop.shopId,
            branch_id: `${shop.shopId}-BR1`,
          },
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => onClose(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-white text-lg font-semibold">{displayName}</h2>

                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                    {shop.businessType || "N/A"}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      subscriptionStatus === "Active"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-red-500/20 text-red-200"
                    }`}
                  >
                    {subscriptionStatus}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onClose(false)}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/20 transition-all"
            >
              <X size={18} className="text-red-200" />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 px-6 pt-4 bg-white border-b border-gray-200 overflow-x-auto">
          {tabList.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap ${
                  isActive
                    ? "text-[#05015A] border-b-2 border-[#05015A]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <div className="p-4 h-[60vh] overflow-auto bg-gray-50">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 size={16} /> Business
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <DetailRow label="Business Name" value={shop.businessName} />
                  <DetailRow label="GST Number" value={shop.gst || "Not provided"} />
                  <DetailRow label="Owner" value={shop.ownerName} />
                  <DetailRow label="Business Type" value={shop.businessType} />
                  <DetailRow
                    label="Verification"
                    value={shop.verificationStatus}
                    type="verification"
                  />
                </div>

                {/* LAST LOGIN & UPDATED */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-6">
                  <DetailRow label="Last Login" value={shop.lastLogin || "N/A"} />
                  <DetailRow label="Last Updated" value={shop.updatedAt || "N/A"} />
                </div>
              </div>
            </div>
          )}

          {/* ADDRESS */}
          {activeTab === "address" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin size={16} /> Address
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <DetailRow label="Pincode" value={shop.location?.pin || "N/A"} />
                <DetailRow label="Place" value={shop.location?.place || "N/A"} />
                <DetailRow label="State" value={shop.location?.state || "N/A"} />
              </div>
            </div>
          )}

          {/* SUBSCRIPTION */}
          {activeTab === "subscription" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard size={16} /> Subscription
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div>
                  <DetailRow label="Plan" value={shop.plan || "N/A"} />
                  <DetailRow
                    label="Status"
                    type="status"
                    value={shop.subscriptionStatus || "N/A"}
                  />
                </div>

                <div>
                  <DetailRow label="Start Date" value={shop.subscriptionStart || "N/A"} />
                  <DetailRow label="End Date" value={shop.subscriptionEnd || "N/A"} />
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText size={16} /> Documents
              </h3>
              <p className="text-sm text-gray-500">No documents uploaded.</p>
            </div>
          )}

          {/* USERS — UPDATED */}
          {activeTab === "users" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users size={16} /> Users
              </h3>

              <div className="overflow-auto rounded-md border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-3 text-left font-semibold text-gray-600">Name</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Email</th>
                      <th className="p-3 text-left font-semibold text-gray-600">User ID</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Role</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Shop ID</th>
                      <th className="p-3 text-left font-semibold text-gray-600">Branch ID</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usersList.length > 0 ? (
                      usersList.map((u, idx) => (
                        <tr
                          key={u.user_id ?? idx}
                          className="border-b border-gray-50 hover:bg-indigo-50 cursor-pointer transition"
                          onClick={() => window.location.assign("*")}
                        >
                          <td className="p-3">
                            <a href="*" className="hover:underline text-[#05015A]">
                              {u.name ?? u.full_name ?? "Unknown"}
                            </a>
                          </td>

                          <td className="p-3">
                            <a href="*" className="hover:underline text-[#05015A]">
                              {u.email ?? "N/A"}
                            </a>
                          </td>

                          <td className="p-3">
                            <a href="*" className="hover:underline text-[#05015A]">
                              {u.user_id ?? "N/A"}
                            </a>
                          </td>

                          <td className="p-3">
                            <a
                              href="*"
                              className="px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 hover:underline"
                            >
                              {u.role ?? "Staff"}
                            </a>
                          </td>

                          <td className="p-3">
                            <a href="*" className="hover:underline text-[#05015A]">
                              {u.shop_id ?? shop.shopId}
                            </a>
                          </td>

                          <td className="p-3">
                            <a href="*" className="hover:underline text-[#05015A]">
                              {u.branch_id ?? "N/A"}
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-6 text-center text-gray-400">
                          No users found for this shop.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BRANCHES */}
          {activeTab === "branches" && (
            <ShopBranchesTable shopId={shop.shopId} />
          )}

          {/* ACTIVITY */}
          {activeTab === "activity" && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock size={16} /> Activity
              </h3>
              <p className="text-sm text-gray-500">No activity logs available.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Shop ID: {shop.shopId}
            </span>

            <button
              onClick={() => onClose(false)}
              className="px-4 py-2 bg-[#05015A] text-white rounded-lg hover:bg-[#0a0280]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopsDetailsModal;
