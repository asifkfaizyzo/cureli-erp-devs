// src/pages/SupplierPage.jsx

import { useState, useMemo, useEffect } from "react";
import SupplierHeader from "./components/SupplierHeader";
import SupplierTable from "./components/SupplierTable";
import { suppliersData } from "../../components/data/suppliers";
import useRowCount from "../../hooks/useRowCount";

const SupplierPage = () => {
  const rowsPerPage = useRowCount(); // dynamic based on screen size

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter data
  const filteredSuppliers = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return suppliersData;

    return suppliersData.filter((item) => {
      return (
        item.supplierId.toLowerCase().includes(s) ||
        item.name.toLowerCase().includes(s) ||
        item.contact.toLowerCase().includes(s) ||
        item.email.toLowerCase().includes(s) ||
        item.gst.toLowerCase().includes(s)
      );
    });
  }, [searchTerm]);

  // Pagination calculations
  const totalCount = filteredSuppliers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  // Smooth load transition
  const handlePageChange = (page) => {
    setLoading(true);
    setTimeout(() => {
      setCurrentPage(page);
      setLoading(false);
    }, 180);
  };

  // Paginated + padded rows
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const pageItems = filteredSuppliers.slice(start, start + rowsPerPage);

    // Pad empty rows to keep table height constant
    while (pageItems.length < rowsPerPage) {
      pageItems.push({ empty: true });
    }

    return pageItems;
  }, [filteredSuppliers, currentPage, rowsPerPage]);

  return (
    <div className="p-6 w-full">

      {/* Header */}
      <SupplierHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Table */}
      <div className="mt-4">
        <SupplierTable 
          data={paginatedData}
          currentPage={currentPage}
          setCurrentPage={handlePageChange}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          totalPages={totalPages}
          loading={loading}
          onRowClick={(s) => console.log("Clicked:", s)}
        />
      </div>

    </div>
  );
};

export default SupplierPage;
