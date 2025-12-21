// import { useState, useMemo, useEffect } from "react";
// import SupplierHeader from "./components/SupplierHeader";
// import SupplierTable from "./components/SupplierTable";
// import SupplierModal from "./components/SupplierModal";
// import { suppliersData } from "../../components/data/suppliers";
// import useRowCount from "../../hooks/useRowCount";

// const SupplierPage = () => {
//   const rowsPerPage = useRowCount();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);

//   // MAIN TABLE DATA (mutable for delete/edit)
//   const [tableData, setTableData] = useState(suppliersData);

//   // MODAL STATE
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalMode, setModalMode] = useState(null); // "view" | "edit"
//   const [selectedSupplier, setSelectedSupplier] = useState(null);

//   // Reset to page 1 on search
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm]);

//   // FILTER
//   const filteredSuppliers = useMemo(() => {
//     const s = searchTerm.trim().toLowerCase();
//     if (!s) return tableData;

//     return tableData.filter((item) =>
//       item.supplierId.toLowerCase().includes(s) ||
//       item.name.toLowerCase().includes(s) ||
//       item.contact.toLowerCase().includes(s) ||
//       item.email.toLowerCase().includes(s) ||
//       item.gst.toLowerCase().includes(s)
//     );
//   }, [searchTerm, tableData]);

//   // PAGINATION
//   const totalCount = filteredSuppliers.length;
//   const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

//   const handlePageChange = (page) => {
//     setLoading(true);
//     setTimeout(() => {
//       setCurrentPage(page);
//       setLoading(false);
//     }, 180);
//   };

//   const paginatedData = useMemo(() => {
//     const start = (currentPage - 1) * rowsPerPage;
//     const pageItems = filteredSuppliers.slice(start, start + rowsPerPage);

//     while (pageItems.length < rowsPerPage) {
//       pageItems.push({ empty: true });
//     }

//     return pageItems;
//   }, [filteredSuppliers, currentPage, rowsPerPage]);

//   // ROW ACTION HANDLER
//   const handleRowAction = (action, supplier) => {
//     if (action === "delete") {
//       const ok = window.confirm("Are you sure you want to delete this supplier?");
//       if (!ok) return;

//       setTableData((prev) =>
//         prev.filter((s) => s.supplierId !== supplier.supplierId)
//       );
//       return;
//     }

//     setSelectedSupplier(supplier);
//     setModalMode(action); // view | edit
//     setModalOpen(true);
//   };

//   // SAVE FROM MODAL
//   const handleSave = (updatedSupplier) => {
//     setTableData((prev) =>
//       prev.map((s) =>
//         s.supplierId === updatedSupplier.supplierId ? updatedSupplier : s
//       )
//     );
//     setModalOpen(false);
//   };

//   return (
//     <div className="p-6 w-full">

//       {/* HEADER */}
//       <SupplierHeader
//         searchTerm={searchTerm}
//         setSearchTerm={setSearchTerm}
//       />

//       {/* TABLE */}
//       <div className="mt-4">
//         <SupplierTable
//           data={paginatedData}
//           currentPage={currentPage}
//           setCurrentPage={handlePageChange}
//           rowsPerPage={rowsPerPage}
//           totalCount={totalCount}
//           totalPages={totalPages}
//           loading={loading}
//           onRowClick={handleRowAction}
//         />
//       </div>

//       {/* MODAL */}
//       <SupplierModal
//         open={modalOpen}
//         mode={modalMode}
//         supplier={selectedSupplier}
//         onClose={() => setModalOpen(false)}
//         onSave={handleSave}
//       />
//     </div>
//   );
// };

// export default SupplierPage;


// src/pages/SupplierPage.jsx
import { useState, useMemo } from "react";
import SupplierHeader from "./components/SupplierHeader";
import SupplierTable from "./components/SupplierTable";
import SupplierModal from "./components/SupplierModal";
import { suppliersData } from "../../components/data/suppliers";
import usePagination from "../../hooks/usePagination"; // ✅ USE YOUR HOOK

