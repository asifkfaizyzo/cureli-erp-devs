import { useState, useEffect, useRef } from "react";
import { updateShopInfo } from "../api/shop";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const BusinessInfo = ({ onContinue }) => {
  const [form, setForm] = useState({
    name: "",
    address1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const nameRef = useRef(null);
  const navigate = useNavigate();
  
  // ✅ Get shop_id from localStorage
  const shop_id = localStorage.getItem("shop_id");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    if (!shop_id) {
      navigate("/signup");
      return;
    }
  }, [shop_id, navigate]);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Business name is required";
    if (!form.address1.trim())
      newErrors.address1 = "Address Line 1 is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!/^[0-9]{6}$/.test(form.pincode))
      newErrors.pincode = "Enter a valid 6-digit pincode";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await updateShopInfo({
        shop_id,
        business_name: form.name,
        address_line_1: form.address1,
        address_line_2: "",
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      });

      onContinue();
    } catch (err) {
      console.log("SHOP ERROR:", err.response?.data);
      alert(err?.response?.data?.message || "Failed to save business info");
    }
    setLoading(false);
  };

  return (
    <div
      className="w-full max-w-xl font-poppins h-[100vh] overflow-y-auto"
      style={{ marginLeft: "-10%", paddingTop: "20px", paddingRight: "10px" }}
    >
      <h2 className="text-[26px] font-semibold text-[#000006] mb-4">
        Business Information
      </h2>

      {/* BUSINESS NAME */}
      <label className="text-xs font-bold text-[#000060]">
        Business Name *
      </label>
      <input
        ref={nameRef}
        type="text"
        value={form.name}
        placeholder="Enter business name"
        onChange={(e) => handleChange("name", e.target.value)}
        className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg ${
          errors.name ? "border-red-500" : "border-gray-300"
        } focus:ring-2 focus:ring-[#000060] transition`}
      />
      {errors.name && (
        <p className="text-red-500 text-xs mt-1 mb-2">{errors.name}</p>
      )}

      {/* ADDRESS LINE 1 */}
      <label className="text-xs font-bold text-[#000060]">Address *</label>
      <input
        type="text"
        value={form.address1}
        placeholder="Building, Street"
        onChange={(e) => handleChange("address1", e.target.value)}
        className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg ${
          errors.address1 ? "border-red-500" : "border-gray-300"
        } focus:ring-2 focus:ring-[#000060] transition`}
      />
      {errors.address1 && (
        <p className="text-red-500 text-xs mt-1 mb-2">{errors.address1}</p>
      )}

      {/* CITY - STATE - PINCODE */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {/* CITY */}
        <div>
          <label className="text-xs font-bold text-[#000060]">City *</label>
          <input
            type="text"
            value={form.city}
            placeholder="City"
            onChange={(e) => handleChange("city", e.target.value)}
            className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg ${
              errors.city ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-[#000060] transition`}
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city}</p>
          )}
        </div>

        {/* STATE */}
        <div>
          <label className="text-xs font-bold text-[#000060]">State *</label>
          <input
            type="text"
            value={form.state}
            placeholder="State"
            onChange={(e) => handleChange("state", e.target.value)}
            className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg ${
              errors.state ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-[#000060] transition`}
          />
          {errors.state && (
            <p className="text-red-500 text-xs mt-1">{errors.state}</p>
          )}
        </div>

        {/* PINCODE */}
        <div>
          <label className="text-xs font-bold text-[#000060]">Pincode *</label>
          <input
            type="text"
            value={form.pincode}
            maxLength={6}
            placeholder="Pincode"
            onChange={(e) => handleChange("pincode", e.target.value)}
            className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg ${
              errors.pincode ? "border-red-500" : "border-gray-300"
            } focus:ring-2 focus:ring-[#000060] transition`}
          />
          {errors.pincode && (
            <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
          )}
        </div>
      </div>

      <button
  onClick={handleSubmit}
  disabled={loading}
  className="w-full bg-[#000060] text-white py-2 rounded-xl mt-6
             hover:bg-[#000060d1] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
>
  {loading ? (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className="h-5 w-5 animate-spin" />
      Saving...
    </div>
  ) : (
    "Continue"
  )}
</button>
    </div>
  );
};

export default BusinessInfo;