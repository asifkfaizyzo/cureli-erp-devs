// src/components/verify/ShopDetailPanel.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DocumentCard from "./DocumentCard";
import HistoryTimeline from "./HistoryTimeline";
import { getAdminFile } from "../../api/cadminDocs";

/**
 * shop: object with shop fields and files array (from list)
 */
const ShopDetailPanel = ({ shop, onBack, refreshList, selectedFileId, setSelectedFileId }) => {
  const [files, setFiles] = useState(shop.files || []);
  const [loading, setLoading] = useState(false);
  const [logsForFile, setLogsForFile] = useState([]);
  const [activeFileId, setActiveFileId] = useState(selectedFileId || (files[0]?.file_id));

  useEffect(() => {
    setFiles(shop.files || []);
    setActiveFileId(selectedFileId || (shop.files?.[0]?.file_id));
    // eslint-disable-next-line
  }, [shop]);

  useEffect(() => {
    if (activeFileId) fetchFileLogs(activeFileId);
    // eslint-disable-next-line
  }, [activeFileId]);

  async function fetchFileLogs(file_id) {
    setLoading(true);
    try {
      const res = await getAdminFile(file_id);
      const file = res.data?.data?.file;
      const logs = res.data?.data?.logs || [];
      setLogsForFile(logs);
      // refresh file list to reflect current statuses
      // if backend returned updated info, we might refresh parent list
    } catch (err) {
      console.error("getAdminFile failed", err);
    } finally {
      setLoading(false);
    }
  }

  const pendingCount = files.filter((f) => f.status === "uploaded" || f.status === "rejected").length;
  const totalCount = files.length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={onBack} className="text-sm text-[#000060] hover:underline">← Back to list</button>
          <div className="mt-2 font-semibold text-lg text-gray-800">{shop.business_name}</div>
          <div className="text-xs text-gray-500">{shop.city} • {shop.gst_number || "GST N/A"}</div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-[#000060]">{pendingCount}/{totalCount}</div>
        </div>
      </div>

      <div className="flex gap-4 h-full overflow-hidden">
        {/* Documents grid (no scroll) */}
        <div className="w-2/3 grid grid-cols-2 gap-4 h-full overflow-hidden">
          {files.map((f) => (
            <DocumentCard
              key={f.file_id}
              file={f}
              onSelect={() => { setActiveFileId(f.file_id); setSelectedFileId && setSelectedFileId(f.file_id); }}
              selected={f.file_id === activeFileId}
              refresh={() => { refreshList(); fetchFileLogs(activeFileId); }}
            />
          ))}
        </div>

        {/* History timeline */}
        <div className="w-1/3 h-full bg-white border-l border-gray-100 pl-4 overflow-auto"> 
          <HistoryTimeline logs={logsForFile} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default ShopDetailPanel;
