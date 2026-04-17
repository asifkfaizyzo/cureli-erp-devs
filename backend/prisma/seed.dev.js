// prisma/seed.dev.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const uuid   = () => randomUUID();

async function main() {
  console.log("🌱 Starting DEVELOPMENT CAdmin seed...\n");

  // ─────────────────────────────────────────────────────────────────────────
  // CLEAR EXISTING CADMIN DATA
  // Order matters — delete assignments before roles before admins
  // ─────────────────────────────────────────────────────────────────────────
  console.log("🧹 Clearing existing CAdmin data...");

  await prisma.cAdminRoleAssignment.deleteMany();
  await prisma.cAdminCustomRole.deleteMany();
  await prisma.cAdminActivityLog.deleteMany();
  await prisma.cAdmin.deleteMany();

  console.log("✅ Cleared existing CAdmin data\n");

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE SUPER CADMIN
  // is_super_cadmin = true → bypasses all permission checks
  // Do NOT assign custom roles to this account
  // ─────────────────────────────────────────────────────────────────────────
  console.log("👑 Creating Super CAdmin...");

  const superPassword = process.env.CADMIN_DEFAULT_PASSWORD || "Qwerty@11";

  const superCadmin = await prisma.cAdmin.create({
    data: {
      cadmin_id:       uuid(),
      name:            process.env.CADMIN_DEFAULT_NAME  || "Super Admin",
      username:        process.env.CADMIN_DEFAULT_USERNAME || "cadmin",
      email:           process.env.CADMIN_DEFAULT_EMAIL || "admin@cureli.com",
      phone_number:    process.env.CADMIN_DEFAULT_PHONE || "9961045596",
      password_hash:   await bcrypt.hash(superPassword, 10),
      is_active:       true,
      is_super_cadmin: true,
    },
  });

  console.log(`   ✅ Super CAdmin: ${superCadmin.username}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE SAMPLE CUSTOM ROLES
  // These are development-only roles for testing the permission system.
  // In production, the SUPER_CADMIN creates roles via the UI.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("🔐 Creating sample custom roles...");

  const operationsRole = await prisma.cAdminCustomRole.create({
    data: {
      role_id:     uuid(),
      name:        "Operations",
      description: "Handles day-to-day shop, user, and subscription management",
      permissions: [
        "shops.view",
        "shops.view_detail",
        "shops.view_stats",
        "shops.edit",
        "shops.toggle_active",
        "shops.update_subscription",
        "shops.upload_documents",
        "users.view",
        "users.view_detail",
        "users.edit",
        "users.toggle_access",
        "subscriptions.view_at_risk",
        "subscriptions.view_detail",
        "subscriptions.send_reminder",
        "subscriptions.extend_grace",
        "subscriptions.force_suspend",
        "subscriptions.reactivate",
        "tickets.view",
        "tickets.view_detail",
        "tickets.view_stats",
        "tickets.view_history",
        "tickets.update_status",
        "documents.view",
        "documents.view_shop_detail",
        "documents.view_file",
        "documents.verify",
        "documents.reject",
        "documents.batch_update",
        "dashboard.view",
      ],
    },
  });
  console.log(`   ✅ Role: ${operationsRole.name}`);

  const financeRole = await prisma.cAdminCustomRole.create({
    data: {
      role_id:     uuid(),
      name:        "Finance",
      description: "Manages plans, subscriptions, and financial operations",
      permissions: [
        "plans.view",
        "plans.view_detail",
        "plans.view_stats",
        "plans.create",
        "plans.edit",
        "plans.activate",
        "plans.suspend",
        "plans.reactivate",
        "plans.clone",
        "plans.delete",
        "subscriptions.view_at_risk",
        "subscriptions.view_detail",
        "subscriptions.send_reminder",
        "subscriptions.extend_grace",
        "subscriptions.force_suspend",
        "subscriptions.reactivate",
        "shops.view",
        "shops.view_detail",
        "dashboard.view",
        "audit.view",
        "audit.view_detail",
        "audit.view_stats",
        "audit.export",
      ],
    },
  });
  console.log(`   ✅ Role: ${financeRole.name}`);

  const supportRole = await prisma.cAdminCustomRole.create({
    data: {
      role_id:     uuid(),
      name:        "Support",
      description: "Handles tickets, enquiries, and shop verifications",
      permissions: [
        "tickets.view",
        "tickets.view_detail",
        "tickets.view_stats",
        "tickets.view_history",
        "tickets.update_status",
        "documents.view",
        "documents.view_shop_detail",
        "documents.view_file",
        "documents.verify",
        "documents.reject",
        "documents.batch_update",
        "shops.view",
        "shops.view_detail",
        "users.view",
        "users.view_detail",
        "dashboard.view",
      ],
    },
  });
  console.log(`   ✅ Role: ${supportRole.name}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE SAMPLE NON-SUPER CADMINS FOR TESTING
  // These are assigned the custom roles created above
  // ─────────────────────────────────────────────────────────────────────────
  console.log("👨‍💼 Creating sample CAdmins...");

  const opsPassword     = process.env.CADMIN_OPS_PASSWORD     || "Ops@12345";
  const financePassword = process.env.CADMIN_FINANCE_PASSWORD  || "Finance@12345";
  const supportPassword = process.env.CADMIN_SUPPORT_PASSWORD  || "Support@12345";

  // Operations admin
  const opsAdmin = await prisma.cAdmin.create({
    data: {
      cadmin_id:       uuid(),
      name:            "Kiran",
      username:        "kiran",
      email:           "kiran@cureli.com",
      phone_number:    "9876543210",
      password_hash:   await bcrypt.hash(opsPassword, 10),
      is_active:       true,
      is_super_cadmin: false,
    },
  });
  await prisma.cAdminRoleAssignment.create({
    data: {
      cadmin_id:   opsAdmin.cadmin_id,
      role_id:     operationsRole.role_id,
      is_primary:  true,
      assigned_by: superCadmin.cadmin_id,
    },
  });
  console.log(`   ✅ Operations admin: ${opsAdmin.username}`);

  // Finance admin
  const financeAdmin = await prisma.cAdmin.create({
    data: {
      cadmin_id:       uuid(),
      name:            "Sibi",
      username:        "sibi",
      email:           "sibi@cureli.com",
      phone_number:    "9876543211",
      password_hash:   await bcrypt.hash(financePassword, 10),
      is_active:       true,
      is_super_cadmin: false,
    },
  });
  await prisma.cAdminRoleAssignment.create({
    data: {
      cadmin_id:   financeAdmin.cadmin_id,
      role_id:     financeRole.role_id,
      is_primary:  true,
      assigned_by: superCadmin.cadmin_id,
    },
  });
  console.log(`   ✅ Finance admin: ${financeAdmin.username}`);

  // Support admin
  const supportAdmin = await prisma.cAdmin.create({
    data: {
      cadmin_id:       uuid(),
      name:            "Akhil",
      username:        "akhil",
      email:           "akhil@cureli.com",
      phone_number:    "9876543212",
      password_hash:   await bcrypt.hash(supportPassword, 10),
      is_active:       true,
      is_super_cadmin: false,
    },
  });
  await prisma.cAdminRoleAssignment.create({
    data: {
      cadmin_id:   supportAdmin.cadmin_id,
      role_id:     supportRole.role_id,
      is_primary:  true,
      assigned_by: superCadmin.cadmin_id,
    },
  });
  console.log(`   ✅ Support admin: ${supportAdmin.username}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  console.log("═".repeat(60));
  console.log("🎉 DEVELOPMENT SEED COMPLETED!");
  console.log("═".repeat(60));
  console.log("\n🔐 LOGIN CREDENTIALS:\n");
  console.log(`   Super Admin │ cadmin │ ${superPassword}`);
  console.log(`   Operations  │ kiran  │ ${opsPassword}`);
  console.log(`   Finance     │ sibi   │ ${financePassword}`);
  console.log(`   Support     │ akhil  │ ${supportPassword}`);
  console.log("\n📋 ROLES CREATED:");
  console.log(`   Operations (${operationsRole.permissions.length} permissions)`);
  console.log(`   Finance    (${financeRole.permissions.length} permissions)`);
  console.log(`   Support    (${supportRole.permissions.length} permissions)`);
  console.log("\n" + "═".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });