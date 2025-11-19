import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";
import jwt from "jsonwebtoken";
import { ACCESS_SECRET, REFRESH_SECRET, ACCESS_EXPIRES, REFRESH_EXPIRES } from "../../config/jwt.js";

/**
 * Create owner user, shop and main branch in a transaction.
 * Returns { user, shop, branch, tokens }
 */
export async function createOwnerAccount({ first_name, last_name, email, password }) {
  // check existing email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // if existing user was google signup, instruct login with google
    if (existing.login_provider === "google") {
      const err = new Error("Email already registered via Google. Please login with Google.");
      err.code = "EMAIL_GOOGLE_EXISTS";
      throw err;
    }
    const err = new Error("Email already registered.");
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  // hash password
  const password_hash = await hashPassword(password);

  // transaction: create user -> shop -> branch -> update user with shop_id & branch_id
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        first_name,
        last_name,
        full_name: `${first_name} ${last_name}`,
        email,
        password_hash,
        login_provider: "password",
        role: "super_admin",
        is_active: true,
      },
    });

    const shop = await tx.shop.create({
      data: {
        owner_user_id: user.user_id,
        business_name: `${first_name}'s Pharmacy`,
        verification_status: "pending",
      },
    });

    // create main branch for the shop
    const branch = await tx.branch.create({
      data: {
        shop_id: shop.shop_id,
        branch_name: `${shop.business_name} (Main Branch)`,
        branch_type: "main",
        address_line_1: "Not provided",
        city: "Not provided",
        state: "Not provided",
        pincode: "000000",
        contact_number: "Not provided",
        branch_seat_limit: 3, // default safe number; owner can change later
      },
    });

    // update user with shop_id and branch_id
    const updatedUser = await tx.user.update({
      where: { user_id: user.user_id },
      data: { shop_id: shop.shop_id, branch_id: branch.branch_id },
    });

    return { user: updatedUser, shop, branch };
  });

  // issue tokens
  const accessToken = jwt.sign(
    { user_id: result.user.user_id, shop_id: result.shop.shop_id, role: result.user.role, branch_id: result.branch.branch_id },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { user_id: result.user.user_id, shop_id: result.shop.shop_id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );

  return {
    user: result.user,
    shop: result.shop,
    branch: result.branch,
    tokens: { accessToken, refreshToken },
  };
}
