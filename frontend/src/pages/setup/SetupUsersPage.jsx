// src/pages/setup/SetupUsersPage.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Trash2,
  Phone,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Check,
  Loader2,
  Info,
  Edit2,
  X,
  User,
  Shield,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { useSetupStore } from "../../store/useSetupStore";
import { checkUsernameAvailability, checkPhoneAvailability } from "../../api/setup";

/**
 * SetupUsersPage
 * Step 2: Add Staff and Branch Admin users
 * 
 * Requirements:
 * - Optional step (can skip)
 * - Each user belongs to exactly ONE branch
 * - Super Admin is NOT counted in user limit
 * - Roles: staff, branch_admin
 * - Password is created by Super Admin
 * - Username must be unique (checked against backend)
 */

// Role options
const ROLES = [
  {
    value: "branch_admin",
    label: "Branch Admin",
    description: "Can manage branch operations and staff",
    icon: Shield,
  },
  {
    value: "staff",
    label: "Staff",
    description: "Can perform day-to-day operations",
    icon: User,
  },
];

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SetupUsersPage = () => {
  const navigate = useNavigate();

  // Store
  const {
    users,
    branches,
    planLimits,
    addUser,
    updateUser,
    removeUser,
    setCurrentStep,
  } = useSetupStore();

  // Local state
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "",
    branch_temp_id: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Username availability check
  const [usernameCheckStatus, setUsernameCheckStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const debouncedUsername = useDebounce(formData.username, 500);

  // Phone availability check
  const [phoneCheckStatus, setPhoneCheckStatus] = useState(null);
  const debouncedPhone = useDebounce(formData.phone_number, 500);

  // Dropdown states
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [roleDropdownPosition, setRoleDropdownPosition] = useState(null);
  const [branchDropdownPosition, setBranchDropdownPosition] = useState(null);

  // Refs
  const nameInputRef = useRef(null);
  const roleButtonRef = useRef(null);
  const branchButtonRef = useRef(null);
  const roleDropdownRef = useRef(null);
  const branchDropdownRef = useRef(null);

  // Computed
  const maxUsers = planLimits.max_users;
  const canAddMore = maxUsers === -1 || users.length < maxUsers;

  // Set current step on mount
  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Focus name input when form opens
  useEffect(() => {
    if (showForm && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showForm]);

  // ============================================
  // USERNAME AVAILABILITY CHECK
  // ============================================
  useEffect(() => {
    const checkUsername = async () => {
      const username = debouncedUsername.toLowerCase().trim();
      
      if (!username || username.length < 3) {
        setUsernameCheckStatus(null);
        return;
      }

      // Check if username is valid format
      if (!/^[a-z0-9_]+$/.test(username)) {
        setUsernameCheckStatus(null);
        return;
      }

      // Check locally first (among users being created)
      const existsLocally = users.some(
        (u) => u.username.toLowerCase() === username && u.temp_id !== editingUser?.temp_id
      );
      if (existsLocally) {
        setUsernameCheckStatus("taken");
        return;
      }

      // Check with backend
      setUsernameCheckStatus("checking");
      try {
        const res = await checkUsernameAvailability(username);
        const available = res.data?.data?.available;
        setUsernameCheckStatus(available ? "available" : "taken");
      } catch (err) {
        console.error("Username check error:", err);
        setUsernameCheckStatus(null);
      }
    };

    checkUsername();
  }, [debouncedUsername, users, editingUser]);

  // ============================================
  // PHONE AVAILABILITY CHECK
  // ============================================
  useEffect(() => {
    const checkPhone = async () => {
      const phone = debouncedPhone.replace(/\D/g, "");
      
      if (!phone || phone.length !== 10) {
        setPhoneCheckStatus(null);
        return;
      }

      // Check locally first
      const existsLocally = users.some(
        (u) => u.phone_number === phone && u.temp_id !== editingUser?.temp_id
      );
      if (existsLocally) {
        setPhoneCheckStatus("taken");
        return;
      }

      // Check with backend
      setPhoneCheckStatus("checking");
      try {
        const res = await checkPhoneAvailability(phone);
        const available = res.data?.data?.available;
        setPhoneCheckStatus(available ? "available" : "taken");
      } catch (err) {
        console.error("Phone check error:", err);
        setPhoneCheckStatus(null);
      }
    };

    checkPhone();
  }, [debouncedPhone, users, editingUser]);

  // ============================================
  // DROPDOWN HANDLERS
  // ============================================

  const updateRoleDropdownPosition = useCallback(() => {
    if (roleButtonRef.current) {
      const rect = roleButtonRef.current.getBoundingClientRect();
      setRoleDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const updateBranchDropdownPosition = useCallback(() => {
    if (branchButtonRef.current) {
      const rect = branchButtonRef.current.getBoundingClientRect();
      setBranchDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const handleRoleDropdownToggle = () => {
    if (!roleDropdownOpen) {
      updateRoleDropdownPosition();
      setBranchDropdownOpen(false);
    }
    setRoleDropdownOpen(!roleDropdownOpen);
  };

  const handleBranchDropdownToggle = () => {
    if (!branchDropdownOpen) {
      updateBranchDropdownPosition();
      setRoleDropdownOpen(false);
    }
    setBranchDropdownOpen(!branchDropdownOpen);
  };

  const selectRole = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
    setErrors((prev) => ({ ...prev, role: "" }));
    setRoleDropdownOpen(false);
  };

  const selectBranch = (temp_id) => {
    setFormData((prev) => ({ ...prev, branch_temp_id: temp_id }));
    setErrors((prev) => ({ ...prev, branch_temp_id: "" }));
    setBranchDropdownOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        roleDropdownOpen &&
        roleButtonRef.current &&
        !roleButtonRef.current.contains(e.target) &&
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(e.target)
      ) {
        setRoleDropdownOpen(false);
      }
      if (
        branchDropdownOpen &&
        branchButtonRef.current &&
        !branchButtonRef.current.contains(e.target) &&
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(e.target)
      ) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [roleDropdownOpen, branchDropdownOpen]);

  // Close dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => {
      setRoleDropdownOpen(false);
      setBranchDropdownOpen(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  // ============================================
  // FORM HANDLERS
  // ============================================

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone_number: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "",
      branch_temp_id: branches.length === 1 ? branches[0].temp_id : "",
    });
    setErrors({});
    setEditingUser(null);
    setUsernameCheckStatus(null);
    setPhoneCheckStatus(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const openAddForm = () => {
    if (!canAddMore) return;
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setFormData({
      full_name: user.full_name,
      phone_number: user.phone_number,
      username: user.username,
      password: "", // Don't pre-fill password for security
      confirmPassword: "",
      role: user.role,
      branch_temp_id: user.branch_temp_id,
    });
    setEditingUser(user);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setRoleDropdownOpen(false);
    setBranchDropdownOpen(false);
    resetForm();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Auto-generate username from full name
  const generateUsername = (name) => {
    if (!name) return "";
    return (
      name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "") +
      "_" +
      Date.now().toString().slice(-4)
    );
  };

  const handleNameChange = (value) => {
    handleChange("full_name", value);
    // Auto-generate username if empty
    if (!formData.username && value.length > 2) {
      const suggested = generateUsername(value);
      setFormData((prev) => ({ ...prev, username: suggested }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Name must be at least 2 characters";
    }

    // Phone number
    if (!formData.phone_number) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone_number.replace(/\D/g, ""))) {
      newErrors.phone_number = "Please enter a valid 10-digit phone number";
    } else if (phoneCheckStatus === "taken") {
      newErrors.phone_number = "This phone number is already registered";
    }

    // Username
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-z0-9_]+$/.test(formData.username.toLowerCase())) {
      newErrors.username = "Username can only contain lowercase letters, numbers, and underscores";
    } else if (usernameCheckStatus === "taken") {
      newErrors.username = "This username is already taken";
    }

    // Password (required for new users, optional for edit)
    if (!editingUser) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm the password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else {
      // For edit, if password is provided, validate it
      if (formData.password) {
        if (formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters";
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      }
    }

    // Role
    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    // Branch
    if (!formData.branch_temp_id) {
      newErrors.branch_temp_id = "Please select a branch";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // Check if username/phone checks are still in progress
    if (usernameCheckStatus === "checking" || phoneCheckStatus === "checking") {
      setErrors({ submit: "Please wait for validation to complete" });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const username = formData.username.toLowerCase().trim();

      if (editingUser) {
        // Update existing user
        const updates = {
          full_name: formData.full_name.trim(),
          phone_number: formData.phone_number.replace(/\D/g, ""),
          username,
          role: formData.role,
          branch_temp_id: formData.branch_temp_id,
        };
        // Only update password if provided
        if (formData.password) {
          updates.password = formData.password;
        }
        updateUser(editingUser.temp_id, updates);
      } else {
        // Add new user
        const result = addUser({
          full_name: formData.full_name.trim(),
          phone_number: formData.phone_number.replace(/\D/g, ""),
          username,
          password: formData.password,
          role: formData.role,
          branch_temp_id: formData.branch_temp_id,
        });

        if (!result.success) {
          setErrors({ submit: result.error });
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false);
      closeForm();
    }, 300);
  };

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to remove "${user.full_name}"?`)) {
      removeUser(user.temp_id);
    }
  };

  const handleBack = () => {
    navigate("/setup/branches");
  };

  const handleContinue = () => {
    navigate("/setup/review");
  };

  // Get branch name by temp_id
  const getBranchName = (temp_id) => {
    const branch = branches.find((b) => b.temp_id === temp_id);
    return branch?.branch_name || "Unknown";
  };

  // Get role label
  const getRoleLabel = (value) => {
    const role = ROLES.find((r) => r.value === value);
    return role?.label || value;
  };

  // Get selected role
  const selectedRole = ROLES.find((r) => r.value === formData.role);
  const selectedBranch = branches.find((b) => b.temp_id === formData.branch_temp_id);

  // ============================================
  // RENDER DROPDOWNS
  // ============================================

  const renderRoleDropdown = () => {
    if (!roleDropdownOpen || !roleDropdownPosition) return null;

    return createPortal(
      <div
        ref={roleDropdownRef}
        className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1 overflow-hidden"
        style={{
          top: roleDropdownPosition.top,
          left: roleDropdownPosition.left,
          width: roleDropdownPosition.width,
        }}
      >
        {ROLES.map((role) => {
          const RoleIcon = role.icon;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => selectRole(role.value)}
              className={`
                w-full px-4 py-3 text-left flex items-start gap-3 transition-colors duration-150
                ${
                  formData.role === role.value
                    ? "bg-[#000060]/10"
                    : "hover:bg-gray-50"
                }
              `}
            >
              <RoleIcon
                size={18}
                className={
                  formData.role === role.value ? "text-[#000060]" : "text-gray-400"
                }
              />
              <div className="flex-1">
                <p
                  className={`font-medium text-sm ${
                    formData.role === role.value ? "text-[#000060]" : "text-gray-700"
                  }`}
                >
                  {role.label}
                </p>
                <p className="text-xs text-gray-500">{role.description}</p>
              </div>
              {formData.role === role.value && (
                <Check size={16} className="text-[#000060] flex-shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>,
      document.body
    );
  };

  const renderBranchDropdown = () => {
    if (!branchDropdownOpen || !branchDropdownPosition) return null;

    return createPortal(
      <div
        ref={branchDropdownRef}
        className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1 overflow-hidden max-h-60 overflow-y-auto"
        style={{
          top: branchDropdownPosition.top,
          left: branchDropdownPosition.left,
          width: branchDropdownPosition.width,
        }}
      >
        {branches.map((branch) => (
          <button
            key={branch.temp_id}
            type="button"
            onClick={() => selectBranch(branch.temp_id)}
            className={`
              w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-150
              ${
                formData.branch_temp_id === branch.temp_id
                  ? "bg-[#000060]/10"
                  : "hover:bg-gray-50"
              }
            `}
          >
            <Building2
              size={18}
              className={
                formData.branch_temp_id === branch.temp_id
                  ? "text-[#000060]"
                  : "text-gray-400"
              }
            />
            <span
              className={`font-medium text-sm flex-1 ${
                formData.branch_temp_id === branch.temp_id
                  ? "text-[#000060]"
                  : "text-gray-700"
              }`}
            >
              {branch.branch_name}
            </span>
            {formData.branch_temp_id === branch.temp_id && (
              <Check size={16} className="text-[#000060] flex-shrink-0" />
            )}
          </button>
        ))}
      </div>,
      document.body
    );
  };

  // Render availability status indicator
  const renderAvailabilityStatus = (status) => {
    switch (status) {
      case "checking":
        return (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Loader2 size={12} className="animate-spin" />
            Checking...
          </span>
        );
      case "available":
        return (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 size={12} />
            Available
          </span>
        );
      case "taken":
        return (
          <span className="flex items-center gap-1 text-xs text-red-500">
            <XCircle size={12} />
            Already taken
          </span>
        );
      default:
        return null;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#000060] mb-2">
          Add Your Team
        </h1>
        <p className="text-gray-600">
          Add staff members and branch admins who will use the system. This step is
          optional – you can add users later from settings.
        </p>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
      >
        <div className="flex gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">You create passwords for your team</p>
            <p className="text-blue-600">
              As the Super Admin, you set the login credentials for each user. Share them securely with your team members.
            </p>
          </div>
        </div>
      </motion.div>

      {/* User List */}
      <div className="space-y-3 mb-6">
        <AnimatePresence mode="popLayout">
          {users.map((user) => {
            const RoleIcon = user.role === "branch_admin" ? Shield : User;
            return (
              <motion.div
                key={user.temp_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                layout
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 font-semibold text-lg">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* User Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {user.full_name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                            user.role === "branch_admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <RoleIcon size={10} />
                          {getRoleLabel(user.role)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Phone size={12} />
                          <span>{user.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 size={12} />
                          <span>{getBranchName(user.branch_temp_id)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditForm(user)}
                      className="p-2 text-gray-400 hover:text-[#000060] hover:bg-[#000060]/5 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {users.length === 0 && !showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">No team members yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add staff or branch admins, or skip this step for now
            </p>
            {canAddMore && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg text-sm font-medium hover:bg-[#000080] transition-colors"
              >
                <Plus size={16} />
                Add First User
              </button>
            )}
          </motion.div>
        )}

        {/* Add User Button */}
        {(users.length > 0 || showForm) && canAddMore && !showForm && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={openAddForm}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#000060] hover:text-[#000060] hover:bg-[#000060]/5 transition-all group"
          >
            <Plus size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Add Another User</span>
          </motion.button>
        )}

        {/* Limit Reached Message */}
        {!canAddMore && !showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm"
          >
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>
              User limit reached ({maxUsers} users).
              <a
                href="/pricing"
                className="underline font-medium ml-1 hover:text-amber-800"
              >
                Upgrade your plan
              </a>{" "}
              to add more.
            </span>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                  {editingUser ? "Edit User" : "Add New User"}
                </h3>
                <button
                  onClick={closeForm}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#000060] mb-1">
                    Full Name *
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., John Doe"
                    className={`
                      w-full px-3 py-2.5 bg-white border rounded-lg transition-all duration-200
                      focus:outline-none focus:ring-2
                      ${
                        errors.full_name
                          ? "border-red-500 focus:ring-red-500/20"
                          : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                      }
                    `}
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.full_name}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-[#000060] mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) =>
                        handleChange("phone_number", e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="e.g., 9876543210"
                      maxLength={10}
                      className={`
                        w-full px-3 py-2.5 bg-white border rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2
                        ${
                          errors.phone_number || phoneCheckStatus === "taken"
                            ? "border-red-500 focus:ring-red-500/20"
                            : phoneCheckStatus === "available"
                            ? "border-emerald-500 focus:ring-emerald-500/20"
                            : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                        }
                      `}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {renderAvailabilityStatus(phoneCheckStatus)}
                    </div>
                  </div>
                  {errors.phone_number && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.phone_number}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Used for login OTP verification
                  </p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-[#000060] mb-1">
                    Username *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        handleChange(
                          "username",
                          e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                        )
                      }
                      placeholder="e.g., john_doe"
                      className={`
                        w-full px-3 py-2.5 bg-white border rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2
                        ${
                          errors.username || usernameCheckStatus === "taken"
                            ? "border-red-500 focus:ring-red-500/20"
                            : usernameCheckStatus === "available"
                            ? "border-emerald-500 focus:ring-emerald-500/20"
                            : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                        }
                      `}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {renderAvailabilityStatus(usernameCheckStatus)}
                    </div>
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.username}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Lowercase letters, numbers, and underscores only
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-[#000060] mb-1">
                    Password {editingUser ? "(leave blank to keep current)" : "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder={editingUser ? "Enter new password" : "Min. 8 characters"}
                      className={`
                        w-full px-3 py-2.5 pr-10 bg-white border rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2
                        ${
                          errors.password
                            ? "border-red-500 focus:ring-red-500/20"
                            : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                        }
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-[#000060] mb-1">
                    Confirm Password {editingUser ? "" : "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      placeholder="Re-enter password"
                      className={`
                        w-full px-3 py-2.5 pr-10 bg-white border rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2
                        ${
                          errors.confirmPassword
                            ? "border-red-500 focus:ring-red-500/20"
                            : formData.confirmPassword && formData.password === formData.confirmPassword
                            ? "border-emerald-500 focus:ring-emerald-500/20"
                            : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                        }
                      `}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.confirmPassword}
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Role Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-[#000060] mb-1">
                    Role *
                  </label>
                  <button
                    ref={roleButtonRef}
                    type="button"
                    onClick={handleRoleDropdownToggle}
                    className={`
                      w-full px-3 py-2.5 bg-white border rounded-lg text-left
                      flex items-center justify-between transition-all duration-200
                      ${
                        errors.role
                          ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : roleDropdownOpen
                          ? "border-[#000060] ring-2 ring-[#000060]/20"
                          : "border-gray-300 hover:border-gray-400"
                      }
                    `}
                  >
                    {selectedRole ? (
                      <div className="flex items-center gap-2">
                        <selectedRole.icon size={16} className="text-[#000060]" />
                        <span className="text-gray-900">{selectedRole.label}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Select role</span>
                    )}
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform duration-200 ${
                        roleDropdownOpen ? "rotate-180 text-[#000060]" : ""
                      }`}
                    />
                  </button>
                  {renderRoleDropdown()}
                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* Branch Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-[#000060] mb-1">
                    Assign to Branch *
                  </label>
                  <button
                    ref={branchButtonRef}
                    type="button"
                    onClick={handleBranchDropdownToggle}
                    className={`
                      w-full px-3 py-2.5 bg-white border rounded-lg text-left
                      flex items-center justify-between transition-all duration-200
                      ${
                        errors.branch_temp_id
                          ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                          : branchDropdownOpen
                          ? "border-[#000060] ring-2 ring-[#000060]/20"
                          : "border-gray-300 hover:border-gray-400"
                      }
                    `}
                  >
                    {selectedBranch ? (
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-[#000060]" />
                        <span className="text-gray-900">
                          {selectedBranch.branch_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Select branch</span>
                    )}
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform duration-200 ${
                        branchDropdownOpen ? "rotate-180 text-[#000060]" : ""
                      }`}
                    />
                  </button>
                  {renderBranchDropdown()}
                  {errors.branch_temp_id && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.branch_temp_id}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    This user will only have access to the selected branch
                  </p>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm flex items-center gap-2">
                      <AlertCircle size={16} />
                      {errors.submit}
                    </p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || usernameCheckStatus === "checking" || phoneCheckStatus === "checking"}
                    className="flex items-center gap-2 px-5 py-2 bg-[#000060] text-white font-medium rounded-lg hover:bg-[#000080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        {editingUser ? "Update User" : "Add User"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={18} />
          Back
        </button>

        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500 hidden sm:block">
            {users.length === 0 ? (
              <span className="text-gray-400">No users added (optional)</span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <Check size={14} />
                {users.length} user{users.length > 1 ? "s" : ""} added
              </span>
            )}
          </p>

          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-6 py-3 bg-[#000060] text-white rounded-xl font-semibold hover:bg-[#000080] transition-all shadow-lg shadow-[#000060]/25"
          >
            {users.length === 0 ? "Skip" : "Continue"}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupUsersPage;