import { X } from "lucide-react";
import VerificationDetailsTop from "./VerificationDetailsTop";
import DocumentCard from "./DocumentCard";

const VerificationModal = ({ user, onClose }) => {
  // Dummy documents for now
  const documents = [
    {
      id: 1,
      name: "Shop &Establishment Act License",
      date: "22 September 2025",
      uploader: "John Phillips",
      size: "103 KB",
      status: "approved",
    },
    {
      id: 2,
      name: "Shop &Establishment Act License",
      date: "22 September 2025",
      uploader: "John Phillips",
      size: "103 KB",
      status: "failed",
    },
    {
      id: 3,
      name: "Shop &Establishment Act License",
      date: "22 September 2025",
      uploader: "John Phillips",
      size: "103 KB",
      status: "passed",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-[90%] max-w-6xl rounded-xl p-6 relative">

        {/* Close button */}
        <button onClick={onClose} className="absolute right-4 top-4">
          <X size={22} />
        </button>

        {/* TOP SECTION */}
        <VerificationDetailsTop user={user} />

        {/* BOTTOM DOCUMENT SECTION */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>

      </div>
    </div>
  );
};

export default VerificationModal;
