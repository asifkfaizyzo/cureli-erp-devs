import { success, fail } from "../../../utils/response.js";
import {
  requestCAdminPasswordReset,
  resetCAdminPassword,
} from "./cadminPassword.service.js";

export async function forgotCAdminPasswordController(req, res) {
  try {
    const { email } = req.validated;

    await requestCAdminPasswordReset(email);

    return success(
      res,
      {},
      "If that email exists, a reset link has been sent."
    );
  } catch (err) {
    console.error("cadmin.forgot-password", err);
    return fail(res, "Failed to process request", 500);
  }
}

export async function resetCAdminPasswordController(req, res) {
  try {
    const { token, password } = req.validated;

    await resetCAdminPassword(token, password);

    return success(res, {}, "Password reset successful.");
  } catch (err) {
    if (err.code === "INVALID_TOKEN") {
      return fail(res, err.message, 400);
    }
    console.error("cadmin.reset-password", err);
    return fail(res, "Failed to reset password", 500);
  }
}
