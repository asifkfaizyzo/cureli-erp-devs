import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import 'aos/dist/aos.css';
import AOS from 'aos';
// ❌ REMOVE THIS:
// import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"; 
AOS.init({
  duration: 1000,
  once: true,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {/* ❌ REMOVE GoogleReCaptchaProvider wrapper */}
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);