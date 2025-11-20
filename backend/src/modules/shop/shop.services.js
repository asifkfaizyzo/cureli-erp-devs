import prisma from "../../config/prisma.js";

export async function setupShop(req, res) {
  const user = req.user; // from requireAuth
  const data = req.validated;

  if (user.status !== "pending_setup") {
    return res.status(400).json({ success: false, message: "Shop already created." });
  }

  const result = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        owner_user_id: user.user_id,
        ...data,
        verification_status: "pending",
      },
    });

    const branch = await tx.branch.create({
      data: {
        shop_id: shop.shop_id,
        branch_name: `${data.business_name} (Main Branch)`,
        branch_type: "main",
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2 || "",
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        contact_number: "Not provided",
        branch_seat_limit: 3,
      },
    });

    const updatedUser = await tx.user.update({
      where: { user_id: user.user_id },
      data: {
        shop_id: shop.shop_id,
        branch_id: branch.branch_id,
        status: "active",
      },
    });

    return { shop, branch, updatedUser };
  });

  return res.status(201).json({
    success: true,
    message: "Shop setup completed",
    data: result,
  });
}
