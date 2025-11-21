import React from "react";

const OnboardStepper = ({ progressStep }) => {

    // Updated dot steps (NEW 7 business dots)
    const dotSteps = [
        1, 3,      // Basic: 2 dots
        4, 5, 6, 7, 8, 9, 10  // Business: 7 dots
    ];

    const SmallDot = ({ filled }) => (
        <div
            className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${filled ? "bg-[#000066] scale-110" : "bg-gray-300 scale-100"}
            `}
            style={{ marginLeft: -2, marginRight: -2, marginTop: -20 }}
        />
    );

    const Line = ({ active }) => (
        <div
            className={`
                h-[3px] flex-1 transition-all duration-300
                ${active ? "bg-[#000066]" : "bg-gray-300"}
            `}
            style={{ marginLeft: -35, marginRight: -35, marginTop: -20 }}
        />
    );

    const BigCircle = ({ active, completed, pending, label }) => (
        <div className="flex flex-col items-center z-10">
            <div
                className={`
                    w-6 h-6 rounded-full flex items-center justify-center border-[2px]
                    transition-all duration-300 bg-white
                    ${
                        pending
                            ? "border-orange-500"
                            : active || completed
                            ? "border-[#000066]"
                            : "border-gray-400"
                    }
                    ${completed ? "bg-[#000066]" : ""}
                `}
                style={{ marginLeft: -3, marginRight: -3 }}
            >
                {/* ✓ */}
                {completed && (
                    <span className="text-white font-bold text-[10px] leading-none">
                        ✓
                    </span>
                )}

                {/* ! */}
                {pending && (
                    <span className="text-orange-500 font-bold text-[10px] leading-none">
                        !
                    </span>
                )}

                {/* pulsing active dot */}
                {active && !completed && !pending && (
                    <div className="w-2 h-2 rounded-full bg-[#000066] animate-pulse"></div>
                )}
            </div>

            <p
                className={`mt-1 text-xs ${
                    active || completed
                        ? "text-[#000066] font-semibold"
                        : "text-gray-500"
                }`}
            >
                {label}
            </p>
        </div>
    );

    return (
        <div
            className="flex flex-col items-center w-full mt-4"
            style={{ marginLeft: -3, marginRight: -3, marginTop: -10 }}
        >
            <h1 className="text-3xl font-semibold text-gray-500 mb-6">
                Onboarding:{" "}
                <span className="text-[#000066] font-bold">Cureli</span>
            </h1>

            <div className="flex items-center w-full max-w-2xl">

                {/* BASIC CIRCLE */}
                <BigCircle
                    active={progressStep >= 0 && progressStep < 4}
                    completed={progressStep >= 4}
                    label="Basic Details"
                />

                {/* BASIC DOTS (2 dots) */}
                {dotSteps.slice(0, 2).map((step, i) => (
                    <React.Fragment key={`basic-${i}`}>
                        <Line active={progressStep >= step} />
                        <SmallDot filled={progressStep >= step} />
                    </React.Fragment>
                ))}

                <Line active={progressStep >= 4} />

                {/* BUSINESS CIRCLE */}
                <BigCircle
                    active={progressStep >= 4 && progressStep < 12}
                    completed={progressStep >= 12}
                    label="Business Details"
                />

                {/* BUSINESS DOTS (7 dots) */}
                {dotSteps.slice(2).map((step, i) => (
                    <React.Fragment key={`bus-${i}`}>
                        <Line active={progressStep >= step} />
                        <SmallDot filled={progressStep >= step} />
                    </React.Fragment>
                ))}

                <Line active={progressStep >= 12} />

                {/* PENDING */}
                <BigCircle
                    pending={progressStep === 12}
                    completed={progressStep === 13}
                    label="Pending"
                />

                <Line active={progressStep === 13} />

                {/* SUCCESS */}
                <BigCircle
                    active={progressStep === 13}
                    completed={progressStep === 13}
                    label="Successfull"
                />
            </div>
        </div>
    );
};

export default OnboardStepper;
