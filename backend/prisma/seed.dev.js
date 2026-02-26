// prisma/seed.dev.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const uuid = () => randomUUID();

async function main() {
  console.log("🌱 Starting DEVELOPMENT CAdmin seed...\n");

  // ============================================
  // CLEAR EXISTING CADMIN DATA
  // ============================================
  console.log("🧹 Clearing existing CAdmin data...");

  await prisma.cAdminActivityLog.deleteMany();
  await prisma.cAdmin.deleteMany();

  console.log("✅ Cleared existing CAdmin data\n");

  // ============================================
  // CREATE CADMINS
  // ============================================
  console.log("👨‍💼 Creating CAdmins...\n");

  // Get passwords from env or use defaults (dev only)
  const passwords = {
    superAdmin: process.env.CADMIN_DEFAULT_PASSWORD || "Qwerty@11",
    analyst: process.env.CADMIN_ANALYST_PASSWORD || "Analyst@123",
    accountant: process.env.CADMIN_ACCOUNTANT_PASSWORD || "Accountant@123",
    salesman: process.env.CADMIN_SALESMAN_PASSWORD || "Salesman@123",
  };

  // 1. SUPER_CADMIN
  const superCadmin = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: "Super Admin",
      username: process.env.CADMIN_DEFAULT_USERNAME || "cadmin",
      role: "SUPER_CADMIN",
      email: process.env.CADMIN_DEFAULT_EMAIL || "munnasif11@gmail.com",
      phone_number: process.env.CADMIN_DEFAULT_PHONE || "9961045596",
      password_hash: await bcrypt.hash(passwords.superAdmin, 10),
      is_active: true,
    },
  });
  console.log(`   ✅ SUPER_CADMIN: ${superCadmin.username}`);

  // 2. ANALYST - Kiran
  const analyst = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: "Kiran",
      username: "kiran",
      role: "ANALYST",
      email: "kiran@cureli.com",
      phone_number: "9876543210",
      password_hash: await bcrypt.hash(passwords.analyst, 10),
      is_active: true,
    },
  });
  console.log(`   ✅ ANALYST: ${analyst.username}`);

  // 3. ACCOUNTANT - Sibi
  const accountant = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: "Sibi",
      username: "sibi",
      role: "ACCOUNTANT",
      email: "sibi@cureli.com",
      phone_number: "9876543211",
      password_hash: await bcrypt.hash(passwords.accountant, 10),
      is_active: true,
    },
  });
  console.log(`   ✅ ACCOUNTANT: ${accountant.username}`);

  // 4. SALESMAN - Akhil
  const salesman = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: "Akhil",
      username: "akhil",
      role: "SALESMAN",
      email: "akhil@cureli.com",
      phone_number: "9876543212",
      password_hash: await bcrypt.hash(passwords.salesman, 10),
      is_active: true,
    },
  });
  console.log(`   ✅ SALESMAN: ${salesman.username}`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "═".repeat(55));
  console.log("🎉 DEVELOPMENT SEED COMPLETED!");
  console.log("═".repeat(55));
  console.log("\n🔐 LOGIN CREDENTIALS:\n");
  console.log("   SUPER_CADMIN │ cadmin │ " + passwords.superAdmin);
  console.log("   ANALYST      │ kiran  │ " + passwords.analyst);
  console.log("   ACCOUNTANT   │ sibi   │ " + passwords.accountant);
  console.log("   SALESMAN     │ akhil  │ " + passwords.salesman);
  console.log("\n" + "═".repeat(55));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });