// prisma/seed.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// ============================================
// HELPER FUNCTIONS
// ============================================

const uuid = () => randomUUID();

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// ============================================
// CONSTANTS
// ============================================

const FILE_TYPES = [
  "drug_license",
  "pharmacy_registration",
  "business_registration_proof",
  "shop_establishment_license",
  "pan_card",
  "address_proof",
];

const BUSINESS_TYPES = [
  "Sole Proprietorship",
  "Partnership",
  "Private Limited",
  "LLP",
];

const INDIAN_CITIES = [
  { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
  { city: "Delhi", state: "Delhi", pincode: "110001" },
  { city: "Bangalore", state: "Karnataka", pincode: "560001" },
  { city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
  { city: "Hyderabad", state: "Telangana", pincode: "500001" },
  { city: "Pune", state: "Maharashtra", pincode: "411001" },
  { city: "Kolkata", state: "West Bengal", pincode: "700001" },
  { city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
  { city: "Jaipur", state: "Rajasthan", pincode: "302001" },
  { city: "Lucknow", state: "Uttar Pradesh", pincode: "226001" },
  { city: "Surat", state: "Gujarat", pincode: "395001" },
  { city: "Kochi", state: "Kerala", pincode: "682001" },
  { city: "Indore", state: "Madhya Pradesh", pincode: "452001" },
  { city: "Nagpur", state: "Maharashtra", pincode: "440001" },
  { city: "Chandigarh", state: "Punjab", pincode: "160001" },
];

const FIRST_NAMES = [
  "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rajesh", "Deepika",
  "Suresh", "Kavita", "Arun", "Meera", "Kiran", "Pooja", "Sanjay", "Neha",
  "Manoj", "Ritu", "Ashok", "Swati", "Ravi", "Sunita", "Prakash", "Geeta",
  "Vijay", "Lakshmi", "Mohan", "Savita", "Dinesh", "Anita", "Ramesh", "Kamala",
  "Sunil", "Usha", "Gopal", "Rekha", "Anil", "Shanti", "Mukesh", "Padma",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Kumar", "Singh", "Gupta", "Reddy", "Nair", "Joshi",
  "Mehta", "Verma", "Desai", "Iyer", "Kulkarni", "Pillai", "Rao", "Saxena",
  "Tiwari", "Bose", "Chatterjee", "Menon", "Patil", "Shinde", "Jadhav",
  "More", "Pawar", "Sawant", "Gaikwad", "Bhosale", "Chavan", "Kale",
  "Agarwal", "Bansal",
];

const SHOP_NAMES = [
  "HealthMax Pharmacy", "PharmaCorp Stores", "MediChain Pharma",
  "Apollo Medicals", "LifeCare Pharmacy", "Wellness Chemist",
  "CureWell Drugs", "MediPlus Store", "Remedy Pharmacy",
  "VitalHealth Chemist", "PharmaZone", "QuickMeds",
  "NewStart Pharmacy", "Heritage Medicals", "OldTimer Chemist",
];

const STREET_NAMES = [
  "MG Road", "Station Road", "Main Street", "Market Lane",
  "Commercial Complex", "Link Road", "Highway Junction",
  "Industrial Area", "City Center", "Mall Road", "Gandhi Nagar",
  "Nehru Street", "Park Avenue", "Civil Lines", "Sector 15",
];

// ============================================
// TICKET & ENQUIRY CONSTANTS
// ============================================

const TICKET_CATEGORIES = [
  "TECHNICAL_ISSUE",
  "BILLING_ISSUE",
  "FEATURE_REQUEST",
  "ACCOUNT_ISSUE",
  "OTHER",
];

const TICKET_SUBJECTS = {
  TECHNICAL_ISSUE: [
    "Unable to login to system",
    "App crashes on startup",
    "Inventory sync not working",
    "Receipt printer not responding",
    "Slow system performance",
  ],
  BILLING_ISSUE: [
    "Payment not reflected",
    "Invoice not generated",
    "Wrong amount charged",
    "Refund request",
    "Subscription renewal issue",
  ],
  FEATURE_REQUEST: [
    "Add SMS notification feature",
    "Need bulk upload option",
    "Request for mobile app",
    "Custom report generation",
    "Integration with other software",
  ],
  ACCOUNT_ISSUE: [
    "Cannot add new staff member",
    "Role permissions not working",
    "Profile update failing",
    "Password reset not working",
    "Branch access denied",
  ],
  OTHER: [
    "General inquiry about features",
    "Training request",
    "Demo for new feature",
    "Feedback on recent update",
    "Partnership inquiry",
  ],
};

const CONTACT_SLOTS = [
  "morning_9_12",
  "afternoon_12_3",
  "afternoon_3_6",
  "evening_6_9",
];

const ENQUIRY_MESSAGES = [
  "I would like to know more about the pricing plans and features available.",
  "Can you provide a demo of your pharmacy management system?",
  "What are the integration options available with other software?",
  "I need help setting up multi-branch operations. Can you assist?",
  "Looking for a solution for my pharmacy chain. Please contact me.",
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log("🌱 Starting comprehensive seed with new features...\n");

  // ============================================
  // CLEAR EXISTING DATA (in order of dependencies)
  // ============================================
  console.log("🧹 Clearing existing data...");

  // Clear new tables first
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.enquiryReply.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.cAdminActivityLog.deleteMany();

  // Clear existing tables
  await prisma.activityLog.deleteMany();
  await prisma.fileVerificationLog.deleteMany();
  await prisma.shopFile.deleteMany();
  await prisma.paymentTransaction.deleteMany();

  await prisma.shop.updateMany({
    data: { current_subscription_id: null },
  });

  await prisma.shopSubscription.deleteMany();

  await prisma.user.updateMany({
    data: { shop_id: null, branch_id: null },
  });

  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();

  await prisma.planActivityLog.deleteMany();
  await prisma.plan.deleteMany();

  await prisma.pendingUser.deleteMany();
  await prisma.deletionLog.deleteMany();
  await prisma.cAdmin.deleteMany();

  console.log("✅ Cleared all existing data\n");

  // ============================================
  // PASSWORD HASHES
  // ============================================
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const cadminHash = await bcrypt.hash("Admin@123", 10);

  // ============================================
  // 1. CREATE CADMINS (Multiple roles)
  // ============================================
  console.log("👨‍💼 Creating CAdmins...");

  const superAdmin = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: "Asif cAdmin",
      username: "cadmin",
      role: "SUPER_ADMIN",
      email: "admin@cureli.com",
      phone_number: "9961045596",
      password_hash: cadminHash,
      is_active: true,
      last_login_at: daysAgo(1),
    },
  });

  const analyst = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: "Rahul Verma",
      username: "analyst",
      role: "ANALYST",
      email: "analyst@cureli.com",
      phone_number: "9876543210",
      password_hash: cadminHash,
      is_active: true,
      last_login_at: daysAgo(2),
    },
  });

  const accountant = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: "Priya Singh",
      username: "accountant",
      role: "ACCOUNTING",
      email: "accounts@cureli.com",
      phone_number: "9988776655",
      password_hash: cadminHash,
      is_active: true,
      last_login_at: daysAgo(3),
    },
  });

  const cadmins = [superAdmin, analyst, accountant];
  console.log("✅ Created 3 CAdmins (SUPER_ADMIN, ANALYST, ACCOUNTING)\n");

  // ============================================
  // 2. CREATE CADMIN ACTIVITY LOGS
  // ============================================
  console.log("📋 Creating CAdmin Activity Logs...");

  const adminActions = [
    { action: "login", description: "Logged into admin panel" },
    { action: "plan_created", description: "Created new subscription plan" },
    { action: "shop_verified", description: "Verified shop documents" },
    { action: "payment_reviewed", description: "Reviewed payment transaction" },
    { action: "ticket_resolved", description: "Resolved customer ticket" },
  ];

  let cadminActivityCount = 0;
  for (const cadmin of cadmins) {
    const logsCount = randomBetween(5, 10);
    for (let i = 0; i < logsCount; i++) {
      const actionData = randomFrom(adminActions);
      await prisma.cAdminActivityLog.create({
        data: {
          id: uuid(),
          cadmin_id: cadmin.cadmin_id,
          performed_by_id: cadmin.cadmin_id,
          action: actionData.action,
          description: actionData.description,
          meta: { timestamp: new Date().toISOString() },
          ip_address: `192.168.1.${randomBetween(1, 255)}`,
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
          created_at: randomDate(daysAgo(30), new Date()),
        },
      });
      cadminActivityCount++;
    }
  }

  console.log(`✅ Created ${cadminActivityCount} CAdmin Activity Logs\n`);

  // ============================================
  // 3. CREATE PRE-MADE PLANS (6 plans)
  // ============================================
  console.log("📦 Creating PRE-MADE plans...");

  const freePlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Free Trial",
      description: "Perfect for trying out Cureli with basic features for 14 days",
      type: "PRE_MADE",
      price: BigInt(0),
      max_branches: 1,
      max_users: 2,
      is_customizable: false,
      is_highlighted: false,
      status: "ACTIVE",
      created_by: superAdmin.cadmin_id,
      activated_at: daysAgo(90),
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: freePlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: freePlan.name },
        created_at: daysAgo(91),
      },
      {
        id: uuid(),
        plan_id: freePlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(90),
      },
    ],
  });

  const starterPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Starter",
      description: "Ideal for small pharmacies starting their digital journey",
      type: "PRE_MADE",
      price: BigInt(499000), // ₹4,990 in paisa
      max_branches: 2,
      max_users: 5,
      is_customizable: false,
      is_highlighted: true,
      status: "ACTIVE",
      created_by: superAdmin.cadmin_id,
      activated_at: daysAgo(90),
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: starterPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: starterPlan.name },
        created_at: daysAgo(91),
      },
      {
        id: uuid(),
        plan_id: starterPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(90),
      },
    ],
  });

  const professionalPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Professional",
      description: "Best for growing pharmacies with multiple branches",
      type: "PRE_MADE",
      price: BigInt(1499000), // ₹14,990 in paisa
      max_branches: 5,
      max_users: 15,
      is_customizable: false,
      is_highlighted: false,
      status: "ACTIVE",
      created_by: superAdmin.cadmin_id,
      activated_at: daysAgo(90),
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: professionalPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: professionalPlan.name },
        created_at: daysAgo(91),
      },
      {
        id: uuid(),
        plan_id: professionalPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(90),
      },
    ],
  });
  // Enterprise Plan (DEPRECATED with subscribers)
  const enterprisePlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Enterprise",
      description: "Complete solution for large pharmacy chains with custom requirements",
      type: "PRE_MADE",
      price: BigInt(4999000), // ₹49,990 in paisa
      max_branches: 20,
      max_users: 100,
      is_customizable: true,
      is_highlighted: false,
      status: "DEPRECATED",
      created_by: superAdmin.cadmin_id,
      activated_at: daysAgo(180),
      suspended_at: daysAgo(30),
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: enterprisePlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: enterprisePlan.name },
        created_at: daysAgo(181),
      },
      {
        id: uuid(),
        plan_id: enterprisePlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(180),
      },
      {
        id: uuid(),
        plan_id: enterprisePlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "suspended",
        from_status: "ACTIVE",
        to_status: "DEPRECATED",
        meta: { reason: "Replaced by custom plans", subscriber_count: 2 },
        created_at: daysAgo(30),
      },
    ],
  });

  // Basic Old (SUSPENDED)
  const basicOldPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Basic (Old)",
      description: "Legacy plan - no longer available",
      type: "PRE_MADE",
      price: BigInt(299000), // ₹2,990 in paisa
      max_branches: 1,
      max_users: 3,
      is_customizable: false,
      is_highlighted: false,
      status: "SUSPENDED",
      created_by: superAdmin.cadmin_id,
      activated_at: daysAgo(200),
      suspended_at: daysAgo(60),
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: basicOldPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: basicOldPlan.name },
        created_at: daysAgo(201),
      },
      {
        id: uuid(),
        plan_id: basicOldPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(200),
      },
      {
        id: uuid(),
        plan_id: basicOldPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "suspended",
        from_status: "ACTIVE",
        to_status: "SUSPENDED",
        meta: { reason: "No active subscribers, plan retired" },
        created_at: daysAgo(60),
      },
    ],
  });

  // Legacy Pro (SUSPENDED)
  const legacyProPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Legacy Pro",
      description: "Old professional tier - discontinued",
      type: "PRE_MADE",
      price: BigInt(999000), // ₹9,990 in paisa
      max_branches: 3,
      max_users: 10,
      is_customizable: false,
      is_highlighted: false,
      status: "SUSPENDED",
      created_by: superAdmin.cadmin_id,
      activated_at: daysAgo(150),
      suspended_at: daysAgo(45),
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: legacyProPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: legacyProPlan.name },
        created_at: daysAgo(151),
      },
      {
        id: uuid(),
        plan_id: legacyProPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(150),
      },
      {
        id: uuid(),
        plan_id: legacyProPlan.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "suspended",
        from_status: "ACTIVE",
        to_status: "SUSPENDED",
        meta: { reason: "Merged into Professional plan" },
        created_at: daysAgo(45),
      },
    ],
  });

  console.log("✅ Created 6 PRE-MADE plans (3 ACTIVE, 1 DEPRECATED, 2 SUSPENDED)\n");

  const preMadePlans = {
    free: freePlan,
    starter: starterPlan,
    professional: professionalPlan,
    enterprise: enterprisePlan,
    basicOld: basicOldPlan,
    legacyPro: legacyProPlan,
  };

  // ============================================
  // 4. CREATE PENDING USERS (5 users)
  // ============================================
  console.log("⏳ Creating Pending Users...");

  const pendingUsers = [];

  pendingUsers.push(
    await prisma.pendingUser.create({
      data: {
        pending_id: uuid(),
        first_name: "Akash",
        last_name: "Arora",
        email: "akash.arora@pending.example.com",
        password_hash: passwordHash,
        login_provider: "password",
        email_verified: false,
        email_otp_hash: await bcrypt.hash("1234", 10),
        email_otp_expires: daysFromNow(1),
        created_at: daysAgo(1),
      },
    })
  );

  pendingUsers.push(
    await prisma.pendingUser.create({
      data: {
        pending_id: uuid(),
        first_name: "Bhavna",
        last_name: "Bajaj",
        email: "bhavna.bajaj@pending.example.com",
        password_hash: passwordHash,
        login_provider: "password",
        email_verified: true,
        phone: null,
        sms_verified: false,
        created_at: daysAgo(2),
      },
    })
  );

  pendingUsers.push(
    await prisma.pendingUser.create({
      data: {
        pending_id: uuid(),
        first_name: "Chirag",
        last_name: "Choudhary",
        email: "chirag.choudhary@pending.example.com",
        password_hash: passwordHash,
        login_provider: "password",
        email_verified: true,
        phone: "+919876543210",
        sms_verification_id: "ver_123456",
        sms_otp_expires: daysFromNow(1),
        sms_verified: false,
        created_at: daysAgo(1),
      },
    })
  );

  pendingUsers.push(
    await prisma.pendingUser.create({
      data: {
        pending_id: uuid(),
        first_name: "Divya",
        last_name: "Dwivedi",
        email: "divya.dwivedi@gmail.com",
        password_hash: null,
        login_provider: "google",
        google_id: `google_${uuid().slice(0, 20)}`,
        email_verified: true,
        phone: null,
        sms_verified: false,
        created_at: daysAgo(1),
      },
    })
  );

  pendingUsers.push(
    await prisma.pendingUser.create({
      data: {
        pending_id: uuid(),
        first_name: "Ekta",
        last_name: "Fernandes",
        email: "ekta.fernandes@pending.example.com",
        password_hash: passwordHash,
        login_provider: "password",
        email_verified: true,
        phone: "+919123456789",
        sms_verified: true,
        username: null,
        created_at: daysAgo(3),
      },
    })
  );

  console.log(`✅ Created ${pendingUsers.length} Pending Users\n`);

  // ============================================
  // 5. CREATE SHOPS AND OWNERS (15 shops)
  // ============================================
  console.log("🏪 Creating Shops and Owners...");

  const shops = [];
  const owners = [];

  const shopConfigs = [
    { name: "HealthMax Pharmacy", verification: "verified", subscriptionType: "custom", userStatus: "verified", shopActive: true },
    { name: "PharmaCorp Stores", verification: "verified", subscriptionType: "custom", userStatus: "verified", shopActive: true },
    { name: "MediChain Pharma", verification: "verified", subscriptionType: "custom", userStatus: "verified", shopActive: true },
    { name: "Apollo Medicals", verification: "verified", subscriptionType: "professional", userStatus: "verified", shopActive: true },
    { name: "LifeCare Pharmacy", verification: "verified", subscriptionType: "starter", userStatus: "verified", shopActive: true },
    { name: "Wellness Chemist", verification: "verified", subscriptionType: "trial", userStatus: "verified", shopActive: true },
    { name: "CureWell Drugs", verification: "verified", subscriptionType: "expired", userStatus: "verified", shopActive: false },
    { name: "MediPlus Store", verification: "verified", subscriptionType: "cancelled", userStatus: "verified", shopActive: false },
    { name: "Remedy Pharmacy", verification: "verified", subscriptionType: "none", userStatus: "verified", shopActive: true },
    { name: "VitalHealth Chemist", verification: "pending_review", subscriptionType: "pending", userStatus: "pending_verification", shopActive: true },
    { name: "PharmaZone", verification: "partially_rejected", subscriptionType: "none", userStatus: "pending_verification", shopActive: false },
    { name: "QuickMeds", verification: "rejected", subscriptionType: "none", userStatus: "pending_verification", shopActive: true },
    { name: "NewStart Pharmacy", verification: "pending", subscriptionType: "none", userStatus: "pending_setup", shopActive: true },
    { name: "Heritage Medicals", verification: "verified", subscriptionType: "enterprise", userStatus: "verified", shopActive: true },
    { name: "OldTimer Chemist", verification: "verified", subscriptionType: "enterprise", userStatus: "verified", shopActive: true },
  ];

  let nameIndex = 0;

  for (let i = 0; i < shopConfigs.length; i++) {
    const config = shopConfigs[i];
    const location = INDIAN_CITIES[i % INDIAN_CITIES.length];
    const firstName = FIRST_NAMES[nameIndex];
    const lastName = LAST_NAMES[nameIndex];
    nameIndex++;

    let onboardingStep = 12;
    if (config.userStatus === "pending_setup") {
      onboardingStep = 4;
    } else if (config.userStatus === "pending_verification") {
      onboardingStep = 12;
    }

    const owner = await prisma.user.create({
      data: {
        user_id: uuid(),
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${i + 1}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@example.com`,
        phone_number: `+9198${String(70000000 + i * 1111111).slice(0, 8)}`,
        password_hash: passwordHash,
        login_provider: i % 4 === 0 ? "google" : "password",
        google_id: i % 4 === 0 ? `google_${uuid().slice(0, 20)}` : null,
        role: "super_admin",
        status: config.userStatus,
        is_active: true,
        onboarding_step: onboardingStep,
        first_login_after_verification: config.userStatus === "verified" ? i % 3 === 0 : false,
        first_verified_at: config.userStatus === "verified" ? randomDate(daysAgo(120), daysAgo(30)) : null,
        last_login_at: config.userStatus === "verified" ? randomDate(daysAgo(7), new Date()) : null,
        created_at: randomDate(daysAgo(120), daysAgo(30)),
      },
    });
    owners.push(owner);

    const shop = await prisma.shop.create({
      data: {
        shop_id: uuid(),
        owner_user_id: owner.user_id,
        business_name: config.name,
        legal_name: `${config.name} Pvt. Ltd.`,
        gst_number: config.verification !== "pending" ? `${location.state.slice(0, 2).toUpperCase()}${String(10 + i).padStart(2, "0")}ABCD${1234 + i}E${i + 1}Z${i + 5}` : null,
        business_type: BUSINESS_TYPES[i % BUSINESS_TYPES.length],
        address_line_1: `${100 + i * 10}, ${STREET_NAMES[i % STREET_NAMES.length]}`,
        address_line_2: i % 3 === 0 ? "Ground Floor" : i % 3 === 1 ? "Near Bus Stand" : null,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        verification_status: config.verification,
        is_active: config.shopActive,
        created_at: owner.created_at,
      },
    });
    shops.push({ ...shop, config, ownerIndex: i });

    await prisma.user.update({
      where: { user_id: owner.user_id },
      data: { shop_id: shop.shop_id },
    });
  }

  console.log(`✅ Created ${shops.length} Shops with ${owners.length} Owners\n`);

  // Continue in next message due to length...
  // ============================================
  // 6. CREATE CUSTOM PLANS (3 plans)
  // ============================================
  console.log("📦 Creating CUSTOM plans...");

  const customPlans = [];

  const customPlan1 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "HealthMax Custom",
      description: "Custom plan tailored for HealthMax Pharmacy chain",
      type: "CUSTOM",
      price: BigInt(800000), // ₹8,000 in paisa
      max_branches: 3,
      max_users: 8,
      is_customizable: true,
      is_highlighted: false,
      status: "ACTIVE",
      created_by: superAdmin.cadmin_id,
      created_for_shop_id: shops[0].shop_id,
      activated_at: daysAgo(60),
    },
  });
  customPlans.push(customPlan1);

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: customPlan1.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: customPlan1.name, type: "CUSTOM", shop_id: shops[0].shop_id },
        created_at: daysAgo(61),
      },
      {
        id: uuid(),
        plan_id: customPlan1.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(60),
      },
    ],
  });

  const customPlan2 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "PharmaCorp Custom",
      description: "Custom plan for PharmaCorp retail chain",
      type: "CUSTOM",
      price: BigInt(1200000), // ₹12,000 in paisa
      max_branches: 4,
      max_users: 12,
      is_customizable: true,
      is_highlighted: false,
      status: "ACTIVE",
      created_by: superAdmin.cadmin_id,
      created_for_shop_id: shops[1].shop_id,
      activated_at: daysAgo(45),
    },
  });
  customPlans.push(customPlan2);

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: customPlan2.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: customPlan2.name, type: "CUSTOM", shop_id: shops[1].shop_id },
        created_at: daysAgo(46),
      },
      {
        id: uuid(),
        plan_id: customPlan2.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(45),
      },
    ],
  });

  const customPlan3 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "MediChain Custom",
      description: "Enterprise custom plan for MediChain wholesale operations",
      type: "CUSTOM",
      price: BigInt(2500000), // ₹25,000 in paisa
      max_branches: 8,
      max_users: 25,
      is_customizable: true,
      is_highlighted: false,
      status: "ACTIVE",
      created_by: superAdmin.cadmin_id,
      created_for_shop_id: shops[2].shop_id,
      activated_at: daysAgo(30),
    },
  });
  customPlans.push(customPlan3);

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: customPlan3.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: customPlan3.name, type: "CUSTOM", shop_id: shops[2].shop_id },
        created_at: daysAgo(31),
      },
      {
        id: uuid(),
        plan_id: customPlan3.plan_id,
        cadmin_id: superAdmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(30),
      },
    ],
  });

  console.log(`✅ Created ${customPlans.length} CUSTOM plans\n`);

  // ============================================
  // 7. CREATE BRANCHES (30 branches)
  // ============================================
  console.log("🏢 Creating Branches...");

  const branches = [];

  for (let shopIndex = 0; shopIndex < shops.length; shopIndex++) {
    const shop = shops[shopIndex];
    const location = INDIAN_CITIES[shopIndex % INDIAN_CITIES.length];

    let branchCount;
    if (shopIndex < 5) {
      branchCount = 3;
    } else if (shopIndex < 10) {
      branchCount = 2;
    } else {
      branchCount = 1;
    }

    for (let b = 0; b < branchCount; b++) {
      const isMain = b === 0;
      const branchLocation = b === 0 ? location : INDIAN_CITIES[(shopIndex + b) % INDIAN_CITIES.length];

      const branch = await prisma.branch.create({
        data: {
          branch_id: uuid(),
          shop_id: shop.shop_id,
          branch_name: isMain ? `${shop.business_name} - Main` : `${shop.business_name} - Branch ${b}`,
          branch_type: isMain ? "main" : "sub",
          address_line_1: `${200 + b * 50}, ${STREET_NAMES[(shopIndex + b) % STREET_NAMES.length]}`,
          address_line_2: b % 2 === 0 ? "Shop No. " + (b + 1) : null,
          city: branchLocation.city,
          state: branchLocation.state,
          pincode: branchLocation.pincode,
          contact_number: `+9198${String(60000000 + shopIndex * 100000 + b * 10000).slice(0, 8)}`,
          alternate_number: isMain ? `+9197${String(60000000 + shopIndex * 100000).slice(0, 8)}` : null,
          is_active: true,
          created_at: randomDate(shop.created_at, daysAgo(10)),
        },
      });
      branches.push({ ...branch, shopIndex });
    }
  }

  console.log(`✅ Created ${branches.length} Branches\n`);

  // Update owners with main branch
  for (let i = 0; i < owners.length; i++) {
    const mainBranch = branches.find((b) => b.shopIndex === i && b.branch_type === "main");
    if (mainBranch) {
      await prisma.user.update({
        where: { user_id: owners[i].user_id },
        data: { branch_id: mainBranch.branch_id },
      });
    }
  }

  // ============================================
  // 8. CREATE BRANCH ADMINS (10)
  // ============================================
  console.log("👨‍💼 Creating Branch Admins...");

  const branchAdmins = [];
  const subBranches = branches.filter((b) => b.branch_type === "sub").slice(0, 10);

  for (let i = 0; i < subBranches.length; i++) {
    const branch = subBranches[i];
    const shop = shops[branch.shopIndex];
    const firstName = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
    const lastName = LAST_NAMES[nameIndex % LAST_NAMES.length];
    nameIndex++;

    const ownerStatus = owners[branch.shopIndex].status;

    const branchAdmin = await prisma.user.create({
      data: {
        user_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        username: `ba_${firstName.toLowerCase()}${i + 1}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.ba@${shop.business_name.toLowerCase().replace(/\s+/g, "")}.com`,
        phone_number: `+9199${String(10000000 + i * 1111111).slice(0, 8)}`,
        password_hash: passwordHash,
        login_provider: "password",
        role: "branch_admin",
        status: ownerStatus,
        is_active: true,
        onboarding_step: 12,
        first_verified_at: ownerStatus === "verified" ? randomDate(daysAgo(90), daysAgo(15)) : null,
        last_login_at: ownerStatus === "verified" ? randomDate(daysAgo(14), new Date()) : null,
        created_at: randomDate(daysAgo(90), daysAgo(15)),
      },
    });
    branchAdmins.push(branchAdmin);
  }

  console.log(`✅ Created ${branchAdmins.length} Branch Admins\n`);

  // ============================================
  // 9. CREATE STAFF MEMBERS (18)
  // ============================================
  console.log("👷 Creating Staff Members...");

  const staffMembers = [];
  const verifiedShopIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 13, 14];

  for (let i = 0; i < 18; i++) {
    const shopIndex = verifiedShopIndices[i % verifiedShopIndices.length];
    const shop = shops[shopIndex];
    const shopBranches = branches.filter((b) => b.shopIndex === shopIndex);
    const branch = shopBranches[i % shopBranches.length];

    const firstName = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
    const lastName = LAST_NAMES[nameIndex % LAST_NAMES.length];
    nameIndex++;

    const staff = await prisma.user.create({
      data: {
        user_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch?.branch_id || null,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        username: `staff_${firstName.toLowerCase()}${i + 1}`,
        email: `${firstName.toLowerCase()}${i + 1}@staff.example.com`,
        phone_number: `+9191${String(10000000 + i * 1234567).slice(0, 8)}`,
        password_hash: passwordHash,
        login_provider: "password",
        role: "staff",
        status: "verified",
        is_active: i < 16,
        onboarding_step: 12,
        first_verified_at: randomDate(daysAgo(60), daysAgo(5)),
        last_login_at: i < 16 ? randomDate(daysAgo(7), new Date()) : null,
        created_at: randomDate(daysAgo(60), daysAgo(5)),
      },
    });
    staffMembers.push(staff);
  }

  console.log(`✅ Created ${staffMembers.length} Staff Members\n`);

  const allUsers = [...owners, ...branchAdmins, ...staffMembers];
  console.log(`📊 Total Users in User table: ${allUsers.length}\n`);

  // ============================================
  // 10. CREATE USER SESSIONS (NEW)
  // ============================================
  console.log("🔐 Creating User Sessions...");

  let sessionCount = 0;
  const activeUsers = allUsers.filter((u) => u.status === "verified" && u.is_active);

  for (const user of activeUsers.slice(0, 20)) {
    // Active sessions
    const activeSession = await prisma.userSession.create({
      data: {
        id: uuid(),
        user_id: user.user_id,
        session_token: `session_${uuid()}`,
        device_info: randomFrom(["Chrome on Windows 10", "Safari on macOS", "Firefox on Ubuntu", "Chrome on Android"]),
        ip_address: `192.168.${randomBetween(1, 255)}.${randomBetween(1, 255)}`,
        is_active: true,
        created_at: randomDate(daysAgo(7), new Date()),
        last_active_at: randomDate(daysAgo(1), new Date()),
        expires_at: daysFromNow(30),
      },
    });
    sessionCount++;

    // Some expired sessions
    if (Math.random() > 0.6) {
      await prisma.userSession.create({
        data: {
          id: uuid(),
          user_id: user.user_id,
          session_token: `session_${uuid()}`,
          device_info: randomFrom(["Chrome on Windows 10", "Safari on iPhone"]),
          ip_address: `192.168.${randomBetween(1, 255)}.${randomBetween(1, 255)}`,
          is_active: false,
          created_at: randomDate(daysAgo(60), daysAgo(30)),
          last_active_at: randomDate(daysAgo(30), daysAgo(20)),
          expires_at: daysAgo(15),
          ended_at: daysAgo(15),
          ended_reason: randomFrom(["logout", "expired", "replaced"]),
        },
      });
      sessionCount++;
    }
  }

  console.log(`✅ Created ${sessionCount} User Sessions\n`);

  // ============================================
  // 11. CREATE SHOP FILES & LOGS
  // ============================================
  console.log("📄 Creating Shop Files...");

  let fileCount = 0;
  const allShopFiles = [];

  for (let shopIndex = 0; shopIndex < shops.length; shopIndex++) {
    const shop = shops[shopIndex];
    const owner = owners[shopIndex];
    const config = shop.config;

    if (config.verification === "pending") continue;

    let fileStatuses;
    if (config.verification === "verified") {
      fileStatuses = ["verified", "verified", "verified", "verified", "verified", "verified"];
    } else if (config.verification === "pending_review") {
      fileStatuses = ["uploaded", "uploaded", "uploaded", "uploaded", "uploaded", "uploaded"];
    } else if (config.verification === "partially_rejected") {
      fileStatuses = ["verified", "verified", "verified", "verified", "rejected", "rejected"];
    } else if (config.verification === "rejected") {
      fileStatuses = ["rejected", "rejected", "rejected", "rejected", "rejected", "rejected"];
    } else {
      fileStatuses = ["uploaded", "uploaded", "uploaded", "uploaded", "uploaded", "uploaded"];
    }

    const rejectionReasons = [
      "Document is expired. Please upload a valid document.",
      "Image quality is poor. Please upload a clearer image.",
      "Document information doesn't match business details.",
      "Required stamps/signatures are missing.",
      "Document appears to be tampered. Please upload original.",
      "Wrong document type uploaded.",
    ];

    for (let f = 0; f < FILE_TYPES.length; f++) {
      const fileType = FILE_TYPES[f];
      const status = fileStatuses[f];

      const uploadedAt = randomDate(daysAgo(60), daysAgo(20));
      const verifiedAt = status === "verified" ? randomDate(uploadedAt, daysAgo(5)) : null;
      const rejectedAt = status === "rejected" ? randomDate(uploadedAt, daysAgo(5)) : null;

      const shopFile = await prisma.shopFile.create({
        data: {
          file_id: uuid(),
          shop_id: shop.shop_id,
          file_type: fileType,
          storage_key: `shops/${shop.shop_id}/${fileType}_${Date.now()}_${f}.pdf`,
          original_name: `${fileType.replace(/_/g, "-")}-${shop.business_name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          mime_type: "application/pdf",
          file_size: Math.floor(Math.random() * 500000) + 100000,
          status: status,
          verification_notes: status === "rejected" ? rejectionReasons[f % rejectionReasons.length] : null,
          resubmission_count: status === "rejected" ? randomBetween(0, 2) : 0,
          uploaded_by: owner.user_id,
          uploaded_at: uploadedAt,
          verified_at: verifiedAt,
          rejected_at: rejectedAt,
          last_resubmitted_at: status === "rejected" && Math.random() > 0.5 ? randomDate(rejectedAt, daysAgo(3)) : null,
        },
      });
      allShopFiles.push(shopFile);
      fileCount++;

      // Create file verification logs
      await prisma.fileVerificationLog.create({
        data: {
          id: uuid(),
          file_id: shopFile.file_id,
          shop_id: shopFile.shop_id,
          cadmin_id: null,
          actor_type: "owner",
          action: "uploaded",
          reason: "Initial document upload",
          meta: { file_type: shopFile.file_type },
          created_at: uploadedAt,
        },
      });

      if (status === "verified") {
        await prisma.fileVerificationLog.create({
          data: {
            id: uuid(),
            file_id: shopFile.file_id,
            shop_id: shopFile.shop_id,
            cadmin_id: superAdmin.cadmin_id,
            actor_type: "admin",
            action: "verified",
            reason: "Document verified successfully",
            meta: { verified_by: "superadmin" },
            created_at: verifiedAt,
          },
        });
      } else if (status === "rejected") {
        await prisma.fileVerificationLog.create({
          data: {
            id: uuid(),
            file_id: shopFile.file_id,
            shop_id: shopFile.shop_id,
            cadmin_id: superAdmin.cadmin_id,
            actor_type: "admin",
            action: "rejected",
            reason: shopFile.verification_notes,
            meta: { rejected_by: "superadmin" },
            created_at: rejectedAt,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${fileCount} Shop Files with logs\n`);

  // ============================================
  // 12. CREATE SUBSCRIPTIONS
  // ============================================
  console.log("💳 Creating Subscriptions...");

  const subscriptions = [];

  for (let shopIndex = 0; shopIndex < shops.length; shopIndex++) {
    const shop = shops[shopIndex];
    const config = shop.config;

    if (config.subscriptionType === "none") continue;

    let plan, status, paymentStatus, startDate, endDate;

    switch (config.subscriptionType) {
      case "custom":
        plan = customPlans[shopIndex];
        status = "ACTIVE";
        paymentStatus = "PAID";
        startDate = daysAgo(60 - shopIndex * 10);
        endDate = daysFromNow(305 + shopIndex * 10);
        break;
      case "professional":
        plan = preMadePlans.professional;
        status = "ACTIVE";
        paymentStatus = "PAID";
        startDate = daysAgo(45);
        endDate = daysFromNow(320);
        break;
      case "starter":
        plan = preMadePlans.starter;
        status = "ACTIVE";
        paymentStatus = "PAID";
        startDate = daysAgo(30);
        endDate = daysFromNow(335);
        break;
      case "trial":
        plan = preMadePlans.free;
        status = "ACTIVE";
        paymentStatus = "PAID";
        startDate = daysAgo(7);
        endDate = daysFromNow(7);
        break;
      case "expired":
        plan = preMadePlans.starter;
        status = "EXPIRED";
        paymentStatus = "PAID";
        startDate = daysAgo(400);
        endDate = daysAgo(35);
        break;
      case "cancelled":
        plan = preMadePlans.professional;
        status = "EXPIRED";
        paymentStatus = "PAID";
        startDate = daysAgo(200);
        endDate = daysAgo(20);
        break;
      case "pending":
        plan = preMadePlans.starter;
        status = "PENDING";
        paymentStatus = "PENDING";
        startDate = new Date();
        endDate = daysFromNow(365);
        break;
      case "enterprise":
        plan = preMadePlans.enterprise;
        status = "ACTIVE";
        paymentStatus = "PAID";
        startDate = daysAgo(150);
        endDate = daysFromNow(215);
        break;
      default:
        continue;
    }

    const renewalDate = new Date(endDate);
    renewalDate.setDate(renewalDate.getDate() - 30);

    const subscription = await prisma.shopSubscription.create({
      data: {
        subscription_id: uuid(),
        shop_id: shop.shop_id,
        plan_id: plan.plan_id,
        status: status,
        billing_cycle: "yearly",
        payment_status: paymentStatus,
        start_date: startDate,
        end_date: endDate,
        renewal_date: renewalDate,
        branch_limit_snapshot: plan.max_branches,
        user_limit_snapshot: plan.max_users,
        activated_at: status === "ACTIVE" ? startDate : null,
        created_at: startDate,
      },
    });
    subscriptions.push({ ...subscription, shopIndex, plan });

    await prisma.shop.update({
      where: { shop_id: shop.shop_id },
      data: { current_subscription_id: subscription.subscription_id },
    });
  }

  console.log(`✅ Created ${subscriptions.length} Subscriptions\n`);

  // ============================================
  // 13. CREATE PAYMENT TRANSACTIONS
  // ============================================
  console.log("💰 Creating Payment Transactions...");

  const paymentMethods = ["card", "upi", "netbanking"];
  const banks = ["HDFC", "ICICI", "SBI", "Axis", "Kotak"];
  let paymentCount = 0;

  for (const sub of subscriptions) {
    const shop = shops[sub.shopIndex];
    const amount = sub.plan.price;

    if (amount === BigInt(0)) continue;

    let txnStatus;
    if (sub.status === "ACTIVE" || sub.status === "EXPIRED") {
      txnStatus = "captured";
    } else if (sub.status === "PENDING") {
      txnStatus = "pending";
    } else {
      txnStatus = "captured";
    }

    await prisma.paymentTransaction.create({
      data: {
        transaction_id: uuid(),
        shop_id: shop.shop_id,
        subscription_id: sub.subscription_id,
        provider: "razorpay",
        provider_order_id: `order_${uuid().slice(0, 14)}`,
        provider_payment_id: txnStatus === "captured" ? `pay_${uuid().slice(0, 14)}` : null,
        amount: amount,
        currency: "INR",
        status: txnStatus,
        meta: {
          method: randomFrom(paymentMethods),
          bank: randomFrom(banks),
          email: owners[sub.shopIndex].email,
        },
        created_at: sub.start_date,
      },
    });
    paymentCount++;
  }

  // Add failed payment attempts
  const shopsWithFailedPayments = [6, 7];
  for (const shopIndex of shopsWithFailedPayments) {
    const shop = shops[shopIndex];

    await prisma.paymentTransaction.create({
      data: {
        transaction_id: uuid(),
        shop_id: shop.shop_id,
        subscription_id: null,
        provider: "razorpay",
        provider_order_id: `order_${uuid().slice(0, 14)}`,
        provider_payment_id: null,
        amount: preMadePlans.professional.price,
        currency: "INR",
        status: "failed",
        meta: {
          method: "card",
          bank: randomFrom(banks),
          failure_reason: "Insufficient funds",
          email: owners[shopIndex].email,
        },
        created_at: daysAgo(randomBetween(40, 60)),
      },
    });
    paymentCount++;
  }

  console.log(`✅ Created ${paymentCount} Payment Transactions\n`);

  // ============================================
  // 14. CREATE TICKETS (NEW)
  // ============================================
  console.log("🎫 Creating Tickets...");

  const tickets = [];
  let ticketCounter = 1001;

  // Create tickets for verified shops with active users
  const verifiedActiveShops = shops.filter(s => 
    s.config.verification === "verified" && s.config.shopActive
  ).slice(0, 10);

  for (const shop of verifiedActiveShops) {
    const shopOwner = owners[shop.ownerIndex];
    const shopBranches = branches.filter(b => b.shopIndex === shop.ownerIndex);
    const mainBranch = shopBranches.find(b => b.branch_type === "main");

    // Create 2-4 tickets per shop
    const ticketsPerShop = randomBetween(2, 4);

    for (let t = 0; t < ticketsPerShop; t++) {
      const category = randomFrom(TICKET_CATEGORIES);
      const subject = randomFrom(TICKET_SUBJECTS[category]);
      const ticketStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];
      const ticketStatus = randomFrom(ticketStatuses);

      const createdAt = randomDate(daysAgo(60), daysAgo(5));

      const ticket = await prisma.ticket.create({
        data: {
          ticket_id: uuid(),
          ticket_number: `TKT-${ticketCounter++}`,
          shop_id: shop.shop_id,
          branch_id: mainBranch?.branch_id || null,
          created_by_user_id: shopOwner.user_id,
          contact_number: shopOwner.phone_number,
          category: category,
          subject: subject,
          description: `Detailed description for ${subject}. This needs immediate attention.`,
          other_category_text: category === "OTHER" ? "General Query" : null,
          preferred_slot: randomFrom(CONTACT_SLOTS),
          status: ticketStatus,
          admin_notes: ticketStatus === "RESOLVED" || ticketStatus === "CLOSED" ? 
            "Issue resolved by our technical team." : null,
          created_at: createdAt,
        },
      });
      tickets.push(ticket);

      // Create ticket status history
      await prisma.ticketStatusHistory.create({
        data: {
          id: uuid(),
          ticket_id: ticket.ticket_id,
          changed_by_type: "USER",
          changed_by_id: shopOwner.user_id,
          changed_by_name: shopOwner.full_name,
          from_status: null,
          to_status: "PENDING",
          note: "Ticket created",
          created_at: createdAt,
        },
      });

      // Add status transitions
      if (ticketStatus === "IN_PROGRESS" || ticketStatus === "RESOLVED" || ticketStatus === "CLOSED") {
        const inProgressAt = randomDate(createdAt, daysAgo(3));
        await prisma.ticketStatusHistory.create({
          data: {
            id: uuid(),
            ticket_id: ticket.ticket_id,
            changed_by_type: "CADMIN",
            changed_by_id: superAdmin.cadmin_id,
            changed_by_name: superAdmin.name,
            from_status: "PENDING",
            to_status: "IN_PROGRESS",
            note: "Ticket assigned to support team",
            created_at: inProgressAt,
          },
        });
      }

      if (ticketStatus === "RESOLVED" || ticketStatus === "CLOSED") {
        const resolvedAt = randomDate(createdAt, daysAgo(1));
        await prisma.ticketStatusHistory.create({
          data: {
            id: uuid(),
            ticket_id: ticket.ticket_id,
            changed_by_type: "CADMIN",
            changed_by_id: analyst.cadmin_id,
            changed_by_name: analyst.name,
            from_status: "IN_PROGRESS",
            to_status: "RESOLVED",
            note: "Issue has been fixed and tested",
            created_at: resolvedAt,
          },
        });
      }

      if (ticketStatus === "CLOSED") {
        const closedAt = randomDate(createdAt, new Date());
        await prisma.ticketStatusHistory.create({
          data: {
            id: uuid(),
            ticket_id: ticket.ticket_id,
            changed_by_type: "CADMIN",
            changed_by_id: superAdmin.cadmin_id,
            changed_by_name: superAdmin.name,
            from_status: "RESOLVED",
            to_status: "CLOSED",
            note: "Ticket closed after confirmation",
            created_at: closedAt,
          },
        });
      }

      // Add attachments to some tickets
      if (Math.random() > 0.6) {
        await prisma.ticketAttachment.create({
          data: {
            attachment_id: uuid(),
            ticket_id: ticket.ticket_id,
            storage_key: `tickets/${ticket.ticket_id}/screenshot_${Date.now()}.jpg`,
            original_name: "error_screenshot.jpg",
            mime_type: "image/jpeg",
            file_size: randomBetween(100000, 500000),
            uploaded_at: createdAt,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${tickets.length} Tickets with status history\n`);

  // ============================================
  // 15. CREATE ENQUIRIES (NEW)
  // ============================================
  console.log("📧 Creating Enquiries...");

  const enquiries = [];
  let enquiryCounter = 2001;

  for (let e = 0; e < 12; e++) {
    const firstName = FIRST_NAMES[e % FIRST_NAMES.length];
    const lastName = LAST_NAMES[e % LAST_NAMES.length];
    const enquiryStatus = randomFrom(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED"]);
    const createdAt = randomDate(daysAgo(30), daysAgo(1));

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiry_id: uuid(),
        enquiry_number: `ENQ-${enquiryCounter++}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@enquiry.com`,
        phone: `+919${String(randomBetween(100000000, 999999999))}`,
        message: ENQUIRY_MESSAGES[e % ENQUIRY_MESSAGES.length],
        status: enquiryStatus,
        created_at: createdAt,
      },
    });
    enquiries.push(enquiry);

    // Add replies to some enquiries
    if (enquiryStatus === "REPLIED" || enquiryStatus === "CLOSED") {
      const repliedAt = randomDate(createdAt, new Date());

      await prisma.enquiryReply.create({
        data: {
          reply_id: uuid(),
          enquiry_id: enquiry.enquiry_id,
          replied_by_id: randomFrom(cadmins).cadmin_id,
          subject: `Re: Your inquiry about ${enquiry.message.slice(0, 30)}...`,
          message: `Dear ${enquiry.name},\n\nThank you for your interest in Cureli. We would be happy to discuss your requirements in detail. Our team will contact you within 24 hours.\n\nBest regards,\nCureli Support Team`,
          email_sent: true,
          email_sent_at: repliedAt,
          created_at: repliedAt,
        },
      });
    }
  }

  console.log(`✅ Created ${enquiries.length} Enquiries with replies\n`);

  // ============================================
  // 16. CREATE ACTIVITY LOGS
  // ============================================
  console.log("📝 Creating Activity Logs...");

  const actions = [
    { action: "login", description: "User logged in successfully" },
    { action: "logout", description: "User logged out" },
    { action: "profile_update", description: "Updated profile information" },
    { action: "password_change", description: "Password was changed" },
    { action: "file_upload", description: "Uploaded a document" },
    { action: "subscription_view", description: "Viewed subscription details" },
  ];

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  ];

  let activityCount = 0;

  for (const user of allUsers) {
    if (user.status !== "verified" || !user.is_active) continue;

    const logsForUser = randomBetween(3, 8);

    for (let a = 0; a < logsForUser; a++) {
      const actionData = actions[a % actions.length];

      await prisma.activityLog.create({
        data: {
          activity_id: uuid(),
          user_id: user.user_id,
          action: actionData.action,
          description: actionData.description,
          ip_address: `192.168.${randomBetween(1, 255)}.${randomBetween(1, 255)}`,
          user_agent: randomFrom(userAgents),
          created_at: randomDate(daysAgo(30), new Date()),
        },
      });
      activityCount++;
    }
  }

  console.log(`✅ Created ${activityCount} Activity Logs\n`);

  // ============================================
  // 17. CREATE DELETION LOGS
  // ============================================
  console.log("🗑️ Creating Deletion Logs...");

  const deletionReasons = [
    { reason: "inactivity", days: 90 },
    { reason: "user_request", days: null },
    { reason: "incomplete_onboarding", days: 30 },
  ];

  for (let i = 0; i < 3; i++) {
    const reasonData = deletionReasons[i];

    await prisma.deletionLog.create({
      data: {
        id: uuid(),
        user_id: uuid(),
        email: `deleted_user_${i + 1}@example.com`,
        username: `deleted_user_${i + 1}`,
        reason: reasonData.reason,
        onboarding_step: reasonData.reason === "incomplete_onboarding" ? randomBetween(1, 3) : null,
        days_inactive: reasonData.days,
        files_deleted: randomBetween(0, 6),
        deleted_at: randomDate(daysAgo(90), daysAgo(10)),
      },
    });
  }

  console.log(`✅ Created 3 Deletion Logs\n`);

  // ============================================
  // FINAL COUNTS & SUMMARY
  // ============================================

  const finalCounts = {
    cadmins: cadmins.length,
    pendingUsers: pendingUsers.length,
    owners: owners.length,
    branchAdmins: branchAdmins.length,
    staff: staffMembers.length,
    totalUsers: allUsers.length,
    shops: shops.length,
    branches: branches.length,
    preMadePlans: 6,
    customPlans: customPlans.length,
    totalPlans: 9,
    subscriptions: subscriptions.length,
    payments: paymentCount,
    shopFiles: fileCount,
    tickets: tickets.length,
    enquiries: enquiries.length,
    sessions: sessionCount,
    activityLogs: activityCount,
    cadminActivityLogs: cadminActivityCount,
    deletionLogs: 3,
  };

  console.log("═".repeat(60));
  console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
  console.log("═".repeat(60));
  console.log("\n📊 SUMMARY:\n");

  console.log("👤 USERS:");
  console.log(`   • CAdmins: ${finalCounts.cadmins} (SUPER_ADMIN, ANALYST, ACCOUNTING)`);
  console.log(`   • Pending Users: ${finalCounts.pendingUsers}`);
  console.log(`   • Shop Owners (super_admin): ${finalCounts.owners}`);
  console.log(`   • Branch Admins: ${finalCounts.branchAdmins}`);
  console.log(`   • Staff Members: ${finalCounts.staff}`);
  console.log(`   • Total in User table: ${finalCounts.totalUsers}`);

  console.log("\n🏪 SHOPS & BRANCHES:");
  console.log(`   • Shops: ${finalCounts.shops}`);
  console.log(`   • Branches: ${finalCounts.branches}`);

  console.log("\n📦 PLANS:");
  console.log(`   • PRE-MADE Plans: ${finalCounts.preMadePlans}`);
  console.log(`     - ACTIVE: 3 (Free Trial, Starter, Professional)`);
  console.log(`     - DEPRECATED: 1 (Enterprise - has 2 subscribers)`);
  console.log(`     - SUSPENDED: 2 (Basic Old, Legacy Pro)`);
  console.log(`   • CUSTOM Plans: ${finalCounts.customPlans}`);
  console.log(`   • Total Plans: ${finalCounts.totalPlans}`);

  console.log("\n💳 SUBSCRIPTIONS & PAYMENTS:");
  console.log(`   • Subscriptions: ${finalCounts.subscriptions}`);
  console.log(`   • Payment Transactions: ${finalCounts.payments}`);

  console.log("\n🎫 SUPPORT (NEW):");
  console.log(`   • Tickets: ${finalCounts.tickets}`);
  console.log(`   • Enquiries: ${finalCounts.enquiries}`);

  console.log("\n📄 FILES & LOGS:");
  console.log(`   • Shop Files: ${finalCounts.shopFiles}`);
  console.log(`   • User Sessions: ${finalCounts.sessions}`);
  console.log(`   • Activity Logs: ${finalCounts.activityLogs}`);
  console.log(`   • CAdmin Activity Logs: ${finalCounts.cadminActivityLogs}`);
  console.log(`   • Deletion Logs: ${finalCounts.deletionLogs}`);

  console.log("\n" + "═".repeat(60));
  console.log("🔐 LOGIN CREDENTIALS:");
  console.log("═".repeat(60));
  console.log("   CAdmin (all roles): cadmin / Admin@123");
  console.log("   All Users: Password123!");
  console.log("═".repeat(60));

  console.log("\n📋 SHOP STATUS DISTRIBUTION:");
  console.log("═".repeat(60));
  console.log("   ✅ verified (9 shops):");
  console.log("      - 3 with Custom Plans");
  console.log("      - 2 with Active Pre-made Plans");
  console.log("      - 1 with Trial");
  console.log("      - 1 with Expired Subscription");
  console.log("      - 1 with Cancelled Subscription");
  console.log("      - 1 with No Subscription");
  console.log("   ⏳ pending_review (1 shop): Docs under review");
  console.log("   ⚠️  partially_rejected (1 shop): Some docs rejected");
  console.log("   ❌ rejected (1 shop): All docs rejected");
  console.log("   📝 pending (1 shop): Just created, no docs");
  console.log("   🏛️  verified + deprecated plan (2 shops): Grandfathered");
  console.log("═".repeat(60));

  console.log("\n🎯 NEW FEATURES COVERED:");
  console.log("═".repeat(60));
  console.log("   ✓ Multiple CAdmin roles (SUPER_ADMIN, ANALYST, ACCOUNTING)");
  console.log("   ✓ CAdmin activity logging");
  console.log("   ✓ User session tracking (active & expired)");
  console.log("   ✓ Support ticket system with status history");
  console.log("   ✓ Ticket attachments");
  console.log("   ✓ Customer enquiries with replies");
  console.log("   ✓ Updated subscription status enums");
  console.log("   ✓ Updated payment status enums");
  console.log("   ✓ Optional branch address fields");
  console.log("   ✓ User verification timestamps");
  console.log("   ✓ All previous edge cases maintained");
  console.log("═".repeat(60));

  console.log("\n✨ All new schema features have been seeded!");
}

// ============================================
// EXECUTE SEED
// ============================================

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });