import bgImage from "../assets/images/login-background.jpg";
import logo from "../assets/icons/logo.png";  // <-- Add this

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
                            className="w-full h-full object-cover scale-150 -translate-x-[25%]"
                        />
                    </div>

                    {/* BLUE Overlay */}
                    <div className="absolute inset-0 bg-[#000060A3]" />

                    {/* ✔ LOGO TOP-LEFT */}
                    <img
                        src={logo}
                        alt="Cureli Logo"
                        className="absolute top-6 left-6 w-32 z-20"
                    />

                    {/* Content */}
                    <div className="relative z-10 text-white p-10 mt-20">
                        <h1 className="text-4xl font-bold">Welcome to Cureli</h1>
                        <p className="mt-4 text-lg">
                            “Smarter stock, billing, and expiry control…”
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE (reduced to 50%) */}
                <div className="relative w-[50%] h-full bg-white p-10 flex items-center justify-center">
                    
                    {/* Slanted divider */}
                    <div
                        className="absolute left-[-110px] top-0 h-full w-[220px] bg-white transform -skew-x-[20deg]"
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
};

export default Homepage;
