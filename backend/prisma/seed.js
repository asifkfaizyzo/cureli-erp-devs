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

// Ticket number generator
let ticketCounter = 0;
const generateTicketNumber = () => {
  ticketCounter++;
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${randomPart}-${String(ticketCounter).padStart(5, "0")}`;
};

// Enquiry number generator
let enquiryCounter = 0;
const generateEnquiryNumber = () => {
  enquiryCounter++;
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  return `ENQ-${dateStr}-${String(enquiryCounter).padStart(4, "0")}`;
};

// ============================================
// CONSTANTS
// ============================================

const GRACE_PERIOD_DAYS = 7;

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
];

const FIRST_NAMES = [
  "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rajesh", "Deepika",
  "Suresh", "Kavita", "Arun", "Meera", "Kiran", "Pooja", "Sanjay", "Neha",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Kumar", "Singh", "Gupta", "Reddy", "Nair", "Joshi",
  "Mehta", "Verma", "Desai", "Iyer", "Kulkarni", "Pillai", "Rao", "Saxena",
];

const SHOP_NAMES = [
  "HealthMax Pharmacy", "PharmaCorp Stores", "MediChain Pharma",
  "Apollo Medicals", "LifeCare Pharmacy", "Wellness Chemist",
  "CureWell Drugs", "MediPlus Store", "Remedy Pharmacy",
  "VitalHealth Chemist", "PharmaZone", "QuickMeds",
  "NewStart Pharmacy", "Heritage Medicals",
];

const STREET_NAMES = [
  "MG Road", "Station Road", "Main Street", "Market Lane", "Commercial Complex",
  "Link Road", "Highway Junction", "Industrial Area", "City Center", "Mall Road",
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
];

const TICKET_SUBJECTS = [
  "Unable to upload documents",
  "Payment failed but amount deducted",
  "Login OTP not received",
  "Subscription renewal issue",
  "Document verification taking too long",
];

const TICKET_DESCRIPTIONS = [
  "I have been trying to upload my drug license but the system keeps showing an error.",
  "I made a payment yesterday but my subscription is still showing as pending.",
  "I have tried multiple times but I'm not receiving the OTP on my registered mobile.",
  "My subscription is about to expire and I'm unable to find the renewal option.",
  "I submitted all documents 5 days ago but still showing as 'under review'.",
];

const ENQUIRY_MESSAGES = [
  "I am interested in your pharmacy management solution. Can you share pricing?",
  "We have 5 branches across Mumbai. What plan would you recommend?",
  "Is there a free trial available? We would like to test before committing.",
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log("🌱 Starting comprehensive seed...\n");

  // ============================================
  // CLEAR EXISTING DATA
  // ============================================
  console.log("🧹 Clearing existing data...");

  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.enquiryReply.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.cAdminActivityLog.deleteMany();
  await prisma.fileVerificationLog.deleteMany();
  await prisma.shopFile.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.shop.updateMany({ data: { current_subscription_id: null } });
  await prisma.shopSubscription.deleteMany();
  await prisma.user.updateMany({ data: { shop_id: null, branch_id: null } });
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
  // 1. CREATE CADMIN
  // ============================================
  console.log("👨‍💼 Creating CAdmin...");

  const cadmin = await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      name: "asif",
      username: "cadmin",
      role: "SUPER_ADMIN",
      email: "admin@cureli.com",
      phone_number: "9961045596",
      password_hash: cadminHash,
      is_active: true,
      last_login_at: daysAgo(1),
    },
  });

  // Create a few CAdmin activity logs
  await prisma.cAdminActivityLog.createMany({
    data: [
      {
        id: uuid(),
        cadmin_id: cadmin.cadmin_id,
        action: "login",
        description: "Admin logged in successfully",
        ip_address: "192.168.1.100",
        user_agent: USER_AGENTS[0],
        created_at: daysAgo(1),
      },
      {
        id: uuid(),
        cadmin_id: cadmin.cadmin_id,
        action: "password_changed",
        description: "Admin password was changed",
        ip_address: "192.168.1.100",
        user_agent: USER_AGENTS[0],
        created_at: daysAgo(15),
      },
    ],
  });

  console.log("✅ Created CAdmin: cadmin / Admin@123\n");

  // ============================================
  // 2. CREATE PLANS (10 PRE-MADE plans)
  // ============================================
  console.log("📦 Creating PRE-MADE plans...");

  // Plan 1: Free Trial (ACTIVE)
  const freePlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Free Trial",
      description: "14-day free trial with basic features",
      type: "PRE_MADE",
      price: BigInt(0),
      max_branches: 1,
      max_users: 2,
      billing_cycle_months: 1,
      is_customizable: false,
      is_featured: false,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(90),
    },
  });

  // Plan 2: Starter (ACTIVE, featured)
  const starterPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Starter",
      description: "Ideal for small pharmacies",
      type: "PRE_MADE",
      price: BigInt(4990),
      compare_at_price: BigInt(6990),
      max_branches: 2,
      max_users: 5,
      billing_cycle_months: 12,
      is_customizable: false,
      is_featured: true,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(90),
    },
  });

  // Plan 3: Professional (ACTIVE, with bonus_months)
  const professionalPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Professional",
      description: "For growing pharmacies with multiple branches",
      type: "PRE_MADE",
      price: BigInt(14990),
      compare_at_price: BigInt(17990),
      max_branches: 5,
      max_users: 15,
      billing_cycle_months: 12,
      bonus_months: 2,
      is_customizable: false,
      is_featured: false,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(90),
    },
  });

  // Plan 4: Enterprise (DEPRECATED - has active subscribers)
  const enterprisePlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Enterprise",
      description: "Complete solution for large pharmacy chains",
      type: "PRE_MADE",
      price: BigInt(49990),
      max_branches: 20,
      max_users: 100,
      billing_cycle_months: 12,
      bonus_months: 3,
      is_customizable: true,
      is_featured: false,
      status: "DEPRECATED",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(180),
      suspended_at: daysAgo(30),
    },
  });

  // Plan 5: Basic Old (SUSPENDED)
  const basicOldPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Basic (Old)",
      description: "Legacy plan - no longer available",
      type: "PRE_MADE",
      price: BigInt(2990),
      max_branches: 1,
      max_users: 3,
      billing_cycle_months: 12,
      is_customizable: false,
      is_featured: false,
      status: "SUSPENDED",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(200),
      suspended_at: daysAgo(60),
    },
  });

  // Plan 6: Legacy Pro (SUSPENDED + SOFT DELETED)
  const legacyProPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Legacy Pro",
      description: "Old professional tier - discontinued",
      type: "PRE_MADE",
      price: BigInt(9990),
      max_branches: 3,
      max_users: 10,
      billing_cycle_months: 12,
      is_customizable: false,
      is_featured: false,
      status: "SUSPENDED",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(150),
      suspended_at: daysAgo(45),
      deleted_at: daysAgo(40),
    },
  });

  // Plan 7: Launch Special (ACTIVE, promo in future)
  const promoPlan1 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Launch Special",
      description: "Free for first 3 months, then regular pricing",
      type: "PRE_MADE",
      price: BigInt(7990),
      compare_at_price: BigInt(9990),
      max_branches: 3,
      max_users: 8,
      billing_cycle_months: 12,
      promo_free_until: daysFromNow(90),
      is_customizable: false,
      is_featured: true,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(10),
    },
  });

  // Plan 8: Diwali Special (ACTIVE, promo expired)
  const promoPlan2 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Diwali Special 2024",
      description: "Diwali offer - Promo period ended",
      type: "PRE_MADE",
      price: BigInt(5990),
      compare_at_price: BigInt(7990),
      max_branches: 2,
      max_users: 6,
      billing_cycle_months: 12,
      bonus_months: 1,
      promo_free_until: daysAgo(30),
      is_customizable: false,
      is_featured: false,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(60),
    },
  });

  // Plan 9: Ultimate (ACTIVE, featured)
  const ultimatePlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Ultimate",
      description: "Everything you need - unlimited branches",
      type: "PRE_MADE",
      price: BigInt(99990),
      compare_at_price: BigInt(129990),
      max_branches: 50,
      max_users: 500,
      billing_cycle_months: 12,
      bonus_months: 3,
      is_customizable: true,
      is_featured: true,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(30),
    },
  });

  // Plan 10: Draft Plan
  const draftPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Premium Plus (Draft)",
      description: "Work in progress - Premium tier",
      type: "PRE_MADE",
      price: BigInt(24990),
      max_branches: 10,
      max_users: 30,
      billing_cycle_months: 12,
      is_customizable: false,
      is_featured: false,
      status: "DRAFT",
      created_by: cadmin.cadmin_id,
    },
  });

  // Create plan activity logs for a few plans
  const planActivityLogs = [
    { plan_id: starterPlan.plan_id, action: "created", to_status: "DRAFT", created_at: daysAgo(91) },
    { plan_id: starterPlan.plan_id, action: "activated", from_status: "DRAFT", to_status: "ACTIVE", created_at: daysAgo(90) },
    { plan_id: enterprisePlan.plan_id, action: "suspended", from_status: "ACTIVE", to_status: "DEPRECATED", created_at: daysAgo(30) },
  ];

  await prisma.planActivityLog.createMany({
    data: planActivityLogs.map((log) => ({
      id: uuid(),
      cadmin_id: cadmin.cadmin_id,
      ...log,
    })),
  });

  const preMadePlans = {
    free: freePlan,
    starter: starterPlan,
    professional: professionalPlan,
    enterprise: enterprisePlan,
    basicOld: basicOldPlan,
    legacyPro: legacyProPlan,
    launchSpecial: promoPlan1,
    diwaliSpecial: promoPlan2,
    ultimate: ultimatePlan,
    draft: draftPlan,
  };

  console.log("✅ Created 10 PRE-MADE plans\n");

  // ============================================
  // 3. CREATE PENDING USERS (2 users)
  // ============================================
  console.log("⏳ Creating Pending Users...");

  await prisma.pendingUser.createMany({
    data: [
      {
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
      {
        pending_id: uuid(),
        first_name: "Bhavna",
        last_name: "Bajaj",
        email: "bhavna.bajaj@pending.example.com",
        password_hash: passwordHash,
        login_provider: "password",
        email_verified: true,
        phone: "+919876543210",
        sms_verified: false,
        created_at: daysAgo(2),
      },
    ],
  });

  console.log("✅ Created 2 Pending Users\n");

    // ============================================
  // 4. CREATE SHOPS WITH VARIOUS SUBSCRIPTION STATES
  // ============================================
  console.log("🏪 Creating Shops, Owners, and Subscriptions...");

  const shops = [];
  const owners = [];
  const subscriptions = [];
  let nameIndex = 0;

  // Shop configurations - 14 shops (2 of each subscription state)
  // Subscription states: active, expiring, grace, suspended, expired, cancelled, none/pending
  // Verification states: 10 verified, 2 pending_review, 2 rejected
  const shopConfigs = [
    // 1-2: Active subscriptions (plenty of time left) - VERIFIED
    {
      name: "HealthMax Pharmacy",
      verification: "verified",
      subscriptionState: "active",
      plan: "professional",
      daysUntilEnd: 200,
    },
    {
      name: "PharmaCorp Stores",
      verification: "verified",
      subscriptionState: "active",
      plan: "starter",
      daysUntilEnd: 150,
    },

    // 3-4: Expiring soon (within 7 days) - VERIFIED
    {
      name: "MediChain Pharma",
      verification: "verified",
      subscriptionState: "expiring",
      plan: "professional",
      daysUntilEnd: 3,
    },
    {
      name: "Apollo Medicals",
      verification: "verified",
      subscriptionState: "expiring",
      plan: "starter",
      daysUntilEnd: 5,
    },

    // 5-6: In Grace Period (past end date, within 7-day grace) - VERIFIED
    {
      name: "LifeCare Pharmacy",
      verification: "verified",
      subscriptionState: "grace",
      plan: "professional",
      daysPastEnd: 2, // 5 days of grace left
    },
    {
      name: "Wellness Chemist",
      verification: "verified",
      subscriptionState: "grace",
      plan: "starter",
      daysPastEnd: 5, // 2 days of grace left
    },

    // 7-8: Suspended (grace period ended) - VERIFIED but shop inactive
    {
      name: "CureWell Drugs",
      verification: "verified",
      subscriptionState: "suspended",
      plan: "professional",
      daysPastGrace: 10,
    },
    {
      name: "MediPlus Store",
      verification: "verified",
      subscriptionState: "suspended",
      plan: "starter",
      daysPastGrace: 5,
    },

    // 9-10: Expired (old subscription, no grace tracking) - VERIFIED
    {
      name: "Remedy Pharmacy",
      verification: "verified",
      subscriptionState: "expired",
      plan: "enterprise", // Grandfathered on deprecated plan
      daysPastEnd: 45,
    },
    {
      name: "VitalHealth Chemist",
      verification: "verified",
      subscriptionState: "expired",
      plan: "starter",
      daysPastEnd: 30,
    },

    // 11-12: Cancelled subscriptions - PENDING_REVIEW verification
    {
      name: "PharmaZone",
      verification: "pending_review",
      subscriptionState: "cancelled",
      plan: "professional",
      daysCancelledAgo: 15,
    },
    {
      name: "QuickMeds",
      verification: "pending_review",
      subscriptionState: "cancelled",
      plan: "starter",
      daysCancelledAgo: 7,
    },

    // 13-14: No subscription / Pending payment - REJECTED verification
    {
      name: "NewStart Pharmacy",
      verification: "rejected",
      subscriptionState: "none",
      plan: null,
    },
    {
      name: "Heritage Medicals",
      verification: "rejected",
      subscriptionState: "pending",
      plan: "starter",
    },
  ];

  // Helper to get plan by key
  const getPlan = (planKey) => {
    const planMap = {
      free: preMadePlans.free,
      starter: preMadePlans.starter,
      professional: preMadePlans.professional,
      enterprise: preMadePlans.enterprise,
      ultimate: preMadePlans.ultimate,
    };
    return planMap[planKey];
  };

  // Create each shop with owner and subscription
  for (let i = 0; i < shopConfigs.length; i++) {
    const config = shopConfigs[i];
    const location = INDIAN_CITIES[i % INDIAN_CITIES.length];
    const firstName = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
    const lastName = LAST_NAMES[nameIndex % LAST_NAMES.length];
    nameIndex++;

    // Determine shop active status
    const isShopActive = !["suspended"].includes(config.subscriptionState);

    // Determine user status based on verification
    let userStatus = "verified";
    let onboardingStep = 12;
    if (config.verification === "pending_review") {
      userStatus = "pending_verification";
    } else if (config.verification === "rejected") {
      userStatus = "pending_verification";
      onboardingStep = 12;
    }

    // Create Owner
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
        login_provider: i % 3 === 0 ? "google" : "password",
        google_id: i % 3 === 0 ? `google_${uuid().slice(0, 20)}` : null,
        role: "super_admin",
        status: userStatus,
        is_active: true,
        onboarding_step: onboardingStep,
        last_login_at: userStatus === "verified" ? randomDate(daysAgo(7), new Date()) : null,
        created_at: randomDate(daysAgo(120), daysAgo(30)),
      },
    });
    owners.push(owner);

    // Create Shop
    const shop = await prisma.shop.create({
      data: {
        shop_id: uuid(),
        owner_user_id: owner.user_id,
        business_name: config.name,
        legal_name: `${config.name} Pvt. Ltd.`,
        gst_number: config.verification !== "rejected"
          ? `${location.state.slice(0, 2).toUpperCase()}${String(10 + i).padStart(2, "0")}ABCD${1234 + i}E${i + 1}Z${i + 5}`
          : null,
        business_type: BUSINESS_TYPES[i % BUSINESS_TYPES.length],
        address_line_1: `${100 + i * 10}, ${STREET_NAMES[i % STREET_NAMES.length]}`,
        address_line_2: i % 2 === 0 ? "Ground Floor" : null,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        verification_status: config.verification,
        is_active: isShopActive,
        created_at: owner.created_at,
      },
    });

    // Update owner with shop_id
    await prisma.user.update({
      where: { user_id: owner.user_id },
      data: { shop_id: shop.shop_id },
    });

    // Create Main Branch
    const mainBranch = await prisma.branch.create({
      data: {
        branch_id: uuid(),
        shop_id: shop.shop_id,
        branch_name: `${config.name} - Main`,
        branch_type: "main",
        address_line_1: shop.address_line_1,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        contact_number: owner.phone_number,
        is_active: isShopActive,
        created_at: shop.created_at,
      },
    });

    // Update owner with branch_id
    await prisma.user.update({
      where: { user_id: owner.user_id },
      data: { branch_id: mainBranch.branch_id },
    });

    // Create subscription based on state
    let subscription = null;
    const plan = config.plan ? getPlan(config.plan) : null;

    if (plan && config.subscriptionState !== "none") {
      let startDate, endDate, gracePeriodUntil, status, paymentStatus, isActive;

      switch (config.subscriptionState) {
        case "active":
          // Active with plenty of time left
          startDate = daysAgo(365 - config.daysUntilEnd);
          endDate = daysFromNow(config.daysUntilEnd);
          gracePeriodUntil = null;
          status = "active";
          paymentStatus = "paid";
          isActive = true;
          break;

        case "expiring":
          // Expiring soon (within 7 days)
          startDate = daysAgo(365 - config.daysUntilEnd);
          endDate = daysFromNow(config.daysUntilEnd);
          gracePeriodUntil = null;
          status = "active";
          paymentStatus = "paid";
          isActive = true;
          break;

        case "grace":
          // Past end date, in grace period
          startDate = daysAgo(365 + config.daysPastEnd);
          endDate = daysAgo(config.daysPastEnd);
          gracePeriodUntil = daysFromNow(GRACE_PERIOD_DAYS - config.daysPastEnd);
          status = "active"; // Still active during grace
          paymentStatus = "pending";
          isActive = true;
          break;

        case "suspended":
          // Grace period ended, suspended
          const totalDaysPast = GRACE_PERIOD_DAYS + config.daysPastGrace;
          startDate = daysAgo(365 + totalDaysPast);
          endDate = daysAgo(totalDaysPast);
          gracePeriodUntil = daysAgo(config.daysPastGrace);
          status = "suspended";
          paymentStatus = "pending";
          isActive = false;
          break;

        case "expired":
          // Old expired subscription
          startDate = daysAgo(365 + config.daysPastEnd);
          endDate = daysAgo(config.daysPastEnd);
          gracePeriodUntil = null;
          status = "expired";
          paymentStatus = "paid";
          isActive = false;
          break;

        case "cancelled":
          // Cancelled subscription
          startDate = daysAgo(200);
          endDate = daysAgo(config.daysCancelledAgo);
          gracePeriodUntil = null;
          status = "cancelled";
          paymentStatus = "refunded";
          isActive = false;
          break;

        case "pending":
          // Pending payment
          startDate = new Date();
          endDate = daysFromNow(365);
          gracePeriodUntil = null;
          status = "pending";
          paymentStatus = "pending";
          isActive = false;
          break;

        default:
          continue;
      }

      const renewalDate = new Date(endDate);
      renewalDate.setDate(renewalDate.getDate() - 30);

      subscription = await prisma.shopSubscription.create({
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
          grace_period_until: gracePeriodUntil,
          branch_limit_snapshot: plan.max_branches,
          user_limit_snapshot: plan.max_users,
          is_active: isActive,
          created_at: startDate,
        },
      });

      subscriptions.push({ ...subscription, shopIndex: i, plan, config });

      // Update shop with current subscription
      await prisma.shop.update({
        where: { shop_id: shop.shop_id },
        data: { current_subscription_id: subscription.subscription_id },
      });
    }

    shops.push({ ...shop, config, ownerIndex: i, subscription, mainBranch });
  }

  console.log(`✅ Created ${shops.length} Shops with Owners\n`);

  // ============================================
  // 5. CREATE SHOP FILES (Documents)
  // ============================================
  console.log("📄 Creating Shop Files...");

  const allShopFiles = [];

  for (let shopIndex = 0; shopIndex < shops.length; shopIndex++) {
    const shop = shops[shopIndex];
    const owner = owners[shopIndex];
    const config = shop.config;

    // Determine file statuses based on verification
    let fileStatuses;
    if (config.verification === "verified") {
      fileStatuses = ["verified", "verified", "verified", "verified", "verified", "verified"];
    } else if (config.verification === "pending_review") {
      fileStatuses = ["uploaded", "uploaded", "uploaded", "uploaded", "uploaded", "uploaded"];
    } else if (config.verification === "rejected") {
      fileStatuses = ["rejected", "rejected", "verified", "verified", "rejected", "rejected"];
    } else {
      fileStatuses = ["uploaded", "uploaded", "uploaded", "uploaded", "uploaded", "uploaded"];
    }

    const rejectionReasons = [
      "Document is expired. Please upload a valid document.",
      "Image quality is poor. Please upload a clearer image.",
      "Document information doesn't match business details.",
      "Required stamps/signatures are missing.",
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
          original_name: `${fileType.replace(/_/g, "-")}.pdf`,
          mime_type: "application/pdf",
          file_size: randomBetween(100000, 500000),
          status: status,
          verification_notes: status === "rejected" ? rejectionReasons[f % rejectionReasons.length] : null,
          resubmission_count: status === "rejected" ? 1 : 0,
          uploaded_by: owner.user_id,
          uploaded_at: uploadedAt,
          verified_at: verifiedAt,
          rejected_at: rejectedAt,
        },
      });
      allShopFiles.push(shopFile);

      // Create file verification log
      await prisma.fileVerificationLog.create({
        data: {
          id: uuid(),
          file_id: shopFile.file_id,
          shop_id: shop.shop_id,
          cadmin_id: status !== "uploaded" ? cadmin.cadmin_id : null,
          actor_type: status === "uploaded" ? "owner" : "admin",
          action: status === "uploaded" ? "uploaded" : status,
          reason: status === "rejected" ? shopFile.verification_notes : status === "verified" ? "Document verified" : "Initial upload",
          created_at: status === "uploaded" ? uploadedAt : (verifiedAt || rejectedAt),
        },
      });
    }
  }

  console.log(`✅ Created ${allShopFiles.length} Shop Files\n`);

  // ============================================
  // 6. CREATE PAYMENT TRANSACTIONS
  // ============================================
  console.log("💰 Creating Payment Transactions...");

  const paymentMethods = ["card", "upi", "netbanking"];
  const banks = ["HDFC", "ICICI", "SBI", "Axis"];
  let paymentCount = 0;

  for (const sub of subscriptions) {
    const shop = shops[sub.shopIndex];
    const amount = sub.plan.price;

    if (amount === BigInt(0)) continue;

    let txnStatus;
    switch (sub.config.subscriptionState) {
      case "active":
      case "expiring":
      case "expired":
        txnStatus = "captured";
        break;
      case "grace":
      case "suspended":
      case "pending":
        txnStatus = "pending";
        break;
      case "cancelled":
        txnStatus = "refunded";
        break;
      default:
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

  // Add one failed payment
  await prisma.paymentTransaction.create({
    data: {
      transaction_id: uuid(),
      shop_id: shops[6].shop_id, // Suspended shop
      subscription_id: null,
      provider: "razorpay",
      provider_order_id: `order_${uuid().slice(0, 14)}`,
      provider_payment_id: null,
      amount: preMadePlans.professional.price,
      currency: "INR",
      status: "failed",
      meta: {
        method: "card",
        bank: "HDFC",
        failure_reason: "Insufficient funds",
      },
      created_at: daysAgo(12),
    },
  });
  paymentCount++;

  console.log(`✅ Created ${paymentCount} Payment Transactions\n`);

  // ============================================
  // 7. CREATE STAFF MEMBERS (1 per verified shop with active/expiring subscription)
  // ============================================
  console.log("👷 Creating Staff Members...");

  const staffMembers = [];
  const activeShopIndices = [0, 1, 2, 3]; // First 4 shops (active + expiring)

  for (const shopIndex of activeShopIndices) {
    const shop = shops[shopIndex];
    const firstName = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
    const lastName = LAST_NAMES[nameIndex % LAST_NAMES.length];
    nameIndex++;

    const staff = await prisma.user.create({
      data: {
        user_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: shop.mainBranch.branch_id,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        username: `staff_${firstName.toLowerCase()}${staffMembers.length + 1}`,
        email: `${firstName.toLowerCase()}${staffMembers.length + 1}@staff.example.com`,
        phone_number: `+9191${String(10000000 + staffMembers.length * 1234567).slice(0, 8)}`,
        password_hash: passwordHash,
        login_provider: "password",
        role: "staff",
        status: "verified",
        is_active: true,
        onboarding_step: 12,
        last_login_at: randomDate(daysAgo(7), new Date()),
        created_at: randomDate(daysAgo(60), daysAgo(5)),
      },
    });
    staffMembers.push(staff);
  }

  console.log(`✅ Created ${staffMembers.length} Staff Members\n`);

  const allUsers = [...owners, ...staffMembers];

  // ============================================
  // 8. CREATE USER SESSIONS
  // ============================================
  console.log("🔐 Creating User Sessions...");

  // 2 active sessions
  const activeSessionUsers = allUsers.filter((u) => u.status === "verified").slice(0, 2);
  for (const user of activeSessionUsers) {
    await prisma.userSession.create({
      data: {
        id: uuid(),
        user_id: user.user_id,
        session_token: `session_${uuid()}`,
        device_info: randomFrom(["Windows 10 - Chrome", "MacOS - Safari", "iPhone - Safari"]),
        ip_address: `192.168.${randomBetween(1, 255)}.${randomBetween(1, 255)}`,
        is_active: true,
        created_at: randomDate(daysAgo(2), new Date()),
        last_active_at: new Date(),
        expires_at: daysFromNow(7),
      },
    });
  }

  // 2 expired sessions
  const expiredSessionUsers = allUsers.filter((u) => u.status === "verified").slice(2, 4);
  for (const user of expiredSessionUsers) {
    const createdAt = randomDate(daysAgo(30), daysAgo(5));
    const endedAt = randomDate(createdAt, daysAgo(1));
    await prisma.userSession.create({
      data: {
        id: uuid(),
        user_id: user.user_id,
        session_token: `session_expired_${uuid()}`,
        device_info: "Windows 10 - Chrome",
        ip_address: `10.0.${randomBetween(1, 255)}.${randomBetween(1, 255)}`,
        is_active: false,
        created_at: createdAt,
        last_active_at: endedAt,
        expires_at: daysAgo(1),
        ended_at: endedAt,
        ended_reason: randomFrom(["logout", "expired"]),
      },
    });
  }

  console.log("✅ Created 4 User Sessions (2 active, 2 ended)\n");

  // ============================================
  // 9. CREATE USER ACTIVITY LOGS
  // ============================================
  console.log("📝 Creating User Activity Logs...");

  let activityCount = 0;
  const userActions = [
    { action: "login", description: "User logged in" },
    { action: "logout", description: "User logged out" },
    { action: "profile_update", description: "Updated profile" },
  ];

  for (const user of allUsers.filter((u) => u.status === "verified").slice(0, 6)) {
    for (const actionData of userActions) {
      await prisma.activityLog.create({
        data: {
          activity_id: uuid(),
          user_id: user.user_id,
          action: actionData.action,
          description: actionData.description,
          ip_address: `192.168.${randomBetween(1, 255)}.${randomBetween(1, 255)}`,
          user_agent: randomFrom(USER_AGENTS),
          created_at: randomDate(daysAgo(30), new Date()),
        },
      });
      activityCount++;
    }
  }

  console.log(`✅ Created ${activityCount} User Activity Logs\n`);

  // ============================================
  // 10. CREATE DELETION LOG
  // ============================================
  console.log("🗑️ Creating Deletion Log...");

  await prisma.deletionLog.create({
    data: {
      id: uuid(),
      user_id: uuid(),
      email: "deleted_user@example.com",
      username: "deleted_user_1",
      reason: "user_request",
      files_deleted: 3,
      deleted_at: daysAgo(30),
    },
  });

  console.log("✅ Created 1 Deletion Log\n");

    // ============================================
  // 11. CREATE TICKETS (6 tickets - one of each status + 1 reopened)
  // ============================================
  console.log("🎫 Creating Tickets...");

  const ticketConfigs = [
    // PENDING
    {
      status: "PENDING",
      category: "TECHNICAL_ISSUE",
      shopIndex: 0,
      hasAttachment: true,
      reopened: false,
      cancelled: false,
    },
    // IN_PROGRESS
    {
      status: "IN_PROGRESS",
      category: "BILLING_ISSUE",
      shopIndex: 1,
      hasAttachment: false,
      reopened: false,
      cancelled: false,
    },
    // RESOLVED
    {
      status: "RESOLVED",
      category: "ACCOUNT_ISSUE",
      shopIndex: 2,
      hasAttachment: true,
      reopened: false,
      cancelled: false,
    },
    // CLOSED
    {
      status: "CLOSED",
      category: "FEATURE_REQUEST",
      shopIndex: 3,
      hasAttachment: false,
      reopened: false,
      cancelled: false,
    },
    // CANCELLED
    {
      status: "CANCELLED",
      category: "OTHER",
      shopIndex: 4,
      hasAttachment: false,
      reopened: false,
      cancelled: true,
    },
    // REOPENED (was resolved, now in progress again)
    {
      status: "IN_PROGRESS",
      category: "TECHNICAL_ISSUE",
      shopIndex: 0,
      hasAttachment: true,
      reopened: true,
      cancelled: false,
    },
  ];

  const allTickets = [];
  const preferredSlots = ["morning", "afternoon", "evening", "anytime"];

  for (let i = 0; i < ticketConfigs.length; i++) {
    const config = ticketConfigs[i];
    const shop = shops[config.shopIndex];
    const owner = owners[config.shopIndex];

    const ticketNumber = generateTicketNumber();
    const createdAt = randomDate(daysAgo(30), daysAgo(3));

    // Cancellation details
    let cancelledAt = null;
    let cancelledById = null;
    let cancellationReason = null;

    if (config.cancelled) {
      cancelledAt = randomDate(createdAt, daysAgo(1));
      cancelledById = owner.user_id;
      cancellationReason = "Issue resolved on its own";
    }

    // Reopen details
    let reopenedAt = null;
    let reopenedById = null;
    let reopenCount = 0;
    let reopenReason = null;

    if (config.reopened) {
      reopenedAt = randomDate(daysAgo(5), daysAgo(1));
      reopenedById = owner.user_id;
      reopenCount = 1;
      reopenReason = "Issue reoccurred after initial resolution";
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticket_id: uuid(),
        ticket_number: ticketNumber,
        shop_id: shop.shop_id,
        branch_id: shop.mainBranch.branch_id,
        created_by_user_id: owner.user_id,
        contact_number: owner.phone_number,
        category: config.category,
        subject: TICKET_SUBJECTS[i % TICKET_SUBJECTS.length],
        description: TICKET_DESCRIPTIONS[i % TICKET_DESCRIPTIONS.length],
        other_category_text: config.category === "OTHER" ? "Custom category issue" : null,
        preferred_slot: randomFrom(preferredSlots),
        status: config.status,
        admin_notes: config.status !== "PENDING" ? "Reviewed by admin" : null,
        cancelled_at: cancelledAt,
        cancelled_by_id: cancelledById,
        cancellation_reason: cancellationReason,
        reopened_at: reopenedAt,
        reopened_by_id: reopenedById,
        reopen_count: reopenCount,
        reopen_reason: reopenReason,
        created_at: createdAt,
      },
    });

    allTickets.push({ ...ticket, config, owner, createdAt });

    // Create attachment if needed
    if (config.hasAttachment) {
      await prisma.ticketAttachment.create({
        data: {
          attachment_id: uuid(),
          ticket_id: ticket.ticket_id,
          storage_key: `tickets/${ticket.ticket_id}/screenshot.png`,
          original_name: "screenshot.png",
          mime_type: "image/png",
          file_size: randomBetween(50000, 500000),
          uploaded_at: createdAt,
        },
      });
    }

    // Create status history
    const statusHistory = [];

    // Initial creation - always PENDING
    statusHistory.push({
      from: null,
      to: "PENDING",
      changedByType: "USER",
      changedById: owner.user_id,
      changedByName: owner.full_name,
      note: "Ticket created",
      createdAt: createdAt,
    });

    // Build status flow based on current status
    if (config.status === "IN_PROGRESS" && !config.reopened) {
      statusHistory.push({
        from: "PENDING",
        to: "IN_PROGRESS",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Ticket is being reviewed",
        createdAt: randomDate(createdAt, daysAgo(1)),
      });
    }

    if (config.status === "RESOLVED") {
      statusHistory.push({
        from: "PENDING",
        to: "IN_PROGRESS",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Started working on the issue",
        createdAt: randomDate(createdAt, daysAgo(5)),
      });
      statusHistory.push({
        from: "IN_PROGRESS",
        to: "RESOLVED",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Issue has been resolved",
        createdAt: randomDate(daysAgo(5), daysAgo(2)),
      });
    }

    if (config.status === "CLOSED") {
      statusHistory.push({
        from: "PENDING",
        to: "IN_PROGRESS",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Ticket picked up",
        createdAt: randomDate(createdAt, daysAgo(10)),
      });
      statusHistory.push({
        from: "IN_PROGRESS",
        to: "RESOLVED",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Resolution provided",
        createdAt: randomDate(daysAgo(10), daysAgo(5)),
      });
      statusHistory.push({
        from: "RESOLVED",
        to: "CLOSED",
        changedByType: "USER",
        changedById: owner.user_id,
        changedByName: owner.full_name,
        note: "User confirmed issue is resolved",
        createdAt: randomDate(daysAgo(5), daysAgo(1)),
      });
    }

    if (config.cancelled) {
      statusHistory.push({
        from: "PENDING",
        to: "CANCELLED",
        changedByType: "USER",
        changedById: owner.user_id,
        changedByName: owner.full_name,
        note: cancellationReason,
        createdAt: cancelledAt,
      });
    }

    if (config.reopened) {
      statusHistory.push({
        from: "PENDING",
        to: "IN_PROGRESS",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Initial review started",
        createdAt: randomDate(createdAt, daysAgo(15)),
      });
      statusHistory.push({
        from: "IN_PROGRESS",
        to: "RESOLVED",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Issue resolved",
        createdAt: randomDate(daysAgo(15), daysAgo(8)),
      });
      statusHistory.push({
        from: "RESOLVED",
        to: "IN_PROGRESS",
        changedByType: "USER",
        changedById: owner.user_id,
        changedByName: owner.full_name,
        note: reopenReason,
        createdAt: reopenedAt,
      });
    }

    // Create all status history entries
    for (const entry of statusHistory) {
      await prisma.ticketStatusHistory.create({
        data: {
          id: uuid(),
          ticket_id: ticket.ticket_id,
          changed_by_type: entry.changedByType,
          changed_by_id: entry.changedById,
          changed_by_name: entry.changedByName,
          from_status: entry.from,
          to_status: entry.to,
          note: entry.note,
          created_at: entry.createdAt,
        },
      });

      // Add CAdmin activity log for admin status changes
      if (entry.changedByType === "CADMIN") {
        await prisma.cAdminActivityLog.create({
          data: {
            id: uuid(),
            cadmin_id: cadmin.cadmin_id,
            action: "ticket_status_changed",
            description: `Changed ticket ${ticketNumber} from ${entry.from || "NEW"} to ${entry.to}`,
            meta: {
              ticket_id: ticket.ticket_id,
              ticket_number: ticketNumber,
              from_status: entry.from,
              to_status: entry.to,
            },
            ip_address: `192.168.1.${randomBetween(1, 255)}`,
            user_agent: randomFrom(USER_AGENTS),
            created_at: entry.createdAt,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${allTickets.length} Tickets with status history\n`);

  // ============================================
  // 12. CREATE ENQUIRIES (4 enquiries - one of each status)
  // ============================================
  console.log("📨 Creating Enquiries...");

  const enquiryConfigs = [
    { status: "PENDING", hasReply: false },
    { status: "IN_PROGRESS", hasReply: false },
    { status: "REPLIED", hasReply: true },
    { status: "CLOSED", hasReply: true },
  ];

  const enquiryNames = [
    "Rajan Malhotra",
    "Sunita Kapoor",
    "Vikrant Chadha",
    "Meena Iyer",
  ];

  const allEnquiries = [];

  for (let i = 0; i < enquiryConfigs.length; i++) {
    const config = enquiryConfigs[i];
    const enquiryNumber = generateEnquiryNumber();
    const createdAt = randomDate(daysAgo(45), daysAgo(2));

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiry_id: uuid(),
        enquiry_number: enquiryNumber,
        name: enquiryNames[i],
        email: `${enquiryNames[i].toLowerCase().replace(" ", ".")}@enquiry.example.com`,
        phone: i % 2 === 0 ? `+9199${String(10000000 + i * 1111111).slice(0, 8)}` : null,
        message: ENQUIRY_MESSAGES[i % ENQUIRY_MESSAGES.length],
        status: config.status,
        created_at: createdAt,
      },
    });

    allEnquiries.push({ ...enquiry, config, createdAt });

    // Create reply if needed
    if (config.hasReply) {
      const repliedAt = randomDate(createdAt, daysAgo(1));

      await prisma.enquiryReply.create({
        data: {
          reply_id: uuid(),
          enquiry_id: enquiry.enquiry_id,
          replied_by_id: cadmin.cadmin_id,
          subject: "Re: Your Enquiry about Cureli",
          message: "Thank you for reaching out! We're excited about your interest in Cureli. Our pricing starts at ₹4,990/year for the Starter plan.",
          email_sent: true,
          email_sent_at: repliedAt,
          created_at: repliedAt,
        },
      });

      // Add CAdmin activity log for reply
      await prisma.cAdminActivityLog.create({
        data: {
          id: uuid(),
          cadmin_id: cadmin.cadmin_id,
          action: "enquiry_replied",
          description: `Replied to enquiry ${enquiryNumber}`,
          meta: {
            enquiry_id: enquiry.enquiry_id,
            enquiry_number: enquiryNumber,
          },
          ip_address: `192.168.1.${randomBetween(1, 255)}`,
          user_agent: randomFrom(USER_AGENTS),
          created_at: repliedAt,
        },
      });
    }
  }

  console.log(`✅ Created ${allEnquiries.length} Enquiries\n`);

  // ============================================
  // FINAL SUMMARY
  // ============================================

  const totalUsers = owners.length + staffMembers.length;

  console.log("═".repeat(60));
  console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
  console.log("═".repeat(60));

  console.log("\n📊 SUMMARY:\n");

  console.log("👤 USERS:");
  console.log(`   • CAdmin: 1`);
  console.log(`   • Pending Users: 2`);
  console.log(`   • Shop Owners: ${owners.length}`);
  console.log(`   • Staff Members: ${staffMembers.length}`);
  console.log(`   • Total in User table: ${totalUsers}`);
  console.log(`   • User Sessions: 4 (2 active, 2 ended)`);

  console.log("\n🏪 SHOPS & BRANCHES:");
  console.log(`   • Shops: ${shops.length}`);
  console.log(`   • Branches: ${shops.length} (1 main branch per shop)`);

  console.log("\n📦 PLANS:");
  console.log(`   • PRE-MADE Plans: 10`);
  console.log("     - ACTIVE: 6 (Free, Starter, Professional, Launch Special, Diwali Special, Ultimate)");
  console.log("     - DEPRECATED: 1 (Enterprise)");
  console.log("     - SUSPENDED: 2 (Basic Old, Legacy Pro - 1 soft deleted)");
  console.log("     - DRAFT: 1 (Premium Plus)");

  console.log("\n💳 SUBSCRIPTION STATES (2 shops each):");
  console.log("   ✅ ACTIVE: 2 shops (plenty of time left)");
  console.log("   ⏰ EXPIRING: 2 shops (within 7 days)");
  console.log("   ⚠️  GRACE PERIOD: 2 shops (past end date, within 7-day grace)");
  console.log("   🚫 SUSPENDED: 2 shops (grace period ended)");
  console.log("   📅 EXPIRED: 2 shops (old subscriptions)");
  console.log("   ❌ CANCELLED: 2 shops");
  console.log("   📝 NONE/PENDING: 2 shops");

  console.log("\n📋 VERIFICATION STATES:");
  console.log("   ✅ Verified: 10 shops");
  console.log("   ⏳ Pending Review: 2 shops");
  console.log("   ❌ Rejected: 2 shops");

  console.log("\n📄 FILES & PAYMENTS:");
  console.log(`   • Shop Files: ${allShopFiles.length} (6 per shop)`);
  console.log(`   • Payment Transactions: ${paymentCount}`);

  console.log("\n🎫 TICKETS:");
  console.log(`   • Total: ${allTickets.length}`);
  console.log("     - PENDING: 1");
  console.log("     - IN_PROGRESS: 1");
  console.log("     - RESOLVED: 1");
  console.log("     - CLOSED: 1");
  console.log("     - CANCELLED: 1");
  console.log("     - REOPENED: 1");

  console.log("\n📨 ENQUIRIES:");
  console.log(`   • Total: ${allEnquiries.length}`);
  console.log("     - PENDING: 1");
  console.log("     - IN_PROGRESS: 1");
  console.log("     - REPLIED: 1");
  console.log("     - CLOSED: 1");

  console.log("\n" + "═".repeat(60));
  console.log("🔐 LOGIN CREDENTIALS:");
  console.log("═".repeat(60));
  console.log("   CAdmin: cadmin / Admin@123");
  console.log("   All Users: Password123!");
  console.log("═".repeat(60));

  console.log("\n🎯 SUBSCRIPTION DETAILS:");
  console.log("═".repeat(60));
  
  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i];
    const config = shop.config;
    const sub = subscriptions.find(s => s.shopIndex === i);
    
    let stateEmoji = "❓";
    let stateDetails = "";
    
    switch (config.subscriptionState) {
      case "active":
        stateEmoji = "✅";
        stateDetails = `ends in ${config.daysUntilEnd} days`;
        break;
      case "expiring":
        stateEmoji = "⏰";
        stateDetails = `ends in ${config.daysUntilEnd} days`;
        break;
      case "grace":
        stateEmoji = "⚠️";
        stateDetails = `${GRACE_PERIOD_DAYS - config.daysPastEnd} days of grace left`;
        break;
      case "suspended":
        stateEmoji = "🚫";
        stateDetails = `suspended ${config.daysPastGrace} days ago`;
        break;
      case "expired":
        stateEmoji = "📅";
        stateDetails = `expired ${config.daysPastEnd} days ago`;
        break;
      case "cancelled":
        stateEmoji = "❌";
        stateDetails = `cancelled ${config.daysCancelledAgo} days ago`;
        break;
      case "pending":
        stateEmoji = "📝";
        stateDetails = "awaiting payment";
        break;
      case "none":
        stateEmoji = "➖";
        stateDetails = "no subscription";
        break;
    }
    
    console.log(`   ${stateEmoji} ${shop.business_name}`);
    console.log(`      State: ${config.subscriptionState.toUpperCase()} (${stateDetails})`);
    console.log(`      Verification: ${config.verification}`);
    if (config.plan) {
      console.log(`      Plan: ${config.plan}`);
    }
    console.log("");
  }

  console.log("═".repeat(60));
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