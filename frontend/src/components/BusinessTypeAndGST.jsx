import { useState, useRef, useEffect } from "react";
import { updateShopGst } from "../api/shop";
import { useNavigate } from "react-router-dom";

const BusinessTypeAndGST = ({ onContinue }) => {
    const [form, setForm] = useState({
        type: "",
        gst: "",
    });

    const [errors, setErrors] = useState({});
    const [gstValid, setGstValid] = useState(null);
    const [loading, setLoading] = useState(false);

    const gstRef = useRef(null);
    const typeRef = useRef(null);

    const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    const businessTypes = [
        "Sole Proprietorship",
        "Partnership",
        "Private Limited",
        "LLP",
    ];

    const navigate = useNavigate();
    const shop_id = localStorage.getItem("shop_id");

    useEffect(() => {
        if (!shop_id) navigate("/signup");
    }, [shop_id]);

    useEffect(() => {
        typeRef.current?.focus();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        let newErrors = {};

        if (!form.type.trim()) newErrors.type = "Please select a business type";
        if (!form.gst.trim()) newErrors.gst = "GST number is required";
        else if (!GST_REGEX.test(form.gst))
            newErrors.gst = "Invalid GST format";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);

        try {
            await updateShopGst({
                shop_id,
                business_type: form.type,
                gst_number: form.gst,
            });

            onContinue(); // move to next onboarding step
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to save GST information");
        }

        setLoading(false);
    };

    return (
        <div
            className="w-full max-w-xl font-poppins"
            style={{ marginLeft: "-10%", marginTop: "30px" }}
        >
            <h2 className="text-[30px] font-semibold text-[#000006] mb-6">
                Add Your Business Type & GST Number
            </h2>

            {/* BUSINESS TYPE */}
            <label className="text-xs font-bold text-[#000060]">Business Type *</label>
            <select
                ref={typeRef}
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg 
                    ${errors.type ? "border-red-500" : "border-gray-300"}
                    focus:ring-2 focus:ring-[#000060] transition`}
            >
                <option value="">Select business type</option>
                {businessTypes.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                ))}
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1 mb-3">{errors.type}</p>}

            {/* GST NUMBER */}
            <label className="text-xs font-bold text-[#000060]">GST Number *</label>
            <input
                ref={gstRef}
                type="text"
                maxLength={15}
                value={form.gst}
                placeholder="Enter GST number"
                onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    handleChange("gst", value);
                    setGstValid(value === "" ? null : GST_REGEX.test(value));
                }}
                className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg transition
                    ${
                        gstValid === null
                            ? "border-gray-300"
                            : gstValid
                            ? "border-green-600"
                            : "border-red-500"
                    }
                    focus:ring-2 focus:ring-[#000060]`}
            />

            {gstValid === false && <p className="text-red-500 text-xs mt-1">Invalid GST number</p>}
            {gstValid === true && <p className="text-green-600 text-xs mt-1">Valid GST number ✓</p>}
            {errors.gst && <p className="text-red-500 text-xs mt-1 mb-4">{errors.gst}</p>}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#000060] text-white py-2 rounded-xl mt-2
                           hover:bg-[#000060d1] transition disabled:bg-gray-400"
            >
                {loading ? "Saving..." : "Continue"}
            </button>
        </div>
    );
};

export default BusinessTypeAndGST;
