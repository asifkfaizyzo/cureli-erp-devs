// src/components/verify/HistoryTimeline.jsx
import dayjs from "dayjs";

const HistoryTimeline = ({ logs = [], loading = false }) => {
  if (loading) return <div className="text-sm text-gray-500">Loading logs…</div>;
  if (!logs || logs.length === 0) return <div className="text-sm text-gray-500">No history yet</div>;

  return (
    <div className="h-full">
      <h4 className="text-sm font-semibold text-[#000060] mb-3">Verification History</h4>
      <div className="flex flex-col gap-3">
        {logs.map((l) => (
          <div key={l.id} className="flex items-start gap-3">
            <div className="w-2">
              <div className={`w-2 h-2 rounded-full ${l.action === "verified" ? "bg-green-500" : l.action === "rejected" ? "bg-red-500" : "bg-gray-400"}`}></div>
              <div className="w-px bg-gray-200 h-full ml-0.5" />
            </div>

            <div className="flex-1 text-xs text-gray-700">
              <div className="font-medium">{l.actor_type === "admin" ? "Admin" : l.actor_type === "owner" ? "Owner" : "System"}</div>
              <div className="text-gray-500">{l.action} {l.reason ? `— ${l.reason}` : ""}</div>
              <div className="text-gray-400 mt-1">{dayjs(l.created_at).format("DD MMM YYYY, hh:mm A")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTimeline;
