// src/pages/purchase/billing/components/SupplierDetailsCard.jsx
import { useState, useRef, useEffect } from "react";
import { 
  Building2, 
  FileText, 
  Calendar, 
  Search,
  X,
  ChevronUp,
  Clock,
  Wallet,
  Receipt,
  MapPin,
  CheckCircle2,
  Hash,
  Plus,
  Phone,
  AlertCircle,
  CreditCard  // ✅ ADDED
} from "lucide-react";

// ============================================
// SKELETON COMPONENTS
// ============================================
const SkeletonInput = ({ delay = 0 }) => (
  <div className="relative h-9 rounded-lg border border-gray-200 bg-gray-50 flex items-center gap-2 px-3 overflow-hidden">
    <div 
      className="w-4 h-4 bg-slate-200 rounded animate-pulse" 
      style={{ animationDelay: `${delay}ms` }}
    />
    <div 
      className="flex-1 h-3 bg-slate-200 rounded animate-pulse" 
      style={{ animationDelay: `${delay + 50}ms` }}
    />
  </div>
);

// ============================================
// ANIMATED INPUT COMPONENT
// ============================================
const AnimatedInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text", 
  icon: Icon,
  readOnly = false,
  className = "",
  inputClassName = "",
  error = false,
  success = false,
  prefix = "",
  suffix = "",
  highlight = false,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;
  
  return (
    <div className={`relative ${className}`}>
      <label 
        className={`
          absolute left-3 transition-all duration-200 pointer-events-none z-10
          ${isFocused || hasValue 
            ? '-top-2 text-[9px] bg-white px-1 font-semibold' 
            : 'top-1/2 -translate-y-1/2 text-[10px]'
          }
          ${isFocused 
            ? 'text-indigo-600' 
            : error 
              ? 'text-red-500' 
              : success 
                ? 'text-green-600' 
                : highlight
                  ? 'text-indigo-600'
                  : 'text-gray-500'
          }
          ${Icon ? 'left-8' : 'left-3'}
        `}
      >
        {label}
      </label>
      
      {Icon && (
        <div className={`
          absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200
          ${isFocused ? 'text-indigo-500' : highlight ? 'text-indigo-500' : 'text-gray-400'}
        `}>
          <Icon size={14} strokeWidth={1.5} />
        </div>
      )}
      
      {prefix && (
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[11px] ${Icon ? 'left-8' : 'left-3'} ${highlight ? 'text-indigo-500 font-medium' : 'text-gray-400'}`}>
          {prefix}
        </span>
      )}
      
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={isFocused ? placeholder : ""}
        readOnly={readOnly}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full h-9 text-[11px] rounded-lg border transition-all duration-200 outline-none
          ${Icon ? 'pl-8' : 'pl-3'} 
          ${suffix ? 'pr-8' : 'pr-3'}
          ${prefix && Icon ? 'pl-12' : prefix ? 'pl-7' : ''}
          ${readOnly 
            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' 
            : isFocused
              ? 'border-indigo-400 ring-2 ring-indigo-100 bg-white'
              : error
                ? 'border-red-300 bg-red-50'
                : success
                  ? 'border-green-300 bg-green-50'
                  : highlight
                    ? 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-300'
                    : 'border-gray-200 bg-white hover:border-gray-300'
          }
          ${highlight ? 'font-semibold text-indigo-700' : ''}
          ${inputClassName}
        `}
        {...props}
      />
      
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">
          {suffix}
        </span>
      )}
      
      {success && (
        <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
      )}
    </div>
  );
};

