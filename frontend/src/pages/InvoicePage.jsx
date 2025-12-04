// import { useState } from "react";
// import InvoiceFilters from "../components/invoice/InvoiceFilters";
// import InvoiceTable from "../components/invoice/InvoiceTable";
// import InvoicePagination from "../components/invoice/InvoicePagination";
// import ViewInvoiceModal from "../components/invoice/ViewInvoiceModal";

// import { invoiceData } from "../components/data/invoices";

// const ROWS_PER_PAGE = 10;

// const InvoicePage = () => {
//   const [filters, setFilters] = useState({
//     name: "",
//     billNo: "",
//     phone: "",
//     fromDate: "",
//     toDate: "",
//   });

//   const [currentPage, setCurrentPage] = useState(1);

//   // NEW — modal states
//   const [openViewModal, setOpenViewModal] = useState(false);
//   const [selectedBill, setSelectedBill] = useState(null);

//   const handleFilterChange = (field, value) => {
//     setFilters((prev) => ({ ...prev, [field]: value }));
//     setCurrentPage(1);
//   };

//   // --------------------- FILTER LOGIC ---------------------
//   const filteredData = invoiceData.filter((invoice) => {
//     const matchName = invoice.name
//       .toLowerCase()
//       .includes(filters.name.toLowerCase());

//     const matchBill =
//       invoice.billNo.toString().includes(filters.billNo.toString());

//     const matchPhone =
//       invoice.phone.toString().includes(filters.phone.toString());

//     const invoiceDate = new Date(invoice.date);
//     const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
//     const toDate = filters.toDate ? new Date(filters.toDate) : null;

//     const matchDate =
//       (!fromDate || invoiceDate >= fromDate) &&
//       (!toDate || invoiceDate <= toDate);

//     return matchName && matchBill && matchPhone && matchDate;
//   });

//   // --------------------- PAGINATION ---------------------
//   const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
//   const paginatedData = filteredData.slice(
//     startIndex,
//     startIndex + ROWS_PER_PAGE
//   );
//   const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

//   // --------------------- UPDATED VIEW HANDLER ---------------------
//   const handleView = (invoice) => {
//     const fullInvoice = {
//       ...invoice,

//       billedBy: "Admin User",
//       time: "11:22 AM",

//       items: [
//         {
//           name: "Paracetamol 650mg",
//           batch: "BATCH123",
//           rate: 25,
//           qty: 2,
//           exp: "12/2026",
//           type: "Tablet",
//           category: "Pain Relief",
//           stock: 42,
//           rack: "R2",
//           tax: 5,
//           taxAmt: 2.5,
//           disc: "0%",
//           mrp: 50,
//         },
//         {
//           name: "Cough Syrup",
//           batch: "COF567",
//           rate: 80,
//           qty: 1,
//           exp: "08/2025",
//           type: "Syrup",
//           category: "Cold & Flu",
//           stock: 12,
//           rack: "R1",
//           tax: 12,
//           taxAmt: 9.6,
//           disc: "0%",
//           mrp: 80,
//         },
//       ],

//       customer: {
//         id: invoice.id,
//         name: invoice.name,
//         phone: invoice.phone,
//         eway: invoice.eway,
//         address: "Kochi, Kerala",
//         docName: "Dr. Abraham",
//         payment: "Cash",
//       },

//       summary: {
//         subTotal: invoice.price - 40,
//         sgst: 20,
//         cgst: 20,
//         total: invoice.price,
//       },
//     };

//     setSelectedBill(fullInvoice);
//     setOpenViewModal(true);
//   };

//   const handleEdit = (invoice) => {
//     console.log("Edit:", invoice);
//     alert(`Editing invoice #${invoice.billNo}`);
//   };

//   const handleDelete = (invoice) => {
//     console.log("Delete:", invoice);
//     if (confirm(`Delete invoice #${invoice.billNo}?`)) {
//       // delete logic later
//     }
//   };

//   return (
//     <div className="px-6 pt-4 font-poppins w-full">
//       <InvoiceFilters filters={filters} onChange={handleFilterChange} />

