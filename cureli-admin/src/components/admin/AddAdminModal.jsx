import { useEffect, useState, useRef } from "react";
import {
  X,
  Save,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { createAdmin } from "../../api/cadminAdmins";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ANALYST", label: "Analyst" },
  { value: "ACCOUNTING", label: "Accounting" },
];

// FORM INPUT COMPONENT
const FormInput = ({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  maxLength,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-start gap-1">
          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}
      {maxLength && value && (
        <p className="text-xs text-gray-400 text-right">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

// FORM SELECT COMPONENT
const FormSelect = ({ label, value, onChange, options, error, required = false }) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-10 px-3 border rounded-lg text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                   focus:border-indigo-500 transition-all
                   ${error ? "border-red-300 bg-red-50/50" : "border-gray-200"}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600 flex items-start gap-1">
          <AlertCircle size={12} className="mt-0.5" />
          {error}
        </p>
      )}
    </div>
  );
};

// PASSWORD STRENGTH INDICATOR
const PasswordStrength = ({ password }) => {
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { level: strength, label: "Weak", color: "bg-red-500" };
    if (strength <= 3) return { level: strength, label: "Fair", color: "bg-orange-500" };
    if (strength <= 4) return { level: strength, label: "Good", color: "bg-blue-500" };
    return { level: strength, label: "Strong", color: "bg-green-500" };
  };

  const strength = getStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= strength.level ? strength.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-medium ${
          strength.label === "Weak"
            ? "text-red-600"
            : strength.label === "Fair"
            ? "text-orange-600"
            : strength.label === "Good"
            ? "text-blue-600"
            : "text-green-600"
        }`}
      >
        Password Strength: {strength.label}
      </p>
    </div>
  );
};

// MAIN COMPONENT
const AddAdminModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    status: "Active",
    role: "SUPER_ADMIN",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);

  const firstInputRef = useRef(null);

  // RESET ON OPEN/CLOSE
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        username: "",
        phone: "",
        email: "",
        status: "Active",
        role: "SUPER_ADMIN",
        password: "",
        confirmPassword: "",
      });
      setErrors({});
      setTouched({});
      setSaving(false);
      setSuccess(false);
      setApiError(null);
    } else {
      setTimeout(() => firstInputRef.current?.querySelector("input")?.focus(), 100);
    }
  }, [isOpen]);

  // ESC + BODY LOCK
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape" && !saving) onClose(false);
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  // FIELD VALIDATION
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        if (value.length > 100) return "Name must be less than 100 characters";
        break;
      case "username":
        if (!value.trim()) return "Username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(value))
          return "Only letters, numbers, and underscores allowed";
        break;
      case "phone":
        if (!value) return "Phone is required";
        if (!/^\d{10}$/.test(value)) return "Phone must be exactly 10 digits";
        break;
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        break;
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (value.length > 50) return "Password must be less than 50 characters";
        break;
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        break;
      default:
        return "";
    }
    return "";
  };

  // VALIDATE ALL FIELDS
  const validate = () => {
    const e = {};
    const fieldsToValidate = ["name", "username", "phone", "email", "password", "confirmPassword"];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) e[field] = error;
    });

    setErrors(e);
    setTouched(fieldsToValidate.reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    return Object.keys(e).length === 0;
  };

  // HANDLE BLUR
  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field]);
    setErrors({ ...errors, [field]: error });
  };

  // CREATE HANDLER
  const handleCreate = async () => {
    if (!validate()) return;

    setSaving(true);
    setApiError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        phone: formData.phone,
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        status: formData.status,
      };

      const response = await createAdmin(payload);
      const newAdmin = response.data.data;

      // Notify parent
      onCreate?.(newAdmin);

      setSuccess(true);

      // Close after showing success
      setTimeout(() => {
        setSaving(false);
        onClose(true);
      }, 800);
    } catch (err) {
      console.error("Failed to create admin:", err);

      // Handle validation errors from API
      if (err.response?.data?.data?.errors) {
        const apiErrors = {};
        err.response.data.data.errors.forEach((e) => {
          apiErrors[e.field] = e.message;
        });
        setErrors((prev) => ({ ...prev, ...apiErrors }));
      } else {
        setApiError(err.response?.data?.message || "Failed to create admin");
      }

      setSaving(false);
    }
  };

  // SET FIELD VALUE
  const setField = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));

    // Clear error when user starts typing
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }

    // Clear API error when user makes changes
    if (apiError) setApiError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => !saving && onClose(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <UserPlus size={18} />
              <h2 id="modal-title" className="text-lg font-semibold">
                Add New Admin
              </h2>
            </div>
            <button
              onClick={() => !saving && onClose(false)}
              disabled={saving}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 bg-gray-50 max-h-[70vh] overflow-auto">
          {/* API ERROR */}
          {apiError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-6"
          >
            {/* ADMIN DETAILS */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Admin Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div ref={firstInputRef}>
                  <FormInput
                    label="Full Name"
                    value={formData.name}
                    onChange={(v) => setField("name", v)}
                    onBlur={() => handleBlur("name")}
                    error={touched.name ? errors.name : ""}
                    placeholder="Enter full name"
                    required
                    maxLength={100}
                  />
                </div>

                <FormInput
                  label="Username"
                  value={formData.username}
                  onChange={(v) => setField("username", v.toLowerCase())}
                  onBlur={() => handleBlur("username")}
                  error={touched.username ? errors.username : ""}
                  placeholder="Enter username"
                  required
                  maxLength={50}
                />

                <FormInput
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(v) => setField("phone", v.replace(/\D/g, ""))}
                  onBlur={() => handleBlur("phone")}
                  error={touched.phone ? errors.phone : ""}
                  placeholder="10-digit mobile number"
                  required
                  maxLength={10}
                />

                <FormInput
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(v) => setField("email", v)}
                  onBlur={() => handleBlur("email")}
                  error={touched.email ? errors.email : ""}
                  placeholder="admin@example.com"
                  required
                />

                <FormSelect
                  label="Role"
                  value={formData.role}
                  onChange={(v) => setField("role", v)}
                  options={ROLE_OPTIONS}
                  required
                />

                <FormSelect
                  label="Status"
                  value={formData.status}
                  onChange={(v) => setField("status", v)}
                  options={STATUS_OPTIONS}
                  required
                />
              </div>
            </div>

            {/* PASSWORD SETUP */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Password Setup
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(v) => setField("password", v)}
                    onBlur={() => handleBlur("password")}
                    error={touched.password ? errors.password : ""}
                    placeholder="Minimum 8 characters"
                    required
                    maxLength={50}
                  />

                  <FormInput
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(v) => setField("confirmPassword", v)}
                    onBlur={() => handleBlur("confirmPassword")}
                    error={touched.confirmPassword ? errors.confirmPassword : ""}
                    placeholder="Re-enter password"
                    required
                    maxLength={50}
                  />
                </div>

                {formData.password && <PasswordStrength password={formData.password} />}
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-white border-t flex justify-between items-center">
          <p className="text-xs text-gray-400">
            All fields marked with <span className="text-red-500">*</span> are required
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => onClose(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleCreate}
              disabled={saving || success}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-[#05015A] text-white
                       flex items-center gap-2 hover:bg-[#06027a]
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {success ? (
                <>
                  <CheckCircle2 size={16} className="text-green-400" />
                  Created!
                </>
              ) : saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Create Admin
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAdminModal;