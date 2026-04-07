// cadmin/src/pages/MasterMedicines/comps/MatchMedicineModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Link2,
  CheckCircle2,
  Image,
  ImageOff,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { getMasterMedicines } from "../../../api/cadminMasterMedicines";

const MatchMedicineModal = ({
  isOpen,
  item,
  source,
  onClose,
  onConfirm,
}) => {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Transform API response to component format
  function transformMaster(med) {
    return {
      id: med.id,
      name: med.genericName,
      genericName: med.genericName,
      masterKey: med.masterKey,
      normalizedName: med.masterKey,
      composition: Array.isArray(med.composition)
        ? med.composition.map((c) => c.name).join(" + ")
        : "N/A",
      type: med.type,
      form: med.form,
      manufacturer: med.previewVariants?.[0]?.manufacturer || "N/A",
      packSize: med.previewVariants?.[0]?.packSize || "N/A",
      prescriptionRequired: med.prescriptionRequired,
      hasImage: !!med.primaryImage,
      variantCount: med.variantCount,
    };
  }

  // Load initial results when modal opens
  const loadInitialResults = async () => {
    try {
      setIsSearching(true);
      const res = await getMasterMedicines({ limit: 20, sort: "generic_name", order: "asc" });
      const data = res.data?.data;
      if (data) {
        setSearchResults(data.medicines.map(transformMaster));
      }
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchText("");
      setTypeFilter("");
      setSelectedMedicine(null);
      setIsConfirming(false);
      setSearchResults([]);

      // Load initial results
      loadInitialResults();
    }
  }, [isOpen]);

  // Search with debounce
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const params = { limit: 20, sort: "generic_name", order: "asc" };
        if (searchText.trim()) params.search = searchText.trim();
        if (typeFilter) params.type = typeFilter;

        const res = await getMasterMedicines(params);
        const data = res.data?.data;
        if (data) {
          setSearchResults(data.medicines.map(transformMaster));
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, typeFilter, isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleConfirm = async () => {
    if (!selectedMedicine) return;
    setIsConfirming(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    onConfirm(selectedMedicine);
  };

  const itemName = source === "unmapped" ? item.normalizedName : item.rawName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden 
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link2 size={20} className="text-white" />
              <div>
                <h2 className="text-white text-lg font-semibold">Match to Existing Medicine</h2>
                <p className="text-white/70 text-sm">
                  Select a medicine from the master catalog
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Source Item Info */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-600 font-medium">Matching:</span>
            <span className="px-3 py-1 bg-white rounded-lg text-sm font-semibold text-gray-800 shadow-sm">
              "{itemName}"
            </span>
            {source === "unmapped" && (
              <span className="text-xs text-blue-500">
                ({item.occurrenceCount} occurrences from {item.shopCount} shops)
              </span>
            )}
            {source === "review" && (
              <span className="text-xs text-blue-500">
                (Confidence: {item.confidenceScore}%)
              </span>
            )}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, composition, or manufacturer..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 px-4 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Types</option>
              <option value="DRUG">Drug</option>
              <option value="OTC">OTC</option>
            </select>
          </div>
        </div>

        {/* Medicine List */}
        <div className="flex-1 overflow-auto px-6 py-4 min-h-[300px] max-h-[400px]">
          {isSearching ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Loader2 size={32} className="animate-spin mr-3" />
              <p>Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <AlertCircle size={48} className="mb-3" />
              <p className="text-lg font-medium">No medicines found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((med) => {
                const isSelected = selectedMedicine?.id === med.id;
                return (
                  <button
                    key={med.id}
                    onClick={() => setSelectedMedicine(med)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Image Indicator */}
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          med.hasImage ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {med.hasImage ? (
                          <Image size={20} className="text-green-600" />
                        ) : (
                          <ImageOff size={20} className="text-red-500" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {med.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              med.type === "DRUG"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {med.type}
                          </span>
                          {med.prescriptionRequired && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              Rx
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {med.composition || "No composition info"}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{med.manufacturer || "Unknown manufacturer"}</span>
                          <span>•</span>
                          <span>{med.packSize || "N/A"}</span>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <CheckCircle2 size={24} className="text-blue-500" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {searchResults.length} medicine(s) found
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedMedicine || isConfirming}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                           flex items-center gap-2 hover:bg-blue-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Matching...
                  </>
                ) : (
                  <>
                    <Link2 size={16} />
                    Confirm Match
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview */}
          {selectedMedicine && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Match Preview:</p>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm font-medium">
                  {itemName}
                </span>
                <ArrowRight size={16} className="text-gray-400" />
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                  {selectedMedicine.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchMedicineModal;