// src/modules/setup/setup.service.js
import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";

/**
 * Get setup status for a shop
 * Checks if the shop has at least one branch
 */
export async function getSetupStatus(shop_id, user_id) {
  // Get shop with branches count and subscription
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      branches: {
        where: { is_active: true },
        select: { branch_id: true },
      },
      currentSubscription: {
        include: {
          plan: {
            select: {
              plan_id: true,
              name: true,
              max_branches: true,
              max_users: true,
            },
          },
        },
      },
      _count: {
        select: {
          users: {
            where: {
              is_active: true,
              role: { in: ["staff", "branch_admin"] },
            },
          },
        },
      },
    },
  });

  if (!shop) {
    return {
      is_complete: false,
      has_branches: false,
      branch_count: 0,
      user_count: 0,
      subscription: null,
    };
  }

  const hasBranches = shop.branches.length > 0;
  const subscription = shop.currentSubscription;

  return {
    is_complete: hasBranches,
    has_branches: hasBranches,
    branch_count: shop.branches.length,
    user_count: shop._count.users,
    subscription: subscription
      ? {
          plan_id: subscription.plan.plan_id,
          plan_name: subscription.plan.name,
          max_branches: subscription.branch_limit_snapshot,
          max_users: subscription.user_limit_snapshot,
        }
      : null,
  };
}

/**
 * Check if a username is available
 */
export async function checkUsernameAvailability(username) {
  const existingUser = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { user_id: true },
  });

  return {
    available: !existingUser,
    username: username.toLowerCase(),
  };
}

/**
 * Check if a phone number is already registered
 */
export async function checkPhoneAvailability(phone_number) {
  const existingUser = await prisma.user.findFirst({
    where: { phone_number },
    select: { user_id: true },
  });

  return {
    available: !existingUser,
    phone_number,
  };
}

/**
 * Complete setup - Create branches and users in a transaction
 */
export async function completeSetup({ shop_id, user_id, branches, users }) {
  // Step 1: Get shop and subscription limits
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      currentSubscription: true,
      branches: {
        where: { is_active: true },
        select: { branch_id: true },
      },
      _count: {
        select: {
          users: {
            where: {
              is_active: true,
              role: { in: ["staff", "branch_admin"] },
            },
          },
        },
      },
    },
  });

  if (!shop) {
    const err = new Error("Shop not found");
    err.code = "SHOP_NOT_FOUND";
    throw err;
  }

  const subscription = shop.currentSubscription;
  if (!subscription) {
    const err = new Error("No active subscription found. Please select a plan first.");
    err.code = "NO_SUBSCRIPTION";
    throw err;
  }

  // Step 2: Validate limits
  const maxBranches = subscription.branch_limit_snapshot;
  const maxUsers = subscription.user_limit_snapshot;
  const existingBranchCount = shop.branches.length;
  const existingUserCount = shop._count.users;

  // Check branch limit (-1 means unlimited)
  if (maxBranches !== -1) {
    const totalBranches = existingBranchCount + branches.length;
    if (totalBranches > maxBranches) {
      const err = new Error(
        `Branch limit exceeded. Your plan allows ${maxBranches} branches, ` +
          `you have ${existingBranchCount} and are trying to add ${branches.length}.`
      );
      err.code = "BRANCH_LIMIT_EXCEEDED";
      throw err;
    }
  }

  // Check user limit (-1 means unlimited)
  // Note: Super Admin is NOT counted
  if (maxUsers !== -1) {
    const totalUsers = existingUserCount + users.length;
    if (totalUsers > maxUsers) {
      const err = new Error(
        `User limit exceeded. Your plan allows ${maxUsers} users, ` +
          `you have ${existingUserCount} and are trying to add ${users.length}.`
      );
      err.code = "USER_LIMIT_EXCEEDED";
      throw err;
    }
  }

  // Step 3: Validate usernames and phones are available
  if (users.length > 0) {
    const usernames = users.map((u) => u.username.toLowerCase());
    const phones = users.map((u) => u.phone_number);

    // Check usernames
    const existingUsernames = await prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { username: true },
    });

    if (existingUsernames.length > 0) {
      const taken = existingUsernames.map((u) => u.username).join(", ");
      const err = new Error(`Username(s) already taken: ${taken}`);
      err.code = "USERNAME_TAKEN";
      throw err;
    }

    // Check phones
    const existingPhones = await prisma.user.findMany({
      where: { phone_number: { in: phones } },
      select: { phone_number: true },
    });

    if (existingPhones.length > 0) {
      const taken = existingPhones.map((u) => u.phone_number).join(", ");
      const err = new Error(`Phone number(s) already registered: ${taken}`);
      err.code = "PHONE_TAKEN";
      throw err;
    }
  }

  // Step 4: Create everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create a map to store temp_id -> real branch_id
    const branchIdMap = new Map();

    // Create branches
    const createdBranches = [];
    for (let i = 0; i < branches.length; i++) {
      const branchData = branches[i];
      const isFirst = existingBranchCount === 0 && i === 0;

      const branch = await tx.branch.create({
        data: {
          shop_id,
          branch_name: branchData.branch_name,
          branch_type: isFirst ? "main" : "branch",
          address_line_1: branchData.address_line_1 || null,
          city: branchData.city || null,
          state: branchData.state || null,
          pincode: branchData.pincode || null,
          contact_number: branchData.contact_number || null,
          is_active: true,
        },
      });

      branchIdMap.set(branchData.temp_id, branch.branch_id);
      createdBranches.push(branch);
    }

    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const branch_id = branchIdMap.get(userData.branch_temp_id);

      if (!branch_id) {
        throw new Error(`Invalid branch assignment for user ${userData.full_name}`);
      }

      // Hash password
      const password_hash = await hashPassword(userData.password);

      // Parse name
      const nameParts = userData.full_name.trim().split(/\s+/);
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(" ") || "";

      const user = await tx.user.create({
        data: {
          shop_id,
          branch_id,
          first_name,
          last_name,
          full_name: userData.full_name.trim(),
          username: userData.username.toLowerCase(),
          phone_number: userData.phone_number,
          password_hash,
          login_provider: "password",
          role: userData.role,
          status: "verified",
          is_active: true,
          onboarding_step: 12, // Completed
        },
      });

      createdUsers.push(user);
    }

    // Update the Super Admin's status to active if still pending
    await tx.user.update({
      where: { user_id },
      data: {
        status: "active",
      },
    });

    return {
      branches: createdBranches,
      users: createdUsers,
    };
  });

  return {
    branches_created: result.branches.length,
    users_created: result.users.length,
  };
}