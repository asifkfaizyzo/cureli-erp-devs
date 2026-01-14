// src/components/modals/ProductMasterModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, Package, Pill, MapPin, 
  Loader2, AlertTriangle, Hash, Percent, 
  Shield, Archive, Building2, Tag, Layers,
  ChevronRight
} from 'lucide-react';

const ProductMasterModal = ({ 
  open, 
  onClose, 
  onSave, 
  initialData = {},
  mode = 'create'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    category: 'Medical',
    subCategory: '',
    genericName: '',
    schedule: '',
    rackNo: '',
    minLevel: '',
    maxLevel: '',
    reorderPoint: '',
    priceControlled: false,
    hsnCode: '',
    gst: '12',
    subHead: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  // Refs for scrolling to sections
  const basicRef = useRef(null);
  const storageRef = useRef(null);
  const pricingRef = useRef(null);

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: Pill, ref: basicRef, color: 'blue' },
    { id: 'storage', label: 'Storage', icon: Archive, ref: storageRef, color: 'green' },
    { id: 'pricing', label: 'Pricing', icon: Percent, ref: pricingRef, color: 'purple' },
  ];

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        manufacturer: '',
        category: 'Medical',
        subCategory: '',
        genericName: '',
        schedule: '',
        rackNo: '',
        minLevel: '',
        maxLevel: '',
        reorderPoint: '',
        priceControlled: false,
        hsnCode: '',
        gst: '12',
        subHead: '',
        ...initialData
      });
      setErrors({});
      setActiveSection('basic');
    }
  }, [open, initialData]);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const section = sections.find(s => s.id === sectionId);
    if (section?.ref?.current) {
      section.ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    
    if (!formData.hsnCode.trim()) {
      newErrors.hsnCode = 'HSN Code is required';
    }
    
    if (formData.minLevel && formData.maxLevel && Number(formData.minLevel) >= Number(formData.maxLevel)) {
      newErrors.maxLevel = 'Max must be greater than min';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error section
      if (errors.name || errors.manufacturer) scrollToSection('basic');
      else if (errors.maxLevel) scrollToSection('storage');
      else if (errors.hsnCode) scrollToSection('pricing');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const productData = {
        id: Date.now(),
        productId: `PRD-${Date.now().toString().slice(-6)}`,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await onSave(productData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Compact Input Field Component
  const FormField = ({ label, required, error, children, className = '' }) => (
    <div className={`space-y-1 ${className}`}>
      <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle size={10} />
          {error}
        </p>
      )}
    </div>
  );

  const inputClass = (hasError) => `
    w-full px-3 py-2 text-sm bg-white border rounded-lg transition-all duration-150 outline-none
    ${hasError 
      ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
      : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
    }
  `;

  const selectClass = `
    w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg transition-all duration-150 outline-none
    hover:border-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer
  `;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative flex items-start justify-center min-h-screen p-2 sm:p-4 overflow-y-auto">
        <div className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl my-4 sm:my-8">
          
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#000060] to-indigo-900 rounded-t-xl">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur rounded-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  {mode === 'create' ? 'Add New Product' : 'Edit Product'}
                </h2>
                <p className="text-xs sm:text-sm text-blue-200">
                  Product Master Entry
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Horizontal Tab Navigation */}
          <div className="sticky top-[60px] sm:top-[68px] z-10 flex items-center gap-1 px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
            {sections.map((section, index) => (
              <React.Fragment key={section.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                    activeSection === section.id
                      ? 'bg-[#000060] text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <section.icon size={16} />
                  <span className="hidden xs:inline">{section.label}</span>
                </button>
                {index < sections.length - 1 && (
                  <ChevronRight size={16} className="text-slate-300 hidden sm:block shrink-0" />
                )}
              </React.Fragment>
            ))}
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4 ml-auto text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {Object.keys(errors).length === 0 ? 'All fields valid' : `${Object.keys(errors).length} errors`}
              </span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            <div className="p-4 sm:p-6">
              
              {/* Horizontal 3-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Section 1: Basic Information */}
                <div 
                  ref={basicRef}
                  className={`lg:col-span-1 bg-gradient-to-br from-blue-50/50 to-slate-50 rounded-xl p-4 border-2 transition-all duration-300 ${
                    activeSection === 'basic' ? 'border-blue-400 shadow-lg shadow-blue-100' : 'border-slate-200'
                  }`}
                  onClick={() => setActiveSection('basic')}
                >
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Pill className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">Basic Information</h3>
                    {(errors.name || errors.manufacturer) && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle size={12} />
                        Required
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <FormField label="Product Name" required error={errors.name}>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={inputClass(errors.name)}
                        placeholder="Enter product name"
                      />
                    </FormField>

                    <FormField label="Manufacturer" required error={errors.manufacturer}>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={formData.manufacturer}
                          onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                          className={`${inputClass(errors.manufacturer)} pl-9`}
                          placeholder="Manufacturer name"
                        />
                      </div>
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Category" required>
                        <select
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className={selectClass}
                        >
                          <option value="Medical">Medical</option>
                          <option value="General">General</option>
                          <option value="Surgical">Surgical</option>
                          <option value="Cosmetic">Cosmetic</option>
                        </select>
                      </FormField>

                      <FormField label="Sub Category">
                        <input
                          type="text"
                          value={formData.subCategory}
                          onChange={(e) => handleInputChange('subCategory', e.target.value)}
                          className={inputClass(false)}
                          placeholder="e.g., Tablets"
                        />
                      </FormField>
                    </div>

                    <FormField label="Generic Name">
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={formData.genericName}
                          onChange={(e) => handleInputChange('genericName', e.target.value)}
                          className={`${inputClass(false)} pl-9`}
                          placeholder="Generic name"
                        />
                      </div>
                    </FormField>

                    <FormField label="Schedule">
                      <select
                        value={formData.schedule}
                        onChange={(e) => handleInputChange('schedule', e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select Schedule</option>
                        <option value="Schedule H">Schedule H</option>
                        <option value="Schedule H1">Schedule H1</option>
                        <option value="Schedule X">Schedule X</option>
                        <option value="OTC">OTC (Over The Counter)</option>
                      </select>
                    </FormField>
                  </div>
                </div>

                {/* Section 2: Storage & Inventory */}
                <div 
                  ref={storageRef}
                  className={`lg:col-span-1 bg-gradient-to-br from-green-50/50 to-slate-50 rounded-xl p-4 border-2 transition-all duration-300 ${
                    activeSection === 'storage' ? 'border-green-400 shadow-lg shadow-green-100' : 'border-slate-200'
                  }`}
                  onClick={() => setActiveSection('storage')}
                >
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Archive className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">Storage & Inventory</h3>
                    {errors.maxLevel && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle size={12} />
                        Error
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <FormField label="Rack Location">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={formData.rackNo}
                          onChange={(e) => handleInputChange('rackNo', e.target.value.toUpperCase())}
                          className={`${inputClass(false)} pl-9`}
                          placeholder="e.g., A1, B2, C3"
                        />
                      </div>
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Min Stock">
                        <input
                          type="number"
                          value={formData.minLevel}
                          onChange={(e) => handleInputChange('minLevel', e.target.value)}
                          className={inputClass(false)}
                          placeholder="0"
                          min="0"
                        />
                      </FormField>

                      <FormField label="Max Stock" error={errors.maxLevel}>
                        <input
                          type="number"
                          value={formData.maxLevel}
                          onChange={(e) => handleInputChange('maxLevel', e.target.value)}
                          className={inputClass(errors.maxLevel)}
                          placeholder="0"
                          min="0"
                        />
                      </FormField>
                    </div>

                    <FormField label="Reorder Point">
                      <input
                        type="number"
                        value={formData.reorderPoint}
                        onChange={(e) => handleInputChange('reorderPoint', e.target.value)}
                        className={inputClass(false)}
                        placeholder="Auto calculate"
                        min="0"
                      />
                    </FormField>

                    {/* Storage Info Card */}
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">
                          Set min/max levels for automatic stock alerts. Reorder point triggers purchase suggestions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Pricing & Tax */}
                <div 
                  ref={pricingRef}
                  className={`lg:col-span-1 bg-gradient-to-br from-purple-50/50 to-slate-50 rounded-xl p-4 border-2 transition-all duration-300 ${
                    activeSection === 'pricing' ? 'border-purple-400 shadow-lg shadow-purple-100' : 'border-slate-200'
                  }`}
                  onClick={() => setActiveSection('pricing')}
                >
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Percent className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">Pricing & Tax</h3>
                    {errors.hsnCode && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle size={12} />
                        Required
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <FormField label="HSN Code" required error={errors.hsnCode}>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={formData.hsnCode}
                          onChange={(e) => handleInputChange('hsnCode', e.target.value)}
                          className={`${inputClass(errors.hsnCode)} pl-9`}
                          placeholder="Enter HSN Code"
                        />
                      </div>
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="GST Rate">
                        <select
                          value={formData.gst}
                          onChange={(e) => handleInputChange('gst', e.target.value)}
                          className={selectClass}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </FormField>

                      <FormField label="GST Sub Head">
                        <input
                          type="text"
                          value={formData.subHead}
                          onChange={(e) => handleInputChange('subHead', e.target.value)}
                          className={inputClass(false)}
                          placeholder="Sub-head"
                        />
                      </FormField>
                    </div>

                    {/* Price Controlled Toggle */}
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                            formData.priceControlled ? 'bg-blue-100' : 'bg-slate-100'
                          }`}>
                            <Shield className={`w-4 h-4 ${
                              formData.priceControlled ? 'text-blue-600' : 'text-slate-400'
                            }`} />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-800">Price Controlled</span>
                            <p className="text-xs text-slate-500">Govt. regulated</p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={formData.priceControlled}
                            onChange={(e) => handleInputChange('priceControlled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-300 peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 after:shadow-sm"></div>
                        </div>
                      </label>
                    </div>

                    {/* Tax Info */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Layers className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700">
                          HSN codes required for GST compliance. Verify from official HSN master.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-slate-100 border-t border-slate-200 rounded-b-xl">
              <div className="flex items-center gap-4 text-xs text-slate-500 order-2 sm:order-1">
                <span className="flex items-center gap-1">
                  <span className="text-red-500">*</span> Required fields
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${Object.keys(errors).length === 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {Object.keys(errors).length === 0 ? 'Ready to save' : `${Object.keys(errors).length} field(s) need attention`}
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#000060] rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{mode === 'create' ? 'Add Product' : 'Update Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductMasterModal;