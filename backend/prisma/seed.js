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

// Ticket number generator: TKT-E132-00001
let ticketCounter = 0;
const generateTicketNumber = () => {
  ticketCounter++;
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${randomPart}-${String(ticketCounter).padStart(5, "0")}`;
};

// Enquiry number generator: ENQ-20260112-0001
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
  "Tiwari", "Bose", "Chatterjee", "Menon", "Patil", "Shinde", "Jadhav", "More",
  "Pawar", "Sawant", "Gaikwad", "Bhosale", "Chavan", "Kale", "Agarwal", "Bansal",
];

const SHOP_NAMES = [
  "HealthMax Pharmacy", "PharmaCorp Stores", "MediChain Pharma",
  "Apollo Medicals", "LifeCare Pharmacy", "Wellness Chemist",
  "CureWell Drugs", "MediPlus Store", "Remedy Pharmacy",
  "VitalHealth Chemist", "PharmaZone", "QuickMeds",
  "NewStart Pharmacy", "Heritage Medicals", "OldTimer Chemist",
];

const STREET_NAMES = [
  "MG Road", "Station Road", "Main Street", "Market Lane", "Commercial Complex",
  "Link Road", "Highway Junction", "Industrial Area", "City Center", "Mall Road",
  "Gandhi Nagar", "Nehru Street", "Park Avenue", "Civil Lines", "Sector 15",
];

const TICKET_SUBJECTS = [
  "Unable to upload documents",
  "Payment failed but amount deducted",
  "Need to add more branches",
  "Login OTP not received",
  "Subscription renewal issue",
  "Branch user cannot access system",
  "GST number update required",
  "Document verification taking too long",
  "Need help with inventory setup",
  "System running slow",
  "Feature request: Export reports",
  "Billing discrepancy found",
  "Account access issue after password reset",
  "Need to change primary contact",
  "Integration support needed",
];

const TICKET_DESCRIPTIONS = [
  "I have been trying to upload my drug license but the system keeps showing an error. Please help.",
  "I made a payment yesterday but my subscription is still showing as pending. Amount was deducted from my account.",
  "Our business has grown and we need to add 2 more branches. Please guide on how to upgrade.",
  "I have tried multiple times but I'm not receiving the OTP on my registered mobile number.",
  "My subscription is about to expire and I'm unable to find the renewal option in the dashboard.",
  "I added a new staff member but they are unable to login. Getting 'access denied' error.",
  "We recently updated our GST registration. Need to update the same in the system.",
  "I submitted all documents 5 days ago but still showing as 'under review'. When will it be verified?",
  "This is our first time using the system. Need assistance with initial inventory setup.",
  "The dashboard is taking too long to load. Sometimes it times out completely.",
  "It would be great if we could export our sales reports to Excel. Please consider adding this feature.",
  "The invoice amount doesn't match what was discussed. Please check and correct.",
  "After resetting my password, I'm unable to access my account. It shows 'invalid credentials'.",
  "The primary contact person has changed. Need to update the contact details.",
  "We want to integrate with our existing accounting software. Need technical support.",
];

const ENQUIRY_MESSAGES = [
  "I am interested in your pharmacy management solution. Can you share pricing details?",
  "We have 5 branches across Mumbai. What plan would you recommend for us?",
  "Is there a free trial available? We would like to test before committing.",
  "Do you provide training for staff? How long does the onboarding take?",
  "What kind of customer support do you offer? Is it 24/7?",
  "Can your system handle inventory management for 10,000+ products?",
  "We are looking for a solution with GST compliance. Does your software support this?",
  "What are the payment options available? Do you offer EMI?",
  "Is the data stored securely? What certifications do you have?",
  "Can we migrate our existing data from another software?",
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log("🌱 Starting comprehensive seed...\n");

  // ============================================
  // CLEAR EXISTING DATA (in order of dependencies)
  // ============================================
  console.log("🧹 Clearing existing data...");

  // Clear ticket related
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticket.deleteMany();

  // Clear enquiry related
  await prisma.enquiryReply.deleteMany();
  await prisma.enquiry.deleteMany();

  // Clear sessions
  await prisma.userSession.deleteMany();

  // Clear activity logs
  await prisma.activityLog.deleteMany();
  await prisma.cAdminActivityLog.deleteMany();
  await prisma.fileVerificationLog.deleteMany();

  // Clear shop files
  await prisma.shopFile.deleteMany();

  // Clear payments
  await prisma.paymentTransaction.deleteMany();

  // Clear current_subscription_id first to avoid FK issues
  await prisma.shop.updateMany({
    data: { current_subscription_id: null },
  });

  await prisma.shopSubscription.deleteMany();

  // Clear user references before deleting branches
  await prisma.user.updateMany({
    data: { shop_id: null, branch_id: null },
  });

  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();

  // Clear plan activity logs and plans
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
  console.log("✅ Created CAdmin: cadmin / Admin@123\n");

  // ============================================
  // 2. CREATE CADMIN ACTIVITY LOGS
  // ============================================
  console.log("📋 Creating CAdmin Activity Logs...");

  const cadminActivities = [];

  // Login activities
  for (let i = 0; i < 10; i++) {
    cadminActivities.push({
      id: uuid(),
      cadmin_id: cadmin.cadmin_id,
      performed_by_id: null,
      action: "login",
      description: "Admin logged in successfully",
      meta: { method: "password" },
      ip_address: `192.168.1.${randomBetween(1, 255)}`,
      user_agent: randomFrom(USER_AGENTS),
      created_at: randomDate(daysAgo(30), new Date()),
    });
  }

  // Logout activities
  for (let i = 0; i < 5; i++) {
    cadminActivities.push({
      id: uuid(),
      cadmin_id: cadmin.cadmin_id,
      performed_by_id: null,
      action: "logout",
      description: "Admin logged out",
      meta: null,
      ip_address: `192.168.1.${randomBetween(1, 255)}`,
      user_agent: randomFrom(USER_AGENTS),
      created_at: randomDate(daysAgo(30), new Date()),
    });
  }

  // Password change activity
  cadminActivities.push({
    id: uuid(),
    cadmin_id: cadmin.cadmin_id,
    performed_by_id: cadmin.cadmin_id,
    action: "password_changed",
    description: "Admin password was changed",
    changes: { field: "password_hash" },
    meta: { reason: "routine_update" },
    ip_address: "192.168.1.100",
    user_agent: USER_AGENTS[0],
    created_at: daysAgo(15),
  });

  // Profile update activity
  cadminActivities.push({
    id: uuid(),
    cadmin_id: cadmin.cadmin_id,
    performed_by_id: cadmin.cadmin_id,
    action: "profile_updated",
    description: "Admin profile was updated",
    changes: { phone_number: { from: "9876543210", to: "9961045596" } },
    meta: null,
    ip_address: "192.168.1.100",
    user_agent: USER_AGENTS[0],
    created_at: daysAgo(20),
  });

  await prisma.cAdminActivityLog.createMany({ data: cadminActivities });
  console.log(`✅ Created ${cadminActivities.length} CAdmin Activity Logs\n`);

  // ============================================
  // 3. CREATE PRE-MADE PLANS (10 plans with various combinations)
  // ============================================
  console.log("📦 Creating PRE-MADE plans...");

  // Plan 1: Free Trial (ACTIVE)
  const freePlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Free Trial",
      description: "Perfect for trying out Cureli with basic features for 14 days",
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

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: freePlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: freePlan.name },
        created_at: daysAgo(91),
      },
      {
        id: uuid(),
        plan_id: freePlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(90),
      },
    ],
  });

  // Plan 2: Starter (ACTIVE, featured, with compare_at_price)
  const starterPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Starter",
      description: "Ideal for small pharmacies starting their digital journey",
      type: "PRE_MADE",
      price: BigInt(4990),
      compare_at_price: BigInt(6990), // Show discount
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

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: starterPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: starterPlan.name },
        created_at: daysAgo(91),
      },
      {
        id: uuid(),
        plan_id: starterPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(90),
      },
    ],
  });

  // Plan 3: Professional (ACTIVE, with bonus_months)
  const professionalPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Professional",
      description: "Best for growing pharmacies with multiple branches",
      type: "PRE_MADE",
      price: BigInt(14990),
      compare_at_price: BigInt(17990),
      max_branches: 5,
      max_users: 15,
      billing_cycle_months: 12,
      bonus_months: 2, // 14 months for price of 12
      is_customizable: false,
      is_featured: false,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(90),
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: professionalPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: professionalPlan.name },
        created_at: daysAgo(91),
      },
      {
        id: uuid(),
        plan_id: professionalPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(90),
      },
    ],
  });

  // Plan 4: Enterprise (DEPRECATED - has active subscribers)
  const enterprisePlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Enterprise",
      description: "Complete solution for large pharmacy chains with custom requirements",
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

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: enterprisePlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: enterprisePlan.name },
        created_at: daysAgo(181),
      },
      {
        id: uuid(),
        plan_id: enterprisePlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(180),
      },
      {
        id: uuid(),
        plan_id: enterprisePlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "suspended",
        from_status: "ACTIVE",
        to_status: "DEPRECATED",
        meta: { reason: "Replaced by custom plans", subscriber_count: 2 },
        created_at: daysAgo(30),
      },
    ],
  });

  // Plan 5: Basic Old (SUSPENDED - no subscribers)
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

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: basicOldPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: basicOldPlan.name },
        created_at: daysAgo(201),
      },
      {
        id: uuid(),
        plan_id: basicOldPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(200),
      },
      {
        id: uuid(),
        plan_id: basicOldPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "suspended",
        from_status: "ACTIVE",
        to_status: "SUSPENDED",
        meta: { reason: "No active subscribers, plan retired" },
        created_at: daysAgo(60),
      },
    ],
  });

  // Plan 6: Legacy Pro (SUSPENDED - no subscribers, SOFT DELETED)
  const legacyProPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Legacy Pro",
      description: "Old professional tier - discontinued and deleted",
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
      deleted_at: daysAgo(40), // SOFT DELETED
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: legacyProPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: legacyProPlan.name },
        created_at: daysAgo(151),
      },
      {
        id: uuid(),
        plan_id: legacyProPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(150),
      },
      {
        id: uuid(),
        plan_id: legacyProPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "suspended",
        from_status: "ACTIVE",
        to_status: "SUSPENDED",
        meta: { reason: "Merged into Professional plan" },
        created_at: daysAgo(45),
      },
      {
        id: uuid(),
        plan_id: legacyProPlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "deleted",
        from_status: "SUSPENDED",
        to_status: "SUSPENDED",
        meta: { reason: "Soft deleted - no longer needed" },
        created_at: daysAgo(40),
      },
    ],
  });

  // Plan 7: Promo Plan - Free for 3 months (ACTIVE, promo_free_until in future)
  const promoPlan1 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Launch Special",
      description: "Special launch offer - Free for first 3 months, then regular pricing",
      type: "PRE_MADE",
      price: BigInt(7990),
      compare_at_price: BigInt(9990),
      max_branches: 3,
      max_users: 8,
      billing_cycle_months: 12,
      promo_free_until: daysFromNow(90), // Free for 3 months
      is_customizable: false,
      is_featured: true,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(10),
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: promoPlan1.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: promoPlan1.name, promo: true },
        created_at: daysAgo(11),
      },
      {
        id: uuid(),
        plan_id: promoPlan1.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        meta: { promo_free_until: promoPlan1.promo_free_until },
        created_at: daysAgo(10),
      },
    ],
  });

  // Plan 8: Promo Plan - Expired promo (ACTIVE, promo_free_until in past)
  const promoPlan2 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Diwali Special 2024",
      description: "Diwali offer - Promo period ended, now regular pricing",
      type: "PRE_MADE",
      price: BigInt(5990),
      compare_at_price: BigInt(7990),
      max_branches: 2,
      max_users: 6,
      billing_cycle_months: 12,
      bonus_months: 1,
      promo_free_until: daysAgo(30), // Promo expired
      is_customizable: false,
      is_featured: false,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
      activated_at: daysAgo(60),
    },
  });

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: promoPlan2.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: promoPlan2.name, promo: true },
        created_at: daysAgo(61),
      },
      {
        id: uuid(),
        plan_id: promoPlan2.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(60),
      },
    ],
  });

  // Plan 9: Ultimate (ACTIVE, featured, all features)
  const ultimatePlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Ultimate",
      description: "Everything you need - unlimited branches, premium support",
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

  await prisma.planActivityLog.createMany({
    data: [
      {
        id: uuid(),
        plan_id: ultimatePlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: ultimatePlan.name },
        created_at: daysAgo(31),
      },
      {
        id: uuid(),
        plan_id: ultimatePlan.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(30),
      },
    ],
  });

  // Plan 10: Draft Plan (DRAFT - not yet activated)
  const draftPlan = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "Premium Plus (Draft)",
      description: "Work in progress - Premium tier with extra features",
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

  await prisma.planActivityLog.create({
    data: {
      id: uuid(),
      plan_id: draftPlan.plan_id,
      cadmin_id: cadmin.cadmin_id,
      action: "created",
      to_status: "DRAFT",
      meta: { name: draftPlan.name, note: "Still being finalized" },
      created_at: daysAgo(5),
    },
  });

  console.log("✅ Created 10 PRE-MADE plans:\n");
  console.log("   - 5 ACTIVE (Free Trial, Starter, Professional, Launch Special, Ultimate)");
  console.log("   - 1 ACTIVE with expired promo (Diwali Special 2024)");
  console.log("   - 1 DEPRECATED (Enterprise - has subscribers)");
  console.log("   - 1 SUSPENDED (Basic Old)");
  console.log("   - 1 SUSPENDED + SOFT DELETED (Legacy Pro)");
  console.log("   - 1 DRAFT (Premium Plus)\n");

  // Store plans for later reference
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

    // ============================================
  // 4. CREATE PENDING USERS (5 users in various stages)
  // ============================================
  console.log("⏳ Creating Pending Users...");

  const pendingUsers = [];

  // Pending User 1: Just signed up, email not verified (step 0)
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

  // Pending User 2: Email verified, phone not added (step 1)
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

  // Pending User 3: Phone added, OTP pending (step 2)
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

  // Pending User 4: Google signup, creating password (step 0 for google)
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

  // Pending User 5: Phone verified, username pending (step 3)
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

  // Shop configurations with their expected states
  const shopConfigs = [
    // Shops 1-3: Verified with Custom Plans
    { name: "HealthMax Pharmacy", verification: "verified", subscriptionType: "custom", userStatus: "verified", shopActive: true },
    { name: "PharmaCorp Stores", verification: "verified", subscriptionType: "custom", userStatus: "verified", shopActive: true },
    { name: "MediChain Pharma", verification: "verified", subscriptionType: "custom", userStatus: "verified", shopActive: true },

    // Shops 4-5: Verified with Active Pre-made Plans
    { name: "Apollo Medicals", verification: "verified", subscriptionType: "professional", userStatus: "verified", shopActive: true },
    { name: "LifeCare Pharmacy", verification: "verified", subscriptionType: "starter", userStatus: "verified", shopActive: true },

    // Shop 6: Verified with Trial
    { name: "Wellness Chemist", verification: "verified", subscriptionType: "trial", userStatus: "verified", shopActive: true },

    // Shop 7: Verified with Expired Subscription - SUSPENDED
    { name: "CureWell Drugs", verification: "verified", subscriptionType: "expired", userStatus: "verified", shopActive: false },

    // Shop 8: Verified with Cancelled Subscription - SUSPENDED
    { name: "MediPlus Store", verification: "verified", subscriptionType: "cancelled", userStatus: "verified", shopActive: false },

    // Shop 9: Verified but No Subscription
    { name: "Remedy Pharmacy", verification: "verified", subscriptionType: "none", userStatus: "verified", shopActive: true },

    // Shop 10: Pending Review (docs submitted)
    { name: "VitalHealth Chemist", verification: "pending_review", subscriptionType: "pending", userStatus: "pending_verification", shopActive: true },

    // Shop 11: Partially Rejected - SUSPENDED
    { name: "PharmaZone", verification: "partially_rejected", subscriptionType: "none", userStatus: "pending_verification", shopActive: false },

    // Shop 12: Fully Rejected
    { name: "QuickMeds", verification: "rejected", subscriptionType: "none", userStatus: "pending_verification", shopActive: true },

    // Shop 13: Just Created (pending, no docs)
    { name: "NewStart Pharmacy", verification: "pending", subscriptionType: "none", userStatus: "pending_setup", shopActive: true },

    // Shops 14-15: Verified with Deprecated Enterprise Plan (grandfathered)
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

    // Determine onboarding step based on status
    let onboardingStep = 12; // Completed
    if (config.userStatus === "pending_setup") {
      onboardingStep = 4; // Just created shop, no docs
    } else if (config.userStatus === "pending_verification") {
      onboardingStep = 12; // Docs submitted
    }

    // Create Owner (super_admin)
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
        last_login_at: config.userStatus === "verified" ? randomDate(daysAgo(7), new Date()) : null,
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
        gst_number: config.verification !== "pending"
          ? `${location.state.slice(0, 2).toUpperCase()}${String(10 + i).padStart(2, "0")}ABCD${1234 + i}E${i + 1}Z${i + 5}`
          : null,
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

    // Update owner with shop_id
    await prisma.user.update({
      where: { user_id: owner.user_id },
      data: { shop_id: shop.shop_id },
    });
  }

  console.log(`✅ Created ${shops.length} Shops with ${owners.length} Owners\n`);

  // ============================================
  // 6. CREATE CUSTOM PLANS (3 plans for first 3 shops)
  // ============================================
  console.log("📦 Creating CUSTOM plans...");

  const customPlans = [];

  // Custom Plan 1: For HealthMax Pharmacy
  const customPlan1 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "HealthMax Custom",
      description: "Custom plan tailored for HealthMax Pharmacy chain",
      type: "CUSTOM",
      price: BigInt(8000),
      max_branches: 3,
      max_users: 8,
      billing_cycle_months: 12,
      is_customizable: true,
      is_featured: false,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
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
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: customPlan1.name, type: "CUSTOM", shop_id: shops[0].shop_id },
        created_at: daysAgo(61),
      },
      {
        id: uuid(),
        plan_id: customPlan1.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(60),
      },
    ],
  });

  // Custom Plan 2: For PharmaCorp Stores
  const customPlan2 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "PharmaCorp Custom",
      description: "Custom plan for PharmaCorp retail chain",
      type: "CUSTOM",
      price: BigInt(12000),
      max_branches: 4,
      max_users: 12,
      billing_cycle_months: 12,
      is_customizable: true,
      is_featured: false,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
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
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: customPlan2.name, type: "CUSTOM", shop_id: shops[1].shop_id },
        created_at: daysAgo(46),
      },
      {
        id: uuid(),
        plan_id: customPlan2.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(45),
      },
    ],
  });

  // Custom Plan 3: For MediChain Pharma
  const customPlan3 = await prisma.plan.create({
    data: {
      plan_id: uuid(),
      name: "MediChain Custom",
      description: "Enterprise custom plan for MediChain wholesale operations",
      type: "CUSTOM",
      price: BigInt(25000),
      max_branches: 8,
      max_users: 25,
      billing_cycle_months: 12,
      bonus_months: 2,
      is_customizable: true,
      is_featured: false,
      status: "ACTIVE",
      created_by: cadmin.cadmin_id,
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
        cadmin_id: cadmin.cadmin_id,
        action: "created",
        to_status: "DRAFT",
        meta: { name: customPlan3.name, type: "CUSTOM", shop_id: shops[2].shop_id },
        created_at: daysAgo(31),
      },
      {
        id: uuid(),
        plan_id: customPlan3.plan_id,
        cadmin_id: cadmin.cadmin_id,
        action: "activated",
        from_status: "DRAFT",
        to_status: "ACTIVE",
        created_at: daysAgo(30),
      },
    ],
  });

  console.log(`✅ Created ${customPlans.length} CUSTOM plans\n`);

  // ============================================
  // 7. CREATE BRANCHES (~30 branches)
  // ============================================
  console.log("🏢 Creating Branches...");

  const branches = [];

  for (let shopIndex = 0; shopIndex < shops.length; shopIndex++) {
    const shop = shops[shopIndex];
    const location = INDIAN_CITIES[shopIndex % INDIAN_CITIES.length];

    // Determine number of branches based on shop index
    let branchCount;
    if (shopIndex < 5) {
      branchCount = 3; // Shops 1-5: 3 branches each
    } else if (shopIndex < 10) {
      branchCount = 2; // Shops 6-10: 2 branches each
    } else {
      branchCount = 1; // Shops 11-15: 1 branch each
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
  // 8. CREATE BRANCH ADMINS (10 branch admins)
  // ============================================
  console.log("👨‍💼 Creating Branch Admins...");

  const branchAdmins = [];

  // Get sub-branches that need admins (first 10 sub-branches)
  const subBranches = branches.filter((b) => b.branch_type === "sub").slice(0, 10);

  for (let i = 0; i < subBranches.length; i++) {
    const branch = subBranches[i];
    const shop = shops[branch.shopIndex];
    const firstName = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
    const lastName = LAST_NAMES[nameIndex % LAST_NAMES.length];
    nameIndex++;

    // Branch admins should have same status as shop owner
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
        last_login_at: ownerStatus === "verified" ? randomDate(daysAgo(14), new Date()) : null,
        created_at: randomDate(daysAgo(90), daysAgo(15)),
      },
    });
    branchAdmins.push(branchAdmin);
  }

  console.log(`✅ Created ${branchAdmins.length} Branch Admins\n`);

  // ============================================
  // 9. CREATE STAFF MEMBERS (18 staff)
  // ============================================
  console.log("👷 Creating Staff Members...");

  const staffMembers = [];

  // Distribute staff across verified shops (shops 0-8 are verified or have completed onboarding)
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
        is_active: i < 16, // 2 inactive staff for variety
        onboarding_step: 12,
        last_login_at: i < 16 ? randomDate(daysAgo(7), new Date()) : null,
        created_at: randomDate(daysAgo(60), daysAgo(5)),
      },
    });
    staffMembers.push(staff);
  }

  console.log(`✅ Created ${staffMembers.length} Staff Members\n`);

  // All users combined
  const allUsers = [...owners, ...branchAdmins, ...staffMembers];
  console.log(`📊 Total Users in User table: ${allUsers.length}\n`);

  // ============================================
  // 10. CREATE SHOP FILES (Documents)
  // ============================================
  console.log("📄 Creating Shop Files...");

  let fileCount = 0;
  const allShopFiles = [];

  for (let shopIndex = 0; shopIndex < shops.length; shopIndex++) {
    const shop = shops[shopIndex];
    const owner = owners[shopIndex];
    const config = shop.config;

    // Skip shop 13 (NewStart Pharmacy) - no docs yet
    if (config.verification === "pending") {
      continue;
    }

    // Determine file statuses based on shop verification
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

    for (let f = 0; f < FILE_TYPES.length; f++) {
      const fileType = FILE_TYPES[f];
      const status = fileStatuses[f];

      const uploadedAt = randomDate(daysAgo(60), daysAgo(20));
      const verifiedAt = status === "verified" ? randomDate(uploadedAt, daysAgo(5)) : null;
      const rejectedAt = status === "rejected" ? randomDate(uploadedAt, daysAgo(5)) : null;

      const rejectionReasons = [
        "Document is expired. Please upload a valid document.",
        "Image quality is poor. Please upload a clearer image.",
        "Document information doesn't match business details.",
        "Required stamps/signatures are missing.",
        "Document appears to be tampered. Please upload original.",
        "Wrong document type uploaded.",
      ];

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
    }
  }

  console.log(`✅ Created ${fileCount} Shop Files\n`);

  // ============================================
  // 11. CREATE FILE VERIFICATION LOGS
  // ============================================
  console.log("📋 Creating File Verification Logs...");

  let verificationLogCount = 0;

  for (const file of allShopFiles) {
    // Create upload log for all files
    await prisma.fileVerificationLog.create({
      data: {
        id: uuid(),
        file_id: file.file_id,
        shop_id: file.shop_id,
        cadmin_id: null,
        actor_type: "owner",
        action: "uploaded",
        reason: "Initial document upload",
        meta: { file_type: file.file_type },
        created_at: file.uploaded_at,
      },
    });
    verificationLogCount++;

    // Create verification/rejection log
    if (file.status === "verified") {
      await prisma.fileVerificationLog.create({
        data: {
          id: uuid(),
          file_id: file.file_id,
          shop_id: file.shop_id,
          cadmin_id: cadmin.cadmin_id,
          actor_type: "admin",
          action: "verified",
          reason: "Document verified successfully",
          meta: { verified_by: "cadmin" },
          created_at: file.verified_at,
        },
      });
      verificationLogCount++;

      // Add CAdmin activity log for file verification
      await prisma.cAdminActivityLog.create({
        data: {
          id: uuid(),
          cadmin_id: cadmin.cadmin_id,
          action: "file_verified",
          description: `Verified ${file.file_type} for shop`,
          meta: { file_id: file.file_id, shop_id: file.shop_id, file_type: file.file_type },
          ip_address: `192.168.1.${randomBetween(1, 255)}`,
          user_agent: randomFrom(USER_AGENTS),
          created_at: file.verified_at,
        },
      });
    } else if (file.status === "rejected") {
      await prisma.fileVerificationLog.create({
        data: {
          id: uuid(),
          file_id: file.file_id,
          shop_id: file.shop_id,
          cadmin_id: cadmin.cadmin_id,
          actor_type: "admin",
          action: "rejected",
          reason: file.verification_notes,
          meta: { rejected_by: "cadmin" },
          created_at: file.rejected_at,
        },
      });
      verificationLogCount++;

      // Add CAdmin activity log for file rejection
      await prisma.cAdminActivityLog.create({
        data: {
          id: uuid(),
          cadmin_id: cadmin.cadmin_id,
          action: "file_rejected",
          description: `Rejected ${file.file_type} for shop`,
          meta: { file_id: file.file_id, shop_id: file.shop_id, reason: file.verification_notes },
          ip_address: `192.168.1.${randomBetween(1, 255)}`,
          user_agent: randomFrom(USER_AGENTS),
          created_at: file.rejected_at,
        },
      });
    }
  }

  console.log(`✅ Created ${verificationLogCount} File Verification Logs\n`);

  // ============================================
  // 12. CREATE USER SESSIONS (Active + Expired)
  // ============================================
  console.log("🔐 Creating User Sessions...");

  const sessions = [];

  // Active sessions for some verified users (5 active)
  const activeSessionUsers = allUsers.filter((u) => u.status === "verified" && u.is_active).slice(0, 5);

  for (let i = 0; i < activeSessionUsers.length; i++) {
    const user = activeSessionUsers[i];
    const session = await prisma.userSession.create({
      data: {
        id: uuid(),
        user_id: user.user_id,
        session_token: `session_${uuid()}`,
        device_info: randomFrom([
          "Windows 10 - Chrome 120",
          "MacOS Sonoma - Safari 17",
          "iPhone 15 - Safari",
          "Android 14 - Chrome Mobile",
          "Windows 11 - Firefox 121",
        ]),
        ip_address: `192.168.${randomBetween(1, 255)}.${randomBetween(1, 255)}`,
        is_active: true,
        created_at: randomDate(daysAgo(2), new Date()),
        last_active_at: randomDate(daysAgo(1), new Date()),
        expires_at: daysFromNow(7),
        ended_at: null,
        ended_reason: null,
      },
    });
    sessions.push(session);
  }

  // Expired/ended sessions (8 ended)
  const expiredSessionUsers = allUsers.filter((u) => u.status === "verified").slice(5, 13);

  for (let i = 0; i < expiredSessionUsers.length; i++) {
    const user = expiredSessionUsers[i];
    const endedReason = randomFrom(["logout", "expired", "replaced", "admin_force"]);
    const createdAt = randomDate(daysAgo(30), daysAgo(5));
    const endedAt = randomDate(createdAt, daysAgo(1));

    const session = await prisma.userSession.create({
      data: {
        id: uuid(),
        user_id: user.user_id,
        session_token: `session_expired_${uuid()}`,
        device_info: randomFrom([
          "Windows 10 - Chrome 119",
          "MacOS Ventura - Safari 16",
          "iPhone 14 - Safari",
          "Android 13 - Chrome Mobile",
        ]),
        ip_address: `10.0.${randomBetween(1, 255)}.${randomBetween(1, 255)}`,
        is_active: false,
        created_at: createdAt,
        last_active_at: endedAt,
        expires_at: endedReason === "expired" ? daysAgo(randomBetween(1, 5)) : daysFromNow(randomBetween(1, 7)),
        ended_at: endedAt,
        ended_reason: endedReason,
      },
    });
    sessions.push(session);
  }

  console.log(`✅ Created ${sessions.length} User Sessions (5 active, 8 ended)\n`);

    // ============================================
  // 13. CREATE SUBSCRIPTIONS
  // ============================================
  console.log("💳 Creating Subscriptions...");

  const subscriptions = [];

  for (let shopIndex = 0; shopIndex < shops.length; shopIndex++) {
    const shop = shops[shopIndex];
    const config = shop.config;

    // Skip shops with no subscription
    if (config.subscriptionType === "none") {
      continue;
    }

    let plan;
    let status;
    let paymentStatus;
    let startDate;
    let endDate;
    let isActive;

    switch (config.subscriptionType) {
      case "custom":
        plan = customPlans[shopIndex];
        status = "active";
        paymentStatus = "paid";
        startDate = daysAgo(60 - shopIndex * 10);
        endDate = daysFromNow(305 + shopIndex * 10);
        isActive = true;
        break;

      case "professional":
        plan = preMadePlans.professional;
        status = "active";
        paymentStatus = "paid";
        startDate = daysAgo(45);
        endDate = daysFromNow(320);
        isActive = true;
        break;

      case "starter":
        plan = preMadePlans.starter;
        status = "active";
        paymentStatus = "paid";
        startDate = daysAgo(30);
        endDate = daysFromNow(335);
        isActive = true;
        break;

      case "trial":
        plan = preMadePlans.free;
        status = "trial";
        paymentStatus = "paid";
        startDate = daysAgo(7);
        endDate = daysFromNow(7);
        isActive = true;
        break;

      case "expired":
        plan = preMadePlans.starter;
        status = "expired";
        paymentStatus = "paid";
        startDate = daysAgo(400);
        endDate = daysAgo(35);
        isActive = false;
        break;

      case "cancelled":
        plan = preMadePlans.professional;
        status = "cancelled";
        paymentStatus = "paid";
        startDate = daysAgo(200);
        endDate = daysAgo(20);
        isActive = false;
        break;

      case "pending":
        plan = preMadePlans.starter;
        status = "pending";
        paymentStatus = "pending";
        startDate = new Date();
        endDate = daysFromNow(365);
        isActive = false;
        break;

      case "enterprise":
        plan = preMadePlans.enterprise;
        status = "active";
        paymentStatus = "paid";
        startDate = daysAgo(150);
        endDate = daysFromNow(215);
        isActive = true;
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
        is_active: isActive,
        created_at: startDate,
      },
    });
    subscriptions.push({ ...subscription, shopIndex, plan });

    // Update shop with current subscription
    await prisma.shop.update({
      where: { shop_id: shop.shop_id },
      data: { current_subscription_id: subscription.subscription_id },
    });
  }

  console.log(`✅ Created ${subscriptions.length} Subscriptions\n`);

  // ============================================
  // 14. CREATE HISTORICAL SUBSCRIPTIONS
  // ============================================
  console.log("📜 Creating Historical Subscriptions...");

  let historicalCount = 0;
  const shopsWithHistory = [0, 1, 3, 4];

  for (const shopIndex of shopsWithHistory) {
    const shop = shops[shopIndex];

    await prisma.shopSubscription.create({
      data: {
        subscription_id: uuid(),
        shop_id: shop.shop_id,
        plan_id: preMadePlans.starter.plan_id,
        status: "expired",
        billing_cycle: "yearly",
        payment_status: "paid",
        start_date: daysAgo(450),
        end_date: daysAgo(85),
        renewal_date: daysAgo(115),
        branch_limit_snapshot: preMadePlans.starter.max_branches,
        user_limit_snapshot: preMadePlans.starter.max_users,
        is_active: false,
        created_at: daysAgo(450),
      },
    });
    historicalCount++;
  }

  console.log(`✅ Created ${historicalCount} Historical Subscriptions\n`);

  // ============================================
  // 15. CREATE PAYMENT TRANSACTIONS
  // ============================================
  console.log("💰 Creating Payment Transactions...");

  const paymentMethods = ["card", "upi", "netbanking"];
  const banks = ["HDFC", "ICICI", "SBI", "Axis", "Kotak"];
  let paymentCount = 0;

  for (const sub of subscriptions) {
    const shop = shops[sub.shopIndex];
    const amount = sub.plan.price;

    if (amount === BigInt(0)) {
      continue;
    }

    let txnStatus;
    switch (sub.status) {
      case "active":
      case "expired":
      case "cancelled":
        txnStatus = "captured";
        break;
      case "pending":
        txnStatus = "pending";
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

  // Failed payment attempts
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

  // Historical payments
  for (const shopIndex of shopsWithHistory) {
    const shop = shops[shopIndex];

    await prisma.paymentTransaction.create({
      data: {
        transaction_id: uuid(),
        shop_id: shop.shop_id,
        subscription_id: null,
        provider: "razorpay",
        provider_order_id: `order_${uuid().slice(0, 14)}`,
        provider_payment_id: `pay_${uuid().slice(0, 14)}`,
        amount: preMadePlans.starter.price,
        currency: "INR",
        status: "captured",
        meta: {
          method: randomFrom(paymentMethods),
          bank: randomFrom(banks),
          note: "Previous subscription payment",
        },
        created_at: daysAgo(450),
      },
    });
    paymentCount++;
  }

  console.log(`✅ Created ${paymentCount} Payment Transactions\n`);

  // ============================================
  // 16. CREATE USER ACTIVITY LOGS
  // ============================================
  console.log("📝 Creating User Activity Logs...");

  const userActions = [
    { action: "login", description: "User logged in successfully" },
    { action: "logout", description: "User logged out" },
    { action: "profile_update", description: "Updated profile information" },
    { action: "password_change", description: "Password was changed" },
    { action: "file_upload", description: "Uploaded a document" },
    { action: "subscription_view", description: "Viewed subscription details" },
    { action: "branch_view", description: "Viewed branch details" },
    { action: "settings_update", description: "Updated settings" },
  ];

  let activityCount = 0;

  for (const user of allUsers) {
    if (user.status !== "verified" || !user.is_active) {
      continue;
    }

    const logsForUser = randomBetween(3, 8);

    for (let a = 0; a < logsForUser; a++) {
      const actionData = userActions[a % userActions.length];

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
  // 17. CREATE DELETION LOGS
  // ============================================
  console.log("🗑️ Creating Deletion Logs...");

  const deletionReasons = [
    { reason: "inactivity", days: 90 },
    { reason: "user_request", days: null },
    { reason: "incomplete_onboarding", days: 30 },
    { reason: "duplicate_account", days: null },
    { reason: "policy_violation", days: null },
  ];

  for (let i = 0; i < 5; i++) {
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

  console.log(`✅ Created 5 Deletion Logs\n`);

  // ============================================
  // 18. CREATE TICKETS (15 tickets with various statuses)
  // ============================================
  console.log("🎫 Creating Tickets...");

  const allTickets = [];
  const ticketConfigs = [
    // PENDING tickets (3)
    { status: "PENDING", category: "TECHNICAL_ISSUE", shopIndex: 0, hasAttachment: true, reopened: false, cancelled: false },
    { status: "PENDING", category: "BILLING_ISSUE", shopIndex: 1, hasAttachment: false, reopened: false, cancelled: false },
    { status: "PENDING", category: "OTHER", shopIndex: 2, hasAttachment: true, reopened: false, cancelled: false },

    // IN_PROGRESS tickets (3)
    { status: "IN_PROGRESS", category: "ACCOUNT_ISSUE", shopIndex: 3, hasAttachment: false, reopened: false, cancelled: false },
    { status: "IN_PROGRESS", category: "TECHNICAL_ISSUE", shopIndex: 4, hasAttachment: true, reopened: false, cancelled: false },
    { status: "IN_PROGRESS", category: "FEATURE_REQUEST", shopIndex: 5, hasAttachment: false, reopened: false, cancelled: false },

    // RESOLVED tickets (3)
    { status: "RESOLVED", category: "BILLING_ISSUE", shopIndex: 0, hasAttachment: true, reopened: false, cancelled: false },
    { status: "RESOLVED", category: "TECHNICAL_ISSUE", shopIndex: 1, hasAttachment: false, reopened: false, cancelled: false },
    { status: "RESOLVED", category: "ACCOUNT_ISSUE", shopIndex: 3, hasAttachment: false, reopened: false, cancelled: false },

    // CLOSED tickets (3)
    { status: "CLOSED", category: "FEATURE_REQUEST", shopIndex: 4, hasAttachment: false, reopened: false, cancelled: false },
    { status: "CLOSED", category: "OTHER", shopIndex: 5, hasAttachment: true, reopened: false, cancelled: false },
    { status: "CLOSED", category: "TECHNICAL_ISSUE", shopIndex: 13, hasAttachment: false, reopened: false, cancelled: false },

    // CANCELLED tickets (2)
    { status: "CANCELLED", category: "BILLING_ISSUE", shopIndex: 2, hasAttachment: false, reopened: false, cancelled: true },
    { status: "CANCELLED", category: "TECHNICAL_ISSUE", shopIndex: 14, hasAttachment: false, reopened: false, cancelled: true },

    // REOPENED ticket (1) - was RESOLVED, now IN_PROGRESS again
    { status: "IN_PROGRESS", category: "TECHNICAL_ISSUE", shopIndex: 0, hasAttachment: true, reopened: true, cancelled: false },
  ];

  const preferredSlots = ["morning", "afternoon", "evening", "anytime"];

  for (let i = 0; i < ticketConfigs.length; i++) {
    const config = ticketConfigs[i];
    const shop = shops[config.shopIndex];
    const owner = owners[config.shopIndex];
    const shopBranches = branches.filter((b) => b.shopIndex === config.shopIndex);
    const branch = shopBranches.length > 0 ? shopBranches[0] : null;

    const ticketNumber = generateTicketNumber();
    const createdAt = randomDate(daysAgo(30), daysAgo(3));

    // Determine cancellation/reopen details
    let cancelledAt = null;
    let cancelledById = null;
    let cancellationReason = null;
    let reopenedAt = null;
    let reopenedById = null;
    let reopenCount = 0;
    let reopenReason = null;

    if (config.cancelled) {
      cancelledAt = randomDate(createdAt, daysAgo(1));
      cancelledById = owner.user_id;
      cancellationReason = randomFrom([
        "Issue resolved on its own",
        "No longer needed",
        "Created by mistake",
        "Found alternative solution",
      ]);
    }

    if (config.reopened) {
      reopenedAt = randomDate(daysAgo(5), daysAgo(1));
      reopenedById = owner.user_id;
      reopenCount = randomBetween(1, 2);
      reopenReason = "Issue reoccurred after initial resolution";
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticket_id: uuid(),
        ticket_number: ticketNumber,
        shop_id: shop.shop_id,
        branch_id: branch?.branch_id || null,
        created_by_user_id: owner.user_id,
        contact_number: owner.phone_number || "+919876543210",
        category: config.category,
        subject: TICKET_SUBJECTS[i % TICKET_SUBJECTS.length],
        description: TICKET_DESCRIPTIONS[i % TICKET_DESCRIPTIONS.length],
        other_category_text: config.category === "OTHER" ? "Custom category issue" : null,
        preferred_slot: randomFrom(preferredSlots),
        status: config.status,
        admin_notes: config.status !== "PENDING" ? `Reviewed by admin. ${randomFrom(["Priority: Normal", "Priority: High", "Needs follow-up"])}` : null,
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
  }

  console.log(`✅ Created ${allTickets.length} Tickets\n`);

  // ============================================
  // 19. CREATE TICKET ATTACHMENTS
  // ============================================
  console.log("📎 Creating Ticket Attachments...");

  let attachmentCount = 0;

  for (const ticket of allTickets) {
    if (ticket.config.hasAttachment) {
      const numAttachments = randomBetween(1, 3);

      for (let a = 0; a < numAttachments; a++) {
        const fileTypes = [
          { ext: "png", mime: "image/png", name: "screenshot" },
          { ext: "jpg", mime: "image/jpeg", name: "photo" },
          { ext: "pdf", mime: "application/pdf", name: "document" },
          { ext: "mp4", mime: "video/mp4", name: "screen-recording" },
        ];
        const fileType = randomFrom(fileTypes);

        await prisma.ticketAttachment.create({
          data: {
            attachment_id: uuid(),
            ticket_id: ticket.ticket_id,
            storage_key: `tickets/${ticket.ticket_id}/${fileType.name}_${a + 1}.${fileType.ext}`,
            original_name: `${fileType.name}_${Date.now()}_${a + 1}.${fileType.ext}`,
            mime_type: fileType.mime,
            file_size: randomBetween(50000, 5000000),
            uploaded_at: ticket.createdAt,
          },
        });
        attachmentCount++;
      }
    }
  }

  console.log(`✅ Created ${attachmentCount} Ticket Attachments\n`);

  // ============================================
  // 20. CREATE TICKET STATUS HISTORY
  // ============================================
  console.log("📋 Creating Ticket Status History...");

  let statusHistoryCount = 0;

  for (const ticket of allTickets) {
    const statusFlow = [];

    // Initial creation - always PENDING
    statusFlow.push({
      from: null,
      to: "PENDING",
      changedByType: "USER",
      changedById: ticket.owner.user_id,
      changedByName: ticket.owner.full_name,
      note: "Ticket created",
      createdAt: ticket.createdAt,
    });

    // Build status flow based on current status
    if (ticket.config.status === "IN_PROGRESS" && !ticket.config.reopened) {
      statusFlow.push({
        from: "PENDING",
        to: "IN_PROGRESS",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Ticket is being reviewed",
        createdAt: randomDate(ticket.createdAt, daysAgo(1)),
      });
    }

    if (ticket.config.status === "RESOLVED") {
      statusFlow.push({
        from: "PENDING",
        to: "IN_PROGRESS",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Started working on the issue",
        createdAt: randomDate(ticket.createdAt, daysAgo(5)),
      });
      statusFlow.push({
        from: "IN_PROGRESS",
        to: "RESOLVED",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Issue has been resolved",
        createdAt: randomDate(daysAgo(5), daysAgo(2)),
      });
    }

    if (ticket.config.status === "CLOSED") {
      statusFlow.push({
        from: "PENDING",
        to: "IN_PROGRESS",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Ticket picked up",
        createdAt: randomDate(ticket.createdAt, daysAgo(10)),
      });
      statusFlow.push({
        from: "IN_PROGRESS",
        to: "RESOLVED",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Resolution provided",
        createdAt: randomDate(daysAgo(10), daysAgo(5)),
      });
      statusFlow.push({
        from: "RESOLVED",
        to: "CLOSED",
        changedByType: "USER",
        changedById: ticket.owner.user_id,
        changedByName: ticket.owner.full_name,
        note: "User confirmed issue is resolved",
        createdAt: randomDate(daysAgo(5), daysAgo(1)),
      });
    }

    if (ticket.config.cancelled) {
      statusFlow.push({
        from: "PENDING",
        to: "CANCELLED",
        changedByType: "USER",
        changedById: ticket.owner.user_id,
        changedByName: ticket.owner.full_name,
        note: ticket.cancellation_reason,
        createdAt: ticket.cancelled_at,
      });
    }

    if (ticket.config.reopened) {
      // Was resolved, then reopened
      statusFlow.push({
        from: "PENDING",
        to: "IN_PROGRESS",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Initial review started",
        createdAt: randomDate(ticket.createdAt, daysAgo(15)),
      });
      statusFlow.push({
        from: "IN_PROGRESS",
        to: "RESOLVED",
        changedByType: "CADMIN",
        changedById: cadmin.cadmin_id,
        changedByName: cadmin.name,
        note: "Issue resolved",
        createdAt: randomDate(daysAgo(15), daysAgo(8)),
      });
      statusFlow.push({
        from: "RESOLVED",
        to: "IN_PROGRESS",
        changedByType: "USER",
        changedById: ticket.owner.user_id,
        changedByName: ticket.owner.full_name,
        note: ticket.reopen_reason || "Issue reoccurred",
        createdAt: ticket.reopened_at,
      });
    }

    // Create all status history entries
    for (const entry of statusFlow) {
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
      statusHistoryCount++;

      // Add CAdmin activity log for admin status changes
      if (entry.changedByType === "CADMIN") {
        await prisma.cAdminActivityLog.create({
          data: {
            id: uuid(),
            cadmin_id: cadmin.cadmin_id,
            action: "ticket_status_changed",
            description: `Changed ticket ${ticket.ticket_number} from ${entry.from || "NEW"} to ${entry.to}`,
            meta: {
              ticket_id: ticket.ticket_id,
              ticket_number: ticket.ticket_number,
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

  console.log(`✅ Created ${statusHistoryCount} Ticket Status History entries\n`);

    // ============================================
  // 21. CREATE ENQUIRIES (10 enquiries)
  // ============================================
  console.log("📨 Creating Enquiries...");

  const allEnquiries = [];
  const enquiryConfigs = [
    // PENDING enquiries (3)
    { status: "PENDING", hasReply: false },
    { status: "PENDING", hasReply: false },
    { status: "PENDING", hasReply: false },

    // IN_PROGRESS enquiries (2)
    { status: "IN_PROGRESS", hasReply: false },
    { status: "IN_PROGRESS", hasReply: false },

    // REPLIED enquiries (3)
    { status: "REPLIED", hasReply: true },
    { status: "REPLIED", hasReply: true },
    { status: "REPLIED", hasReply: true },

    // CLOSED enquiries (2)
    { status: "CLOSED", hasReply: true },
    { status: "CLOSED", hasReply: true },
  ];

  const enquiryNames = [
    "Rajan Malhotra",
    "Sunita Kapoor",
    "Vikrant Chadha",
    "Meena Iyer",
    "Arjun Nair",
    "Kavya Menon",
    "Deepak Sharma",
    "Priyanka Reddy",
    "Nikhil Jain",
    "Ankita Bose",
  ];

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
        phone: i % 3 === 0 ? `+9199${String(10000000 + i * 1111111).slice(0, 8)}` : null,
        message: ENQUIRY_MESSAGES[i % ENQUIRY_MESSAGES.length],
        status: config.status,
        created_at: createdAt,
      },
    });

    allEnquiries.push({ ...enquiry, config, createdAt });
  }

  console.log(`✅ Created ${allEnquiries.length} Enquiries\n`);

  // ============================================
  // 22. CREATE ENQUIRY REPLIES
  // ============================================
  console.log("💬 Creating Enquiry Replies...");

  let replyCount = 0;

  const replySubjects = [
    "Re: Your Enquiry about Cureli",
    "Pricing Information - Cureli Pharmacy Management",
    "Thank you for your interest in Cureli",
    "Follow-up: Your Cureli Enquiry",
    "Cureli Demo Scheduling",
  ];

  const replyMessages = [
    "Thank you for reaching out to us! We're excited about your interest in Cureli. Our pricing starts at ₹4,990/year for the Starter plan. I'd be happy to schedule a demo call to discuss your specific requirements. Please let me know your preferred time.",
    "Hi! Thank you for your enquiry. For 5 branches, I would recommend our Professional plan at ₹14,990/year which includes up to 5 branches and 15 users. We also offer a 14-day free trial so you can test the platform before committing.",
    "Yes, we do offer a free trial! You can sign up on our website and get access to our Starter features for 14 days. No credit card required. Let me know if you need any assistance with the signup process.",
    "Our team provides comprehensive training as part of the onboarding process. Typically, onboarding takes 2-3 days depending on your team size. We also have detailed documentation and video tutorials available.",
    "We offer email and chat support during business hours (9 AM - 6 PM IST). Premium plans include priority support with faster response times. We're always here to help!",
  ];

  for (const enquiry of allEnquiries) {
    if (enquiry.config.hasReply) {
      const numReplies = enquiry.config.status === "CLOSED" ? randomBetween(2, 3) : 1;

      for (let r = 0; r < numReplies; r++) {
        const repliedAt = randomDate(enquiry.createdAt, daysAgo(1));
        const emailSent = Math.random() > 0.1; // 90% emails sent successfully

        await prisma.enquiryReply.create({
          data: {
            reply_id: uuid(),
            enquiry_id: enquiry.enquiry_id,
            replied_by_id: cadmin.cadmin_id,
            subject: replySubjects[(replyCount + r) % replySubjects.length],
            message: replyMessages[(replyCount + r) % replyMessages.length],
            email_sent: emailSent,
            email_sent_at: emailSent ? repliedAt : null,
            email_error: !emailSent ? "SMTP connection timeout" : null,
            created_at: repliedAt,
          },
        });
        replyCount++;

        // Add CAdmin activity log for reply
        await prisma.cAdminActivityLog.create({
          data: {
            id: uuid(),
            cadmin_id: cadmin.cadmin_id,
            action: "enquiry_replied",
            description: `Replied to enquiry ${enquiry.enquiry_number}`,
            meta: {
              enquiry_id: enquiry.enquiry_id,
              enquiry_number: enquiry.enquiry_number,
              email_sent: emailSent,
            },
            ip_address: `192.168.1.${randomBetween(1, 255)}`,
            user_agent: randomFrom(USER_AGENTS),
            created_at: repliedAt,
          },
        });
      }
    }
  }

  console.log(`✅ Created ${replyCount} Enquiry Replies\n`);

  // ============================================
  // 23. CREATE ADDITIONAL USERS (to reach 40+)
  // ============================================
  console.log("👥 Creating Additional Users...");

  let additionalUsers = 0;
  const additionalStaffShops = [0, 1, 2, 3, 4];

  for (const shopIndex of additionalStaffShops) {
    const shop = shops[shopIndex];
    const shopBranches = branches.filter((b) => b.shopIndex === shopIndex);

    for (let s = 0; s < 2; s++) {
      const firstName = FIRST_NAMES[nameIndex % FIRST_NAMES.length];
      const lastName = LAST_NAMES[nameIndex % LAST_NAMES.length];
      nameIndex++;

      const branch = shopBranches[s % shopBranches.length];

      await prisma.user.create({
        data: {
          user_id: uuid(),
          shop_id: shop.shop_id,
          branch_id: branch?.branch_id || null,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          username: `extra_${firstName.toLowerCase()}${additionalUsers + 1}`,
          email: `extra.${firstName.toLowerCase()}${additionalUsers + 1}@staff.example.com`,
          phone_number: `+9192${String(10000000 + additionalUsers * 1111111).slice(0, 8)}`,
          password_hash: passwordHash,
          login_provider: "password",
          role: "staff",
          status: "verified",
          is_active: true,
          onboarding_step: 12,
          last_login_at: randomDate(daysAgo(7), new Date()),
          created_at: randomDate(daysAgo(30), daysAgo(5)),
        },
      });
      additionalUsers++;
    }
  }

  console.log(`✅ Created ${additionalUsers} Additional Staff Members\n`);

  // ============================================
  // FINAL COUNTS & SUMMARY
  // ============================================

  const finalCounts = {
    cadmins: 1,
    pendingUsers: pendingUsers.length,
    owners: owners.length,
    branchAdmins: branchAdmins.length,
    staff: staffMembers.length + additionalUsers,
    totalUsers: owners.length + branchAdmins.length + staffMembers.length + additionalUsers,
    shops: shops.length,
    branches: branches.length,
    preMadePlans: 10,
    customPlans: customPlans.length,
    totalPlans: 10 + customPlans.length,
    subscriptions: subscriptions.length + historicalCount,
    payments: paymentCount,
    shopFiles: fileCount,
    verificationLogs: verificationLogCount,
    activityLogs: activityCount,
    deletionLogs: 5,
    userSessions: sessions.length,
    tickets: allTickets.length,
    ticketAttachments: attachmentCount,
    ticketStatusHistory: statusHistoryCount,
    enquiries: allEnquiries.length,
    enquiryReplies: replyCount,
  };

  console.log("═".repeat(60));
  console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
  console.log("═".repeat(60));
  console.log("\n📊 SUMMARY:\n");

  console.log("👤 USERS:");
  console.log(`   • CAdmin: ${finalCounts.cadmins}`);
  console.log(`   • Pending Users: ${finalCounts.pendingUsers}`);
  console.log(`   • Shop Owners (super_admin): ${finalCounts.owners}`);
  console.log(`   • Branch Admins: ${finalCounts.branchAdmins}`);
  console.log(`   • Staff Members: ${finalCounts.staff}`);
  console.log(`   • Total in User table: ${finalCounts.totalUsers}`);
  console.log(`   • User Sessions: ${finalCounts.userSessions} (5 active, 8 ended)`);

  console.log("\n🏪 SHOPS & BRANCHES:");
  console.log(`   • Shops: ${finalCounts.shops}`);
  console.log(`   • Branches: ${finalCounts.branches}`);

  console.log("\n📦 PLANS:");
  console.log(`   • PRE-MADE Plans: ${finalCounts.preMadePlans}`);
  console.log("      - ACTIVE: 6 (Free Trial, Starter, Professional, Launch Special, Diwali Special, Ultimate)");
  console.log("      - DEPRECATED: 1 (Enterprise - has 2 subscribers)");
  console.log("      - SUSPENDED: 2 (Basic Old, Legacy Pro)");
  console.log("      - DRAFT: 1 (Premium Plus)");
  console.log("      - SOFT DELETED: 1 (Legacy Pro)");
  console.log("      - WITH PROMO: 2 (Launch Special - active, Diwali Special - expired)");
  console.log("      - FEATURED: 3 (Starter, Launch Special, Ultimate)");
  console.log(`   • CUSTOM Plans: ${finalCounts.customPlans}`);
  console.log(`   • Total Plans: ${finalCounts.totalPlans}`);

  console.log("\n💳 SUBSCRIPTIONS & PAYMENTS:");
  console.log(`   • Subscriptions: ${finalCounts.subscriptions}`);
  console.log(`   • Payment Transactions: ${finalCounts.payments}`);

  console.log("\n📄 FILES & LOGS:");
  console.log(`   • Shop Files: ${finalCounts.shopFiles}`);
  console.log(`   • File Verification Logs: ${finalCounts.verificationLogs}`);
  console.log(`   • User Activity Logs: ${finalCounts.activityLogs}`);
  console.log(`   • Deletion Logs: ${finalCounts.deletionLogs}`);

  console.log("\n🎫 TICKETS:");
  console.log(`   • Total Tickets: ${finalCounts.tickets}`);
  console.log("      - PENDING: 3");
  console.log("      - IN_PROGRESS: 4 (1 reopened)");
  console.log("      - RESOLVED: 3");
  console.log("      - CLOSED: 3");
  console.log("      - CANCELLED: 2");
  console.log(`   • Ticket Attachments: ${finalCounts.ticketAttachments}`);
  console.log(`   • Ticket Status History: ${finalCounts.ticketStatusHistory}`);

  console.log("\n📨 ENQUIRIES:");
  console.log(`   • Total Enquiries: ${finalCounts.enquiries}`);
  console.log("      - PENDING: 3");
  console.log("      - IN_PROGRESS: 2");
  console.log("      - REPLIED: 3");
  console.log("      - CLOSED: 2");
  console.log(`   • Enquiry Replies: ${finalCounts.enquiryReplies}`);

  console.log("\n" + "═".repeat(60));
  console.log("🔐 LOGIN CREDENTIALS:");
  console.log("═".repeat(60));
  console.log("   CAdmin: cadmin / Admin@123");
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

  console.log("\n🎯 EDGE CASES COVERED:");
  console.log("═".repeat(60));
  console.log("   ✓ Shops with custom plans");
  console.log("   ✓ Shops with deprecated plan (grandfathered)");
  console.log("   ✓ Shops with expired/cancelled subscriptions");
  console.log("   ✓ Shops in trial period");
  console.log("   ✓ Shops with no subscription");
  console.log("   ✓ Shops with pending/rejected documents");
  console.log("   ✓ Failed payment transactions");
  console.log("   ✓ Historical subscriptions (upgrades)");
  console.log("   ✓ Pending users at various onboarding stages");
  console.log("   ✓ Inactive staff members");
  console.log("   ✓ File resubmissions");
  console.log("   ✓ Active and expired user sessions");
  console.log("   ✓ Tickets with all statuses");
  console.log("   ✓ Reopened tickets");
  console.log("   ✓ Cancelled tickets");
  console.log("   ✓ Tickets with attachments");
  console.log("   ✓ Enquiries with all statuses");
  console.log("   ✓ Enquiries with multiple replies");
  console.log("   ✓ Plans with promo_free_until (active & expired)");
  console.log("   ✓ Plans with compare_at_price");
  console.log("   ✓ Plans with bonus_months");
  console.log("   ✓ Featured plans");
  console.log("   ✓ Soft-deleted plans");
  console.log("   ✓ Draft plans");
  console.log("   ✓ CAdmin activity logs for all admin actions");
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