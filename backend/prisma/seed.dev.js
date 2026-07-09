// prisma/seed.dev.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const uuid = () => randomUUID();

/* ════════════════════════════════════════════════════════
   CONFIGURATION — EDIT VALUES HERE
   ════════════════════════════════════════════════════════ */

const CONFIG = {
  superAdmin: {
    name: "Super Cadmin",
    username: "cadmin",
    email: "cadmin@cureli.com",
    phone: "9961045596",
    password: "Qwerty@11",
  },

  pharmacyOwner: {
    first_name: "Asif",
    last_name: "Faizal",
    username: "asif",
    email: "asifkfaiz@gmail.com",
    phone: "9961045596",
    password: "Qwerty@11",
  },

  shop: {
    business_name: "Cureli Pharmacy",
    legal_name: "Cureli Pharmacy Pvt Ltd",
    // Must match what your UI sends to updateShopGst
    // Common values: "PHARMACY", "MEDICAL_STORE", "HOSPITAL" etc.
    business_type: "Partnership",
    gst_number: "32ABCDE1234F1Z5",
    address_line_1: "MG Road",
    address_line_2: "Near Town Hall",
    city: "Kochi",
    state: "Kerala",
    pincode: "682001",
    verification_notes: "All documents verified successfully",
  },

  branches: [
    {
      name: "Main Branch",
      // First branch is always "main" — matches setup.service.js
      type: "main",
      address_line_1: "MG Road",
      address_line_2: "Ground Floor",
      city: "Kochi",
      state: "Kerala",
      pincode: "682001",
      contact_number: "9961045596",
      admin: {
        first_name: "Anil",
        last_name: "Kumar",
        username: "anil.kumar",
        email: "main.admin@pharmacy.com",
        phone: "9961045596",
        password: "Qwerty@11",
      },
      staff: {
        first_name: "Deepa",
        last_name: "S",
        username: "deepa.s",
        email: "main.staff@pharmacy.com",
        phone: "9961045596",
        password: "Qwerty@11",
      },
    },
    {
      name: "Second Branch",
      // Non-first branches use "branch" — matches setup.service.js:
      // branch_type: isFirst ? "main" : "branch"
      type: "branch",
      address_line_1: "Kakkanad Road",
      address_line_2: "First Floor",
      city: "Kochi",
      state: "Kerala",
      pincode: "682030",
      contact_number: "9961045596",
      admin: {
        first_name: "Rahul",
        last_name: "Nair",
        username: "rahul.nair",
        email: "second.admin@pharmacy.com",
        phone: "9961045596",
        password: "Qwerty@11",
      },
      staff: {
        first_name: "Meera",
        last_name: "P",
        username: "meera.p",
        email: "second.staff@pharmacy.com",
        phone: "9961045596",
        password: "Qwerty@11",
      },
    },
  ],

  plan: {
    name: "Free Plan",
    plan_code: "FREE-001",
    description: "Free plan for development and staging use",
    // max_branches and max_users: -1 means unlimited in your subscription logic
    // Use a real number if you want to test limit enforcement
    max_branches: 5,
    max_users: 10,
    price: 0,
    is_featured: false,
  },

  // File types must match the keys your shopFiles.service.js uses
  // From shopFiles.service.js mapping:
  //   drug_license → step 7
  //   pharmacy_registration → step 8
  //   business_registration_proof → step 9
  //   shop_establishment_license → step 10
  //   pan_card → step 11
  //   address_proof → step 12
  // Seeding as "verified" since this is a staging-ready shop
  shopFiles: [
    {
      file_type: "drug_license",
      storage_key: "demo/drug_license.pdf",
      original_name: "drug_license.pdf",
      mime_type: "application/pdf",
      file_size: 98000,
    },
    {
      file_type: "pharmacy_registration",
      storage_key: "demo/pharmacy_registration.pdf",
      original_name: "pharmacy_registration.pdf",
      mime_type: "application/pdf",
      file_size: 110000,
    },
    {
      file_type: "pan_card",
      storage_key: "demo/pan_card.pdf",
      original_name: "pan_card.pdf",
      mime_type: "application/pdf",
      file_size: 75000,
    },
  ],

  // One supplier per branch
  suppliers: [
    {
      name: "MedLife Distributors",
      supplier_code: "SUP-001",
      contact_person: "Suresh Babu",
      office_phone: "9961045596",
      email: "medlife@supplier.com",
      city: "Kochi",
      state: "Kerala",
      pincode: "682001",
      gst_number: "32XYZAB5678C1Z9",
      credit_days: 30,
    },
    {
      name: "PharmaCare Supplies",
      supplier_code: "SUP-002",
      contact_person: "Rajan Pillai",
      office_phone: "9961045596",
      email: "pharmacare@supplier.com",
      city: "Kochi",
      state: "Kerala",
      pincode: "682030",
      gst_number: "32LMNOP9012D1Z3",
      credit_days: 15,
    },
  ],

  // One customer per branch
  customers: [
    {
      name: "Priya Nair",
      phone: "9000000010",
      email: "priya.nair@example.com",
      city: "Kochi",
      state: "Kerala",
      pincode: "682001",
    },
    {
      name: "Thomas John",
      phone: "9000000011",
      email: "thomas.john@example.com",
      city: "Kochi",
      state: "Kerala",
      pincode: "682030",
    },
  ],
};

