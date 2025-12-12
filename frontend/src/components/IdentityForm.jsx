import { useState, useRef, useEffect } from "react";
import { saveUsername, completeSignup } from "../api/auth";
import { Loader2, Check, AlertCircle, Sparkles } from "lucide-react";

const IdentityForm = ({ pending_id, onContinue, onNext }) => {
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({});
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const usernameRef = useRef(null);

  // Trigger success animation
  useEffect(() => {
    if (usernameSaved) {
      setShowSuccess(true);
    }
  }, [usernameSaved]);

  const validate = () => {
    const err = {};

    if (!username.trim()) err.username = "Username is required";
    else if (username.trim().length < 4)
      err.username = "Username must be at least 4 characters";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await saveUsername({ pending_id, username });

      setErrors({});
      setUsernameSaved(true);
    } catch (err) {
      setErrors({
        username: err?.response?.data?.message || "Username error",
      });
      setUsernameSaved(false);
      setShowSuccess(false);
    }

    setLoading(false);
  };

  const handleNextClick = async () => {
    if (!usernameSaved) return;

    try {
      const res = await completeSignup({ pending_id });

      const { user, shop, access_token } = res.data.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("shop_id", shop.shop_id);
      localStorage.setItem("user_id", user.user_id);

      onNext();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to complete signup");
    }
  };

  // Reset saved state when username changes
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (usernameSaved) {
      setUsernameSaved(false);
      setShowSuccess(false);
    }
  };

  return (
    <div className="w-full max-w-md mt-6 px-3" style={{ marginLeft: "-20%" }}>
      <h2 className="text-2xl font-bold text-[#000006]">Create Username</h2>

      <p className="text-gray-500 text-sm mt-1">
        Choose a username for your account. You can log in using this username.
      </p>

      <hr className="my-4 border-gray-300" />

      <label className="text-xs font-medium text-[#000060]">Username *</label>

      {/* INPUT WITH SUCCESS/ERROR STATES */}
      <div className="relative">
        <input
          type="text"
          ref={usernameRef}
          placeholder="Enter username"
          className={`w-full mt-1 px-3 py-2 pr-10 rounded-lg bg-white border text-gray-700 text-sm
            transition-all duration-300 ease-out
            ${errors.username 
              ? "border-red-500 focus:ring-2 focus:ring-red-200" 
              : usernameSaved 
                ? "border-green-500 focus:ring-2 focus:ring-green-200 bg-green-50" 
                : "border-gray-300 focus:ring-2 focus:ring-[#000060]/20"
            }`}
          value={username}
          onChange={handleUsernameChange}
        />

        {/* SUCCESS CHECKMARK ICON */}
        {usernameSaved && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
            <div className="animate-scale-in">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white animate-check-stroke" />
              </div>
            </div>
          </div>
        )}

        {/* ERROR ICON */}
        {errors.username && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
            <AlertCircle className="w-5 h-5 text-red-500 animate-shake" />
          </div>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {errors.username && (
        <p className="text-red-500 text-xs mt-1 animate-slide-down">
          {errors.username}
        </p>
      )}

      {/* SUCCESS MESSAGE */}
      {showSuccess && usernameSaved && (
        <div className="flex items-center gap-2 mt-2 animate-slide-down">
          <Sparkles className="w-4 h-4 text-green-500 animate-pulse" />
          <p className="text-green-600 text-sm font-medium">
            Username is available!
          </p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {/* SUBMIT USERNAME WITH SPINNER */}
        <button
          onClick={handleSubmit}
          disabled={loading || usernameSaved}
          className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-300
            ${usernameSaved 
              ? "bg-green-500 text-white cursor-default" 
              : "bg-[#000060] text-white hover:bg-[#000060d1] disabled:bg-gray-400 disabled:cursor-not-allowed"
            }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking...
            </div>
          ) : usernameSaved ? (
            <div className="flex items-center justify-center gap-2 animate-scale-in">
              <Check className="h-4 w-4" />
              Saved!
            </div>
          ) : (
            "Check Availability"
          )}
        </button>

        {/* NEXT BUTTON WITH ATTENTION ANIMATION */}
        <button
          onClick={handleNextClick}
          disabled={!usernameSaved}
          className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-300 
            ${
              usernameSaved
                ? "bg-[#000060] text-white hover:bg-[#000060d1] animate-pulse-subtle shadow-lg shadow-[#000060]/30"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          {usernameSaved ? (
            <span className="flex items-center justify-center gap-2">
              Continue
              <svg 
                className="w-4 h-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          ) : (
            "Next"
          )}
        </button>
      </div>

      {/* STYLE TAG FOR CUSTOM ANIMATIONS */}
      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slide-down {
          0% {
            transform: translateY(-10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        @keyframes check-stroke {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        @keyframes bounce-x {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(3px);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .animate-bounce-x {
          animation: bounce-x 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default IdentityForm;