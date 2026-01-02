// ContactFormCard.jsx
import { useEffect, useState, useCallback } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { submitEnquiry } from "../../../../api/enquiries";

const ContactFormCard = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  // ✅ FIXED: Clear status on form interaction
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear submit status when user modifies form
    if (submitStatus) {
      setSubmitStatus(null);
      setSubmitMessage("");
    }
  };

  // ✅ FIXED: Validation function
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    // Phone is optional, but if provided must be 10 digits
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      // Check if reCAPTCHA is ready
      if (!executeRecaptcha) {
        setSubmitStatus("error");
        setSubmitMessage("reCAPTCHA not loaded. Please refresh the page.");
        return;
      }

      setIsSubmitting(true);
      setSubmitStatus(null);

      try {
        // Get reCAPTCHA v3 token
        const recaptchaToken = await executeRecaptcha("contact_form_submit");

        if (!recaptchaToken) {
          throw new Error("Failed to get reCAPTCHA token");
        }

        const response = await submitEnquiry({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone || "",
          message: formData.message.trim(),
          recaptchaToken,
        });

        setSubmitStatus("success");
        setSubmitMessage(
          response.data?.message || "Your enquiry has been submitted successfully!"
        );

        // Reset form
        setFormData({ name: "", email: "", phone: "", message: "" });

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus(null);
          setSubmitMessage("");
        }, 5000);
      } catch (error) {
        setSubmitStatus("error");
        setSubmitMessage(
          error.response?.data?.message || "Failed to send message. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [executeRecaptcha, formData, validateForm]
  );

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div
        className="max-w-6xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-5"
        data-aos="fade-up"
      >
        {/* Left: Form Section - 60% width on desktop */}
        <div className="md:col-span-3 bg-white p-5 xs:p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl md:rounded-r-none">
          {/* Success Message */}
          {submitStatus === "success" && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-700 font-manrope text-sm">{submitMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === "error" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 font-manrope text-sm">{submitMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 xs:space-y-6 sm:space-y-7">
            {/* Name */}
            <div>
              <label className="block font-manrope text-xs xs:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                disabled={isSubmitting}
                className={`w-full border-b-2 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } px-1 py-2 sm:py-2.5 font-manrope text-xs xs:text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#000060] transition-colors bg-transparent disabled:opacity-50`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 font-manrope">{errors.name}</p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 xs:gap-6 sm:gap-8">
              <div>
                <label className="block font-manrope text-xs xs:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  className={`w-full border-b-2 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } px-1 py-2 sm:py-2.5 font-manrope text-xs xs:text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#000060] transition-colors bg-transparent disabled:opacity-50`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-manrope">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block font-manrope text-xs xs:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                  Your Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your number"
                  disabled={isSubmitting}
                  maxLength={10}
                  className={`w-full border-b-2 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  } px-1 py-2 sm:py-2.5 font-manrope text-xs xs:text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#000060] transition-colors bg-transparent disabled:opacity-50`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1 font-manrope">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block font-manrope text-xs xs:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                Your Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="3"
                placeholder="Enter your message"
                disabled={isSubmitting}
                className={`w-full border-b-2 ${
                  errors.message ? "border-red-500" : "border-gray-300"
                } px-1 py-2 sm:py-2.5 font-manrope text-xs xs:text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#000060] transition-colors resize-none bg-transparent disabled:opacity-50`}
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1 font-manrope">{errors.message}</p>
              )}
            </div>

            {/* reCAPTCHA v3 Badge Notice */}
            <p className="text-xs text-gray-400 font-manrope">
              This site is protected by reCAPTCHA and the Google{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                Terms of Service
              </a>{" "}
              apply.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !executeRecaptcha}
              className="w-full sm:w-auto px-6 xs:px-8 py-2.5 xs:py-3 bg-[#000060] text-white rounded-lg font-manrope font-semibold text-xs xs:text-sm hover:bg-[#000050] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SENDING...
                </>
              ) : (
                "SEND MESSAGE"
              )}
            </button>
          </form>
        </div>

        {/* Right: Contact Information - 40% width on desktop */}
        <div
          className="md:col-span-2 relative bg-gradient-to-br from-[#000060] via-[#1a1a8f] to-[#000060] text-white p-5 xs:p-6 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-l-[2rem] lg:rounded-l-[3rem] md:rounded-r-3xl shadow-xl sm:shadow-2xl m-4 xs:m-5 md:my-5 md:mr-5 md:ml-0"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h3 className="font-manrope text-lg xs:text-xl sm:text-2xl font-bold mb-2 xs:mb-2.5 sm:mb-3">
            Contact Information
          </h3>

          <p className="font-manrope text-xs sm:text-sm text-white/70 mb-5 xs:mb-6 sm:mb-8 leading-relaxed">
            Fill up the form and our team will get back to you within 24 hours
          </p>

          <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            {/* Location */}
            <div className="flex items-start gap-2.5 xs:gap-3">
              <div className="flex-shrink-0 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
              </div>
              <div>
                <h4 className="font-manrope font-semibold text-xs xs:text-sm sm:text-base mb-0.5">
                  Our Location :
                </h4>
                <p className="font-manrope text-xs sm:text-sm text-white/80 leading-relaxed">
                  Jl. Raya Puputan No 142, Denpasar
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-2.5 xs:gap-3">
              <div className="flex-shrink-0 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
              </div>
              <div>
                <h4 className="font-manrope font-semibold text-xs xs:text-sm sm:text-base mb-0.5">
                  Email Us :
                </h4>
                <p className="font-manrope text-xs sm:text-sm text-white/80">
                  support@domain.com
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-2.5 xs:gap-3">
              <div className="flex-shrink-0 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center">
                <Phone className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
              </div>
              <div>
                <h4 className="font-manrope font-semibold text-xs xs:text-sm sm:text-base mb-0.5">
                  Phone Number :
                </h4>
                <p className="font-manrope text-xs sm:text-sm text-white/80">
                  (+021) 117 671
                </p>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="mt-6 xs:mt-8 sm:mt-10 pt-5 xs:pt-6 sm:pt-7 border-t border-white/20">
            <p className="font-manrope text-xs sm:text-sm font-medium mb-2.5 xs:mb-3 sm:mb-4">
              Follow our social media:
            </p>
            <div className="flex gap-2 xs:gap-2.5 sm:gap-3">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-8 h-8 xs:w-9 xs:h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label={Icon.name}
                >
                  <Icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactFormCard;

// import { useEffect, useState, useCallback } from "react";
// import AOS from "aos";
// import "aos/dist/aos.css";
// import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
// import { 
//   Mail, 
//   Phone, 
//   MapPin, 
//   Facebook, 
//   Twitter, 
//   Instagram, 
//   Linkedin, 
//   Loader2, 
//   CheckCircle,
//   AlertCircle 
// } from "lucide-react";
// import { submitEnquiry } from "../../../../api/enquiries";

// const ContactFormCard = () => {
//   const { executeRecaptcha } = useGoogleReCaptcha();
  
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     message: "",
//   });
  
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitStatus, setSubmitStatus] = useState(null);
//   const [submitMessage, setSubmitMessage] = useState("");