const SupplierPage = () => {
  // 1. STATE: Manage Filters
  const [filters, setFilters] = useState({
    name: "",
    supplierId: "",
    contact: ""
  });

  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState(suppliersData);

  // MODAL STATE
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); 
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // 2. FILTER LOGIC
  const filteredSuppliers = useMemo(() => {
    return tableData.filter((item) => {
      const itemName = item.name?.toLowerCase() || "";
      const itemId = item.supplierId?.toLowerCase() || "";
      const itemPhone = item.contact?.toString() || "";

      return (
        itemName.includes(filters.name.toLowerCase()) &&
        itemId.includes(filters.supplierId.toLowerCase()) &&
        itemPhone.includes(filters.contact)
      );
    });
  }, [filters, tableData]);

  // 3. PAGINATION (Using your custom hook)
  // This hook handles currentPage, rowsPerPage, and slicing the data automatically
  const { 
    currentPage, 
    setCurrentPage, 
    rowsPerPage, 
    paginatedData: rawPaginatedData, 
    totalPages, 
    totalItems 
  } = usePagination(filteredSuppliers);

  // 4. EMPTY ROWS LOGIC (Visual Fix)
  // Your hook gives pure data; we add empty rows here to keep table height consistent
  const finalTableData = useMemo(() => {
    const data = [...rawPaginatedData];
    while (data.length < rowsPerPage) {
      data.push({ empty: true });
    }
    return data;
  }, [rawPaginatedData, rowsPerPage]);

  // Handle Page Change with Loading Effect
  const handlePageChangeWithLoading = (page) => {
    setLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setLoading(false);
    }, 180);
  };

  // FILTER HANDLERS
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    // usePagination automatically resets page when data changes, so we don't need manual reset here
  };

  const handleResetFilters = () => {
    setFilters({ name: "", supplierId: "", contact: "" });
  };

  // ACTIONS (Same as before)
  const handleRowAction = (action, supplier) => {
    if (action === "delete") {
      if (confirm(`Delete ${supplier.name}?`)) {
        setTableData((prev) => prev.filter((s) => s.supplierId !== supplier.supplierId));
        showToast(`Supplier #${supplier.supplierId} deleted successfully!`, "green");
      }
      return;
    }
    setSelectedSupplier(supplier);
    setModalMode(action);
    setModalOpen(true);
  };

  const handleSave = (updatedSupplier) => {
    const exists = tableData.some(s => s.supplierId === updatedSupplier.supplierId);
    if (exists) {
      setTableData((prev) => prev.map((s) => s.supplierId === updatedSupplier.supplierId ? updatedSupplier : s));
    } else {
      setTableData((prev) => [updatedSupplier, ...prev]);
    }
    setModalOpen(false);
    showToast(`Supplier ${updatedSupplier.name} saved successfully!`, "blue");
  };

  const handleAdd = () => {
    setSelectedSupplier({ supplierId: "NEW", name: "", contact: "", email: "", gst: "" });
    setModalMode("edit");
    setModalOpen(true);
  };

  // Helper for Imperative Toast
  const showToast = (msg, color) => {
    const alert = document.createElement('div');
    const bgClass = color === "green" ? "bg-green-500" : "bg-blue-500";
    alert.className = `fixed top-4 right-4 ${bgClass} text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-fade-in`;
    alert.innerHTML = `<div class="flex items-center gap-2"><span>${msg}</span></div>`;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
  };

  return (
    <div className="flex flex-col h-full w-full font-poppins overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <SupplierHeader
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          onSearch={() => setCurrentPage(1)}
          onAdd={handleAdd}
        />
      </div>

      <div className="flex-1 min-h-0 relative">
        <SupplierTable
          data={finalTableData} // Uses the data with empty rows
          currentPage={currentPage}
          setCurrentPage={handlePageChangeWithLoading}
          rowsPerPage={rowsPerPage}
          totalCount={totalItems}
          totalPages={totalPages}
          loading={loading}
          onRowClick={handleRowAction}
        />
      </div>

      <SupplierModal
        open={modalOpen}
        mode={modalMode}
        supplier={selectedSupplier}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default SupplierPage;