// ============================================
// SEARCHABLE SELECT COMPONENT
// ============================================
const SearchableSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder,
  icon: Icon,
  displayKey = "name",
  onSelect,
  onAddNew,
  className = "",
  dropDirection = "up",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(opt => 
    opt[displayKey]?.toLowerCase().includes(search.toLowerCase()) ||
    opt.gst?.toLowerCase().includes(search.toLowerCase()) ||
    opt.gstNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = options.some(opt => 
    opt[displayKey]?.toLowerCase() === search.toLowerCase().trim()
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current && value) {
      const selectedIndex = filteredOptions.findIndex(opt => opt[displayKey] === value);
      if (selectedIndex > -1) {
        const items = dropdownRef.current.querySelectorAll('[data-option]');
        if (items[selectedIndex]) {
          items[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
      }
    }
  }, [isOpen, value, filteredOptions, displayKey]);

  const handleSelect = (option) => {
    onChange(option[displayKey]);
    onSelect?.(option);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    onSelect?.(null);
    setSearch("");
  };

  const handleAddNewSupplier = () => {
    const trimmedSearch = search.trim();
    if (trimmedSearch && onAddNew) {
      onAddNew(trimmedSearch);
      setIsOpen(false);
      setSearch("");
    }
  };

  const hasValue = value && value.length > 0;
  const isEmpty = options.length === 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <label 
        className={`
          absolute left-3 transition-all duration-200 pointer-events-none z-20
          ${isFocused || hasValue || isOpen
            ? '-top-2 text-[9px] bg-white px-1 font-semibold' 
            : 'top-1/2 -translate-y-1/2 text-[10px]'
          }
          ${isFocused || isOpen ? 'text-indigo-600' : 'text-gray-500'}
          ${Icon ? 'left-8' : 'left-3'}
        `}
      >
        {label}
      </label>

      {Icon && (
        <div className={`
          absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10
          ${isFocused || isOpen ? 'text-indigo-500' : 'text-gray-400'}
        `}>
          <Icon size={14} strokeWidth={1.5} />
        </div>
      )}

      <div
        onClick={() => {
          if (!isEmpty) {
            setIsOpen(true);
            setIsFocused(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className={`
          w-full h-9 flex items-center justify-between rounded-lg border cursor-pointer
          transition-all duration-200
          ${Icon ? 'pl-8' : 'pl-3'} pr-3
          ${isEmpty 
            ? 'border-red-300 bg-red-50 cursor-not-allowed' 
            : isOpen 
              ? 'border-indigo-400 ring-2 ring-indigo-100 bg-white' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }
        `}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 outline-none text-[11px] bg-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
                setSearch("");
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredOptions.length > 0) {
                  handleSelect(filteredOptions[0]);
                } else if (search.trim() && onAddNew) {
                  handleAddNewSupplier();
                }
              }
            }}
          />
        ) : (
          <span className={`text-[11px] truncate ${
            isEmpty 
              ? 'text-red-600 font-medium' 
              : value 
                ? 'text-gray-900 font-medium' 
                : 'text-gray-400'
          }`}>
            {isEmpty ? 'No suppliers available - Add one first' : value || ""}
          </span>
        )}
        
        <div className="flex items-center gap-1 ml-1">
          {isEmpty && (
            <AlertCircle size={14} className="text-red-500" />
          )}
          {value && !isOpen && !isEmpty && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Clear selection"
            >
              <X size={12} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
          {!isEmpty && (
            <ChevronUp 
              size={14} 
              className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          )}
        </div>
      </div>

      {isOpen && !isEmpty && (
        <div 
          ref={dropdownRef}
          className={`
            absolute left-0 right-0 bg-white border border-gray-200 rounded-xl 
            shadow-xl z-50 max-h-52 overflow-auto
            ${dropDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}
          `}
          style={{
            boxShadow: dropDirection === 'up' 
              ? '0 -10px 40px -5px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)'
              : '0 10px 40px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {search && (
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 sticky top-0">
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <Search size={10} />
                <span>Searching for "{search}"</span>
                <span className="ml-auto bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[9px] font-medium">
                  {filteredOptions.length} found
                </span>
              </div>
            </div>
          )}

          {filteredOptions.length > 0 ? (
            <div className="py-1">
              {filteredOptions.map((option, idx) => (
                <div
                  key={option.id || option.supplier_id || idx}
                  data-option
                  onClick={() => handleSelect(option)}
                  className={`
                    px-3 py-2.5 cursor-pointer transition-all duration-150
                    hover:bg-indigo-50 group
                    ${value === option[displayKey] 
                      ? 'bg-indigo-50 border-l-2 border-indigo-500' 
                      : 'border-l-2 border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] font-medium truncate ${value === option[displayKey] ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {option[displayKey]}
                      </div>
                      {(option.gst || option.gstNumber) && (
                        <div className="text-[9px] text-gray-400 mt-0.5 font-mono">
                          GST: {option.gst || option.gstNumber}
                        </div>
                      )}
                      {option.address && (
                        <div className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin size={8} />
                          <span className="truncate">{option.address}</span>
                        </div>
                      )}
                    </div>
                    {value === option[displayKey] && (
                      <CheckCircle2 size={14} className="text-indigo-500 shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <Search size={18} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-[11px] font-medium">No suppliers found</p>
              <p className="text-gray-400 text-[10px] mt-0.5">Press Enter to add new supplier</p>
            </div>
          )}

          {search && !exactMatch && onAddNew && (
            <div className="border-t border-gray-100 px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50">
              <button 
                className="w-full text-left text-[10px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-indigo-100 transition-colors"
                onClick={handleAddNewSupplier}
              >
                <span className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
                  <Plus size={12} />
                </span>
                <span className="truncate">Add "<strong>{search}</strong>" as new supplier</span>
                <span className="ml-auto text-[9px] text-indigo-400 bg-white px-1.5 py-0.5 rounded shrink-0">
                  Enter
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// DATE INPUT COMPONENT
// ============================================
const DateInput = ({ label, value, onChange, className = "" }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.length > 0;
  
  return (
    <div className={`relative ${className}`}>
      <label 
        className={`
          absolute left-8 transition-all duration-200 pointer-events-none z-10
          ${isFocused || hasValue 
            ? '-top-2 text-[9px] bg-white px-1 font-semibold' 
            : 'top-1/2 -translate-y-1/2 text-[10px]'
          }
          ${isFocused ? 'text-indigo-600' : 'text-gray-500'}
        `}
      >
        {label}
      </label>
      
      <div className={`
        absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200
        ${isFocused ? 'text-indigo-500' : 'text-gray-400'}
      `}>
        <Calendar size={14} strokeWidth={1.5} />
      </div>
      
      <input
        type="date"
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full h-9 pl-8 pr-3 text-[11px] rounded-lg border transition-all duration-200 outline-none
          ${isFocused
            ? 'border-indigo-400 ring-2 ring-indigo-100 bg-white'
            : 'border-gray-200 bg-white hover:border-gray-300'
          }
        `}
      />
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const SupplierDetailsCard = ({ 
  supplier, 
  setSupplier, 
  suppliersList = [], 
  onSupplierSelect,
  onAddNewSupplier,
  onFieldChange, // ✅ Prop for field changes
  isLoading = false,
  isLocked = false,
}) => {
  // ✅ UPDATED: Use onFieldChange if provided, otherwise update directly
  const updateField = (field, value) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    } else {
      setSupplier(prev => ({ ...prev, [field]: value }));
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleSupplierSelect = (selectedSupplier) => {
    if (selectedSupplier) {
      const updates = {
        supplier_id: selectedSupplier.supplier_id || selectedSupplier.id,
        supplierName: selectedSupplier.name,
        supplierGST: selectedSupplier.gstNumber || selectedSupplier.gst || "",
        supplierPhone: selectedSupplier.officePhone || selectedSupplier.personalPhone || "",
        address: selectedSupplier.address || "",
      };

      // Update all fields at once
      setSupplier(prev => ({ ...prev, ...updates }));
      onSupplierSelect?.(selectedSupplier);
    }
  };

  // ============================================
  // SKELETON LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full h-full flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-200 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="w-28 h-4 bg-slate-200 rounded animate-pulse" />
              <div className="w-40 h-2.5 bg-slate-200 rounded animate-pulse" style={{ animationDelay: '50ms' }} />
            </div>
          </div>
        </div>

        {/* Body Skeleton */}
        <div className="p-4 flex flex-col gap-4 flex-1">
          {/* Row 1 */}
          <div className="grid grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonInput key={`row1-${i}`} delay={i * 50} />
            ))}
          </div>

          {/* Row 2 - 6 columns */}
          <div className="grid grid-cols-6 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonInput key={`row2-${i}`} delay={(i + 5) * 50} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // NORMAL RENDER
  // ============================================
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full h-full flex flex-col overflow-visible">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Building2 size={14} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-gray-800">Supplier Details</h3>
            <p className="text-[9px] text-gray-500">Invoice & Payment Information</p>
          </div>
          {suppliersList.length > 0 && (
  <div className="flex items-center gap-1.5">
    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-[9px] text-green-700 font-medium">
      <CheckCircle2 size={10} />
      {suppliersList.length} suppliers
    </div>
    {/* ✅ NEW: Show if filtered by branch */}
    {!isLocked && (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-[9px] text-blue-700 font-medium">
        <Building2 size={10} />
        Branch filtered
      </div>
    )}
  </div>
)}
          {suppliersList.length === 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 border border-red-200 rounded text-[9px] text-red-700 font-medium">
              <AlertCircle size={10} />
              No suppliers
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4 flex-1 overflow-visible">
        
        {/* Row 1 */}
        <div className="grid grid-cols-5 gap-3">
          <div className="relative">
            <AnimatedInput
              label="Purchase ID"
              value={supplier.purchaseId || "NEW"}
              readOnly
              icon={Hash}
              highlight={!!supplier.purchaseId}
              inputClassName="font-mono tracking-wide"
            />
            {supplier.purchaseId && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <CheckCircle2 size={12} className="text-green-500" />
              </div>
            )}
          </div>
          
          <SearchableSelect
            label="Supplier Name *"
            value={supplier.supplierName}
            onChange={(val) => updateField("supplierName", val)}
            options={suppliersList}
            placeholder="Search supplier..."
            icon={Building2}
            dropDirection="up"
            onAddNew={onAddNewSupplier}
            onSelect={handleSupplierSelect}
            required
          />
          
          <AnimatedInput
            label="Supplier Invoice No"
            value={supplier.invoiceNo}
            onChange={(e) => updateField("invoiceNo", e.target.value)}
            placeholder="INV-2025-001"
            icon={FileText}
          />
          
          <DateInput
            label="Invoice Date"
            value={formatDateForInput(supplier.invoiceDate)}
            onChange={(e) => updateField("invoiceDate", e.target.value)}
          />
          
          <DateInput
            label="Received On"
            value={formatDateForInput(supplier.receivedOn)}
            onChange={(e) => updateField("receivedOn", e.target.value)}
          />
        </div>

        {/* Row 2 - ✅ UPDATED to 6 columns */}
        <div className="grid grid-cols-6 gap-3">
          <AnimatedInput
            label="Supplier GST"
            value={supplier.supplierGST}
            onChange={(e) => updateField("supplierGST", e.target.value.toUpperCase())}
            placeholder="29ABCDE1234F1Z5"
            icon={Receipt}
            inputClassName="font-mono tracking-wide"
            success={supplier.supplierGST?.length === 15}
          />
          
          <AnimatedInput
            label="Phone Number"
            value={supplier.supplierPhone}
            onChange={(e) => updateField("supplierPhone", e.target.value)}
            placeholder="+91 98765 43210"
            icon={Phone}
          />
          
          <AnimatedInput
            label="Credit Days"
            value={supplier.creditDays}
            onChange={(e) => updateField("creditDays", e.target.value)}
            placeholder="30"
            type="number"
            icon={Clock}
            suffix="days"
          />

          {/* ✅ NEW: Payment Mode Select */}
          <div className="relative">
            <label 
              className={`
                absolute left-3 transition-all duration-200 pointer-events-none z-10
                ${supplier.paymentMode 
                  ? '-top-2 text-[9px] bg-white px-1 font-semibold text-indigo-600' 
                  : 'top-1/2 -translate-y-1/2 text-[10px] text-gray-500'
                }
                left-8
              `}
            >
              Payment Mode
            </label>
            
            <div className={`
              absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200
              ${supplier.paymentMode ? 'text-indigo-500' : 'text-gray-400'}
            `}>
              <CreditCard size={14} strokeWidth={1.5} />
            </div>
            
            <select
              value={supplier.paymentMode || ""}
              onChange={(e) => updateField("paymentMode", e.target.value)}
              className={`
                w-full h-9 pl-8 pr-3 text-[11px] rounded-lg border transition-all duration-200 outline-none
                ${supplier.paymentMode
                  ? 'border-indigo-400 ring-2 ring-indigo-100 bg-white font-medium'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <option value="">Select...</option>
              <option value="CASH">💵 Cash</option>
              <option value="CARD">💳 Card</option>
              <option value="UPI">📱 UPI</option>
              <option value="CHEQUE">📝 Cheque</option>
              <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
              <option value="CREDIT">📋 Credit</option>
            </select>
          </div>
          
          <AnimatedInput
            label="Amount Paid"
            value={supplier.amountPaid}
            onChange={(e) => updateField("amountPaid", e.target.value)}
            placeholder="0.00"
            type="number"
            icon={Wallet}
            prefix="₹"
            inputClassName="font-semibold text-green-700"
            success={parseFloat(supplier.amountPaid) > 0}
          />

          <AnimatedInput
            label="Supplier Address"
            value={supplier.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Full address"
            icon={MapPin}
          />
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailsCard;