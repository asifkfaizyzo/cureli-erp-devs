// EnquiriesTable.jsx
import { Eye, MessageSquare, MoreVertical, Trash2 } from "lucide-react";
import { useState, useRef, useEffect, memo, useCallback } from "react";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  REPLIED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const EnquiriesTable = memo(
  ({ enquiries, isLoading, onView, onReply, onDelete, pagination, onPageChange }) => {
    const [openMenu, setOpenMenu] = useState(null);
    const menuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setOpenMenu(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleMenu = useCallback((enquiryId) => {
      setOpenMenu((prev) => (prev === enquiryId ? null : enquiryId));
    }, []);

    const handleDelete = useCallback(
      (enquiry) => {
        onDelete(enquiry);
        setOpenMenu(null);
      },
      [onDelete]
    );

    if (isLoading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000060]"></div>
          </div>
        </div>
      );
    }

    if (!enquiries?.length) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No enquiries found</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Enquiry
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enquiries.map((enquiry) => (
                <tr
                  key={enquiry.enquiry_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{enquiry.name}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {enquiry.enquiry_number}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{enquiry.email}</p>
                      {enquiry.phone && (
                        <p className="text-xs text-gray-500">{enquiry.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600 truncate max-w-[200px]">
                      {enquiry.message}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusColors[enquiry.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {enquiry.status?.replace("_", " ") || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-gray-900">
                        {formatDate(enquiry.created_at)}
                      </p>
                      {enquiry.reply_count > 0 && (
                        <p className="text-xs text-green-600">
                          {enquiry.reply_count}{" "}
                          {enquiry.reply_count === 1 ? "reply" : "replies"}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(enquiry)}
                        className="p-2 text-gray-500 hover:text-[#000060] hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onReply(enquiry)}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Reply"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <div
                        className="relative"
                        ref={openMenu === enquiry.enquiry_id ? menuRef : null}
                      >
                        <button
                          onClick={() => toggleMenu(enquiry.enquiry_id)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenu === enquiry.enquiry_id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                            <button
                              onClick={() => handleDelete(enquiry)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

EnquiriesTable.displayName = "EnquiriesTable";

export default EnquiriesTable;


// import { Eye, MessageSquare, MoreVertical, Trash2 } from "lucide-react";
// import { useState, useRef, useEffect } from "react";

// const statusColors = {
//   PENDING: "bg-yellow-100 text-yellow-800",
//   IN_PROGRESS: "bg-blue-100 text-blue-800",
//   REPLIED: "bg-green-100 text-green-800",
//   CLOSED: "bg-gray-100 text-gray-800",
// };

// const formatDate = (date) => {
//   return new Date(date).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const EnquiriesTable = ({ 
//   enquiries, 
//   isLoading, 
//   onView, 
//   onReply, 
//   onDelete,
//   pagination,
//   onPageChange 
// }) => {
//   const [openMenu, setOpenMenu] = useState(null);
//   const menuRef = useRef(null);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (menuRef.current && !menuRef.current.contains(e.target)) {
//         setOpenMenu(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   if (isLoading) {
//     return (
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
//         <div className="flex items-center justify-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000060]"></div>
//         </div>
//       </div>
//     );
//   }

//   if (!enquiries?.length) {
//     return (
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
//         <div className="text-center text-gray-500">
//           <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
//           <p>No enquiries found</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead className="bg-gray-50 border-b border-gray-100">
//             <tr>
//               <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                 Enquiry
//               </th>
//               <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                 Contact
//               </th>
//               <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                 Message
//               </th>
//               <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                 Status
//               </th>
//               <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                 Date
//               </th>
//               <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100">
//             {enquiries.map((enquiry) => (
//               <tr key={enquiry.enquiry_id} className="hover:bg-gray-50 transition-colors">
//                 <td className="px-4 py-4">
//                   <div>
//                     <p className="font-medium text-gray-900">{enquiry.name}</p>
//                     <p className="text-xs text-gray-500 font-mono">{enquiry.enquiry_number}</p>
//                   </div>
//                 </td>
//                 <td className="px-4 py-4">
//                   <div>
//                     <p className="text-sm text-gray-900">{enquiry.email}</p>
//                     {enquiry.phone && (
//                       <p className="text-xs text-gray-500">{enquiry.phone}</p>
//                     )}
//                   </div>
//                 </td>
//                 <td className="px-4 py-4">
//                   <p className="text-sm text-gray-600 truncate max-w-[200px]">
//                     {enquiry.message}
//                   </p>
//                 </td>
//                 <td className="px-4 py-4">
//                   <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[enquiry.status]}`}>
//                     {enquiry.status.replace("_", " ")}
//                   </span>
//                 </td>
//                 <td className="px-4 py-4">
//                   <div>
//                     <p className="text-sm text-gray-900">{formatDate(enquiry.created_at)}</p>
//                     {enquiry.reply_count > 0 && (
//                       <p className="text-xs text-green-600">{enquiry.reply_count} replies</p>
//                     )}
//                   </div>
//                 </td>
//                 <td className="px-4 py-4">
//                   <div className="flex items-center justify-end gap-2">
//                     <button
//                       onClick={() => onView(enquiry)}
//                       className="p-2 text-gray-500 hover:text-[#000060] hover:bg-gray-100 rounded-lg transition-colors"
//                       title="View Details"
//                     >
//                       <Eye className="w-4 h-4" />
//                     </button>
//                     <button
//                       onClick={() => onReply(enquiry)}
//                       className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                       title="Reply"
//                     >
//                       <MessageSquare className="w-4 h-4" />
//                     </button>
//                     <div className="relative" ref={openMenu === enquiry.enquiry_id ? menuRef : null}>
//                       <button
//                         onClick={() => setOpenMenu(openMenu === enquiry.enquiry_id ? null : enquiry.enquiry_id)}
//                         className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//                       >
//                         <MoreVertical className="w-4 h-4" />
//                       </button>
//                       {openMenu === enquiry.enquiry_id && (
//                         <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
//                           <button
//                             onClick={() => {
//                               onDelete(enquiry);
//                               setOpenMenu(null);
//                             }}
//                             className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                             Delete
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       {pagination && pagination.totalPages > 1 && (
//         <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
//           <p className="text-sm text-gray-500">
//             Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
//             {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
//             {pagination.total} results
//           </p>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => onPageChange(pagination.page - 1)}
//               disabled={pagination.page === 1}
//               className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Previous
//             </button>
//             <span className="px-3 py-1 text-sm">
//               Page {pagination.page} of {pagination.totalPages}
//             </span>
//             <button
//               onClick={() => onPageChange(pagination.page + 1)}
//               disabled={pagination.page === pagination.totalPages}
//               className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Next
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EnquiriesTable;