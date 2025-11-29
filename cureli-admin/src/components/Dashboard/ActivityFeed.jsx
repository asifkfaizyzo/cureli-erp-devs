import React from "react";
import { Clock, CheckCircle, XOctagon, MessageSquare } from "lucide-react";

const DUMMY = [
  { id: 1, type: "approved", text: "Shop 'HealthPlus' documents verified", time: "2m" },
  { id: 2, type: "rejected", text: "Shop 'CareMart' drug license rejected", time: "12m" },
  { id: 3, type: "resubmitted", text: "Shop 'CityPharma' resubmitted address proof", time: "30m" },
  { id: 4, type: "message", text: "Owner 'Medline' replied to admin message", time: "1h" },
  { id: 5, type: "note", text: "Auto-check: Missing GST detected for 'RxDepot'", time: "3h" },
];

const iconFor = (t) => {
  if (t === "approved") return <CheckCircle className="text-green-600" size={18} />;
  if (t === "rejected") return <XOctagon className="text-red-600" size={18} />;
  if (t === "resubmitted") return <Clock className="text-yellow-600" size={18} />;
  if (t === "message") return <MessageSquare className="text-indigo-600" size={18} />;
  return <Clock size={18} />;
};

const ActivityFeed = ({ compact = false }) => {
  return (
    <div className="flex flex-col gap-2">
      {DUMMY.map((d) => (
        <div
          key={d.id}
          className={`flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition ${
            compact ? "text-sm" : ""
          }`}
        >
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center shadow-sm">
            {iconFor(d.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{d.text}</div>
            <div className="text-xs text-gray-400 mt-0.5">{d.time} ago</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
