// src/pages/purchase/billing/components/SupplierDetailsCard.jsx
import { useState, useRef, useEffect } from "react";
import { 
  Building2, 
  FileText, 
  Calendar, 
  CreditCard, 
  Search,
  X,
  ChevronUp,
  Clock,
  Wallet,
  Receipt,
  MapPin,
  CheckCircle2,
  Hash,
  Edit3
} from "lucide-react";

// Animated Input Component
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
      {/* Floating Label */}
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
      
      {/* Icon */}
      {Icon && (
        <div className={`
          absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200
          ${isFocused ? 'text-indigo-500' : highlight ? 'text-indigo-500' : 'text-gray-400'}
        `}>
          <Icon size={14} strokeWidth={1.5} />
        </div>
      )}
      
      {/* Prefix */}
      {prefix && (
        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[11px] ${Icon ? 'left-8' : 'left-3'} ${highlight ? 'text-indigo-500 font-medium' : 'text-gray-400'}`}>
          {prefix}
        </span>
      )}
      
      {/* Input */}
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
      
      {/* Suffix */}
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">
          {suffix}
        </span>
      )}
      
      {/* Success indicator */}
      {success && (
        <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
      )}
    </div>
  );
};

// Enhanced Searchable Select Component - OPENS UPWARD
const SearchableSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder,
  icon: Icon,
  displayKey = "name",
  onSelect,
  className = "",
  dropDirection = "up"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(opt => 
    opt[displayKey]?.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
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

  // Scroll to selected item when opening
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

  const hasValue = value && value.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Floating Label */}
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

      {/* Icon */}
      {Icon && (
        <div className={`
          absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10
          ${isFocused || isOpen ? 'text-indigo-500' : 'text-gray-400'}
        `}>
          <Icon size={14} strokeWidth={1.5} />
        </div>
      )}

      {/* Input/Display Field */}
      <div
        onClick={() => {
          setIsOpen(true);
          setIsFocused(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={`
          w-full h-9 flex items-center justify-between rounded-lg border cursor-pointer
          transition-all duration-200
          ${Icon ? 'pl-8' : 'pl-3'} pr-3
          ${isOpen 
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
              if (e.key === 'Enter' && filteredOptions.length > 0) {
                handleSelect(filteredOptions[0]);
              }
            }}
          />
        ) : (
          <span className={`text-[11px] truncate ${value ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
            {value || ""}
          </span>
        )}
        
        <div className="flex items-center gap-1 ml-1">
          {value && !isOpen && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
              title="Clear selection"
            >
              <X size={12} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronUp 
            size={14} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* UPWARD Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`
            absolute left-0 right-0 bg-white border border-gray-200 rounded-xl 
            shadow-xl z-50 max-h-52 overflow-auto
            ${dropDirection === 'up' 
              ? 'bottom-full mb-1.5' 
              : 'top-full mt-1.5'
            }
          `}
          style={{
            boxShadow: dropDirection === 'up' 
              ? '0 -10px 40px -5px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)'
              : '0 10px 40px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Search indicator */}
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

          {/* Options List */}
          {filteredOptions.length > 0 ? (
            <div className="py-1">
              {filteredOptions.map((option, idx) => (
                <div
                  key={option.id || idx}
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
                    <div>
                      <div className={`text-[11px] font-medium ${value === option[displayKey] ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {option[displayKey]}
                      </div>
                      {option.gst && (
                        <div className="text-[9px] text-gray-400 mt-0.5 font-mono">
                          GST: {option.gst}
                        </div>
                      )}
                      {option.address && (
                        <div className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={8} />
                          {option.address}
                        </div>
                      )}
                    </div>
                    {value === option[displayKey] && (
                      <CheckCircle2 size={14} className="text-indigo-500 shrink-0" />
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
              <p className="text-gray-400 text-[10px] mt-0.5">Try a different search term</p>
            </div>
          )}

          {/* Quick add option */}
          {search && filteredOptions.length === 0 && (
            <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
              <button 
                className="w-full text-left text-[10px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5"
                onClick={() => {
                  console.log("Add new supplier:", search);
                }}
              >
                <span className="w-4 h-4 rounded bg-indigo-100 flex items-center justify-center text-[10px]">+</span>
                Add "{search}" as new supplier
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Date Picker Component
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

// Main Component
const SupplierDetailsCard = ({ supplier, setSupplier, suppliersList = [], onSupplierSelect }) => {
  const updateField = (field, value) => {
    setSupplier(prev => ({ ...prev, [field]: value }));
  };

  // Default suppliers if none provided
  const suppliers = suppliersList.length > 0 ? suppliersList : [
    { id: 1, name: "ABC Pharma Ltd", gst: "27AABCA1234C1Z5", phone: "+91 98765 43210", address: "Mumbai, MH" },
    { id: 2, name: "XYZ Medicals", gst: "07AAFCX5678D1Z2", phone: "+91 98765 43211", address: "Delhi, NCR" },
    { id: 3, name: "PQR Distributors", gst: "29AAPCP5678R1Z3", phone: "+91 98765 43212", address: "Bangalore, KA" },
    { id: 4, name: "LMN Healthcare", gst: "03AABCL1234M1Z4", phone: "+91 98765 43213", address: "Chandigarh, PB" },
    { id: 5, name: "Global Pharma Inc", gst: "24AABCG5678P1Z5", phone: "+91 98765 43214", address: "Ahmedabad, GJ" },
    { id: 6, name: "Sunrise Medicines", gst: "19AABCS5678S1Z6", phone: "+91 98765 43215", address: "Kolkata, WB" },
    { id: 7, name: "Metro Drug House", gst: "33AABCM5678M1Z7", phone: "+91 98765 43216", address: "Chennai, TN" },
    { id: 8, name: "Unity Healthcare", gst: "32AABCU5678U1Z8", phone: "+91 98765 43217", address: "Kochi, KL" },
  ];

  // Generate new Purchase ID
  const generateNewId = () => {
    const newId = "PUR-" + Date.now().toString().slice(-6);
    updateField("purchaseId", newId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full h-full flex flex-col overflow-visible">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Building2 size={14} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-800">Supplier Details</h3>
            <p className="text-[9px] text-gray-500">Invoice & Payment Information</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4 flex-1 overflow-visible">
        
        {/* ✅ Row 1: Purchase ID, Supplier Selection & Invoice */}
        <div className="grid grid-cols-5 gap-3">
          
          {/* ✅ EDITABLE Purchase ID */}
          <div className="relative">
            <AnimatedInput
              label="Purchase ID"
              value={supplier.purchaseId}
              onChange={(e) => updateField("purchaseId", e.target.value.toUpperCase())}
              placeholder="PUR-XXXXXX"
              icon={Hash}
              highlight={true}
              inputClassName="font-mono tracking-wide"
            />
            {/* Generate New ID Button */}
            <button
              onClick={generateNewId}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-indigo-100 rounded transition-colors group"
              title="Generate new ID"
            >
              <Edit3 size={12} className="text-indigo-400 group-hover:text-indigo-600" />
            </button>
          </div>
          
          {/* Supplier Dropdown - Opens UPWARD */}
          <SearchableSelect
            label="Supplier Name *"
            value={supplier.supplierName}
            onChange={(val) => updateField("supplierName", val)}
            options={suppliers}
            placeholder="Search supplier..."
            icon={Building2}
            dropDirection="up"
            onSelect={(selected) => {
              if (selected) {
                updateField("supplierGST", selected.gst || "");
                updateField("supplierPhone", selected.phone || "");
                updateField("address", selected.address || "");
                onSupplierSelect?.(selected);
              }
            }}
          />
          
          <AnimatedInput
            label="Invoice Number *"
            value={supplier.invoiceNo}
            onChange={(e) => updateField("invoiceNo", e.target.value)}
            placeholder="INV-2025-001"
            icon={FileText}
          />
          
          <DateInput
            label="Invoice Date"
            value={supplier.invoiceDate}
            onChange={(e) => updateField("invoiceDate", e.target.value)}
          />
          
          <DateInput
            label="Received On"
            value={supplier.receivedOn}
            onChange={(e) => updateField("receivedOn", e.target.value)}
          />
        </div>

        {/* Row 2: GST, Credit & Payment */}
        <div className="grid grid-cols-5 gap-3">
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
            label="Credit Days"
            value={supplier.creditDays}
            onChange={(e) => updateField("creditDays", e.target.value)}
            placeholder="30"
            type="number"
            icon={Clock}
            suffix="days"
          />
          
          <AnimatedInput
            label="Amount Paid"
            value={supplier.amountPaid}
            onChange={(e) => updateField("amountPaid", e.target.value)}
            placeholder="0.00"
            type="number"
            icon={Wallet}
            prefix="₹"
            inputClassName="font-semibold text-green-700"
          />
          
          <AnimatedInput
            label="Balance Due"
            value={supplier.balance}
            readOnly
            icon={CreditCard}
            prefix="₹"
            inputClassName="font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50"
          />

          {/* Address moved to row 2, last column */}
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