//       <InvoiceTable
//         invoices={paginatedData}
//         onView={handleView}
//         onEdit={handleEdit}
//         onDelete={handleDelete}
//       />

//       <InvoicePagination
//         currentPage={currentPage}
//         setCurrentPage={setCurrentPage}
//         totalPages={totalPages}
//       />

//       {/* 🔥 VIEW MODAL HERE */}
//       <ViewInvoiceModal
//         open={openViewModal}
//         onClose={() => setOpenViewModal(false)}
//         bill={selectedBill}
//       />
//     </div>
//   );
// };

// export default InvoicePage;


import React, { useState } from "react";
import InvoiceFilters from "../components/invoice/InvoiceFilters";
import InvoiceTable from "../components/invoice/InvoiceTable";
import InvoicePagination from "../components/invoice/InvoicePagination";
import ViewInvoiceModal from "../components/invoice/ViewInvoiceModal";
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
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // --------------------- FILTER LOGIC (Unchanged) ---------------------
  const filteredData = invoiceData.filter((invoice) => {
    const matchName = invoice.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchBill = invoice.billNo.toString().includes(filters.billNo.toString());
    const matchPhone = invoice.phone.toString().includes(filters.phone.toString());
    const invoiceDate = new Date(invoice.date);
    const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
    const toDate = filters.toDate ? new Date(filters.toDate) : null;
    const matchDate = (!fromDate || invoiceDate >= fromDate) && (!toDate || invoiceDate <= toDate);
    return matchName && matchBill && matchPhone && matchDate;
  });

  // --------------------- PAGINATION (Unchanged) ---------------------
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  // --------------------- HANDLERS (Unchanged) ---------------------
  const handleView = (invoice) => {
    // ... (Your existing logic regarding fullInvoice object construction)
    const fullInvoice = {
      ...invoice,
      billedBy: "Admin User",
      time: "11:22 AM",
      items: [
        { name: "Paracetamol 650mg", batch: "BATCH123", rate: 25, qty: 2, exp: "12/2026", type: "Tablet", category: "Pain Relief", stock: 42, rack: "R2", tax: 5, taxAmt: 2.5, disc: "0%", mrp: 50 },
        { name: "Cough Syrup", batch: "COF567", rate: 80, qty: 1, exp: "08/2025", type: "Syrup", category: "Cold & Flu", stock: 12, rack: "R1", tax: 12, taxAmt: 9.6, disc: "0%", mrp: 80 },
      ],
      customer: { id: invoice.id, name: invoice.name, phone: invoice.phone, eway: invoice.eway, address: "Kochi, Kerala", docName: "Dr. Abraham", payment: "Cash" },
      summary: { subTotal: invoice.price - 40, sgst: 20, cgst: 20, total: invoice.price },
    };
    setSelectedBill(fullInvoice);
    setOpenViewModal(true);
  };

  const handleEdit = (invoice) => {
    console.log("Edit:", invoice);
    alert(`Editing invoice #${invoice.billNo}`);
  };

  const handleDelete = (invoice) => {
    console.log("Delete:", invoice);
    if (confirm(`Delete invoice #${invoice.billNo}?`)) { }
  };

  return (
    // ⭐ H-FULL is critical here to fit inside AppLayout without double scrollbars
    <div className="h-full w-full flex flex-col  overflow-hidden font-poppins">
      
      {/* 1. Top Section: Filters (Fixed Height) */}
      <div className="p-4 border-b border-gray-100">
        <InvoiceFilters filters={filters} onChange={handleFilterChange} />
      </div>

      {/* 2. Middle Section: Table (Flex-Grow, Scrollable) */}
      {/* We pass Pagination as a child to render it at the bottom of this container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <InvoiceTable 
          invoices={paginatedData} 
          onView={handleView} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
        >
           {/* 3. Bottom Section: Pagination (Sticky at bottom of table area) */}
           <div className="mt-auto border-t border-gray-200 bg-white z-20">
              <InvoicePagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
           </div>
        </InvoiceTable>
      </div>

      {/* Modal remains outside the flow */}
      <ViewInvoiceModal
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        bill={selectedBill}
      />
    </div>
  );
};

export default InvoicePage;