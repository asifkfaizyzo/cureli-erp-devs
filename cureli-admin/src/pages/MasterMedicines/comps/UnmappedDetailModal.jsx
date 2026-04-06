// cadmin/src/pages/MasterMedicines/comps/UnmappedDetailModal.jsx

import { useEffect } from "react";
import {
  X,
  Link2,
  Plus,
  Store,
  Calendar,
  Hash,
  FileText,
  Image,
  ImageOff,
  Clock,
  TrendingUp,
  Building2,
} from "lucide-react";

const UnmappedDetailModal = ({ isOpen, item, onClose, onMatch, onCreate }) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden 
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-white" />
              <div>
                <h2 className="text-white text-lg font-semibold">Unmapped Medicine Analysis</h2>
                <p className="text-white/70 text-sm">
                  Detailed view and shop distribution
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {item.normalizedName}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span
                    className={`px-2 py-1 rounded-full font-medium ${
                      item.type === "DRUG"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash size={14} />
                    {item.occurrenceCount} occurrences
                  </span>
                  <span className="flex items-center gap-1">
                    <Store size={14} />
                    {item.shopCount} shops
                  </span>
                </div>
              </div>
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  item.hasImageSuggestion ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {item.hasImageSuggestion ? (
                  <Image size={28} className="text-green-600" />
                ) : (
                  <ImageOff size={28} className="text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Hash}
              label="Total Occurrences"
              value={item.occurrenceCount}
              color="blue"
            />
            <StatCard
              icon={Store}
              label="Unique Shops"
              value={item.shopCount}
              color="purple"
            />
            <StatCard
              icon={FileText}
              label="Name Variations"
              value={item.sampleNames?.length || 0}
              color="orange"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg per Shop"
              value={Math.round(item.occurrenceCount / item.shopCount)}
              color="green"
            />
          </div>

          {/* Name Variations */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText size={16} />
              Name Variations ({item.sampleNames?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-2">
              {item.sampleNames?.map((name, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm
                             hover:bg-gray-200 transition-colors cursor-default"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Shop Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 size={16} />
              Shop Distribution
            </h4>
            <div className="space-y-3">
              {item.shops?.map((shop) => {
                const percentage = Math.round((shop.count / item.occurrenceCount) * 100);
                return (
                  <div key={shop.id} className="flex items-center gap-3">
                    <div className="w-32 truncate text-sm text-gray-700 font-medium">
                      {shop.name}
                    </div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full
                                   flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(percentage, 10)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{shop.count}</span>
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm text-gray-500">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Timeline
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">First Seen</p>
                  <p className="text-sm font-medium text-gray-700">
                    {formatDate(item.firstSeenAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Last Seen</p>
                  <p className="text-sm font-medium text-gray-700">
                    {formatDate(item.lastSeenAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">ID: {item.id}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={onMatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                           flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Link2 size={16} />
                Match to Existing
              </button>
              <button
                onClick={onCreate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium
                           flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                Create New
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
};

export default UnmappedDetailModal;