//   useEffect(() => {
//     AOS.init({ duration: 900, once: true });
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
    
//     // Clear error when user starts typing
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   const handleSubmit = useCallback(async (e) => {
//     e.preventDefault();
    
//     // ✅ Validate form (moved inside handleSubmit to avoid dependency issues)
//   const validateForm = () => {
//   const newErrors = {};
  
//   if (!formData.name.trim()) {
//     newErrors.name = "Name is required";
//   } else if (formData.name.trim().length < 2) {
//     newErrors.name = "Name must be at least 2 characters";
//   }
  
//   // ✅ Fixed email regex
//   if (!formData.email.trim()) {
//     newErrors.email = "Email is required";
//   } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//     newErrors.email = "Invalid email address";
//   }
  
//   // ✅ Fixed phone regex
//   if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
//     newErrors.phone = "Phone must be 10 digits";
//   }
  
//   if (!formData.message.trim()) {
//     newErrors.message = "Message is required";
//   } else if (formData.message.trim().length < 10) {
//     newErrors.message = "Message must be at least 10 characters";
//   }
  
//   setErrors(newErrors);
//   return Object.keys(newErrors).length === 0;
// };



//     if (!validateForm()) return;

//     // Check if reCAPTCHA is ready
//     if (!executeRecaptcha) {
//       setSubmitStatus("error");
//       setSubmitMessage("reCAPTCHA not loaded. Please refresh the page.");
//       return;
//     }

//     setIsSubmitting(true);
//     setSubmitStatus(null);

//     try {
//       // Get reCAPTCHA v3 token with action name
//       const recaptchaToken = await executeRecaptcha("contact_form_submit");

//       if (!recaptchaToken) {
//         throw new Error("Failed to get reCAPTCHA token");
//       }

//       const response = await submitEnquiry({
//         ...formData,
//         recaptchaToken,
//       });

//       setSubmitStatus("success");
//       setSubmitMessage(response.message || "Message sent successfully!");
      
//       // ✅ Reset form (removed debug console.log)
//       setFormData({ name: "", email: "", phone: "", message: "" });
      
//       // Clear success message after 5 seconds
//       setTimeout(() => {
//         setSubmitStatus(null);
//         setSubmitMessage("");
//       }, 5000);
      
//     } catch (error) {
//       setSubmitStatus("error");
//       setSubmitMessage(
//         error.response?.data?.message || "Failed to send message. Please try again."
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [executeRecaptcha, formData]); // ✅ Correct dependencies

//   return (
//     <section className="w-full px-4 sm:px-6 lg:px-8">
//       <div
//         className="
//           max-w-6xl mx-auto 
//           bg-white 
//           rounded-2xl sm:rounded-3xl 
//           shadow-xl sm:shadow-2xl 
//           overflow-hidden 
//           grid grid-cols-1 md:grid-cols-5
//         "
//         data-aos="fade-up"
//       >
//         {/* Left: Form Section - 60% width on desktop */}
//         <div className="
//           md:col-span-3 
//           bg-white 
//           p-5 xs:p-6 sm:p-8 md:p-10 lg:p-12 
//           rounded-2xl sm:rounded-3xl 
//           md:rounded-r-none
//         ">
//           {/* Success Message */}
//           {submitStatus === "success" && (
//             <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
//               <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
//               <p className="text-green-700 font-manrope text-sm">{submitMessage}</p>
//             </div>
//           )}

//           {/* Error Message */}
//           {submitStatus === "error" && (
//             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
//               <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
//               <p className="text-red-700 font-manrope text-sm">{submitMessage}</p>
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-5 xs:space-y-6 sm:space-y-7">
            
//             {/* Name */}
//             <div>
//               <label className="
//                 block 
//                 font-manrope 
//                 text-xs xs:text-sm 
//                 font-semibold 
//                 text-gray-800 
//                 mb-1.5 sm:mb-2
//               ">
//                 Your Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 placeholder="Enter your name"
//                 disabled={isSubmitting}
//                 className={`
//                   w-full 
//                   border-b-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}
//                   px-1 py-2 sm:py-2.5 
//                   font-manrope 
//                   text-xs xs:text-sm 
//                   placeholder:text-gray-400 
//                   focus:outline-none 
//                   focus:border-[#000060] 
//                   transition-colors 
//                   bg-transparent
//                   disabled:opacity-50
//                 `}
//               />
//               {errors.name && (
//                 <p className="text-red-500 text-xs mt-1 font-manrope">{errors.name}</p>
//               )}
//             </div>

//             {/* Email & Phone */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 xs:gap-6 sm:gap-8">
//               <div>
//                 <label className="
//                   block 
//                   font-manrope 
//                   text-xs xs:text-sm 
//                   font-semibold 
//                   text-gray-800 
//                   mb-1.5 sm:mb-2
//                 ">
//                   Your Email <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="Enter your email"
//                   disabled={isSubmitting}
//                   className={`
//                     w-full 
//                     border-b-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}
//                     px-1 py-2 sm:py-2.5 
//                     font-manrope 
//                     text-xs xs:text-sm 
//                     placeholder:text-gray-400 
//                     focus:outline-none 
//                     focus:border-[#000060] 
//                     transition-colors 
//                     bg-transparent
//                     disabled:opacity-50
//                   `}
//                 />
//                 {errors.email && (
//                   <p className="text-red-500 text-xs mt-1 font-manrope">{errors.email}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="
//                   block 
//                   font-manrope 
//                   text-xs xs:text-sm 
//                   font-semibold 
//                   text-gray-800 
//                   mb-1.5 sm:mb-2
//                 ">
//                   Your Phone
//                 </label>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   placeholder="Enter your number"
//                   disabled={isSubmitting}
//                   className={`
//                     w-full 
//                     border-b-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'}
//                     px-1 py-2 sm:py-2.5 
//                     font-manrope 
//                     text-xs xs:text-sm 
//                     placeholder:text-gray-400 
//                     focus:outline-none 
//                     focus:border-[#000060] 
//                     transition-colors 
//                     bg-transparent
//                     disabled:opacity-50
//                   `}
//                 />
//                 {errors.phone && (
//                   <p className="text-red-500 text-xs mt-1 font-manrope">{errors.phone}</p>
//                 )}
//               </div>
//             </div>

//             {/* Message */}
//             <div>
//               <label className="
//                 block 
//                 font-manrope 
//                 text-xs xs:text-sm 
//                 font-semibold 
//                 text-gray-800 
//                 mb-1.5 sm:mb-2
//               ">
//                 Your Message <span className="text-red-500">*</span>
//               </label>
//               <textarea
//                 name="message"
//                 value={formData.message}
//                 onChange={handleChange}
//                 rows="3"
//                 placeholder="Enter your message"
//                 disabled={isSubmitting}
//                 className={`
//                   w-full 
//                   border-b-2 ${errors.message ? 'border-red-500' : 'border-gray-300'}
//                   px-1 py-2 sm:py-2.5 
//                   font-manrope 
//                   text-xs xs:text-sm 
//                   placeholder:text-gray-400 
//                   focus:outline-none 
//                   focus:border-[#000060] 
//                   transition-colors 
//                   resize-none 
//                   bg-transparent
//                   disabled:opacity-50
//                 `}
//               />
//               {errors.message && (
//                 <p className="text-red-500 text-xs mt-1 font-manrope">{errors.message}</p>
//               )}
//             </div>

//             {/* reCAPTCHA v3 Badge Notice */}
//             <p className="text-xs text-gray-400 font-manrope">
//               This site is protected by reCAPTCHA and the Google{" "}
//               <a 
//                 href="https://policies.google.com/privacy" 
//                 target="_blank" 
//                 rel="noopener noreferrer"
//                 className="underline hover:text-gray-600"
//               >
//                 Privacy Policy
//               </a>{" "}
//               and{" "}
//               <a 
//                 href="https://policies.google.com/terms" 
//                 target="_blank" 
//                 rel="noopener noreferrer"
//                 className="underline hover:text-gray-600"
//               >
//                 Terms of Service
//               </a>{" "}
//               apply.
//             </p>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={isSubmitting || !executeRecaptcha}
//               className="
//                 w-full sm:w-auto
//                 px-6 xs:px-8 
//                 py-2.5 xs:py-3 
//                 bg-[#000060] 
//                 text-white 
//                 rounded-lg 
//                 font-manrope 
//                 font-semibold 
//                 text-xs xs:text-sm 
//                 hover:bg-[#000050] 
//                 transition-all 
//                 duration-300 
//                 shadow-md 
//                 hover:shadow-lg
//                 disabled:opacity-50
//                 disabled:cursor-not-allowed
//                 flex items-center justify-center gap-2
//               "
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   SENDING...
//                 </>
//               ) : (
//                 "SEND MESSAGE"
//               )}
//             </button>
//           </form>
//         </div>

//         {/* Right: Contact Information - 40% width on desktop */}
//         <div
//           className="
//             md:col-span-2 
//             relative 
//             bg-gradient-to-br from-[#000060] via-[#1a1a8f] to-[#000060] 
//             text-white 
//             p-5 xs:p-6 sm:p-7 md:p-8 
//             rounded-2xl sm:rounded-3xl 
//             md:rounded-l-[2rem] lg:rounded-l-[3rem] 
//             md:rounded-r-3xl 
//             shadow-xl sm:shadow-2xl  
//             m-4 xs:m-5 
//             md:my-5 md:mr-5 md:ml-0
//           "
//           data-aos="fade-up"
//           data-aos-delay="200"
//         >
//           <h3 className="
//             font-manrope 
//             text-lg xs:text-xl sm:text-2xl 
//             font-bold 
//             mb-2 xs:mb-2.5 sm:mb-3
//           ">
//             Contact Information
//           </h3>

//           <p className="
//             font-manrope 
//             text-xs sm:text-sm 
//             text-white/70 
//             mb-5 xs:mb-6 sm:mb-8 
//             leading-relaxed
//           ">
//             Fill up the form and our team will get back to you within 24 hours
//           </p>

//           <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            
//             {/* Location */}
//             <div className="flex items-start gap-2.5 xs:gap-3">
//               <div className="
//                 flex-shrink-0 
//                 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 
//                 bg-white 
//                 rounded-full 
//                 flex items-center justify-center
//               ">
//                 <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
//               </div>
//               <div>
//                 <h4 className="
//                   font-manrope 
//                   font-semibold 
//                   text-xs xs:text-sm sm:text-base 
//                   mb-0.5
//                 ">
//                   Our Location :
//                 </h4>
//                 <p className="
//                   font-manrope 
//                   text-xs sm:text-sm 
//                   text-white/80 
//                   leading-relaxed
//                 ">
//                   Jl. Raya Puputan No 142, Denpasar
//                 </p>
//               </div>
//             </div>

//             {/* Email */}
//             <div className="flex items-start gap-2.5 xs:gap-3">
//               <div className="
//                 flex-shrink-0 
//                 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 
//                 bg-white 
//                 rounded-full 
//                 flex items-center justify-center
//               ">
//                 <Mail className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
//               </div>
//               <div>
//                 <h4 className="
//                   font-manrope 
//                   font-semibold 
//                   text-xs xs:text-sm sm:text-base 
//                   mb-0.5
//                 ">
//                   Email Us :
//                 </h4>
//                 <p className="
//                   font-manrope 
//                   text-xs sm:text-sm 
//                   text-white/80
//                 ">
//                   support@domain.com
//                 </p>
//               </div>
//             </div>

//             {/* Phone */}
//             <div className="flex items-start gap-2.5 xs:gap-3">
//               <div className="
//                 flex-shrink-0 
//                 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 
//                 bg-white 
//                 rounded-full 
//                 flex items-center justify-center
//               ">
//                 <Phone className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
//               </div>
//               <div>
//                 <h4 className="
//                   font-manrope 
//                   font-semibold 
//                   text-xs xs:text-sm sm:text-base 
//                   mb-0.5
//                 ">
//                   Phone Number :
//                 </h4>
//                 <p className="
//                   font-manrope 
//                   text-xs sm:text-sm 
//                   text-white/80
//                 ">
//                   (+021) 117 671
//                 </p>
//               </div>
//             </div>

//           </div>

//           {/* Social Media */}
//           <div className="
//             mt-6 xs:mt-8 sm:mt-10 
//             pt-5 xs:pt-6 sm:pt-7 
//             border-t border-white/20
//           ">
//             <p className="
//               font-manrope 
//               text-xs sm:text-sm 
//               font-medium 
//               mb-2.5 xs:mb-3 sm:mb-4
//             ">
//               Follow our social media:
//             </p>
//             <div className="flex gap-2 xs:gap-2.5 sm:gap-3">
//               <a 
//                 href="#" 
//                 className="
//                   w-8 h-8 xs:w-9 xs:h-9 
//                   bg-white/20 
//                   hover:bg-white/30 
//                   rounded-full 
//                   flex items-center justify-center 
//                   transition-all duration-300
//                 "
//                 aria-label="Facebook"
//               >
//                 <Facebook className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
//               </a>
//               <a 
//                 href="#" 
//                 className="
//                   w-8 h-8 xs:w-9 xs:h-9 
//                   bg-white/20 
//                   hover:bg-white/30 
//                   rounded-full 
//                   flex items-center justify-center 
//                   transition-all duration-300
//                 "
//                 aria-label="Twitter"
//               >
//                 <Twitter className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
//               </a>
//               <a 
//                 href="#" 
//                 className="
//                   w-8 h-8 xs:w-9 xs:h-9 
//                   bg-white/20 
//                   hover:bg-white/30 
//                   rounded-full 
//                   flex items-center justify-center 
//                   transition-all duration-300
//                 "
//                 aria-label="Instagram"
//               >
//                 <Instagram className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
//               </a>
//               <a 
//                 href="#" 
//                 className="
//                   w-8 h-8 xs:w-9 xs:h-9 
//                   bg-white/20 
//                   hover:bg-white/30 
//                   rounded-full 
//                   flex items-center justify-center 
//                   transition-all duration-300
//                 "
//                 aria-label="LinkedIn"
//               >
//                 <Linkedin className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
//               </a>
//             </div>
//           </div>
//         </div>

//       </div>
//     </section>
//   );
// };

// export default ContactFormCard;
