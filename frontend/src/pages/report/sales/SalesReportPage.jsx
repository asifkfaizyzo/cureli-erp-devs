import { useState } from "react";
import SalesReportHeader from "./components/SalesReportHeader";
import SalesReportTable from "./components/SalesReportTable";
import salesReportData from "../../../components/data/salesReportData";

const SalesReportPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.ceil(salesReportData.length / rowsPerPage);
  const paginatedData = salesReportData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-6">
      <SalesReportHeader
        onExport={() => console.log("Export")}
        onPrint={() => window.print()}
      />

      <SalesReportTable
        data={paginatedData}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default SalesReportPage;
