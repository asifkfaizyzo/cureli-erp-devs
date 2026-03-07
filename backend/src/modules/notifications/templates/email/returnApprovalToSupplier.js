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
      <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #05015A;">₹${parseFloat(item.line_total).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return {
    subject: `Return Approved - ${returnInvoiceNumber} | ${shopName} - Cureli`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Purchase Return Approved - Cureli Health</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6fb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #05015A 0%, #0a0280 100%); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
              <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width: 70px; margin-bottom: 12px;"/>
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;"> Purchase Return Approved</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 13px;">
                Action Required • Return #${returnInvoiceNumber}
              </p>
            </div>

            <!-- Main Content -->
            <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 12px; font-size: 15px; color: #333;">
                Dear <strong style="color: #05015A;">${supplierName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #555;">
                This is to inform you that a purchase return has been <strong style="color: #059669;">approved</strong> by <strong>${shopName}</strong>.
                <br><br>
                <strong>Please arrange to collect the returned medicines</strong> from the shop at the earliest.
              </p>

              <!-- Return Summary Card -->
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Return Summary</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 140px;">Return Number</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827; font-family: 'Courier New', monospace; font-size: 13px;">${returnInvoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Original Invoice</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827; font-family: 'Courier New', monospace; font-size: 13px;">${parentInvoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Return Date</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827; font-size: 13px;">${returnDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Return Reason</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626; font-size: 13px;">${returnReasonLabels[returnReason] || returnReason}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Items Returned</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827; font-size: 13px;">${itemCount}</td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 12px 0 0; color: #111827; font-size: 14px; font-weight: 600;">Total Amount</td>
                    <td style="padding: 12px 0 0; text-align: right; font-size: 18px; font-weight: 700; color: #05015A;">₹${parseFloat(totalAmount).toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <!-- Payment Adjustment -->
              <div style="background: ${adjustmentType === "CREDIT_NOTE" ? "#dbeafe" : adjustmentType === "CASH_REFUND" ? "#dcfce7" : "#e0e7ff"}; border-left: 4px solid ${adjustmentType === "CREDIT_NOTE" ? "#3b82f6" : adjustmentType === "CASH_REFUND" ? "#10b981" : "#6366f1"}; border-radius: 0 8px 8px 0; padding: 14px 16px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 6px; font-size: 12px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Payment Adjustment</h4>
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">${adjustmentTypeLabels[adjustmentType]}</p>
                
                ${
                  creditNoteNumber
                    ? `<p style="margin: 8px 0 0; font-size: 13px; color: #4b5563;">Credit Note: <strong style="font-family: 'Courier New', monospace; color: #059669;">${creditNoteNumber}</strong></p>
                       <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">Valid for 1 year from issue date</p>`
                    : ""
                }
                
                ${
                  refundAmount
                    ? `<p style="margin: 8px 0 0; font-size: 13px; color: #4b5563;">Refund Amount: <strong style="color: #059669;">₹${parseFloat(refundAmount).toFixed(2)}</strong></p>`
                    : ""
                }
              </div>

              <!-- Next Steps -->
              <div style="background: #f0f9ff; border-left: 4px solid #05015A; border-radius: 0 8px 8px 0; padding: 14px 16px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px; font-size: 12px; color: #05015A; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                   Next Steps
                </h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #374151; line-height: 1.7;">
                  <li>The returned medicines listed below are ready for pickup</li>
                  <li>Please coordinate with <strong>${shopName}</strong> to collect the items</li>
                  <li>Payment adjustments have been handled as mentioned above</li>
                </ul>
              </div>

              <!-- Items Table -->
              <h3 style="margin: 0 0 16px; font-size: 15px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Returned Items</h3>
              
              <div style="overflow-x: auto; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                      <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase;">#</th>
                      <th style="padding: 10px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase;">Product</th>
                      <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase;">Batch</th>
                      <th style="padding: 10px 8px; text-align: center; font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase;">Qty</th>
                      <th style="padding: 10px 8px; text-align: right; font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase;">Rate</th>
                      <th style="padding: 10px 8px; text-align: right; font-weight: 600; color: #6b7280; font-size: 11px; text-transform: uppercase;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsTable}
                  </tbody>
                </table>
              </div>

              <!-- Contact Info -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 12px 16px;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #92400e; font-weight: 600;"> Need Clarification?</p>
                <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
                  Contact: <strong>${shopName}</strong><br>
                  ${shopContact ? `Phone: <strong>${shopContact}</strong>` : ""}
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="background: #1f2937; color: #9ca3af; padding: 24px; text-align: center; font-size: 12px; border-radius: 0 0 12px 12px;">
              <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width: 40px; opacity: 0.5; margin-bottom: 10px;"/>
              <p style="margin: 0 0 6px; color: #d1d5db;">
                Automated notification from <strong>${shopName}</strong>
              </p>
              <p style="margin: 0;">Powered by <strong>Cureli</strong> Health System</p>
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
Powered by Cureli Health System
    `,
  };
};