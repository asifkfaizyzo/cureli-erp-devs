import prisma from "../../config/prisma.js";
import { comparePassword } from "../../utils/hash.js";
import jwt from "jsonwebtoken";
import { ACCESS_SECRET, ACCESS_EXPIRES } from "../../config/jwt.js";
import { fail, success } from "../../utils/response.js";

export async function loginController(req, res) {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return fail(res, "Invalid credentials", 401);

    if (user.login_provider === "password") {
      const ok = await comparePassword(password, user.password_hash);
      if (!ok) return fail(res, "Invalid credentials", 401);
    }

    // JWT Creation
    const token = jwt.sign(
      {
        user_id: user.user_id,
        shop_id: user.shop_id,
        role: user.role,
        status: user.status,
      },
      ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );

    // Determine next onboarding step & whether to show success page
    let nextStep =
      typeof user.onboarding_step === "number" ? user.onboarding_step : 4;
    let showSuccess = false;

    // If user is still in pending_setup and onboarding_step < 12 => resume onboarding normally
    if (user.status === "pending_setup" && nextStep < 12) {
      // user continues onboarding where they left off
      // nextStep is already set
    }

    // If onboarding step 12 (all files uploaded) and still not verified → show VerificationPending
    if (user.onboarding_step === 12 && user.status !== "verified") {
      nextStep = 12;
    }

    // If verified → show success ONCE then go to dashboard
    if (user.status === "verified") {
      if (user.first_login_after_verification) {
        nextStep = 13; // show OnboardSuccess
        showSuccess = true;

        // flip flag so success is shown only once
        await prisma.user.update({
          where: { user_id: user.user_id },
          data: { first_login_after_verification: false },
        });
      } else {
        nextStep = -1; // dashboard
      }
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        last_login_at: new Date(),
      },
    });

    return success(res, {
      access_token: token,
      next_step: nextStep,
      show_success: showSuccess,
      shop_id: user.shop_id,
      user_id: user.user_id,
    });
  } catch (err) {
    console.error(err);
    return fail(res, "Login failed", 500);
  }
}
