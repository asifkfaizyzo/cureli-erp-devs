import React from "react";

const ROWS = [
  { id: 1, shop: "HealthPlus", owner: "A. Sharma", step: "Verification", status: "pending" },
  { id: 2, shop: "CareMart", owner: "R. Gupta", step: "Resubmit docs", status: "rejected" },
  { id: 3, shop: "CityPharma", owner: "S. Patel", step: "Awaiting review", status: "uploaded" },
  { id: 4, shop: "RxDepot", owner: "P. Rao", step: "Verification", status: "pending" },
  { id: 5, shop: "Medline", owner: "J. Paul", step: "Resubmitted", status: "uploaded" },
];

const badgeFor = (s) => {
  if (s === "pending")
    return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800">Pending</span>;
  if (s === "rejected")
    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-800">Rejected</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-800">Uploaded</span>;
};

const OnboardingTable = ({ compact = false }) => {
  return (
    <div className="flex flex-col">

      <div className="w-full overflow-auto">
        <table className="w-full text-left">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="py-2 pr-2">Shop</th>
              <th className="py-2 pr-2">Owner</th>
              <th className="py-2 pr-2">Stage</th>
              <th className="py-2 pr-2">Status</th>
            </tr>
          </thead>

          <tbody>
            {ROWS.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className={`py-2 pr-2 ${compact ? "text-sm" : ""}`}>{r.shop}</td>
                <td className={`py-2 pr-2 ${compact ? "text-sm" : ""}`}>{r.owner}</td>
                <td className={`py-2 pr-2 ${compact ? "text-sm" : ""}`}>{r.step}</td>
                <td className={`py-2 pr-2 ${compact ? "text-sm" : ""}`}>{badgeFor(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
        <div>Showing latest 5</div>
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded bg-gray-50 text-gray-700 text-xs">View All</button>
          <button className="px-2 py-1 rounded bg-[#000060] text-white text-xs">Export</button>
        </div>
      </div>

    </div>
  );
};

export default OnboardingTable;
