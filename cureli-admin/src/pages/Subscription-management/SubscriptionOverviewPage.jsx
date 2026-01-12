import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  AlertTriangle,
  Ban,
  CreditCard,
} from "lucide-react";
import SubscriptionDetailsModal from "./comps/SubscriptionDetailsModal";

/* -------------------- DUMMY DATA -------------------- */
const SHOPS = [
  {
    id: "SHP001",
    name: "Apollo Medicals",
    status: "EXPIRING",
    expires_at: "2026-01-20",
    days_left: 12,
  },
  {
    id: "SHP002",
    name: "GreenLeaf Pharmacy",
    status: "EXPIRING",
    expires_at: "2026-01-15",
    days_left: 7,
  },
  {
    id: "SHP003",
    name: "WellCare Clinic",
    status: "GRACE",
    grace_expires_at: "2026-01-10",
    days_left: 3,
  },
  {
    id: "SHP004",
    name: "MediPlus Store",
    status: "GRACE",
    grace_expires_at: "2026-01-08",
    days_left: 1,
  },
  {
    id: "SHP005",
    name: "City Health Hub",
    status: "SUSPENDED",
    suspended_at: "2026-01-02",
    reason: "Auto-suspended after grace expiry",
  },
];

/* -------------------- STATUS BADGE -------------------- */
const StatusBadge = ({ status }) => {
  const styles = {
    EXPIRING: "bg-blue-100 text-blue-700",
    GRACE: "bg-amber-100 text-amber-700",
    SUSPENDED: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
};

/* -------------------- PAGE -------------------- */
export default function SubscriptionOverviewPage() {
  const navigate = useNavigate();

  const [selectedShop, setSelectedShop] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const grouped = useMemo(() => ({
    EXPIRING: SHOPS.filter(s => s.status === "EXPIRING"),
    GRACE: SHOPS.filter(s => s.status === "GRACE"),
    SUSPENDED: SHOPS.filter(s => s.status === "SUSPENDED"),
  }), []);

  const openModal = (shop) => {
    setSelectedShop(shop);
    setModalOpen(true);
  };

  return (
    <div className="p-6 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Subscription Health</h1>
          <p className="text-sm text-gray-500">
            Expiring, grace-period, and suspended shops
          </p>
        </div>

        <button
          onClick={() => navigate("/subscriptions/manage")}
          className="flex items-center gap-2 px-4 py-2 bg-[#05015A] text-white rounded-lg"
        >
          <CreditCard size={16} />
          Manage Plans
        </button>
      </div>

      <Section
        title="About to Expire"
        icon={Clock}
        rows={grouped.EXPIRING}
        columns={[
          { key: "name", label: "Shop" },
          { key: "expires_at", label: "Expires On" },
          { key: "days_left", label: "Days Left" },
        ]}
        onRowClick={openModal}
      />

      <Section
        title="In Grace Period"
        icon={AlertTriangle}
        rows={grouped.GRACE}
        columns={[
          { key: "name", label: "Shop" },
          { key: "grace_expires_at", label: "Grace Ends" },
          { key: "days_left", label: "Days Left" },
        ]}
        onRowClick={openModal}
      />

      <Section
        title="Suspended"
        icon={Ban}
        rows={grouped.SUSPENDED}
        columns={[
          { key: "name", label: "Shop" },
          { key: "suspended_at", label: "Suspended On" },
          { key: "reason", label: "Reason" },
        ]}
        onRowClick={openModal}
      />

      {/* MODAL */}
      <SubscriptionDetailsModal
        open={modalOpen}
        shop={selectedShop}
        onClose={() => {
          setModalOpen(false);
          setSelectedShop(null);
        }}
      />
    </div>
  );
}

/* -------------------- TABLE SECTION -------------------- */
function Section({ title, icon: Icon, rows, columns, onRowClick }) {
  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 font-semibold">
        <Icon size={16} /> {title}
      </h2>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(c => (
                <th key={c.key} className="px-4 py-2 text-left">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row)}
                className="border-t cursor-pointer hover:bg-gray-50"
              >
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-2">
                    {row[c.key]}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
