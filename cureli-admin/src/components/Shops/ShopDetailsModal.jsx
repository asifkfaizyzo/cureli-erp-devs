// src/components/Shops/ShopDetailsModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Pencil,
  Save,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  Users,
  GitBranch,
  History,
  Ban,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { getShopById, updateShop, toggleShopActive } from "../../api/cadminShops";
import ConfirmDialog from "../common/ConfirmDialog";

// Tab Components (View Mode)
import ShopOverviewTab from "./tabs/ShopOverviewTab";
import ShopSubscriptionTab from "./tabs/ShopSubscriptionTab";
import ShopDocumentsTab from "./tabs/ShopDocumentsTab";
import ShopUsersTab from "./tabs/ShopUsersTab";
import ShopBranchesTab from "./tabs/ShopBranchesTab";
import ShopActivityTab from "./tabs/ShopActivityTab";

// Tab Components (Edit Mode)
import ShopEditOverviewTab from "./tabs/ShopEditOverviewTab";
import ShopEditSubscriptionTab from "./tabs/ShopEditSubscriptionTab";
import ShopEditDocumentsTab from "./tabs/ShopEditDocumentsTab";

// Required document types (6 required)
const REQUIRED_DOCUMENT_TYPES = [
  "drug_license",
  "pharmacy_registration",
  "business_registration_proof",
  "shop_establishment_license",
  "address_proof",
  "pan_card",
];