/* ════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════ */

const now = new Date();
const oneYearLater = new Date(new Date().setFullYear(now.getFullYear() + 1));

/* ════════════════════════════════════════════════════════
   CLEANUP — Full wipe in safe FK order
   ════════════════════════════════════════════════════════ */

async function cleanup() {
  console.log("🧹 Clearing existing data...");

  // Logs first
  await prisma.cAdminActivityLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.planActivityLog.deleteMany();
  await prisma.fileVerificationLog.deleteMany();
  await prisma.deletionLog.deleteMany();

  // Notifications
  await prisma.notification.deleteMany();

  // Tickets
  await prisma.ticketActivity.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticket.deleteMany();

  // Sales
  await prisma.customerCreditApplication.deleteMany();
  await prisma.customerCredit.deleteMany();
  await prisma.customerLedger.deleteMany();
  await prisma.salesInvoiceItem.deleteMany();
  await prisma.salesPayment.deleteMany();
  await prisma.salesInvoice.deleteMany();

  // Purchase
  await prisma.creditApplication.deleteMany();
  await prisma.supplierCredit.deleteMany();
  await prisma.purchaseInvoiceItem.deleteMany();
  await prisma.purchasePayment.deleteMany();
  await prisma.purchaseInvoice.deleteMany();

  // Stock
  await prisma.stockAdjustment.deleteMany();
  await prisma.stockLedger.deleteMany();

  // Inventory
  await prisma.inventory.deleteMany();
  await prisma.inventoryImportJob.deleteMany();

  // Medicines
  await prisma.medicine.deleteMany();

  // Customers & Suppliers
  await prisma.customer.deleteMany();
  await prisma.supplierBranch.deleteMany();
  await prisma.supplier.deleteMany();

  // Marketplace
  await prisma.marketplaceOrderStatusHistory.deleteMany();
  await prisma.marketplaceOrderPrescription.deleteMany();
  await prisma.marketplaceOrderItem.deleteMany();
  await prisma.marketplaceOrder.deleteMany();
  await prisma.branchCategoryVisibility.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.branchMarketplaceSettings.deleteMany();
  await prisma.marketplaceProfile.deleteMany();

  // Shop files
  await prisma.shopFile.deleteMany();

  // Payments
  await prisma.paymentTransaction.deleteMany();

  // Unlink current_subscription_id before deleting subscriptions
  await prisma.shop.updateMany({ data: { current_subscription_id: null } });
  await prisma.shopSubscription.deleteMany();

  // Broadcast
  await prisma.broadcastAttachment.deleteMany();
  await prisma.broadcastCampaign.deleteMany();
  await prisma.broadcastSegment.deleteMany();
  await prisma.broadcastTemplate.deleteMany();
  await prisma.emailBroadcastAttachment.deleteMany();
  await prisma.emailBroadcastRecipient.deleteMany();
  await prisma.emailBroadcastCampaign.deleteMany();
  await prisma.cureliMobileBroadcastCampaign.deleteMany();

  // Sessions first (FK to users)
  await prisma.userSession.deleteMany();
  await prisma.pendingUser.deleteMany();

  // ── CRITICAL ORDER ──────────────────────────────────────────
  // Shop.owner_user_id → users (RESTRICT)
  // Branch.shop_id     → shops (CASCADE implied but still needs shop first)
  // User.shop_id       → shops (optional FK)
  // User.branch_id     → branches (optional FK)
  //
  // Safe order:
  //   branches → shops → users
  // Because:
  //   - branches reference shops (delete branches before shops)
  //   - shops reference users via owner_user_id RESTRICT
  //     (delete shops before users)
  //   - users reference shops/branches optionally
  //     (delete after shops and branches are gone)
  // ────────────────────────────────────────────────────────────
  await prisma.branch.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  // Plans (no FKs remaining after subscriptions deleted)
  await prisma.plan.deleteMany();

  // CAdmin
  await prisma.cAdminRoleAssignment.deleteMany();
  await prisma.cAdminCustomRole.deleteMany();
  await prisma.cAdmin.deleteMany();

  // Misc
  await prisma.enquiryReply.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.otpDailyLimit.deleteMany();
  await prisma.cronLock.deleteMany();
  await prisma.dailySendQuota.deleteMany();
  await prisma.emailUnsubscribe.deleteMany();

  console.log("✅ Cleared\n");
}

