// src/components/common/ProductMasterModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, Package, Pill, MapPin, 
  Loader2, AlertTriangle, Hash, Percent, 
  Shield, Archive, Building2, Tag, Layers,
  ChevronRight
} from 'lucide-react';

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
    category: '',
    subCategory: '',
    genericName: '',
    schedule: '',
    rackNo: '',
    minLevel: '',
    maxLevel: '',
    reorderPoint: '',
    priceControlled: false,
    hsnCode: '',
    packSize: '',
    gst: '12',
    cgstPercent: '6',
    sgstPercent: '6',
    subHead: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [gstMode, setGstMode] = useState('auto'); // 'auto' or 'manual'

  const basicRef = useRef(null);
  const storageRef = useRef(null);
  const pricingRef = useRef(null);

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: Pill, ref: basicRef, color: 'blue' },
    { id: 'storage', label: 'Storage', icon: Archive, ref: storageRef, color: 'green' },
    { id: 'pricing', label: 'Pricing', icon: Percent, ref: pricingRef, color: 'purple' },
  ];

  // ✅ UPDATED: Reset form with ALL initial data fields
  useEffect(() => {
    if (open) {
      console.log('📝 ProductMasterModal initialData:', initialData);
      
      // Determine GST mode based on initialData
      const hasManualGst = initialData.cgstPercent && initialData.sgstPercent;
      const calculatedGst = hasManualGst 
        ? String(parseFloat(initialData.cgstPercent) + parseFloat(initialData.sgstPercent))
        : '12';
      
      setFormData({
        name: initialData.name || '',
        manufacturer: initialData.manufacturer || initialData.mfac || '',
        category: initialData.category || '',
        subCategory: initialData.subCategory || '',
        genericName: initialData.genericName || '',
        schedule: initialData.schedule || '',
        rackNo: initialData.rackNo || initialData.rack || '',
        minLevel: initialData.minLevel || '',
        maxLevel: initialData.maxLevel || '',
        reorderPoint: initialData.reorderPoint || '',
        priceControlled: initialData.priceControlled || false,
        // ✅ FIXED: Map HSN code from various sources
        hsnCode: initialData.hsnCode || initialData.hsn || '',
        packSize: initialData.packSize || initialData.pack || '',
        gst: initialData.gst || calculatedGst,
        // ✅ FIXED: Map CGST/SGST from import
        cgstPercent: initialData.cgstPercent || '6',
        sgstPercent: initialData.sgstPercent || '6',
        subHead: initialData.subHead || '',
      });
      
      // Set GST mode based on whether we have explicit CGST/SGST values
      setGstMode(hasManualGst ? 'manual' : 'auto');
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
    
    if (formData.minLevel && formData.maxLevel && Number(formData.minLevel) >= Number(formData.maxLevel)) {
      newErrors.maxLevel = 'Max must be greater than min';
    }
    
    // Validate CGST + SGST in manual mode
    if (gstMode === 'manual') {
      const cgst = parseFloat(formData.cgstPercent) || 0;
      const sgst = parseFloat(formData.sgstPercent) || 0;
      if (cgst + sgst > 28) {
        newErrors.cgstPercent = 'Total GST cannot exceed 28%';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle GST change in AUTO mode
  const handleGSTChange = (value) => {
    const gst = parseFloat(value) || 0;
    const half = (gst / 2).toFixed(2);
    
    setFormData(prev => ({
      ...prev,
      gst: value,
      cgstPercent: half,
      sgstPercent: half,
    }));
    
    if (errors.gst) {
      setErrors(prev => ({ ...prev, gst: '' }));
    }
  };

  // ✅ Handle individual CGST/SGST change in MANUAL mode
  const handleTaxChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Recalculate total GST
      const cgst = field === 'cgstPercent' ? numValue : parseFloat(prev.cgstPercent) || 0;
      const sgst = field === 'sgstPercent' ? numValue : parseFloat(prev.sgstPercent) || 0;
      newData.gst = String(cgst + sgst);
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // ✅ Toggle between auto and manual GST mode
  const toggleGstMode = () => {
    if (gstMode === 'auto') {
      setGstMode('manual');
    } else {
      // When switching back to auto, recalculate CGST/SGST from GST
      const gst = parseFloat(formData.gst) || 12;
      const half = (gst / 2).toFixed(2);
      setFormData(prev => ({
        ...prev,
        cgstPercent: half,
        sgstPercent: half,
      }));
      setGstMode('auto');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      if (errors.name || errors.manufacturer) scrollToSection('basic');
      else if (errors.maxLevel) scrollToSection('storage');
      else if (errors.hsnCode || errors.cgstPercent) scrollToSection('pricing');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const productData = {
        name: formData.name.trim(),
        manufacturer: formData.manufacturer.trim(),
        genericName: formData.genericName?.trim() || null,
        category: formData.category?.trim() || null,
        subCategory: formData.subCategory?.trim() || null,
        schedule: formData.schedule || null,
        hsnCode: formData.hsnCode?.trim() || null,
        packSize: formData.packSize?.trim() || null,
        gst: parseFloat(formData.gst) || 12,
        cgstPercent: parseFloat(formData.cgstPercent) || 6,
        sgstPercent: parseFloat(formData.sgstPercent) || 6,
        rackNo: formData.rackNo?.trim()?.toUpperCase() || null,
        minLevel: formData.minLevel ? parseFloat(formData.minLevel) : null,
        maxLevel: formData.maxLevel ? parseFloat(formData.maxLevel) : null,
        reorderPoint: formData.reorderPoint ? parseFloat(formData.reorderPoint) : null,
        priceControlled: formData.priceControlled || false,
        subHead: formData.subHead?.trim() || null,
      };
      
      console.log('📤 Saving product with data:', productData);
      await onSave(productData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to save product'
      }));
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
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
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
            
            <div className="hidden md:flex items-center gap-4 ml-auto text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${Object.keys(errors).length === 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {Object.keys(errors).length === 0 ? 'All fields valid' : `${Object.keys(errors).length} errors`}
              </span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            <div className="p-4 sm:p-6">
              
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
                        autoFocus
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

                    <FormField label="Generic Name">
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={formData.genericName}
                          onChange={(e) => handleInputChange('genericName', e.target.value)}
                          className={`${inputClass(false)} pl-9`}
                          placeholder="Generic/salt name"
                        />
                      </div>
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Category">
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className={inputClass(false)}
                          placeholder="e.g., Tablet"
                        />
                      </FormField>

                      <FormField label="Sub Category">
                        <input
                          type="text"
                          value={formData.subCategory}
                          onChange={(e) => handleInputChange('subCategory', e.target.value)}
                          className={inputClass(false)}
                          placeholder="e.g., Analgesic"
                        />
                      </FormField>
                    </div>

                    <FormField label="Pack Size">
                      <input
                        type="text"
                        value={formData.packSize}
                        onChange={(e) => handleInputChange('packSize', e.target.value)}
                        className={inputClass(false)}
                        placeholder="e.g., 10x10, 100ml, 82GM"
                      />
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
                          className={`${inputClass(false)} pl-9 uppercase`}
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

                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">
                          Stock levels are optional during product creation. You can set them later when adding inventory.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Pricing & Tax - ✅ UPDATED */}
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
                  </div>
                  
                  <div className="space-y-3">
                    <FormField label="HSN Code">
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          value={formData.hsnCode}
                          onChange={(e) => handleInputChange('hsnCode', e.target.value)}
                          className={`${inputClass(false)} pl-9`}
                          placeholder="Enter HSN Code"
                        />
                      </div>
                    </FormField>

                    {/* ✅ NEW: GST Mode Toggle */}
                    <div className="flex items-center justify-between p-2 bg-slate-100 rounded-lg">
                      <span className="text-xs font-medium text-slate-600">Tax Entry Mode</span>
                      <button
                        type="button"
                        onClick={toggleGstMode}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          gstMode === 'auto' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-purple-500 text-white'
                        }`}
                      >
                        {gstMode === 'auto' ? '🔄 Auto (GST → Split)' : '✏️ Manual (CGST + SGST)'}
                      </button>
                    </div>

                    {gstMode === 'auto' ? (
                      // AUTO MODE: Select GST, auto-split to CGST/SGST
                      <>
                        <FormField label="GST Rate">
                          <select
                            value={formData.gst}
                            onChange={(e) => handleGSTChange(e.target.value)}
                            className={selectClass}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="CGST % (Auto)">
                            <input
                              type="text"
                              value={formData.cgstPercent}
                              readOnly
                              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                            />
                          </FormField>

                          <FormField label="SGST % (Auto)">
                            <input
                              type="text"
                              value={formData.sgstPercent}
                              readOnly
                              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                            />
                          </FormField>
                        </div>
                      </>
                    ) : (
                      // ✅ MANUAL MODE: Enter CGST/SGST separately
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="CGST %" error={errors.cgstPercent}>
                            <input
                              type="number"
                              value={formData.cgstPercent}
                              onChange={(e) => handleTaxChange('cgstPercent', e.target.value)}
                              className={inputClass(errors.cgstPercent)}
                              placeholder="0"
                              min="0"
                              max="14"
                              step="0.5"
                            />
                          </FormField>

                          <FormField label="SGST %">
                            <input
                              type="number"
                              value={formData.sgstPercent}
                              onChange={(e) => handleTaxChange('sgstPercent', e.target.value)}
                              className={inputClass(false)}
                              placeholder="0"
                              min="0"
                              max="14"
                              step="0.5"
                            />
                          </FormField>
                        </div>

                        <FormField label="Total GST (Calculated)">
                          <input
                            type="text"
                            value={`${formData.gst}%`}
                            readOnly
                            className="w-full px-3 py-2 text-sm bg-purple-50 border border-purple-200 rounded-lg text-purple-700 font-medium"
                          />
                        </FormField>
                      </>
                    )}

                    <FormField label="GST Sub Head">
                      <input
                        type="text"
                        value={formData.subHead}
                        onChange={(e) => handleInputChange('subHead', e.target.value)}
                        className={inputClass(false)}
                        placeholder="Optional sub-classification"
                      />
                    </FormField>

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

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Layers className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700">
                          {gstMode === 'auto' 
                            ? 'GST automatically splits into CGST & SGST equally.'
                            : 'Enter CGST and SGST separately. Total will be calculated.'}
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
              
              {errors.submit && (
                <div className="w-full sm:w-auto order-1 sm:order-2">
                  <p className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={12} />
                    {errors.submit}
                  </p>
                </div>
              )}
              
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