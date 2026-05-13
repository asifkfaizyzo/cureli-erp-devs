// src/pages/sales/billing/components/CustomerDetailsCard.jsx

import { useState, useCallback } from "react";
import {
  User,
  MapPin,
  CreditCard,
  Smartphone,
  Stethoscope,
  UserCircle,
  Search,
  Wallet,
  IndianRupee,
  Truck,
  Check,
  Copy,
  Receipt,
} from "lucide-react";

// ============================================
// ANIMATED INPUT COMPONENT
// ============================================
const AnimatedInput = ({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  readOnly = false,
  className = "",
  type = "text",
  prefix = "",
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div className={`relative ${className}`}>
      <label
        className={`absolute left-3 transition-all duration-200 pointer-events-none z-10
        ${isFocused || hasValue ? "-top-2 text-[9px] bg-white px-1 font-semibold" : "top-1/2 -translate-y-1/2 text-[10px]"}
        ${isFocused ? "text-indigo-600" : disabled ? "text-gray-400" : "text-gray-500"}
        ${Icon ? "left-8" : "left-3"}`}
      >
        {label}
      </label>

      {Icon && (
        <div
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused ? "text-indigo-500" : disabled ? "text-gray-300" : "text-gray-400"}`}
        >
          <Icon size={14} strokeWidth={1.5} />
        </div>
      )}

      {prefix && (
        <span
          className={`absolute left-8 top-1/2 -translate-y-1/2 text-[11px] text-gray-500 font-medium`}
        >
          {prefix}
        </span>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={isFocused ? placeholder : ""}
        readOnly={readOnly}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full h-9 text-[11px] rounded-lg border transition-all duration-200 outline-none
          ${Icon ? "pl-8" : "pl-3"} ${prefix ? "pl-12" : ""} pr-3
          ${
            disabled
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              : readOnly
                ? "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                : isFocused
                  ? "border-indigo-400 ring-2 ring-indigo-100 bg-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
          }`}
      />
    </div>
  );
};

// ============================================
// TOGGLE CHECKBOX COMPONENT
// ============================================
const ToggleCheckbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none group">
    <div
      className={`
      w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150
      ${
        checked
          ? "bg-indigo-500 border-indigo-500"
          : "bg-white border-gray-300 group-hover:border-indigo-400"
      }
    `}
    >
      {checked && <Check size={10} className="text-white" strokeWidth={3} />}
    </div>
    <span
      className={`text-[10px] font-medium transition-colors ${checked ? "text-indigo-700" : "text-gray-600"}`}
    >
      {label}
    </span>
  </label>
);