/* ════════════════════════════════════════════════════════
   MAIN SEED
   ════════════════════════════════════════════════════════ */

async function main() {
  console.log("🌱 Starting production-stage seed...\n");

  await cleanup();

  /* ─────────────────────────────────────────
     1. SUPER CADMIN
  ───────────────────────────────────────── */
  console.log("👑 Creating Super CAdmin...");

  const superAdmin = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: CONFIG.superAdmin.name,
      username: CONFIG.superAdmin.username,
      email: CONFIG.superAdmin.email,
      phone_number: CONFIG.superAdmin.phone,
      password_hash: await bcrypt.hash(CONFIG.superAdmin.password, 10),
      is_super_cadmin: true,
      is_active: true,
    },
  });

  await prisma.cAdminActivityLog.create({
    data: {
      id: uuid(),
      cadmin_id: superAdmin.cadmin_id,
      performed_by_id: superAdmin.cadmin_id,
      action: "CREATED",
      description: "Super CAdmin account created via seed",
    },
  });

  console.log(`   ✅ ${superAdmin.username}\n`);

  /* ─────────────────────────────────────────
     2. PLAN
  ───────────────────────────────────────── */
  console.log("📋 Creating Plan...");

  const plan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      plan_code: CONFIG.plan.plan_code,
      name: CONFIG.plan.name,
      description: CONFIG.plan.description,
      max_branches: CONFIG.plan.max_branches,
      max_users: CONFIG.plan.max_users,
      price: BigInt(CONFIG.plan.price),
      status: "ACTIVE",
      type: "PRE_MADE",
      billing_cycle_months: 12,
      bonus_months: 0,
      is_featured: CONFIG.plan.is_featured,
      activated_at: now,
      created_by: superAdmin.cadmin_id,
    },
  });

  await prisma.planActivityLog.create({
    data: {
      id: uuid(),
      plan_id: plan.plan_id,
      cadmin_id: superAdmin.cadmin_id,
      action: "CREATED",
      to_status: "ACTIVE",
      meta: { seeded: true },
    },
  });

  console.log(`   ✅ ${plan.name} (${plan.plan_code})\n`);

  /* ─────────────────────────────────────────
     3. PHARMACY OWNER
     role: "super_admin"   — from auth.service.js createOwnerAccount
     status: "active"      — set by setup.service.js completeSetup after setup done
     onboarding_step: 12   — setup.service.js sets this on completeSetup
  ───────────────────────────────────────── */
  console.log("👤 Creating Pharmacy Owner...");

  const owner = await prisma.user.create({
    data: {
      user_id: uuid(),
      first_name: CONFIG.pharmacyOwner.first_name,
      last_name: CONFIG.pharmacyOwner.last_name,
      full_name: `${CONFIG.pharmacyOwner.first_name} ${CONFIG.pharmacyOwner.last_name}`,
      username: CONFIG.pharmacyOwner.username,
      email: CONFIG.pharmacyOwner.email,
      phone_number: CONFIG.pharmacyOwner.phone,
      password_hash: await bcrypt.hash(CONFIG.pharmacyOwner.password, 10),
      login_provider: "password",
      // From auth.service.js createOwnerAccount:
      role: "super_admin",
      // "pending_setup" is initial state, but setup is complete in seed
      // so we mirror what setup.service.js sets after completeSetup
      status: "active",
      is_active: true,
      // 12 = fully completed onboarding — from setup.service.js completeSetup
      onboarding_step: 12,
      first_login_after_verification: false,
      first_verified_at: now,
    },
  });

  console.log(`   ✅ ${owner.full_name} (${owner.email})\n`);

  /* ─────────────────────────────────────────
     4. SHOP
     verification_status: "verified" — cadmin approved
  ───────────────────────────────────────── */
  console.log("🏪 Creating Shop...");

  const shop = await prisma.shop.create({
    data: {
      shop_id: uuid(),
      owner_user_id: owner.user_id,
      business_name: CONFIG.shop.business_name,
      legal_name: CONFIG.shop.legal_name,
      business_type: CONFIG.shop.business_type,
      gst_number: CONFIG.shop.gst_number,
      address_line_1: CONFIG.shop.address_line_1,
      address_line_2: CONFIG.shop.address_line_2,
      city: CONFIG.shop.city,
      state: CONFIG.shop.state,
      pincode: CONFIG.shop.pincode,
      verification_status: "verified",
      verification_notes: CONFIG.shop.verification_notes,
      is_active: true,
    },
  });

  // Owner needs shop_id — set after shop is created
  // (mirrors the real flow: owner exists first, shop created next, then owner linked)
  await prisma.user.update({
    where: { user_id: owner.user_id },
    data: { shop_id: shop.shop_id },
  });

  console.log(`   ✅ ${shop.business_name}\n`);

  /* ─────────────────────────────────────────
     5. SHOP FILES
     file_type values from shopFiles.service.js mapping keys
     status: "verified" — cadmin already verified these for staging
  ───────────────────────────────────────── */
  console.log("📄 Creating Shop Files...");

  for (const fileConfig of CONFIG.shopFiles) {
    await prisma.shopFile.create({
      data: {
        file_id: uuid(),
        shop_id: shop.shop_id,
        file_type: fileConfig.file_type,
        storage_key: fileConfig.storage_key,
        original_name: fileConfig.original_name,
        mime_type: fileConfig.mime_type,
        file_size: fileConfig.file_size,
        // "verified" = cadmin has approved this document
        status: "verified",
        uploaded_by: owner.user_id,
        uploaded_at: now,
        verified_at: now,
        resubmission_count: 0,
      },
    });
    console.log(`   ✅ ${fileConfig.file_type}`);
  }

  console.log();

  /* ─────────────────────────────────────────
     6. SUBSCRIPTION
     status: "ACTIVE"       — from SubscriptionStatus enum
     payment_status: "PAID" — from PaymentStatus enum
  ───────────────────────────────────────── */
  console.log("💳 Creating Subscription...");

  const subscription = await prisma.shopSubscription.create({
    data: {
      subscription_id: uuid(),
      shop_id: shop.shop_id,
      plan_id: plan.plan_id,
      billing_cycle: "yearly",
      start_date: now,
      end_date: oneYearLater,
      renewal_date: oneYearLater,
      branch_limit_snapshot: CONFIG.plan.max_branches,
      user_limit_snapshot: CONFIG.plan.max_users,
      // From subscription.js SubscriptionStatus enum
      status: "ACTIVE",
      // From subscription.js PaymentStatus enum
      payment_status: "PAID",
      is_active: true,
    },
  });

  // Link subscription to shop
  await prisma.shop.update({
    where: { shop_id: shop.shop_id },
    data: { current_subscription_id: subscription.subscription_id },
  });

  console.log(
    `   ✅ Subscription active until ${oneYearLater.toDateString()}\n`,
  );

  /* ─────────────────────────────────────────
     7. MARKETPLACE PROFILE
     NOT_STARTED = shop hasn't begun marketplace onboarding
  ───────────────────────────────────────── */
  console.log("🛒 Creating Marketplace Profile...");

  const marketplaceProfile = await prisma.marketplaceProfile.create({
    data: {
      marketplace_profile_id: uuid(),
      shop_id: shop.shop_id,
      marketplace_status: "NOT_STARTED",
      onboarding_completed: false,
      is_live: false,
    },
  });

  console.log(`   ✅ Marketplace profile created (NOT_STARTED)\n`);

  /* ─────────────────────────────────────────
     8. BRANCHES + USERS + SUPPLIERS + CUSTOMERS
  ───────────────────────────────────────── */
  console.log("🏬 Creating Branches...\n");

  for (let i = 0; i < CONFIG.branches.length; i++) {
    const branchConfig = CONFIG.branches[i];
    const supplierConfig = CONFIG.suppliers[i];
    const customerConfig = CONFIG.customers[i];

    /* ── Branch ── */
    const branch = await prisma.branch.create({
      data: {
        branch_id: uuid(),
        shop_id: shop.shop_id,
        branch_name: branchConfig.name,
        // First branch = "main", rest = "branch"
        // Matches setup.service.js: isFirst ? "main" : "branch"
        branch_type: branchConfig.type,
        address_line_1: branchConfig.address_line_1,
        address_line_2: branchConfig.address_line_2,
        city: branchConfig.city,
        state: branchConfig.state,
        pincode: branchConfig.pincode,
        contact_number: branchConfig.contact_number,
        is_active: true,
      },
    });

    console.log(`   📍 Branch: ${branch.branch_name} (${branch.branch_type})`);

    /* ── Branch Marketplace Settings ── */
    await prisma.branchMarketplaceSettings.create({
      data: {
        branch_marketplace_id: uuid(),
        branch_id: branch.branch_id,
        marketplace_profile_id: marketplaceProfile.marketplace_profile_id,
        marketplace_enabled: false,
        pickup_enabled: false,
        delivery_enabled: false,
      },
    });

    /* ── Branch Admin ──
       role: "branch_admin"  — from users.service.js createUser / getUsers filter
       status: "verified"    — from users.service.js createUser
       onboarding_step: 12   — from setup.service.js completeSetup
    */
    const admin = await prisma.user.create({
      data: {
        user_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        first_name: branchConfig.admin.first_name,
        last_name: branchConfig.admin.last_name,
        full_name: `${branchConfig.admin.first_name} ${branchConfig.admin.last_name}`,
        username: branchConfig.admin.username,
        email: branchConfig.admin.email,
        phone_number: branchConfig.admin.phone,
        password_hash: await bcrypt.hash(branchConfig.admin.password, 10),
        login_provider: "password",
        // From users.service.js: role: { in: ["branch_admin", "staff"] }
        role: "branch_admin",
        // From users.service.js createUser: status: "verified"
        status: "verified",
        is_active: true,
        onboarding_step: 12,
        first_login_after_verification: false,
        first_verified_at: now,
      },
    });

    console.log(`   ✅ Admin: ${admin.full_name} (${admin.role})`);

    /* ── Staff ──
       role: "staff"      — from users.service.js getUsers filter
       status: "verified" — from users.service.js createUser
    */
    const staff = await prisma.user.create({
      data: {
        user_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        first_name: branchConfig.staff.first_name,
        last_name: branchConfig.staff.last_name,
        full_name: `${branchConfig.staff.first_name} ${branchConfig.staff.last_name}`,
        username: branchConfig.staff.username,
        email: branchConfig.staff.email,
        phone_number: branchConfig.staff.phone,
        password_hash: await bcrypt.hash(branchConfig.staff.password, 10),
        login_provider: "password",
        // From users.service.js: role: { in: ["branch_admin", "staff"] }
        role: "staff",
        // From users.service.js createUser: status: "verified"
        status: "verified",
        is_active: true,
        onboarding_step: 12,
        first_login_after_verification: false,
        first_verified_at: now,
      },
    });

    console.log(`   ✅ Staff: ${staff.full_name} (${staff.role})`);

    /* ── Supplier ──
       created_by: admin.user_id — branch admin creates suppliers in their branch
    */
    const supplier = await prisma.supplier.create({
      data: {
        supplier_id: uuid(),
        shop_id: shop.shop_id,
        name: supplierConfig.name,
        supplier_code: supplierConfig.supplier_code,
        contact_person: supplierConfig.contact_person,
        office_phone: supplierConfig.office_phone,
        email: supplierConfig.email,
        city: supplierConfig.city,
        state: supplierConfig.state,
        pincode: supplierConfig.pincode,
        gst_number: supplierConfig.gst_number,
        credit_days: supplierConfig.credit_days,
        is_active: true,
        created_by: admin.user_id,
      },
    });

    // SupplierBranch link — from supplier.service.js createSupplier
    await prisma.supplierBranch.create({
      data: {
        id: uuid(),
        supplier_id: supplier.supplier_id,
        branch_id: branch.branch_id,
        is_active: true,
        created_by: admin.user_id,
      },
    });

    console.log(`   ✅ Supplier: ${supplier.name}`);

    /* ── Customer ──
       created_by: staff.user_id — staff creates customers
       phone unique per shop — from customer.service.js createCustomer
    */
    await prisma.customer.create({
      data: {
        customer_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        name: customerConfig.name,
        phone: customerConfig.phone,
        email: customerConfig.email,
        city: customerConfig.city,
        state: customerConfig.state,
        pincode: customerConfig.pincode,
        credit_limit: 0,
        outstanding_balance: 0,
        discount_percent: 0,
        is_active: true,
        created_by: staff.user_id,
      },
    });

    console.log(`   ✅ Customer: ${customerConfig.name}\n`);

    /* ── Welcome Notification for branch admin ── */
    await prisma.notification.create({
      data: {
        notification_id: uuid(),
        user_id: admin.user_id,
        event_type: "WELCOME",
        title: "Welcome to Cureli ERP",
        message: `Welcome ${admin.full_name}! Your ${branch.branch_name} account is ready.`,
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        priority: "normal",
        is_read: false,
      },
    });
  }

  /* ── Welcome Notification for owner ── */
  await prisma.notification.create({
    data: {
      notification_id: uuid(),
      user_id: owner.user_id,
      event_type: "WELCOME",
      title: "Welcome to Cureli ERP",
      message: `Welcome ${owner.full_name}! Your pharmacy is verified and ready.`,
      shop_id: shop.shop_id,
      priority: "normal",
      is_read: false,
    },
  });

  /* ─────────────────────────────────────────
     SUMMARY
  ───────────────────────────────────────── */
  console.log("═".repeat(60));
  console.log("🎉 SEED COMPLETED");
  console.log("═".repeat(60));
  console.log("\n🔐 LOGIN CREDENTIALS:\n");
  console.log(
    `   CAdmin  │ ${CONFIG.superAdmin.username.padEnd(20)} │ ${CONFIG.superAdmin.password}`,
  );
  console.log(
    `   Owner   │ ${CONFIG.pharmacyOwner.email.padEnd(20)} │ ${CONFIG.pharmacyOwner.password}`,
  );
  for (const b of CONFIG.branches) {
    console.log(
      `   Admin   │ ${b.admin.email.padEnd(20)} │ ${b.admin.password}`,
    );
    console.log(
      `   Staff   │ ${b.staff.email.padEnd(20)} │ ${b.staff.password}`,
    );
  }

  console.log("\n📦 SEEDED:");
  console.log(`   1  Super CAdmin`);
  console.log(`   1  Owner (role: super_admin)`);
  console.log(`   1  Shop (verified)`);
  console.log(`   ${CONFIG.shopFiles.length}  Shop Files (verified)`);
  console.log(`   1  Plan + Subscription (ACTIVE / PAID)`);
  console.log(`   1  Marketplace Profile (NOT_STARTED)`);
  console.log(`   ${CONFIG.branches.length}  Branches`);
  console.log(
    `   ${CONFIG.branches.length * 2}  Branch Users (${CONFIG.branches.length} branch_admin + ${CONFIG.branches.length} staff)`,
  );
  console.log(
    `   ${CONFIG.suppliers.length}  Suppliers + SupplierBranch links`,
  );
  console.log(`   ${CONFIG.customers.length}  Customers`);
  console.log(`   ${CONFIG.branches.length + 1}  Welcome Notifications`);
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
