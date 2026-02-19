import { motion } from "framer-motion";
import { BarChart3, Sparkles } from "lucide-react";

const SalesReportPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-gray-200 shadow-sm 
                   rounded-3xl p-10 max-w-lg w-full text-center"
      >
        {/* Animated Icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-20 h-20 mx-auto mb-6 
                     flex items-center justify-center 
                     bg-gradient-to-br from-indigo-100 to-blue-100 
                     rounded-2xl"
        >
          <BarChart3 className="w-10 h-10 text-indigo-600" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Sales Report Module
        </h1>

        <p className="text-gray-500 mb-6">
          Advanced sales analytics and reporting tools are currently
          under development. Soon you'll be able to track revenue,
          trends, and performance insights in real-time.
        </p>

        {/* Pulse Badge */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center gap-2 
                     px-5 py-2 rounded-full 
                     bg-indigo-600 text-white font-medium shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          Coming Soon
        </motion.div>

        <p className="text-sm text-gray-400 mt-6">
          We're building something powerful for your business 🚀
        </p>
      </motion.div>
    </div>
  );
};

export default SalesReportPage;
