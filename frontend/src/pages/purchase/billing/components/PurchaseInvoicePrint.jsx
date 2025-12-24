// src/components/purchase/PurchaseInvoicePrint.jsx
// No need for forwardRef with new API - ref is on parent wrapper

const PurchaseInvoicePrint = ({ 
  rows, 
  supplier, 
  summary,
  companyDetails = {
    name: "YOUR COMPANY NAME",
    address: "123, Main Street, City - 560001",
    phone: "+91 98765 43210",
    email: "info@company.com",
    gstin: "29ABCDE1234F1Z5",
    drugLicense: "KA-BNG-123456",
  }
}) => {
  
  // Filter only rows with data
  const dataRows = rows.filter(row => row.name && row.name.trim() !== "");
  
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString('en-IN');
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  // Number to words converter for Indian currency
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    };

    if (num === 0) return 'Zero Rupees Only';
    
    const intPart = Math.floor(num);
    const crore = Math.floor(intPart / 10000000);
    const lakh = Math.floor((intPart % 10000000) / 100000);
    const thousand = Math.floor((intPart % 100000) / 1000);
    const hundred = Math.floor(intPart % 1000);
    const paise = Math.round((num % 1) * 100);

    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (hundred > 0) result += convertLessThanThousand(hundred);

    result = result.trim() + ' Rupees';
    if (paise > 0) result += ' and ' + convertLessThanThousand(paise) + ' Paise';
    result += ' Only';

    return result;
  };

  return (
    <div className="print-container">
      {/* A4 Page */}
      <div className="a4-page">
        
        {/* Header Section */}
        <header className="invoice-header">
          <div className="company-info">
            <h1 className="company-name">{companyDetails.name}</h1>
            <p className="company-address">{companyDetails.address}</p>
            <p className="company-contact">
              Phone: {companyDetails.phone} | Email: {companyDetails.email}
            </p>
            <div className="company-licenses">
              <span>GSTIN: {companyDetails.gstin}</span>
              <span>D.L. No: {companyDetails.drugLicense}</span>
            </div>
          </div>
          <div className="invoice-title">
            <h2>PURCHASE INVOICE</h2>
          </div>
        </header>

        {/* Invoice Details & Supplier Info */}
        <section className="invoice-details-section">
          <div className="details-grid">
            {/* Left: Supplier Details */}
            <div className="supplier-details">
              <h3>Supplier Details</h3>
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="label">Supplier GSTIN:</td>
                    <td className="value">{supplier.supplierGST || '-'}</td>
                  </tr>
                  <tr>
                    <td className="label">Address:</td>
                    <td className="value">{supplier.address || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: Invoice Details */}
            <div className="invoice-info">
              <h3>Invoice Details</h3>
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="label">Purchase ID:</td>
                    <td className="value">{supplier.purchaseId || '-'}</td>
                  </tr>
                  <tr>
                    <td className="label">Invoice No:</td>
                    <td className="value">{supplier.invoiceNo || '-'}</td>
                  </tr>
                  <tr>
                    <td className="label">Date:</td>
                    <td className="value">{formatDate(supplier.receivedOn)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Items Table */}
        <section className="items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th className="col-sno">#</th>
                <th className="col-desc">Description of Goods</th>
                <th className="col-hsn">HSN</th>
                <th className="col-batch">Batch</th>
                <th className="col-exp">Exp</th>
                <th className="col-qty">Qty</th>
                <th className="col-mrp">MRP</th>
                <th className="col-rate">Rate</th>
                <th className="col-disc">Disc%</th>
                <th className="col-taxable">Taxable</th>
                <th className="col-gst">GST%</th>
                <th className="col-gstamt">GST Amt</th>
                <th className="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {dataRows.length > 0 ? (
                dataRows.map((row, index) => (
                  <tr key={index}>
                    <td className="col-sno">{index + 1}</td>
                    <td className="col-desc">
                      <div className="product-name">{row.name}</div>
                      <div className="product-pack">Pack: {row.pack || '-'}</div>
                    </td>
                    <td className="col-hsn">{row.hsn || '-'}</td>
                    <td className="col-batch">{row.batch || '-'}</td>
                    <td className="col-exp">{row.exp || '-'}</td>
                    <td className="col-qty">{row.qty || 0}</td>
                    <td className="col-mrp">{Number(row.mrp || 0).toFixed(2)}</td>
                    <td className="col-rate">{Number(row.price || 0).toFixed(2)}</td>
                    <td className="col-disc">{Number(row.discountPercent || 0).toFixed(2)}</td>
                    <td className="col-taxable">{Number(row.taxableValue || 0).toFixed(2)}</td>
                    <td className="col-gst">
                      {(Number(row.cgstPercent || 0) + Number(row.sgstPercent || 0)).toFixed(0)}%
                    </td>
                    <td className="col-gstamt">
                      {(Number(row.cgstAmount || 0) + Number(row.sgstAmount || 0)).toFixed(2)}
                    </td>
                    <td className="col-amount">{Number(row.amount || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    No items to display
                  </td>
                </tr>
              )}
              
              {/* Empty rows to maintain minimum table height */}
              {dataRows.length > 0 && dataRows.length < 5 && [...Array(5 - dataRows.length)].map((_, i) => (
                <tr key={`empty-${i}`} className="empty-row">
                  <td>&nbsp;</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Summary Section */}
        <section className="summary-section">
          <div className="summary-grid">
            {/* Left: Amount in Words */}
            <div className="amount-words">
              <h4>Amount in Words:</h4>
              <p>{numberToWords(summary.total)}</p>
            </div>

            {/* Right: Totals */}
            <div className="totals-box">
              <table className="totals-table">
                <tbody>
                  <tr>
                    <td className="label">Taxable Amount:</td>
                    <td className="value">₹ {summary.subTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="label">CGST:</td>
                    <td className="value">₹ {summary.cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="label">SGST:</td>
                    <td className="value">₹ {summary.sgst.toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td className="label">Grand Total:</td>
                    <td className="value">₹ {summary.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* GST Summary Table */}
        <section className="gst-summary-section">
          <h4>GST Summary</h4>
          <table className="gst-summary-table">
            <thead>
              <tr>
                <th>GST Rate</th>
                <th>Taxable Amount</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const gstGroups = {};
                dataRows.forEach(row => {
                  const rate = (Number(row.cgstPercent || 0) + Number(row.sgstPercent || 0));
                  if (!gstGroups[rate]) {
                    gstGroups[rate] = { taxable: 0, cgst: 0, sgst: 0 };
                  }
                  gstGroups[rate].taxable += Number(row.taxableValue || 0);
                  gstGroups[rate].cgst += Number(row.cgstAmount || 0);
                  gstGroups[rate].sgst += Number(row.sgstAmount || 0);
                });

                const entries = Object.entries(gstGroups);
                if (entries.length === 0) {
                  return (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>-</td>
                    </tr>
                  );
                }

                return entries.map(([rate, values]) => (
                  <tr key={rate}>
                    <td>{rate}%</td>
                    <td>₹ {values.taxable.toFixed(2)}</td>
                    <td>₹ {values.cgst.toFixed(2)}</td>
                    <td>₹ {values.sgst.toFixed(2)}</td>
                    <td>₹ {(values.cgst + values.sgst).toFixed(2)}</td>
                  </tr>
                ));
              })()}
              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td><strong>₹ {summary.subTotal.toFixed(2)}</strong></td>
                <td><strong>₹ {summary.cgst.toFixed(2)}</strong></td>
                <td><strong>₹ {summary.sgst.toFixed(2)}</strong></td>
                <td><strong>₹ {(summary.cgst + summary.sgst).toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Payment Details */}
        <section className="payment-section">
          <div className="payment-grid">
            <div className="payment-info">
              <h4>Payment Details</h4>
              <table className="payment-table">
                <tbody>
                  <tr>
                    <td>Amount Paid:</td>
                    <td>₹ {Number(supplier.amountPaid || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Balance:</td>
                    <td>₹ {Number(supplier.balance || summary.total).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bank-details">
              <h4>Bank Details</h4>
              <p>Bank: State Bank of India</p>
              <p>A/C No: XXXXXXXXXXXX</p>
              <p>IFSC: SBIN0001234</p>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="invoice-footer">
          <div className="footer-grid">
            <div className="terms">
              <h4>Terms & Conditions:</h4>
              <ol>
                <li>Goods once sold will not be taken back.</li>
                <li>Interest @ 18% p.a. will be charged on delayed payments.</li>
                <li>Subject to local jurisdiction only.</li>
              </ol>
            </div>
            <div className="signature-box">
              <div className="signature-line"></div>
              <p>Authorized Signatory</p>
              <p className="company-stamp">{companyDetails.name}</p>
            </div>
          </div>
        </footer>

        {/* Page Number */}
        <div className="page-number">Page 1 of 1</div>

      </div>
    </div>
  );
};

export default PurchaseInvoicePrint;