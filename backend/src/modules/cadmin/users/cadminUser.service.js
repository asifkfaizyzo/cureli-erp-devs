import prisma from "../../../config/prisma.js";

export async function getAllUsersService() {
  const users = await prisma.user.findMany({
    select: {
      user_id: true,
      full_name: true,
      username: true,
      email: true,
      role: true,
      is_active: true,
      last_login_at: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" }, // newest first
  });

  // Format for frontend expectations
  return users.map((u) => ({
    id: u.user_id,
    name: u.full_name,
    username: u.username,
    email: u.email,
    role: formatRole(u.role),
    is_active: u.is_active,
    lastLogin: u.last_login_at ? formatDate(u.last_login_at) : "Never",
    created_at: u.created_at,
  }));
}

// convert DB role to UI label
function formatRole(role) {
  switch (role) {
    case "super_admin": return "Super Admin";
    case "branch_admin": return "Branch Admin";
    default: return "Staff";
  }
}

function formatDate(date) {
  const dt = new Date(date);
  const day = dt.getDate().toString().padStart(2, "0");
  const month = (dt.getMonth() + 1).toString().padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}
