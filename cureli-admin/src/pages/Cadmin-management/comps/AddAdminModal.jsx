// frontend/src/pages/Cadmin-management/comps/AddAdminModal.jsx

import { useEffect, useState, useRef } from "react";
import {
  X, Save, Loader2, UserPlus, Eye, EyeOff,
  CheckCircle2, AlertCircle, Shield, Star,
} from "lucide-react";
import { createAdmin, getRoles } from "../../../api/cadminAdmins";
import { getRoleBadgeStyle } from "../../../config/tableConfig";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED FORM COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const FormInput = ({
  label, type = "text", value, onChange, onBlur,
  error, placeholder, required = false, disabled = false, maxLength,
}) => {
  const [showPwd, setShowPwd] = useState(false);
  const inputType = type === "password" && showPwd ? "text" : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`w-full h-10 px-3 ${type === "password" ? "pr-10" : ""}
                     border rounded-lg text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                     focus:border-indigo-500 placeholder:text-gray-400
                     disabled:bg-gray-50 disabled:text-gray-500 transition-all
                     ${error ? "border-red-300 bg-red-50/50" : "border-gray-200"}`}
        />
        {type === "password" && value && (
          <button type="button" tabIndex={-1}
            onClick={() => setShowPwd((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-start gap-1">
          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
};

const FormSelect = ({ label, value, onChange, options, error, required = false, disabled = false }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full h-10 px-3 border rounded-lg text-sm bg-white
                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                 focus:border-indigo-500 transition-all disabled:bg-gray-50
                 ${error ? "border-red-300 bg-red-50/50" : "border-gray-200"}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1">
        <AlertCircle size={12} /> {error}
      </p>
    )}
  </div>
);

const PasswordStrength = ({ password }) => {
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let s = 0;
    if (pwd.length >= 6)  s++;
    if (pwd.length >= 10) s++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
    if (/\d/.test(pwd))   s++;
    if (/[^a-zA-Z0-9]/.test(pwd)) s++;
    if (s <= 2) return { level: s, label: "Weak",   color: "bg-red-500" };
    if (s <= 3) return { level: s, label: "Fair",   color: "bg-orange-500" };
    if (s <= 4) return { level: s, label: "Good",   color: "bg-blue-500" };
    return          { level: s, label: "Strong", color: "bg-green-500" };
  };
  const s = getStrength(password);
  if (!password) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all
            ${i <= s.level ? s.color : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium
        ${s.label === "Weak" ? "text-red-600" : s.label === "Fair" ? "text-orange-600"
        : s.label === "Good" ? "text-blue-600" : "text-green-600"}`}>
        Password Strength: {s.label}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLE PICKER (replaces hardcoded select)
// ─────────────────────────────────────────────────────────────────────────────

function RolePicker({ selectedIds, primaryId, onToggle, onSetPrimary, roles, loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
        <Loader2 size={16} className="animate-spin text-indigo-400" />
        Loading available roles…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 flex items-center gap-2">
        <AlertCircle size={14} /> {error}
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200
                      rounded-xl px-4 py-3 flex items-center gap-2">
        <Shield size={15} />
        No roles exist yet. Create roles in the Roles tab first, or this admin
        will be created with no role assigned.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100
                    rounded-lg px-3 py-2">
        <Star size={11} className="inline mr-1" />
        Select one or more roles. Click the star to set the primary display role.
      </p>
      {roles.map((role) => {
        const isSelected = selectedIds.includes(role.id);
        const isPrimary  = primaryId === role.id;
        return (
          <div key={role.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all
              ${isSelected ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200 hover:border-gray-300"}`}
          >
            <input type="checkbox"
              className="w-4 h-4 rounded accent-indigo-600 cursor-pointer flex-shrink-0"
              checked={isSelected}
              onChange={() => onToggle(role.id)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={getRoleBadgeStyle(role.name)}>{role.name}</span>
                {isPrimary && (
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-yellow-50
                                   text-yellow-700 rounded-full border border-yellow-200
                                   flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> Primary
                  </span>
                )}
              </div>
              {role.description && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{role.description}</p>
              )}
            </div>
            {isSelected && (
              <button type="button"
                onClick={() => onSetPrimary(role.id)}
                title="Set as primary"
                className={`p-1.5 rounded-lg transition-colors flex-shrink-0
                  ${isPrimary ? "text-yellow-500 bg-yellow-50" : "text-gray-300 hover:text-yellow-500 hover:bg-yellow-50"}`}
              >
                <Star size={16} fill={isPrimary ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "Active",   label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const EMPTY_FORM = {
  name:            "",
  username:        "",
  phone:           "",
  email:           "",
  status:          "Active",
  password:        "",
  confirmPassword: "",
};

const AddAdminModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [touched, setTouched]   = useState({});
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState(false);
  const [apiError, setApiError] = useState(null);

  // Role state
  const [availableRoles, setAvailableRoles]   = useState([]);
  const [rolesLoading, setRolesLoading]       = useState(false);
  const [rolesError, setRolesError]           = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [primaryRoleId, setPrimaryRoleId]     = useState(null);

  const firstInputRef = useRef(null);

  // ── Load roles when modal opens ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setFormData(EMPTY_FORM);
      setErrors({});
      setTouched({});
      setSaving(false);
      setSuccess(false);
      setApiError(null);
      setSelectedRoleIds([]);
      setPrimaryRoleId(null);
      return;
    }

    setTimeout(() => firstInputRef.current?.querySelector("input")?.focus(), 100);

    setRolesLoading(true);
    setRolesError(null);
    getRoles()
      .then((res) => setAvailableRoles(res.data.data.roles ?? []))
      .catch((err) => setRolesError(err.response?.data?.message || "Failed to load roles"))
      .finally(() => setRolesLoading(false));
  }, [isOpen]);

  // ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape" && !saving) onClose(false); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  // ── Role handlers ─────────────────────────────────────────────────────────
  const handleRoleToggle = (roleId) => {
    setSelectedRoleIds((prev) => {
      if (prev.includes(roleId)) {
        if (primaryRoleId === roleId) setPrimaryRoleId(null);
        return prev.filter((id) => id !== roleId);
      }
      const next = [...prev, roleId];
      if (!primaryRoleId) setPrimaryRoleId(roleId);
      return next;
    });
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value.trim())       return "Name is required";
        if (value.length < 2)    return "At least 2 characters";
        if (value.length > 100)  return "Max 100 characters";
        break;
      case "username":
        if (!value.trim())                      return "Username is required";
        if (value.length < 3)                   return "At least 3 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(value))    return "Letters, numbers, underscores only";
        break;
      case "phone":
        if (!value)                 return "Phone is required";
        if (!/^\d{10}$/.test(value)) return "Exactly 10 digits";
        break;
      case "email":
        if (!value)                                   return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email";
        break;
      case "password":
        if (!value)              return "Password is required";
        if (value.length < 8)   return "Minimum 8 characters";
        if (value.length > 50)  return "Maximum 50 characters";
        break;
      case "confirmPassword":
        if (!value)                      return "Please confirm password";
        if (value !== formData.password) return "Passwords do not match";
        break;
      default:
        return "";
    }
    return "";
  };

  const validate = () => {
    const fields = ["name","username","phone","email","password","confirmPassword"];
    const e = {};
    fields.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) e[f] = err;
    });
    setErrors(e);
    setTouched(fields.reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    return Object.keys(e).length === 0;
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors((p) => ({ ...p, [field]: validateField(field, formData[field]) }));
  };

  const setField = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (touched[field]) {
      setErrors((p) => ({ ...p, [field]: validateField(field, value) }));
    }
    if (apiError) setApiError(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);

    try {
      const payload = {
        name:     formData.name.trim(),
        username: formData.username.trim(),
        phone:    formData.phone,
        email:    formData.email.trim(),
        password: formData.password,
        status:   formData.status,
        // Optional role assignment at creation time
        ...(selectedRoleIds.length > 0 && {
          role_ids:        selectedRoleIds,
          primary_role_id: primaryRoleId ?? selectedRoleIds[0],
        }),
      };

      const res      = await createAdmin(payload);
      const newAdmin = res.data.data;

      onCreate?.(newAdmin);
      setSuccess(true);
      setTimeout(() => { setSaving(false); onClose(true); }, 800);
    } catch (err) {
      if (err.response?.data?.data?.errors) {
        const apiErrors = {};
        err.response.data.data.errors.forEach((e) => { apiErrors[e.field] = e.message; });
        setErrors((p) => ({ ...p, ...apiErrors }));
      } else {
        setApiError(err.response?.data?.message || "Failed to create admin");
      }
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => !saving && onClose(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col
                   overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <UserPlus size={18} />
              <h2 className="text-lg font-semibold">Add New Admin</h2>
            </div>
            <button onClick={() => !saving && onClose(false)} disabled={saving}
              className="p-2 rounded-lg bg-white/15 text-white hover:bg-red-500/30
                         disabled:opacity-50 transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-5">
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl
                            flex items-center gap-2 text-sm">
              <AlertCircle size={15} /> {apiError}
            </div>
          )}

          {/* Admin Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Admin Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div ref={firstInputRef}>
                <FormInput label="Full Name" value={formData.name}
                  onChange={(v) => setField("name", v)} onBlur={() => handleBlur("name")}
                  error={touched.name ? errors.name : ""} placeholder="Enter full name"
                  required maxLength={100} />
              </div>
              <FormInput label="Username" value={formData.username}
                onChange={(v) => setField("username", v.toLowerCase())} onBlur={() => handleBlur("username")}
                error={touched.username ? errors.username : ""} placeholder="Enter username"
                required maxLength={50} />
              <FormInput label="Phone Number" type="tel" value={formData.phone}
                onChange={(v) => setField("phone", v.replace(/\D/g, ""))} onBlur={() => handleBlur("phone")}
                error={touched.phone ? errors.phone : ""} placeholder="10-digit mobile number"
                required maxLength={10} />
              <FormInput label="Email Address" type="email" value={formData.email}
                onChange={(v) => setField("email", v)} onBlur={() => handleBlur("email")}
                error={touched.email ? errors.email : ""} placeholder="admin@example.com"
                required />
              <FormSelect label="Status" value={formData.status}
                onChange={(v) => setField("status", v)} options={STATUS_OPTIONS} required />
            </div>
          </div>

          {/* Role Assignment */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4
                           flex items-center gap-2">
              <Shield size={13} /> Role Assignment
              <span className="font-normal text-gray-400 normal-case">(optional — can be set later)</span>
            </h3>
            <RolePicker
              roles={availableRoles}
              loading={rolesLoading}
              error={rolesError}
              selectedIds={selectedRoleIds}
              primaryId={primaryRoleId}
              onToggle={handleRoleToggle}
              onSetPrimary={setPrimaryRoleId}
            />
          </div>

          {/* Password */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Password Setup
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Password" type="password" value={formData.password}
                  onChange={(v) => setField("password", v)} onBlur={() => handleBlur("password")}
                  error={touched.password ? errors.password : ""} placeholder="Minimum 8 characters"
                  required maxLength={50} />
                <FormInput label="Confirm Password" type="password" value={formData.confirmPassword}
                  onChange={(v) => setField("confirmPassword", v)} onBlur={() => handleBlur("confirmPassword")}
                  error={touched.confirmPassword ? errors.confirmPassword : ""} placeholder="Re-enter password"
                  required maxLength={50} />
              </div>
              {formData.password && <PasswordStrength password={formData.password} />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t flex justify-between items-center flex-shrink-0">
          <p className="text-xs text-gray-400">
            Fields marked <span className="text-red-500">*</span> are required
          </p>
          <div className="flex gap-2">
            <button onClick={() => onClose(false)} disabled={saving}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg
                         disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving || success}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-[#05015A] text-white
                         flex items-center gap-2 hover:bg-[#06027a]
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {success ? (
                <><CheckCircle2 size={15} className="text-green-400" /> Created!</>
              ) : saving ? (
                <><Loader2 size={15} className="animate-spin" /> Creating…</>
              ) : (
                <><Save size={15} /> Create Admin</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAdminModal;