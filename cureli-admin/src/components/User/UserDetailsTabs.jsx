import DetailRow from "./DetailRow";

export const ProfileDetails = ({ user, isEditing }) => {
  return (
    <div className="flex flex-col gap-1 w-full">

      <DetailRow label="Full Name" value={user.name} isEditing={isEditing} />

      <DetailRow label="Username" value={user.username} isEditing={isEditing} />

      <DetailRow label="Email" value={user.email} isEditing={isEditing} />

      <DetailRow label="Acc Created" value={user.accCreated || "14/08/2024"} isEditing={isEditing} />

      <DetailRow label="Role" value={user.role} isEditing={isEditing} />

      <DetailRow label="User ID" value={user.userId || "6728291037"} isEditing={isEditing} />

      <DetailRow label="User Phone" value={user.phone || "7035261820"} isEditing={isEditing} />

      <DetailRow label="Last Login" value={user.lastLogin} isEditing={isEditing} />

    </div>
  );
};


import ShopDetailRow from "./ShopDetailRow";

export const ShopDetails = ({ user, isEditing }) => {
  const shop = user.shop || {};

  return (
    <div className="flex flex-col gap-2 w-full">

      <ShopDetailRow
        label="Shop ID"
        value={shop.id || "13234566567675435342435465"}
        isEditing={isEditing}
      />

      <ShopDetailRow
        label="Shop Name"
        value={shop.name || "Royal Care Comprehensive Health & Solutions"}
        isEditing={isEditing}
      />

      <ShopDetailRow
        label="Branch Name"
        value={shop.branch || "Royal Care Pharma,"}
        isEditing={isEditing}
      />

      <ShopDetailRow
        label="GST"
        value={shop.gst || "27ABCDE1234A1Z5"}
        isEditing={isEditing}
      />

      <ShopDetailRow
        label="Address"
        value={shop.address || "Pavakulath Building, Kaloor, Ernakulam"}
        isEditing={isEditing}
      />

      <ShopDetailRow
        label="Postal Code"
        value={shop.postal || "682017"}
        isEditing={isEditing}
      />

      <ShopDetailRow
        label="Sub Status"
        value={shop.subStatus || "Active"}
        isEditing={isEditing}
      />

    </div>
  );
};


import { useState } from "react";
import { FileText, CloudDownload, Trash2, ExternalLink } from "lucide-react";

export const DocumentsTab = ({ user }) => {
  // Local state so deleting updates instantly
  const [docs, setDocs] = useState(
    user.documents || [
      {
        name: "Drug License",
        date: "22 September 2025",
        by: "John Phillips",
        size: "103 KB",
        fileUrl: "/dummy/drug-license.pdf",
      },
      {
        name: "Shop & Establishment Act License",
        date: "22 September 2025",
        by: "John Phillips",
        size: "103 KB",
        fileUrl: "/dummy/shop-license.pdf",
      },
      {
        name: "Pharmacy Registration Certificate",
        date: "22 September 2025",
        by: "John Phillips",
        size: "103 KB",
        fileUrl: "/dummy/pharma-cert.pdf",
      },
      {
        name: "Business PAN",
        date: "22 September 2025",
        by: "John Phillips",
        size: "103 KB",
        fileUrl: "/dummy/business-pan.pdf",
      },
      {
        name: "Business Registration Certificate",
        date: "22 September 2025",
        by: "John Phillips",
        size: "103 KB",
        fileUrl: "/dummy/business-reg.pdf",
      },
      {
        name: "Address Proof",
        date: "22 September 2025",
        by: "John Phillips",
        size: "103 KB",
        fileUrl: "/dummy/address-proof.pdf",
      },
    ]
  );

  // ⭐ Download Handler
  const handleDownload = (doc) => {
    const link = document.createElement("a");
    link.href = doc.fileUrl || "#";
    link.download = doc.name || "document";
    link.click();
  };

  // ⭐ Delete Handler
  const handleDelete = (name) => {
    const confirmed = window.confirm(`Delete "${name}" permanently?`);

    if (confirmed) {
      setDocs((prev) => prev.filter((d) => d.name !== name));
    }
  };

  // ⭐ Preview Handler (Open in new tab)
  const handlePreview = (doc) => {
    window.open(doc.fileUrl, "_blank");
  };

  return (
    <div className="grid grid-cols-2 gap-6 pr-10">

      {docs.map((doc, i) => (
        <div
          key={i}
          className="
            flex items-start justify-between
            border rounded-xl p-4
            shadow-sm hover:shadow-md
            transition bg-white
          "
        >
          {/* LEFT SIDE: FILE ICON + TEXT */}
          <div className="flex gap-4">

            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-100">
              <FileText size={22} className="text-gray-700" />
            </div>

            <div>
              <p className="font-semibold text-gray-800 leading-tight">
                {doc.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {doc.date} , {doc.by}
              </p>
              <p className="text-xs text-gray-500">{doc.size}</p>
            </div>
          </div>

          {/* RIGHT SIDE: ACTION ICONS */}
          <div className="flex items-center gap-4 pr-2">

            {/* PREVIEW */}
            <ExternalLink
              size={18}
              className="cursor-pointer text-gray-600 hover:text-[#05015A]"
              onClick={() => handlePreview(doc)}
            />

            {/* DOWNLOAD */}
            <CloudDownload
              size={18}
              className="cursor-pointer text-gray-600 hover:text-[#05015A]"
              onClick={() => handleDownload(doc)}
            />

            {/* DELETE */}
            <Trash2
              size={18}
              className="cursor-pointer text-red-500 hover:text-red-700"
              onClick={() => handleDelete(doc.name)}
            />
          </div>
        </div>
      ))}

    </div>
  );
};
