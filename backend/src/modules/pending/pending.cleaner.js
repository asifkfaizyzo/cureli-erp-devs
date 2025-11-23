import prisma from "../../config/prisma.js";

export async function cleanupExpiredPendingUsers() {
  const cutoff = new Date(Date.now() - 1 * 60 * 1000); // 10 min

  await prisma.pendingUser.deleteMany({
    where: {
      created_at: { lt: cutoff },
    },
  });
}
