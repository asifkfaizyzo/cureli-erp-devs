// backend/seedAuditLogs.js

import { PrismaClient } from '@prisma/client';
import { randomUUID } from "crypto";
const prisma = new PrismaClient();

// ============================================
// CONFIGURATION
// ============================================

const LOG_COUNT = 50; // How many logs to generate
const DAYS_BACK = 30; // Spread logs over last 30 days
const uuid = () => randomUUID();
// ============================================
// MOCK DATA GENERATORS
// ============================================

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// IDs for relationships (will be fetched from DB or mocked)
let userIds = [];
let shopIds = [];
let branchIds = [];
let cadminIds = [];

// Action Templates
const ACTIONS = [
  // Auth
  {
    action: 'CADMIN_LOGIN_SUCCESS',
    category: 'authentication',
    actor_type: 'cadmin',
    entity_type: 'cadmin',
    reason_code: 'USER_REQUEST',
    metadata: { method: 'password', browser: 'Chrome 120' }
  },
  {
    action: 'USER_PASSWORD_CHANGED',
    category: 'authentication',
    actor_type: 'erp_user',
    entity_type: 'user',
    reason_code: 'SECURITY_ACTION',
    metadata: { method: 'reset_token', ip_changed: false }
  },

  // User Management
  {
    action: 'USER_CREATED',
    category: 'user_management',
    actor_type: 'cadmin',
    entity_type: 'user',
    reason_code: 'ADMIN_ACTION',
    metadata: { role: 'branch_admin', invited_by: 'admin@cureli.com' }
  },
  {
    action: 'USER_ROLE_CHANGED',
    category: 'user_management',
    actor_type: 'erp_user',
    entity_type: 'user',
    reason_code: 'USER_REQUEST',
    metadata: { previous_role: 'staff', new_role: 'branch_admin' }
  },
  {
    action: 'USER_DEACTIVATED',
    category: 'user_management',
    actor_type: 'system',
    entity_type: 'user',
    reason_code: 'PLAN_LIMIT_ENFORCEMENT',
    metadata: { reason: 'Plan downgrade exceeded user limit' }
  },

  // Shop
  {
    action: 'SHOP_ACCOUNT_CREATED',
    category: 'shop_management',
    actor_type: 'erp_user',
    entity_type: 'shop',
    reason_code: 'USER_REQUEST',
    metadata: { plan_selected: 'starter_monthly' }
  },
  {
    action: 'SHOP_SUSPENDED_DUE_TO_NON_PAYMENT',
    category: 'shop_management',
    actor_type: 'system',
    entity_type: 'shop',
    reason_code: 'PAYMENT_ISSUE',
    metadata: { days_overdue: 15, amount_due: 4999 }
  },

  // Subscription
  {
    action: 'SUBSCRIPTION_RENEWED',
    category: 'subscriptions',
    actor_type: 'system',
    entity_type: 'subscription',
    reason_code: 'AUTOMATION',
    metadata: { plan: 'pro_yearly', amount: 12000, next_billing: '2025-01-23' }
  },
  {
    action: 'PLAN_UPGRADED',
    category: 'subscriptions',
    actor_type: 'erp_user',
    entity_type: 'subscription',
    reason_code: 'USER_REQUEST',
    metadata: { from: 'starter', to: 'pro', proration_amount: 500 }
  },

  // Documents
  {
    action: 'SHOP_DOCUMENT_UPLOADED',
    category: 'documents',
    actor_type: 'erp_user',
    entity_type: 'document',
    reason_code: 'USER_REQUEST',
    metadata: { type: 'drug_license', size: '2.4MB', mime: 'application/pdf' }
  },
  {
    action: 'SHOP_VERIFICATION_FILE_REJECTED',
    category: 'documents',
    actor_type: 'cadmin',
    entity_type: 'document',
    reason_code: 'ADMIN_ACTION',
    metadata: { reason: 'Image blurry', rejection_note: 'Please upload a clearer scan' }
  },

  // Support
  {
    action: 'TICKET_CREATED',
    category: 'support',
    actor_type: 'erp_user',
    entity_type: 'ticket',
    reason_code: 'USER_REQUEST',
    metadata: { category: 'billing', priority: 'high', subject: 'Invoice mismatch' }
  },
  {
    action: 'TICKET_RESOLVED_BY_ADMIN',
    category: 'support',
    actor_type: 'cadmin',
    entity_type: 'ticket',
    reason_code: 'ADMIN_ACTION',
    metadata: { resolution_time: '2h 15m', tags: ['billing', 'refund'] }
  },
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('🌱 Starting Audit Log Seeder...');

  // 1. Fetch real IDs to make relationships work (optional, falls back to UUIDs)
  try {
    
    const users = await prisma.user.findMany({ take: 5, select: { user_id: true, role: true } });
    const shops = await prisma.shop.findMany({ take: 5, select: { shop_id: true } });
    const branches = await prisma.branch.findMany({ take: 5, select: { branch_id: true } });
    const cadmins = await prisma.cAdmin.findMany({ take: 5, select: { cadmin_id: true, role: true } });

    userIds = users.length > 0 ? users : [{ user_id: uuid(), role: 'branch_admin' }];
    shopIds = shops.length > 0 ? shops : [{ shop_id: uuid() }];
    branchIds = branches.length > 0 ? branches : [{ branch_id: uuid() }];
    cadminIds = cadmins.length > 0 ? cadmins : [{ cadmin_id: uuid(), role: 'SUPER_ADMIN' }];

    console.log(`✅ Loaded context: ${users.length} users, ${shops.length} shops, ${cadmins.length} admins`);
  } catch (e) {
    console.warn('⚠️ Could not fetch existing data, using random UUIDs');
    userIds = [{ user_id: uuid(), role: 'branch_admin' }];
    shopIds = [{ shop_id: uuid() }];
    branchIds = [{ branch_id: uuid() }];
    cadminIds = [{ cadmin_id: uuid(), role: 'SUPER_ADMIN' }];
  }

  // 2. Generate Logs
  const logs = [];
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - DAYS_BACK);

  for (let i = 0; i < LOG_COUNT; i++) {
    const template = randomItem(ACTIONS);
    
    // Determine Actor
    let actorId = null;
    let actorRole = null;
    
    if (template.actor_type === 'erp_user') {
      const u = randomItem(userIds);
      actorId = u.user_id;
      actorRole = u.role;
    } else if (template.actor_type === 'cadmin') {
      const a = randomItem(cadminIds);
      actorId = a.cadmin_id;
      actorRole = a.role;
    } else {
      actorRole = 'SYSTEM';
    }

    // Determine Entity
    let entityId = uuid(); // Default random for things like tickets/subs
    if (template.entity_type === 'user') entityId = randomItem(userIds).user_id;
    if (template.entity_type === 'shop') entityId = randomItem(shopIds).shop_id;
    if (template.entity_type === 'branch') entityId = randomItem(branchIds).branch_id;
    if (template.entity_type === 'cadmin') entityId = randomItem(cadminIds).cadmin_id;

    // Context
    const shop = randomItem(shopIds);
    const branch = randomItem(branchIds);

    logs.push({
      audit_id: uuid(),
      action: template.action,
      actor_type: template.actor_type,
      actor_id: actorId,
      actor_role: actorRole,
      entity_type: template.entity_type,
      entity_id: entityId,
      shop_id: template.actor_type === 'cadmin' ? null : shop.shop_id, // Admins don't always have shop context
      branch_id: template.actor_type === 'cadmin' ? null : branch.branch_id,
      reason_code: template.reason_code,
      metadata: template.metadata,
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      created_at: randomDate(past, now),
    });
  }

  // 3. Batch Insert
  console.log(`💾 Inserting ${logs.length} audit logs...`);
  await prisma.auditLog.createMany({
    data: logs,
  });

  console.log('✅ Seeding complete!');
  
  // 4. Verify
  const count = await prisma.auditLog.count();
  console.log(`📊 Total logs in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });