import { BadgeIndianRupee } from "lucide-react";

export default function FleetPricingPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400">
      <BadgeIndianRupee size={64} className="opacity-30" />
      <h2 className="text-xl font-semibold text-gray-500">Fleet Pricing</h2>
      <p className="text-sm">Coming soon — delivery fees, surge rules, and payout config.</p>
    </div>
  );
}