const ShopDetailsModal = ({ shop: basicShop, isOpen, onClose, mode = "view" }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  // Full shop data fetched from API
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data for editing
  const [formData, setFormData] = useState({
    business_name: "",
    gst_number: "",
    business_type: "",
    address_line_1: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Save loading state
  const [saveLoading, setSaveLoading] = useState(false);

  // Suspend dialog
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);

  // ✅ Document validation state
  const [documentsValid, setDocumentsValid] = useState(true);

  // Fetch full shop details when modal opens
  useEffect(() => {
    if (isOpen && basicShop?.shop_id) {
      fetchShopDetails(basicShop.shop_id);
    }
  }, [isOpen, basicShop?.shop_id]);

  const fetchShopDetails = async (shopId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getShopById(shopId);
      const shopData = response.data?.data || response.data;
      setShop(shopData);

      // Initialize form data
      setFormData({
        business_name: shopData.business_name || "",
        gst_number: shopData.gst_number || "",
        business_type: shopData.business_type || "",
        address_line_1: shopData.address_line_1 || "",
        city: shopData.city || "",
        state: shopData.state || "",
        pincode: shopData.pincode || "",
      });

      // ✅ Check initial document validation - 6 REQUIRED types
      const uploadedTypes = (shopData.shopFiles || []).map((f) => f.file_type);
      const allRequiredPresent = REQUIRED_DOCUMENT_TYPES.every((type) =>
        uploadedTypes.includes(type)
      );
      setDocumentsValid(allRequiredPresent);
    } catch (err) {
      console.error("Failed to fetch shop details:", err);
      setError(err.response?.data?.message || "Failed to load shop details");
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview");
      setIsEditing(false);
      setShop(null);
      setFormData({
        business_name: "",
        gst_number: "",
        business_type: "",
        address_line_1: "",
        city: "",
        state: "",
        pincode: "",
      });
      setError(null);
      setDocumentsValid(true);
    }
  }, [isOpen]);

  // Set editing mode based on mode prop
  useEffect(() => {
    setIsEditing(mode === "edit");
  }, [mode]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Tab configuration
  const tabs = [
    { id: "overview", label: "Overview", icon: Building2, editable: true },
    { id: "subscription", label: "Subscription", icon: CreditCard, editable: true },
    { id: "documents", label: "Documents", icon: FileText, editable: true },
    { id: "users", label: "Users", icon: Users, editable: false },
    { id: "branches", label: "Branches", icon: GitBranch, editable: false },
    { id: "activity", label: "Activity", icon: History, editable: false },
  ];

  // Check if current tab is editable
  const currentTab = tabs.find((t) => t.id === activeTab);
  const isEditableTab = currentTab?.editable;

  // ✅ Check if save should be enabled
  const canSave = () => {
    // When on documents tab in edit mode, require all 6 required documents
    if (isEditing && activeTab === "documents") {
      return documentsValid;
    }
    // For other tabs, always allow save
    return true;
  };

  // Verification status badge
  const getVerificationBadge = (status) => {
    const config = {
      verified: { bg: "bg-emerald-500/20", text: "text-emerald-300", label: "Verified" },
      pending: { bg: "bg-blue-500/20", text: "text-blue-300", label: "Pending" },
      pending_review: { bg: "bg-yellow-500/20", text: "text-yellow-300", label: "Pending Review" },
      rejected: { bg: "bg-red-500/20", text: "text-red-300", label: "Rejected" },
      partially_rejected: {
        bg: "bg-orange-500/20",
        text: "text-orange-300",
        label: "Partially Rejected",
      },
    };
    const style = config[status] || config.pending;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  // Active status badge
  const getActiveBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
        Active
      </span>
    ) : (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
        Inactive
      </span>
    );
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Handle document validation change (callback from ShopEditDocumentsTab)
  const handleDocumentValidationChange = (isValid) => {
    setDocumentsValid(isValid);
  };

  // Handle save
  const handleSaveChanges = async () => {
    // ✅ Block save if documents are invalid
    if (!canSave()) {
      alert("Please upload all 6 required documents before saving.");
      return;
    }

    if (!shop) return;
    setSaveLoading(true);
    try {
      // Build payload with only changed fields
      const payload = {};

      if (formData.business_name !== shop.business_name) {
        payload.business_name = formData.business_name;
      }
      if (formData.gst_number !== shop.gst_number) {
        payload.gst_number = formData.gst_number;
      }
      if (formData.business_type !== shop.business_type) {
        payload.business_type = formData.business_type;
      }
      if (formData.address_line_1 !== shop.address_line_1) {
        payload.address_line_1 = formData.address_line_1;
      }
      if (formData.city !== shop.city) {
        payload.city = formData.city;
      }
      if (formData.state !== shop.state) {
        payload.state = formData.state;
      }
      if (formData.pincode !== shop.pincode) {
        payload.pincode = formData.pincode;
      }

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      await updateShop(shop.shop_id, payload);
      setIsEditing(false);
      onClose(true); // Close and refresh
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.response?.data?.message || "Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  };

  // ✅ Handle close with validation
  const handleClose = () => {
    // If editing documents and not all uploaded, warn user
    if (isEditing && activeTab === "documents" && !documentsValid) {
      const confirm = window.confirm(
        "Not all required documents are uploaded. Are you sure you want to close? Changes will not be saved."
      );
      if (!confirm) return;
    }
    onClose(false);
  };

  // Suspend/Activate handler
  const handleSuspendConfirm = async () => {
    if (!shop) return;
    setSuspendLoading(true);
    try {
      const newIsActive = !shop.is_active;
      await toggleShopActive(shop.shop_id, newIsActive);
      setShowSuspendConfirm(false);
      onClose(true); // Close and refresh
    } catch (err) {
      console.error("Suspend/Activate failed:", err);
      alert(err.response?.data?.message || "Failed to update shop status");
    } finally {
      setSuspendLoading(false);
    }
  };

  // Refresh shop data (called after subscription/document changes)
  const handleRefresh = () => {
    if (shop?.shop_id) {
      fetchShopDetails(shop.shop_id);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="ml-3 text-gray-500">Loading shop details...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <AlertTriangle size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Error loading shop</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchShopDetails(basicShop?.shop_id)}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!shop) return null;

    switch (activeTab) {
      case "overview":
        return isEditing ? (
          <ShopEditOverviewTab shop={shop} formData={formData} onFormChange={handleFormChange} />
        ) : (
          <ShopOverviewTab shop={shop} />
        );
      case "subscription":
        return isEditing ? (
          <ShopEditSubscriptionTab shop={shop} onRefresh={handleRefresh} />
        ) : (
          <ShopSubscriptionTab shop={shop} />
        );
      case "documents":
        return isEditing ? (
          <ShopEditDocumentsTab
            shop={shop}
            onRefresh={handleRefresh}
            onValidationChange={handleDocumentValidationChange}
          />
        ) : (
          <ShopDocumentsTab shop={shop} />
        );
      case "users":
        return <ShopUsersTab shop={shop} />;
      case "branches":
        return <ShopBranchesTab shop={shop} />;
      case "activity":
        return <ShopActivityTab shop={shop} />;
      default:
        return null;
    }
  };

  // Display values (use basic shop while loading full details)
  const displayName = shop?.business_name || basicShop?.business_name || "Shop";
  const displayType = shop?.business_type || basicShop?.business_type || "";
  const displayVerification =
    shop?.verification_status || basicShop?.verification_status || "pending";
  const displayIsActive = shop?.is_active ?? basicShop?.is_active ?? true;
  const ownerName =
    shop?.owner?.full_name || basicShop?.owner?.name || basicShop?.owner?.full_name || "";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal Container */}
        <div
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Shop Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white text-lg font-semibold">
                      {isEditing ? `Edit: ${displayName}` : displayName}
                    </h2>
                    {displayType && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                        {displayType}
                      </span>
                    )}
                    {getVerificationBadge(displayVerification)}
                    {getActiveBadge(displayIsActive)}
                  </div>
                  {ownerName && (
                    <p className="text-white/70 text-sm mt-0.5">Owner: {ownerName}</p>
                  )}
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {/* Edit / Save Toggle */}
                {isEditableTab && !loading && shop && (
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSaveChanges();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    disabled={saveLoading || (isEditing && !canSave())}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${
                        isEditing
                          ? canSave()
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    title={isEditing && !canSave() ? "Upload all 6 required documents to save" : ""}
                  >
                    {saveLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isEditing ? (
                      <Save size={16} />
                    ) : (
                      <Pencil size={16} />
                    )}
                    {saveLoading ? "Saving..." : isEditing ? "Save Changes" : "Edit Details"}
                  </button>
                )}

                {/* ✅ Show warning indicator when documents invalid */}
                {isEditing && activeTab === "documents" && !documentsValid && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/30 rounded-lg">
                    <AlertTriangle size={14} className="text-red-200" />
                    <span className="text-xs text-red-200">Missing docs</span>
                  </div>
                )}

                {/* Close */}
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
                >
                  <X size={20} className="text-red-200" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 bg-white border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              // ✅ Show warning dot on documents tab if invalid
              const showWarning = tab.id === "documents" && isEditing && !documentsValid;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap
                    ${
                      isActive
                        ? "text-[#05015A] border-b-2 border-[#05015A] bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                  {showWarning && (
                    <span
                      className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                      title="Missing required documents"
                    />
                  )}
                  {tab.editable && isEditing && !showWarning && (
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Editable" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-4 h-[60vh] overflow-auto bg-gray-50">{renderTabContent()}</div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between">
              {/* Left: Meta Info */}
              <p className="text-xs text-gray-400">
                Shop ID: {shop?.shop_id?.slice(0, 8) || basicShop?.shop_id?.slice(0, 8)}... •
                {isEditing ? (
                  <span>
                    {" "}
                    Last Updated:{" "}
                    {shop?.updated_at ? new Date(shop.updated_at).toLocaleDateString() : "N/A"}
                  </span>
                ) : (
                  <span>
                    {" "}
                    Created:{" "}
                    {shop?.created_at ? new Date(shop.created_at).toLocaleDateString() : "N/A"}
                  </span>
                )}
              </p>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {/* Suspend / Activate Button */}
                <button
                  onClick={() => setShowSuspendConfirm(true)}
                  disabled={loading || !shop}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      displayIsActive
                        ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }
                  `}
                >
                  {displayIsActive ? (
                    <>
                      <Ban size={16} />
                      Suspend Shop
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Activate Shop
                    </>
                  )}
                </button>

                {isEditing ? (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-[#05015A] text-white rounded-lg hover:bg-[#0a0280] transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Confirm Dialog */}
      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => setShowSuspendConfirm(false)}
        onConfirm={handleSuspendConfirm}
        title={displayIsActive ? "Suspend Shop?" : "Activate Shop?"}
        message={
          displayIsActive
            ? `Are you sure you want to suspend "${displayName}"? All users under this shop will lose access until reactivated.`
            : `Are you sure you want to activate "${displayName}"? Users will regain access to their accounts.`
        }
        confirmText={displayIsActive ? "Suspend" : "Activate"}
        cancelText="Cancel"
        type={displayIsActive ? "warning" : "success"}
        loading={suspendLoading}
      />
    </>
  );
};

export default ShopDetailsModal;