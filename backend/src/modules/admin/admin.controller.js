import { cleanupIncompleteUsers, cleanupOldDeletionLogs } from "../../utils/cleanup.js";
import { success, fail } from "../../utils/response.js";

export async function cleanupUsersController(req, res) {
  try {
    // Only super_admin can run cleanup
    if (req.user.role !== "super_admin") {
      return fail(res, "Unauthorized", 403);
    }

    console.log("🧹 Manual cleanup triggered by:", req.user.user_id);

    const userCleanup = await cleanupIncompleteUsers();
    const logCleanup = await cleanupOldDeletionLogs();

    return success(res, {
      users_deleted: userCleanup.deleted,
      errors: userCleanup.errors,
      old_logs_deleted: logCleanup,
    }, "Cleanup completed");

  } catch (err) {
    console.error(err);
    return fail(res, "Cleanup failed", 500);
  }
}