import { success, fail } from "../../../utils/response.js";
import { getAllUsersService } from "./cadminUser.service.js";

export async function getAllUsersController(req, res) {
  try {
    const users = await getAllUsersService();
    return success(res, users);
  } catch (err) {
    console.error("cadmin.getAllUsers", err);
    return fail(res, "Failed to fetch users", 500);
  }
}
