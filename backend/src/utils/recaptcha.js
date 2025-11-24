import axios from "axios";

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/**
 * Verify reCAPTCHA v3 token
 * @param {string} token - Token from frontend
 * @returns {Promise<{success: boolean, score: number, action: string}>}
 */
export async function verifyRecaptcha(token) {
  try {
    const response = await axios.post(
      RECAPTCHA_VERIFY_URL,
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET,
          response: token,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("reCAPTCHA verification error:", err);
    throw new Error("Failed to verify reCAPTCHA");
  }
}

/**
 * Check if score passes threshold
 * @param {number} score - Score from Google (0.0 to 1.0)
 * @param {number} threshold - Minimum required score (default 0.3)
 * @returns {boolean}
 */
export function isRecaptchaScoreValid(score, threshold = 0.3) {
  return score >= threshold;
}