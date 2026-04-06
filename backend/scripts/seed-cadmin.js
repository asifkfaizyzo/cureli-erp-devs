import prisma from "../src/config/prisma.js";
import { hashPassword } from "../src/utils/hash.js";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
  try {
    const username = process.env.CADMIN_DEFAULT_USERNAME;
    const password = process.env.CADMIN_DEFAULT_PASSWORD;
    const email = process.env.CADMIN_DEFAULT_EMAIL;
    const phone = process.env.CADMIN_DEFAULT_PHONE;
    const name = process.env.CADMIN_DEFAULT_NAME || "Super Admin"; // ✅ Add this

    const hash = await hashPassword(password);

    const existing = await prisma.cAdmin.findUnique({ where: { username } });
    if (existing) {
      console.log("CAdmin already exists:", username);
      process.exit(0);
    }

    const created = await prisma.cAdmin.create({
      data: {
        username,
        email,
        phone_number: phone,
        password_hash: hash,
        is_active: true,
        name, // ✅ Add this
      },
    });

    console.log("CAdmin created:", created.username);
    console.log("Default credentials (change immediately):", { username, password });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();