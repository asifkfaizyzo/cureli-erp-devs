// prisma/seed.prod.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const uuid = () => randomUUID();

async function main() {
  console.log("🌱 Starting PRODUCTION CAdmin bootstrap...\n");

  // ============================================
  // VALIDATE ENVIRONMENT VARIABLES
  // ============================================
  if (!process.env.CADMIN_DEFAULT_PASSWORD) {
    throw new Error("❌ CADMIN_DEFAULT_PASSWORD must be set in production");
  }

  if (!process.env.CADMIN_DEFAULT_USERNAME) {
    throw new Error("❌ CADMIN_DEFAULT_USERNAME must be set in production");
  }

  if (!process.env.CADMIN_DEFAULT_EMAIL) {
    throw new Error("❌ CADMIN_DEFAULT_EMAIL must be set in production");
  }

  if (!process.env.CADMIN_DEFAULT_PHONE) {
    throw new Error("❌ CADMIN_DEFAULT_PHONE must be set in production");
  }

  // ============================================
  // CHECK IF SUPER_CADMIN EXISTS
  // ============================================
  console.log("🔍 Checking for existing Super Admin...");

  const existing = await prisma.cAdmin.findFirst({
    where: { role: "SUPER_CADMIN" },
  });

  if (existing) {
    console.log("✅ Super Admin already exists. Skipping bootstrap.");
    console.log(`   Username: ${existing.username}`);
    console.log(`   Email: ${existing.email}`);
    console.log("\n⚠️  No changes made to database.");
    return;
  }

  // ============================================
  // CREATE SUPER_CADMIN
  // ============================================
  console.log("👨‍💼 Creating Super Admin...\n");

  const superCadmin = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: process.env.CADMIN_DEFAULT_NAME || "Super Admin",
      username: process.env.CADMIN_DEFAULT_USERNAME,
      role: "SUPER_CADMIN",
      email: process.env.CADMIN_DEFAULT_EMAIL,
      phone_number: process.env.CADMIN_DEFAULT_PHONE,
      password_hash: await bcrypt.hash(process.env.CADMIN_DEFAULT_PASSWORD, 10),
      is_active: true,
    },
  });

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "═".repeat(55));
  console.log("🎉 PRODUCTION BOOTSTRAP COMPLETED!");
  console.log("═".repeat(55));
  console.log("\n🔐 SUPER ADMIN CREATED:\n");
  console.log(`   Username: ${superCadmin.username}`);
  console.log(`   Email: ${superCadmin.email}`);
  console.log(`   Phone: ${superCadmin.phone_number}`);
  console.log("\n⚠️  Keep credentials secure!");
  console.log("═".repeat(55));
}

main()
  .catch((e) => {
    console.error("❌ Bootstrap failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });