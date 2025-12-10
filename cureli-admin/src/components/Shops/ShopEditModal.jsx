// src/components/Shops/ShopEditModal.jsx
import { useEffect, useState } from "react";
import {
  X,
  Pencil,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  GitBranch,
  Clock,
  Users,
  Loader2,
} from "lucide-react";

import DetailRow from "../User/DetailRow";
import ShopBranchesTable from "./ShopBranchesTable";

const ShopEditModal = ({ shop, isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && shop) {
      setFormData({
        businessName: shop.businessName || "",
        ownerName: shop.ownerName || "",
        gst: shop.gst || "",
        businessType: shop.businessType || "",
        verificationStatus: shop.verificationStatus || "",
        lastLogin: shop.lastLogin || "N/A",
        updatedAt: shop.updatedAt || "N/A",

        location: {
          pin: shop.location?.pin || "",
          place: shop.location?.place || "",
          state: shop.location?.state || "",
        },

        plan: shop.plan || "",
        subscriptionStatus: shop.subscriptionStatus || "",
        // subscriptionStart/end kept as read-only fields (system-managed)
        subscriptionStart: shop.subscriptionStart || "",
        subscriptionEnd: shop.subscriptionEnd || "",
      });
    }
  }, [isOpen, shop]);

  if (!isOpen || !shop) return null;

  const handleChange = (field, value) => {
    if (field.startsWith("location.")) {
      const key = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = () => {
    setSaving(true);

    setTimeout(() => {
      // Build updated object — do not overwrite subscriptionStart/End or lastLogin/updatedAt (system fields)
      const updated = {
        ...shop,
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        gst: formData.gst,
        businessType: formData.businessType,
        verificationStatus: formData.verificationStatus,
        location: {
          pin: formData.location?.pin,
          place: formData.location?.place,
          state: formData.location?.state,
        },
        plan: formData.plan,
        subscriptionStatus: formData.subscriptionStatus,
        // keep subscriptionStart/subscriptionEnd from original shop (system-managed)
        subscriptionStart: shop.subscriptionStart || formData.subscriptionStart,
        subscriptionEnd: shop.subscriptionEnd || formData.subscriptionEnd,
      };

      setSaving(false);
      onSave?.(updated);
      onClose(true);
    }, 700);
  };

  const tabList = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "address", label: "Address", icon: MapPin },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "users", label: "Users", icon: Users },
    { id: "branches", label: "Branches", icon: GitBranch },
    { id: "activity", label: "Activity", icon: Clock },
  ];

  // Dummy users if not present. Include subscriptionStart/End for table.
  const usersList = (shop.users && shop.users.length
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
      ]);

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
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Pencil size={18} className="text-white" />
            </div>
            <h3 className="text-white font-semibold">Edit Shop</h3>
          </div>

          <button
            onClick={() => onClose(false)}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-1 px-6 pt-4 bg-white border-b border-gray-200 overflow-x-auto">
          {tabList.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all ${
                  activeTab === t.id
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

        {/* CONTENT AREA */}
        <div className="p-4 h-[60vh] overflow-auto bg-gray-50">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Building2 size={16} /> Business
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <DetailRow
                  label="Business Name"
                  value={formData.businessName}
                  isEditing={true}
                  fieldName="businessName"
                  onChange={(v) => handleChange("businessName", v)}
                />
                <DetailRow
                  label="GST Number"
                  value={formData.gst}
                  isEditing={true}
                  fieldName="gst"
                  onChange={(v) => handleChange("gst", v)}
                />
                <DetailRow
                  label="Owner"
                  value={formData.ownerName}
                  isEditing={true}
                  fieldName="ownerName"
                  onChange={(v) => handleChange("ownerName", v)}
                />
                <DetailRow
                  label="Business Type"
                  value={formData.businessType}
                  isEditing={true}
                  fieldName="businessType"
                  onChange={(v) => handleChange("businessType", v)}
                />
                <DetailRow
                  label="Verification"
                  value={formData.verificationStatus}
                  isEditing={true}
                  fieldName="verificationStatus"
                  onChange={(v) => handleChange("verificationStatus", v)}
                />
              </div>

              {/* NOT EDITABLE FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-4">
                <DetailRow label="Last Login" value={formData.lastLogin} isEditing={false} />
                <DetailRow label="Last Updated" value={formData.updatedAt} isEditing={false} />
              </div>
            </div>
          )}

          {/* ADDRESS TAB */}
          {activeTab === "address" && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Address
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <DetailRow
                  label="Pincode"
                  value={formData.location.pin}
                  isEditing={true}
                  fieldName="location.pin"
                  onChange={(v) => handleChange("location.pin", v)}
                />
                <DetailRow
                  label="Place"
                  value={formData.location.place}
                  isEditing={true}
                  fieldName="location.place"
                  onChange={(v) => handleChange("location.place", v)}
                />
                <DetailRow
                  label="State"
                  value={formData.location.state}
                  isEditing={true}
                  fieldName="location.state"
                  onChange={(v) => handleChange("location.state", v)}
                />
              </div>
            </div>
          )}

          {/* SUBSCRIPTION TAB (Start/End are read-only) */}
          {activeTab === "subscription" && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Subscription
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <DetailRow
                  label="Plan"
                  value={formData.plan}
                  isEditing={true}
                  fieldName="plan"
                  onChange={(v) => handleChange("plan", v)}
                />

                <DetailRow
                  label="Status"
                  value={formData.subscriptionStatus}
                  isEditing={true}
                  fieldName="subscriptionStatus"
                  onChange={(v) => handleChange("subscriptionStatus", v)}
                />

                {/* Start/End are read-only per your instruction */}
                <DetailRow
                  label="Start Date"
                  value={formData.subscriptionStart || "N/A"}
                  isEditing={false}
                />
                <DetailRow
                  label="End Date"
                  value={formData.subscriptionEnd || "N/A"}
                  isEditing={false}
                />
              </div>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === "documents" && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Documents
              </h3>
              <p className="text-sm text-gray-500">No documents available.</p>
            </div>
          )}

          {/* USERS TAB (VIEW ONLY) - now includes subscription start/end */}
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

          {/* BRANCHES TAB */}
          {activeTab === "branches" && <ShopBranchesTable shopId={shop.shopId} />}

          {/* ACTIVITY TAB */}
          {activeTab === "activity" && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Activity
              </h3>
              <p className="text-sm text-gray-500">No activity logs available.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-white border-t flex justify-end gap-2">
          <button onClick={() => onClose(false)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#05015A] text-white hover:bg-[#0a0280] flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopEditModal;
