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

  const user = await prisma.user.create({
    data: {
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`,
      email,
      password_hash,
      login_provider: "password",
      role: "super_admin",
      status: "pending_setup",
      is_active: true,
    },
  });


  // issue tokens
  const accessToken = jwt.sign(
    { user_id: user.user_id,  role: user.role, status: user.status },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { user_id: user.user_id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );

  return {
    user,
    tokens: { accessToken, refreshToken },
  };
}
