// src/pages/VerifyDocuments.jsx
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getAdminFiles } from "../api/cadminDocs";
import ShopList from "../components/verify/ShopList";
import ShopDetailPanel from "../components/verify/ShopDetailPanel";

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, x: -20 },
};

const VerifyDocuments = () => {
  // list side
  const [filesResult, setFilesResult] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("uploaded"); // pending uploads by default
  const [page, setPage] = useState(1);
  const perPage = 8;

  // selected shop
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedFileId, setSelectedFileId] = useState(null);

  // pagination meta
  const [total, setTotal] = useState(0);

  const offset = useMemo(() => (page - 1) * perPage, [page]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line
  }, [statusFilter, q, page]);

  async function fetchList() {
    setLoadingList(true);
    try {
      const res = await getAdminFiles({ status: statusFilter, q, limit: perPage, offset });
      // backend returns { files } array — but we need grouping by shop
      const files = res.data?.data?.files || [];
      setFilesResult(files);
      setTotal(files.length === perPage ? (page + 1) * perPage : (page - 1) * perPage + files.length);
      // Note: ideally backend returns total count. For now we calculate minimally.
    } catch (err) {
      console.error("Failed to fetch admin files", err);
    } finally {
      setLoadingList(false);
    }
  }

  const handleSelectShop = (shop) => {
    setSelectedShop(shop);
    setSelectedFileId(null);
  };

  const handleClosePanel = () => {
    setSelectedShop(null);
    setSelectedFileId(null);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
      {/* Top filter */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-[#000060]">Document Verification</h3>
          <div className="text-sm text-gray-600">Review pending shop documents</div>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search file or shop..."
            className="px-3 py-2 rounded-xl bg-[#F7F7FF] border border-gray-200 outline-none text-sm w-60"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-white border border-gray-200"
          >
            <option value="uploaded">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="verified">Verified</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      <div className="w-full h-[calc(100% - 64px)] flex gap-4">
        {/* LEFT: Shop list (paginated) */}
        <div className="w-1/3 h-full bg-white rounded-xl p-4 shadow-sm overflow-hidden">
          <ShopList
            files={filesResult}
            loading={loadingList}
            onSelectShop={handleSelectShop}
            page={page}
            perPage={perPage}
            setPage={setPage}
            total={total}
            selectedShopId={selectedShop?.shop_id}
          />
        </div>

        {/* RIGHT: shop detail panel (replaces list area when opened) */}
        <div className="flex-1 h-full bg-white rounded-xl p-4 shadow-sm overflow-hidden">
          {selectedShop ? (
            <ShopDetailPanel
              shop={selectedShop}
              onBack={handleClosePanel}
              selectedFileId={selectedFileId}
              setSelectedFileId={setSelectedFileId}
              refreshList={fetchList}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="text-2xl font-semibold text-[#000060] mb-3">Select a shop to review</div>
              <div className="text-sm">Click any shop on the left to open its verification panel.</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VerifyDocuments;
