// backend/scripts/seed-plans.js
import prisma from "../src/config/prisma.js";

async function seedPlans() {
  console.log("🚀 Seeding default plans…");

  const defaultPlans = [
    {
      plan_name: "Free",
      max_branches: 1,
      max_users: 2,
      price_monthly: BigInt(0),
      price_yearly: null,
      is_customizable: false,
      is_visible: true,
      features_json: {
        benefits: [
          "1 branch",
          "2 staff accounts",
          "Basic access"
        ],
      },
    },
    {
      plan_name: "Tier 1",
      max_branches: 2,
      max_users: 6,
      price_monthly: BigInt(49900),   // ₹499.00 → stored in paise
      price_yearly: BigInt(499000),   // ₹4990.00 → paise
      is_customizable: false,
      is_visible: true,
      features_json: {
        benefits: [
          "2 branches",
          "6 staff accounts",
          "Basic to intermediate features",
        ],
      },
    },
    {
      plan_name: "Tier 2",
      max_branches: 4,
      max_users: 10,
      price_monthly: BigInt(99900),
      price_yearly: BigInt(999000),
      is_customizable: false,
      is_visible: true,
      features_json: {
        benefits: [
          "4 branches",
          "10 staff accounts",
          "Premium features",
        ],
      },
    },
    {
      plan_name: "Custom",
      max_branches: 0,
      max_users: 0,
      price_monthly: BigInt(0),
      price_yearly: null,
      is_customizable: true,
      is_visible: false, // Hidden from shop owners
      features_json: {
        note: "This plan is managed manually by Cureli Admin",
      },
    },
  ];

  for (const p of defaultPlans) {
    await prisma.plan.upsert({
      where: { plan_name: p.plan_name },
      update: {
        max_branches: p.max_branches,
        max_users: p.max_users,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly,
        is_customizable: p.is_customizable,
        is_visible: p.is_visible,
        features_json: p.features_json,
        updated_at: new Date(),
      },
      create: {
        plan_name: p.plan_name,
        max_branches: p.max_branches,
        max_users: p.max_users,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly,
        is_customizable: p.is_customizable,
        is_visible: p.is_visible,
        features_json: p.features_json,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`✔ Upserted plan: ${p.plan_name}`);
  }

  console.log("🌱 Default plans seeding complete!");
}

seedPlans()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
