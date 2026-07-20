-- AlterTable
ALTER TABLE "checkout_sessions" ADD COLUMN     "prescription_recipient_id" UUID,
ADD COLUMN     "prescription_request_id" UUID;
