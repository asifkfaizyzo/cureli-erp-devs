import { useState, useEffect, useRef } from "react";

const BusinessInfo = ({ onContinue }) => {
    const [form, setForm] = useState({
        name: "",
        address: "",
    });

    const [errors, setErrors] = useState({});
    const nameRef = useRef(null);
    const addressRef = useRef(null);

    // Auto-focus first input when component loads
    useEffect(() => {
        if (nameRef.current) nameRef.current.focus();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        let newErrors = {};

        if (!form.name.trim()) newErrors.name = "Business name is required";
        if (!form.address.trim()) newErrors.address = "Address is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onContinue();
    };

    return (
        <div
            className="w-full max-w-xl font-poppins"
            style={{ marginLeft: "-10%", marginTop: "30px" }}
        >
            <h2 className="text-[30px] font-semibold text-[#000006] mb-6">
                Add Your Business Name & Address
            </h2>

            {/* BUSINESS NAME */}
            <label className="text-xs font-bold text-[#000060]">Business Name *</label>
            <input
                ref={nameRef}
                type="text"
                value={form.name}
                placeholder="Enter business name"
                onChange={(e) => handleChange("name", e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        addressRef.current.focus();
                    }
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg 
                    ${errors.name ? "border-red-500" : "border-gray-300"}
                    focus:ring-2 focus:ring-[#000060] transition`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 mb-3">{errors.name}</p>}

            {/* BUSINESS ADDRESS */}
            <label className="text-xs font-bold text-[#000060]">Business Address *</label>
            <input
                ref={addressRef}
                type="text"
                value={form.address}
                placeholder="Enter complete address"
                onChange={(e) => handleChange("address", e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full mt-1 px-3 py-2 bg-white border rounded-lg 
                    ${errors.address ? "border-red-500" : "border-gray-300"}
                    focus:ring-2 focus:ring-[#000060] transition`}
            />
            {errors.address && (
                <p className="text-red-500 text-xs mt-1 mb-4">{errors.address}</p>
            )}

            <button
                onClick={handleSubmit}
                className="w-full bg-[#000060] text-white py-2 rounded-xl mt-2
                           hover:bg-[#000060d1] transition"
            >
                Continue
            </button>
        </div>
    );
};

export default BusinessInfo;
