// src/pages/setup/SetupOperatorsPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCog,
  Building2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Info,
  Crown,
  User,
  Shield,
} from "lucide-react";

import { useSetupStore } from "../../store/useSetupStore";

/**
 * SetupOperatorsPage
 * Step 3: Assign billing operators per branch
 * 
 * Requirements:
 * - Optional step (SA is default operator)
 * - Each branch has exactly one billing user
 * - Can keep SA or delegate to a branch user
 * - Only users assigned to that branch can be selected
 */

const SetupOperatorsPage = () => {
  const navigate = useNavigate();

  // Store
  const {
    branches,
    users,
    operators,
    superAdmin,
    setOperator,
    getUsersForBranch,
    setCurrentStep,
  } = useSetupStore();

  // Track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState(null);

  // Refs for dropdown buttons
  const buttonRefs = useRef({});
  const dropdownRef = useRef(null);

  // Set current step on mount
  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  // ============================================
  // DROPDOWN HANDLERS
  // ============================================

  const updateDropdownPosition = useCallback((branchTempId) => {
    const button = buttonRefs.current[branchTempId];
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const toggleDropdown = (branchTempId) => {
    if (openDropdown === branchTempId) {
      setOpenDropdown(null);
    } else {
      updateDropdownPosition(branchTempId);
      setOpenDropdown(branchTempId);
    }
  };

  const selectOperator = (branchTempId, operatorId) => {
    setOperator(branchTempId, operatorId);
    setOpenDropdown(null);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown) {
        const button = buttonRefs.current[openDropdown];
        if (
          button &&
          !button.contains(e.target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target)
        ) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => setOpenDropdown(null);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  // ============================================
  // HELPERS
  // ============================================

  const getOperatorInfo = (branchTempId) => {
    const operatorId = operators[branchTempId] || "sa";

    if (operatorId === "sa") {
      return {
        id: "sa",
        name: superAdmin.name || "You",
        role: "super_admin",
        isSuperAdmin: true,
      };
    }

    const user = users.find((u) => u.temp_id === operatorId);
    if (user) {
      return {
        id: user.temp_id,
        name: user.full_name,
        role: user.role,
        isSuperAdmin: false,
      };
    }

    // Fallback to SA if user not found
    return {
      id: "sa",
      name: superAdmin.name || "You",
      role: "super_admin",
      isSuperAdmin: true,
    };
  };

  const getBranchUsers = (branchTempId) => {
    return users.filter((u) => u.branch_temp_id === branchTempId);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "super_admin":
        return Crown;
      case "branch_admin":
        return Shield;
      default:
        return User;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "branch_admin":
        return "Branch Admin";
      case "staff":
        return "Staff";
      default:
        return role;
    }
  };

  // Navigation
  const handleBack = () => {
    navigate("/setup/users");
  };

  const handleContinue = () => {
    navigate("/setup/review");
  };

  // ============================================
  // RENDER DROPDOWN
  // ============================================

  const renderDropdown = () => {
    if (!openDropdown || !dropdownPosition) return null;

    const branchUsers = getBranchUsers(openDropdown);
    const currentOperatorId = operators[openDropdown] || "sa";

    return createPortal(
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl py-2 overflow-hidden"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          minWidth: 280,
        }}
      >
        {/* Super Admin Option */}
        <div className="px-3 pb-2 mb-2 border-b border-gray-100">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">
            Default
          </p>
          <button
            onClick={() => selectOperator(openDropdown, "sa")}
            className={`
              w-full px-3 py-2.5 text-left flex items-center gap-3 rounded-lg transition-colors
              ${
                currentOperatorId === "sa"
                  ? "bg-[#000060]/10"
                  : "hover:bg-gray-50"
              }
            `}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentOperatorId === "sa"
                  ? "bg-[#000060] text-white"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <Crown size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm truncate ${
                  currentOperatorId === "sa" ? "text-[#000060]" : "text-gray-800"
                }`}
              >
                {superAdmin.name || "You"}{" "}
                <span className="text-gray-400 font-normal">(You)</span>
              </p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
            {currentOperatorId === "sa" && (
              <Check size={16} className="text-[#000060] flex-shrink-0" />
            )}
          </button>
        </div>

        {/* Branch Users */}
        {branchUsers.length > 0 ? (
          <div className="px-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-1">
              Branch Users
            </p>
            <div className="space-y-1">
              {branchUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const isSelected = currentOperatorId === user.temp_id;

                return (
                  <button
                    key={user.temp_id}
                    onClick={() => selectOperator(openDropdown, user.temp_id)}
                    className={`
                      w-full px-3 py-2.5 text-left flex items-center gap-3 rounded-lg transition-colors
                      ${isSelected ? "bg-[#000060]/10" : "hover:bg-gray-50"}
                    `}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isSelected
                          ? "bg-[#000060] text-white"
                          : user.role === "branch_admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <RoleIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm truncate ${
                          isSelected ? "text-[#000060]" : "text-gray-800"
                        }`}
                      >
                        {user.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRoleLabel(user.role)}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-[#000060] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-gray-500">
              No users assigned to this branch
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Add users in the previous step to assign them as operators
            </p>
          </div>
        )}
      </motion.div>,
      document.body
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full max-w-3xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#000060] mb-2">
          Assign Branch Operators
        </h1>
        <p className="text-gray-600">
          Choose who handles billing for each branch. By default, you're assigned as
          the billing operator for all branches.
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
            <p className="font-medium mb-1">What is a billing operator?</p>
            <p className="text-blue-600">
              The billing operator is the primary user responsible for creating
              invoices and managing sales for a branch. You can keep yourself as the
              operator or delegate to staff members.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Branch Cards */}
      <div className="space-y-4 mb-6">
        {branches.map((branch, index) => {
          const operator = getOperatorInfo(branch.temp_id);
          const branchUsers = getBranchUsers(branch.temp_id);
          const OperatorIcon = getRoleIcon(operator.role);
          const isDropdownOpen = openDropdown === branch.temp_id;

          return (
            <motion.div
              key={branch.temp_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Branch Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-[#000060]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 size={24} className="text-[#000060]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {branch.branch_name}
                      </h3>
                      {index === 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    {branch.address && (
                      <p className="text-sm text-gray-500 truncate">
                        {branch.address}
                      </p>
                    )}
                    {branchUsers.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {branchUsers.length} user{branchUsers.length > 1 ? "s" : ""}{" "}
                        in this branch
                      </p>
                    )}
                  </div>
                </div>

                {/* Operator Selector */}
                <div className="sm:w-64">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Billing Operator
                  </label>
                  <button
                    ref={(el) => (buttonRefs.current[branch.temp_id] = el)}
                    onClick={() => toggleDropdown(branch.temp_id)}
                    className={`
                      w-full px-3 py-2.5 bg-white border rounded-xl text-left
                      flex items-center gap-3 transition-all duration-200
                      ${
                        isDropdownOpen
                          ? "border-[#000060] ring-2 ring-[#000060]/20"
                          : "border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        operator.isSuperAdmin
                          ? "bg-amber-100 text-amber-700"
                          : operator.role === "branch_admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <OperatorIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">
                        {operator.name}
                        {operator.isSuperAdmin && (
                          <span className="text-gray-400 font-normal ml-1">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRoleLabel(operator.role)}
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180 text-[#000060]" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dropdown Portal */}
      <AnimatePresence>{openDropdown && renderDropdown()}</AnimatePresence>

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
            <span className="text-emerald-600 flex items-center gap-1">
              <Check size={14} />
              All branches have operators assigned
            </span>
          </p>

          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-6 py-3 bg-[#000060] text-white rounded-xl font-semibold hover:bg-[#000080] transition-all shadow-lg shadow-[#000060]/25"
          >
            Continue
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupOperatorsPage;