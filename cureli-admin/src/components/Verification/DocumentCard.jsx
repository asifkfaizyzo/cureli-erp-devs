import { RotateCcw, Download, FileText } from "lucide-react";

const DocumentCard = ({ doc }) => {
  const statusStyles = {
    pending: "bg-white border",
    approved: "bg-green-100 border-green-300",
    reject: "bg-red-100 border-red-300",
    failed: "bg-red-100 border-red-300",
    passed: "bg-green-100 border-green-300",
  };

  return (
    <div
      className={`p-3 rounded-xl border ${statusStyles[doc.status]} shadow-sm`}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <FileText size={20} className="text-gray-600" />
          <span className="font-medium text-[13px]">{doc.name}</span>
        </div>
        <Download size={18} className="cursor-pointer" />
      </div>

      <p className="mt-2 text-[12px]">
        {doc.date} , {doc.uploader}
      </p>

      <p className="text-[11px] text-gray-600">{doc.size}</p>

      {doc.status === "approved" && (
        <div className="flex gap-3 mt-3">
          <button className="w-full bg-green-200 text-green-800 py-1 rounded-md text-[12px]">
            Approve
          </button>
          <button className="w-full bg-red-200 text-red-800 py-1 rounded-md text-[12px]">
            Reject
          </button>
        </div>
      )}

      {doc.status === "failed" && (
        <div className="mt-3 text-[12px] text-red-700 flex justify-between">
          <span>Document Verification Failed*</span>
          <RotateCcw size={16} className="cursor-pointer" />
        </div>
      )}

      {doc.status === "passed" && (
        <div className="mt-3 text-[12px] text-green-700 flex justify-between">
          <span>Your documents passed verification*</span>
          <RotateCcw size={16} className="cursor-pointer" />
        </div>
      )}
    </div>
  );
};

export default DocumentCard;
