import { useState, useRef } from "react";
import { saveUsername, completeSignup } from "../api/auth";

const IdentityForm = ({ pending_id, onContinue, onNext }) => {
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({});
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const usernameRef = useRef(null);

  const validate = () => {
    const err = {};

    if (!username.trim()) err.username = "Username is required";
    else if (username.trim().length < 4)
      err.username = "Username must be at least 4 characters";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // SUBMIT USERNAME → backend check + save
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      await saveUsername({ pending_id, username });

      setErrors({});
      setUsernameSaved(true); // enable NEXT button
    } catch (err) {
      setErrors({
        username: err?.response?.data?.message || "Username error",
      });
    }

    setLoading(false);
  };

  // FINALIZE SIGNUP → convert pending user → real user
  const handleNextClick = async () => {
  if (!usernameSaved) return;

  try {
    const res = await completeSignup({ pending_id });

    const { user, shop, access_token } = res.data.data;

    // Save tokens + shop_id for the next onboarding steps
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("shop_id", shop.shop_id);
    localStorage.setItem("user_id", user.user_id);

    onNext(); // Move forward
  } catch (err) {
    alert(err?.response?.data?.message || "Failed to complete signup");
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

      <input
        type="text"
        ref={usernameRef}
        placeholder="Enter username"
        className={`w-full mt-1 px-3 py-2 rounded-lg bg-white border text-gray-700 text-sm
          ${errors.username ? "border-red-500" : "border-gray-300"}`}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      {errors.username && (
        <p className="text-red-500 text-xs mt-1">{errors.username}</p>
      )}

      <div className="flex gap-3 mt-6">
        {/* SUBMIT USERNAME */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-[#000060] text-white py-2.5 rounded-lg text-sm hover:bg-[#000060d1] 
                     transition disabled:bg-gray-400"
        >
          {loading ? "Saving..." : "Submit"}
        </button>

        {/* NEXT BUTTON */}
        <button
          onClick={handleNextClick}
          disabled={!usernameSaved}
          className={`flex-1 py-2.5 rounded-lg text-sm transition 
            ${
              usernameSaved
                ? "bg-[#000060] text-white hover:bg-[#000060d1]"
                : "bg-gray-200 text-[#000060] cursor-not-allowed"
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default IdentityForm;
