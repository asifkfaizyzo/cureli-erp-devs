// backend/src/modules/notifications/templates/email/returnApprovalToSupplier.js

export const returnApprovalToSupplier = ({
  supplierName,
  returnInvoiceNumber,
  parentInvoiceNumber,
  returnReason,
  returnDate,
  totalAmount,
  itemCount,
  adjustmentType,
  creditNoteNumber,
  refundAmount,
  shopName,
  shopContact,
  items = [],
}) => {
  const adjustmentTypeLabels = {
    CREDIT_NOTE: "Credit Note",
    CASH_REFUND: "Cash Refund",
    OFFSET_NEXT_PURCHASE: "Offset Against Future Purchase",
  };

  const returnReasonLabels = {
    DAMAGED_GOODS: "Damaged Goods",
    EXPIRED_GOODS: "Expired Goods",
    WRONG_ITEM_RECEIVED: "Wrong Item Received",
    QUALITY_ISSUE: "Quality Issue",
    EXCESS_STOCK: "Excess Stock",
    PRICE_DIFFERENCE: "Price Difference",
    OTHER: "Other",
  };

  const itemsTable = items
    .map(
      (item, index) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; text-align: center; color: #6b7280;">${index + 1}</td>
      <td style="padding: 12px 8px;">
        <div style="font-weight: 600; color: #111827;">${item.name}</div>
        ${item.manufacturer ? `<div style="font-size: 12px; color: #9ca3af;">Mfr: ${item.manufacturer}</div>` : ""}
      </td>
      <td style="padding: 12px 8px; text-align: center; font-family: monospace; font-size: 13px;">${item.batch_number}</td>
      <td style="padding: 12px 8px; text-align: center; font-weight: 600; color: #dc2626;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right; color: #374151;">₹${parseFloat(item.purchase_rate).toFixed(2)}</td>
      <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #000060;">₹${parseFloat(item.line_total).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return {
    subject: `Return Approved - ${returnInvoiceNumber} | ${shopName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 650px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #000060 0%, #000080 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Purchase Return Approved</h1>
             <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
  Action Required • Return #${returnInvoiceNumber}
</p>
            </div>

            <!-- Main Content -->
            <div style="background: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Dear <strong>${supplierName}</strong>,</p>
              
              <p style="margin: 0 0 25px; font-size: 15px; line-height: 1.6; color: #4b5563;">
  This is to inform you that a purchase return has been
  <strong style="color: #059669;">approved</strong> by <strong>${shopName}</strong>.
  <br><br>
  <strong>Please arrange to collect the returned medicines</strong> from the shop at the earliest.
</p>

              <!-- Return Summary Card -->
              <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Return Summary</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Return Number:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827; font-family: monospace;">${returnInvoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Original Invoice:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827; font-family: monospace;">${parentInvoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Return Date:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${returnDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Return Reason:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">${returnReasonLabels[returnReason] || returnReason}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Items Returned:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${itemCount}</td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 12px 0 0; color: #111827; font-size: 15px; font-weight: 600;">Total Amount:</td>
                    <td style="padding: 12px 0 0; text-align: right; font-size: 20px; font-weight: 700; color: #000060;">₹${parseFloat(totalAmount).toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <!-- Payment Adjustment -->
              <div style="background: ${adjustmentType === "CREDIT_NOTE" ? "#dbeafe" : adjustmentType === "CASH_REFUND" ? "#dcfce7" : "#e0e7ff"}; border-left: 4px solid ${adjustmentType === "CREDIT_NOTE" ? "#3b82f6" : adjustmentType === "CASH_REFUND" ? "#10b981" : "#6366f1"}; border-radius: 6px; padding: 16px; margin-bottom: 25px;">
                <h4 style="margin: 0 0 8px; font-size: 13px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Payment Adjustment</h4>
                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #111827;">${adjustmentTypeLabels[adjustmentType]}</p>
                
                ${
                  creditNoteNumber
                    ? `<p style="margin: 8px 0 0; font-size: 13px; color: #4b5563;">Credit Note: <strong style="font-family: monospace; color: #059669;">${creditNoteNumber}</strong></p>
                       <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Valid for 1 year from issue date</p>`
                    : ""
                }
                
                ${
                  refundAmount
                    ? `<p style="margin: 8px 0 0; font-size: 13px; color: #4b5563;">Refund Amount: <strong style="color: #059669;">₹${parseFloat(refundAmount).toFixed(2)}</strong></p>`
                    : ""
                }
              </div>

              <div style="background: #ecfeff; border-left: 4px solid #06b6d4; border-radius: 6px; padding: 16px; margin-bottom: 25px;">
  <h4 style="margin: 0 0 8px; font-size: 13px; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px;">
    Next Steps
  </h4>
  <p style="margin: 0; font-size: 14px; color: #134e4a; line-height: 1.6;">
    • The returned medicines listed below are ready for pickup.<br>
    • Please coordinate with <strong>${shopName}</strong> to collect the items.<br>
    • Any payment adjustments have been handled as mentioned above.
  </p>
</div>

              <!-- Items Table -->
              <h3 style="margin: 0 0 15px; font-size: 16px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Returned Items</h3>
              
              <div style="overflow-x: auto; margin-bottom: 25px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <thead>
                    <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                      <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">#</th>
                      <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">Product</th>
                      <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">Batch</th>
                      <th style="padding: 12px 8px; text-align: center; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">Qty</th>
                      <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">Rate</th>
                      <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsTable}
                  </tbody>
                </table>
              </div>

              <!-- Contact Info -->
              <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-top: 25px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #92400e; font-weight: 600;">📞 Need Clarification?</p>
                <p style="margin: 0; font-size: 13px; color: #78350f;">
                  Contact: <strong>${shopName}</strong><br>
                  ${shopContact ? `Phone: <strong>${shopContact}</strong>` : ""}
                </p>
              </div>

              <!-- Footer -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  This is an automated notification from <strong>${shopName}</strong><br>
                  Powered by Cureli ERP System
                </p>
              </div>

            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Dear ${supplierName},

Purchase Return Approved

Return Number: ${returnInvoiceNumber}
Original Invoice: ${parentInvoiceNumber}
Return Date: ${returnDate}
Return Reason: ${returnReasonLabels[returnReason] || returnReason}

Total Amount: ₹${parseFloat(totalAmount).toFixed(2)}

Payment Adjustment: ${adjustmentTypeLabels[adjustmentType]}
${creditNoteNumber ? `Credit Note: ${creditNoteNumber} (Valid for 1 year)` : ""}
${refundAmount ? `Refund Amount: ₹${parseFloat(refundAmount).toFixed(2)}` : ""}

Returned Items:
${items.map((item, i) => `${i + 1}. ${item.name} - Batch: ${item.batch_number} - Qty: ${item.quantity} - ₹${parseFloat(item.line_total).toFixed(2)}`).join("\n")}

For any clarification, please contact ${shopName}.
${shopContact ? `Phone: ${shopContact}` : ""}

---
This is an automated notification from ${shopName}
Powered by Cureli ERP System
    `,
  };
};