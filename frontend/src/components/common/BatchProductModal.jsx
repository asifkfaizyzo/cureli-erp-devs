// src/components/common/BatchProductModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, Package, AlertCircle, ChevronRight, 
  SkipForward, Plus, Check, Loader2,
  Building2, Hash, MapPin, Percent
} from 'lucide-react';
import ProductMasterModal from './ProductMasterModal';

const BatchProductModal = ({ 
  open, 
  onClose, 
  newProducts = [], 
  onSaveAll,
  onSkipAll 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedProducts, setSavedProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({});

  // Reset state when modal opens with new products
  useEffect(() => {
    if (open && newProducts.length > 0) {
      setCurrentIndex(0);
      setSavedProducts([]);
      setProcessingStatus({});
    }
  }, [open, newProducts]);

  const currentProduct = newProducts[currentIndex];
  const hasMore = currentIndex < newProducts.length - 1;
  const progress = newProducts.length > 0 ? ((currentIndex + 1) / newProducts.length) * 100 : 0;

  const handleSaveProduct = (productData) => {
    const updatedProducts = [...savedProducts, productData];
    setSavedProducts(updatedProducts);
    setProcessingStatus(prev => ({ ...prev, [currentIndex]: 'saved' }));
    setShowProductModal(false);
    
    if (hasMore) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    } else {
      onSaveAll(updatedProducts);
      onClose();
    }
  };

  const handleSkipProduct = () => {
    setProcessingStatus(prev => ({ ...prev, [currentIndex]: 'skipped' }));
    if (hasMore) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onSaveAll(savedProducts);
      onClose();
    }
  };

  const handleSkipAll = () => {
    onSkipAll();
    onClose();
  };

  if (!open || !currentProduct) return null;

  // ✅ ENHANCED: Prepare initial data with ALL available fields from import
  const getInitialDataForModal = () => {
    console.log('📦 BatchProductModal - Current product data:', currentProduct);
    
    return {
      // Basic info
      name: currentProduct.name || '',
      manufacturer: currentProduct.manufacturer || currentProduct.mfac || '',
      genericName: currentProduct.genericName || '',
      category: currentProduct.category || '',
      
      // ✅ FIXED: Pass HSN code properly
      hsnCode: currentProduct.hsnCode || currentProduct.hsn || '',
      
      // ✅ FIXED: Pass pack size properly
      packSize: currentProduct.packSize || currentProduct.pack || '',
      
      // ✅ FIXED: Pass rack location properly
      rackNo: currentProduct.rackNo || currentProduct.rack || '',
      
      // ✅ NEW: Pass GST values from import
      gst: currentProduct.gst || '12',
      cgstPercent: currentProduct.cgstPercent || '6',
      sgstPercent: currentProduct.sgstPercent || '6',
    };
  };

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal Container */}
        <div className="relative flex items-center justify-center min-h-screen p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur rounded-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">New Products Found</h2>
                  <p className="text-sm text-amber-100">
                    {currentIndex + 1} of {newProducts.length} products to review
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-amber-100 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-amber-100">
              <div 
                className="h-full bg-amber-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Content - Horizontal Layout */}
            <div className="flex flex-col lg:flex-row">
              
              {/* Left Panel - Product List */}
              <div className="lg:w-64 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 overflow-x-auto lg:overflow-y-auto lg:max-h-96">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Products Queue
                </h3>
                <div className="flex lg:flex-col gap-2 lg:gap-1">
                  {newProducts.map((product, index) => (
                    <button
                      key={index}
                      onClick={() => index <= currentIndex && setCurrentIndex(index)}
                      disabled={index > currentIndex}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap lg:whitespace-normal transition-all ${
                        index === currentIndex
                          ? 'bg-amber-100 text-amber-800 font-medium'
                          : index < currentIndex
                          ? processingStatus[index] === 'saved'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-slate-100 text-slate-500 line-through'
                          : 'text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {processingStatus[index] === 'saved' ? (
                        <Check size={14} className="text-green-600 shrink-0" />
                      ) : processingStatus[index] === 'skipped' ? (
                        <SkipForward size={14} className="text-slate-400 shrink-0" />
                      ) : index === currentIndex ? (
                        <div className="w-2 h-2 bg-amber-500 rounded-full shrink-0 animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 bg-slate-300 rounded-full shrink-0" />
                      )}
                      <span className="truncate">{product.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Panel - Current Product Details */}
              <div className="flex-1 p-6">
                <div className="mb-6">
                  <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl shrink-0">
                      <Package className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">
                        {currentProduct.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        This product was found in your import but doesn't exist in the system.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ✅ ENHANCED: Product Details Grid with ALL imported fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Manufacturer</p>
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {currentProduct.manufacturer || currentProduct.mfac || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Hash className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">HSN Code</p>
                      <p className={`text-sm font-medium truncate ${
                        currentProduct.hsnCode || currentProduct.hsn 
                          ? 'text-green-700' 
                          : 'text-slate-400'
                      }`}>
                        {currentProduct.hsnCode || currentProduct.hsn || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Rack Location</p>
                      <p className={`text-sm font-medium truncate ${
                        currentProduct.rackNo || currentProduct.rack 
                          ? 'text-green-700' 
                          : 'text-slate-400'
                      }`}>
                        {currentProduct.rackNo || currentProduct.rack || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Package className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Pack Size</p>
                      <p className={`text-sm font-medium truncate ${
                        currentProduct.packSize || currentProduct.pack 
                          ? 'text-green-700' 
                          : 'text-slate-400'
                      }`}>
                        {currentProduct.packSize || currentProduct.pack || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Percent className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">GST Rate</p>
                      <p className={`text-sm font-medium truncate ${
                        currentProduct.gst || currentProduct.cgstPercent 
                          ? 'text-green-700' 
                          : 'text-slate-400'
                      }`}>
                        {currentProduct.gst 
                          ? `${currentProduct.gst}%` 
                          : currentProduct.cgstPercent && currentProduct.sgstPercent
                            ? `${parseFloat(currentProduct.cgstPercent) + parseFloat(currentProduct.sgstPercent)}%`
                            : 'Default 12%'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Percent className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">CGST / SGST</p>
                      <p className={`text-sm font-medium truncate ${
                        currentProduct.cgstPercent 
                          ? 'text-green-700' 
                          : 'text-slate-400'
                      }`}>
                        {currentProduct.cgstPercent && currentProduct.sgstPercent
                          ? `${currentProduct.cgstPercent}% / ${currentProduct.sgstPercent}%`
                          : '6% / 6%'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Banner for Pre-filled Fields */}
                {(currentProduct.hsnCode || currentProduct.hsn || 
                  currentProduct.cgstPercent || currentProduct.rack || currentProduct.rackNo) && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-green-700">
                        <span className="font-medium">Fields detected from import:</span> The product modal will be pre-filled with HSN, GST, Pack Size, and Rack information from your import file.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Horizontal */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#000060] text-white font-medium rounded-xl hover:bg-[#000080] transition-colors shadow-sm"
                  >
                    <Plus size={18} />
                    <span>Add Product Details</span>
                  </button>
                  
                  <button
                    onClick={handleSkipProduct}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-700 font-medium border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  >
                    <SkipForward size={18} />
                    <span>Skip</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500">
                  <span className="font-medium text-green-600">{Object.values(processingStatus).filter(s => s === 'saved').length}</span> saved
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">
                  <span className="font-medium text-slate-600">{Object.values(processingStatus).filter(s => s === 'skipped').length}</span> skipped
                </span>
              </div>
              <button
                onClick={handleSkipAll}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Skip all remaining ({newProducts.length - currentIndex - Object.keys(processingStatus).length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Master Modal - ✅ FIXED: Pass all initial data */}
      {showProductModal && (
        <ProductMasterModal
          open={showProductModal}
          onClose={() => setShowProductModal(false)}
          onSave={handleSaveProduct}
          initialData={getInitialDataForModal()}
          mode="create"
        />
      )}
    </>
  );
};

export default BatchProductModal;