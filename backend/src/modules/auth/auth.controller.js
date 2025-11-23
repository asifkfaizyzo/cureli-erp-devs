import prisma from "../../config/prisma.js";
import { fail, success } from "../../utils/response.js";
import { comparePassword } from "../../utils/hash.js";
import jwt from "jsonwebtoken";
import { ACCESS_SECRET, ACCESS_EXPIRES } from "../../config/jwt.js";

export async function loginController(req, res) {
  try {
    const { username, password } = req.validated;

    // 1. Check if user exists
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      // Maybe user is stuck in pending signup?
      const pending = await prisma.pendingUser.findUnique({
        where: { email: username }, // since username login only, check by email fallback
      });

      if (pending) {
        return fail(
          res,
          "Your signup was not completed. Please restart the signup process.",
          400
        );
      }

      return fail(res, "User not found", 404);
    }

    // 2. Check if account is active
    if (!user.is_active) {
      return fail(res, "Account disabled", 403);
    }

    // 3. Verify password
    if (!user.password_hash) {
      return fail(res, "This account requires Google login", 400);
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) return fail(res, "Incorrect password", 400);

    // 4. Update last login
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login_at: new Date() },
    });

    // 5. Fetch shop info (may be used during onboarding)
    let shop = null;
    if (user.shop_id) {
      shop = await prisma.shop.findUnique({
        where: { shop_id: user.shop_id },
      });
    }

    // 6. Issue access token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        shop_id: user.shop_id,
        role: user.role,
        status: user.status,
        onboarding_step: user.onboarding_step,
      },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );

    // 7. Return final response
    return success(
      res,
      {
        user,
        shop,
        access_token: token,
      },
      user.status === "pending_setup"
        ? "Continue onboarding"
        : "Login successful"
    );

  } catch (err) {
    console.error(err);
    return fail(res, "Login failed", 500);
  }
}
