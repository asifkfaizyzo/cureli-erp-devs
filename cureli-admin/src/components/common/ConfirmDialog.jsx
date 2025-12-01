import { AlertTriangle, Trash2, Info, CheckCircle, X } from "lucide-react";

const iconMap = {
  danger: { icon: Trash2, bg: "bg-red-100", color: "text-red-600" },
  warning: { icon: AlertTriangle, bg: "bg-amber-100", color: "text-amber-600" },
  info: { icon: Info, bg: "bg-blue-100", color: "text-blue-600" },
  success: { icon: CheckCircle, bg: "bg-emerald-100", color: "text-emerald-600" },
};

const buttonStyles = {
  danger: "bg-red-500 hover:bg-red-600 text-white",
  warning: "bg-amber-500 hover:bg-amber-600 text-white",
  info: "bg-blue-500 hover:bg-blue-600 text-white",
  success: "bg-emerald-500 hover:bg-emerald-600 text-white",
};

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  loading = false,
}) => {
  if (!isOpen) return null;

  const iconConfig = iconMap[type] || iconMap.danger;
  const Icon = iconConfig.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${iconConfig.bg} flex items-center justify-center`}>
              <Icon size={32} className={iconConfig.color} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-500 text-center text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                       bg-gray-100 text-gray-700 hover:bg-gray-200
                       transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                       transition-all disabled:opacity-50
                       flex items-center justify-center gap-2
                       ${buttonStyles[type]}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;