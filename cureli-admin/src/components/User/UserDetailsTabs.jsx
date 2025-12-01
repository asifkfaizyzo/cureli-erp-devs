import { useState } from "react";
import { FileText, CloudDownload, Trash2, ExternalLink, Upload } from "lucide-react";
import DetailRow from "./DetailRow";
import ShopDetailRow from "./ShopDetailRow";

// ═══════════════════════════════════════════════════════════
// PROFILE DETAILS TAB
// ═══════════════════════════════════════════════════════════
export const ProfileDetails = ({ user, isEditing }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Personal Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <DetailRow label="Full Name" value={user.name} isEditing={isEditing} />
        <DetailRow label="Username" value={user.username} isEditing={isEditing} />
        <DetailRow label="Email" value={user.email} isEditing={isEditing} />
        <DetailRow label="Phone" value={user.phone || "7035261820"} isEditing={isEditing} />
        <DetailRow label="Role" value={user.role} isEditing={isEditing} />
        <DetailRow label="User ID" value={user.userId || "6728291037"} isEditing={isEditing} />
        <DetailRow label="Created" value={user.accCreated || "14/08/2024"} isEditing={isEditing} />
        <DetailRow label="Last Login" value={user.lastLogin} isEditing={isEditing} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SHOP DETAILS TAB
// ═══════════════════════════════════════════════════════════
export const ShopDetails = ({ user, isEditing }) => {
  const shop = user.shop || {};

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Shop Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <ShopDetailRow label="Shop ID" value={shop.id || "13234566567675435342435465"} isEditing={isEditing} />
        <ShopDetailRow label="Shop Name" value={shop.name || "Royal Care Comprehensive Health & Solutions"} isEditing={isEditing} />
        <ShopDetailRow label="Branch" value={shop.branch || "Royal Care Pharma"} isEditing={isEditing} />
        <ShopDetailRow label="GST" value={shop.gst || "27ABCDE1234A1Z5"} isEditing={isEditing} />
        <ShopDetailRow label="Address" value={shop.address || "Pavakulath Building, Kaloor, Ernakulam"} isEditing={isEditing} />
        <ShopDetailRow label="Postal Code" value={shop.postal || "682017"} isEditing={isEditing} />
        <ShopDetailRow label="Status" value={shop.subStatus || "Active"} isEditing={isEditing} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// DOCUMENTS TAB
// ═══════════════════════════════════════════════════════════
export const DocumentsTab = ({ user }) => {
  const [docs, setDocs] = useState(
    user.documents || [
      { name: "Drug License", date: "22 September 2025", by: "John Phillips", size: "103 KB", fileUrl: "/dummy/drug-license.pdf" },
      { name: "Shop & Establishment License", date: "22 September 2025", by: "John Phillips", size: "103 KB", fileUrl: "/dummy/shop-license.pdf" },
      { name: "Pharmacy Registration", date: "22 September 2025", by: "John Phillips", size: "103 KB", fileUrl: "/dummy/pharma-cert.pdf" },
      { name: "Business PAN", date: "22 September 2025", by: "John Phillips", size: "103 KB", fileUrl: "/dummy/business-pan.pdf" },
      { name: "Business Registration", date: "22 September 2025", by: "John Phillips", size: "103 KB", fileUrl: "/dummy/business-reg.pdf" },
      { name: "Address Proof", date: "22 September 2025", by: "John Phillips", size: "103 KB", fileUrl: "/dummy/address-proof.pdf" },
    ]
  );

  const handleDownload = (doc) => {
    const link = document.createElement("a");
    link.href = doc.fileUrl || "#";
    link.download = doc.name || "document";
    link.click();
  };

  const handleDelete = (name) => {
    if (window.confirm(`Delete "${name}" permanently?`)) {
      setDocs((prev) => prev.filter((d) => d.name !== name));
    }
  };

  const handlePreview = (doc) => {
    window.open(doc.fileUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Uploaded Documents ({docs.length})
        </h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
          <Upload size={16} />
          Upload New
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc, i) => (
          <div
            key={i}
            className="group bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center flex-shrink-0">
                <FileText size={24} className="text-indigo-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{doc.date}</p>
                <p className="text-xs text-gray-400">by {doc.by} • {doc.size}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePreview(doc)}
                  className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  title="Preview"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  title="Download"
                >
                  <CloudDownload size={16} />
                </button>
                <button
                  onClick={() => handleDelete(doc.name)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {docs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No documents uploaded</p>
          <button className="mt-3 text-sm text-indigo-600 hover:text-indigo-700">
            Upload your first document
          </button>
        </div>
      )}
    </div>
  );
};