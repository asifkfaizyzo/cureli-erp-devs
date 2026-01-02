import { success, fail } from "../../utils/response.js";
import { verifyRecaptcha } from "../../utils/recaptcha.js";
import * as enquiryService from "./enquiries.service.js";

export const submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, message, recaptchaToken } = req.validated;

    if (!name || !email || !message) {
      return fail(res, "Name, email, and message are required", 400);
    }

    // Uncomment for production
    // if (process.env.NODE_ENV === "production") {
    //   if (!recaptchaToken) {
    //     return fail(res, "reCAPTCHA token is required", 400);
    //   }
    //   const isHuman = await verifyRecaptcha(recaptchaToken);
    //   if (!isHuman) {
    //     return fail(res, "reCAPTCHA verification failed", 400);
    //   }
    // }

    const enquiry = await enquiryService.createEnquiry({
      name,
      email,
      phone: phone || null,
      message,
    });

    return success(
      res,
      { enquiry_number: enquiry.enquiry_number },
      "Your enquiry has been submitted successfully!",
      201
    );
  } catch (error) {
    console.error("Submit enquiry error:", error);
    return fail(res, "Failed to submit enquiry. Please try again.", 500);
  }
};

export const listEnquiries = async (req, res) => {
  try {
    const { page, limit, status, search, sortBy, sortOrder } = req.query;

    console.log("📥 List Enquiries Request:", { page, limit, status, search, sortBy, sortOrder });

    const result = await enquiryService.listEnquiries({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      status: status || "ALL",
      search,
      sortBy: sortBy || "created_at",
      sortOrder: sortOrder || "desc",
    });

    console.log("📤 List Enquiries Response:", {
      count: result.enquiries?.length,
      pagination: result.pagination,
    });

    return success(res, result, "Enquiries fetched successfully");
  } catch (error) {
    console.error("❌ List enquiries error:", error);
    return fail(res, "Failed to fetch enquiries", 500);
  }
};

export const getEnquiryStats = async (req, res) => {
  try {
    const stats = await enquiryService.getEnquiryStats();

    console.log("📊 Enquiry Stats:", stats);

    return success(res, { stats }, "Enquiry stats fetched successfully");
  } catch (error) {
    console.error("❌ Get enquiry stats error:", error);
    return fail(res, "Failed to fetch enquiry stats", 500);
  }
};

export const getEnquiryDetails = async (req, res) => {
  try {
    const { enquiryId } = req.validatedParams;

    const enquiry = await enquiryService.getEnquiryById(enquiryId);

    if (!enquiry) {
      return fail(res, "Enquiry not found", 404);
    }

    return success(res, { enquiry }, "Enquiry details fetched successfully");
  } catch (error) {
    console.error("Get enquiry details error:", error);
    return fail(res, "Failed to fetch enquiry details", 500);
  }
};

export const replyToEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.validatedParams;
    const { subject, message } = req.validated;
    const adminId = req.cadmin.cadmin_id;

    const result = await enquiryService.replyToEnquiry(enquiryId, adminId, {
      subject,
      message,
    });

    if (!result.emailSent) {
      return success(
        res,
        { reply: result.reply, emailSent: false },
        `Reply saved but email failed to send: ${result.emailError}`,
        201
      );
    }

    return success(
      res,
      { reply: result.reply, emailSent: true },
      "Reply sent successfully",
      201
    );
  } catch (error) {
    console.error("Reply to enquiry error:", error);
    if (error.message === "Enquiry not found") {
      return fail(res, "Enquiry not found", 404);
    }
    return fail(res, "Failed to send reply", 500);
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const { enquiryId } = req.validatedParams;
    const { status } = req.validated;

    const enquiry = await enquiryService.updateEnquiryStatus(enquiryId, status);

    return success(res, { enquiry }, "Enquiry status updated successfully");
  } catch (error) {
    console.error("Update enquiry status error:", error);
    return fail(res, "Failed to update enquiry status", 500);
  }
};

export const deleteEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.validatedParams;

    await enquiryService.deleteEnquiry(enquiryId);

    return success(res, {}, "Enquiry deleted successfully");
  } catch (error) {
    console.error("Delete enquiry error:", error);
    if (error.message === "Enquiry not found") {
      return fail(res, "Enquiry not found", 404);
    }
    return fail(res, "Failed to delete enquiry", 500);
  }
};