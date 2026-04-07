// src/components/common/ProductMasterModal.jsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Save, Package, Pill, MapPin, 
  Loader2, AlertTriangle, Hash, Percent, 
  Shield, Archive, Building2, Tag, Layers,
  CheckCircle, Info
} from 'lucide-react';

const FormField = ({ label, required, error, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600">
        <AlertTriangle size={10} className="shrink-0" />
        <span>{error}</span>
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
  const [activeTab, setActiveTab] = useState('basic');
  const [gstMode, setGstMode] = useState('auto');

  // Tabs configuration
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Pill },
    { id: 'storage', label: 'Storage & Inventory', icon: Archive },
    { id: 'pricing', label: 'Pricing & Tax', icon: Percent },
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
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
        hsnCode: initialData.hsnCode || initialData.hsn || '',
        packSize: initialData.packSize || initialData.pack || '',
        gst: initialData.gst || calculatedGst,
        cgstPercent: initialData.cgstPercent || '6',
        sgstPercent: initialData.sgstPercent || '6',
        subHead: initialData.subHead || '',
      });
      
      setGstMode(hasManualGst ? 'manual' : 'auto');
      setErrors({});
      setActiveTab('basic');
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open, initialData]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (open) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  // Validation stats
  const stats = useMemo(() => ({
    hasName: !!formData.name.trim(),
    hasManufacturer: !!formData.manufacturer.trim(),
    isValid: !!formData.name.trim() && !!formData.manufacturer.trim(),
    errorCount: Object.keys(errors).length,
  }), [formData.name, formData.manufacturer, errors]);

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

  const handleTaxChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      const cgst = field === 'cgstPercent' ? numValue : parseFloat(prev.cgstPercent) || 0;
      const sgst = field === 'sgstPercent' ? numValue : parseFloat(prev.sgstPercent) || 0;
      newData.gst = String(cgst + sgst);
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleGstMode = () => {
    if (gstMode === 'auto') {
      setGstMode('manual');
    } else {
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
      // Switch to tab with first error
      if (errors.name || errors.manufacturer) {
        setActiveTab('basic');
      } else if (errors.maxLevel) {
        setActiveTab('storage');
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const toNumberOrNull = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const productData = {
        name: formData.name.trim(),
        manufacturer: formData.manufacturer.trim(),
        genericName: formData.genericName?.trim() || null,
        category: formData.category?.trim() || null,
        subCategory: formData.subCategory?.trim() || null,
        schedule: formData.schedule || null,
        hsnCode: formData.hsnCode?.trim() || null,
        packSize: formData.packSize?.trim() || null,
        gst: toNumberOrNull(formData.gst) ?? 12,
        cgstPercent: toNumberOrNull(formData.cgstPercent) ?? 6,
        sgstPercent: toNumberOrNull(formData.sgstPercent) ?? 6,
        rackNo: formData.rackNo?.trim()?.toUpperCase() || null,
        min_stock_level: toNumberOrNull(formData.minLevel),
        max_stock_level: toNumberOrNull(formData.maxLevel),
        reorder_point: toNumberOrNull(formData.reorderPoint),
        priceControlled: formData.priceControlled || false,
        subHead: formData.subHead?.trim() || null,
      };
      
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

  const handleClose = () => {
    onClose();
  };

  const inputClass = (hasError) => `
    w-full px-3 py-2.5 text-sm bg-white border rounded-lg transition-all duration-150 outline-none
    ${hasError 
      ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' 
      : 'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
    }
  `;

  const selectClass = `
    w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg transition-all duration-150 outline-none
    hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer
  `;

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#000060] to-indigo-800 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Product Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-white text-base sm:text-lg font-semibold truncate">
                  {mode === 'create' ? 'Add New Product' : 'Edit Product'}
                </h2>
                <p className="text-white/70 text-xs sm:text-sm">
                  Product Master Entry
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <div className="hidden sm:flex items-center gap-2">
                {stats.isValid ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                    <CheckCircle size={12} />
                    Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                    <AlertTriangle size={12} />
                    Incomplete
                  </span>
                )}
              </div>

              <button
                onClick={handleClose}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 px-4 sm:px-6 bg-white border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasError = (tab.id === 'basic' && (errors.name || errors.manufacturer)) ||
                            (tab.id === 'storage' && errors.maxLevel) ||
                            (tab.id === 'pricing' && errors.cgstPercent);
            
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap
                  ${isActive
                    ? 'text-[#000060] border-b-2 border-[#000060] bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon size={16} />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                {hasError && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-6 h-[55vh] sm:h-[60vh] overflow-auto bg-gray-50">
            
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Pill className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Basic Information</h3>
                    {(errors.name || errors.manufacturer) && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle size={12} />
                        Required fields missing
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Product Name" required error={errors.name} className="sm:col-span-2">
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
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
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
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        <input
                          type="text"
                          value={formData.genericName}
                          onChange={(e) => handleInputChange('genericName', e.target.value)}
                          className={`${inputClass(false)} pl-9`}
                          placeholder="Generic/salt name"
                        />
                      </div>
                    </FormField>

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
              </div>
            )}

            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Archive className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Storage & Inventory</h3>
                    {errors.maxLevel && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-red-500">
                        <AlertTriangle size={12} />
                        Error
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Rack Location" className="sm:col-span-2">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        <input
                          type="text"
                          value={formData.rackNo}
                          onChange={(e) => handleInputChange('rackNo', e.target.value.toUpperCase())}
                          className={`${inputClass(false)} pl-9 uppercase`}
                          placeholder="e.g., A1, B2, C3"
                        />
                      </div>
                    </FormField>

                    <FormField label="Min Stock Level">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={formData.minLevel}
                        onChange={(e) => handleInputChange('minLevel', e.target.value)}
                        className={inputClass(false)}
                        placeholder="0"
                        min="0"
                      />
                    </FormField>

                    <FormField label="Max Stock Level" error={errors.maxLevel}>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={formData.maxLevel}
                        onChange={(e) => handleInputChange('maxLevel', e.target.value)}
                        className={inputClass(errors.maxLevel)}
                        placeholder="0"
                        min="0"
                      />
                    </FormField>

                    <FormField label="Reorder Point" className="sm:col-span-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={formData.reorderPoint}
                        onChange={(e) => handleInputChange('reorderPoint', e.target.value)}
                        className={inputClass(false)}
                        placeholder="Auto calculate or enter manually"
                        min="0"
                      />
                    </FormField>
                  </div>

                  {/* Info Box */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">
                      Stock levels are optional during product creation. You can set them later when adding inventory.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Percent className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">Pricing & Tax</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="HSN Code" className="sm:col-span-2">
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        <input
                          type="text"
                          value={formData.hsnCode}
                          onChange={(e) => handleInputChange('hsnCode', e.target.value)}
                          className={`${inputClass(false)} pl-9`}
                          placeholder="Enter HSN Code"
                        />
                      </div>
                    </FormField>

                    {/* GST Mode Toggle */}
                    <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-slate-100 rounded-lg">
                      <span className="text-xs font-medium text-slate-600">Tax Entry Mode</span>
                      <button
                        type="button"
                        onClick={toggleGstMode}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          gstMode === 'auto' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-purple-500 text-white'
                        }`}
                      >
                        {gstMode === 'auto' ? '🔄 Auto (GST → Split)' : '✏️ Manual (CGST + SGST)'}
                      </button>
                    </div>

                    {gstMode === 'auto' ? (
                      <>
                        <FormField label="GST Rate" className="sm:col-span-2">
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

                        <FormField label="CGST % (Auto)">
                          <input
                            type="text"
                            value={formData.cgstPercent}
                            readOnly
                            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                          />
                        </FormField>

                        <FormField label="SGST % (Auto)">
                          <input
                            type="text"
                            value={formData.sgstPercent}
                            readOnly
                            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                          />
                        </FormField>
                      </>
                    ) : (
                      <>
                        <FormField label="CGST %" error={errors.cgstPercent}>
                          <input
                            type="number"
                            inputMode="decimal"
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
                            inputMode="decimal"
                            value={formData.sgstPercent}
                            onChange={(e) => handleTaxChange('sgstPercent', e.target.value)}
                            className={inputClass(false)}
                            placeholder="0"
                            min="0"
                            max="14"
                            step="0.5"
                          />
                        </FormField>

                        <FormField label="Total GST (Calculated)" className="sm:col-span-2">
                          <input
                            type="text"
                            value={`${formData.gst}%`}
                            readOnly
                            className="w-full px-3 py-2.5 text-sm bg-purple-50 border border-purple-200 rounded-lg text-purple-700 font-medium"
                          />
                        </FormField>
                      </>
                    )}

                    <FormField label="GST Sub Head" className="sm:col-span-2">
                      <input
                        type="text"
                        value={formData.subHead}
                        onChange={(e) => handleInputChange('subHead', e.target.value)}
                        className={inputClass(false)}
                        placeholder="Optional sub-classification"
                      />
                    </FormField>

                    {/* Price Controlled Toggle */}
                    <div className="sm:col-span-2 p-3 bg-white border border-slate-200 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer gap-3">
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
                            <p className="text-xs text-slate-500">Government regulated product</p>
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
                  </div>

                  {/* Info Box */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                    <Layers size={16} className="text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">
                      {gstMode === 'auto' 
                        ? 'GST automatically splits into CGST & SGST equally for intra-state sales.'
                        : 'Enter CGST and SGST separately. Total GST will be calculated automatically.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Status Info */}
              <div className="flex items-center gap-4 text-xs text-gray-400 order-2 sm:order-1">
                <span className="flex items-center gap-1">
                  <span className="text-red-500">*</span> Required fields
                </span>
                <span className="hidden sm:flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${stats.isValid ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  {stats.isValid ? 'Ready to save' : 'Fill required fields'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !stats.isValid}
                  className={`
                    flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${stats.isValid && !isSubmitting
                      ? 'bg-[#000060] text-white hover:bg-indigo-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {mode === 'create' ? 'Add Product' : 'Update Product'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes zoom-in-95 {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-in {
          animation: zoom-in-95 0.2s ease-out;
        }
        
        /* Hide xs breakpoint utilities fallback */
        @media (max-width: 475px) {
          .xs\\:inline { display: none; }
          .xs\\:hidden { display: inline; }
        }
        @media (min-width: 476px) {
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
        }
      `}</style>
    </div>
  );
};

export default ProductMasterModal;
