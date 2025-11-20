import React from "react";
import success from "../assets/images/success.jpg";

const OnboardSuccess = ({ onStart }) => {
    return (
        <div className="w-full flex flex-col items-center mt-10 px-4 font-poppins">

            {/* CARD */}
            <div
                className="w-full max-w-3xl bg-white rounded-xl shadow-md flex flex-col items-center py-16 px-6"
                style={{ boxShadow: "0px 4px 35px rgba(0,0,0,0.08)" }}
            >
                {/* SUCCESS ICON */}
                <img
                    src={success}
                    alt="success"
                    className="w-32 h-30 mb-4"
                />

                {/* TITLE */}
                <h2 className="text-[28px] font-semibold text-[#000060] text-center">
                    Welcome to Cureli
                </h2>

                {/* SUBTEXT */}
                <p className="text-gray-600 text-sm text-center mt-2">
                    We’re excited to have you get started.
                </p>
            </div>

            {/* BUTTON */}
            <button
                onClick={onStart}
                className="w-full max-w-md bg-[#000060] text-white py-3 rounded-xl 
                           hover:bg-[#000060d1] transition font-medium mt-6"
            >
                Get Started
            </button>

        </div>
    );
};

export default OnboardSuccess;
