import { useState, useEffect } from "react";
import {
  X,
  Pencil,
  Save,
  User,
  Store,
  FileText,
  KeyRound,
  Ban,
  CheckCircle,
  GitBranch,
  Users,
  History,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  ProfileDetails,
  ShopDetails,
  DocumentsTab,
  BranchesTab,
  UsersTab,
  ActivityTab,
} from "./UserDetailsTabs";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/Toast";
import {
  getCAdminUserById,
  toggleCAdminUserAccess,
  resetCAdminUserPassword,
  updateCAdminUser,
} from "../../../api/cadminUsers";

const UserDetailsModal = ({ user: basicUser, isOpen, onClose, mode }) => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  // Full user data fetched from API
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Form data for editing
  const [formData, setFormData] = useState({});
  const [originalFormData, setOriginalFormData] = useState({}); // Track original for comparison

  // Confirm dialogs state
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [showResetPasswordConfirm, setShowResetPasswordConfirm] =
    useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // Save loading state
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Fetch full user details when modal opens
  useEffect(() => {
    if (isOpen && basicUser?.id) {
      fetchUserDetails(basicUser.id);
    }
  }, [isOpen, basicUser?.id]);

  const fetchUserDetails = async (userId) => {
    setLoadingUser(true);
    setFetchError(null);
    setSaveError(null);
    try {
      const response = await getCAdminUserById(userId);
      const userData = response.data?.data || response.data;
      setUser(userData);

      // Initialize form data - include all editable fields
      const initialFormData = {
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        full_name:
          userData.full_name ||
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
          "",
        username: userData.username || "",
        email: userData.email || "",
        phone_number: userData.phone_number || "",
        role:
          userData.raw_role ||
          userData.role?.toLowerCase().replace(" ", "_") ||
          "",
      };

      setFormData(initialFormData);
      setOriginalFormData(initialFormData); // Save original for comparison
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to load user details";
      setFetchError(errorMessage);
      toast.error("Failed to Load Details", errorMessage);
    } finally {
      setLoadingUser(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("profile");
      setIsEditing(false);
      setUser(null);
      setFormData({});
      setOriginalFormData({});
      setFetchError(null);
      setSaveError(null);
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
        if (isEditing && hasChanges()) {
          // Confirm before closing if there are unsaved changes
          if (
            window.confirm(
              "You have unsaved changes. Are you sure you want to close?"
            )
          ) {
            onClose(false);
          }
        } else {
          onClose(false);
        }
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
  }, [isOpen, onClose, isEditing]);

  if (!isOpen) return null;

  // Determine user role
  const isOwner = user?.role === "Super Admin";
  const isBranchAdmin = user?.role === "Branch Admin";
  const isStaff = user?.role === "Staff";

  // Check if Reset Password should be shown (only for Super Admin)
  const canResetPassword = isOwner;

  // Check if there are unsaved changes
  const hasChanges = () => {
    return Object.keys(formData).some(
      (key) => formData[key] !== originalFormData[key]
    );
  };

  // Dynamic tabs based on role
  const getTabs = () => {
    const baseTabs = [{ id: "profile", label: "Profile", icon: User }];

    if (!user) return baseTabs;

    if (isOwner) {
      return [
        ...baseTabs,
        { id: "shop", label: "Shop Details", icon: Store },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "branches", label: "Branches", icon: GitBranch },
        { id: "users", label: "Users", icon: Users },
        { id: "activity", label: "Activity", icon: History },
      ];
    }

    if (isBranchAdmin) {
      return [
        ...baseTabs,
        { id: "shop", label: "Branch Details", icon: Store },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "activity", label: "Activity", icon: History },
      ];
    }

    // Staff
    return [
      ...baseTabs,
      { id: "shop", label: "Workplace", icon: Store },
      { id: "activity", label: "Activity", icon: History },
    ];
  };

  const tabs = getTabs();

  // Get display label for active/inactive status
  const getActiveStatusLabel = (is_active) => {
    return is_active ? "Active" : "Inactive";
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleFormChange = (field, value) => {
    setSaveError(null); // Clear any previous save errors
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelEdit = () => {
    if (hasChanges()) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to cancel?"
        )
      ) {
        return;
      }
    }
    setFormData(originalFormData);
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSuspendConfirm = async () => {
    if (!user) return;
    setSuspendLoading(true);
    try {
      const newIsActive = !user.is_active;
      await toggleCAdminUserAccess(user.user_id, newIsActive);

      setShowSuspendConfirm(false);

      // Show success toast
      if (newIsActive) {
        toast.success(
          "User Activated",
          `${user.full_name || user.username} has been activated successfully.`
        );
      } else {
        toast.success(
          "User Suspended",
          `${user.full_name || user.username} has been suspended successfully.`
        );
      }

      onClose(true); // Close and refresh
    } catch (error) {
      console.error("Suspend/Activate failed:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update user status";
      toast.error("Action Failed", errorMessage);
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!user) return;
    setResetPasswordLoading(true);
    try {
      await resetCAdminUserPassword(user.user_id);

      setShowResetPasswordConfirm(false);

      // Show success toast
      toast.success(
        "Reset Link Sent",
        `Password reset link has been sent to ${user.email}`
      );

      onClose(true); // Close and refresh
    } catch (error) {
      console.error("Reset password failed:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send reset link";
      toast.error("Reset Failed", errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    // Check if there are any changes
    if (!hasChanges()) {
      setIsEditing(false);
      return;
    }

    // Validate required fields
    const validationErrors = validateForm();
    if (validationErrors) {
      setSaveError(validationErrors);
      toast.error("Validation Error", validationErrors);
      return;
    }

    setSaveLoading(true);
    setSaveError(null);

    try {
      const payload = {};

      // For Super Admin: use first_name and last_name
      if (isOwner) {
        if (formData.first_name !== originalFormData.first_name) {
          payload.first_name = formData.first_name.trim();
        }
        if (formData.last_name !== originalFormData.last_name) {
          payload.last_name = formData.last_name.trim();
        }
        if (formData.email !== originalFormData.email) {
          payload.email = formData.email.trim();
        }
      } else {
        // For Branch Admin & Staff: use full_name
        if (formData.full_name !== originalFormData.full_name) {
          payload.full_name = formData.full_name.trim();
        }
      }

      // Common fields
      if (formData.username !== originalFormData.username) {
        payload.username = formData.username.trim().toLowerCase();
      }
      if (formData.phone_number !== originalFormData.phone_number) {
        payload.phone_number = formData.phone_number.replace(/\D/g, "");
      }

      // Only include role if it's editable (not Super Admin) and changed
      if (!isOwner && formData.role !== originalFormData.role) {
        payload.role = formData.role;
      }

      // If no actual changes after processing
      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      console.log("Saving changes:", payload); // Debug log

      const response = await updateCAdminUser(user.user_id, payload);

      // Check if update was successful
      if (response.status === 200 || response.data?.success) {
        // Update local user state with response data if available
        const updatedUser = response.data?.data || response.data?.user;
        if (updatedUser) {
          setUser((prev) => ({ ...prev, ...updatedUser }));
          // Update original form data to reflect saved state
          setOriginalFormData(formData);
        }

        setIsEditing(false);

        // Show success toast
        toast.success("Changes Saved", `User details updated successfully.`);

        onClose(true); // Close and refresh parent
      } else {
        throw new Error(response.data?.message || "Update failed");
      }
    } catch (error) {
      console.error("Save failed:", error);

      // Handle specific error cases
      let errorMessage = "Failed to save changes. Please try again.";

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid data provided";
      } else if (error.response?.status === 409) {
        errorMessage = "Username or phone number already exists";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to edit this user";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setSaveError(errorMessage);
      toast.error("Save Failed", errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const validateForm = () => {
    // Name validation
    if (isOwner) {
      if (!formData.first_name?.trim()) {
        return "First name is required";
      }
    } else if (isBranchAdmin || isStaff) {
      if (!formData.full_name?.trim()) {
        return "Name is required";
      }
      if (formData.full_name.trim().length < 2) {
        return "Name must be at least 2 characters";
      }
    }

    // Username validation
    if (formData.username && formData.username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (
      formData.username &&
      !/^[a-z0-9_]+$/.test(formData.username.toLowerCase())
    ) {
      return "Username can only contain lowercase letters, numbers, and underscores";
    }

    // Phone validation
    if (formData.phone_number) {
      const cleanPhone = formData.phone_number.replace(/\D/g, "");
      if (cleanPhone && !/^[0-9]{10}$/.test(cleanPhone)) {
        return "Invalid phone number (must be 10 digits)";
      }
    }

    // Email validation (for Super Admin)
    if (isOwner && formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return "Invalid email address";
      }
    }

    return null; // No errors
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER CONTENT
  // ═══════════════════════════════════════════════════════════
  const renderTabContent = () => {
    if (loadingUser) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="ml-3 text-gray-500">Loading user details...</span>
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <p className="text-lg font-medium">Error loading user</p>
          <p className="text-sm mt-1">{fetchError}</p>
          <button
            onClick={() => fetchUserDetails(basicUser?.id)}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!user) return null;

    switch (activeTab) {
      case "profile":
        return (
          <ProfileDetails
            user={user}
            isEditing={isEditing}
            formData={formData}
            onFormChange={handleFormChange}
          />
        );
      case "shop":
        return <ShopDetails user={user} isEditing={false} />;
      case "documents":
        return <DocumentsTab user={user} />;
      case "branches":
        return isOwner ? <BranchesTab user={user} /> : null;
      case "users":
        return isOwner ? <UsersTab user={user} /> : null;
      case "activity":
        return <ActivityTab user={user} />;
      default:
        return null;
    }
  };

  // Use basic user data for header while loading full details
  const displayName = user?.full_name || basicUser?.name || "User";
  const displayUsername = user?.username || basicUser?.username || "";
  const displayRole = user?.role || basicUser?.role || "";
  const displayIsActive = user?.is_active ?? basicUser?.is_active ?? true;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => {
          if (isEditing && hasChanges()) {
            if (
              window.confirm(
                "You have unsaved changes. Are you sure you want to close?"
              )
            ) {
              onClose(false);
            }
          } else {
            onClose(false);
          }
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal Container */}
        <div
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ═══════════════════════════════════════════════════════
              HEADER
          ═══════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
            <div className="flex items-center justify-between">
              {/* User Info */}
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
                    <h2 className="text-white text-lg font-semibold">
                      {displayName}
                    </h2>
                    {/* Role Badge */}
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                      {displayRole}
                    </span>
                    {/* Active/Inactive Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        displayIsActive
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-red-500/20 text-red-200"
                      }`}
                    >
                      {getActiveStatusLabel(displayIsActive)}
                    </span>
                    {/* Unsaved Changes Indicator */}
                    {isEditing && hasChanges() && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 flex items-center gap-1">
                        <AlertCircle size={10} />
                        Unsaved
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">@{displayUsername}</p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {/* Edit / Save / Cancel Buttons - Only for Profile tab */}
                {activeTab === "profile" && !loadingUser && user && (
                  <>
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saveLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                     bg-white/20 text-white hover:bg-white/30 transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveChanges}
                          disabled={saveLoading || !hasChanges()}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                     bg-emerald-500 text-white hover:bg-emerald-600 transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saveLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          {saveLoading ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                   bg-white/20 text-white hover:bg-white/30 transition-all"
                      >
                        <Pencil size={16} />
                        Edit Details
                      </button>
                    )}
                  </>
                )}

                {/* Close */}
                <button
                  onClick={() => {
                    if (isEditing && hasChanges()) {
                      if (
                        window.confirm(
                          "You have unsaved changes. Are you sure you want to close?"
                        )
                      ) {
                        onClose(false);
                      }
                    } else {
                      onClose(false);
                    }
                  }}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
                >
                  <X size={20} className="text-red-200" />
                </button>
              </div>
            </div>
          </div>

          {/* Save Error Banner */}
          {saveError && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              {saveError}
              <button
                onClick={() => setSaveError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TABS
          ═══════════════════════════════════════════════════════ */}
          <div className="flex gap-1 px-6 pt-4 bg-white border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    // Warn about unsaved changes when switching tabs
                    if (isEditing && hasChanges() && tab.id !== "profile") {
                      if (
                        !window.confirm(
                          "You have unsaved changes. Switch tab anyway?"
                        )
                      ) {
                        return;
                      }
                      setIsEditing(false);
                      setFormData(originalFormData);
                    }
                    setActiveTab(tab.id);
                    if (tab.id !== "profile") {
                      setIsEditing(false);
                    }
                  }}
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
                </button>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════════════
              CONTENT
          ═══════════════════════════════════════════════════════ */}
          <div className="p-4 h-[60vh] overflow-auto bg-gray-50">
            {renderTabContent()}
          </div>

          {/* ═══════════════════════════════════════════════════════
              FOOTER - Admin Actions
          ═══════════════════════════════════════════════════════ */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between">
              {/* Left: User Meta Info */}
              <p className="text-xs text-gray-400">
                User ID:{" "}
                {user?.user_id?.slice(0, 8) || basicUser?.id?.slice(0, 8)}... •
                Last login:{" "}
                {user?.last_login_at
                  ? new Date(user.last_login_at).toLocaleDateString()
                  : basicUser?.lastLogin || "Never"}
              </p>

              {/* Right: Admin Actions */}
              <div className="flex items-center gap-2">
                {/* Reset Password Button - Only for Super Admin */}
                {canResetPassword && (
                  <button
                    onClick={() => setShowResetPasswordConfirm(true)}
                    disabled={loadingUser || !user}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                               bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <KeyRound size={16} />
                    Reset Password
                  </button>
                )}

                {/* Suspend / Activate Button */}
                <button
                  onClick={() => setShowSuspendConfirm(true)}
                  disabled={loadingUser || !user}
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
                      Suspend Account
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Activate Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CONFIRMATION DIALOGS
      ═══════════════════════════════════════════════════════ */}

      {/* Suspend/Activate Confirmation */}
      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => setShowSuspendConfirm(false)}
        onConfirm={handleSuspendConfirm}
        title={displayIsActive ? "Suspend User?" : "Activate User?"}
        message={
          displayIsActive
            ? `Are you sure you want to suspend "${displayName}"? They will not be able to log in until reactivated.`
            : `Are you sure you want to activate "${displayName}"? They will regain access to their account.`
        }
        confirmText={displayIsActive ? "Suspend" : "Activate"}
        cancelText="Cancel"
        type={displayIsActive ? "warning" : "success"}
        loading={suspendLoading}
      />

      {/* Reset Password Confirmation - Only rendered for Super Admin */}
      {canResetPassword && (
        <ConfirmDialog
          isOpen={showResetPasswordConfirm}
          onClose={() => setShowResetPasswordConfirm(false)}
          onConfirm={handleResetPasswordConfirm}
          title="Reset Password?"
          message={
            <span>
              Send a password reset link to{" "}
              <strong>{user?.email || basicUser?.email}</strong>?
              <br />
              <span className="text-gray-400 text-sm mt-1 block">
                The user will receive an email with instructions to create a new
                password.
              </span>
            </span>
          }
          confirmText="Send Reset Link"
          cancelText="Cancel"
          type="info"
          loading={resetPasswordLoading}
        />
      )}
    </>
  );
};

export default UserDetailsModal;

