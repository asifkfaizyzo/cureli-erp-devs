// src/components/Shops/ShopsTable.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronUp, ChevronDown, ShoppingBag } from "lucide-react";
import ShopRow from "./ShopRow";
import Pagination from "./Pagination";
import ShopsDetailsModal from "./ShopsDetailsModal";
import ShopEditModal from "./ShopEditModal";
import shopsData from "../../data/shopsdummydata";

const ShopsTable = ({
  initialRowsPerPage = 10,
}) => {
  // data lives locally (dummy)
  const [shops, setShops] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  // modal state
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // resizing/sort state
  const [columnWidths, setColumnWidths] = useState({
    slNo: 60,
    businessName: 200,
    ownerName: 150,
    businessType: 120,
    pin: 100,
    plan: 110,
    actions: 110,
  });
  const [resizing, setResizing] = useState(null);
  const handleMouseDown = (column, e) => {
    e.preventDefault();
    if (column === "slNo" || column === "actions") return;
    setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] });
  };
  const handleMouseMove = useCallback((e) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    const newWidth = Math.max(60, resizing.startWidth + diff);
    setColumnWidths(prev => ({ ...prev, [resizing.column]: newWidth }));
  }, [resizing]);
  const handleMouseUp = useCallback(() => setResizing(null), []);
  useEffect(() => {
    if (!resizing) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, handleMouseMove, handleMouseUp]);

  // sorting
  const [sortConfig, setSortConfig] = useState({ key: null, order: null });
  const toggleSort = (key) => {
    setSortConfig(prev => ({ key, order: prev.key === key && prev.order === "asc" ? "desc" : "asc" }));
  };

  // load dummy data once
  useEffect(() => {
    setShops(shopsData);
  }, []);

  const sorted = useMemo(() => {
    const list = [...shops];
    const key = sortConfig.key;
    const order = sortConfig.order || "asc";
    const strCmp = (a, b, field) => {
      const va = (a[field] ?? "").toString();
      const vb = (b[field] ?? "").toString();
      return order === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    };

    if (!key) return list;

    if (["businessName", "ownerName", "businessType", "plan"].includes(key)) {
      list.sort((a, b) => strCmp(a, b, key));
    } else if (key === "pin") {
      list.sort((a, b) => {
        const pa = Number(a.location?.pin) || 0;
        const pb = Number(b.location?.pin) || 0;
        return order === "asc" ? pa - pb : pb - pa;
      });
    }
    return list;
  }, [shops, sortConfig]);

  // paging
  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const pageData = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // action handlers
  const handleViewShop = (shop) => {
    setSelectedShopId(shop.shopId);
    setShowDetailsModal(true);
  };

  const handleEditShop = (shop) => {
    setSelectedShopId(shop.shopId);
    setShowEditModal(true);
  };

  const handleToggleSubscription = (shop) => {
    setShops(prev => prev.map(s => s.shopId === shop.shopId ? {
      ...s,
      subscriptionStatus: s.subscriptionStatus === "Active" ? "Suspended" : "Active"
    } : s));
  };

  const handleSaveShop = (updatedShop) => {
    setShops(prev => prev.map(s => s.shopId === updatedShop.shopId ? { ...updatedShop } : s));
  };

  const selectedShop = shops.find(s => s.shopId === selectedShopId) || null;

  const SortableHeader = ({ column, label, width }) => {
    const active = sortConfig.key === column;
    const asc = active && sortConfig.order === "asc";
    const desc = active && sortConfig.order === "desc";

    return (
      <th style={{ width }} className="relative group select-none cursor-pointer px-3 py-3 text-left">
        <div
          onClick={() => toggleSort(column)}
          className="flex items-center justify-between hover:bg-white/10 transition-colors rounded p-1 -ml-1"
        >
          <span className="font-semibold truncate">{label}</span>
          <div className="flex flex-col gap-0.5 ml-1 shrink-0">
            <ChevronUp size={12} className={asc ? "text-yellow-300" : "text-white/40"} />
            <ChevronDown size={12} className={desc ? "text-yellow-300" : "text-white/40"} />
          </div>
        </div>
        <div onMouseDown={(e) => handleMouseDown(column, e)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30 transition-colors z-20" />
      </th>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full min-h-0">
        <table className="w-full border-collapse text-sm table-fixed">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white text-left">
              <th style={{ width: columnWidths.slNo }} className="px-3 py-3 font-semibold truncate">#</th>
              <SortableHeader column="businessName" label="Business" width={columnWidths.businessName} />
              <SortableHeader column="ownerName" label="Owner" width={columnWidths.ownerName} />
              <SortableHeader column="businessType" label="Type" width={columnWidths.businessType} />
              <SortableHeader column="pin" label="Pincode" width={columnWidths.pin} />
              <SortableHeader column="plan" label="Plan" width={columnWidths.plan} />
              <th style={{ width: columnWidths.actions }} className="px-3 py-3 font-semibold text-center truncate">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pageData.length > 0 ? (
              pageData.map((s, idx) => (
                <ShopRow
                  key={s.shopId}
                  index={startIndex + idx}
                  shop={s}
                  onView={handleViewShop}
                  onEdit={handleEditShop}
                  onToggle={handleToggleSubscription}
                />
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <ShoppingBag size={32} className="text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-500 mb-1">No shops found</p>
                    <p className="text-sm text-gray-400">Try adjusting filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-1.5 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700">{totalCount === 0 ? 0 : startIndex}</span> to <span className="font-medium text-gray-700">{Math.min(startIndex + rowsPerPage - 1, totalCount)}</span> of <span className="font-medium text-gray-700">{totalCount}</span> results
        </div>

        <Pagination totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>

      {/* DETAILS & EDIT MODALS */}
      {selectedShop && (
        <>
          <ShopsDetailsModal
            shop={selectedShop}
            isOpen={showDetailsModal}
            onClose={(shouldRefresh) => {
              setShowDetailsModal(false);
              if (shouldRefresh) {
                // nothing to do; in real app refresh from API
              }
              setSelectedShopId(null);
            }}
          />

          <ShopEditModal
            shop={selectedShop}
            isOpen={showEditModal}
            onClose={(shouldRefresh) => {
              setShowEditModal(false);
              setSelectedShopId(null);
            }}
            onSave={(updated) => handleSaveShop(updated)}
          />
        </>
      )}
    </div>
  );
};

export default ShopsTable;
