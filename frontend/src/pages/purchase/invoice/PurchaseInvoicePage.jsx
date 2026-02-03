// frontend/src/pages/purchase/invoice/PurchaseInvoicePage.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import PurchaseTable from "./components/PurchaseTable";
import InvoicePagination from "./components/InvoicePagination";
import InvoiceFilters from "./components/InvoiceFilters";
import ViewInvoiceModal from "./components/ViewInvoiceModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/Toast";

import useDynamicRowCount from "../../../hooks/useDynamicRowCount";
import purchaseAPI from "../../../api/purchase";
import { useAuthStore } from "../../../store/useAuthStore";

const PurchaseInvoicePage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  // ✅ Check if current user is super_admin
  const isSuperAdmin = user?.role === "super_admin";

  /* ---------------- FILTER STATE ---------------- */
  const [filters, setFilters] = useState({
    supplierName: "",
    invoiceNumber: "",
    phone: "",
    fromDate: "",
    toDate: "",
    status: "",
    paymentStatus: "",
  });

  /* ---------------- DATA STATE ---------------- */
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /* ---------------- MODAL STATE ---------------- */
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  /* ---------------- CONFIRMATION STATE ---------------- */
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
  });

  /* ---------------- DYNAMIC ROW COUNT ---------------- */
  const rowsPerPage = useDynamicRowCount();

  /* ---------------- LOAD INVOICES ---------------- */
  const loadInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const params = {
        limit: rowsPerPage,
        offset: (currentPage - 1) * rowsPerPage,
        ...(filters.supplierName && { supplierName: filters.supplierName }),
        ...(filters.invoiceNumber && { invoiceNumber: filters.invoiceNumber }),
        ...(filters.status && { status: filters.status }),
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
        ...(filters.fromDate && { startDate: filters.fromDate }),
        ...(filters.toDate && { endDate: filters.toDate }),
      };

      const response = await purchaseAPI.getAll(params);
      
      setInvoices(response.data?.invoices || []);
      setTotalItems(response.data?.total || 0);
    } catch (error) {
      console.error("Load invoices error:", error);
      toast.error("Failed to load invoices", error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, rowsPerPage, filters, toast]);

  /* ---------------- INITIAL LOAD & FILTER CHANGES ---------------- */
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  /* ---------------- FILTER HANDLER ---------------- */
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      supplierName: "",
      invoiceNumber: "",
      phone: "",
      fromDate: "",
      toDate: "",
      status: "",
      paymentStatus: "",
    });
    setCurrentPage(1);
  }, []);

  // Fetch full invoice details before opening modal
  const fetchInvoiceDetails = useCallback(async (invoiceId) => {
    try {
      setIsLoadingDetails(true);
      const response = await purchaseAPI.getById(invoiceId);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new Error(response.message || "Failed to fetch invoice details");
    } catch (error) {
      console.error("Failed to fetch invoice details:", error);
      toast.error("Failed to load invoice details", error.response?.data?.message || error.message);
      return null;
    } finally {
      setIsLoadingDetails(false);
    }
  }, [toast]);

  /* ---------------- TABLE ACTIONS ---------------- */
  
  // Fetch full details on row click
  const handleRowClick = useCallback(async (invoice) => {
    const fullInvoice = await fetchInvoiceDetails(invoice.invoice_id);
    if (fullInvoice) {
      console.log("✅ Full invoice loaded:", fullInvoice);
      console.log("✅ Line items count:", fullInvoice.lineItems?.length);
      setSelectedInvoice(fullInvoice);
      setModalMode("view");
      setOpenModal(true);
    }
  }, [fetchInvoiceDetails]);

  // Fetch full details on view button click
  const handleView = useCallback(async (invoice, event) => {
    event?.stopPropagation();
    const fullInvoice = await fetchInvoiceDetails(invoice.invoice_id);
    if (fullInvoice) {
      setSelectedInvoice(fullInvoice);
      setModalMode("view");
      setOpenModal(true);
    }
  }, [fetchInvoiceDetails]);

  // ✅ UPDATED: Handle edit - Allow super_admin to edit confirmed invoices
  const handleEdit = useCallback((invoice, event) => {
    // Stop propagation if event exists (from table row)
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    
    // Get invoice data
    const invoiceId = invoice?.invoice_id || invoice?.id;
    const invoiceStatus = invoice?.status?.toUpperCase();
    const invoiceNumber = invoice?.invoice_number;
    
    if (!invoiceId) {
      toast.error("Error", "Invalid invoice data");
      return;
    }

    // ✅ CASE 1: Draft invoices - always editable by anyone
    if (invoiceStatus === "DRAFT") {
      setOpenModal(false);
      setSelectedInvoice(null);
      setTimeout(() => {
        navigate(`/purchase/billing/${invoiceId}`);
      }, 150);
      return;
    }

    // ✅ CASE 2: Confirmed invoices - only super_admin can edit
    if (invoiceStatus === "CONFIRMED") {
      if (isSuperAdmin) {
        // Show warning dialog before editing confirmed invoice
        setConfirmDialog({
          isOpen: true,
          type: 'warning',
          title: 'Edit Confirmed Invoice',
          message: (
            <div className="space-y-3">
              <p className="font-medium text-amber-800">
                You are about to edit a <strong>CONFIRMED</strong> invoice as Super Admin.
              </p>
              <div className="bg-amber-50 p-3 rounded border border-amber-200 text-sm">
                <p className="font-semibold text-gray-900">Invoice: {invoiceNumber}</p>
                <p className="text-gray-600">Supplier: {invoice.supplier?.name}</p>
                <p className="text-gray-600">Amount: ₹{parseFloat(invoice.net_amount || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-sm text-red-800 font-medium">⚠️ Important Warning:</p>
                <ul className="text-xs text-red-700 mt-1 list-disc list-inside space-y-1">
                  <li>Current stock will be <strong>reversed</strong> automatically</li>
                  <li>New stock will be added after saving changes</li>
                  <li>This action is logged in audit trail</li>
                  <li>Inventory levels will be recalculated</li>
                </ul>
              </div>
            </div>
          ),
          confirmText: 'Proceed to Edit',
          onConfirm: () => {
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            setOpenModal(false);
            setSelectedInvoice(null);
            setTimeout(() => {
              // Pass mode=edit-confirmed to indicate this is a confirmed invoice edit
              navigate(`/purchase/billing/${invoiceId}?mode=edit-confirmed`);
            }, 150);
          },
        });
      } else {
        toast.warning(
          "Permission Denied",
          "Only Super Admin can edit confirmed invoices. Contact your administrator."
        );
      }
      return;
    }

    // ✅ CASE 3: Cancelled invoices - not editable by anyone
    if (invoiceStatus === "CANCELLED") {
      toast.warning(
        "Cannot Edit",
        "Cancelled invoices cannot be edited."
      );
      return;
    }

    // Default case - unknown status
    toast.warning(
      "Cannot Edit",
      `Invoice ${invoiceNumber} has status "${invoiceStatus}" and cannot be edited.`
    );
  }, [navigate, toast, isSuperAdmin]);

  // ✅ Handle delete - works from both table and modal
  const handleDelete = useCallback((invoice, event) => {
    // Stop propagation if event exists
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    
    const invoiceId = invoice?.invoice_id || invoice?.id;
    const invoiceStatus = invoice?.status?.toUpperCase();
    const invoiceNumber = invoice?.invoice_number;
    
    if (!invoiceId) {
      toast.error("Error", "Invalid invoice data");
      return;
    }
    
    // Cannot delete confirmed invoices
    if (invoiceStatus === "CONFIRMED") {
      toast.warning(
        "Cannot Delete",
        "Confirmed invoices cannot be deleted. Create a purchase return instead."
      );
      return;
    }

    // Close modal first if open
    setOpenModal(false);
    setSelectedInvoice(null);

    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Delete Purchase Invoice',
      message: (
        <div className="space-y-2">
          <p>Are you sure you want to delete this invoice?</p>
          <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
            <p className="font-semibold text-gray-900">Invoice: {invoiceNumber}</p>
            <p className="text-gray-600">Supplier: {invoice.supplier?.name}</p>
            <p className="text-gray-600">Amount: ₹{parseFloat(invoice.net_amount || 0).toLocaleString('en-IN')}</p>
          </div>
          <p className="text-sm text-red-600 font-medium">
            This action cannot be undone.
          </p>
        </div>
      ),
      confirmText: 'Delete Invoice',
      onConfirm: async () => {
        try {
          await purchaseAPI.cancel(invoiceId, "Deleted by user");
          toast.success("Invoice Deleted", `Invoice ${invoiceNumber} has been deleted.`);
          loadInvoices();
        } catch (error) {
          toast.error("Delete Failed", error.response?.data?.message || error.message);
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, [toast, loadInvoices]);

  // Print with full invoice details
  const handlePrint = useCallback(async (invoice) => {
    let invoiceToPrint = invoice;
    if (!invoice.lineItems || invoice.lineItems.length === 0) {
      const fullInvoice = await fetchInvoiceDetails(invoice.invoice_id);
      if (fullInvoice) {
        invoiceToPrint = fullInvoice;
      }
    }
    
    console.log("Printing invoice:", invoiceToPrint);
    window.print();
    toast.info("Print Dialog", "Print dialog opened.");
  }, [toast, fetchInvoiceDetails]);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Close modal handler
  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setSelectedInvoice(null);
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-sans bg-gray-50 p-2 gap-2">
      
      {/* PAGE HEADER */}
      <div className="shrink-0 bg-white rounded-lg border border-gray-200 shadow-sm p-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Purchase Invoices</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              View and manage all purchase invoices
              {isSuperAdmin && (
                <span className="ml-2 text-amber-600 font-medium">
                  • Super Admin Mode
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => navigate('/purchase/billing')}
            className="px-4 py-2 bg-[#000060] text-white text-sm font-medium rounded-lg hover:bg-[#000060]/90 transition-colors shadow-sm"
          >
            + New Purchase
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="shrink-0">
        <InvoiceFilters 
          filters={filters} 
          onChange={handleFilterChange}
          onSearch={loadInvoices}
          onReset={handleResetFilters}
        />
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Loading overlay for detail fetch */}
        {isLoadingDetails && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#000060] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading invoice details...</span>
            </div>
          </div>
        )}
        
        <PurchaseTable
          invoices={invoices}
          onRowClick={handleRowClick}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          isLoading={isLoading}
          isSuperAdmin={isSuperAdmin}
        >
          <InvoicePagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
          />
        </PurchaseTable>
      </div>

      {/* VIEW/EDIT MODAL */}
      <ViewInvoiceModal
        open={openModal}
        mode={modalMode}
        invoice={selectedInvoice}
        onClose={handleCloseModal}
        onPrint={handlePrint}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={loadInvoices}
        isSuperAdmin={isSuperAdmin}
      />

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        type={confirmDialog.type}
      />
    </div>
  );
};

export default PurchaseInvoicePage;