// src/pages/ShopsPage.jsx
import { useState, useEffect, useMemo } from "react";
import ShopsHeader from "../components/Shops/ShopsHeader";
import ShopsTable from "../components/Shops/ShopsTable";
import shopsData from "../data/shopsdummydata";

const ShopsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const updateRows = () => {
      const w = window.innerWidth;
      if (w >= 2560) setRowsPerPage(16);
      else if (w >= 1920) setRowsPerPage(14);
      else if (w >= 1440) setRowsPerPage(10);
      else if (w >= 1366) setRowsPerPage(8);
      else setRowsPerPage(7);
    };
    updateRows();
    window.addEventListener("resize", updateRows);
    return () => window.removeEventListener("resize", updateRows);
  }, []);

  const filtered = useMemo(() => {
    const txt = search.toLowerCase();
    return shopsData.filter(
      (s) =>
        s.businessName.toLowerCase().includes(txt) ||
        s.ownerName.toLowerCase().includes(txt) ||
        s.gst.toLowerCase().includes(txt)
    );
  }, [search]);

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  useEffect(() => setCurrentPage(1), [rowsPerPage, search]);

  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="flex flex-col gap-4">
      <ShopsHeader search={search} setSearch={setSearch} />

      <ShopsTable
        shops={paginated}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
};

export default ShopsPage;
