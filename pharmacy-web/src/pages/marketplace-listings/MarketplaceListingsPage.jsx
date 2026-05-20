// src/pages/marketplace/listings/MarketplaceListingsPage.jsx

import { Pill } from "lucide-react";

const MarketplaceListingsPage = () => {
  return (
    <div className="min-h-screen bg-[#010015] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/30">
          <Pill size={28} className="text-white/70" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Medicine Listings
        </h1>
        <p className="text-white/40 text-sm mb-5">
          Manage which medicines are listed on your marketplace storefront.
        </p>
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/[0.07] text-white/50 text-sm font-semibold rounded-full border border-white/10">
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default MarketplaceListingsPage;
