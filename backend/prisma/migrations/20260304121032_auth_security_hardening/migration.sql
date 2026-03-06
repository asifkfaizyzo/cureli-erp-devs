-- AlterTable
ALTER TABLE "pending_users" ADD COLUMN     "email_otp_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sms_otp_attempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otp_cycle_failures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otp_locked_until" TIMESTAMP(3);
