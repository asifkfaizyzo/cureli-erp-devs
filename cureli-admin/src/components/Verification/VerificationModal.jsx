import { X, User, Building2, FileText, AlertTriangle } from "lucide-react";
import { useState } from "react";
import DocumentCard from "./DocumentCard";
import VerificationDetailsTop from "./VerificationDetailsTop";

const VerificationModal = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [rejectingDocId, setRejectingDocId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [documents, setDocuments] = useState([
    { id: 1, name: "Shop & Establishment License", date: "22 Sep 2025", uploader: "John Phillips", size: "103 KB", status: "normal", reason: "", pdfUrl: "#" },
    { id: 2, name: "Trade Certificate", date: "22 Sep 2025", uploader: "John Phillips", size: "99 KB", status: "normal", reason: "", pdfUrl: "#" },
    { id: 3, name: "Registration Certificate", date: "22 Sep 2025", uploader: "John Phillips", size: "87 KB", status: "normal", reason: "", pdfUrl: "#" },
    { id: 4, name: "Shop Act License (Renewed)", date: "22 Sep 2025", uploader: "John Phillips", size: "103 KB", status: "normal", reason: "", pdfUrl: "#" },
    { id: 5, name: "Trade Certificate (Copy)", date: "22 Sep 2025", uploader: "John Phillips", size: "99 KB", status: "normal", reason: "", pdfUrl: "#" },
    { id: 6, name: "GST Registration", date: "22 Sep 2025", uploader: "John Phillips", size: "87 KB", status: "normal", reason: "", pdfUrl: "#" },
  ]);

  const handleRejectClick = (id) => { setRejectingDocId(id); setRejectionReason(""); };
  const confirmReject = () => {
    if (!rejectionReason.trim()) return;
    setDocuments((prev) => prev.map((d) => d.id === rejectingDocId ? { ...d, status: "failed", reason: rejectionReason } : d));
    setRejectingDocId(null);
  };
  const cancelReject = () => { setRejectingDocId(null); setRejectionReason(""); };
  const handleApprove = (id) => { setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: "approved" } : d))); };
  const handleReset = (id) => { setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: "normal", reason: "" } : d))); };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-3 py-3 text-[13px] font-medium border-b-2 transition-all ${
        activeTab === id ? "border-[#0F172A] text-[#0F172A]" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-3">
      {/* Reduced Max Width and Height */}
      <div className="bg-slate-50 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* --- COMPACT REJECTION POPUP --- */}
        {rejectingDocId && (
          <div className="absolute inset-0 z-50 bg-slate-900/30 backdrop-blur-[2px] flex justify-center items-center p-4">
            <div className="bg-white w-[380px] p-5 rounded-xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-slate-800 text-sm font-bold">Reject Document?</h3>
                <p className="text-slate-500 text-xs mt-1">Please specify the reason.</p>
              </div>
              <textarea
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none mb-4 placeholder:text-slate-400"
                placeholder="Type reason here..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={cancelReject} className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold">Cancel</button>
                <button onClick={confirmReject} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm">Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* --- 1. COMPACT HEADER --- */}
        <div className="bg-[#02004D] px-5 py-3 flex justify-between items-center shrink-0 h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center text-xs font-bold border border-white/20">
              {user.ownerName ? user.ownerName.substring(0, 2).toUpperCase() : "US"}
            </div>
            <div>
              <h2 className="text-white text-base font-bold leading-tight">{user.shopName || "Business Name"}</h2>
              <div className="flex items-center gap-1.5 text-blue-200/80 text-[11px] font-medium">
                 <User size={11} />
                 <span>@{user.ownerName?.replace(/\s+/g, '_').toLowerCase()}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-all">
            <X size={18} />
          </button>
        </div>

        {/* --- 2. COMPACT TABS --- */}
        <div className="bg-white px-4 border-b border-slate-200 shrink-0">
          <div className="flex gap-4">
            <TabButton id="details" label="Shop Details" icon={Building2} />
            <TabButton id="documents" label="Documents" icon={FileText} />
          </div>
        </div>

        {/* --- 3. CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 custom-scrollbar">
          
          {activeTab === "details" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <VerificationDetailsTop user={user} />
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-slate-800 text-xs font-bold uppercase tracking-wider">
                  Uploaded Files <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{documents.length}</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onApprove={handleApprove}
                    onReject={handleRejectClick}
                    onReset={handleReset}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;