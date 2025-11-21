import { useState, useRef } from "react";

const IdentityForm = ({ onContinue, onNext }) => {
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({});

  const usernameRef = useRef(null);

  const validate = () => {
    const err = {};

    if (!username.trim()) err.username = "Username is required";
    else if (username.trim().length < 4)
      err.username = "Username must be at least 4 characters";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    onContinue && onContinue();
  };

  const handleNext = () => {
    if (!validate()) return;
    onNext && onNext();
  };

  return (
    <div
      className="w-full max-w-md mt-6 px-3"
      style={{ marginLeft: "-20%" }}
    >
      <h2 className="text-2xl font-bold text-[#000006]">
        Create Username
      </h2>

      <p className="text-gray-500 text-sm mt-1">
        Choose a username for your account. You can log in using this username.
      </p>

      <hr className="my-4 border-gray-300" />

      {/* Username */}
      <label className="text-xs font-medium text-[#000060]">
        Username *
      </label>

      <input
        type="text"
        ref={usernameRef}
        placeholder="Enter username"
        className={`w-full mt-1 px-3 py-2 rounded-lg bg-white border text-gray-700 text-sm
          ${errors.username ? "border-red-500" : "border-gray-300"}`}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleContinue();
          }
        }}
      />

      {errors.username && (
        <p className="text-red-500 text-xs mt-1">{errors.username}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleContinue}
          className="flex-1 bg-[#000060] text-white py-2.5 rounded-lg text-sm hover:bg-[#000060d1] transition"
        >
          Submit
        </button>

        <button
          onClick={handleNext}
          className="flex-1 bg-gray-200 text-[#000060] py-2.5 rounded-lg text-sm hover:bg-gray-300 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default IdentityForm;
