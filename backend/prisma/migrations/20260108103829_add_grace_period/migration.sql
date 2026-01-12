-- AlterTable
ALTER TABLE "shop_subscriptions" ADD COLUMN     "grace_period_until" TIMESTAMPTZ(6),
ALTER COLUMN "billing_cycle" SET DEFAULT 'yearly';
