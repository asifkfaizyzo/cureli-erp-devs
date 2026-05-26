// src/pages/marketplace-listings/components/ListingsTable.jsx

import { useState } from "react";
import { Package } from "lucide-react";
import MedicineRow from "./MedicineRow";
import { motion, AnimatePresence } from "framer-motion";

const ROWS_PER_PAGE = 10;

const ListingsTable = ({
  medicines,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectOne,
  onToggleVisibility,
  onSetStockStatus,
  onSetPrice,
  onOpenDrawer,
  globalEnabled,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(medicines.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginated = medicines.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const allSelected =
    medicines.length > 0 && selectedIds.size === medicines.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden ">
      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: "1100px" }}>
          {/* Colgroup */}
          <colgroup>
            <col style={{ width: "40px" }} />
            <col style={{ width: "240px" }} />
            <col style={{ width: "100px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "100px" }} />
          </colgroup>

          {/* ── Header ── */}
          <thead>
            <tr className="bg-gradient-to-r from-[#05015A] to-[#0d0b3a] border-b border-white/[0.08] h-10">
              {/* Checkbox */}
              <th className="px-3 border-r border-white/[0.07]">
                <div className="flex items-center justify-center">
                  <CheckboxCell
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={onToggleSelectAll}
                  />
                </div>
              </th>
              <HeaderCell label="Medicine" align="left" />
              <HeaderCell label="ERP Stock" align="center" />
              <HeaderCell label="Visible" align="center" />
              <HeaderCell label="Stock Status" align="center" />
              <HeaderCell label="Mkt Price" align="center" />
              <HeaderCell label="Branch Status" align="center" />
              <HeaderCell label="Actions" align="center" />
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            <AnimatePresence mode="popLayout">
              {paginated.length > 0 ? (
                paginated.map((medicine, index) => (
                  <MedicineRow
                    key={medicine.id}
                    medicine={medicine}
                    index={index}
                    isSelected={selectedIds.has(medicine.id)}
                    onToggleSelect={() => onToggleSelectOne(medicine.id)}
                    onToggleVisibility={() => onToggleVisibility(medicine.id)}
                    onSetStockStatus={(status) => onSetStockStatus(medicine.id, status)}
                    onSetPrice={(price) => onSetPrice(medicine.id, price)}
                    onView={() => onOpenDrawer(medicine)}
                    onEdit={() => onOpenDrawer(medicine)}
                    globalEnabled={globalEnabled}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-20">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          <p className="text-[11px] text-white/25">
            Showing {startIndex + 1}–{Math.min(startIndex + ROWS_PER_PAGE, medicines.length)} of{" "}
            {medicines.length} medicines
          </p>
          <div className="flex items-center gap-1">
            <PageButton
              label="←"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PageButton
                key={page}
                label={String(page)}
                onClick={() => setCurrentPage(page)}
                active={page === currentPage}
              />
            ))}
            <PageButton
              label="→"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const HeaderCell = ({ label, align = "left" }) => (
  <th
    className={`px-3 py-2.5 text-[11px] font-semibold text-white/50 uppercase tracking-wider border-r border-white/[0.07] last:border-r-0 text-${align}`}
  >
    {label}
  </th>
);

const CheckboxCell = ({ checked, indeterminate, onChange }) => (
  <button
    onClick={onChange}
    className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
      checked || indeterminate
        ? "bg-blue-500 border-blue-500"
        : "bg-white/[0.04] border-white/20 hover:border-white/40"
    }`}
  >
    {indeterminate && !checked && (
      <span className="w-2 h-0.5 bg-white rounded-full" />
    )}
    {checked && (
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </button>
);

const PageButton = ({ label, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
      active
        ? "bg-[#05015A] border border-white/20 text-white"
        : disabled
        ? "text-white/15 cursor-not-allowed"
        : "text-white/35 hover:text-white/60 hover:bg-white/[0.05]"
    }`}
  >
    {label}
  </button>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
      <Package size={22} className="text-white/20" />
    </div>
    <div className="text-center">
      <p className="text-sm font-medium text-white/30">No medicines found</p>
      <p className="text-xs text-white/15 mt-1">Try adjusting your search or filters</p>
    </div>
  </div>
);

export default ListingsTable;