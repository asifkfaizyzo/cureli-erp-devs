const Homepage = () => {
    return (
        <>
        <div className="relative flex h-screen w-full overflow-hidden">
                        
                        {/* LEFT SIDE (extended to 70%) */}
                        <div className="relative w-[70%] h-full">
        
                            {/* Background */}
                            <div className="absolute inset-0 w-full h-full overflow-hidden">
                                <img
                                    src={bgImage}
                                    alt="Background"
                                    className="w-full h-full object-cover scale-145 -translate-x-[25%]"
                                />
                            </div>
        
                            {/* BLUE Overlay */}
                            <div className="absolute inset-0 bg-[#000060A3]" />
        
                            {/* ✔ LOGO TOP-LEFT */}
                            <img
                                src={logo}
                                alt="Cureli Logo"
                                className="absolute top-10 left-6 w-45 z-20"
                            />
        
                            {/* Content */}
                            <div className="absolute z-10 text-white px-12 mt-28 font-poppins">
            
            {/* Heading (exact match) */}
            <h1 className="text-5xl mt-10 mb-10 font-semibold leading-tight tracking-wide">
                Welcome to Cureli
            </h1>
        
            {/* Paragraph (exact match) */}
            <p className="mt-10 text-2xl font-light leading-relaxed text-[#FFFFFF]">
                “Smarter stock, billing, and expiry control.<br/>
                Your pharmacy starts here.”
            </p>
        </div>
                        </div>
                        {/* RIGHT SIDE (reduced to 50%) */}
                        <div className="relative w-[50%] h-full bg-white p-10 flex items-center justify-center">
                            
                            {/* Slanted divider */}
                            <div
                                className="absolute left-[-85px] top-0 h-full w-[220px] bg-white transform -skew-x-[12deg]"
                            ></div>
        
                            {/* Content */}
                            <div className="relative z-10 w-full max-w-sm">
                                <h2 className="text-3xl font-semibold mb-6 text-center">
                                    login
                                </h2>
                            </div>
        
                        </div>
                    </div>
        </>
    );
}
export default Homepage;