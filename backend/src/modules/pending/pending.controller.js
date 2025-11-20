import { createPendingUser, sendEmailOtp,verifyEmailOtp,setUsername } from "./pending.service.js";
import { success, fail } from "../../utils/response.js";

export async function startPendingSignup(req, res) {
  try {
    const { first_name, last_name, email, password } = req.validated;

    const pending = await createPendingUser({
      first_name,
      last_name,
      email,
      password,
    });

    return success(res, { pending_id: pending.pending_id }, "Signup started");
  } catch (err) {
    if (err.code === "EMAIL_EXISTS") {
      return fail(res, err.message, 400);
    }
    if (err.code === "PENDING_EXISTS") {
      return fail(res, err.message, 400);
    }
    console.error(err);
    return fail(res, "Cannot start signup", 500);
  }
}

export async function requestEmailOtp(req, res) {
  try {
    const { pending_id } = req.body;

    await sendEmailOtp(pending_id);

    return success(res, {}, "OTP sent to email");
  } catch (err) {
    if (err.code === "OTP_COOLDOWN") {
      return fail(res, err.message, 429);
    }
    console.error(err);
    return fail(res, "Failed to send OTP", 500);
  }
}



export async function verifyEmailOtpController(req, res) {
  try {
    const { pending_id, otp } = req.body;

    await verifyEmailOtp(pending_id, otp);

    return success(res, {}, "Email verified successfully");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "NO_OTP") return fail(res, err.message, 400);
    if (err.code === "OTP_EXPIRED") return fail(res, err.message, 400);
    if (err.code === "INVALID_OTP") return fail(res, err.message, 400);

    console.error(err);
    return fail(res, "Failed to verify OTP", 500);
  }
}




export async function chooseUsernameController(req, res) {
  try {
    const { pending_id, username } = req.validated;

    await setUsername(pending_id, username);

    return success(res, {}, "Username saved");
  } catch (err) {
    if (err.code === "NOT_FOUND") return fail(res, err.message, 404);
    if (err.code === "EMAIL_NOT_VERIFIED") return fail(res, err.message, 400);
    if (err.code === "USERNAME_EXISTS") return fail(res, err.message, 400);
    if (err.code === "USERNAME_PENDING_EXISTS") return fail(res, err.message, 400);

    console.error(err);
    return fail(res, "Failed to save username", 500);
  }
}
