/*
  Warnings:

  - A unique constraint covering the columns `[plan_name]` on the table `plans` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "plans_plan_name_key" ON "plans"("plan_name");