// ============================================
// MAIN COMPONENT
// ============================================
const CustomerDetailsCard = ({
  customer,
  setCustomer,
  onSearchCustomer,
  netAmount = 0,
  isLoading = false,
  billNo = "AUTO-000001",
}) => {
  //  FIXED: Use the prop directly, don't redeclare
  const cashReceived = parseFloat(customer?.cashReceived) || 0;

  //  Calculate balance using the netAmount prop
  const balance =
    customer?.paymentType === "CREDIT" ? 0 : netAmount - cashReceived;

  // Handle field update
  const updateField = useCallback(
    (field, value) => {
      setCustomer((prev) => {
        const updated = { ...prev, [field]: value };

        if (field === "name" && prev.sameAsCustomer) {
          updated.patientName = value;
        }

        if (field === "sameAsCustomer" && value === true) {
          updated.patientName = prev.name;
        }

        return updated;
      });
    },
    [setCustomer],
  );

  // Handle "Same as Customer" toggle
  const handleSameAsCustomer = useCallback(
    (checked) => {
      updateField("sameAsCustomer", checked);
    },
    [updateField],
  );

  // Copy customer to patient manually
  const copyCustomerToPatient = useCallback(() => {
    if (customer.name) {
      updateField("patientName", customer.name);
    }
  }, [customer.name, updateField]);

  // ============================================
  // SKELETON LOADING
  // ============================================
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full h-full flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-200 animate-pulse" />
            <div className="w-28 h-4 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-4 flex-1">
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div
                key={i}
                className="h-9 bg-slate-100 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full h-full flex flex-col overflow-visible">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <User size={14} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800">
                Customer & Payment Details
              </h3>
              <p className="text-[9px] text-gray-500">
                Bill & prescription information
              </p>
            </div>
          </div>

          <button
            onClick={onSearchCustomer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors text-[10px] font-medium border border-indigo-200"
          >
            <Search size={12} />
            Search Customer
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1 overflow-visible">
        {/* ROW 1: Bill No, Doctor, Customer Name, Mobile */}
        <div className="grid grid-cols-12 gap-3">
          {/* Bill No - 2 cols */}
          <div className="col-span-2">
            <div className="relative">
              <label className="absolute left-8 -top-2 text-[9px] bg-white px-1 font-semibold text-indigo-600 z-10">
                Bill No
              </label>
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500">
                <Receipt size={14} strokeWidth={1.5} />
              </div>
              <input
                type="text"
                value={billNo}
                readOnly
                className="w-full h-9 pl-8 pr-3 text-[11px] rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold cursor-not-allowed outline-none"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                  AUTO
                </span>
              </div>
            </div>
          </div>

          {/* Doctor Name - 3 cols */}
          <div className="col-span-3">
            <AnimatedInput
              label="Doctor Name"
              value={customer.doctorName}
              onChange={(e) => updateField("doctorName", e.target.value)}
              placeholder="Dr. Name"
              icon={Stethoscope}
            />
          </div>

          {/* Customer Name - 4 cols */}
          <div className="col-span-4">
            <AnimatedInput
              label="Customer Name"
              value={customer.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Registered customer"
              icon={User}
              readOnly={!!customer.customer_id}
            />
          </div>

          {/* Mobile Number - 3 cols */}
          <div className="col-span-3">
            <AnimatedInput
              label="Mobile"
              value={customer.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+91 98765 43210"
              icon={Smartphone}
              type="tel"
            />
          </div>
        </div>

        {/* ROW 2: Patient Name, Payment Details */}
        <div className="grid grid-cols-12 gap-3">
          {/* Patient Name with Toggle - 4 cols */}
          <div className="col-span-4 relative">
            <AnimatedInput
              label="Patient Name"
              value={customer.patientName}
              onChange={(e) => updateField("patientName", e.target.value)}
              placeholder="Patient name"
              icon={UserCircle}
              disabled={customer.sameAsCustomer}
            />

            {/* Toggle and Copy Button */}
            <div className="absolute -top-2 right-0 flex items-center gap-1 bg-white px-1">
              <ToggleCheckbox
                checked={customer.sameAsCustomer || false}
                onChange={handleSameAsCustomer}
                label="Same as Customer"
              />

              {!customer.sameAsCustomer && customer.name && (
                <button
                  onClick={copyCustomerToPatient}
                  className="p-0.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                  title="Copy customer name"
                >
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Payment Type - 2 cols */}
          <div className="col-span-2 relative">
            <label className="absolute left-8 -top-2 text-[9px] bg-white px-1 font-semibold text-gray-500 z-10">
              Payment
            </label>
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <CreditCard size={14} strokeWidth={1.5} />
            </div>
            <select
              value={customer.paymentType}
              onChange={(e) => updateField("paymentType", e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-[11px] rounded-lg border border-gray-200 bg-white hover:border-gray-300 outline-none transition-all font-medium focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="CASH">💵 Cash</option>
              <option value="CARD">💳 Card</option>
              <option value="UPI">📱 UPI</option>
              <option value="CREDIT">📋 Credit</option>
            </select>
          </div>

          {/* Cash Received - 2 cols */}
          <div className="col-span-2">
            <AnimatedInput
              label="Cash Received"
              value={customer.cashReceived}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d.]/g, "");
                const parts = value.split(".");
                const sanitized =
                  parts.length > 2
                    ? parts[0] + "." + parts.slice(1).join("")
                    : value;
                updateField("cashReceived", sanitized);
              }}
              placeholder="0.00"
              icon={IndianRupee}
              type="text"
            />
          </div>

          {/* Balance Display - 2 cols */}
          <div
            className={`col-span-2 relative h-9 rounded-lg border flex items-center px-3 ${
              customer.paymentType === "CREDIT"
                ? "bg-blue-50 border-blue-200"
                : balance > 0
                  ? "bg-amber-50 border-amber-200"
                  : balance < 0
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
            }`}
          >
            <Wallet
              size={14}
              className={`mr-2 ${
                customer.paymentType === "CREDIT"
                  ? "text-blue-600"
                  : balance > 0
                    ? "text-amber-600"
                    : balance < 0
                      ? "text-green-600"
                      : "text-gray-400"
              }`}
            />
            <div className="flex-1">
              <span className="text-[9px] text-gray-500 block -mb-0.5">
                {customer.paymentType === "CREDIT"
                  ? "Credit Sale"
                  : balance > 0
                    ? "Balance Due"
                    : balance < 0
                      ? "Return"
                      : "Balance"}
              </span>
              <span
                className={`text-[11px] font-bold ${
                  customer.paymentType === "CREDIT"
                    ? "text-blue-700"
                    : balance > 0
                      ? "text-amber-700"
                      : balance < 0
                        ? "text-green-700"
                        : "text-gray-600"
                }`}
              >
                {customer.paymentType === "CREDIT"
                  ? `₹ ${netAmount.toFixed(2)}`
                  : `₹ ${Math.abs(balance).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* E-Way Bill - 2 cols */}
          <div className="col-span-2">
            <AnimatedInput
              label="E-Way Bill"
              value={customer.eWayBillNo || ""}
              onChange={(e) =>
                updateField("eWayBillNo", e.target.value.toUpperCase())
              }
              placeholder="E-Way No"
              icon={Truck}
            />
          </div>
        </div>

        {/* ROW 3: Full Width Address */}
        <div>
          <AnimatedInput
            label="Address"
            value={customer.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Enter complete customer address"
            icon={MapPin}
            className="w-full"
          />
        </div>

        {/* ROW 4: Additional Info */}
        {customer.customer_id && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            {customer.discountPercent > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-[10px] text-green-600">
                  Customer Discount:
                </span>
                <span className="text-[11px] font-bold text-green-700">
                  {customer.discountPercent}%
                </span>
              </div>
            )}
            {customer.gstNumber && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-[10px] text-blue-600">GSTIN:</span>
                <span className="text-[11px] font-mono font-medium text-blue-700">
                  {customer.gstNumber}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailsCard;
