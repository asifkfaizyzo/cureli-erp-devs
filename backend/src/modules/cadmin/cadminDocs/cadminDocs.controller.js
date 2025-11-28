import * as svc from "./cadminDocs.service.js";
import prisma from "../../../config/prisma.js";
import { success, fail } from "../../../utils/response.js";

export async function listFilesController(req, res) {
  try {
    const { status, limit = 20, offset = 0, q } = req.query;
    const files = await svc.findFiles({ status, limit, offset, q });
    return success(res, { files });
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to list files", 500);
  }
}

export async function getFileController(req, res) {
  try {
    const { file_id } = req.params;
    const file = await svc.findFileById(file_id);
    if (!file) return fail(res, "File not found", 404);

    const logs = await prisma.fileVerificationLog.findMany({
      where: { file_id },
      orderBy: { created_at: "desc" },
    });

    return success(res, { file, logs });
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to fetch file", 500);
  }
}

export async function verifyFileController(req, res) {
  try {
    const cadmin_id = req.admin.cadmin_id;
    const { file_id } = req.params;

    const file = await svc.markVerified({ file_id, cadmin_id });

    return success(res, { file }, "File verified");
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to verify file", 500);
  }
}

export async function rejectFileController(req, res) {
  try {
    const cadmin_id = req.admin.cadmin_id;
    const { file_id } = req.params;
    const { reason } = req.validated;

    if (!reason || !reason.trim()) return fail(res, "Reason required", 400);

    const file = await svc.markRejected({ file_id, cadmin_id, reason });

    return success(res, { file }, "File rejected");
  } catch (err) {
    console.error(err);
    return fail(res, "Failed to reject file", 500);
  }
}
