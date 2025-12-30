// backend/src/utils/recaptcha.js

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_THRESHOLD = 0.5; // Score threshold (0.0 - 1.0)

/**
 * Verify reCAPTCHA v3 token and check score
 * @param {string} token - The reCAPTCHA token from frontend
 * @param {string|null} expectedAction - Optional action name to verify
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
export async function verifyRecaptcha(token, expectedAction = null) {
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.error("reCAPTCHA verification failed:", data["error-codes"]);
      return false;
    }

    // For v3: Check score
    if (typeof data.score === "number" && data.score < RECAPTCHA_THRESHOLD) {
      console.warn(`reCAPTCHA score too low: ${data.score}`);
      return false;
    }

    // Optionally verify action matches
    if (expectedAction && data.action !== expectedAction) {
      console.warn(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

/**
 * Verify reCAPTCHA and return score validation result
 * (Existing function - keep for backward compatibility)
 * @param {string} token - The reCAPTCHA token from frontend
 * @returns {Promise<{success: boolean, score?: number, error?: string}>}
 */
export async function isRecaptchaScoreValid(token) {
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data["error-codes"]?.join(", ") || "Verification failed",
      };
    }

    const isValid = typeof data.score === "number" 
      ? data.score >= RECAPTCHA_THRESHOLD 
      : true;

    return {
      success: isValid,
      score: data.score,
      error: isValid ? null : "Score too low",
    };
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Simple reCAPTCHA verification (returns boolean)
 * Alias for verifyRecaptcha for simpler use cases
 */
export const validateRecaptcha = verifyRecaptcha;