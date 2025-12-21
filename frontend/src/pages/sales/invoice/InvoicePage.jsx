import React, { useState, useEffect, useMemo } from "react";
import InvoiceFilters from "./components/InvoiceFilters";
import InvoiceTable from "./components/InvoiceTable";
import InvoicePagination from "./components/InvoicePagination";
import ViewInvoiceModal from "./components/ViewInvoiceModal";
import useDynamicRowCount from "../../../hooks/useDynamicRowCount";
import { invoiceData } from "../../../components/data/invoices";

const InvoicePage = () => {
  // ✅ Use state for invoices so we can delete
  const [invoices, setInvoices] = useState(invoiceData);
  
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
  const [modalMode, setModalMode] = useState("view");

  const rowsPerPage = useDynamicRowCount();

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  // --------------------- FILTER LOGIC ---------------------
  const filteredData = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchName = invoice.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchBill = invoice.billNo.toString().includes(filters.billNo.toString());
      const matchPhone = invoice.phone.toString().includes(filters.phone.toString());
      const invoiceDate = new Date(invoice.date);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;
      const matchDate = (!fromDate || invoiceDate >= fromDate) && (!toDate || invoiceDate <= toDate);
      return matchName && matchBill && matchPhone && matchDate;
    });
  }, [filters, invoices]); // ✅ Added invoices dependency

  // --------------------- PAGINATION ---------------------
  useEffect(() => {
    const newTotalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0) {
      setCurrentPage(1);
    }
  }, [rowsPerPage, filteredData.length, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, startIndex, rowsPerPage]);

  // --------------------- HANDLERS ---------------------
  const handleView = (invoice) => {
    // console.log("📋 View clicked:", invoice);
    
    const fullInvoice = {
      billNo: invoice.billNo,
      date: invoice.date,
      billedBy: "Admin User",
      time: "11:22 AM",
      items: [], // Empty = will use DUMMY_ITEMS in modal
      customer: { 
        id: invoice.id, 
        name: invoice.name, 
        phone: invoice.phone, 
        eway: invoice.eway || "EW12345", 
        address: "Kochi, Kerala", 
        docName: "Dr. Abraham", 
        payment: "Cash" 
      },
      summary: { 
        subTotal: invoice.price - 40, 
        sgst: 20, 
        cgst: 20, 
        total: invoice.price 
      },
    };
    
    setSelectedBill(fullInvoice);
    setModalMode("view");
    setOpenViewModal(true);
  };

  const handleEdit = (invoice) => {
    // console.log("✏️ Edit clicked:", invoice);
    
    const fullInvoice = {
      id: invoice.id, // ✅ Include ID for deletion
      billNo: invoice.billNo,
      date: invoice.date,
      billedBy: "Admin User",
      time: "11:22 AM",
      items: [],
      customer: { 
        id: invoice.id, 
        name: invoice.name, 
        phone: invoice.phone, 
        eway: invoice.eway || "EW12345", 
        address: "Kochi, Kerala", 
        docName: "Dr. Abraham", 
        payment: "Cash" 
      },
      summary: { 
        subTotal: invoice.price - 40, 
        sgst: 20, 
        cgst: 20, 
        total: invoice.price 
      },
    };
    
    setSelectedBill(fullInvoice);
    setModalMode("edit");
    setOpenViewModal(true);
  };

  // ✅ REAL DELETE FUNCTIONALITY
  const handleDelete = (invoice) => {
    // console.log("🗑️ Delete clicked:", invoice);
    
    if (confirm(`Delete invoice #${invoice.billNo}?`)) {
      // Remove from state
      setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
      
      // console.log("✅ Invoice deleted successfully!");
      
      // Show success message
      const successAlert = document.createElement('div');
      successAlert.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-fade-in';
      successAlert.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span>Invoice #${invoice.billNo} deleted successfully!</span>
        </div>
      `;
      document.body.appendChild(successAlert);
      
      // Remove after 3 seconds
      setTimeout(() => {
        successAlert.remove();
      }, 3000);
    }
  };

  // ✅ Handle save from modal
  const handleSave = (updatedBill) => {
    // console.log("💾 Save from modal:", updatedBill);
    
    // Update invoice in state
    setInvoices(prev => prev.map(inv => 
      inv.id === updatedBill.id ? { ...inv, ...updatedBill } : inv
    ));
    
    setOpenViewModal(false);
    
    // Show success message
    const successAlert = document.createElement('div');
    successAlert.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-[100]';
    successAlert.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span>Invoice #${updatedBill.billNo} saved successfully!</span>
      </div>
    `;
    document.body.appendChild(successAlert);
    setTimeout(() => successAlert.remove(), 3000);
  };

  // ✅ Handle delete from modal
  const handleDeleteFromModal = (bill) => {
    console.log("🗑️ Delete from modal:", bill);
    
    if (confirm(`Delete invoice #${bill.billNo}?`)) {
      // Remove from state
      setInvoices(prev => prev.filter(inv => inv.id !== bill.id));
      
      setOpenViewModal(false);
      
      // console.log("✅ Invoice deleted from modal!");
      
      // Show success message
      const successAlert = document.createElement('div');
      successAlert.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[100]';
      successAlert.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span>Invoice #${bill.billNo} deleted successfully!</span>
        </div>
      `;
      document.body.appendChild(successAlert);
      setTimeout(() => successAlert.remove(), 3000);
    }
  };

  // ✅ Handle print from modal
  const handlePrint = (bill) => {
    // console.log("🖨️ Print clicked:", bill);
    
    // Show printing message
    const printAlert = document.createElement('div');
    printAlert.className = 'fixed top-4 right-4 bg-indigo-500 text-white px-6 py-3 rounded-lg shadow-lg z-[100]';
    printAlert.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Preparing invoice #${bill.billNo} for printing...</span>
      </div>
    `;
    document.body.appendChild(printAlert);
    
    setTimeout(() => {
      printAlert.remove();
      window.print();
    }, 1000);
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-poppins">
      
      {/* 1. Top Section: Filters (Fixed Height) */}
      <div className="p-4 border-b border-gray-100">
        <InvoiceFilters filters={filters} onChange={handleFilterChange} />
      </div>

      {/* 2. Middle Section: Table (Flex-Grow) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <InvoiceTable 
          invoices={paginatedData} 
          onView={handleView} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          rowsPerPage={rowsPerPage}
          startIndex={startIndex}
        >
           {/* 3. Bottom Section: Pagination */}
           <div className="mt-auto border-t border-gray-200 bg-white z-20">
              <InvoicePagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalItems={filteredData.length}
                rowsPerPage={rowsPerPage}
              />
           </div>
        </InvoiceTable>
      </div>

      {/* Modal */}
      <ViewInvoiceModal
        open={openViewModal}
        onClose={() => {
          // console.log("❌ Modal closed");
          setOpenViewModal(false);
        }}
        bill={selectedBill}
        mode={modalMode}
        onSave={handleSave}
        onDelete={handleDeleteFromModal}
        onPrint={handlePrint}
      />
    </div>
  );
};

export default InvoicePage;
