// prisma/seed.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Helper to generate UUID
const uuid = () => randomUUID();

// Helper to get random item from array
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to get date X days ago
const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Helper to get date X days from now
const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // ============================================
  // CLEAR EXISTING DATA (in order of dependencies)
  // ============================================
  console.log('🧹 Clearing existing data...');
  
  await prisma.activityLog.deleteMany();
  await prisma.fileVerificationLog.deleteMany();
  await prisma.shopFile.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  
  // Clear current_subscription_id first to avoid FK issues
  await prisma.shop.updateMany({
    data: { current_subscription_id: null }
  });
  
  await prisma.shopSubscription.deleteMany();
  
  // Clear user references before deleting branches
  await prisma.user.updateMany({
    data: { shop_id: null, branch_id: null }
  });
  
  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.pendingUser.deleteMany();
  await prisma.deletionLog.deleteMany();
  await prisma.cAdmin.deleteMany();

  console.log('✅ Cleared all existing data\n');

  // ============================================
  // PASSWORD HASH
  // ============================================
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ============================================
  // 1. CREATE PLANS (4 plans)
  // ============================================
  console.log('📦 Creating plans...');

  const plansData = [
    {
      plan_id: uuid(),
      plan_name: 'Free Trial',
      max_branches: 1,
      max_users: 2,
      price_monthly: BigInt(0),
      price_yearly: BigInt(0),
      is_customizable: false,
      is_visible: true,
      features_json: {
        features: ['1 Branch', '2 Users', 'Basic Inventory', 'Email Support', '14-day Trial']
      }
    },
    {
      plan_id: uuid(),
      plan_name: 'Starter',
      max_branches: 1,
      max_users: 5,
      price_monthly: BigInt(49900), // ₹499
      price_yearly: BigInt(499000), // ₹4990
      is_customizable: false,
      is_visible: true,
      features_json: {
        features: ['1 Branch', 'Up to 5 Users', 'Basic Reports', 'Inventory Management', 'Email Support']
      }
    },
    {
      plan_id: uuid(),
      plan_name: 'Professional',
      max_branches: 5,
      max_users: 15,
      price_monthly: BigInt(149900), // ₹1499
      price_yearly: BigInt(1499000), // ₹14990
      is_customizable: false,
      is_visible: true,
      features_json: {
        features: ['Up to 5 Branches', 'Up to 15 Users', 'Advanced Reports', 'Multi-branch Inventory', 'Priority Support', 'API Access']
      }
    },
    {
      plan_id: uuid(),
      plan_name: 'Enterprise',
      max_branches: 20,
      max_users: 100,
      price_monthly: BigInt(499900), // ₹4999
      price_yearly: BigInt(4999000), // ₹49990
      is_customizable: true,
      is_visible: true,
      features_json: {
        features: ['Up to 20 Branches', 'Up to 100 Users', 'Custom Reports', 'Advanced Analytics', '24/7 Support', 'API Access', 'Custom Integrations', 'Dedicated Account Manager']
      }
    }
  ];

  const plans = [];
  for (const planData of plansData) {
    const plan = await prisma.plan.create({ data: planData });
    plans.push(plan);
  }
  console.log(`✅ Created ${plans.length} plans\n`);

  // ============================================
  // 2. CREATE CADMIN (for testing)
  // ============================================
  console.log('👨‍💼 Creating CAdmin...');

  const cadminHash = await bcrypt.hash('Admin@123', 10);
  await prisma.cAdmin.create({
    data: {
      cadmin_id: uuid(),
      username: 'cadmin',
      email: 'admin@cureli.com',
      phone_number: '9961045596',
      password_hash: cadminHash,
      is_active: true,
      last_login_at: new Date(),
    }
  });
  console.log('✅ Created CAdmin\n');

  // ============================================
  // 3. CREATE SHOP OWNERS (10 Super Admins)
  // ============================================
  console.log('👑 Creating shop owners...');

  const indianFirstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rajesh', 'Deepika', 'Suresh', 'Kavita'];
  const indianLastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Nair', 'Joshi', 'Mehta', 'Verma'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
  const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Maharashtra', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh'];
  const businessTypes = ['pharmacy', 'medical_store', 'hospital_pharmacy', 'wholesale', 'retail'];
  const verificationStatuses = ['verified', 'pending', 'rejected', 'pending'];

  const owners = [];
  for (let i = 0; i < 10; i++) {
    const firstName = indianFirstNames[i];
    const lastName = indianLastNames[i];
    const owner = await prisma.user.create({
      data: {
        user_id: uuid(),
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        username: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone_number: `+9198${String(70000000 + i * 1111111).slice(0, 8)}`,
        password_hash: passwordHash,
        login_provider: i % 3 === 0 ? 'google' : 'password',
        google_id: i % 3 === 0 ? `google_${uuid().slice(0, 20)}` : null,
        role: 'super_admin',
        status: i < 7 ? 'active' : randomFrom(['pending_verification', 'pending_setup', 'active']),
        is_active: i < 8, // 2 inactive owners
        onboarding_step: i < 7 ? 4 : randomFrom([1, 2, 3, 4]),
        last_login_at: i < 8 ? randomDate(daysAgo(30), new Date()) : null,
        created_at: randomDate(daysAgo(180), daysAgo(30)),
      }
    });
    owners.push(owner);
  }
  console.log(`✅ Created ${owners.length} shop owners\n`);

  // ============================================
  // 4. CREATE SHOPS (10 shops)
  // ============================================
  console.log('🏪 Creating shops...');

  const shopNames = [
    'HealthCare Pharmacy', 'MediPlus Stores', 'Apollo Pharmacy', 'Wellness Medical',
    'LifeCare Chemist', 'CureWell Pharmacy', 'Medicare Hub', 'Remedy Medical Store',
    'VitalHealth Pharmacy', 'PharmaZone'
  ];

  const shops = [];
  for (let i = 0; i < 10; i++) {
    const verificationStatus = i < 6 ? 'verified' : verificationStatuses[i % 4];
    const shop = await prisma.shop.create({
      data: {
        shop_id: uuid(),
        owner_user_id: owners[i].user_id,
        business_name: shopNames[i],
        legal_name: `${shopNames[i]} Pvt. Ltd.`,
        gst_number: i < 8 ? `${states[i].slice(0, 2).toUpperCase()}${String(10 + i).padStart(2, '0')}ABCD${1234 + i}E${i + 1}Z${i + 5}` : null,
        business_type: businessTypes[i % 5],
        address_line_1: `${100 + i * 10}, ${randomFrom(['MG Road', 'Station Road', 'Main Street', 'Market Lane', 'Commercial Complex'])}`,
        address_line_2: randomFrom(['Near Bus Stand', 'Opposite Railway Station', 'Next to SBI Bank', null, 'Ground Floor']),
        city: cities[i],
        state: states[i],
        pincode: String(400001 + i * 11111),
        verification_status: verificationStatus,
        verification_notes: verificationStatus === 'rejected' ? 'GST certificate unclear. Please resubmit.' : 
                           verificationStatus === 'pending' ? 'Documents under review' : null,
        created_at: randomDate(daysAgo(180), daysAgo(30)),
      }
    });
    shops.push(shop);

    // Update owner with shop_id
    await prisma.user.update({
      where: { user_id: owners[i].user_id },
      data: { shop_id: shop.shop_id }
    });
  }
  console.log(`✅ Created ${shops.length} shops\n`);

  // ============================================
  // 5. CREATE BRANCHES (2-3 per shop = ~25 branches)
  // ============================================
  console.log('🏢 Creating branches...');

  const branchTypes = ['main', 'sub'];
  const branches = [];

  for (let shopIndex = 0; shopIndex < shops.length; shopIndex++) {
    const shop = shops[shopIndex];
    const branchCount = shopIndex < 5 ? 3 : 2; // First 5 shops have 3 branches, rest have 2

    for (let b = 0; b < branchCount; b++) {
      const isMain = b === 0;
      const branch = await prisma.branch.create({
        data: {
          branch_id: uuid(),
          shop_id: shop.shop_id,
          branch_name: isMain ? `${shop.business_name} - Main` : `${shop.business_name} - Branch ${b}`,
          branch_type: isMain ? 'main' : 'sub',
          address_line_1: `${200 + b * 50}, ${randomFrom(['Link Road', 'Highway Junction', 'Industrial Area', 'City Center', 'Mall Road'])}`,
          address_line_2: randomFrom(['Floor 1', 'Shop No. 5', null, 'Building A']),
          city: b === 0 ? cities[shopIndex] : randomFrom(cities),
          state: b === 0 ? states[shopIndex] : randomFrom(states),
          pincode: String(400001 + shopIndex * 11111 + b * 1000),
          contact_number: `+9198${String(60000000 + shopIndex * 1000000 + b * 100000).slice(0, 8)}`,
          alternate_number: b === 0 ? `+9197${String(60000000 + shopIndex * 1000000).slice(0, 8)}` : null,
          is_active: !(shopIndex === 9 && b > 0), // Last shop has inactive sub-branches
          created_at: randomDate(daysAgo(150), daysAgo(20)),
        }
      });
      branches.push({ ...branch, shopIndex });
    }
  }
  console.log(`✅ Created ${branches.length} branches\n`);

  // Update owners with main branch
  for (let i = 0; i < owners.length; i++) {
    const mainBranch = branches.find(b => b.shopIndex === i && b.branch_type === 'main');
    if (mainBranch) {
      await prisma.user.update({
        where: { user_id: owners[i].user_id },
        data: { branch_id: mainBranch.branch_id }
      });
    }
  }

  // ============================================
  // 6. CREATE BRANCH ADMINS (10 branch admins)
  // ============================================
  console.log('👨‍💼 Creating branch admins...');

  const branchAdminFirstNames = ['Arun', 'Meera', 'Kiran', 'Pooja', 'Sanjay', 'Neha', 'Manoj', 'Ritu', 'Ashok', 'Swati'];
  const branchAdminLastNames = ['Desai', 'Iyer', 'Kulkarni', 'Pillai', 'Rao', 'Saxena', 'Tiwari', 'Bose', 'Chatterjee', 'Menon'];

  const branchAdmins = [];
  for (let i = 0; i < 10; i++) {
    const shopIndex = i % 10;
    const shop = shops[shopIndex];
    // Assign to a sub-branch if exists, otherwise main
    const subBranches = branches.filter(b => b.shopIndex === shopIndex && b.branch_type === 'sub');
    const branch = subBranches[i % subBranches.length] || branches.find(b => b.shopIndex === shopIndex);

    const firstName = branchAdminFirstNames[i];
    const lastName = branchAdminLastNames[i];

    const branchAdmin = await prisma.user.create({
      data: {
        user_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch?.branch_id || null,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        username: `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${shop.business_name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone_number: `+9199${String(10000000 + i * 1111111).slice(0, 8)}`,
        password_hash: passwordHash,
        login_provider: 'password',
        role: 'branch_admin',
        status: i < 8 ? 'active' : randomFrom(['pending_setup', 'active']),
        is_active: i < 9,
        onboarding_step: 4,
        last_login_at: i < 8 ? randomDate(daysAgo(14), new Date()) : null,
        created_at: randomDate(daysAgo(120), daysAgo(15)),
      }
    });
    branchAdmins.push(branchAdmin);
  }
  console.log(`✅ Created ${branchAdmins.length} branch admins\n`);

  // ============================================
  // 7. CREATE STAFF MEMBERS (15 staff)
  // ============================================
  console.log('👷 Creating staff members...');

  const staffFirstNames = ['Ravi', 'Sunita', 'Prakash', 'Geeta', 'Vijay', 'Lakshmi', 'Mohan', 'Savita', 'Dinesh', 'Anita', 'Ramesh', 'Kamala', 'Sunil', 'Usha', 'Gopal'];
  const staffLastNames = ['Patil', 'Shinde', 'Jadhav', 'More', 'Pawar', 'Sawant', 'Gaikwad', 'Bhosale', 'Chavan', 'Kale', 'Deshpande', 'Jain', 'Shah', 'Agarwal', 'Bansal'];

  const staffMembers = [];
  for (let i = 0; i < 15; i++) {
    const shopIndex = i % 10;
    const shop = shops[shopIndex];
    const shopBranches = branches.filter(b => b.shopIndex === shopIndex);
    const branch = shopBranches[i % shopBranches.length];

    const firstName = staffFirstNames[i];
    const lastName = staffLastNames[i];

    const staff = await prisma.user.create({
      data: {
        user_id: uuid(),
        shop_id: shop.shop_id,
        branch_id: branch?.branch_id || null,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        username: `staff_${firstName.toLowerCase()}${i}`,
        email: `${firstName.toLowerCase()}${i}@staff.example.com`,
        phone_number: `+9191${String(10000000 + i * 1234567).slice(0, 8)}`,
        password_hash: passwordHash,
        login_provider: 'password',
        role: 'staff',
        status: i < 12 ? 'verified' : 'pending_setup',
        is_active: i < 13,
        onboarding_step: 4,
        last_login_at: i < 12 ? randomDate(daysAgo(7), new Date()) : null,
        created_at: randomDate(daysAgo(90), daysAgo(5)),
      }
    });
    staffMembers.push(staff);
  }
  console.log(`✅ Created ${staffMembers.length} staff members\n`);

  // All users combined
  const allUsers = [...owners, ...branchAdmins, ...staffMembers];
  console.log(`📊 Total users created: ${allUsers.length}\n`);

  // ============================================
  // 8. CREATE SUBSCRIPTIONS (one per shop)
  // ============================================
  console.log('💳 Creating subscriptions...');

  const subscriptionStatuses = ['active', 'active', 'active', 'active', 'trial', 'expired', 'cancelled', 'active', 'active', 'pending'];
  const billingCycles = ['monthly', 'yearly', 'monthly', 'yearly', 'monthly'];
  const paymentStatuses = ['paid', 'paid', 'paid', 'pending', 'paid', 'failed', 'paid', 'paid', 'paid', 'pending'];

  const subscriptions = [];
  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i];
    const plan = plans[i % plans.length];
    const status = subscriptionStatuses[i];
    const billingCycle = billingCycles[i % 5];
    const isActive = ['active', 'trial'].includes(status);

    const startDate = randomDate(daysAgo(90), daysAgo(30));
    const endDate = billingCycle === 'yearly' 
      ? new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.shopSubscription.create({
      data: {
        subscription_id: uuid(),
        shop_id: shop.shop_id,
        plan_id: plan.plan_id,
        status: status,
        billing_cycle: billingCycle,
        payment_status: paymentStatuses[i],
        start_date: startDate,
        end_date: endDate,
        renewal_date: new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before end
        branch_limit_snapshot: plan.max_branches,
        user_limit_snapshot: plan.max_users,
        is_active: isActive,
        created_at: startDate,
      }
    });
    subscriptions.push(subscription);

    // Update shop with current subscription
    if (isActive) {
      await prisma.shop.update({
        where: { shop_id: shop.shop_id },
        data: { current_subscription_id: subscription.subscription_id }
      });
    }
  }
  console.log(`✅ Created ${subscriptions.length} subscriptions\n`);

  // ============================================
  // 9. CREATE PAYMENT TRANSACTIONS
  // ============================================
  console.log('💰 Creating payment transactions...');

  const paymentProviders = ['razorpay', 'razorpay', 'stripe', 'razorpay'];
  const txnStatuses = ['captured', 'captured', 'failed', 'pending', 'captured'];

  let txnCount = 0;
  for (let i = 0; i < subscriptions.length; i++) {
    const sub = subscriptions[i];
    const shop = shops[i];
    const plan = plans.find(p => p.plan_id === sub.plan_id);
    const amount = sub.billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    if (amount > 0) {
      await prisma.paymentTransaction.create({
        data: {
          transaction_id: uuid(),
          shop_id: shop.shop_id,
          subscription_id: sub.subscription_id,
          provider: paymentProviders[i % 4],
          provider_order_id: `order_${uuid().slice(0, 14)}`,
          provider_payment_id: txnStatuses[i % 5] === 'captured' ? `pay_${uuid().slice(0, 14)}` : null,
          amount: amount,
          currency: 'INR',
          status: txnStatuses[i % 5],
          meta: {
            method: randomFrom(['card', 'upi', 'netbanking']),
            bank: randomFrom(['HDFC', 'ICICI', 'SBI', 'Axis']),
          },
          created_at: sub.start_date,
        }
      });
      txnCount++;
    }
  }
  console.log(`✅ Created ${txnCount} payment transactions\n`);

  // ============================================
  // 10. CREATE SHOP FILES
  // ============================================
  console.log('📄 Creating shop files...');

  const fileTypes = ['drug_license', 'gst_certificate', 'pharmacy_registration', 'business_pan', 'address_proof', 'shop_license'];
  const fileStatuses = ['verified', 'verified', 'pending', 'rejected', 'uploaded', 'verified'];

  let fileCount = 0;
  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i];
    const owner = owners[i];
    const fileCountForShop = i < 5 ? 4 : 2; // First 5 shops have 4 files, rest have 2

    for (let f = 0; f < fileCountForShop; f++) {
      const fileType = fileTypes[f % fileTypes.length];
      const status = shop.verification_status === 'verified' ? 'verified' : fileStatuses[f % fileStatuses.length];

      await prisma.shopFile.create({
        data: {
          file_id: uuid(),
          shop_id: shop.shop_id,
          file_type: fileType,
          storage_key: `shops/${shop.shop_id}/${fileType}_${Date.now()}.pdf`,
          original_name: `${fileType.replace(/_/g, '-')}-${shop.business_name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
          mime_type: 'application/pdf',
          file_size: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
          status: status,
          verification_notes: status === 'rejected' ? 'Document expired or unclear. Please resubmit a valid document.' : null,
          resubmission_count: status === 'rejected' ? 1 : 0,
          uploaded_by: owner.user_id,
          uploaded_at: randomDate(daysAgo(60), daysAgo(10)),
          verified_at: status === 'verified' ? randomDate(daysAgo(30), daysAgo(5)) : null,
        }
      });
      fileCount++;
    }
  }
  console.log(`✅ Created ${fileCount} shop files\n`);

  // ============================================
  // 11. CREATE FILE VERIFICATION LOGS
  // ============================================
  console.log('📋 Creating file verification logs...');

  const shopFiles = await prisma.shopFile.findMany();
  let logCount = 0;

  for (const file of shopFiles) {
    if (file.status === 'verified' || file.status === 'rejected') {
      await prisma.fileVerificationLog.create({
        data: {
          id: uuid(),
          file_id: file.file_id,
          shop_id: file.shop_id,
          cadmin_id: null,
          actor_type: 'admin',
          action: file.status,
          reason: file.status === 'rejected' ? 'Document quality issues' : 'Document verified successfully',
          meta: { processed_by: 'system_seed' },
          created_at: file.verified_at || new Date(),
        }
      });
      logCount++;
    }
  }
  console.log(`✅ Created ${logCount} file verification logs\n`);

  // ============================================
  // 12. CREATE ACTIVITY LOGS
  // ============================================
  console.log('📝 Creating activity logs...');

  const actions = ['login', 'logout', 'profile_update', 'password_change', 'status_change', 'role_change'];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile',
  ];

  let activityCount = 0;
  for (const user of allUsers) {
    // Each user gets 2-5 activity logs
    const logsForUser = Math.floor(Math.random() * 4) + 2;
    
    for (let a = 0; a < logsForUser; a++) {
      const action = actions[a % actions.length];
      const descriptions = {
        login: 'User logged in successfully',
        logout: 'User logged out',
        profile_update: 'Updated profile information',
        password_change: 'Password was changed',
        status_change: `Status changed to ${user.status}`,
        role_change: `Role updated to ${user.role}`,
      };

      await prisma.activityLog.create({
        data: {
          activity_id: uuid(),
          user_id: user.user_id,
          action: action,
          description: descriptions[action],
          ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          user_agent: randomFrom(userAgents),
          created_at: randomDate(daysAgo(30), new Date()),
        }
      });
      activityCount++;
    }
  }
  console.log(`✅ Created ${activityCount} activity logs\n`);

  // ============================================
  // 13. CREATE PENDING USERS (5 pending registrations)
  // ============================================
  console.log('⏳ Creating pending users...');

  const pendingFirstNames = ['Akash', 'Bhavna', 'Chirag', 'Divya', 'Ekta'];
  const pendingLastNames = ['Arora', 'Bajaj', 'Choudhary', 'Dwivedi', 'Fernandes'];

  for (let i = 0; i < 5; i++) {
    const firstName = pendingFirstNames[i];
    const lastName = pendingLastNames[i];

    await prisma.pendingUser.create({
      data: {
        pending_id: uuid(),
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@pending.example.com`,
        password_hash: passwordHash,
        login_provider: i % 2 === 0 ? 'password' : 'google',
        google_id: i % 2 === 1 ? `google_pending_${uuid().slice(0, 15)}` : null,
        email_verified: i < 3,
        phone: i < 3 ? `+9190${String(10000000 + i * 2222222).slice(0, 8)}` : null,
        sms_verified: i < 2,
        username: i < 2 ? `${firstName.toLowerCase()}${i}` : null,
        created_at: randomDate(daysAgo(7), new Date()),
      }
    });
  }
  console.log(`✅ Created 5 pending users\n`);

  // ============================================
  // 14. CREATE DELETION LOGS (for audit)
  // ============================================
  console.log('🗑️ Creating deletion logs...');

  for (let i = 0; i < 3; i++) {
    await prisma.deletionLog.create({
      data: {
        id: uuid(),
        user_id: uuid(), // Fake UUIDs for deleted users
        email: `deleted_user_${i}@example.com`,
        username: `deleted_user_${i}`,
        reason: randomFrom(['inactivity', 'user_request', 'incomplete_onboarding']),
        onboarding_step: randomFrom([1, 2, 3]),
        days_inactive: Math.floor(Math.random() * 60) + 30,
        files_deleted: Math.floor(Math.random() * 3),
        deleted_at: randomDate(daysAgo(60), daysAgo(10)),
      }
    });
  }
  console.log(`✅ Created 3 deletion logs\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('═'.repeat(50));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!\n');
  console.log('📊 Summary:');
  console.log(`   • Plans: ${plans.length}`);
  console.log(`   • CAdmins: 1`);
  console.log(`   • Shop Owners (Super Admins): ${owners.length}`);
  console.log(`   • Shops: ${shops.length}`);
  console.log(`   • Branches: ${branches.length}`);
  console.log(`   • Branch Admins: ${branchAdmins.length}`);
  console.log(`   • Staff Members: ${staffMembers.length}`);
  console.log(`   • Total Users: ${allUsers.length}`);
  console.log(`   • Subscriptions: ${subscriptions.length}`);
  console.log(`   • Shop Files: ${fileCount}`);
  console.log(`   • Activity Logs: ${activityCount}`);
  console.log(`   • Pending Users: 5`);
  console.log('═'.repeat(50));
  console.log('\n🔐 Login Credentials:');
  console.log('   CAdmin: cadmin / Admin@123');
  console.log('   All Users: Password123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });