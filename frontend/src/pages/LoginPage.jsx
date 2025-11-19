import bgImage from "../assets/images/login-background.jpg";
import logo from "../assets/icons/logo.png";
import LoginForm from "../components/LoginForm";   // <-- NEW LOGIN FORM

const LoginPage = () => {
    return (
        <>
            <div className="relative flex h-screen w-full overflow-hidden">
                
                {/* LEFT SIDE (70%) */}
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

                    {/* Logo */}
                    <img
                        src={logo}
                        alt="Cureli Logo"
                        className="absolute top-10 left-6 w-45 z-20"
                    />

                    {/* TEXT CONTENT */}
                    <div className="absolute z-10 text-white px-12 mt-28 font-poppins">
                        <h1 className="text-5xl mt-10 mb-10 font-semibold leading-tight tracking-wide">
                            Welcome to Cureli
                        </h1>

                        <p className="mt-10 text-2xl font-light leading-relaxed text-white">
                            “Smarter stock, billing, and expiry control.<br />
                            Your pharmacy starts here.”
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE (30%) */}
                <div className="relative w-[50%] h-full bg-white p-10 flex items-center justify-center font-poppins">
                    
                    {/* Slanted divider */}
                    <div
                        className="absolute left-[-85px] top-0 h-full w-[220px] bg-white transform -skew-x-[12deg]"
                    ></div>

                    {/* LOGIN FORM (REPLACED WITH NEW) */}
                    <div className="relative z-10 w-full max-w-sm">
                        <LoginForm />
                    </div>

                </div>
            </div>
        </>
    );
};

export default LoginPage;
