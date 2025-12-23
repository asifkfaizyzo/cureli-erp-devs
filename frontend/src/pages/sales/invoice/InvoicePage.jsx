import React, { useState, useEffect, useMemo } from "react";
import { toast } from 'react-toastify';
import InvoiceFilters from "./components/InvoiceFilters";
import InvoiceTable from "./components/InvoiceTable";
import InvoicePagination from "./components/InvoicePagination";
import ViewInvoiceModal from "./components/ViewInvoiceModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
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

  // ✅ Confirmation state
  const [confirmDelete, setConfirmDelete] = useState(null);

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
  }, [filters, invoices]);

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
    const fullInvoice = {
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
    setModalMode("view");
    setOpenViewModal(true);
  };

  const handleEdit = (invoice) => {
    const fullInvoice = {
      id: invoice.id,
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

  // ✅ DELETE WITH CONFIRM DIALOG
  const handleDelete = (invoice) => {
    setConfirmDelete(invoice);
  };

  // ✅ Handle save from modal
  const handleSave = (updatedBill) => {
    try {
      setInvoices(prev => prev.map(inv => 
        inv.id === updatedBill.id ? { ...inv, ...updatedBill } : inv
      ));
      
      setOpenViewModal(false);
      toast.success(`Invoice #${updatedBill.billNo} saved successfully!`);
    } catch (error) {
      toast.error("Failed to save invoice. Please try again.");
      console.error("Save error:", error);
    }
  };

  // ✅ Handle delete from modal
  const handleDeleteFromModal = (bill) => {
    setConfirmDelete(bill);
    setOpenViewModal(false);
  };

  // ✅ Handle print from modal
  const handlePrint = (bill) => {
    try {
      toast.info("Preparing invoice for print...", { autoClose: 2000 });
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      toast.error("Failed to print invoice");
      console.error("Print error:", error);
    }
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
          setOpenViewModal(false);
        }}
        bill={selectedBill}
        mode={modalMode}
        onSave={handleSave}
        onDelete={handleDeleteFromModal}
        onPrint={handlePrint}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          try {
            setInvoices(prev => prev.filter(inv => inv.id !== confirmDelete.id));
            toast.success(`Invoice #${confirmDelete.billNo} deleted successfully!`);
            setConfirmDelete(null);
          } catch (error) {
            toast.error("Failed to delete invoice. Please try again.");
            console.error("Delete error:", error);
          }
        }}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice #${confirmDelete?.billNo}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default InvoicePage;
