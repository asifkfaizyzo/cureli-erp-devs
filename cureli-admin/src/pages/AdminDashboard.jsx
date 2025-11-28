// src/pages/AdminDashboard.jsx (update or append)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const PendingCard = () => {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await API.get("/admin/files", { params: { status: "uploaded", limit: 1 } });
        // backend didn't return total count; if you have a count endpoint prefer that.
        // We'll just show 1+ if exists or 0.
        const files = res.data?.data?.files || [];
        setCount(files.length);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div
      onClick={() => navigate("/verify-documents")}
      className="w-64 p-4 rounded-2xl bg-white shadow-sm cursor-pointer hover:shadow-md"
    >
      <div className="text-xs text-gray-500">Pending verifications</div>
      <div className="mt-3 text-2xl font-bold text-[#000060]">{count}</div>
      <div className="text-sm text-gray-500 mt-1">Click to review</div>
    </div>
  );
};

export default function AdminDashboard() {
  return (
    <div className="h-full">
      <div className="grid grid-cols-3 gap-4">
        <PendingCard />
        {/* other cards */}
      </div>

      {/* rest of dashboard */}
    </div>
  );
}
