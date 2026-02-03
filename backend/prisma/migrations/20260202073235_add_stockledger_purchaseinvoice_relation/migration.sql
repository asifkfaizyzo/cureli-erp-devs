-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "purchase_invoices"("invoice_id") ON DELETE SET NULL ON UPDATE CASCADE;
