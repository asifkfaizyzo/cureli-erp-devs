import { 
  X, 
  AlertTriangle, 
  PlayCircle, 
  PauseCircle, 
  Power,
  Copy,
  Users,
  CheckCircle2
} from "lucide-react";

const ACTION_CONFIG = {
  activate: {
    title: "Activate Plan",
    icon: PlayCircle,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    buttonColor: "bg-emerald-600 hover:bg-emerald-700",
    buttonText: "Activate Plan",
  },
  suspend: {
    title: "Suspend Plan",
    icon: PauseCircle,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
    buttonColor: "bg-orange-600 hover:bg-orange-700",
    buttonText: "Suspend Plan",
  },
  reactivate: {
    title: "Reactivate Plan",
    icon: Power,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    buttonColor: "bg-emerald-600 hover:bg-emerald-700",
    buttonText: "Reactivate",
  },
  clone: {
    title: "Clone Plan",
    icon: Copy,
    iconColor: "text-[#05015A]",
    iconBg: "bg-[#05015A]/10",
    buttonColor: "bg-[#05015A] hover:bg-[#0a0280]",
    buttonText: "Create Clone",
  },
};

export default function ConfirmActionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  plan,
  newName = null // For clone action
}) {
  if (!isOpen || !action || !plan) return null;

  const config = ACTION_CONFIG[action];
  const Icon = config.icon;

  const renderContent = () => {
    switch (action) {
      case "activate":
        return (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              You are about to activate <strong>"{plan.name}"</strong>.
            </p>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">This action is irreversible:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Plan will become live and billable</li>
                    <li>Plan details can no longer be modified</li>
                    <li>Changes require cloning and creating a new plan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "suspend":
        const hasSubscribers = plan.subscriberCount > 0;
        return (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              You are about to suspend <strong>"{plan.name}"</strong>.
            </p>
            
            {hasSubscribers ? (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start gap-2">
                  <Users size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-orange-800">
                    <p className="font-semibold mb-1">
                      This plan has {plan.subscriberCount} active subscribers
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>New signups will be blocked immediately</li>
                      <li>Existing subscriptions will continue until expiry</li>
                      <li>Plan will become <strong>DEPRECATED</strong></li>
                      <li>Once all subscriptions end, status changes to SUSPENDED</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <p className="font-semibold mb-1">No active subscribers</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Plan will be immediately SUSPENDED</li>
                      <li>Can be reactivated later</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "reactivate":
        return (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              You are about to reactivate <strong>"{plan.name}"</strong>.
            </p>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-emerald-800">
                  <p className="font-semibold mb-1">Plan will become active:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>New subscriptions will be accepted</li>
                    <li>Plan will appear on pricing page</li>
                    <li>Same immutability rules apply</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "clone":
        return (
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              Create a draft copy of <strong>"{plan.name}"</strong>.
            </p>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-2">New draft will be created:</p>
                <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                  <Copy size={14} className="text-blue-600" />
                  <span className="font-medium">{newName}</span>
                  <span className="text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 rounded">
                    DRAFT
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="
          bg-white w-full max-w-sm mx-4 rounded-2xl shadow-2xl 
          relative overflow-hidden animate-[fadeIn_0.2s_ease-out]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="
            absolute top-4 right-4 p-1.5 rounded-full 
            bg-gray-100 hover:bg-gray-200
            transition-all duration-300
          "
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Icon & Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl ${config.iconBg}`}>
              <Icon size={24} className={config.iconColor} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{config.title}</h2>
          </div>

          {/* Content */}
          {renderContent()}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="
                flex-1 py-2.5 rounded-lg text-sm font-medium 
                border-2 border-gray-200 text-gray-600
                hover:border-gray-300 hover:bg-gray-50
                transition-all duration-300
              "
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`
                flex-1 text-white py-2.5 rounded-lg font-medium text-sm
                ${config.buttonColor}
                active:scale-[0.98]
                transition-all duration-300
              `}
            >
              {config.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}