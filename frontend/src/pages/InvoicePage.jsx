import { useState } from "react";
import InvoiceFilters from "../components/invoice/InvoiceFilters";
import InvoiceTable from "../components/invoice/InvoiceTable";
import InvoicePagination from "../components/invoice/InvoicePagination";
import { invoiceData } from "../components/data/invoices";

const ROWS_PER_PAGE = 10;

const InvoicePage = () => {
  const [filters, setFilters] = useState({
    name: "",
    billNo: "",
    phone: "",
    fromDate: "",
    toDate: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to page 1 on every search change
  };

  // --------------------- FILTER LOGIC ---------------------
  const filteredData = invoiceData.filter((invoice) => {
    const matchName = invoice.name
      .toLowerCase()
      .includes(filters.name.toLowerCase());

    const matchBill = invoice.billNo
      .toString()
      .includes(filters.billNo.toString());

    const matchPhone = invoice.phone
      .toString()
      .includes(filters.phone.toString());

    const invoiceDate = new Date(invoice.date);
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
    const toDate = filters.toDate ? new Date(filters.toDate) : null;

    const matchDate =
      (!fromDate || invoiceDate >= fromDate) &&
      (!toDate || invoiceDate <= toDate);

    return matchName && matchBill && matchPhone && matchDate;
  });

  // --------------------- PAGINATION ---------------------
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

 return (
  <div className="px-6 pt-4 font-poppins w-full">


    <InvoiceFilters filters={filters} onChange={handleFilterChange} />

    {/* TABLE — NOT SCROLLABLE */}
    <InvoiceTable invoices={paginatedData} />

    <InvoicePagination
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
    />

  </div>
);
};

export default InvoicePage;
