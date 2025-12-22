// src/api/setup.js
import API from "./axios";

/**
 * Setup API endpoints
 * Handles the post-plan setup wizard backend communication
 */

/**
 * Submit complete setup data
 * Called only at the review step - creates branches, users, and operators in one transaction
 * 
 * @param {Object} data - Setup data
 * @param {Array} data.branches - Array of branch objects
 * @param {Array} data.users - Array of user objects
 * @param {Object} data.operators - Map of branch_temp_id -> operator identifier
 */
export const submitSetup = async (data) => {
  return API.post("/setup/complete", data);
};

/**
 * Validate setup data before submission
 * Optional - can be used to pre-validate on the review page
 */
export const validateSetup = async (data) => {
  return API.post("/setup/validate", data);
};

/**
 * Get setup status
 * Checks if setup is complete for the current shop
 */
export const getSetupStatus = async () => {
  return API.get("/setup/status");
};

/**
 * Check if a phone number is already registered
 * Used for real-time validation when adding users
 */
export const checkPhoneAvailability = async (phone_number) => {
  return API.post("/setup/check-phone", { phone_number });
};

/**
 * Check if a username is available
 * Used for real-time validation when adding users
 */
export const checkUsernameAvailability = async (username) => {
  return API.post("/setup/check-username", { username });
};

// ============================================
// MOCK IMPLEMENTATIONS (for development)
// Remove these when backend is ready
// ============================================

/**
 * Mock: Submit setup
 * Simulates a successful submission
 */
export const mockSubmitSetup = async (data) => {
  console.log("📤 Mock submitSetup called with:", data);
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // Simulate validation
  if (!data.branches || data.branches.length === 0) {
    throw {
      response: {
        data: {
          message: "At least one branch is required",
        },
      },
    };
  }
  
  return {
    data: {
      success: true,
      data: {
        message: "Setup completed successfully",
        branches_created: data.branches.length,
        users_created: data.users.length,
      },
    },
  };
};

/**
 * Mock: Get setup status
 * For development, checks localStorage
 */
export const mockGetSetupStatus = async () => {
  const stored = localStorage.getItem("cureli-setup-storage");
  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      data: {
        success: true,
        data: {
          is_complete: parsed.state?.isSetupComplete || false,
          current_step: parsed.state?.currentStep || 1,
        },
      },
    };
  }
  
  return {
    data: {
      success: true,
      data: {
        is_complete: false,
        current_step: 1,
      },
    },
  };
};

/**
 * Mock: Check phone availability
 */
export const mockCheckPhoneAvailability = async (phone_number) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  // For mock, always return available
  return {
    data: {
      success: true,
      data: {
        available: true,
      },
    },
  };
};

/**
 * Mock: Check username availability
 */
export const mockCheckUsernameAvailability = async (username) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  // For mock, always return available
  return {
    data: {
      success: true,
      data: {
        available: true,
      },
    },
  };
};