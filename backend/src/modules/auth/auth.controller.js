import { createOwnerAccount } from "./auth.service.js";
import { success, fail } from "../../utils/response.js";

export async function signupOwner(req, res) {
  try {
    const { first_name, last_name, email, password } = req.validated || req.body;

    const { user, shop, branch, tokens } = await createOwnerAccount({ first_name, last_name, email, password });

    // set refresh token in secure httpOnly cookie
    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days as ms
    });

    // remove sensitive fields
    const safeUser = {
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      role: user.role,
      shop_id: user.shop_id,
      branch_id: user.branch_id,
      is_active: user.is_active,
      created_at: user.created_at,
    };

    return success(res, { user: safeUser, access_token: tokens.accessToken }, "Signup successful", 201);
  } catch (err) {
    if (err.code === "EMAIL_GOOGLE_EXISTS") {
      return fail(res, err.message, 400);
    }
    if (err.code === "EMAIL_EXISTS") {
      return fail(res, err.message, 400);
    }
    console.error("signup error", err);
    return fail(res, "Failed to create account", 500, { error: err.message });
  }
}
